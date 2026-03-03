#include "bot.hpp"
#include "env-config.hpp"
#include <iostream>
#include <chrono>
#include <thread>

int main()
{
    try {
        Exchange::loadDotEnv();
        const std::string gatewayHost = Exchange::getEnvString("EXCHANGE_GATEWAY_HOST", "127.0.0.1");
        const int gatewayPort = Exchange::getEnvInt("EXCHANGE_GATEWAY_PORT", 8080);

        Exchange::Bot liquidityBot(1, 100000.0);

        std::cout << "[BOT] Connecting to Gateway at " << gatewayHost << ":" << gatewayPort << "..." << std::endl;
        
        liquidityBot.connectToGateway(gatewayHost, gatewayPort);
        
        std::cout << "[BOT] Connected! Starting trade loop..." << std::endl;

        // replace with real udp listener
        while (true) {
            Exchange::MarketUpdate mockUpdate;
            mockUpdate.tickerId = 1;
            mockUpdate.price = 149.20;
            mockUpdate.volume = 10;
            mockUpdate.side = 'B';

            liquidityBot.onMarketUpdate(mockUpdate);

            // sleep so we dont flood console
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }

    } catch (const std::exception& e) {
        std::cerr << "[BOT ERROR] " << e.what() << std::endl;
        return 1;
    }

    return 0;
}