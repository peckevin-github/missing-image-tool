# Quick Icon Setup Guide

## Fastest Method: Convert the SVG Template

I've created `icon-template.svg` with a shopping cart design in Salesforce blue.

### Convert SVG to PNG:

**Option 1: Using Online Converter (Easiest)**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `build/icon-template.svg`
3. Set width to 1024px (maintains quality)
4. Download the PNG
5. Rename to `icon.png` and place in the `build/` folder

**Option 2: Using macOS Preview**
1. Open `icon-template.svg` in Preview
2. File → Export
3. Format: PNG
4. Resolution: 1024x1024
5. Save as `icon.png` in the `build/` folder

**Option 3: Using ImageMagick (if installed)**
```bash
cd build
convert -density 1200 -resize 1024x1024 icon-template.svg icon.png
```

**Option 4: Using Inkscape (if installed)**
```bash
inkscape icon-template.svg --export-type=png --export-width=1024 --export-filename=icon.png
```

## After Conversion

Once you have `build/icon.png`:

1. **Test in development:**
   ```bash
   npm start
   ```
   The icon should appear in the dock (macOS) or taskbar

2. **Build the app:**
   ```bash
   npm run build-mac
   ```
   The icon will be embedded in the .dmg installer

## Current Template Design

The SVG template includes:
- 🔵 Salesforce blue (#0176D3) background
- 🛒 White shopping cart icon
- 🟡 Orange badge with "CI" text
- Rounded corners for modern look

## Customize the Icon

Edit `icon-template.svg` to:
- Change colors
- Modify cart design
- Update badge text (CI, SFCC, etc.)
- Add your own elements

Then convert to PNG following the steps above!

