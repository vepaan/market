#ifndef EXCHANGE_MATCHING_ENGINE_HPP
#define EXCHANGE_MATCHING_ENGINE_HPP

#include "order-book.hpp"
#include "env-config.hpp"
#include "market-data-publisher.hpp"
#include "lf-queue.hpp"
#include <vector>
#include <unordered_map>
#include <thread>
#include <atomic>

namespace Exchange
{
    class MatchingEngine
    {
    public:

        MatchingEngine(Exchange::MarketDataPublisher* publisher, Exchange::LFQueue<Exchange::OrderRequest>* order_queue)
          :  publisher(publisher), order_queue(order_queue), running(false)
        {
            Exchange::loadDotEnv();
            const int NUM_TICKERS = Exchange::getEnvInt("NUM_TICKERS", 100);

            for (int i=0; i<NUM_TICKERS; ++i) books[i] = OrderBook();
        }

        void start()
        {
            running = true;
            engine_thread = std::thread(&MatchingEngine::run, this);
        }

        void stop()
        {
            running = false;
            if (engine_thread.joinable()) {
                engine_thread.join();
            }
        }

    private:

        void run()
        {
            Exchange::OrderRequest req;
            
            while (running) {
                if (order_queue->pop(req)) {
                    handleOrder(req);
                }
            }
        }

        void handleOrder(const OrderRequest& req)
        {
            std::vector<MarketUpdate> trades = books[req.tickerId].processOrder(req);
            
            for (const auto& trade: trades) {
                publisher->publish(trade);
            }
        }

        std::unordered_map<uint32_t, OrderBook> books;

        Exchange::MarketDataPublisher* publisher;

        Exchange::LFQueue<Exchange::OrderRequest>* order_queue;

        std::atomic<bool> running;

        std::thread engine_thread;

    };
}

#endif