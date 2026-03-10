#include <gtest/gtest.h>
#include "env-config.hpp"

int main(int argc, char** argv)
{
    ::testing::InitGoogleTest(&argc, argv);

    Exchange::loadDotEnv();

    return RUN_ALL_TESTS();
}