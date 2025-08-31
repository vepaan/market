#include <boost/asio.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <sstream>
#include <iostream>

using tcp = boost::asio::ip::tcp;
namespace http = boost::beast::http;

int main() {
    try {
        boost::asio::io_context ioc;
        tcp::acceptor acceptor(ioc, {tcp::v4(), 8080});
        std::cout << "Server running at http:://127.0.0.1:8080\n";

        for (;;) {
            tcp::socket socket(ioc);
            acceptor.accept(socket);

            boost::beast::flat_buffer buffer;
            http::request<http::string_body> req;
            http::read(socket, buffer, req);

            http::response<http::string_body> res{http::status::ok, req.version()};
            res.set(http::field::server, "SimpleBoostServer");
            res.set(http::field::content_type, "text/plain");
            res.keep_alive(req.keep_alive());

            if (req.method() == http::verb::post && req.target() == "/add") {
                std::istringstream iss(req.body());
                int a, b;
                if (iss >> a >> b) {
                    int sum = a + b;
                    res.body() = std::to_string(sum);
                } else {
                    res.body() = "Error: invalid input. Send 'a b' in body.";
                    res.result(http::status::bad_request);
                }
            } else {
                res.body() = "Error: invalid endpoint";
                res.result(http::status::not_found);
            }

            res.prepare_payload();
            http::write(socket, res);
        }

    } catch (std::exception const& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
