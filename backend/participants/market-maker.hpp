#ifndef EXCHANGE_MARKET_MAKER_HPP
#define EXCHANGE_MARKET_MAKER_HPP

#include "bot.hpp"
#include <algorithm>

namespace Exchange
{
    struct ActiveQuote
    {
        uint32_t orderId = 0;
        double price = 0.0;
    };

    class MarketMakerBot : public Bot<MarketMakerBot>
    {
    public:

        MarketMakerBot(uint32_t id, double balance, double risk_aversion = 0.01, double spread = 0.20, uint32_t volume = 100)
          : Bot<MarketMakerBot>(id, balance), initial_balance(balance), risk_aversion(risk_aversion), spread(spread), quote_volume(volume) {}

        void onMarketUpdateImpl(const MarketUpdate& update)
        {
            if (update.side == 'S' || update.side == 'T') {
                fair_values[update.tickerId] = update.price;
            } else {
                return; // ignore order book depth updates
            }

            double theo = fair_values[update.tickerId];
            if (theo == 0.0) return;

            // we cancel old quotes before placing new ones

            if (active_bids[update.tickerId].orderId != 0) {
                this->cancelOrder(update.tickerId, active_bids[update.tickerId].price, 'B', active_bids[update.tickerId].orderId);
                active_bids[update.tickerId] = {0, 0.0}; // clear mem
            }
            if (active_asks[update.tickerId].orderId != 0) {
                this->cancelOrder(update.tickerId, active_asks[update.tickerId].price, 'A', active_asks[update.tickerId].orderId);
                active_asks[update.tickerId] = {0, 0.0};
            }

            // calculate new quotes based on latest market update about asset fair value

            int32_t current_position = this->holdings[update.tickerId];

            // simulated hot hand fallacy
            // If current_balance > initial_balance (We are winning), the ratio drops < 1.0.
            // This lowers our risk aversion (we get cocky and hold more inventory).
            // If we are losing, the ratio goes > 1.0, and we get scared (higher risk aversion).
            double performance_ratio = initial_balance / std::max(this->balance, 1.0);
            double dynamic_risk_aversion = risk_aversion * performance_ratio;

            double skew = current_position * dynamic_risk_aversion;
            double adjusted_theo = theo - skew;

            double bid_price = adjusted_theo - (spread / 2.0);
            double ask_price = adjusted_theo + (spread / 2.0);

            uint32_t max_affordable_buy_vol = static_cast<uint32_t>(this->balance / bid_price);
            uint32_t actual_bid_vol = std::min(quote_volume, max_affordable_buy_vol);

            uint32_t max_affordable_short_vol = static_cast<uint32_t>(this->balance / ask_price);
            uint32_t available_ask_capacity = max_affordable_short_vol;

            if (current_position > 0) {
                available_ask_capacity += current_position; // own shares so we can sell
            }

            uint32_t actual_ask_vol = std::min(quote_volume, available_ask_capacity);

            if (actual_bid_vol > 0) {
                uint32_t bid_id = this->placeOrder(update.tickerId, bid_price, actual_bid_vol, 'B');
                active_bids[update.tickerId] = {bid_id, bid_price};
            }
            if (actual_ask_vol > 0) {
                uint32_t ask_id = this->placeOrder(update.tickerId, ask_price, actual_ask_vol, 'A');
                active_asks[update.tickerId] = {ask_id, ask_price};
            }
        }

    private:

        double initial_balance;
        double risk_aversion;
        double spread;
        uint32_t quote_volume;
        std::map<uint32_t, double> fair_values;

        std::map<uint32_t, ActiveQuote> active_bids;
        std::map<uint32_t, ActiveQuote> active_asks;

    };
}

#endif