# B2C Commerce Missing Image Analyzer - Desktop Edition

A desktop application for analyzing missing product images in Salesforce B2C Commerce catalogs. This Electron-based app can handle catalog files of any size without browser memory limitations.

## Features

- ✅ **No File Size Limits** - Process catalogs of any size (tested with 700+ MB files)
- ✅ **Fast XML Parser** - Pure JavaScript, no native dependencies
- ✅ **WebDAV Integration** - Checks if image files actually exist on your server
- ✅ **Native File Dialogs** - Better file selection experience
- ✅ **CSV Export** - Easy-to-use reports of missing images
- ✅ **Cross-Platform** - Works on macOS, Windows, and Linux

## What It Checks

The tool identifies two types of image issues:

1. **Missing Image Groups** - Products without `<image-group>` elements matching your specified view-type
2. **Missing Image Files** - Products with image groups but files not found on WebDAV

## Installation

### Quick Install (Recommended)

**Download pre-built installers from [GitHub Releases](https://github.com/YOUR-USERNAME/missing-image-tool/releases):**

- **macOS**: `Missing Image Tool-1.0.0.dmg`
- **Windows**: `Missing Image Tool Setup 1.0.0.exe`

Just download the appropriate installer for your platform and double-click to install.

> **Note:** Installers are not included in the repository due to GitHub's file size limits. Download them from the Releases page instead.

### Development Setup

If you want to run from source or make modifications:

**Prerequisites:**
- Node.js (version 16 or higher)
- npm (comes with Node.js)

**Setup:**

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   cd missing-image-tool
   npm install
   ```

3. **Launch the application:**
   
   **Option A: Double-click launcher (easiest!)**
   - Double-click `Missing Image Tool.app` in the project folder
   - Or double-click `Launch Missing Image Tool.command`
   
   **Option B: Terminal command**
   ```bash
   npm start
   ```
   
   See `HOW_TO_LAUNCH.md` for all launch options and tips!

### Optional: Custom App Icon

To use a Salesforce Commerce Cloud shopping cart icon:

1. **Quick Setup:** Convert the included SVG template:
   ```bash
   cd build
   # See QUICK_ICON_SETUP.md for conversion options
   ```

2. **Or add your own:** Place a 512x512+ PNG as `build/icon.png`

See `build/ICON_INSTRUCTIONS.md` for detailed setup.

## Usage

1. **Select Catalog Files**
   - Click "Click to select file" for Master Catalog
   - Click "Click to select file" for Storefront Catalog
   - No size limits - files can be any size!

2. **Configure WebDAV Settings**
   - **View Type**: e.g., `CI`, `large`, `small`, `swatch`
   - **WebDAV Folder URL**: Full URL to your images folder (must end with `/`)
     - Example: `https://your-realm.demandware.net/on/demandware.servlet/webdav/Sites/Impex/images/`
   - **Username**: Your Account Manager email
   - **Password**: Your WebDAV File Access key from Business Manager

3. **Run Analysis**
   - Click "Analyze Imagery"
   - Watch the log for real-time progress
   - Large files may take several minutes to process

4. **Download Results**
   - Click "Download Missing Images CSV" when complete
   - Choose where to save your report
   - Open in Excel or any spreadsheet application

## Building Standalone Apps

Create distributable applications for different platforms:

### macOS
```bash
npm run build-mac
```
Creates a `.dmg` file in the `dist` folder

### Windows
```bash
npm run build-win
```
Creates an installer in the `dist` folder

### Linux
```bash
npm run build-linux
```
Creates an AppImage in the `dist` folder

### All Platforms
```bash
npm run build
```
Builds for all platforms. The final installers can be found in both the `dist/` folder (along with build artifacts) and copied to the `Install/` folder for easy access.

## CSV Output Format

The exported CSV contains three columns:

| product_id | reason | missing_image_path |
|------------|--------|-------------------|
| 12345-ABC | Missing image group for view-type 'CI' | |
| 67890-XYZ | File not found on WebDAV | CI/67890-XYZ.png |

## Troubleshooting

### Large Files Taking Too Long

The tool uses streaming parsers but very large files (>1GB) may still take 5-10 minutes. This is normal - the tool is processing millions of XML elements.

### WebDAV Connection Fails

- Verify your WebDAV URL ends with `/`
- Check your username and password
- Ensure your access key has permission to the images folder
- Try the URL in a browser to confirm access

### Products Not Found

If you see a high percentage of products not found:
- Ensure you're using matching catalogs (e.g., CI storefront + CI master)
- Verify both files are from the same export date/version

## Technical Details

- **Built with:** Electron, Node.js
- **XML Parser:** fast-xml-parser (pure JavaScript, no native dependencies)
- **WebDAV Client:** node-fetch with PROPFIND requests
- **GUI Framework:** Tailwind CSS

## Files

- `main.js` - Electron main process (handles file operations)
- `preload.js` - Secure bridge between main and renderer processes
- `app.html` - User interface
- `package.json` - Dependencies and build configuration

## Support

For issues or questions, check the troubleshooting section above or review the analysis log for specific error messages.

## License

MIT

