#ifndef EXCHANGE_GATEWAY_HPP
#define EXCHANGE_GATEWAY_HPP

#include <atomic>
#include <vector>
#include <thread>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <unistd.h>
#include <fcntl.h>
#include <cstring>
#include <iostream>
#include "protocol.h"
#include "market-data-publisher.hpp"
#include "lf-queue.hpp"

namespace Exchange
{
  constexpr int MAX_EVENTS = 1024; // for epoll

  class Gateway
  {
  public:

    Gateway(int port, Exchange::LFQueue<Exchange::OrderRequest>* order_queue) 
      : port(port), server_fd(-1), epoll_fd(-1), running(false), order_queue(order_queue), active_connections(0)
    {
      std::cout << "Gateway initialized on port " << port << '\n';
    }

    ~Gateway()
    {
      stop();
    }

    void start()
    {
      setupSocket();
      setupEpoll();

      running = true;
      gateway_thread = std::thread(&Gateway::runEpollLoop, this);
    }

    void stop()
    {
      running = false;

      if (gateway_thread.joinable()) gateway_thread.join();
      if (server_fd >= 0) close(server_fd);
      if (epoll_fd >= 0) close(epoll_fd);
    }

    int getActiveConnectionCount()
    {
      return active_connections.load();
    }

  private:

    void runEpollLoop()
    {
      struct epoll_event events[MAX_EVENTS];

      while (running) {
        // blocks until at least one socket has activity. 100 ms timeout to check running flag
        int num_events = epoll_wait(epoll_fd, events, MAX_EVENTS, 100);

        for (int i=0; i<num_events; ++i) {
          if (events[i].data.fd == server_fd) {
            // server has activity and new bot is connecting
            acceptNewConnections();
          } else {
            // client socket has activity, bot sent order or disconnected
            handleClientData(events[i].data.fd);
          }
        }
      }
    }

    void acceptNewConnections()
    {
      while (true) {
        sockaddr_in client_addr;
        socklen_t addrlen = sizeof(client_addr);
        int client_socket = accept(server_fd, (struct sockaddr*)&client_addr, &addrlen);

        if (client_socket < 0) {
          // eagain means we accepted all pending connections
          if (errno == EAGAIN || errno == EWOULDBLOCK) break;
          else {
            std::cerr << "[GATEWAY] Accept failed.\n";
            break;
          }
        }

        // make new client socket non blocking
        int flags = fcntl(client_socket, F_GETFL, 0);
        fcntl(client_socket, F_SETFL, flags | O_NONBLOCK);

        // register new client socket with epoll instance
        struct epoll_event event;
        event.events = EPOLLIN | EPOLLET; // read operations and edge triggered
        event.data.fd = client_socket;

        if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_socket, &event) == -1) {
            std::cerr << "[GATEWAY] Failed to add client to epoll.\n";
            close(client_socket);
        } else {
            active_connections++;
            std::cout << "[GATEWAY] Bot connected. Active bots: " << active_connections << '\n';
        }
      }
    }

    void handleClientData(int client_socket)
    {
      char buffer[sizeof(OrderRequest)];

      while (running) {
        ssize_t bytes_read = recv(client_socket, buffer, sizeof(OrderRequest), MSG_WAITALL);

        if (bytes_read <= 0) {
          if (errno == EAGAIN || errno == EWOULDBLOCK) {
              // We've read all available data for now
              break;
          }
          // If bytes_read == 0, the client disconnected gracefully. If < 0, an error occurred.
          close(client_socket); // Closing the fd automatically removes it from epoll
          active_connections--;
          std::cout << "[GATEWAY] Bot disconnected. Active bots: " << active_connections << '\n';
          break;
        }

        if (static_cast<size_t>(bytes_read) == sizeof(OrderRequest)) {
          // cast raw mem back to struct
          OrderRequest* req = reinterpret_cast<OrderRequest*>(buffer);

          if (order_queue->push(*req)) {
            std::cout << "[GATEWAY] Order Received & Queued | Ticker: " << req->tickerId 
                      << " | Price: " << req->price << '\n';
          } else {
            std::cerr << "[GATEWAY ERROR] Order queue full! Dropping order from Client " 
                          << req->clientId << '\n';
          }
        }
      }
    }

    void setupSocket()
    {
      // AF_INET (IPv4), SOCK_STREAM (TCP)
      server_fd = socket(AF_INET, SOCK_STREAM, 0);

      if (server_fd == 0) {
        throw std::runtime_error("Socket failed!");
      }

      // if the gateway crashes or restarts, immediately reclaim same port, otherwise OS puts it in TIME_WAIT (60s)
      int opt = 1;
      setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt));

      // make server socket non blocking
      int flags = fcntl(server_fd, F_GETFL, 0);
      fcntl(server_fd, F_SETFL, flags | O_NONBLOCK);
      
      sockaddr_in address;
      address.sin_family = AF_INET;
      address.sin_addr.s_addr = INADDR_ANY; // listen to all available interfaces
      address.sin_port = htons(port);

      // claim port from os
      if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        throw std::runtime_error("Bind failed.");
      }

      // max os backlog
      if (listen(server_fd, SOMAXCONN) < 0) {
        throw std::runtime_error("Listen failed.");
      }

      std::cout << "Socket setup sucess!\n";
    }

    void setupEpoll()
    {
      epoll_fd = epoll_create1(0);

      if (epoll_fd == -1) {
        throw std::runtime_error("Failed to create epoll file descriptor");
      }

      struct epoll_event event;
      event.events = EPOLLIN | EPOLLET; // montior for incoming data
      event.data.fd = server_fd;

      if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_fd, &event) == -1) {
        throw std::runtime_error("Failed to add server socket to epoll");
      }
    }

    int port;
    int server_fd;
    int epoll_fd;
    std::atomic<bool> running;

    std::thread gateway_thread;
    Exchange::LFQueue<Exchange::OrderRequest>* order_queue;
    std::atomic<int> active_connections;

  };
}

#endif // ! EXCHANGE_GATEWAY_HPP
