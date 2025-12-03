#!/bin/bash

# This script creates a native macOS .app launcher
# The .app can be double-clicked without opening Terminal

APP_NAME="Missing Image Tool"
APP_DIR="$APP_NAME.app"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🔨 Creating native macOS launcher..."
echo ""

# Create .app bundle structure
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleName</key>
    <string>Missing Image Tool</string>
    <key>CFBundleIdentifier</key>
    <string>com.missing-image-tool</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
</dict>
</plist>
EOF

# Create launcher script
cat > "$APP_DIR/Contents/MacOS/launcher" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    osascript -e 'display dialog "Dependencies not installed. Please run: npm install" buttons {"OK"} default button "OK" with icon caution'
    exit 1
fi
npm start
EOF

chmod +x "$APP_DIR/Contents/MacOS/launcher"

echo "✓ Created $APP_DIR"
echo ""
echo "📍 Location: $SCRIPT_DIR/$APP_DIR"
echo ""
echo "To use:"
echo "  1. Double-click 'Missing Image Tool.app' to launch"
echo "  2. Drag to Applications folder (optional)"
echo "  3. Drag to Dock for quick access (optional)"
echo ""
echo "✨ Done!"

