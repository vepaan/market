cmake_minimum_required(VERSION 3.15)
project(BackendTest LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Boost REQUIRED)
find_package(Drogon CONFIG REQUIRED)

add_executable(backend_test main.cpp)

target_include_directories(backend_test PRIVATE ${Boost_INCLUDE_DIRS})
target_link_libraries(backend_test PRIVATE Drogon::Drogon)