# App Icon Assets

This directory contains icon assets for the Missing Image Tool desktop app.

## 📁 What's Here

- **`icon-template.svg`** - Shopping cart icon template (Salesforce Commerce Cloud theme)
- **`convert-icon.sh`** - Auto-conversion script (requires ImageMagick or Inkscape)
- **`ICON_INSTRUCTIONS.md`** - Complete icon setup guide
- **`QUICK_ICON_SETUP.md`** - Fast setup instructions

## 🚀 Quick Start

### Option 1: Use the Template (Fastest)

```bash
cd build

# If you have ImageMagick or Inkscape:
./convert-icon.sh

# Or convert online:
# Upload icon-template.svg to https://cloudconvert.com/svg-to-png
# Download as 1024x1024, save as icon.png
```

### Option 2: Use Official Salesforce Logo

1. Download Commerce Cloud logo from Salesforce brand assets
2. Save as `icon.png` (512x512 minimum, 1024x1024 recommended)
3. Place in this directory

### Option 3: Create Your Own

1. Create a 1024x1024 PNG with your design
2. Use Salesforce blue (#0176D3) for brand consistency
3. Save as `icon.png` in this directory

## ✅ After Adding Icon

The icon will be used when you:

1. **Run in development:**
   ```bash
   npm start
   ```
   Check dock/taskbar for the icon

2. **Build the app:**
   ```bash
   npm run build-mac    # Creates .dmg with icon
   npm run build-win    # Creates installer with icon
   npm run build-linux  # Creates AppImage with icon
   ```

## 📋 Technical Details

- **File name:** `icon.png` (required)
- **Minimum size:** 512x512 pixels
- **Recommended:** 1024x1024 pixels
- **Format:** PNG with or without transparency
- **Auto-conversion:** Electron Builder converts to .icns (Mac) and .ico (Windows)

## 🎨 Template Design

The included `icon-template.svg` features:
- Salesforce blue (#0176D3) background
- White shopping cart illustration
- Orange badge with "CI" text
- Modern rounded corners
- 512x512 artboard

Feel free to customize the SVG before converting!

## 📝 Status

- ✅ Directory structure created
- ✅ SVG template provided
- ✅ Conversion script ready
- ✅ Build configuration set
- ⏳ Waiting for `icon.png` file

Once `icon.png` is added, your app will have a custom icon!

