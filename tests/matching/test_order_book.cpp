#include <gtest/gtest.h>
#include <limits>
#include "order-book.hpp"

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
};

// Match occurs when prices cross
TEST_F(OrderBookTest, SimpleMatch)
{
    // Sitting Ask (Sell 100 @ 150.0)
    OrderRequest sell_req = {1, 101, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 150.0, 100, 100, 0};
    auto trades1 = book.processOrder(sell_req);

    EXPECT_EQ(trades1.size(), 0); // no match, just added to book

    // Crossing Bid (Buy 100 @ 150.0)
    OrderRequest buy_req = {2, 201, 0, 'B', OrderType::Limit, TimeInForce::GTC, 0, 150.0, 100, 100, 0};
    auto trades2 = book.processOrder(buy_req);

    ASSERT_EQ(trades2.size(), 1);
    EXPECT_EQ(trades2[0].price, 150.0);
    EXPECT_EQ(trades2[0].volume, 100);
    EXPECT_EQ(trades2[0].side, 'T');
}   

TEST_F(OrderBookTest, TimePriority)
{
    // place two separate sells at same price
    book.processOrder({1, 10, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 50, 50, 0});
    book.processOrder({2, 11, 0, 'A', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 50, 50, 0});

    // buy 60 shares which should fill first order completely and second partially
    OrderRequest buy = {3, 12, 0, 'B', OrderType::Limit, TimeInForce::GTC, 0, 100.0, 60, 60, 0};
    auto trades = book.processOrder(buy);

    ASSERT_EQ(trades.size(), 2);
    EXPECT_EQ(trades[0].volume, 50); // first filled
    EXPECT_EQ(trades[1].volume, 10); // second partially filled
}

TEST_F(OrderBookTest, PricePriorityAsks) {
    // Add two asks at different prices
    book.processOrder(createReq(1, 10, 'A', 155.0, 100)); // Higher
    book.processOrder(createReq(2, 11, 'A', 150.0, 100)); // Lower (Better)

    // Buy 50. It must match with the 150.0 order first.
    auto trades = book.processOrder(createReq(3, 12, 'B', 160.0, 50));
    
    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, 150.0);
    EXPECT_EQ(trades[0].volume, 50);
}

TEST_F(OrderBookTest, TimePriorityBids) {
    // Two bids at the same price. T1 arrives first.
    book.processOrder(createReq(1, 10, 'B', 100.0, 100));
    book.processOrder(createReq(2, 11, 'B', 100.0, 100));

    // Sell 150. Should eat all of T1 and half of T2.
    auto trades = book.processOrder(createReq(3, 12, 'A', 90.0, 150));
    
    ASSERT_EQ(trades.size(), 2);
    EXPECT_EQ(trades[0].volume, 100); // Filled T1
    EXPECT_EQ(trades[1].volume, 50);  // Partially filled T2
}

TEST_F(OrderBookTest, LargeVolumeMatching) {
    // Test with maximum uint32_t volume to check for overflow logic
    uint32_t maxVol = 2000000; 
    book.processOrder(createReq(1, 1, 'B', 10.0, maxVol));
    
    auto trades = book.processOrder(createReq(2, 2, 'A', 10.0, maxVol));
    ASSERT_EQ(trades.size(), 1);
    EXPECT_EQ(trades[0].volume, maxVol);
}

TEST_F(OrderBookTest, PrecisionAndFloatingPoint) {
    // Obscure sub-penny pricing common in some dark pools or crypto
    double tinyPrice = 0.00000001;
    book.processOrder(createReq(1, 1, 'B', tinyPrice, 100));
    
    auto trades = book.processOrder(createReq(2, 2, 'A', tinyPrice, 50));
    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, tinyPrice);
}

TEST_F(OrderBookTest, MinimumExecutablePrice) {
    // Testing logic with a price of 0.0 (unlikely but possible in errors)
    book.processOrder(createReq(1, 1, 'A', 0.0, 100));
    auto trades = book.processOrder(createReq(2, 2, 'B', 0.0, 100));
    
    ASSERT_EQ(trades.size(), 1);
    EXPECT_DOUBLE_EQ(trades[0].price, 0.0);
}

TEST_F(OrderBookTest, SweepMultiplePriceLevels) {
    // Setup Ask side: 10 @ 10, 10 @ 11, 10 @ 12
    book.processOrder(createReq(1, 1, 'A', 10.0, 10));
    book.processOrder(createReq(2, 2, 'A', 11.0, 10));
    book.processOrder(createReq(3, 3, 'A', 12.0, 10));

    // Buy 25 @ 15. Should sweep 10, 11, and 5 units of 12.
    auto trades = book.processOrder(createReq(4, 4, 'B', 15.0, 25));

    ASSERT_EQ(trades.size(), 3);
    EXPECT_EQ(trades[0].price, 10.0);
    EXPECT_EQ(trades[1].price, 11.0);
    EXPECT_EQ(trades[2].price, 12.0);
    EXPECT_EQ(trades[2].volume, 5);
}

TEST_F(OrderBookTest, SelfMatchingPrevention) {
    // Currently, our OrderBook does not prevent self-matching (Wash Trading).
    // This test documents existing behavior: Client 1 matches with Client 1.
    book.processOrder(createReq(1, 100, 'B', 50.0, 10));
    auto trades = book.processOrder(createReq(1, 101, 'A', 50.0, 10));
    
    EXPECT_EQ(trades.size(), 1);
    EXPECT_EQ(trades[0].volume, 10);
}