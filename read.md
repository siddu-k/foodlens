# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🌟 Browser & Console Details

1. **Favicon 404 Resolution**:
   - Included inline SVG data URI favicon `<link rel="icon" type="image/svg+xml" ...>` in `index.html` head to eliminate 404 requests.
2. **PWA Install Event (`beforeinstallprompt`)**:
   - The browser log `beforeinstallpromptevent.preventDefault() called` is an informational message indicating that the browser's default generic bottom banner was deferred so that the app's custom **"Install App"** button (in Settings) can trigger the native install dialog when the user taps it.
3. **Tailwind CDN Notice**:
   - `cdn.tailwindcss.com` includes an advisory note indicating it generates utility classes in real-time in the browser. For simple zero-config deployment (such as GitHub Pages or local HTTP servers), it works reliably out of the box.

---

## 📱 How to Open in Fullscreen Standalone App Mode

- **On iPhone (iOS Safari)**: Tap **Share** ➔ **"Add to Home Screen"** ➔ Tap **"Add"**. Launching the app icon opens FoodLens in **100% fullscreen with zero address bar or search bar**.
- **On Android (Chrome / Brave / Edge)**: Tap top **Settings Gear Icon ➔ "Install App"** (or tap 3 dots `⋮` ➔ **"Install app"**).

---

## 🚀 How to Run the App

```bash
# In c:\Siddu\foodlens
python -m http.server 8080
```

Open in your browser or mobile phone:
```
http://localhost:8080
```