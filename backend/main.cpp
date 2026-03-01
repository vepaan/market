#include <drogon/drogon.h>
#include <json/json.h>
#include <iostream>

int main() {

    drogon::app().registerHandler(
        "/api/valid-ticker",
        [](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
            try {
                std::string ticker = req->getParameter("ticker");

                if (ticker.empty()){
                    auto resp = drogon::HttpResponse::newHttpResponse();
                    resp->setStatusCode(drogon::k400BadRequest);
                    resp->setBody("Missing parameter: ticker");
                    callback(resp);
                    return;
                }

                std:transform(ticker.begin(), ticker.end(), ticker.begin(), ::toupper);

                bool is_valid = (ticker == "AAPL");

                Json::Value result;
                result["is_valid"] = is_valid;

                auto resp = drogon::HttpResponse::newHttpJsonResponse(result);
                callback(resp);
            } catch (const std::exception& e) {
                auto resp = drogon::HttpResponse::newHttpResponse();
                resp->setStatusCode(drogon::k500InternalServerError);
                resp->setBody("Error: " + std::string(e.what()));
                callback(resp);
            }
        },
        {drogon::Get}
    );

    drogon::app().addListener("127.0.0.1", 5000);
    std::cout << "Drogon Server running at http://127.0.0.1:5000" << std::endl;

    drogon::app().run();
    return 0;
}