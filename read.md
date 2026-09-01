# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a Progressive Web App (PWA) with native mobile device notifications, fullscreen standalone display mode, food verification, and clinical health condition intelligence.

---

## 🔔 Mobile Browser Notification Permission System

### 📲 How Mobile Notifications Work
1. **First-Visit Smart Prompt**:
   - A friendly banner appears on the Homepage: *"Enable Mobile Alerts — Get warnings before your food expires"* with an **Enable** button.
2. **Native Mobile Push via Service Worker**:
   - Uses `ServiceWorkerRegistration.showNotification()` with vibration patterns and app badges, allowing notifications to reach mobile lock screens and system trays even when the browser tab is idle.
3. **Platform-Specific Intelligence**:
   - **On Android (Chrome / Brave / Edge)**: Triggers the native browser permission dialog directly with 1 tap.
   - **On iOS (Safari)**: Detects if running in a browser tab vs standalone mode. Safari requires saving the app to the Home Screen to receive Web Push notifications (iOS 16.4+), providing clear step-by-step guidance.
   - **Blocked Permission Recovery**: If a user previously clicked "Block", the app shows a helpful toast: *"Tap the 🔒 icon in your browser URL bar to allow notifications."*

---

## 🌟 Core Features

1. **Standalone Fullscreen App (Zero Address Bar / Search Bar)**:
   - Add to Home Screen (iOS & Android) for 100% borderless native app experience.
2. **Medical & Health Condition Clinical Audits**:
   - Analyzes products against *Hypertension*, *Type 2 Diabetes*, *High Cholesterol*, *GERD / Acid Reflux*, *Fatty Liver*, *Gout*, *IBS*, and *Kidney Issues*.
3. **Food-Label Verification (Anti-Hallucination)**:
   - Non-food photos (laptops, pets, documents, clothing) are rejected with clear descriptions.
4. **Clean Uncrowded Analytics**:
   - Horizontal nutrient ribbon, unified 4-pillar quality breakdown, claim buster, and additive audit.
5. **Interactive AI Product Chat**:
   - Context-aware nutritionist assistant factoring in your health goals and medical conditions.
6. **Mobile Settings & Data Management**:
   - Clear history, reset pantry, push notification preferences, and Gemini Vision API Key settings.

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