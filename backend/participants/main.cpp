#include "market-maker.hpp"
#include "directional-bot.hpp"
#include "env-config.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <variant>
#include <vector>
#include <random>

using namespace Exchange;

using BotVariant = std::variant<MarketMakerBot, DirectionalBot>;

int main()
{
    try {
        Exchange::loadDotEnv();
        const std::string gatewayHost = Exchange::getEnvString("EXCHANGE_GATEWAY_HOST", "127.0.0.1");
        const int gatewayPort = Exchange::getEnvInt("EXCHANGE_GATEWAY_PORT", 8080);
        const int udpPort = Exchange::getEnvInt("UDP_BROADCAST_PORT", 9000);

        std::vector<BotVariant> bot_pool;

        std::random_device rd;
        std::mt19937 rng(rd());
        std::uniform_real_distribution<double> balance_dist(50000.0, 200000.0);
        std::uniform_real_distribution<double> risk_dist(0.005, 0.03);
        std::uniform_real_distribution<double> agg_dist(0.05, 0.50);
        std::uniform_int_distribution<uint32_t> vol_dist(10, 200);

        uint32_t current_id = 1;

        // spawn 10 market makers
        for (int i=0; i<10; ++i) {
            bot_pool.emplace_back(MarketMakerBot(
                current_id++,
                balance_dist(rng),
                risk_dist(rng),
                0.20,
                vol_dist(rng)
            ));
        }

        // spwan 15 bulls
        for (int i=0; i<15; ++i) {
            bot_pool.emplace_back(DirectionalBot(
                current_id++, 
                balance_dist(rng), 
                Bias::BULL, 
                agg_dist(rng), 
                vol_dist(rng)
            ));
        }

        // spwan 15 bears
        for (int i=0; i<15; ++i) {
            bot_pool.emplace_back(DirectionalBot(
                current_id++, 
                balance_dist(rng), 
                Bias::BEAR, 
                agg_dist(rng), 
                vol_dist(rng)
            ));
        }

        std::cout << "[SYSTEM] Spawned " << bot_pool.size() << " bots. Connecting to Gateway...\n";

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

        // connect all bots to gateway
        for (auto& b: bot_pool) {
            // visit unwraps variant and calls correct method @ compile time
            std::visit([&](auto& bot) {
                bot.connectToGateway(gatewayHost, gatewayPort);
            }, b);
        }

        std::cout << "[SYSTEM] All bots connected. Awaiting Market Seed...\n";

        Exchange::MarketUpdate update;

        while (true) {
            // recvfrom is a blocking call. 
            // The bot will sit here silently until the Exchange seeds the market.
            ssize_t bytes = recvfrom(udp_fd, &update, sizeof(Exchange::MarketUpdate), 0, nullptr, nullptr);

            if (bytes == sizeof(Exchange::MarketUpdate)) {
                // Multicast the tape update to every single bot in the pool
                for (auto& b : bot_pool) {
                    std::visit([&](auto& bot) { 
                        bot.onMarketUpdate(update); 
                    }, b);
                }
            }

            // sleep so we dont flood console
            // std::this_thread::sleep_for(std::chrono::seconds(1));
        }

    } catch (const std::exception& e) {
        std::cerr << "[BOT BUILD ERROR] " << e.what() << std::endl;
        return 1;
    }

    return 0;
}