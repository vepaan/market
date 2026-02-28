cmake_minimum_required(VERSION 3.15)
project(BackendTest LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Boost root (headers only are enough)
set(BOOST_ROOT "C:/Libraries/boost_1_89_0")
set(BOOST_INCLUDEDIR "${BOOST_ROOT}")

# Find Boost header-only components (Beast, Asio)
find_package(Boost 1.89.0 REQUIRED)

#Find drogon header
find_package(Drogon CONFIG REQUIRED)

add_executable(backend_test main.cpp)

# Include Boost headers
target_include_directories(backend_test PRIVATE ${Boost_INCLUDE_DIRS})

target_link_libraries(backend_test PRIVATE Drogon::Drogon)
