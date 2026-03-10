cmake_minimum_required(VERSION 3.15)
project(ExchangeSystem LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Required for Gateway's multi-threading
find_package(Threads REQUIRED)
find_package(Boost REQUIRED)

# 3. Shared Include Directories
# This allows all targets to access protocol.h and base classes
include_directories(
    ${PROJECT_SOURCE_DIR}
    ${PROJECT_SOURCE_DIR}/common
    ${PROJECT_SOURCE_DIR}/participants
    ${PROJECT_SOURCE_DIR}/gateway
    ${PROJECT_SOURCE_DIR}/publisher
    ${PROJECT_SOURCE_DIR}/matching
)

add_executable(exchange_server
    main.cpp 
    gateway/gateway.hpp
    publisher/market-data-publisher.hpp
    matching/order-book.hpp
    matching/matching-engine.hpp
    common/env-config.hpp
    common/lf-queue.hpp
)

target_link_libraries(exchange_server PRIVATE 
    Threads::Threads 
    ${Boost_LIBRARIES}
)

add_executable(trading_bot 
    participants/main.cpp 
    participants/participant.hpp
    participants/bot.hpp
    matching/order-book.hpp
    matching/matching-engine.hpp
    common/env-config.hpp
    common/lf-queue.hpp
)

target_link_libraries(trading_bot PRIVATE 
    Threads::Threads 
    ${Boost_LIBRARIES}
)

enable_testing()
add_subdirectory(tests)