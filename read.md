# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with live camera zoom controls, native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🤖 Google Gemini Vision API Configuration

- **Recommended Production Model**: `gemini-2.5-flash` (Stable multimodal vision & OCR).
- **Supported Models**: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.5-pro`.
- **Automatic 404 Fallback**: If an outdated or decommissioned model endpoint (such as `flash-lite`) is queried, the app automatically falls back to `gemini-2.5-flash` seamlessly.

---

## 🚀 How to Run Locally

```bash
# In c:\Siddu\foodlens
python -m http.server 8080
```

Open in your browser or mobile phone:
```
http://localhost:8080
```