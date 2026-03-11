#ifndef EXCHANGE_GATEWAY_HPP
#define EXCHANGE_GATEWAY_HPP

#include <atomic>
#include <vector>
#include <thread>
#include <sys/socket.h>
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
  class Gateway
  {
  public:

    Gateway(int port, Exchange::LFQueue<Exchange::OrderRequest>* order_queue) 
      : port(port), server_fd(-1), running(false), order_queue(order_queue), active_connections(0)
    {
      client_threads.reserve(100);
      std::cout << "Gateway initialized on port " << port << '\n';
    }

    ~Gateway() = default;

    void start()
    {
      setupSocket();
      running = true;

      // Make server_fd non-blocking so accept() doesn't block forever.
      // Using O_NONBLOCK instead of SO_RCVTIMEO because SO_RCVTIMEO is
      // inherited by accepted client sockets, which would cause recv() to
      // time out on active connections.
      fcntl(server_fd, F_SETFL, O_NONBLOCK);

      while (running) {
        sockaddr_in client_addr;
        socklen_t addrlen = sizeof(client_addr);

        // blocks until participant connects
        int client_socket = accept(server_fd, (struct sockaddr*)&client_addr, &addrlen);

        if (client_socket >= 0) {
          client_threads.emplace_back(&Exchange::Gateway::handleClient, this, client_socket);
        } else if (errno == EWOULDBLOCK || errno == EAGAIN) {
          // this means no connection within 100ms timeout
          continue;
        }
      }
    }

    void stop()
    {
      running = false;
      close(server_fd);

      for (auto& t: client_threads) {
        if (t.joinable()) t.join();
      }
    }

    int getActiveConnectionCount()
    {
      return active_connections.load();
    }

  private:

    void handleClient(int client_socket)
    {
      active_connections++;
      char buffer[sizeof(OrderRequest)];

      while (running) {
        ssize_t bytes_read = recv(client_socket, buffer, sizeof(OrderRequest), MSG_WAITALL);

        if (bytes_read <= 0) {
          // err
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

      close(client_socket);
      active_connections--;
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
      
      sockaddr_in address;
      address.sin_family = AF_INET;
      address.sin_addr.s_addr = INADDR_ANY; // listen to all available interfaces
      address.sin_port = htons(port);

      // claim port from os
      if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        throw std::runtime_error("Bind failed.");
      }

      // 5 is backlog
      if (listen(server_fd, 5) < 0) {
        throw std::runtime_error("Listen failed.");
      }

      std::cout << "Socket setup sucess!\n";
    }

    int port;
    int server_fd;
    std::atomic<bool> running;

    std::vector<std::thread> client_threads;

    Exchange::LFQueue<Exchange::OrderRequest>* order_queue;

    std::atomic<int> active_connections;

  };
}

#endif // ! EXCHANGE_GATEWAY_HPP
