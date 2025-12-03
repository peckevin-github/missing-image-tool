# ⚠️ IMPORTANT: Running Development Version

## The Problem

You may have installed the app from the `.dmg` file earlier. That installed version has **OLD CODE** and won't work with large files.

You need to run the **DEVELOPMENT VERSION** which has the new streaming parser.

## ✅ How to Run Development Version

### Close ALL instances first:
1. **Quit any running apps** (Cmd+Q)
2. **Close any installed versions** from Applications

### Start from Terminal:

```bash
cd /Users/kevin.peck/Documents/GitHub/missing-image-tool
npm start
```

**Important:** Run this from Terminal, NOT by double-clicking the .app file!

## 🔍 How to Tell It's Working

When you start the app:
1. **DevTools will open** (a developer console window)
2. In the Console tab, you should see messages like:
   - "✓ Missing Image Tool loaded successfully!"
   - "Using built-in WebDAV client..."

When you run analysis:
1. You should see console messages:
   - "parseXMLCatalog called with: ..."
   - "Creating SAX stream..."
   - "Streaming started!"
2. In the app, you'll see: "🔄 Using streaming parser for large files..."

## ❌ NOT Working If You See:

- No DevTools window opens
- Error: "Cannot create a string longer than..."
- No console messages about streaming

This means you're running the OLD installed version from the DMG.

## 📝 Next Steps

1. Close everything
2. Open Terminal
3. Run the commands above
4. DevTools should open with the app
5. Try your analysis
6. Check the Console tab in DevTools for messages

