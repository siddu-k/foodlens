# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with live camera zoom, native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🔍 Live Camera Zoom Controls (While Scanning)

When you tap **Take Photo** in the 3-step scanner wizard:
1. **Quick Zoom Presets**:
   - **`[ 1x ]`** Normal wide angle
   - **`[ 2x ]`** Macro zoom for reading fine nutrition tables
   - **`[ 3x ]`** Maximum zoom for small ingredients lists
2. **Smooth Zoom Slider**:
   - Continuous zoom adjustment from `1.0x` to `3.0x` with real-time level indicator badge (`2.4x`).
3. **Hardware & Digital Hybrid**:
   - Automatically uses mobile optical/hardware camera sensor zoom capabilities when available, paired with precision digital crop snapshotting for 100% sharp text capture on every mobile browser.

---

## 🌟 Complete Feature List

1. **Live Camera Zoom (1x, 2x, 3x & Slider)**: Macro zoom to capture tiny text on food labels.
2. **Standalone Fullscreen App (Zero Address / Search Bar)**: Add to Home Screen (iOS & Android) for 100% borderless native app experience.
3. **Medical & Health Condition Clinical Audits**: Analyzes products against *Hypertension*, *Type 2 Diabetes*, *High Cholesterol*, *GERD / Acid Reflux*, *Fatty Liver*, *Gout*, *IBS*, and *Kidney Issues*.
4. **Food-Label Verification (Anti-Hallucination)**: Non-food photos (laptops, pets, documents, clothing) are rejected with clear descriptions.
5. **Clean Uncrowded Analytics**: Horizontal nutrient ribbon, unified 4-pillar quality breakdown, claim buster, and additive audit.
6. **Interactive AI Product Chat**: Context-aware nutritionist assistant factoring in your health goals and medical conditions.
7. **Mobile Settings & Push Notifications**: Notification master toggle, sub-alert switches, Gemini Vision API Key settings, and 1-tap data purge.

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