# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with live camera zoom controls, native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🔍 Live Camera Zoom Controls (While Scanning)

When you tap **Take Photo** in the scanner wizard, the camera modal displays:
1. **Zoom Slider**: Horizontal range slider positioned directly above the shutter button for continuous zoom from **1.0x to 3.0x**.
2. **Quick Preset Buttons**: Dedicated **`[ 1x ]`**, **`[ 1.5x ]`**, **`[ 2x ]`**, and **`[ 3x ]`** tactile buttons.
3. **Live Zoom Badge**: Real-time zoom level indicator (`1.0x` / `2.0x`) in the top right header.
4. **Accurate Zoomed Snapshotting**: Crops the zoomed view into high-resolution images for Gemini Vision OCR.

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
*(Please do a quick hard refresh or reload `http://localhost:8080` to ensure your browser loads the latest camera layout).*