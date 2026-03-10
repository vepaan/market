cmake_minimum_required(VERSION 3.10)
project(ExchangeTests)

find_package(GTest REQUIRED)
find_package(Boost REQUIRED)
include(GoogleTest)

include_directories(
    ${CMAKE_SOURCE_DIR}/../backend
    ${CMAKE_SOURCE_DIR}/../backend/common
    ${CMAKE_SOURCE_DIR}/../backend/matching
    ${CMAKE_SOURCE_DIR}/../backend/gateway
    ${CMAKE_SOURCE_DIR}/../backend/publisher
)

add_executable(run_tests 
    main.cpp
    common/test_lf_queue.cpp
    matching/test_order_book.cpp
    matching/test_matching_engine.cpp
    gateway/test_gateway.cpp
)

target_link_libraries(run_tests 
    GTest::GTest 
    GTest::Main 
    pthread
    Boost::boost
)

# Discover tests automatically
gtest_discover_tests(run_tests)