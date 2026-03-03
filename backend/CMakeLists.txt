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
    ${PROJECT_SOURCE_DIR}/common
    ${PROJECT_SOURCE_DIR}/participants
    ${PROJECT_SOURCE_DIR}/gateway
)

add_executable(exchange_gateway 
    gateway/main.cpp 
    gateway/Gateway.cpp
)

target_link_libraries(exchange_gateway PRIVATE 
    Threads::Threads 
    ${Boost_LIBRARIES}
)

add_executable(trading_bot 
    participants/main.cpp 
    participants/Participant.cpp
    participants/Bot.cpp
)

target_link_libraries(trading_bot PRIVATE 
    Threads::Threads 
    ${Boost_LIBRARIES}
)