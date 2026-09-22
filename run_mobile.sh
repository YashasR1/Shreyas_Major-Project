#!/bin/bash

# DIGITALIZE RATION: Citizen Mobile App Startup Script
# Runs the Beneficiary Quota & Balance Tracker

echo "===================================================="
echo "    📱 DIGITALIZE RATION: Mobile App Startup 📱     "
echo "===================================================="

cd "$(dirname "$0")/apps/mobile-app" || exit 1

if [ ! -d "node_modules" ]; then
    echo "[*] Installing mobile app dependencies..."
    npm install
fi

echo "[+] Starting Citizen Mobile Web App..."
npm run dev
