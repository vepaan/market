#ifndef EXCHANGE_PROTOCOL_H
#define EXCHANGE_PROTOCOL_H

#include <cstdint>
#include <chrono>

namespace Exchange
{
    #pragma pack(push, 1)

    struct MarketUpdate 
    {
        uint32_t tickerId;
        double price;
        uint32_t volume;
        uint64_t timestamp;
        char side; // 'B'=Bid, 'A'=Ask, 'T'=Trade
    };

    #pragma pack(pop)

    enum class OrderType : uint8_t
    {
        Limit = 0,
        Market = 1,
        Iceberg = 2
    };

    enum class TimeInForce : uint8_t
    {
        GTC = 0, // Good Till Cancelled
        IOC = 1, // Immediate Or Cancel
        FOK = 2 // Fill Or Kill
    };

    #pragma pack(push, 1)

    struct OrderRequest 
    {
        uint32_t clientId;
        uint32_t clientOrderId;
        uint32_t tickerId;

        char side; // 'B'=Bid, 'A'=Ask
        OrderType type;
        TimeInForce tif;
        uint8_t padding;

        double price;
        uint32_t volume;
        uint32_t visibleVolume;

        uint64_t timestamp;
    };

    #pragma pack(pop)

    uint64_t getCurrentNanos()
    {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::high_resolution_clock::now().time_since_epoch()
        ).count();
    }
}

#endif