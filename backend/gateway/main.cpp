#include "gateway.hpp"
#include <iostream>
#include <csignal>
#include <memory>

std::unique_ptr<Exchange::Gateway> global_gateway;

void signalHandler(int signum)
{
    std::cout << "\n[SYSTEM] Interrupt signal (" << signum << ") received.\n";
    if (global_gateway) {
        global_gateway->stop();
    }
    exit(signum);
}

int main()
{
    // registering our signal handler for shutdown
    signal(SIGINT, signalHandler);

    try {
        const int PORT = 8080;
        
        global_gateway = std::make_unique<Exchange::Gateway>(PORT);

        std::cout << "============================================" << std::endl;
        std::cout << "      EXCHANGE GATEWAY STARTING...          " << std::endl;
        std::cout << "      Port: " << PORT << "                          " << std::endl;
        std::cout << "============================================" << std::endl;

        global_gateway->start();

    } catch (const std::exception& e) {
        std::cerr << "[ERROR] Gateway crashed: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}