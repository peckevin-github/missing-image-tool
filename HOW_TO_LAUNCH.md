# How to Launch the Missing Image Tool

You now have **multiple easy ways** to launch the app without using terminal commands!

## 🚀 Option 1: Double-Click the .app (Easiest!)

**✨ Already Created for You!**

Just double-click:
```
Missing Image Tool.app
```

This is a native macOS application launcher that you can:
- ✅ Double-click to launch
- ✅ Drag to your Applications folder
- ✅ Drag to your Dock for quick access
- ✅ Pin to Finder sidebar

**First Time Usage:**
- macOS may show a security warning (unidentified developer)
- Right-click → Open → Open anyway
- This only happens once!

---

## 🎯 Option 2: Double-Click the .command File

Double-click:
```
Launch Missing Image Tool.command
```

This will:
- Open Terminal automatically
- Show a nice header
- Launch the app
- Auto-install dependencies if needed

**Benefit:** You can see the console output for debugging

---

## 💻 Option 3: Terminal Command (Original Method)

```bash
cd /Users/kevin.peck/Documents/GitHub/missing-image-tool
npm start
```

**Benefit:** Direct control, see all output

---

## 🎨 Bonus: Build a Full Standalone App

Want a **real, distributable .app** that doesn't need Node.js?

```bash
npm run build-mac
```

This creates:
- A `.dmg` installer in the `dist/` folder
- Can be installed on any Mac
- Can be distributed to others
- Includes your custom icon (if you added one)
- No dependencies needed on target Mac!

---

## 📋 Comparison

| Method | Terminal Window | Requires Node.js | Can Share |
|--------|----------------|------------------|-----------|
| Missing Image Tool.app | No* | Yes (on your Mac) | No |
| .command file | Yes | Yes | No |
| npm start | Yes | Yes | No |
| Built .app (from dist/) | No | No | ✅ Yes! |

*Terminal may briefly appear then hide

---

## 🎁 Recommended Setup

### For Daily Use:
1. Double-click `Missing Image Tool.app`
2. Optional: Drag to Applications or Dock

### For Development:
- Use the `.command` file to see logs

### For Distribution:
1. Add icon: Place `icon.png` in `build/` folder
2. Run: `npm run build-mac`
3. Share: `dist/Missing Image Tool-1.0.0.dmg`

---

## 🔄 Recreating the .app Launcher

If you ever need to recreate the launcher:

```bash
./create-app-launcher.sh
```

This will regenerate `Missing Image Tool.app` with current paths.

---

## ✨ Quick Reference

**From Finder:**
1. Navigate to: `missing-image-tool` folder
2. Double-click: `Missing Image Tool.app`
3. Done! 🎉

**Adding to Dock:**
1. Launch the app once using `.app` or `.command`
2. Right-click the app icon in Dock
3. Options → Keep in Dock

**Adding to Applications:**
1. Drag `Missing Image Tool.app` to `/Applications`
2. Launch from Launchpad or Spotlight (Cmd+Space)

