#ifndef EXCHANGE_DIRECTIONAL_BOT_HPP
#define EXCHANGE_DIRECTIONAL_BOT_HPP

#include "bot.hpp"
#include <map>
#include <algorithm>

namespace Exchange
{
    enum class Bias { BULL, BEAR };

    class DirectionalBot : public Bot<DirectionalBot>
    {
    public:

        DirectionalBot(uint32_t id, double balance, Bias bias, double aggressiveness = 0.50, uint32_t volume = 50)
          :  Bot<DirectionalBot>(id, balance), bias(bias), aggressiveness(aggressiveness), target_volume(volume) {}

        void onMarketUpdateImpl(const MarketUpdate& update)
        {
            if (update.side == 'S' || update.side == 'T') {
                fair_values[update.tickerId] = update.price;
                return;
            }

            double baseline = fair_values[update.tickerId];
            if (baseline == 0.0) return;

            int32_t current_position = this->holdings[update.tickerId];

            // take liquidity of market maker

            // bull wants price to go up and looks for asks to eat up
            if (bias == Bias::BULL && update.side == 'A') {
                double target_price = baseline + aggressiveness;

                // if market maker is offering price below bullish target
                if (update.price <= target_price && update.volume > 0) {

                    uint32_t max_affordable = static_cast<uint32_t>(this->balance / update.price);
                    // Match the resting volume, our target volume, or what we can afford (whichever is smallest)
                    uint32_t trade_vol = std::min({target_volume, max_affordable, update.volume});

                    if (trade_vol > 0) {
                        this->placeOrder(update.tickerId, update.price, trade_vol, 'B'); // Send Buy to hit the Ask
                    }
                }
            }
            // bear wants price to go down and looks for bids to dump on
            else if (bias == Bias::BEAR && update.side == 'B') {
                double target_price = baseline - aggressiveness;

                // if market maker is bidding above target, dump
                if (update.price >= target_price && update.volume > 0) {

                    uint32_t max_affordable_short = static_cast<uint32_t>(this->balance / update.price);
                    uint32_t available_capacity = max_affordable_short;
                    
                    if (current_position > 0) {
                        available_capacity += current_position; // We own shares, so we can sell them
                    }

                    uint32_t trade_vol = std::min({target_volume, available_capacity, update.volume});

                    if (trade_vol > 0) {
                        this->placeOrder(update.tickerId, update.price, trade_vol, 'A'); // Send Sell to hit the Bid
                    }
                }
            }
        }

    private:

        Bias bias;
        double aggressiveness;
        uint32_t target_volume;
        std::map<uint32_t, double> fair_values;

    };
}

#endif