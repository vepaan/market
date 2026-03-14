#ifndef EXCHANGE_PARTICIPANT_HPP
#define EXCHANGE_PARTICIPANT_HPP

#include "protocol.h"
#include <string>
#include <map>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdexcept>
#include <cstring>

namespace Exchange
{
    template <typename T>
    class Participant
    {
    public:

        Participant(uint32_t id, double balance) : clientId(id), tcp_socket(-1), balance(balance) {}

        void connectToGateway(const std::string& ip, int port) 
        {
            // AF_INET: IPv4, SOCK_STREAM: TCP
            tcp_socket = socket(AF_INET, SOCK_STREAM, 0);
            if (tcp_socket == -1) {
                throw std::runtime_error("Failed to create TCP Socket");
            }

            sockaddr_in server_addr;
            std::memset(&server_addr, 0, sizeof(server_addr)); // fill server_addr by 0 for full size
            server_addr.sin_family = AF_INET;
            server_addr.sin_port = htons(port); // convert port to network byte order (big endian)

            // convert string ip to binary
            if (inet_pton(AF_INET, ip.c_str(), &server_addr.sin_addr) <= 0) {
                close(tcp_socket);
                throw std::runtime_error("Invalid IP address format: " + ip);
            }

            if (connect(tcp_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
                close(tcp_socket);
                throw std::runtime_error("Connection to gateway failed on " + ip + ":" + std::to_string(port));
            }
        }

        void sendOrder(const OrderRequest& order) 
        {
            if (tcp_socket == -1) {
                throw std::runtime_error("Cannot send order: TCP not connected");
            }

            const char* buffer = reinterpret_cast<const char*>(&order);
            size_t total_size = sizeof(OrderRequest);

            // MSG_NOSIGNAL: prevents SIGPIPE from killing the process on a broken connection
            ssize_t bytes_sent = send(tcp_socket, buffer, total_size, MSG_NOSIGNAL);

            if (bytes_sent < 0) {
                throw std::runtime_error("Failed to send order through socket");
            }

            if (static_cast<size_t>(bytes_sent) < total_size) {
                throw std::runtime_error("Partial order data sent through socket");
            }
        }

        void onMarketUpdate(const MarketUpdate& update)
        {
            static_cast<T*>(this)->onMarketUpdateImpl(update);
        }

        void onExecution(const MarketUpdate& update)
        {
            static_cast<T*>(this)->onExecutionImpl(update);
        }

    protected:

        uint32_t clientId;
        int tcp_socket;

        double balance;
        // Used instead of std::unordered_map for consistent performance as 
        // unord map has hash collisions causing unexpected latency spikes
        std::map<uint32_t, uint32_t> holdings;

    };
}

#endif