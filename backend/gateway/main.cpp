#include "gateway.hpp"
#include "env-config.hpp"
#include <iostream>
#include <csignal>
#include <memory>

std::unique_ptr<Exchange::Gateway> global_gateway;
std::unique_ptr<Exchange::MarketDataPublisher> global_publisher;

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
        Exchange::loadDotEnv();
        const int GATEWAY_PORT = Exchange::getEnvInt("EXCHANGE_GATEWAY_PORT", 8080);
        const std::string UDP_HOST = Exchange::getEnvString("UDP_BROADCAST_HOST", "127.0.0.1");
        const int UDP_PORT = Exchange::getEnvInt("UDP_BROADCAST_PORT", 9000);
        
        global_publisher = std::make_unique<Exchange::MarketDataPublisher>(UDP_HOST, UDP_PORT);
        global_gateway = std::make_unique<Exchange::Gateway>(GATEWAY_PORT, global_publisher);

        std::cout << "\n+--------------------------------------------------+\n";
        std::cout << "|               EXCHANGE GATEWAY                  |\n";
        std::cout << "|                  STARTING                       |\n";
        std::cout << "+--------------------------------------------------+\n";
        std::cout << "| TCP Listen Port : " << GATEWAY_PORT << "\n";
        std::cout << "| UDP Publisher   : " << UDP_HOST << ":" << UDP_PORT << "\n";
        std::cout << "+--------------------------------------------------+\n" << std::endl;

        global_gateway->start();

    } catch (const std::exception& e) {
        std::cerr << "[ERROR] Gateway crashed: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}