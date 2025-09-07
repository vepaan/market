#include <drogon/drogon.h>
#include <json/json.h>
#include <iostream>

int main() {
    // Register /add endpoint with proper async signature
    drogon::app().registerHandler(
        "/add",
        [](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            try {
                std::string x_str = req->getParameter("x");
                std::string y_str = req->getParameter("y");
                
                if (x_str.empty() || y_str.empty()) {
                    auto resp = drogon::HttpResponse::newHttpResponse();
                    resp->setStatusCode(drogon::k400BadRequest);
                    resp->setBody("Missing parameters x or y");
                    callback(resp);
                    return;
                }
                
                int x = std::stoi(x_str);
                int y = std::stoi(y_str);
                int sum = x + y;

                Json::Value result;
                result["sum"] = sum;

                auto resp = drogon::HttpResponse::newHttpJsonResponse(result);
                callback(resp);
            } catch (const std::exception &e) {
                auto resp = drogon::HttpResponse::newHttpResponse();
                resp->setStatusCode(drogon::k400BadRequest);
                resp->setBody("Invalid parameters: " + std::string(e.what()));
                callback(resp);
            }
        },
        {drogon::Get}
    );

    drogon::app().addListener("127.0.0.1", 8080);
    std::cout << "Drogon Server running at http://127.0.0.1:8080" << std::endl;

    drogon::app().run();
    return 0;
}