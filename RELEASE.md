# Creating a GitHub Release

The installer files are too large to commit to the repository (GitHub has a 100 MB file limit). Instead, distribute them via GitHub Releases.

## Steps to Create a Release

### 1. Build the Installers

```bash
npm run build
```

This creates installers in the `Install/` folder:
- `Missing Image Tool-1.0.0.dmg` (macOS)
- `Missing Image Tool Setup 1.0.0.exe` (Windows)

### 2. Create a GitHub Release

1. **Go to your repository on GitHub**
2. **Click "Releases"** (in the right sidebar)
3. **Click "Draft a new release"**
4. **Fill in the details:**
   - **Tag version:** `v1.0.0` (create new tag)
   - **Release title:** `Missing Image Tool v1.0.0`
   - **Description:** Add release notes (see template below)

5. **Attach the installers:**
   - Drag and drop or click to upload:
     - `Install/Missing Image Tool-1.0.0.dmg`
     - `Install/Missing Image Tool Setup 1.0.0.exe`

6. **Click "Publish release"**

### 3. Release Notes Template

```markdown
# Missing Image Tool v1.0.0

## ✨ Features

- **Online Products Only** - Automatically filters to only analyze online products (online-flag="true")
- **Optional View Type** - Leave view type empty to check ALL image view types, or specify one to check only that type
- **Category Filtering** - Only analyzes products assigned to at least one category
- **WebDAV Verification** - Checks if image files actually exist on your server
- **No File Size Limits** - Handle catalogs of any size with streaming parsers

## 📥 Installation

### macOS
Download `Missing Image Tool-1.0.0.dmg` below, double-click to open, and drag to Applications.

### Windows
Download `Missing Image Tool Setup 1.0.0.exe` below and run the installer.

## 🐛 Bug Fixes

- First stable release

## 📖 Documentation

See the [README](https://github.com/YOUR-USERNAME/missing-image-tool) for detailed usage instructions.
```

## Updating the README

After creating the release, update the README.md with the correct GitHub URL:

Replace `YOUR-USERNAME` in the README with your actual GitHub username or organization name.

## Future Releases

When creating future releases (v1.0.1, v1.1.0, etc.):

1. Update version in `package.json`
2. Run `npm run build` to create new installers with updated version
3. Create new GitHub Release with the new version tag
4. Upload the new installer files
5. Mark previous release as older if needed

