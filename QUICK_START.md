# Quick Start Guide

## Installation (First Time Only)

1. **Open Terminal** and navigate to this folder:
   ```bash
   cd /Users/kevin.peck/Documents/GitHub/missing-image-tool
   ```

2. **Install dependencies** (this will take a few minutes):
   ```bash
   npm install
   ```

## Running the App

Every time you want to use the tool:

```bash
cd /Users/kevin.peck/Documents/GitHub/missing-image-tool
npm start
```

The desktop app will open!

## Using the App

1. **Select your catalog files** (click the buttons - no size limits!)
2. **Fill in your WebDAV details**:
   - View Type: e.g., `CI`
   - WebDAV URL: `https://your-realm.demandware.net/.../images/`
   - Username: Your email
   - Password: Your WebDAV key
3. **Click "Analyze Imagery"**
4. **Wait for analysis to complete** (large files may take 5-10 minutes)
5. **Download the CSV** when complete

## Key Features

✅ **No file size limits** - Handle catalogs of any size (even 700+ MB files!)
✅ **Fast streaming parser** - Efficient memory usage
✅ **WebDAV verification** - Checks if image files actually exist
✅ **CSV export** - Easy-to-use reports

## Troubleshooting

**"npm: command not found"**
- Install Node.js from https://nodejs.org/
- Restart Terminal and try again

**"Cannot find module"**
- Run `npm install` again
- Make sure you're in the right folder

**App won't start**
- Check Terminal for error messages
- Try deleting `node_modules` folder and running `npm install` again

## Need Help?

Check the full README.md for detailed documentation and troubleshooting.

