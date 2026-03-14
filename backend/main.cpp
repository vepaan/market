#include "gateway.hpp"
#include "env-config.hpp"
#include "matching-engine.hpp"
#include "lf-queue.hpp"
#include <iostream>
#include <csignal>
#include <memory>
#include <chrono>
#include <thread>

std::atomic<bool> keep_running{true};

void sigint_handler(int)
{
    std::cout << "\n[SYSTEM] Shutdown signal received. Closing exchange...\n";
    keep_running = false;
}

class ExchangeOrchestrator
{
public:

    ExchangeOrchestrator()
    {
        Exchange::loadDotEnv();
        const int GATEWAY_PORT = Exchange::getEnvInt("EXCHANGE_GATEWAY_PORT", 8080);
        const std::string UDP_HOST = Exchange::getEnvString("UDP_BROADCAST_HOST", "127.0.0.1");
        const int UDP_PORT = Exchange::getEnvInt("UDP_BROADCAST_PORT", 9000);
        const int QUEUE_SIZE = static_cast<std::size_t>(Exchange::getEnvInt("QUEUE_SIZE", 65534));

        order_queue = std::make_unique<Exchange::LFQueue<Exchange::OrderRequest>>(QUEUE_SIZE);
        publisher = std::make_unique<Exchange::MarketDataPublisher>(UDP_HOST, UDP_PORT);
        gateway = std::make_unique<Exchange::Gateway>(GATEWAY_PORT, order_queue.get());
        engine = std::make_unique<Exchange::MatchingEngine>(publisher.get(), order_queue.get());
    }

    void launch()
    {
        std::cout << "[SYSTEM] Starting Matching Engine...\n";
        engine->start();

        std::cout << "[SYSTEM] Starting Gateway (Awaiting first bot...)\n";

        // wait for first connection before seeding
        std::thread monitor_thread(&ExchangeOrchestrator::monitorAndSeed, this);

        gateway->start();
        monitor_thread.join();

        std::cout << "[SYSTEM] Exchange fully operational. Press CTRL+C to stop.\n";

        // Park the main thread here so the program doesn't exit
        while (keep_running) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }

        gateway->stop();
        engine->stop();
    }

private:

    void monitorAndSeed()
    {
        // busy wait until gateway report atleast one active connection
        while (gateway->getActiveConnectionCount() == 0 && keep_running) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }

        if (!keep_running) return;

        std::cout << "[SYSTEM] First bot detected. Seeding initial market prices...\n";
        seedMarket();
    }

    void seedMarket()
    {
        int num_tickers = Exchange::getEnvInt("NUM_TICKERS", 100);

        for (int i=0; i<num_tickers; ++i) {
            // seed the market by sending an update so bots can react and give liquidity
            Exchange::MarketUpdate seed;
            seed.tickerId = i;
            seed.price = 100.0; // default for now later have to query for close price
            seed.volume = 0;
            seed.side = 'S'; // 'S' for Seed/Status update
            seed.timestamp = Exchange::getCurrentNanos();

            publisher->publish(seed);
        }

        std::cout << "[SYSTEM] Seeded " << num_tickers << " tickers.\n";
    }

    std::unique_ptr<Exchange::LFQueue<Exchange::OrderRequest>> order_queue;
    std::unique_ptr<Exchange::MarketDataPublisher> publisher;
    std::unique_ptr<Exchange::MatchingEngine> engine;
    std::unique_ptr<Exchange::Gateway> gateway;
    
};

int main()
{
    std::signal(SIGINT, sigint_handler);

    ExchangeOrchestrator server;
    server.launch();

    std::cout << "[SYSTEM] Exchange stopped cleanly.\n";
    return 0;
}