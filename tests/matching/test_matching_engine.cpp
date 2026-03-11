#include <gtest/gtest.h>
#include "matching-engine.hpp"
#include "market-data-publisher.hpp"
#include <vector>
#include <atomic>
#include <chrono>
#include <thread>
#include <mutex>
#include <memory>

using namespace Exchange;

// mock publisher to intercept udp broadcasts
class MockPublisher : public MarketDataPublisher
{
public:

    MockPublisher() : MarketDataPublisher("127.0.0.1", 12345) {}

    void publish(const MarketUpdate& update) override
    {
        std::lock_guard<std::mutex> lock(mtx);
        published_updates.push_back(update);
    }

    std::vector<MarketUpdate> get_updates()
    {
        std::lock_guard<std::mutex> lock(mtx);
        return published_updates;
    }

    // Returns only matched trade events (side == 'T'), excluding book-state updates
    std::vector<MarketUpdate> get_trades()
    {
        std::lock_guard<std::mutex> lock(mtx);
        std::vector<MarketUpdate> trades;
        std::copy_if(published_updates.begin(), published_updates.end(),
                     std::back_inserter(trades),
                     [](const MarketUpdate& u){ return u.side == 'T'; });
        return trades;
    }

    void clear()
    {
        std::lock_guard<std::mutex> lock(mtx);
        published_updates.clear();
    }

private:

    std::vector<MarketUpdate> published_updates;
    std::mutex mtx;

};

class MatchingEngineTest : public ::testing::Test
{
protected:

    static constexpr size_t Q_SIZE = 4096;
    LFQueue<OrderRequest> queue{Q_SIZE};
    std::unique_ptr<MockPublisher> publisher;
    std::unique_ptr<MatchingEngine> engine;

    void SetUp() override {
        publisher = std::make_unique<MockPublisher>();
        engine = std::make_unique<MatchingEngine>(publisher.get(), &queue);
    }

    void TearDown() override {
        engine->stop();
    }

    OrderRequest createOrder(uint32_t cId, uint32_t tId, char side, double price, uint32_t vol) {
        OrderRequest req = {};
        req.clientId = cId;
        req.tickerId = tId;
        req.side = side;
        req.price = price;
        req.volume = vol;
        req.timestamp = getCurrentNanos();
        return req;
    }
};

TEST_F(MatchingEngineTest, ThreadLifecycle) {
    // Verifies that start and stop don't hang or crash
    EXPECT_NO_THROW(engine->start());
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    EXPECT_NO_THROW(engine->stop());
}

TEST_F(MatchingEngineTest, TickerIsolation) {
    engine->start();

    // Bid for ticker 0 (Ticker 0) @ 100.0
    queue.push(createOrder(1, 0, 'B', 100.0, 10));
    // Ask for ticker 1 (Ticker 1) @ 100.0
    queue.push(createOrder(2, 1, 'A', 100.0, 10));

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // Even though prices match, they are different tickers. No trade should be published.
    auto updates = publisher->get_trades();
    EXPECT_EQ(updates.size(), 0);

    // Now send a matching ask for ticker 0
    queue.push(createOrder(3, 0, 'A', 100.0, 10));
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    updates = publisher->get_trades();
    ASSERT_EQ(updates.size(), 1);
    EXPECT_EQ(updates[0].tickerId, 0);
    EXPECT_EQ(updates[0].side, 'T');
}

// --- HIGH LOAD & STRESS TESTS ---

TEST_F(MatchingEngineTest, HighVolumeBurst) {
    engine->start();
    const int num_matches = 2000;

    // Flood the queue with pairs of matching orders
    for (int i = 0; i < num_matches; ++i) {
        queue.push(createOrder(1, 0, 'B', 500.0, 1));
        queue.push(createOrder(2, 0, 'A', 500.0, 1));
    }

    // Wait for the single engine thread to drain the queue
    bool drained = false;
    for (int attempt = 0; attempt < 20; ++attempt) {
        if (publisher->get_trades().size() == (size_t)num_matches) {
            drained = true;
            break;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    EXPECT_TRUE(drained);
    EXPECT_EQ(publisher->get_trades().size(), num_matches);
}

// --- EDGE CASE TESTS ---

TEST_F(MatchingEngineTest, PartialFillSequence) {
    engine->start();

    // 1. Large Bid: 1000 @ 10.0
    queue.push(createOrder(1, 0, 'B', 10.0, 1000));
    
    // 2. Small Ask: 300 @ 10.0 (Matches partially)
    queue.push(createOrder(2, 0, 'A', 10.0, 300));

    // 3. Another Ask: 800 @ 10.0 (Should match the remaining 700 and leave 100 on book)
    queue.push(createOrder(3, 0, 'A', 10.0, 800));

    std::this_thread::sleep_for(std::chrono::milliseconds(150));
    auto updates = publisher->get_trades();

    ASSERT_EQ(updates.size(), 2);
    EXPECT_EQ(updates[0].volume, 300); // First fill
    EXPECT_EQ(updates[1].volume, 700); // Second fill (capped by remaining bid volume)
}

TEST_F(MatchingEngineTest, RapidStartStop) {
    // Tests for race conditions during initialization/shutdown
    for (int i = 0; i < 10; ++i) {
        engine->start();
        queue.push(createOrder(1, 0, 'B', 100.0, 1));
        engine->stop();
    }
    // Success is not crashing
}

TEST_F(MatchingEngineTest, UninitializedTickerSafety) {
    engine->start();

    // Send an order for a ticker ID far beyond the expected range (e.g., 9999)
    // The unordered_map in MatchingEngine will create a new book. 
    // This tests if the system handles dynamic book creation gracefully.
    EXPECT_NO_THROW({
        queue.push(createOrder(1, 9999, 'B', 50.0, 10));
        queue.push(createOrder(2, 9999, 'A', 50.0, 10));
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    auto updates = publisher->get_trades();
    ASSERT_EQ(updates.size(), 1);
    EXPECT_EQ(updates[0].tickerId, 9999);
}