#!/bin/bash
# Launch Android Studio with Node.js environment configured

export NODE_BINARY=/opt/homebrew/bin/node
export PATH=/opt/homebrew/bin:$PATH

echo "🚀 Launching Android Studio with Node.js configured..."
echo "   NODE_BINARY: $NODE_BINARY"
echo ""

cd "$(dirname "$0")/android"
open -a "Android Studio" .
