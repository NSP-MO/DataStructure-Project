#!/bin/bash

# Create build directory if it doesn't exist
mkdir -p build

# Compile the C++ program with libcurl
g++ -std=c++17 cpp/ktp_system_supabase.cpp -o build/ktp_system -lnlohmann_json -lcurl

echo "C++ program compiled successfully. Run with ./build/ktp_system"
