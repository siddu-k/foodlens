# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with live camera zoom controls, native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🚀 GitHub Pages & PWA Cache-Busting Fix

If you previously opened your GitHub Pages URL (`https://siddu-k.github.io/foodlens/`), your mobile browser had cached `v1` of the Service Worker (`sw.js`). We applied two fixes:

1. **Network-First Service Worker Strategy (`sw.js` updated to `v2`)**:
   - Always fetches the latest published code from GitHub Pages first before falling back to cache.
2. **Version Cache-Busting Parameters**:
   - Linked `styles.css?v=2` and `app.js?v=2` in `index.html` to force browsers and CDNs to instantly serve the latest camera zoom updates.

### 🔄 How to Push Updates to GitHub:
```bash
git add .
git commit -m "Add camera zoom slider and network-first service worker"
git push origin main
```
*(Once pushed, refresh your GitHub Pages tab or close and reopen the app to get the new zoom controls immediately).*

---

## 🌟 Complete Feature List

1. **Live Camera Zoom (1x, 1.5x, 2x, 3x & Slider)**: Macro zoom to capture tiny text on food labels.
2. **Standalone Fullscreen App (Zero Address / Search Bar)**: Add to Home Screen (iOS & Android) for 100% borderless native app experience.
3. **Medical & Health Condition Clinical Audits**: Analyzes products against *Hypertension*, *Type 2 Diabetes*, *High Cholesterol*, *GERD / Acid Reflux*, *Fatty Liver*, *Gout*, *IBS*, and *Kidney Issues*.
4. **Food-Label Verification (Anti-Hallucination)**: Non-food photos (laptops, pets, documents, clothing) are rejected with clear descriptions.
5. **Clean Uncrowded Analytics**: Horizontal nutrient ribbon, unified 4-pillar quality breakdown, claim buster, and additive audit.
6. **Interactive AI Product Chat**: Context-aware nutritionist assistant factoring in your health goals and medical conditions.
7. **Mobile Settings & Push Notifications**: Notification master toggle, sub-alert switches, Gemini Vision API Key settings, and 1-tap data purge.

---

## 🚀 How to Run Locally

```bash
# In c:\Siddu\foodlens
python -m http.server 8080
```