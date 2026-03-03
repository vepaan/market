#ifndef EXCHANGE_ENV_CONFIG_HPP
#define EXCHANGE_ENV_CONFIG_HPP

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <string>

namespace Exchange
{
    inline std::string trim(const std::string& value)
    {
        const auto start = value.find_first_not_of(" \t\r\n");
        if (start == std::string::npos) {
            return "";
        }

        const auto end = value.find_last_not_of(" \t\r\n");
        return value.substr(start, end - start + 1);
    }

    inline void loadDotEnv()
    {
        namespace fs = std::filesystem;

        fs::path current = fs::current_path();
        fs::path envPath;

        while (!current.empty()) {
            const fs::path candidate = current / ".env";
            if (fs::exists(candidate)) {
                envPath = candidate;
                break;
            }

            if (current == current.root_path()) {
                break;
            }

            current = current.parent_path();
        }

        if (envPath.empty()) {
            return;
        }

        std::ifstream file(envPath);
        if (!file.is_open()) {
            return;
        }

        std::string line;
        while (std::getline(file, line)) {
            line = trim(line);

            if (line.empty() || line[0] == '#') {
                continue;
            }

            const auto delimiter = line.find('=');
            if (delimiter == std::string::npos) {
                continue;
            }

            std::string key = trim(line.substr(0, delimiter));
            std::string value = trim(line.substr(delimiter + 1));

            if (key.empty()) {
                continue;
            }

            if (!value.empty() && value.front() == '"' && value.back() == '"' && value.size() >= 2) {
                value = value.substr(1, value.size() - 2);
            }

            setenv(key.c_str(), value.c_str(), 0);
        }
    }

    inline std::string getEnvString(const std::string& key, const std::string& fallback)
    {
        const char* raw = std::getenv(key.c_str());
        if (raw == nullptr || *raw == '\0') {
            return fallback;
        }

        return std::string(raw);
    }

    inline int getEnvInt(const std::string& key, int fallback)
    {
        const char* raw = std::getenv(key.c_str());
        if (raw == nullptr || *raw == '\0') {
            return fallback;
        }

        try {
            return std::stoi(raw);
        } catch (...) {
            return fallback;
        }
    }
}

#endif
