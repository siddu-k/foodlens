# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with live camera zoom, native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🔍 Prominent Live Camera Zoom Controls

When you tap **Take Photo** in the scanner wizard, the camera modal opens with high-visibility zoom controls:
1. **Quick Zoom Buttons**:
   - **`[ 1x ]`** Standard wide angle
   - **`[ 1.5x ]`** Clear package framing
   - **`[ 2x ]`** Macro zoom for reading fine nutrition tables
   - **`[ 3x ]`** High-magnification zoom for tiny ingredients lists
2. **Fine-Tuning Slider**: Smooth continuous adjustment from `1.0x` to `3.0x` with live badge feedback (`2.0x`).
3. **Accurate Zoomed Snapshotting**: Crops the zoomed view into high-resolution images for Gemini Vision OCR.

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