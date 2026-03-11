#include <gtest/gtest.h>
#include <limits>
#include <algorithm>
#include <vector>
#include "order-book.hpp"
#include "protocol.h"

using namespace Exchange;

class OrderBookTest : public ::testing::Test
{
protected:

    OrderBook book;

    OrderRequest createReq(uint32_t cId, uint32_t oId, char side, double price, uint32_t vol)
    {
        OrderRequest req;
        req.clientId = cId;
        req.clientOrderId = oId;
        req.tickerId = 0;
        req.side = side;
        req.type = OrderType::Limit;
        req.tif = TimeInForce::GTC;
        req.price = price;
        req.volume = vol;
        req.timestamp = getCurrentNanos();
        return req;
    }

    // Helper function to filter out Book Updates and only return Trades
    std::vector<MarketUpdate> extractTrades(const std::vector<MarketUpdate>& updates)
    {
        std::vector<MarketUpdate> trades;
        for (const auto& u : updates) {
            if (u.side == 'T') {
                trades.push_back(u);
            }
        }
        return trades;
    }
};

// Match occurs when prices cross
TEST_F(OrderBookTest, SimpleMatch)
{
    OrderRequest sell_req = {1, 101, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 150.0, 100, 100, 0};
    auto updates1 = book.processOrder(sell_req);
    auto trades1 = extractTrades(updates1);
    EXPECT_EQ(trades1.size(), 0); 

    OrderRequest buy_req = {2, 201, 0, 'B', OrderType::Limit, TimeInForce::GTC, 0, 150.0, 100, 100, 0};
    auto updates2 = book.processOrder(buy_req);
    auto trades2 = extractTrades(updates2);

    ASSERT_EQ(trades2.size(), 1);
    EXPECT_EQ(trades2[0].price, 150.0);
    EXPECT_EQ(trades2[0].volume, 100);
    EXPECT_EQ(trades2[0].side, 'T');
}   

TEST_F(OrderBookTest, TimePriority)
{
    book.processOrder({1, 10, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 50, 50, 0});
    book.processOrder({2, 11, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 50, 50, 0});

    OrderRequest buy = {3, 12, 0, 'B', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 60, 60, 0};
    auto updates = book.processOrder(buy);
    auto trades = extractTrades(updates);

    ASSERT_EQ(trades.size(), 2);
    EXPECT_EQ(trades[0].volume, 50); 
    EXPECT_EQ(trades[1].volume, 10); 
}

TEST_F(OrderBookTest, PricePriorityAsks) {
    book.processOrder(createReq(1, 10, 'A', 155.0, 100)); 
    book.processOrder(createReq(2, 11, 'A', 150.0, 100)); 

    auto updates = book.processOrder(createReq(3, 12, 'B', 160.0, 50));
    auto trades = extractTrades(updates);
    
    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, 150.0);
    EXPECT_EQ(trades[0].volume, 50);
}

TEST_F(OrderBookTest, TimePriorityBids) {
    book.processOrder(createReq(1, 10, 'B', 100.0, 100));
    book.processOrder(createReq(2, 11, 'B', 100.0, 100));

    auto updates = book.processOrder(createReq(3, 12, 'A', 90.0, 150));
    auto trades = extractTrades(updates);
    
    ASSERT_EQ(trades.size(), 2);
    EXPECT_EQ(trades[0].volume, 100); 
    EXPECT_EQ(trades[1].volume, 50);  
}

TEST_F(OrderBookTest, LargeVolumeMatching) {
    uint32_t maxVol = 2000000; 
    book.processOrder(createReq(1, 1, 'B', 10.0, maxVol));
    
    auto updates = book.processOrder(createReq(2, 2, 'A', 10.0, maxVol));
    auto trades = extractTrades(updates);

    ASSERT_EQ(trades.size(), 1);
    EXPECT_EQ(trades[0].volume, maxVol);
}

TEST_F(OrderBookTest, PrecisionAndFloatingPoint) {
    double tinyPrice = 0.00000001;
    book.processOrder(createReq(1, 1, 'B', tinyPrice, 100));
    
    auto updates = book.processOrder(createReq(2, 2, 'A', tinyPrice, 50));
    auto trades = extractTrades(updates);

    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, tinyPrice);
}

TEST_F(OrderBookTest, MinimumExecutablePrice) {
    book.processOrder(createReq(1, 1, 'A', 0.0, 100));
    auto updates = book.processOrder(createReq(2, 2, 'B', 0.0, 100));
    auto trades = extractTrades(updates);
    
    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, 0.0);
}

TEST_F(OrderBookTest, SweepMultiplePriceLevels) {
    book.processOrder(createReq(1, 1, 'A', 10.0, 10));
    book.processOrder(createReq(2, 2, 'A', 11.0, 10));
    book.processOrder(createReq(3, 3, 'A', 12.0, 10));

    auto updates = book.processOrder(createReq(4, 4, 'B', 15.0, 25));
    auto trades = extractTrades(updates);

    ASSERT_EQ(trades.size(), 3);
    EXPECT_EQ(trades[0].price, 10.0);
    EXPECT_EQ(trades[1].price, 11.0);
    EXPECT_EQ(trades[2].price, 12.0);
    EXPECT_EQ(trades[2].volume, 5);
}

TEST_F(OrderBookTest, SelfMatchingPrevention) {
    book.processOrder(createReq(1, 100, 'B', 50.0, 10));
    auto updates = book.processOrder(createReq(1, 101, 'A', 50.0, 10));
    auto trades = extractTrades(updates);
    
    EXPECT_EQ(trades.size(), 1);
    EXPECT_EQ(trades[0].volume, 10);
}