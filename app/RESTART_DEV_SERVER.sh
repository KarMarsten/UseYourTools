#!/bin/bash
# Script to cleanly restart the Expo dev server

echo "Stopping existing Expo processes..."
pkill -f "expo start" 2>/dev/null
sleep 2

echo "Clearing Metro cache..."
rm -rf .expo node_modules/.cache .metro 2>/dev/null

echo "Starting Expo dev server in tunnel mode..."
echo "Press Ctrl+C to stop"
echo ""
npx expo start --dev-client --tunnel --clear

