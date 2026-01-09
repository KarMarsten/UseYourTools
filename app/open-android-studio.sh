#!/bin/bash

# Launch Android Studio with proper Node.js environment
# This ensures Android Studio can find Node.js

# Set Node.js path
export NODE_BINARY=/opt/homebrew/bin/node
export PATH=/opt/homebrew/bin:$PATH

# Navigate to android directory
cd "$(dirname "$0")/android"

# Launch Android Studio
open -a "Android Studio" .

echo "🚀 Opening Android Studio with Node.js configured..."
echo "   NODE_BINARY: $NODE_BINARY"
echo "   Waiting for Android Studio to open..."
