#include "bot.hpp"
#include <iostream>
#include <chrono>
#include <thread>

int main()
{
    try {
        Exchange::Bot liquidityBot(1, 100000.0);

        std::cout << "[BOT] Connecting to Gateway at 127.0.0.1:8080..." << std::endl;
        
        liquidityBot.connectToGateway("127.0.0.1", 8080);
        
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