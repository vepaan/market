#ifndef EXCHANGE_MATCHING_ENGINE_HPP
#define EXCHANGE_MATCHING_ENGINE_HPP

#include "order-book.hpp"
#include "env-config.hpp"
#include "market-data-publisher.hpp"
#include <vector>
#include <unordered_map>

namespace Exchange
{
    class MatchingEngine
    {
    public:

        MatchingEngine(Exchange::MarketDataPublisher* publisher)
          :  publisher(publisher)
        {
            Exchange::loadDotEnv();
            const int NUM_TICKERS = Exchange::getEnvInt("NUM_TICKERS", 100);

            for (int i=0; i<NUM_TICKERS; ++i) books[i] = OrderBook();
        }

        void handleOrder(const OrderRequest& req)
        {
            std::vector<MarketUpdate> trades = books[req.tickerId].processOrder(req);
            
            for (const auto& trade: trades) publisher->publish(trade);
        }

    private:

        std::unordered_map<uint32_t, OrderBook> books;
        Exchange::MarketDataPublisher* publisher;

    };
}

#endif