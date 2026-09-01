/**
 * FoodLens AI — Production Mobile Client
 * Pure SVG Icons, Spacious Layout, Homepage Dashboard, Expiry Date Pantry Tracker,
 * 3-Step Label Scanner, Gemini Vision API, and Deterministic 4-Pillar Scoring Engine.
 */

// Default Initial Expiry Items for Pantry Tracking (Empty by default)
const INITIAL_EXPIRY_ITEMS = [];

// App State
const state = {
  currentStep: 1, // 1: Front, 2: Nutrition, 3: Ingredients
  images: {
    1: null, // { url, base64, mimeType }
    2: null,
    3: null
  },
  currentProductData: null,
  history: JSON.parse(localStorage.getItem("foodlens_history") || "[]"),
  expiryItems: JSON.parse(localStorage.getItem("foodlens_expiry_items") || "[]"),
  expiryFilter: "ALL",
  profile: {
    userGoal: "MUSCLE_GAIN",
    dietPreference: "NO_PREFERENCE",
    allergies: []
  },
  notifications: {
    enabled: localStorage.getItem("foodlens_notif_enabled") !== "false", // Default true
    expiryAlerts: localStorage.getItem("foodlens_notif_expiry") !== "false",
    dailyDigest: localStorage.getItem("foodlens_notif_digest") !== "false"
  },
  gemini: {
    apiKey: localStorage.getItem("foodlens_gemini_key") || "",
    model: localStorage.getItem("foodlens_gemini_model") || "gemini-2.5-flash"
  }
};

// Main App Controller
const app = {
  init() {
    this.setupEventListeners();
    this.updateWizardStep(1);
    this.loadProfile();
    this.updateApiBadge();
    this.renderHomeDashboard();
    this.renderExpiryItems();
    this.setDefaultExpiryDate();
  },

  // -------------------------------------------------------------
  // Navigation & Tab Switching
  // -------------------------------------------------------------
  switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".mob-tab").forEach(b => b.classList.remove("active"));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");

    const mobTab = document.querySelector(`.mob-tab[data-tab="${tabId}"]`);
    if (mobTab) mobTab.classList.add("active");

    if (tabId === "home-tab") {
      this.renderHomeDashboard();
    } else if (tabId === "expiry-tab") {
      this.renderExpiryItems();
    }
  },

  // -------------------------------------------------------------
  // Homepage Dashboard & Expiry Alerts
  // -------------------------------------------------------------
  renderHomeDashboard() {
    // Goal badge
    const goalMap = {
      MUSCLE_GAIN: "Muscle Gain",
      WEIGHT_LOSS: "Weight Loss",
      DIABETIC_FRIENDLY: "Diabetic Safe",
      HEART_HEALTH: "Heart Health"
    };
    const goalBadge = document.getElementById("home-goal-badge");
    if (goalBadge) goalBadge.textContent = goalMap[state.profile.userGoal] || "General Health";

    // Expiring Soon Calculation
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiringSoon = state.expiryItems.filter(item => {
      const exp = new Date(item.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    const soonCountEl = document.getElementById("home-expiring-count");
    if (soonCountEl) soonCountEl.textContent = `${expiringSoon.length} Soon`;

    // Render Home Expiry Alerts List
    const alertsContainer = document.getElementById("home-expiry-alerts-list");
    if (alertsContainer) {
      if (expiringSoon.length === 0) {
        alertsContainer.innerHTML = `
          <div class="text-xs text-zinc-500 py-1.5 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            All pantry items are fresh. No imminent expirations.
          </div>
        `;
      } else {
        alertsContainer.innerHTML = expiringSoon.map(item => {
          const exp = new Date(item.expiryDate);
          exp.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          const label = diffDays === 0 ? "Expires today" : diffDays === 1 ? "Expires tomorrow" : `Expires in ${diffDays} days`;

          return `
            <div class="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div>
                <span class="text-xs font-semibold text-zinc-200 block">${item.name}</span>
                <span class="text-[10px] text-zinc-400 font-mono">${item.category}</span>
              </div>
              <span class="rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold px-2.5 py-0.5 text-[10px] font-mono">
                ${label}
              </span>
            </div>
          `;
        }).join("");
      }
    }

    // Render Home Recent Scans
    const recentScansContainer = document.getElementById("home-recent-scans-list");
    if (recentScansContainer) {
      if (state.history.length === 0) {
        recentScansContainer.innerHTML = `
          <div class="text-xs text-zinc-500 py-2">No scanned products yet. Tap "Scan Food Package" above to scan.</div>
        `;
      } else {
        recentScansContainer.innerHTML = state.history.slice(0, 3).map(item => `
          <div class="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 cursor-pointer transition-colors" onclick="app.loadFromHistory('${item.id}')">
            <div>
              <div class="text-xs font-medium text-zinc-200 line-clamp-1">${item.name}</div>
              <div class="text-[10px] text-zinc-500 font-mono">${item.brand} • ${item.date}</div>
            </div>
            <span class="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 text-[10px] font-mono">
              ${item.score}/100 (${item.grade})
            </span>
          </div>
        `).join("");
      }
    }
  },

  // -------------------------------------------------------------
  // Expiry Date & Pantry Manager
  // -------------------------------------------------------------
  setDefaultExpiryDate() {
    const input = document.getElementById("exp-item-date");
    if (input) {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      input.value = future.toISOString().split("T")[0];
    }
  },

  openAddExpiryModal(prefillName = "", prefillCategory = "Snacks & Bars") {
    document.getElementById("exp-item-name").value = prefillName;
    if (prefillCategory) document.getElementById("exp-item-category").value = prefillCategory;
    this.setDefaultExpiryDate();
    document.getElementById("add-expiry-modal").classList.remove("hidden");
  },

  closeAddExpiryModal() {
    document.getElementById("add-expiry-modal").classList.add("hidden");
  },

  saveExpiryItem(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("exp-item-name").value.trim();
    const category = document.getElementById("exp-item-category").value;
    const expiryDate = document.getElementById("exp-item-date").value;
    const reminderDays = parseInt(document.getElementById("exp-item-reminder").value || "2");

    if (!name || !expiryDate) {
      this.showToast("Please enter item name and expiry date.");
      return;
    }

    const newItem = {
      id: "exp-" + Date.now(),
      name,
      category,
      expiryDate,
      addedDate: new Date().toISOString().split("T")[0],
      reminderDays
    };

    state.expiryItems.unshift(newItem);
    localStorage.setItem("foodlens_expiry_items", JSON.stringify(state.expiryItems));

    this.closeAddExpiryModal();
    this.renderExpiryItems();
    this.renderHomeDashboard();
    this.showToast(`Saved "${name}" to Expiry Tracker`);
  },

  deleteExpiryItem(id) {
    state.expiryItems = state.expiryItems.filter(item => item.id !== id);
    localStorage.setItem("foodlens_expiry_items", JSON.stringify(state.expiryItems));
    this.renderExpiryItems();
    this.renderHomeDashboard();
    this.showToast("Item removed from pantry.");
  },

  addCurrentScanToExpiry() {
    if (!state.currentProductData) return;
    const name = state.currentProductData.productName || "Scanned Product";
    const cat = state.currentProductData.category || "Snacks & Bars";
    this.openAddExpiryModal(name, cat);
  },

  filterExpiry(filterType) {
    state.expiryFilter = filterType;
    document.querySelectorAll(".expiry-filter-btn").forEach(btn => {
      if (btn.dataset.filter === filterType) btn.classList.add("active", "bg-zinc-800", "text-zinc-100");
      else btn.classList.remove("active", "bg-zinc-800", "text-zinc-100");
    });
    this.renderExpiryItems();
  },

  renderExpiryItems() {
    const list = document.getElementById("expiry-items-list");
    if (!list) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let countAll = state.expiryItems.length;
    let countSoon = 0;
    let countFresh = 0;
    let countExpired = 0;

    const processed = state.expiryItems.map(item => {
      const exp = new Date(item.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

      let status = "FRESH";
      let statusLabel = `${diffDays} days left`;
      let badgeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";

      if (diffDays < 0) {
        status = "EXPIRED";
        statusLabel = `Expired ${Math.abs(diffDays)}d ago`;
        badgeClass = "bg-rose-500/10 border-rose-500/30 text-rose-400";
        countExpired++;
      } else if (diffDays <= 3) {
        status = "SOON";
        statusLabel = diffDays === 0 ? "Expires TODAY" : `${diffDays}d left`;
        badgeClass = "bg-amber-500/10 border-amber-500/30 text-amber-400";
        countSoon++;
      } else {
        countFresh++;
      }

      return { ...item, diffDays, status, statusLabel, badgeClass };
    });

    // Update Counter Badges
    document.getElementById("count-all").textContent = countAll;
    document.getElementById("count-soon").textContent = countSoon;
    document.getElementById("count-fresh").textContent = countFresh;
    document.getElementById("count-expired").textContent = countExpired;

    // Filter Items
    const filtered = processed.filter(item => {
      if (state.expiryFilter === "ALL") return true;
      return item.status === state.expiryFilter;
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-xs text-zinc-400">
          No items found in this filter. Tap "+ Add Item" to track a product.
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(item => `
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-zinc-100 truncate">${item.name}</span>
            <span class="rounded-full px-2 py-0.5 text-[9px] font-mono border font-semibold ${item.badgeClass}">
              ${item.statusLabel}
            </span>
          </div>
          <div class="text-[11px] text-zinc-400 font-mono flex items-center gap-3">
            <span>${item.category}</span>
            <span>•</span>
            <span>Exp: ${item.expiryDate}</span>
          </div>
        </div>

        <button class="h-8 w-8 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors" title="Remove" onclick="app.deleteExpiryItem('${item.id}')">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");
  },

  // -------------------------------------------------------------
  // Step-by-Step 3-Image Wizard
  // -------------------------------------------------------------
  updateWizardStep(stepNumber) {
    state.currentStep = stepNumber;

    const stepInfo = {
      1: {
        badge: "Step 1 of 3",
        title: "Capture Front Packaging",
        prompt: "Take or upload a clear photo of the <strong>Front Label</strong> (branding, product title, and marketing claims).",
        emptyLabel: "No front packaging photo yet"
      },
      2: {
        badge: "Step 2 of 3",
        title: "Capture Nutrition Facts Panel",
        prompt: "Take or upload a clear photo of the <strong>Nutrition Facts Table</strong> (calories, protein, carbs, fat, sodium).",
        emptyLabel: "No nutrition table photo yet"
      },
      3: {
        badge: "Step 3 of 3",
        title: "Capture Ingredients List",
        prompt: "Take or upload a clear photo of the <strong>Ingredients List</strong> (additives, preservatives, dyes, allergens).",
        emptyLabel: "No ingredients list photo yet"
      }
    };

    const cur = stepInfo[stepNumber];
    document.getElementById("step-badge").textContent = cur.badge;
    document.getElementById("step-title").textContent = cur.title;
    document.getElementById("step-instruction").innerHTML = cur.prompt;
    document.getElementById("step-prompt-label").textContent = cur.emptyLabel;

    // Stepper Bars
    for (let i = 1; i <= 3; i++) {
      const bar = document.getElementById(`step-bar-${i}`);
      if (bar) {
        bar.className = i <= stepNumber ? "h-1.5 rounded-full bg-emerald-500 transition-all" : "h-1.5 rounded-full bg-zinc-800 transition-all";
      }
    }

    // Active Slot Preview
    const curImg = state.images[stepNumber];
    const placeholder = document.getElementById("active-step-placeholder");
    const previewWrap = document.getElementById("active-step-preview-wrap");
    const activeImg = document.getElementById("active-step-img");

    if (curImg && curImg.url) {
      placeholder.classList.add("hidden");
      previewWrap.classList.remove("hidden");
      activeImg.src = curImg.url;
    } else {
      placeholder.classList.remove("hidden");
      previewWrap.classList.add("hidden");
      activeImg.src = "";
    }

    // Thumbnails Overview
    for (let i = 1; i <= 3; i++) {
      const thumbCard = document.getElementById(`thumb-step-${i}`);
      const thumbBox = document.getElementById(`thumb-box-${i}`);
      if (thumbCard) {
        if (i === stepNumber) thumbCard.classList.add("active");
        else thumbCard.classList.remove("active");
      }

      if (thumbBox) {
        const imgObj = state.images[i];
        if (imgObj && imgObj.url) {
          thumbBox.innerHTML = `<img src="${imgObj.url}" class="thumb-img" alt="Angle ${i}" />`;
        } else {
          thumbBox.innerHTML = `<span class="text-[10px] text-zinc-500">Empty</span>`;
        }
      }
    }

    // Prev / Next button labels
    const prevBtn = document.getElementById("wizard-prev-btn");
    const nextBtnText = document.getElementById("wizard-next-text");
    const nextBtnIcon = document.getElementById("wizard-next-icon");
    if (prevBtn) prevBtn.disabled = (stepNumber === 1);
    if (nextBtnText) {
      nextBtnText.textContent = (stepNumber === 3) ? "Analyze Label" : "Next Step";
    }
    if (nextBtnIcon) {
      nextBtnIcon.className = (stepNumber === 3) ? "hidden" : "w-3.5 h-3.5";
    }
  },

  jumpToStep(step) {
    this.updateWizardStep(step);
  },

  nextStep() {
    if (state.currentStep < 3) {
      this.updateWizardStep(state.currentStep + 1);
    } else {
      this.runAnalysis();
    }
  },

  prevStep() {
    if (state.currentStep > 1) {
      this.updateWizardStep(state.currentStep - 1);
    }
  },

  resetWizard() {
    state.images = { 1: null, 2: null, 3: null };
    this.updateWizardStep(1);
    this.showToast("Wizard cleared. Ready for new capture.");
  },

  // -------------------------------------------------------------
  // File Upload Handling
  // -------------------------------------------------------------
  handleFile(file, stepNumber) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fullUrl = e.target.result;
      const base64Data = fullUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      state.images[stepNumber] = {
        url: fullUrl,
        base64: base64Data,
        mimeType: mimeType
      };

      this.updateWizardStep(stepNumber);
      this.showToast(`Angle ${stepNumber} photo added`);
    };
    reader.readAsDataURL(file);
  },

  // -------------------------------------------------------------
  // Live Camera
  // -------------------------------------------------------------
  openCamera() {
    const modal = document.getElementById("live-camera-modal");
    const video = document.getElementById("camera-stream-video");
    modal.classList.remove("hidden");

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.warn("Camera fallback:", err);
        this.showToast("Camera access unavailable. Please use upload.");
        this.closeCamera();
      });
  },

  closeCamera() {
    const modal = document.getElementById("live-camera-modal");
    const video = document.getElementById("camera-stream-video");
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    modal.classList.add("hidden");
  },

  snapCamera() {
    const video = document.getElementById("camera-stream-video");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const fullUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64Data = fullUrl.split(",")[1];

    state.images[state.currentStep] = {
      url: fullUrl,
      base64: base64Data,
      mimeType: "image/jpeg"
    };

    this.closeCamera();
    this.updateWizardStep(state.currentStep);
    this.showToast(`Angle ${state.currentStep} photo captured`);
  },

  // -------------------------------------------------------------
  // Gemini Vision Analysis
  // -------------------------------------------------------------
  async runAnalysis() {
    const hasAnyImage = state.images[1] || state.images[2] || state.images[3];
    if (!hasAnyImage) {
      this.showToast("Please capture or upload at least 1 photo first.");
      return;
    }

    const spinner = document.getElementById("analyze-spinner");
    const btnText = document.getElementById("wizard-next-text");
    if (spinner) spinner.classList.remove("hidden");
    if (btnText) btnText.textContent = "Analyzing...";

    try {
      if (!state.gemini.apiKey) {
        document.getElementById("settings-modal").classList.remove("hidden");
        this.showToast("Please enter your Gemini API Key in Settings to run Vision AI.");
        if (spinner) spinner.classList.add("hidden");
        if (btnText) btnText.textContent = (state.currentStep === 3) ? "Analyze Label" : "Next Step";
        return;
      }

      await this.callGeminiVisionApi();
      this.switchTab("analysis-tab");
      this.showToast("Analysis Complete");
    } catch (err) {
      console.error(err);
      this.showToast(`Analysis error: ${err.message || "Could not process image"}`);
    } finally {
      if (spinner) spinner.classList.add("hidden");
      if (btnText) btnText.textContent = (state.currentStep === 3) ? "Analyze Label" : "Next Step";
    }
  },

  async callGeminiVisionApi() {
    const apiKey = state.gemini.apiKey;
    const model = state.gemini.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `
You are FoodLens AI, an expert food label OCR and nutritional intelligence engine.
Examine the uploaded image carefully.

CRITICAL FIRST STEP:
Determine if the image contains an actual packaged food product, nutrition facts panel, food ingredient list, or edible grocery item.
- If the image is NOT a food product or food label (for example: random objects, pets, computers, clothing, receipts, documents, furniture, vehicles, scenery, people):
  Return strictly:
  {
    "isFoodProduct": false,
    "rejectionReason": "Specific description of what was detected instead of a food item (e.g., 'Image shows a computer screen / clothing / furniture rather than a packaged food item. Please photograph food packaging or nutrition label.')"
  }

- If the image IS a valid food product/label:
  Extract accurate facts and return strictly:
  {
    "isFoodProduct": true,
    "rejectionReason": "",
    "productName": "Exact product name (or best guess from label)",
    "brand": "Brand or Manufacturer name",
    "category": "Food category (e.g. Snack Bars, Cereals, Beverages, Dairy, Meals)",
    "servingSize": "Serving size string (e.g. 50g / 1 bar)",
    "servingsPerPackage": 1.0,
    "frontClaims": ["Claim 1", "Claim 2"],
    "nutrition": {
      "calories": 200,
      "protein": 10.0,
      "carbohydrates": 25.0,
      "sugar": 5.0,
      "addedSugar": 2.0,
      "fiber": 4.0,
      "fat": 6.0,
      "saturatedFat": 1.5,
      "sodium": 200.0
    },
    "ingredients": "Full comma-separated ingredients list"
  }

Return STRICT VALID JSON ONLY without markdown formatting or code fences.`;

    const parts = [{ text: promptText }];

    for (let i = 1; i <= 3; i++) {
      if (state.images[i] && state.images[i].base64) {
        parts.push({
          inline_data: {
            mime_type: state.images[i].mimeType || "image/jpeg",
            data: state.images[i].base64
          }
        });
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API returned ${res.status}: ${errBody}`);
    }

    const jsonRes = await res.json();
    const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No response content received from Gemini.");

    const parsedData = JSON.parse(rawText);

    // Non-food verification check
    if (parsedData.isFoodProduct === false) {
      document.getElementById("no-report-state").classList.add("hidden");
      document.getElementById("report-view").classList.add("hidden");
      const invalidState = document.getElementById("invalid-food-state");
      if (invalidState) {
        invalidState.classList.remove("hidden");
        document.getElementById("invalid-food-reason").textContent = parsedData.rejectionReason || "The uploaded image does not contain a recognizable food product, nutrition label, or ingredients list.";
      }
      this.switchTab("analysis-tab");
      this.showToast("Non-food image rejected.");
      return;
    }

    this.processAndSaveProduct(parsedData);
  },

  // -------------------------------------------------------------
  // Deterministic 4-Pillar Scoring Engine
  // -------------------------------------------------------------
  processAndSaveProduct(product) {
    state.currentProductData = product;

    // 1. Nutrition Quality Score (0-100)
    const n = product.nutrition || {};
    let nutScore = 65;
    const protein = parseFloat(n.protein || 0);
    const fiber = parseFloat(n.fiber || 0);
    const sugar = parseFloat(n.sugar || 0);
    const satFat = parseFloat(n.saturatedFat || 0);
    const sodium = parseFloat(n.sodium || 0);

    if (protein >= 15) nutScore += 15;
    else if (protein >= 8) nutScore += 8;

    if (fiber >= 5) nutScore += 10;
    else if (fiber >= 2.5) nutScore += 5;

    if (sugar >= 15) nutScore -= 20;
    else if (sugar >= 8) nutScore -= 10;

    if (satFat >= 6) nutScore -= 12;
    if (sodium >= 600) nutScore -= 15;
    nutScore = Math.max(10, Math.min(100, Math.round(nutScore)));

    // 2. Ingredient Integrity Score (0-100)
    const ingText = (product.ingredients || "").toLowerCase();
    let ingScore = 90;
    const watchlist = [
      { key: "high fructose corn syrup", penalty: 20, reason: "High-fructose corn syrup spikes insulin and increases visceral fat." },
      { key: "palm oil", penalty: 12, reason: "High in saturated palmitic acid." },
      { key: "hydrogenated", penalty: 25, reason: "Contains artificial trans fats." },
      { key: "sodium benzoate", penalty: 12, reason: "Synthetic preservative with chemical benzene risk." },
      { key: "aspartame", penalty: 10, reason: "Artificial non-nutritive sweetener." },
      { key: "sucralose", penalty: 8, reason: "Artificial chlorinated sweetener." },
      { key: "msg", penalty: 10, reason: "Monosodium glutamate flavor enhancer." },
      { key: "yellow 5", penalty: 15, reason: "Synthetic azo dye (Tartrazine)." },
      { key: "yellow 6", penalty: 15, reason: "Synthetic petroleum-derived dye." },
      { key: "red 40", penalty: 15, reason: "Allura Red synthetic dye." },
      { key: "tbhq", penalty: 20, reason: "Synthetic antioxidant preservative (TBHQ)." },
      { key: "bht", penalty: 18, reason: "Chemical preservative (BHT)." }
    ];

    const flagged = [];
    watchlist.forEach(w => {
      if (ingText.includes(w.key)) {
        ingScore -= w.penalty;
        flagged.push(w);
      }
    });
    ingScore = Math.max(10, Math.min(100, Math.round(ingScore)));

    // 3. Personal Match Score (0-100)
    let matchScore = 85;
    const goal = state.profile.userGoal;
    if (goal === "MUSCLE_GAIN") {
      if (protein >= 18) matchScore += 15;
      else if (protein < 6) matchScore -= 25;
    } else if (goal === "WEIGHT_LOSS") {
      if (sugar > 10) matchScore -= 20;
      if (parseFloat(n.calories || 0) > 300) matchScore -= 10;
    } else if (goal === "DIABETIC_FRIENDLY") {
      if (sugar > 5 || ingText.includes("maltodextrin")) matchScore -= 30;
    } else if (goal === "HEART_HEALTH") {
      if (sodium > 400 || satFat > 4) matchScore -= 25;
    }

    // Check allergies
    state.profile.allergies.forEach(allg => {
      if (allg.trim() && ingText.includes(allg.toLowerCase().trim())) {
        matchScore = 0;
      }
    });
    matchScore = Math.max(0, Math.min(100, Math.round(matchScore)));

    // 4. Value Index
    const price = product.priceUsd || 3.49;
    const costPer10gProtein = (price / Math.max(0.1, protein)) * 10;
    const valueScore = Math.max(30, Math.min(95, Math.round(80 - (costPer10gProtein * 5))));

    // Overall FoodLens Index
    const overall = Math.round((nutScore * 0.4) + (ingScore * 0.3) + (matchScore * 0.2) + (valueScore * 0.1));
    const grade = overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 50 ? "C" : "D";

    // 5. Marketing Claims Buster
    const claims = product.frontClaims || [];
    const verifiedClaims = claims.map(c => {
      const cLow = String(c).toLowerCase();
      let isValid = true;
      let reason = "Verified against extracted nutrition and ingredients.";

      if (cLow.includes("zero sugar") || cLow.includes("sugar free")) {
        if (sugar > 1 || ingText.includes("maltodextrin") || ingText.includes("high fructose")) {
          isValid = false;
          reason = "Contains hidden high-glycemic starches or detectable sugar.";
        }
      } else if (cLow.includes("protein")) {
        if (protein < 10) {
          isValid = false;
          reason = `Contains only ${protein}g protein, below standard high-protein density benchmarks.`;
        }
      } else if (cLow.includes("natural")) {
        if (flagged.length > 0) {
          isValid = false;
          reason = `Contains ${flagged.length} chemical additives or synthetic colorings.`;
        }
      }

      return { claim: c, isValid, reason };
    });

    // Save into history
    const historyEntry = {
      id: "scan-" + Date.now(),
      name: product.productName || "Scanned Product",
      brand: product.brand || "Brand",
      score: overall,
      grade: grade,
      date: new Date().toLocaleDateString(),
      data: product
    };
    state.history.unshift(historyEntry);
    if (state.history.length > 10) state.history.pop();
    localStorage.setItem("foodlens_history", JSON.stringify(state.history));
    this.renderHomeDashboard();

    // Render Full Report
    this.renderAnalysisReport({
      product,
      scores: { overall, grade, nutScore, ingScore, matchScore, valueScore },
      flagged,
      verifiedClaims,
      costPer10gProtein
    });
  },

  renderAnalysisReport(data) {
    const { product, scores, flagged, verifiedClaims, costPer10gProtein } = data;
    const n = product.nutrition || {};

    const invalidState = document.getElementById("invalid-food-state");
    if (invalidState) invalidState.classList.add("hidden");

    document.getElementById("no-report-state").classList.add("hidden");
    document.getElementById("report-view").classList.remove("hidden");

    // Product Info
    document.getElementById("card-brand").textContent = product.brand || "Food Label";
    document.getElementById("card-category").textContent = product.category || "Packaged Product";
    document.getElementById("card-name").textContent = product.productName || "Scanned Food Product";
    document.getElementById("card-serving").textContent = `Serving: ${product.servingSize || "1 pack"}`;
    document.getElementById("card-servings-pack").textContent = `${product.servingsPerPackage || "1.0"} servings`;

    // Score & Verdict
    document.getElementById("score-val").textContent = scores.overall;
    document.getElementById("grade-badge").textContent = `Grade ${scores.grade}`;

    const verdict = scores.overall >= 80 ? "Nutritious & Clean" : scores.overall >= 65 ? "Moderate Daily Option" : scores.overall >= 50 ? "Consume in Moderation" : "Ultra-Processed Warning";
    document.getElementById("verdict-val").textContent = verdict;

    const gradeWrap = document.getElementById("grade-badge-wrap");
    if (gradeWrap) {
      if (scores.overall >= 80) {
        gradeWrap.className = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      } else if (scores.overall >= 65) {
        gradeWrap.className = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 font-mono border border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
      } else if (scores.overall >= 50) {
        gradeWrap.className = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400";
      } else {
        gradeWrap.className = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 font-mono border border-rose-500/30 bg-rose-500/10 text-rose-400";
      }
    }

    // Key Nutrients Ribbon (Clean Horizontal Row, No Boxes)
    const nutGrid = document.getElementById("nutrition-facts-grid");
    if (nutGrid) {
      nutGrid.innerHTML = `
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Calories</span><span class="font-mono font-bold text-zinc-100 text-xs">${n.calories || 0}</span></div>
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Protein</span><span class="font-mono font-bold text-emerald-400 text-xs">${n.protein || 0}g</span></div>
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Carbs</span><span class="font-mono font-bold text-cyan-400 text-xs">${n.carbohydrates || 0}g</span></div>
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Sugar</span><span class="font-mono font-bold text-zinc-300 text-xs">${n.sugar || 0}g</span></div>
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Fiber</span><span class="font-mono font-bold text-purple-400 text-xs">${n.fiber || 0}g</span></div>
        <div class="flex-1 px-1"><span class="text-[10px] text-zinc-400 block font-medium">Sodium</span><span class="font-mono font-bold text-amber-400 text-xs">${n.sodium || 0}mg</span></div>
      `;
    }

    // 4 Pillars Progress Lines
    document.getElementById("p1-score").textContent = `${scores.nutScore}/100`;
    document.getElementById("p1-bar").style.width = `${scores.nutScore}%`;
    document.getElementById("p1-desc").textContent = `Protein: ${n.protein || 0}g • Fiber: ${n.fiber || 0}g • Sugar: ${n.sugar || 0}g`;

    document.getElementById("p2-score").textContent = `${scores.ingScore}/100`;
    document.getElementById("p2-bar").style.width = `${scores.ingScore}%`;
    document.getElementById("p2-desc").textContent = flagged.length > 0 ? `${flagged.length} additives flagged in watchlist.` : "Clean formulation, zero additives flagged.";

    document.getElementById("p3-score").textContent = `${scores.matchScore}/100`;
    document.getElementById("p3-bar").style.width = `${scores.matchScore}%`;
    document.getElementById("p3-desc").textContent = `Calculated for your ${state.profile.userGoal.replace('_', ' ')} profile.`;

    document.getElementById("p4-score").textContent = `${scores.valueScore}/100`;
    document.getElementById("p4-bar").style.width = `${scores.valueScore}%`;
    document.getElementById("p4-desc").textContent = `$${costPer10gProtein.toFixed(2)} / 10g protein • ${scores.valueScore >= 75 ? 'Great Value' : 'Fair Value'}`;

    // Claims Buster
    const claimsWrap = document.getElementById("claims-list-wrap");
    if (verifiedClaims.length > 0) {
      claimsWrap.innerHTML = verifiedClaims.map(c => `
        <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold text-zinc-100">"${c.claim}"</span>
            <span class="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${c.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
              ${c.isValid ? 'Verified' : 'Misleading'}
            </span>
          </div>
          <p class="text-[11px] text-zinc-400 leading-tight">${c.reason}</p>
        </div>
      `).join("");
    } else {
      claimsWrap.innerHTML = `<div class="text-[11px] text-zinc-500">No front-of-package marketing slogans detected.</div>`;
    }

    // Ingredients & Watchlist
    document.getElementById("raw-ingredients-text").textContent = product.ingredients || "No ingredients listed.";
    const flagWrap = document.getElementById("flagged-ingredients-wrap");
    if (flagged.length > 0) {
      flagWrap.innerHTML = flagged.map(f => `
        <div class="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs">
          <span class="font-semibold text-rose-400 block text-[11px]">${f.key.toUpperCase()}</span>
          <span class="text-zinc-400 text-[10px] mt-0.5">${f.reason}</span>
        </div>
      `).join("");
    } else {
      flagWrap.innerHTML = `<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-emerald-400">Clean ingredient formulation. No flagged additives found.</div>`;
    }

    // Reset Chat Messages for this product
    this.resetProductChat(product);
  },

  resetProductChat(product) {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;
    const prodName = product.productName || "this product";
    container.innerHTML = `
      <div class="flex items-start gap-2">
        <div class="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
          AI
        </div>
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-200 leading-relaxed max-w-[88%]">
          I've analyzed <strong>${prodName}</strong>. Ask me anything about its ingredients, additives, suitability for your diet, or healthier alternatives!
        </div>
      </div>
    `;
  },

  sendQuickPrompt(promptText) {
    const input = document.getElementById("chat-input-text");
    if (input) {
      input.value = promptText;
      this.handleChatSubmit();
    }
  },

  async handleChatSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("chat-input-text");
    const container = document.getElementById("chat-messages-container");
    const query = (input ? input.value : "").trim();
    if (!query) return;

    if (input) input.value = "";

    // 1. Append User Message
    const userMsgHtml = `
      <div class="flex items-start justify-end gap-2">
        <div class="rounded-xl bg-zinc-800 border border-zinc-700/80 p-2.5 text-xs text-zinc-100 leading-relaxed max-w-[85%]">
          ${this.escapeHtml(query)}
        </div>
        <div class="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
          You
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", userMsgHtml);

    // 2. Append Loading Placeholder
    const loadingId = "chat-loading-" + Date.now();
    const loadingHtml = `
      <div id="${loadingId}" class="flex items-start gap-2">
        <div class="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
          AI
        </div>
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-400 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Analyzing context...</span>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", loadingHtml);
    container.scrollTop = container.scrollHeight;

    // 3. Formulate Prompt with complete report context
    try {
      const p = state.currentProductData || {};
      const n = p.nutrition || {};
      const apiKey = state.gemini.apiKey;
      const model = state.gemini.model || "gemini-2.5-flash";

      if (!apiKey) {
        throw new Error("Please configure your Gemini API Key in Settings to chat with AI.");
      }

      const systemContext = `
You are FoodLens AI, a specialized nutrition intelligence assistant.
The user is inspecting the following food product:
Product: ${p.productName || "Unknown"} (Brand: ${p.brand || "Unknown"}, Category: ${p.category || "General"})
Serving: ${p.servingSize || "1 serving"}
Nutrition Facts:
- Calories: ${n.calories || 0} kcal
- Protein: ${n.protein || 0}g
- Carbohydrates: ${n.carbohydrates || 0}g (Sugar: ${n.sugar || 0}g, Added Sugar: ${n.addedSugar || 0}g, Fiber: ${n.fiber || 0}g)
- Fat: ${n.fat || 0}g (Saturated Fat: ${n.saturatedFat || 0}g)
- Sodium: ${n.sodium || 0}mg

Ingredients List:
${p.ingredients || "Not listed"}

User Health Profile:
- Goal: ${state.profile.userGoal}
- Diet Preference: ${state.profile.dietPreference}
- Allergies: ${(state.profile.allergies || []).join(", ") || "None"}

Please answer the user's question concisely, objectively, and scientifically based strictly on the product label and nutrition facts. Use clean, formatted paragraphs or bullet points without complex markdown tables. Keep answers under 120 words unless detailed recipe advice is requested.
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemContext },
                { text: `User Question: ${query}` }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`API Error ${res.status}: ${errTxt}`);
      }

      const resJson = await res.json();
      const answer = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "I could not generate an answer for this product.";

      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = `
          <div class="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            AI
          </div>
          <div class="rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs text-zinc-200 leading-relaxed max-w-[88%] whitespace-pre-wrap">
            ${this.formatChatResponse(answer)}
          </div>
        `;
      }
    } catch (err) {
      console.error("Chat error:", err);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = `
          <div class="h-6 w-6 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            !
          </div>
          <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 leading-relaxed max-w-[88%]">
            ${err.message || "Could not connect to Gemini."}
          </div>
        `;
      }
    }
    container.scrollTop = container.scrollHeight;
  },

  formatChatResponse(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  loadFromHistory(id) {
    const item = state.history.find(h => h.id === id);
    if (!item) return;
    this.processAndSaveProduct(item.data);
    this.switchTab("analysis-tab");
  },

  // -------------------------------------------------------------
  // Profile & Settings
  // -------------------------------------------------------------
  loadProfile() {
    const saved = localStorage.getItem("foodlens_profile");
    if (saved) {
      try {
        state.profile = JSON.parse(saved);
        const radio = document.querySelector(`input[name="userGoal"][value="${state.profile.userGoal}"]`);
        if (radio) radio.checked = true;
        document.getElementById("profile-diet-select").value = state.profile.dietPreference || "NO_PREFERENCE";
        document.getElementById("profile-allergies-input").value = (state.profile.allergies || []).join(", ");
      } catch (e) {}
    }
  },

  saveProfile(e) {
    if (e) e.preventDefault();
    const form = document.getElementById("health-profile-form");
    const formData = new FormData(form);
    state.profile.userGoal = formData.get("userGoal") || "MUSCLE_GAIN";
    state.profile.dietPreference = document.getElementById("profile-diet-select").value;
    state.profile.allergies = document.getElementById("profile-allergies-input").value.split(",").map(s => s.trim()).filter(Boolean);

    localStorage.setItem("foodlens_profile", JSON.stringify(state.profile));
    this.renderHomeDashboard();
    this.showToast("Health Profile Saved");

    if (state.currentProductData) {
      this.processAndSaveProduct(state.currentProductData);
    }
  },

  updateApiBadge() {
    const dot = document.getElementById("api-indicator-dot");
    const label = document.getElementById("api-btn-label");
    const modelLabel = document.getElementById("profile-model-label");
    if (modelLabel) {
      modelLabel.textContent = state.gemini.model || "gemini-2.5-flash";
    }
    if (dot && label) {
      if (state.gemini.apiKey) {
        dot.className = "w-2 h-2 rounded-full bg-emerald-500";
        label.textContent = "API Configured";
      } else {
        dot.className = "w-2 h-2 rounded-full bg-amber-500";
        label.textContent = "Set API Key";
      }
    }
  },

  // -------------------------------------------------------------
  // Mobile Push Notification Settings (Active / Deactive)
  // -------------------------------------------------------------
  checkNotificationPermission() {
    const badge = document.getElementById("notif-permission-badge");
    const btn = document.getElementById("btn-request-notif-perm");
    const subtext = document.getElementById("notif-subtext-status");
    const expToggle = document.getElementById("toggle-expiry-alerts");
    const digestToggle = document.getElementById("toggle-daily-digest");

    if (expToggle) expToggle.checked = state.notifications.expiryAlerts;
    if (digestToggle) digestToggle.checked = state.notifications.dailyDigest;

    if (!("Notification" in window)) {
      if (badge) {
        badge.textContent = "Unsupported";
        badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 text-zinc-500";
      }
      if (btn) {
        btn.textContent = "Unsupported";
        btn.disabled = true;
      }
      return;
    }

    const browserPerm = Notification.permission;

    if (browserPerm === "denied") {
      if (badge) {
        badge.textContent = "Blocked in Browser";
        badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold";
      }
      if (btn) {
        btn.textContent = "Blocked";
        btn.className = "h-7 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold text-xs opacity-60 cursor-not-allowed";
        btn.disabled = true;
      }
      if (subtext) subtext.textContent = "Permission blocked in browser settings";
      return;
    }

    // If notifications are actively enabled by user
    if (state.notifications.enabled && browserPerm === "granted") {
      if (badge) {
        badge.textContent = "Active";
        badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold";
      }
      if (btn) {
        btn.textContent = "Deactivate";
        btn.className = "h-7 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs shadow-sm transition-colors";
        btn.disabled = false;
      }
      if (subtext) subtext.textContent = "Alerts are currently active";
      if (expToggle) expToggle.disabled = false;
      if (digestToggle) digestToggle.disabled = false;
    } else {
      // Notifications are deactivated or not yet granted
      if (badge) {
        badge.textContent = "Deactivated";
        badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400";
      }
      if (btn) {
        btn.textContent = "Activate";
        btn.className = "h-7 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-sm transition-colors";
        btn.disabled = false;
      }
      if (subtext) subtext.textContent = "Alerts are paused/muted";
      if (expToggle) expToggle.disabled = true;
      if (digestToggle) digestToggle.disabled = true;
    }
  },

  async toggleNotificationMaster() {
    if (!("Notification" in window)) {
      this.showToast("Notifications are not supported in this browser.");
      return;
    }

    // If currently enabled, deactivate it
    if (state.notifications.enabled && Notification.permission === "granted") {
      state.notifications.enabled = false;
      localStorage.setItem("foodlens_notif_enabled", "false");
      this.checkNotificationPermission();
      this.showToast("Mobile notifications deactivated.");
      return;
    }

    // If currently disabled, request permission if needed and activate
    try {
      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
      }

      if (perm === "granted") {
        state.notifications.enabled = true;
        localStorage.setItem("foodlens_notif_enabled", "true");
        this.checkNotificationPermission();
        this.showToast("Mobile notifications activated!");
        this.sendTestNotification();
      } else {
        state.notifications.enabled = false;
        localStorage.setItem("foodlens_notif_enabled", "false");
        this.checkNotificationPermission();
        this.showToast("Notification permission was not granted.");
      }
    } catch (e) {
      console.warn("Notification error:", e);
      this.showToast("Could not activate notifications.");
    }
  },

  sendTestNotification() {
    if (!state.notifications.enabled) {
      this.showToast("Cannot send alert: Notifications are deactivated.");
      return;
    }

    const title = "FoodLens Pantry Alert";
    const body = "Your food item will expire in 2 days. Use it soon!";

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=96&auto=format&fit=crop&q=80"
      });
      this.showToast("Sent device notification!");
    } else {
      this.showToast(`In-App Notification: ${body}`);
    }
  },

  clearHistory() {
    state.history = [];
    localStorage.removeItem("foodlens_history");
    this.renderHomeDashboard();
    this.showToast("Scan history cleared.");
  },

  resetPantryData() {
    state.expiryItems = [];
    localStorage.removeItem("foodlens_expiry_items");
    this.renderExpiryItems();
    this.renderHomeDashboard();
    this.showToast("Pantry database cleared.");
  },

  // -------------------------------------------------------------
  // Listeners Setup
  // -------------------------------------------------------------
  setupEventListeners() {
    document.querySelectorAll(".mob-tab").forEach(btn => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById("wizard-next-btn").addEventListener("click", () => this.nextStep());
    document.getElementById("wizard-prev-btn").addEventListener("click", () => this.prevStep());
    document.getElementById("reset-wizard-btn").addEventListener("click", () => this.resetWizard());

    const fileInput = document.getElementById("current-step-file-input");
    fileInput.addEventListener("change", (e) => this.handleFile(e.target.files[0], state.currentStep));

    document.getElementById("btn-snap-camera").addEventListener("click", () => this.openCamera());
    document.getElementById("close-camera-modal-btn").addEventListener("click", () => this.closeCamera());
    document.getElementById("shutter-btn").addEventListener("click", () => this.snapCamera());

    // Expiry Modal Listeners
    document.getElementById("close-expiry-modal-btn").addEventListener("click", () => this.closeAddExpiryModal());
    document.getElementById("cancel-expiry-btn").addEventListener("click", () => this.closeAddExpiryModal());
    document.getElementById("add-expiry-form").addEventListener("submit", (e) => this.saveExpiryItem(e));

    // Settings Modal Listeners
    document.getElementById("open-api-modal").addEventListener("click", () => {
      document.getElementById("input-api-key").value = state.gemini.apiKey;
      document.getElementById("select-gemini-model").value = state.gemini.model;
      this.checkNotificationPermission();
      document.getElementById("settings-modal").classList.remove("hidden");
    });

    document.getElementById("close-settings-modal-btn").addEventListener("click", () => {
      document.getElementById("settings-modal").classList.add("hidden");
    });

    // Notification Master Toggle Button & Sub-Checkboxes
    document.getElementById("btn-request-notif-perm").addEventListener("click", () => this.toggleNotificationMaster());
    document.getElementById("btn-test-notification").addEventListener("click", () => this.sendTestNotification());

    const expToggle = document.getElementById("toggle-expiry-alerts");
    if (expToggle) {
      expToggle.addEventListener("change", (e) => {
        state.notifications.expiryAlerts = e.target.checked;
        localStorage.setItem("foodlens_notif_expiry", e.target.checked ? "true" : "false");
        this.showToast(e.target.checked ? "Expiry warnings enabled." : "Expiry warnings muted.");
      });
    }

    const digestToggle = document.getElementById("toggle-daily-digest");
    if (digestToggle) {
      digestToggle.addEventListener("change", (e) => {
        state.notifications.dailyDigest = e.target.checked;
        localStorage.setItem("foodlens_notif_digest", e.target.checked ? "true" : "false");
        this.showToast(e.target.checked ? "Daily digest enabled." : "Daily digest muted.");
      });
    }

    document.getElementById("save-api-btn").addEventListener("click", () => {
      const key = document.getElementById("input-api-key").value.trim();
      const model = document.getElementById("select-gemini-model").value;
      state.gemini.apiKey = key;
      state.gemini.model = model;
      localStorage.setItem("foodlens_gemini_key", key);
      localStorage.setItem("foodlens_gemini_model", model);
      this.updateApiBadge();
      document.getElementById("settings-modal").classList.add("hidden");
      this.showToast("Settings Saved");
    });

    document.getElementById("clear-api-btn").addEventListener("click", () => {
      state.gemini.apiKey = "";
      localStorage.removeItem("foodlens_gemini_key");
      this.updateApiBadge();
      document.getElementById("input-api-key").value = "";
      this.showToast("API Key Cleared");
    });

    // Product Chat Form Listener
    const chatForm = document.getElementById("product-chat-form");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => this.handleChatSubmit(e));
    }

    document.getElementById("health-profile-form").addEventListener("submit", (e) => this.saveProfile(e));
  },

  showToast(msg) {
    const t = document.getElementById("toast-el");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2800);
  }
};

document.addEventListener("DOMContentLoaded", () => app.init());
