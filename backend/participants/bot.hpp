#ifndef EXCHANGE_BOT_HPP
#define EXCHANGE_BOT_HPP

#include "participant.hpp"
#include <iostream>

namespace Exchange
{
    template <typename T>
    class Bot : public Participant<T>
    {
    public:

        using Participant<T>::clientId;
        using Participant<T>::balance;
        using Participant<T>::holdings;
        using Participant<T>::sendOrder;
        
        Bot(uint32_t id, double balance) : Participant<T>(id, balance) {}

        void onExecutionImpl(const MarketUpdate& update)
        {
            double tradeCost = update.price * update.volume;

            if (update.side == 'B') {
                this->balance -= tradeCost;
                this->holdings[update.tickerId] += update.volume;
            } else if (update.side == 'A') {
                this->balance += tradeCost;
                this->holdings[update.tickerId] -= update.volume;
            }

            std::cout << "[EXECUTION] Client: " << this->clientId 
                    << " | Ticker: " << update.tickerId 
                    << " | Side: " << update.side 
                    << " | Vol: " << update.volume 
                    << " | New Balance: " << this->balance << '\n';
        }

    protected:

        void placeOrder(uint32_t tickerId, double price, uint32_t volume, char side)
        {
            OrderRequest req;
            req.clientId = this->clientId;
            req.clientOrderId = orderIdCounter;
            orderIdCounter++;
            req.tickerId = tickerId;
            req.side = side;
            req.price = price;
            req.volume = volume;
            req.type = OrderType::Limit;
            req.tif = TimeInForce::GTC;
            req.timestamp = Exchange::getCurrentNanos();
            this->sendOrder(req);
        }

    private:

        uint32_t orderIdCounter{1};
        
    };
}

#endif