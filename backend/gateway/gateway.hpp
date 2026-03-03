#ifndef EXCHANGE_GATEWAY_HPP
#define EXCHANGE_GATEWAY_HPP

#include <atomic>
#include <vector>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <stdexcept>
#include <cstring>

namespace Exchange
{
  class Gateway
  {
  public:

    Gateway(int port) 
      : port(port), server_fd(-1), running(false)
    {
      client_threads.reserve(100);
      std::cout << "Gateway initialized on port " << port << '\n';
    }

    ~Gateway() = default;

    void start()
    {
      setupSocket();
      running = true;

      while (running) {
        
      }
    }

    void stop();

  private:

    void handleClient(int client_socket);

    void setupSocket()
    {
      // AF_INET (IPv4), SOCK_STREAM (TCP)
      server_fd = socket(AF_INET, SOCK_STREAM, 0);

      if (server_fd == 0) {
        throw std::runtime_error("Socket failed!");
      }

      // if the gateway crashes or restarts, immediately reclaim same port, otherwise OS puts it in TIME_WAIT (60s)
      int opt = 1;
      setsocketopt(server_fd, SOL_SOCKET, SO_RESUSEADDR | SO_REUSEPORT, &opt, sizeof(opt));
      
      sockaddr_in address;
      
    }

    int port;
    int server_fd;
    std::atomic<bool> running;

    std::vector<std::thread> client_threads;

  };
}

#endif // ! EXCHANGE_GATEWAY_HPP
