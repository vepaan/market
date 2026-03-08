#ifndef EXCHANGE_LF_QUEUE_HPP
#define EXCHANGE_LF_QUEUE_HPP

#include "protocol.h"
#include <boost/lockfree/queue.hpp>
#include <boost/lockfree/policies.hpp>

namespace Exchange
{
    template<typename T, size_t Size>
    class LFQueue
    {
    public:

        LFQueue() {}

        LFQueue(const LFQueue&) = delete;
        LFQueue& operator=(const LFQueue&) = delete;

        LFQueue(LFQueue&&) = delete;
        LFQueue& operator=(LFQueue&&) = delete;

        bool push(const T& item)
        {
            return queue_.push(item);
        }

        bool pop(T& item)
        {
            return queue_.pop(item);
        }

        bool empty() const
        {
            return queue_.empty();
        }

        void clear()
        {
            T discard;
            while (queue_.pop(discard)) {}
        }

    private:

        boost::lockfree::queue<
            T, // should be trivially copyable
            boost::lockfree::fixed_sized<true>, // no heap allocation after construction
            boost::lockfree::capacity<Size> // compile size time
        > queue_;

    };
}

#endif