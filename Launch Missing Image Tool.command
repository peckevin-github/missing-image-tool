#!/bin/bash

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to that directory
cd "$DIR"

# Clear the terminal
clear

# Show a nice header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛒 Missing Image Tool - Desktop Edition"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Starting application..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed!"
    echo ""
    echo "Installing dependencies (this will take a few minutes)..."
    echo ""
    npm install
    echo ""
    echo "✓ Installation complete!"
    echo ""
fi

# Launch the Electron app
npm start

# This keeps the terminal open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error launching app. Press any key to close..."
    read -n 1
fi

