#ifndef EXCHANGE_ORDERBOOK_HPP
#define EXCHANGE_ORDERBOOK_HPP

#include "protocol.h"
#include <map>
#include <list>
#include <vector>

namespace Exchange
{
    struct Order
    {
        // maintain price-time priority
        uint32_t clientId;
        uint32_t clientOrderId;
        double price;
        uint32_t volume;
    };

    class OrderBook
    {
    public:

        std::vector<MarketUpdate> processOrder(const OrderRequest& req)
        {
            if (req.side == 'B') return matchBid(req);
            else return matchAsk(req);
        }

    private:

        std::map<double, std::list<Order>, std::greater<double>> bids;
        std::map<double, std::list<Order>> asks;

        std::vector<MarketUpdate> matchBid(const OrderRequest& req)
        {
            std::vector<MarketUpdate> trades;
            uint32_t remainingVol = req.volume;

            while (remainingVol > 0 && !asks.empty()) {
                auto bestAskIt = asks.begin();
                if (req.price < bestAskIt->first) break; // no matches possible

                auto& orderList = bestAskIt->second;

                while (remainingVol > 0 && !orderList.empty()) {
                    Order& matchingOrder = orderList.front();
                    uint32_t matchVol = std::min(remainingVol, matchingOrder.volume);

                    MarketUpdate trade;
                    trade.tickerId = req.tickerId;
                    trade.price = bestAskIt->first; // Trade happens at the sitting order's price
                    trade.volume = matchVol;
                    trade.side = 'T';
                    trade.timestamp = getCurrentNanos();

                    trades.push_back(trade);

                    remainingVol -= matchVol;
                    matchingOrder.volume -= matchVol;

                    if (matchingOrder.volume == 0) orderList.pop_front();
                }

                if (orderList.empty()) asks.erase(bestAskIt);
            }

            // if more volume left add to bids (limit) and emit a book update
            if (remainingVol > 0) {
                bids[req.price].push_back({req.clientId, req.clientOrderId, req.price, remainingVol});

                MarketUpdate bookUpdate;
                bookUpdate.tickerId = req.tickerId;
                bookUpdate.price = req.price;
                bookUpdate.volume = remainingVol;
                bookUpdate.side = 'B';
                bookUpdate.timestamp = getCurrentNanos();
                trades.push_back(bookUpdate);
            }

            return trades;
        }

        std::vector<MarketUpdate> matchAsk(const OrderRequest& req)
        {
            std::vector<MarketUpdate> trades;
            uint32_t remainingVol = req.volume;

            while (remainingVol > 0 && !bids.empty()) {
                auto bestBidIt = bids.begin();
                if (req.price > bestBidIt->first) break;

                auto& orderList = bestBidIt->second;

                while (remainingVol > 0 && !orderList.empty()) {
                    Order& matchingOrder = orderList.front();
                    uint32_t matchVol = std::min(remainingVol, matchingOrder.volume);

                    MarketUpdate trade;
                    trade.tickerId = req.tickerId;
                    trade.price = bestBidIt->first; // Execution happens at the maker's price
                    trade.volume = matchVol;
                    trade.side = 'T';
                    trade.timestamp = getCurrentNanos();

                    trades.push_back(trade);

                    remainingVol -= matchVol;
                    matchingOrder.volume -= matchVol;

                    if (matchingOrder.volume == 0) orderList.pop_front();
                }

                if (orderList.empty()) bids.erase(bestBidIt);
            }

            if (remainingVol > 0) {
                asks[req.price].push_back({req.clientId, req.clientOrderId, req.price, remainingVol});

                MarketUpdate bookUpdate;
                bookUpdate.tickerId = req.tickerId;
                bookUpdate.price = req.price;
                bookUpdate.volume = remainingVol;
                bookUpdate.side = 'A';
                bookUpdate.timestamp = getCurrentNanos();
                trades.push_back(bookUpdate);
            }
            
            return trades;
        }
    };
}

#endif