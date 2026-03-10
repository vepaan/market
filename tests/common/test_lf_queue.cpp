#include <gtest/gtest.h>
#include "lf-queue.hpp"
#include "protocol.h"
#include <thread>
#include <vector>
#include <atomic>
#include <set>

using namespace Exchange;

class LFQueueTest : public ::testing::Test
{
protected:

    static constexpr size_t TEST_SIZE = 1024;
    LFQueue<OrderRequest> queue{TEST_SIZE};

    OrderRequest createDummyOrder(uint32_t id) {
        OrderRequest req;
        req.clientOrderId = id;
        req.tickerId = 0;
        req.price = 100.0;
        req.volume = 10;
        return req;
    }
};

TEST_F(LFQueueTest, BasicPushPop) {
    OrderRequest original = createDummyOrder(12345);
    EXPECT_TRUE(queue.push(original));
    
    OrderRequest popped;
    EXPECT_TRUE(queue.pop(popped));
    EXPECT_EQ(popped.clientOrderId, 12345);
}

TEST_F(LFQueueTest, CapacityLimit) {
    // Fill the queue to its capacity
    for (size_t i = 0; i < TEST_SIZE; ++i) {
        ASSERT_TRUE(queue.push(createDummyOrder(i)));
    }

    // Next push should fail
    EXPECT_FALSE(queue.push(createDummyOrder(999)));
}

// --- MULTITHREADED STRESS TESTS ---

/**
 * Test: Multi-Producer, Single-Consumer (MPSC)
 * Matches the Gateway -> MatchingEngine architecture.
 * Verifies that no orders are lost when multiple threads flood the queue.
 */
TEST_F(LFQueueTest, MPSC_StressTest) {
    const int num_producers = 8;
    const int orders_per_producer = 10000;
    const int total_orders = num_producers * orders_per_producer;

    std::atomic<bool> start_flag{false};
    std::atomic<int> producers_finished{0};

    // 1. Start Consumer (Matching Engine thread)
    std::vector<uint32_t> received_ids;
    received_ids.reserve(total_orders);
    
    std::thread consumer([&]() {
        int count = 0;
        while (count < total_orders) {
            OrderRequest req;
            if (queue.pop(req)) {
                received_ids.push_back(req.clientOrderId);
                count++;
            }
        }
    });

    // 2. Start Producers (Gateway threads)
    std::vector<std::thread> producers;
    for (int p = 0; p < num_producers; ++p) {
        producers.emplace_back([&, p]() {
            while (!start_flag) std::this_thread::yield();
            
            for (int i = 0; i < orders_per_producer; ++i) {
                // clientOrderId = producer_index * offset + sequence
                uint32_t id = (p * 100000) + i;
                while (!queue.push(createDummyOrder(id))) {
                    std::this_thread::yield(); // Wait if queue is full
                }
            }
        });
    }

    // 3. Fire!
    start_flag = true;

    for (auto& t : producers) t.join();
    consumer.join();

    // 4. Verify Integrity
    EXPECT_EQ(received_ids.size(), total_orders);
    
    // Check for duplicates or missing IDs using a set
    std::set<uint32_t> unique_ids(received_ids.begin(), received_ids.end());
    EXPECT_EQ(unique_ids.size(), total_orders);
}

/**
 * Test: Multi-Producer, Multi-Consumer (MPMC)
 * Verifies the underlying boost queue robustness for arbitrary threading.
 */
TEST_F(LFQueueTest, MPMC_HighContention) {
    const int num_threads = 4; // 4 producers, 4 consumers
    const int items_per_thread = 5000;
    std::atomic<int> total_consumed{0};
    std::atomic<bool> stop_producers{false};

    std::vector<std::thread> producers;
    std::vector<std::thread> consumers;

    for (int i = 0; i < num_threads; ++i) {
        producers.emplace_back([&]() {
            for (int j = 0; j < items_per_thread; ++j) {
                while (!queue.push(createDummyOrder(j))) std::this_thread::yield();
            }
        });

        consumers.emplace_back([&]() {
            while (total_consumed < num_threads * items_per_thread) {
                OrderRequest req;
                if (queue.pop(req)) {
                    total_consumed++;
                }
            }
        });
    }

    for (auto& t : producers) t.join();
    for (auto& t : consumers) t.join();

    EXPECT_EQ(total_consumed.load(), num_threads * items_per_thread);
    EXPECT_TRUE(queue.empty());
}