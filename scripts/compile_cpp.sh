#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p data

# Compile the C++ program
g++ -std=c++17 cpp/ktp_system_modified.cpp -o ktp_system -lnlohmann_json

echo "C++ program compiled successfully. Run with ./ktp_system"
