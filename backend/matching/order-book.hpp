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

    struct PriceLevel
    {
        uint32_t totalVolume = 0;
        std::list<Order> orders;
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

        std::map<double, PriceLevel, std::greater<double>> bids;
        std::map<double, PriceLevel> asks;

        std::vector<MarketUpdate> matchBid(const OrderRequest& req)
        {
            std::vector<MarketUpdate> trades;
            uint32_t remainingVol = req.volume;

            while (remainingVol > 0 && !asks.empty()) {
                auto bestAskIt = asks.begin();
                if (req.price < bestAskIt->first) break;

                auto& level = bestAskIt->second;
                auto& orderList = level.orders;

                while (remainingVol > 0 && !orderList.empty()) {
                    Order& matchingOrder = orderList.front();
                    uint32_t matchVol = std::min(remainingVol, matchingOrder.volume);

                    // 1. Emit the Trade
                    MarketUpdate trade;
                    trade.tickerId = req.tickerId;
                    trade.price = bestAskIt->first;
                    trade.volume = matchVol;
                    trade.side = 'T';
                    trade.timestamp = getCurrentNanos();
                    trades.push_back(trade);

                    // 2. Adjust volumes
                    remainingVol -= matchVol;
                    matchingOrder.volume -= matchVol;
                    level.totalVolume -= matchVol; // Track the aggregate drop

                    if (matchingOrder.volume == 0) orderList.pop_front();
                }

                // 3. Emit the Order Book Update for this consumed level
                MarketUpdate levelUpdate;
                levelUpdate.tickerId = req.tickerId;
                levelUpdate.price = bestAskIt->first;
                levelUpdate.volume = level.totalVolume; // Will be 0 if fully eaten
                levelUpdate.side = 'A'; // We just ate into the Ask book
                levelUpdate.timestamp = getCurrentNanos();
                trades.push_back(levelUpdate);

                if (orderList.empty()) asks.erase(bestAskIt);
            }

            // 4. If volume is left, add to bids and emit book update
            if (remainingVol > 0) {
                bids[req.price].orders.push_back({req.clientId, req.clientOrderId, req.price, remainingVol});
                bids[req.price].totalVolume += remainingVol;

                MarketUpdate bookUpdate;
                bookUpdate.tickerId = req.tickerId;
                bookUpdate.price = req.price;
                bookUpdate.volume = bids[req.price].totalVolume; // Broadcast total volume at this price
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

                auto& level = bestBidIt->second;
                auto& orderList = level.orders;

                while (remainingVol > 0 && !orderList.empty()) {
                    Order& matchingOrder = orderList.front();
                    uint32_t matchVol = std::min(remainingVol, matchingOrder.volume);

                    // 1. Emit the Trade
                    MarketUpdate trade;
                    trade.tickerId = req.tickerId;
                    trade.price = bestBidIt->first; // Execution happens at the maker's price
                    trade.volume = matchVol;
                    trade.side = 'T';
                    trade.timestamp = getCurrentNanos();

                    trades.push_back(trade);

                    // 2. Adjust volumes
                    remainingVol -= matchVol;
                    matchingOrder.volume -= matchVol;
                    level.totalVolume -= matchVol; // Track the aggregate drop

                    if (matchingOrder.volume == 0) orderList.pop_front();
                }

                // 3. Emit the Order Book Update for this consumed level
                MarketUpdate levelUpdate;
                levelUpdate.tickerId = req.tickerId;
                levelUpdate.price = bestBidIt->first;
                levelUpdate.volume = level.totalVolume; // Will be 0 if fully eaten
                levelUpdate.side = 'B'; // We just ate into the Bid book
                levelUpdate.timestamp = getCurrentNanos();
                trades.push_back(levelUpdate);

                if (orderList.empty()) bids.erase(bestBidIt);
            }

            // 4. If volume is left, add to asks (limit) and emit a book update
            if (remainingVol > 0) {
                asks[req.price].orders.push_back({req.clientId, req.clientOrderId, req.price, remainingVol});
                asks[req.price].totalVolume += remainingVol;

                MarketUpdate bookUpdate;
                bookUpdate.tickerId = req.tickerId;
                bookUpdate.price = req.price;
                bookUpdate.volume = asks[req.price].totalVolume; // Broadcast total volume at this price
                bookUpdate.side = 'A'; // Adding to the Ask book
                bookUpdate.timestamp = getCurrentNanos();
                trades.push_back(bookUpdate);
            }
            
            return trades;
        }
    };
}

#endif