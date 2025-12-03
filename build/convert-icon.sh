#!/bin/bash

# Simple script to convert the SVG icon template to PNG
# Requires either ImageMagick (convert) or Inkscape

echo "🎨 Converting SVG icon to PNG..."
echo ""

if command -v convert &> /dev/null; then
    echo "✓ Using ImageMagick..."
    convert -density 1200 -resize 1024x1024 -background none icon-template.svg icon.png
    echo "✓ Created icon.png (1024x1024)"
    echo ""
    echo "✓ Done! You can now run: npm run build-mac"
    
elif command -v inkscape &> /dev/null; then
    echo "✓ Using Inkscape..."
    inkscape icon-template.svg --export-type=png --export-width=1024 --export-filename=icon.png
    echo "✓ Created icon.png (1024x1024)"
    echo ""
    echo "✓ Done! You can now run: npm run build-mac"
    
else
    echo "❌ Neither ImageMagick nor Inkscape found."
    echo ""
    echo "Please install one of:"
    echo "  • ImageMagick: brew install imagemagick"
    echo "  • Inkscape: brew install inkscape"
    echo ""
    echo "Or convert manually using:"
    echo "  • Online: https://cloudconvert.com/svg-to-png"
    echo "  • macOS Preview: Open SVG → Export as PNG"
    echo ""
    echo "See QUICK_ICON_SETUP.md for detailed instructions."
    exit 1
fi

