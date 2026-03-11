#include <gtest/gtest.h>
#include "gateway.hpp"
#include "lf-queue.hpp"
#include "protocol.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <thread>
#include <chrono>
#include <atomic>

using namespace Exchange;

class GatewayTest : public ::testing::Test
{
protected:

    static constexpr int TEST_PORT = 9999;
    LFQueue<OrderRequest> queue{1024};
    std::unique_ptr<Gateway> gateway;

    void SetUp() override
    {
        gateway = std::make_unique<Gateway>(TEST_PORT, &queue);
    }

    void TearDown() override
    {
        gateway->stop();
    }

    // simulate a bot connecting and sending order
    void sendOrderFromClient(const OrderRequest& req)
    {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        struct sockaddr_in serv_addr;
        serv_addr.sin_family = AF_INET;
        serv_addr.sin_port = htons(TEST_PORT);
        inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr);

        if (connect(sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
            return;
        }

        send(sock, &req, sizeof(OrderRequest), 0);
        close(sock);
    }
};

TEST_F(GatewayTest, ConnectionAndDataIntegrity) {
    // Start Gateway in a background thread
    std::atomic<bool> gateway_ready{false};
    std::thread gateway_thread([&]() {
        gateway_ready = true;
        gateway->start();
    });

    // Give the socket a moment to bind
    while (!gateway_ready) std::this_thread::yield();
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    OrderRequest original;
    original.clientId = 42;
    original.clientOrderId = 1001;
    original.tickerId = 2;
    original.side = 'B';
    original.price = 150.25;
    original.volume = 500;

    sendOrderFromClient(original);

    // Check if it arrived in the LFQueue
    OrderRequest received;
    bool found = false;
    for (int i = 0; i < 10; ++i) { // Poll for a bit to account for network latency
        if (queue.pop(received)) {
            found = true;
            break;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    ASSERT_TRUE(found);
    EXPECT_EQ(received.clientId, original.clientId);
    EXPECT_EQ(received.clientOrderId, original.clientOrderId);
    EXPECT_EQ(received.tickerId, original.tickerId);
    EXPECT_DOUBLE_EQ(received.price, original.price);
    EXPECT_EQ(received.volume, original.volume);

    gateway->stop();
    if (gateway_thread.joinable()) {
        gateway_thread.join();
    }
}

TEST_F(GatewayTest, MultipleConcurrentClients) {
    std::thread gateway_thread([&]() { gateway->start(); });
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    const int num_clients = 5;
    std::vector<std::thread> clients;

    for (int i = 0; i < num_clients; ++i) {
        clients.emplace_back([this, i]() {
            // explicit init so every byte of struct is zeroed and no garbage values
            OrderRequest req = {};
            req.clientId = i;
            req.clientOrderId = 100 + i;
            req.tickerId = 1;
            req.side = 'B';
            req.price = 100.0;
            req.volume = 10;

            sendOrderFromClient(req);
        });
    }

    for (auto& t : clients) t.join();

    // so the gateway threads have time to finish pushing to the queue (maybe os context switched)
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // Verify queue count
    int count = 0;
    OrderRequest sink;
    while (queue.pop(sink)) count++;
    
    EXPECT_EQ(count, num_clients);

    gateway->stop();
    if (gateway_thread.joinable()) gateway_thread.join();
}