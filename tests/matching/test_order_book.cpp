#include <gtest/gtest.h>
#include "order-book.hpp"

using namespace Exchange;

class OrderBookTest : public ::testing::Test
{
protected:
    OrderBook book;
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