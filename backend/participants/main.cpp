#include "market-maker.hpp"
#include "env-config.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main()
{
    try {
        Exchange::loadDotEnv();
        const std::string gatewayHost = Exchange::getEnvString("EXCHANGE_GATEWAY_HOST", "127.0.0.1");
        const int gatewayPort = Exchange::getEnvInt("EXCHANGE_GATEWAY_PORT", 8080);
        const int udpPort = Exchange::getEnvInt("UDP_BROADCAST_PORT", 9000);

        Exchange::MarketMakerBot liquidityBot(1, 100000.0);

        // Set up UDP multicast listener BEFORE connecting to TCP gateway.
        // Connecting to the gateway triggers market seeding, so the bot must
        // already be subscribed on UDP or it will miss the seed packets.
        int udp_fd = socket(AF_INET, SOCK_DGRAM, 0);

        if (udp_fd < 0) {
            throw std::runtime_error("Socket creation failed");
        }

        int reuse = 1;
        setsockopt(udp_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY; // listen on all interfaces
        addr.sin_port = htons(udpPort);

        if (bind(udp_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
            throw std::runtime_error("UDP Bind failed");
        }

        // join multicast group so this socket receives packets sent to 239.0.0.1
        const std::string mcastGroup = Exchange::getEnvString("UDP_BROADCAST_HOST", "239.0.0.1");
        struct ip_mreq mreq{};
        inet_pton(AF_INET, mcastGroup.c_str(), &mreq.imr_multiaddr);
        mreq.imr_interface.s_addr = INADDR_ANY;
        if (setsockopt(udp_fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq)) < 0) {
            throw std::runtime_error("Failed to join multicast group");
        }

        std::cout << "[BOT] Connecting to Gateway at " << gatewayHost << ":" << gatewayPort << "...\n";

        liquidityBot.connectToGateway(gatewayHost, gatewayPort);

        std::cout << "[BOT] Connected! Waiting for Market Seed on port " << udpPort << "...\n";

        Exchange::MarketUpdate update;

        while (true) {
            // recvfrom is a blocking call. 
            // The bot will sit here silently until the Exchange seeds the market.
            ssize_t bytes = recvfrom(udp_fd, &update, sizeof(Exchange::MarketUpdate), 0, nullptr, nullptr);

            if (bytes == sizeof(Exchange::MarketUpdate)) {
                liquidityBot.onMarketUpdate(update);
            }

            // sleep so we dont flood console
            // std::this_thread::sleep_for(std::chrono::seconds(1));
        }

    } catch (const std::exception& e) {
        std::cerr << "[BOT ERROR] " << e.what() << std::endl;
        return 1;
    }

    return 0;
}