# FoodLens AI — Mobile Food Scanner, Expiry Tracker & AI Nutritionist Chat

**FoodLens AI** is a mobile application featuring **shadcn/ui** dark styling (Zinc palette `#09090b`, `#18181b`, `#27272a`), generous whitespace, **pure SVG vector icons (no emojis)**, strict **Food-Label Verification** (rejects non-food images), **Clean Uncrowded Analytics UI**, interactive **AI Product Chat**, zero dummy clutter, and direct integration with **Google Gemini Vision AI (`gemini-2.5-flash` / `gemini-2.5-flash-lite`)**.

---

## 🌟 Core App Highlights

### 1. ⚙️ **Clean Settings Header Icon**
- Sleek minimalist gear SVG button in the top navbar without colored badge dots.
- Opens the comprehensive Settings sheet for Mobile Notifications, Gemini Vision API Key configuration, and Data Management (Clear Scan History & Reset Pantry).

### 2. 📸 **Streamlined 3-Step Wizard Navigation**
- Unified single primary action button:
  - On Steps 1 & 2: Displays **"Next Step →"** to advance through Front ➔ Nutrition ➔ Ingredients.
  - On Step 3: Automatically transforms into **"Analyze Label"** with the emerald action badge and spinner.

### 3. 🛡️ **Food-Label Verification (Anti-Hallucination)**
- Scans undergo verification to ensure the photo is an authentic packaged food item, nutrition panel, or ingredients list.
- **Non-Food Image Rejection**: If a user uploads an invalid photo (e.g., laptop, dog, clothing, furniture, receipt), Gemini flags `"isFoodProduct": false` with a specific rejection reason and displays a clean, dedicated warning banner rather than generating fake nutrition data.

### 4. 📊 **Visually Clean, Uncrowded Analytics UI**
- **Hero Product Card**: Displays a large crisp Grade (e.g. `Grade A 88/100`), brand badge, product title, serving info, and 1-tap *Save to Expiry Tracker*.
- **Key Nutrients Horizontal Ribbon**: Clean horizontal nutrient metrics (*Calories, Protein, Carbs, Sugar, Fiber, Sodium*) with vertical dividers, replacing heavy cluttered boxes.
- **Unified Quality Breakdown**: 4-Pillar progress bars (*Nutritional Density, Clean Ingredients, Goal Match, Value Rating*) in a single visual card.
- **Marketing Claim Buster & Ingredients Audit**: Minimalist lists with verified vs misleading claim tags.

### 5. 💬 **Interactive AI Product Chat Assistant (Post-Scan)**
- Context-rich chat about the scanned food product with 1-tap quick question chips (*Safe for daily use?*, *Why score deducted?*, *Suggest 3 swaps*, *Impact on my goal?*).

### 6. 🏠 **Homepage Dashboard & Quick Actions**
- **Scan Food Package** (3-step one-by-one label scanner)
- **Add Expiry** (Quick modal to save item name, category & expiration date)
- **Pantry Items** (Filter by *All*, *Soon*, *Fresh*, *Expired* with countdown badges)
- **Expiring Soon Alerts Widget**

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