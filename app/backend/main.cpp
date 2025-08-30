#include <boost/asio.hpp>
#include <iostream>

int main() {
    try {
        boost::asio::io_context io;

        std::cout << "Boost.Asio io_context created successfully!\n";
    } catch (std::exception& e) {
        std::cerr << "Exception: " << e.what() << "\n";
        return 1;
    }
    return 0;
}
