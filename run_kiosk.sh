#!/bin/bash

# DIGITALIZE RATION: Kiosk Portal Startup Script
# Runs the Administrator & Biometric Kiosk Web Portal

echo "===================================================="
echo "    🌾 DIGITALIZE RATION: Kiosk Portal Startup 🌾    "
echo "===================================================="

cd "$(dirname "$0")/apps/kiosk-app" || exit 1

if [ ! -d "node_modules" ]; then
    echo "[*] Installing kiosk dependencies..."
    npm install
fi

echo "[+] Starting Kiosk Web Application..."
npm run dev
