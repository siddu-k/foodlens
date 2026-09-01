# FoodLens AI — Mobile Food Scanner, Expiry Tracker, Medical Impact & AI Chat

**FoodLens AI** is a mobile application featuring **shadcn/ui** dark styling (Zinc palette `#09090b`, `#18181b`, `#27272a`), generous whitespace, **pure SVG vector icons (no emojis)**, **Existing Health Conditions & Medical Impact Analysis**, strict **Food-Label Verification**, **Clean Uncrowded Analytics UI**, interactive **AI Product Chat**, and direct integration with **Google Gemini Vision AI (`gemini-2.5-flash` / `gemini-2.5-flash-lite`)**.

---

## 🌟 Core App Highlights

### 1. 🩺 **Medical & Existing Health Conditions Impact**
- **Profile Configuration**: Select common medical conditions via 1-tap pills (*Hypertension / High BP, Type 2 Diabetes, High Cholesterol, Acid Reflux / GERD, Fatty Liver / NAFLD, Gout / High Uric Acid, IBS / Sensitive Gut, Kidney Disease*) or type custom conditions.
- **Dedicated Medical Impact Section in Report**: Every scanned food product displays a clinical audit evaluating safety and physiological risks for your specific medical conditions:
  - 🟢 **Safe for Consumption**
  - 🟡 **Moderate / Caution**
  - 🔴 **High Risk / Contraindicated** (e.g., sodium threshold for hypertension, glycemic starches for diabetes, citric acid/caffeine for GERD, saturated fat for cholesterol, fructose for fatty liver/gout, polyols for IBS, sodium/phosphates for kidney issues).

### 2. 🛡️ **Food-Label Verification (Anti-Hallucination)**
- Scans undergo verification to ensure the photo is an authentic packaged food item, nutrition panel, or ingredients list.
- **Non-Food Image Rejection**: If a user uploads an invalid photo (e.g., laptop, dog, clothing, furniture, receipt), Gemini flags `"isFoodProduct": false` with a specific rejection reason and displays a clean, dedicated warning banner rather than generating fake nutrition data.

### 3. 📊 **Visually Clean, Uncrowded Analytics UI**
- **Hero Product Card**: Displays a large crisp Grade (e.g. `Grade A 88/100`), brand badge, product title, serving info, and 1-tap *Save to Expiry Tracker*.
- **Key Nutrients Horizontal Ribbon**: Clean horizontal nutrient metrics (*Calories, Protein, Carbs, Sugar, Fiber, Sodium*) with vertical dividers, replacing heavy cluttered boxes.
- **Unified Quality Breakdown**: 4-Pillar progress bars (*Nutritional Density, Clean Ingredients, Goal Match, Value Rating*) in a single visual card.
- **Marketing Claim Buster & Ingredients Audit**: Minimalist lists with verified vs misleading claim tags.

### 4. 💬 **Interactive AI Product Chat Assistant (Post-Scan)**
- Context-rich chat about the scanned food product with 1-tap quick question chips (*Safe for daily use?*, *Why score deducted?*, *Suggest 3 swaps*, *Impact on my goal?*). Automatically factors in your existing medical conditions.

### 5. ⚙️ **Mobile Settings Page (Top Settings Icon)**
- **Mobile Push Notifications**: Master activate / deactivate toggle, sub-alert switches (*Expiry Warnings*, *Daily Digest*), and test alert sender.
- **Google Gemini Vision API Setup**: API Key configuration and vision model selection (`gemini-2.5-flash-lite` / `gemini-2.5-flash`).
- **Data Management (Clean Storage)**: Clear Scan History & Clear Pantry Database. Zero dummy clutter.

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