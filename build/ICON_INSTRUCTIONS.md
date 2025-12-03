# App Icon Setup

The Electron app is configured to use a Salesforce Commerce Cloud shopping cart icon.

## Quick Setup

### Option 1: Use Salesforce Official Assets (Recommended)

1. **Download the Official Logo:**
   - Visit: https://www.salesforce.com/company/legal/intellectual/
   - Or use the Commerce Cloud icon from Salesforce brand assets
   - Save as high-resolution PNG (at least 512x512px)

2. **Place the icon:**
   - Save as: `build/icon.png` (512x512 or 1024x1024 recommended)
   - Electron Builder will auto-generate .icns (Mac) and .ico (Windows) from this

### Option 2: Create a Simple Shopping Cart Icon

If you can't get the official logo, you can:

1. **Use an online icon generator:**
   - Visit: https://icon.kitchen/ or similar
   - Create a shopping cart icon with blue/Commerce Cloud colors
   - Download in 1024x1024 size
   - Save as `build/icon.png`

2. **Use a free icon resource:**
   - https://www.flaticon.com (search "shopping cart")
   - Choose a cart icon
   - Customize with blue color (#0176D3 - Salesforce blue)
   - Download as PNG 512x512+

### Option 3: Simple Text-Based Icon

For a quick placeholder:
1. Use any image editor
2. Create 512x512 canvas with #0176D3 background
3. Add white text "CI" or shopping cart emoji 🛒
4. Save as `build/icon.png`

## Icon Requirements

- **Format:** PNG (Electron Builder will convert)
- **Size:** Minimum 512x512, recommended 1024x1024
- **Transparency:** Optional (alpha channel supported)
- **Colors:** Salesforce blue (#0176D3) recommended

## File Locations

Place your icon file here:
```
build/
  └── icon.png          # Main icon (auto-converts to all formats)
```

Alternatively, you can provide platform-specific icons:
```
build/
  ├── icon.icns         # macOS (optional if you have icon.png)
  ├── icon.ico          # Windows (optional if you have icon.png)
  └── icon.png          # Linux / fallback
```

## After Adding Icon

Run the build command:
```bash
npm run build-mac    # macOS
npm run build-win    # Windows
npm run build-linux  # Linux
```

The built app will have your custom icon!

## Current Status

❌ No icon file found - using default Electron icon
✅ Directory structure created
📝 Waiting for icon.png to be added

## Salesforce Brand Colors

For reference:
- **Primary Blue:** #0176D3
- **Dark Blue:** #032D60
- **Light Blue:** #E3F3FE
- **White:** #FFFFFF

