#ifndef EXCHANGE_BOT_HPP
#define EXCHANGE_BOT_HPP

#include "./participant.hpp"
#include <iostream>
#include <atomic>

namespace Exchange
{
    class Bot : public Participant
    {
    public:

        using Participant::Participant;

        void onMarketUpdate(const MarketUpdate& update) override
        {
            double myTheo = getTheo(update.tickerId);
            double transactionCost = 0.05;

            // rudimentary algo now
            if (update.price < (myTheo - transactionCost)) {
                placeOrder(update.tickerId, update.price, 100, 'B');
            } else if (update.price > (myTheo + transactionCost)) {
                placeOrder(update.tickerId, update.price, 100, 'A');
            }
        }

        void onExecution(const MarketUpdate& update) override
        {
            double tradeCost = update.price * update.volume;

            if (update.side == 'B') {
                balance -= tradeCost;
                holdings[update.tickerId] += update.volume;
            } else if (update.side == 'A') {
                balance += tradeCost;
                holdings[update.tickerId] -= update.volume;
            }

            std::cout << "[EXECUTION] Client: " << clientId 
                    << " | Ticker: " << update.tickerId 
                    << " | Side: " << update.side 
                    << " | Vol: " << update.volume 
                    << " | New Balance: " << balance << '\n';
        }

    private:

        double getTheo(uint32_t tickerId) {
            return 150.0;
        }

        void placeOrder(uint32_t tickerId, double price, uint32_t volume, char side)
        {
            OrderRequest req;
            req.clientId = clientId;
            req.clientOrderId = orderIdCounter;
            orderIdCounter++;
            req.tickerId = tickerId;
            req.side = side;
            req.price = price;
            req.volume = volume;
            req.type = OrderType::Limit;
            req.tif = TimeInForce::GTC;
            req.timestamp = Exchange::getCurrentNanos();
            sendOrder(req);
        }

        std::atomic<uint32_t> orderIdCounter{1};
        
    };
}

#endif