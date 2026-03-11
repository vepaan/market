#ifndef EXCHANGE_MARKET_DATA_PUBLISHER_HPP
#define EXCHANGE_MARKET_DATA_PUBLISHER_HPP

#include "protocol.h"
#include <string>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <iostream>
#include <cstring>
#include <unistd.h>

namespace Exchange
{
    class MarketDataPublisher
    {
    public:

        MarketDataPublisher(const std::string& multicast_ip, int port) 
        : mcast_ip(multicast_ip), mcast_port(port), udp_socket(-1)
        {
            setupUDPSocket();
        }

        MarketDataPublisher(const MarketDataPublisher&) = delete;
        MarketDataPublisher& operator=(const MarketDataPublisher&) = delete;

        virtual ~MarketDataPublisher() noexcept
        {
            if (udp_socket >= 0) {
                ::close(udp_socket);
                udp_socket = -1;
            }
        }

        virtual void publish(const MarketUpdate& update)
        {
            ssize_t sent = sendto(udp_socket,
                                  reinterpret_cast<const char*>(&update),
                                  sizeof(MarketUpdate),
                                  0,
                                  (struct sockaddr*)&dest_addr,
                                  sizeof(dest_addr));

            if (sent < 0) {
                std::cerr << "[PUBLISHER] Failed to broadcast update\n";
            }
        }

    private:

        void setupUDPSocket()
        {
            // SOCK_DRGAM indicates UDP
            udp_socket = socket(AF_INET, SOCK_DGRAM, 0);

            if (udp_socket < 0) {
                throw std::runtime_error("Failed to create UDP socket");
            }

            std::memset(&dest_addr, 0, sizeof(dest_addr));
            dest_addr.sin_family = AF_INET;
            dest_addr.sin_port = htons(mcast_port);

            // convert ip (127.0.0.1 for local and 239.0.0.1 for multicast)
            if (inet_pton(AF_INET, mcast_ip.c_str(), &dest_addr.sin_addr) <= 0) {
                throw std::runtime_error("Invalid multicast IP: " + mcast_ip);
            }
        }

        std::string mcast_ip;
        int mcast_port;
        int udp_socket;
        sockaddr_in dest_addr;

    };
}

#endif