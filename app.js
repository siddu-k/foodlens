/**
 * FoodLens AI — Production Mobile Client
 * Pure SVG Icons, Spacious Layout, Homepage Dashboard, Expiry Date Pantry Tracker,
 * 3-Step Label Scanner, Gemini Vision API, and Deterministic 4-Pillar Scoring Engine.
 */

// Default Initial Expiry Items for Pantry Tracking (Empty by default)
const INITIAL_EXPIRY_ITEMS = [];

// Resolve model (auto-migrate deprecated models)
let initialModel = localStorage.getItem("foodlens_gemini_model") || "gemini-2.5-flash";
if (initialModel === "gemini-2.5-flash-lite") {
  initialModel = "gemini-2.5-flash";
  localStorage.setItem("foodlens_gemini_model", "gemini-2.5-flash");
}

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
    allergies: [],
    healthConditions: []
  },
  notifications: {
    enabled: localStorage.getItem("foodlens_notif_enabled") !== "false", // Default true
    expiryAlerts: localStorage.getItem("foodlens_notif_expiry") !== "false",
    dailyDigest: localStorage.getItem("foodlens_notif_digest") !== "false"
  },
  gemini: {
    apiKey: localStorage.getItem("foodlens_gemini_key") || "",
    model: initialModel
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
          <div class="text-xs text-zinc-500 py-1.5">
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
  // -------------------------------------------------------------
  // Live Camera with Hardware & Digital Zoom
  // -------------------------------------------------------------
  openCamera() {
    const modal = document.getElementById("live-camera-modal");
    const video = document.getElementById("camera-stream-video");
    modal.classList.remove("hidden");
    this.setCameraZoom(1.0);

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
      .then((stream) => {
        video.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        this.cameraTrack = track;
        video.play();
      })
      .catch((err) => {
        console.warn("Camera fallback:", err);
        this.showToast("Camera access unavailable. Please use upload.");
        this.closeCamera();
      });
  },

  setCameraZoom(zoomLevel) {
    const clamped = Math.min(Math.max(parseFloat(zoomLevel) || 1.0, 1.0), 3.0);
    state.cameraZoom = clamped;

    const badge = document.getElementById("zoom-level-badge");
    const slider = document.getElementById("cam-zoom-slider");
    const video = document.getElementById("camera-stream-video");

    if (badge) badge.textContent = `${clamped.toFixed(1)}x`;
    if (slider) slider.value = clamped;
    if (video) video.style.transform = `scale(${clamped})`;

    // Highlight active preset button
    document.querySelectorAll(".cam-zoom-btn").forEach(btn => {
      const bZ = parseFloat(btn.dataset.zoom);
      if (Math.abs(bZ - clamped) < 0.15) {
        btn.className = "cam-zoom-btn active text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-500 text-zinc-950 shadow-sm transition-all";
      } else {
        btn.className = "cam-zoom-btn text-xs font-mono font-bold px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white transition-all";
      }
    });
  },

  closeCamera() {
    const modal = document.getElementById("live-camera-modal");
    const video = document.getElementById("camera-stream-video");
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    this.cameraTrack = null;
    modal.classList.add("hidden");
  },

  snapCamera() {
    const video = document.getElementById("camera-stream-video");
    const viewport = document.getElementById("cam-viewport");
    const focusBox = document.getElementById("scanner-focus-box");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!video || !viewport || !focusBox) {
      this.closeCamera();
      return;
    }

    const videoW = video.videoWidth || 1280;
    const videoH = video.videoHeight || 720;

    const z = state.cameraZoom || 1.0;
    const vpRect = viewport.getBoundingClientRect();
    const boxRect = focusBox.getBoundingClientRect();

    const viewW = vpRect.width || viewport.clientWidth;
    const viewH = vpRect.height || viewport.clientHeight;

    // Calculate exact object-fit: cover scaling and positioning of the video
    const renderScale = Math.max(viewW / videoW, viewH / videoH);
    const renderW = videoW * renderScale;
    const renderH = videoH * renderScale;
    const offsetX = (viewW - renderW) / 2;
    const offsetY = (viewH - renderH) / 2;

    // Exact pixel coordinates inside the green border (accounting for 2px border)
    const boxLeft = Math.max(0, (boxRect.left - vpRect.left) + 2);
    const boxTop = Math.max(0, (boxRect.top - vpRect.top) + 2);
    const boxRight = Math.min(viewW, (boxRect.right - vpRect.left) - 2);
    const boxBottom = Math.min(viewH, (boxRect.bottom - vpRect.top) - 2);

    // Map screen coordinates back through CSS scale(z) centered at viewport center
    const mapCoordX = (pX) => (((pX - viewW / 2) / z + viewW / 2) - offsetX) / renderScale;
    const mapCoordY = (pY) => (((pY - viewH / 2) / z + viewH / 2) - offsetY) / renderScale;

    const x1 = Math.max(0, Math.min(videoW, mapCoordX(boxLeft)));
    const y1 = Math.max(0, Math.min(videoH, mapCoordY(boxTop)));
    const x2 = Math.max(0, Math.min(videoW, mapCoordX(boxRight)));
    const y2 = Math.max(0, Math.min(videoH, mapCoordY(boxBottom)));

    const srcX = Math.round(x1);
    const srcY = Math.round(y1);
    const srcW = Math.round(Math.max(20, x2 - x1));
    const srcH = Math.round(Math.max(20, y2 - y1));

    // Canvas outputs strictly what was inside the green scanner frame
    canvas.width = srcW;
    canvas.height = srcH;

    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    const fullUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64Data = fullUrl.split(",")[1];

    state.images[state.currentStep] = {
      url: fullUrl,
      base64: base64Data,
      mimeType: "image/jpeg"
    };

    this.closeCamera();
    this.updateWizardStep(state.currentStep);
    this.showToast(`Angle ${state.currentStep} cropped to scanner frame`);
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
  EXACT NUTRITION EXTRACTION RULES (DO NOT GUESS OR ESTIMATE):
  1. COLUMN PRIORITY: If multiple columns exist (e.g. "Per Serving" vs "Per 100g"), ALWAYS extract values for **Per Serving** (or per package if single portion). State the exact serving size string in "servingSize" (e.g., "30g (2 biscuits)").
  2. If the label ONLY provides "Per 100g", extract those exact numbers and set "servingSize": "100g".
  3. ABSOLUTE NUMBERS ONLY: Extract exact numerical amounts (grams for macros, milligrams for sodium). NEVER extract or confuse with "% Daily Value" (% DV).
  4. SALT TO SODIUM CONVERSION: If the label only lists "Salt" in grams (common on EU/UK/Indian labels), convert to Sodium in milligrams: Sodium (mg) = Salt (g) * 400.
  5. UNITS: Calories in kcal, Protein in grams (g), Total Carbohydrates in grams (g), Total Sugar in grams (g), Added Sugar in grams (g), Dietary Fiber in grams (g), Total Fat in grams (g), Saturated Fat in grams (g), Sodium in milligrams (mg).
  6. INGREDIENTS: Extract the complete comma-separated ingredients list in exact printed order.

  Return strictly JSON:
  {
    "isFoodProduct": true,
    "rejectionReason": "",
    "productName": "Exact product name (or best guess from label)",
    "brand": "Brand or Manufacturer name",
    "category": "Food category (e.g. Snack Bars, Chips & Snacks, Cereals & Oats, Beverages & Sodas, Dairy & Yogurt, Chocolates & Sweets, Spreads & Butters, Breads & Grains, Instant Meals)",
    "servingSize": "Exact serving size string (e.g. 30g / 1 bar / 100g)",
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

    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    // Auto-fallback if model returns 404 (deprecated/decommissioned model)
    if (res.status === 404) {
      console.warn(`Model ${model} returned 404, attempting fallback to gemini-2.5-flash...`);
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      res = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (res.ok) {
        state.gemini.model = "gemini-2.5-flash";
        localStorage.setItem("foodlens_gemini_model", "gemini-2.5-flash");
        this.updateApiBadge();
      }
    }

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

    // 6. Medical & Health Condition Clinical Evaluation
    const healthConditions = state.profile.healthConditions || [];
    const conditionImpacts = healthConditions.map(cond => {
      const cLow = cond.toLowerCase();
      let status = "SAFE";
      let statusLabel = "Safe for Consumption";
      let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      let reason = "No adverse clinical triggers detected in the nutritional breakdown or ingredients list.";

      if (cLow.includes("hypertension") || cLow.includes("bp") || cLow.includes("blood pressure")) {
        if (sodium >= 480) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `High sodium (${sodium}mg, >21% Daily Value) can promote fluid retention and blood pressure spikes.`;
        } else if (sodium >= 220) {
          status = "CAUTION";
          statusLabel = "Moderate / Caution";
          badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
          reason = `Moderate sodium content (${sodium}mg). Balance with low-sodium meals to keep daily intake below 1,500mg.`;
        }
      } else if (cLow.includes("diabet") || cLow.includes("sugar") || cLow.includes("insulin") || cLow.includes("glycem")) {
        if (sugar >= 10 || ingText.includes("high fructose") || ingText.includes("maltodextrin")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `High sugar load (${sugar}g) or fast-digesting starches can induce sharp postprandial glucose spikes.`;
        } else if (sugar >= 5 || parseFloat(n.carbohydrates || 0) >= 25) {
          status = "CAUTION";
          statusLabel = "Caution";
          badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
          reason = `Moderate carbohydrate impact (${sugar}g sugar). Pair with dietary fiber or protein to slow absorption.`;
        }
      } else if (cLow.includes("cholesterol") || cLow.includes("heart") || cLow.includes("cardio") || cLow.includes("artery")) {
        if (satFat >= 4.5 || ingText.includes("palm oil") || ingText.includes("hydrogenated")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `Elevated saturated fat (${satFat}g) or atherogenic palm oils can elevate circulating LDL-C.`;
        } else if (satFat >= 2.5) {
          status = "CAUTION";
          statusLabel = "Caution";
          badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
          reason = `Moderate saturated fat (${satFat}g). Keep daily saturated fat below 10-15g.`;
        }
      } else if (cLow.includes("gerd") || cLow.includes("reflux") || cLow.includes("heartburn") || cLow.includes("acid")) {
        if (ingText.includes("citric acid") || ingText.includes("caffeine") || ingText.includes("peppermint") || ingText.includes("chili") || ingText.includes("cocoa") || ingText.includes("tomato")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `Contains known lower-esophageal sphincter relaxers or acidic irritants (citric acid / caffeine / spices).`;
        }
      } else if (cLow.includes("liver") || cLow.includes("nafld") || cLow.includes("hepatic")) {
        if (ingText.includes("high fructose") || sugar >= 14) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `High fructose levels accelerate hepatic de novo lipogenesis, promoting intrahepatic fat accumulation.`;
        }
      } else if (cLow.includes("gout") || cLow.includes("uric")) {
        if (ingText.includes("high fructose") || sugar >= 14 || ingText.includes("yeast")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `Fructose metabolism degrades ATP into purines, which can drive up serum uric acid levels.`;
        }
      } else if (cLow.includes("ibs") || cLow.includes("gut") || cLow.includes("bowel") || cLow.includes("fodmap")) {
        if (ingText.includes("sorbitol") || ingText.includes("maltitol") || ingText.includes("xylitol") || ingText.includes("inulin") || ingText.includes("chicory")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `Contains high-FODMAP sugar alcohols or fermentable fructans that can trigger gastrointestinal bloating and cramps.`;
        }
      } else if (cLow.includes("kidney") || cLow.includes("renal")) {
        if (sodium >= 380 || ingText.includes("phosphate") || ingText.includes("phosphoric")) {
          status = "HIGH_RISK";
          statusLabel = "High Risk";
          badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/30";
          reason = `Elevated sodium (${sodium}mg) or inorganic phosphate food additives place extra load on renal filtration.`;
        }
      }

      return { condition: cond, status, statusLabel, badgeClass, reason };
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
      conditionImpacts,
      costPer10gProtein
    });
  },

  renderAnalysisReport(data) {
    const { product, scores, flagged, verifiedClaims, conditionImpacts, costPer10gProtein } = data;
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

    // Medical Health Condition Impact List
    const condContainer = document.getElementById("condition-impact-list");
    if (condContainer) {
      if (!conditionImpacts || conditionImpacts.length === 0) {
        condContainer.innerHTML = `
          <div class="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 text-xs text-zinc-400 flex items-center justify-between">
            <span>No health conditions listed in your profile.</span>
            <button class="text-emerald-400 text-[11px] font-medium hover:underline" onclick="app.switchTab('profile-tab')">+ Add Conditions</button>
          </div>
        `;
      } else {
        condContainer.innerHTML = conditionImpacts.map(ci => `
          <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-zinc-200">${ci.condition}</span>
              <span class="rounded-full px-2 py-0.5 text-[9px] font-semibold border ${ci.badgeClass}">
                ${ci.statusLabel}
              </span>
            </div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">${ci.reason}</p>
          </div>
        `).join("");
      }
    }

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
    if (flagWrap) {
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
    }

    // Reset Chat Messages for this product
    this.resetProductChat(product);
  },

  // -------------------------------------------------------------
  // Smart Healthier Alternatives Slide-Up Drawer
  // -------------------------------------------------------------
  alternativesDatabase: {
    "snack bars": [
      {
        name: "RXBAR Chocolate Sea Salt Protein Bar",
        brand: "RXBAR",
        image: "https://images.unsplash.com/photo-1622484214149-6e3e57f18392?w=400&auto=format&fit=crop&q=80",
        whyBetter: "12g Egg White Protein, 0g Added Sugar",
        badge: "Clean Whole Food",
        calories: 210,
        protein: 12,
        sugar: 0,
        fiber: 5,
        difference: "No artificial syrups or inflammatory palm oils"
      },
      {
        name: "Barebells Clean Whey Protein Bar",
        brand: "Barebells",
        image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80",
        whyBetter: "20g Protein, 1.5g Sugar, High Fiber",
        badge: "High Protein",
        calories: 200,
        protein: 20,
        sugar: 1.5,
        fiber: 4,
        difference: "+15g Protein vs typical snack bars"
      },
      {
        name: "Raw Organic Sprouted Seed Energy Bar",
        brand: "Go Raw",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
        whyBetter: "100% Sprouted Seeds, Rich in Omega-3",
        badge: "Organic & Raw",
        calories: 180,
        protein: 8,
        sugar: 4,
        fiber: 6,
        difference: "100% Whole Seeds, zero refined starch"
      }
    ],
    "chips": [
      {
        name: "Air-Popped Organic Olive Oil Chips",
        brand: "LesserEvil",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80",
        whyBetter: "-60% Saturated Fat, Pure Extra Virgin Olive Oil",
        badge: "Clean Oils",
        calories: 120,
        protein: 3,
        sugar: 0,
        fiber: 3,
        difference: "Zero seed oils or inflammatory trans fats"
      },
      {
        name: "Crispy Roasted Sea Salt Chickpeas",
        brand: "Biena",
        image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&auto=format&fit=crop&q=80",
        whyBetter: "6g Plant Protein, 6g Dietary Fiber",
        badge: "High Fiber",
        calories: 130,
        protein: 6,
        sugar: 1,
        fiber: 6,
        difference: "Low glycemic index, sustained digestive energy"
      },
      {
        name: "Organic Baked Sea Salt Kale Crisps",
        brand: "Rhythm Superfoods",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Nutrient-Dense Green Superfood, Low Sodium",
        badge: "Whole Green",
        calories: 90,
        protein: 4,
        sugar: 1,
        fiber: 4,
        difference: "Real organic kale, zero synthetic dyes"
      }
    ],
    "beverages": [
      {
        name: "Olipop Sparkling Prebiotic Tonic",
        brand: "Olipop",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
        whyBetter: "9g Prebiotic Plant Fiber, Only 2g Sugar",
        badge: "Gut Health Hero",
        calories: 35,
        protein: 0,
        sugar: 2,
        fiber: 9,
        difference: "-35g Sugar vs regular carbonated sodas"
      },
      {
        name: "Organic Hibiscus Berry Sparkling Water",
        brand: "Spindrift",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Real Squeezed Fruit, 0g Added Sugar",
        badge: "Zero Artificial",
        calories: 12,
        protein: 0,
        sugar: 2,
        fiber: 0,
        difference: "No aspartame, sucralose, or high fructose syrup"
      },
      {
        name: "Ceremonial Cold Brew Matcha",
        brand: "Ito En",
        image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
        whyBetter: "L-Theanine Clean Focus & Antioxidants",
        badge: "Antioxidant Rich",
        calories: 0,
        protein: 0,
        sugar: 0,
        fiber: 0,
        difference: "Sustained calm energy without blood sugar crashes"
      }
    ],
    "cereals": [
      {
        name: "Sprouted Ancient Grain Rolled Oats",
        brand: "One Degree",
        image: "https://images.unsplash.com/photo-1586439702132-55ce0da661dd?w=400&auto=format&fit=crop&q=80",
        whyBetter: "0g Added Sugar, High Beta-Glucan Fiber",
        badge: "Heart Healthy",
        calories: 150,
        protein: 6,
        sugar: 1,
        fiber: 5,
        difference: "Unrefined whole grain, zero glucose spikes"
      },
      {
        name: "Grain-Free Almond Cinnamon Granola",
        brand: "Autumn's Gold",
        image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Real Almonds & Pecans, 4g Net Carbs",
        badge: "Keto & Diabetic Safe",
        calories: 200,
        protein: 6,
        sugar: 4,
        fiber: 4,
        difference: "Rich in healthy monounsaturated fats"
      },
      {
        name: "Organic Chia & Flaxseed Crunch",
        brand: "Nature's Path",
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&auto=format&fit=crop&q=80",
        whyBetter: "High Omega-3 ALA, 7g Dietary Fiber",
        badge: "Clean Superfood",
        calories: 170,
        protein: 5,
        sugar: 3,
        fiber: 7,
        difference: "High fiber promotes healthy lipid profiles"
      }
    ],
    "chocolates": [
      {
        name: "Hu Simple Dark Chocolate 70% Cacao",
        brand: "Hu Kitchen",
        image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Organic Coconut Sugar, No Soy Lecithin or Palm Oil",
        badge: "Ultra Clean Dark",
        calories: 170,
        protein: 3,
        sugar: 7,
        fiber: 4,
        difference: "Zero dairy, refined cane sugar, or chemical emulsifiers"
      },
      {
        name: "Almond Flour Soft Baked Clean Cookies",
        brand: "Simple Mills",
        image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Nutrient-dense almond flour, only 4g sugar",
        badge: "Grain-Free",
        calories: 120,
        protein: 3,
        sugar: 4,
        fiber: 2,
        difference: "Gluten-free, zero artificial preservatives"
      }
    ],
    "dairy": [
      {
        name: "Organic Plain Nonfat Greek Yogurt",
        brand: "Fage Total 0%",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80",
        whyBetter: "18g Protein per cup, 0g Added Sugar",
        badge: "High Protein",
        calories: 120,
        protein: 18,
        sugar: 5,
        fiber: 0,
        difference: "Pure fermented live probiotic cultures"
      },
      {
        name: "Single-Ingredient Creamy Almond Butter",
        brand: "Artisana Organics",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80",
        whyBetter: "100% Raw Almonds, Zero Added Oils or Sugars",
        badge: "Single Ingredient",
        calories: 190,
        protein: 7,
        sugar: 1,
        fiber: 4,
        difference: "No hydrogenated oils, palm oil, or added salt"
      }
    ],
    "general": [
      {
        name: "Wild Organic Raw Nut & Berry Mix",
        brand: "NOW Real Food",
        image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Raw Walnuts, Almonds & Wild Berries",
        badge: "Heart & Brain Health",
        calories: 160,
        protein: 5,
        sugar: 6,
        fiber: 4,
        difference: "Antioxidant powerhouse with clean healthy fats"
      },
      {
        name: "Organic Medjool Dates with Almond Butter",
        brand: "Joolies",
        image: "https://images.unsplash.com/photo-1596797882870-8c33deeac224?w=400&auto=format&fit=crop&q=80",
        whyBetter: "Whole Plant Fiber & Natural Potassium",
        badge: "Clean Energy",
        calories: 140,
        protein: 3,
        sugar: 14,
        fiber: 3,
        difference: "Zero refined sugar, high mineral electrolyte density"
      }
    ]
  },

  getAlternativesForCategory(categoryStr, productName) {
    const text = `${categoryStr || ''} ${productName || ''}`.toLowerCase();
    if (text.includes("bar") || text.includes("protein") || text.includes("snack") || text.includes("energy")) {
      return this.alternativesDatabase["snack bars"];
    }
    if (text.includes("chip") || text.includes("crisp") || text.includes("cracker") || text.includes("popcorn") || text.includes("nacho")) {
      return this.alternativesDatabase["chips"];
    }
    if (text.includes("drink") || text.includes("soda") || text.includes("cola") || text.includes("beverage") || text.includes("tea") || text.includes("coffee") || text.includes("juice")) {
      return this.alternativesDatabase["beverages"];
    }
    if (text.includes("cereal") || text.includes("oat") || text.includes("granola") || text.includes("flake") || text.includes("breakfast")) {
      return this.alternativesDatabase["cereals"];
    }
    if (text.includes("chocolate") || text.includes("cookie") || text.includes("candy") || text.includes("sweet") || text.includes("biscuit") || text.includes("dessert")) {
      return this.alternativesDatabase["chocolates"];
    }
    if (text.includes("yogurt") || text.includes("milk") || text.includes("dairy") || text.includes("cheese") || text.includes("butter") || text.includes("spread")) {
      return this.alternativesDatabase["dairy"];
    }
    return this.alternativesDatabase["general"];
  },

  openAlternativesSheet() {
    const sheet = document.getElementById("alternatives-bottom-sheet");
    const container = document.getElementById("alternatives-items-list");
    const subtitle = document.getElementById("alternatives-category-subtitle");
    if (!sheet || !container) return;

    const prod = state.currentProductData || {};
    const items = this.getAlternativesForCategory(prod.category, prod.productName);

    if (subtitle) {
      subtitle.textContent = `Healthier swaps for "${prod.productName || prod.category || 'your product'}"`;
    }

    container.innerHTML = items.map(item => `
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3 hover:border-emerald-500/40 transition-all">
        <div class="flex items-start gap-3">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0 bg-zinc-950" loading="lazy" />
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-mono font-semibold text-zinc-400 truncate">${item.brand}</span>
              <span class="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">${item.badge}</span>
            </div>
            <h4 class="text-xs font-bold text-zinc-100 leading-snug line-clamp-1">${item.name}</h4>
            <p class="text-[11px] text-emerald-400 font-medium">${item.whyBetter}</p>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-1 py-1.5 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
          <div><span class="text-[9px] text-zinc-500 block">Calories</span><span class="text-[11px] font-mono font-bold text-zinc-200">${item.calories}</span></div>
          <div><span class="text-[9px] text-zinc-500 block">Protein</span><span class="text-[11px] font-mono font-bold text-emerald-400">${item.protein}g</span></div>
          <div><span class="text-[9px] text-zinc-500 block">Sugar</span><span class="text-[11px] font-mono font-bold text-zinc-300">${item.sugar}g</span></div>
          <div><span class="text-[9px] text-zinc-500 block">Fiber</span><span class="text-[11px] font-mono font-bold text-cyan-400">${item.fiber}g</span></div>
        </div>

        <div class="flex items-center justify-between pt-1 text-xs">
          <span class="text-[10px] text-zinc-400 italic">💡 ${item.difference}</span>
          <button class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold transition-colors flex items-center gap-1 shrink-0" onclick="app.addSwapToPantry('${item.name.replace(/'/g, "\\'")}', '${item.brand.replace(/'/g, "\\'")}', '${item.image}')">
            + Add to Pantry
          </button>
        </div>
      </div>
    `).join("");

    sheet.classList.add("open");
  },

  closeAlternativesSheet() {
    const sheet = document.getElementById("alternatives-bottom-sheet");
    if (sheet) sheet.classList.remove("open");
  },

  addSwapToPantry(name, brand, img) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 14);

    const item = {
      id: "swap-" + Date.now(),
      name: name,
      category: "Pantry",
      expiryDate: expDate.toISOString().split("T")[0],
      daysLeft: 14,
      status: "FRESH",
      image: img
    };

    state.expiryItems.unshift(item);
    localStorage.setItem("foodlens_expiry_items", JSON.stringify(state.expiryItems));
    this.renderExpiryItems();
    this.renderHomeDashboard();
    this.closeAlternativesSheet();
    this.showToast(`Added "${name}" to Pantry Tracker!`);
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
- Medical / Health Conditions: ${(state.profile.healthConditions || []).join(", ") || "None"}

Please answer the user's question concisely, objectively, and scientifically based strictly on the product label, medical risks, and nutrition facts. Use clean, formatted paragraphs or bullet points without complex markdown tables. Keep answers under 120 words unless detailed recipe advice is requested.
`;

      let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      let res = await fetch(endpoint, {
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

      if (res.status === 404) {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        res = await fetch(endpoint, {
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
      }

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
  // Profile & Settings
  // -------------------------------------------------------------
  loadProfile() {
    const saved = localStorage.getItem("foodlens_profile");
    if (saved) {
      try {
        state.profile = JSON.parse(saved);
        if (!state.profile.healthConditions) state.profile.healthConditions = [];
        const radio = document.querySelector(`input[name="userGoal"][value="${state.profile.userGoal}"]`);
        if (radio) radio.checked = true;
        document.getElementById("profile-diet-select").value = state.profile.dietPreference || "NO_PREFERENCE";
        document.getElementById("profile-allergies-input").value = (state.profile.allergies || []).join(", ");
        
        const condInput = document.getElementById("profile-conditions-input");
        if (condInput) {
          condInput.value = (state.profile.healthConditions || []).join(", ");
        }

        // Highlight active condition pills
        document.querySelectorAll(".cond-pill").forEach(pill => {
          const cName = pill.dataset.cond;
          if (state.profile.healthConditions.includes(cName)) {
            pill.classList.add("bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400");
            pill.classList.remove("border-zinc-800", "bg-zinc-950", "text-zinc-300");
          } else {
            pill.classList.remove("bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400");
            pill.classList.add("border-zinc-800", "bg-zinc-950", "text-zinc-300");
          }
        });
      } catch (e) {}
    }
  },

  toggleConditionPill(pillBtn, conditionName) {
    if (!state.profile.healthConditions) state.profile.healthConditions = [];
    const index = state.profile.healthConditions.indexOf(conditionName);

    if (index > -1) {
      state.profile.healthConditions.splice(index, 1);
      pillBtn.classList.remove("bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400");
      pillBtn.classList.add("border-zinc-800", "bg-zinc-950", "text-zinc-300");
    } else {
      state.profile.healthConditions.push(conditionName);
      pillBtn.classList.add("bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400");
      pillBtn.classList.remove("border-zinc-800", "bg-zinc-950", "text-zinc-300");
    }

    const condInput = document.getElementById("profile-conditions-input");
    if (condInput) {
      condInput.value = state.profile.healthConditions.join(", ");
    }
  },

  saveProfile(e) {
    if (e) e.preventDefault();
    const form = document.getElementById("health-profile-form");
    const formData = new FormData(form);
    state.profile.userGoal = formData.get("userGoal") || "MUSCLE_GAIN";
    state.profile.dietPreference = document.getElementById("profile-diet-select").value;
    state.profile.allergies = document.getElementById("profile-allergies-input").value.split(",").map(s => s.trim()).filter(Boolean);

    const condInput = document.getElementById("profile-conditions-input");
    if (condInput) {
      const typed = condInput.value.split(",").map(s => s.trim()).filter(Boolean);
      state.profile.healthConditions = Array.from(new Set([...(state.profile.healthConditions || []), ...typed]));
    }

    localStorage.setItem("foodlens_profile", JSON.stringify(state.profile));
    this.renderHomeDashboard();
    this.showToast("Health Profile & Medical Conditions Saved");

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
  // -------------------------------------------------------------
  // Mobile Push Notification Settings & Permission Pipeline
  // -------------------------------------------------------------
  checkNotificationPermission() {
    const badge = document.getElementById("notif-permission-badge");
    const btn = document.getElementById("btn-request-notif-perm");
    const subtext = document.getElementById("notif-subtext-status");
    const expToggle = document.getElementById("toggle-expiry-alerts");
    const digestToggle = document.getElementById("toggle-daily-digest");
    const homeBanner = document.getElementById("home-notif-prompt-banner");

    if (expToggle) expToggle.checked = state.notifications.expiryAlerts;
    if (digestToggle) digestToggle.checked = state.notifications.dailyDigest;

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;

    if (!("Notification" in window)) {
      if (isIos && !isStandalone) {
        if (badge) {
          badge.textContent = "Requires Home Screen";
          badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400";
        }
        if (btn) {
          btn.textContent = "Add to Home Screen";
          btn.className = "h-7 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold text-xs";
          btn.disabled = false;
        }
        if (subtext) subtext.textContent = "iOS notifications require saving app to Home Screen";
      } else {
        if (badge) {
          badge.textContent = "Unsupported";
          badge.className = "text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 text-zinc-500";
        }
        if (btn) {
          btn.textContent = "Unsupported";
          btn.disabled = true;
        }
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
        btn.textContent = "Blocked (Tap for Help)";
        btn.className = "h-7 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold text-xs transition-colors";
        btn.disabled = false;
      }
      if (subtext) subtext.textContent = "Tap 🔒 in browser address bar to allow alerts";
      if (homeBanner) homeBanner.classList.add("hidden");
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
      if (subtext) subtext.textContent = "Device push alerts are active";
      if (expToggle) expToggle.disabled = false;
      if (digestToggle) digestToggle.disabled = false;
      if (homeBanner) homeBanner.classList.add("hidden");
    } else {
      // Notifications are deactivated or not yet granted
      if (badge) {
        badge.textContent = browserPerm === "default" ? "Permission Needed" : "Deactivated";
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

      // Show friendly banner on home tab if default
      if (browserPerm === "default" && homeBanner && !sessionStorage.getItem("foodlens_notif_dismissed")) {
        homeBanner.classList.remove("hidden");
      }
    }
  },

  dismissNotifBanner() {
    sessionStorage.setItem("foodlens_notif_dismissed", "true");
    const homeBanner = document.getElementById("home-notif-prompt-banner");
    if (homeBanner) homeBanner.classList.add("hidden");
  },

  async requestMobileNotificationPermission() {
    await this.toggleNotificationMaster();
    const homeBanner = document.getElementById("home-notif-prompt-banner");
    if (homeBanner) homeBanner.classList.add("hidden");
  },

  async toggleNotificationMaster() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;

    // Special handling for iOS Safari
    if (isIos && !isStandalone && !("Notification" in window)) {
      this.showToast("On iPhone, tap Share ➔ 'Add to Home Screen' to enable notifications.");
      return;
    }

    if (!("Notification" in window)) {
      this.showToast("Notifications are not supported in this browser.");
      return;
    }

    // If blocked in browser settings
    if (Notification.permission === "denied") {
      this.showToast("Notifications blocked. Tap the 🔒 icon in your browser URL bar to allow.");
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

    // If currently disabled, request permission
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
      this.showToast("Could not activate notifications. Check browser settings.");
    }
  },

  async sendTestNotification() {
    if (!state.notifications.enabled) {
      this.showToast("Cannot send alert: Notifications are deactivated.");
      return;
    }

    const title = "FoodLens Pantry Alert";
    const body = "Your food item will expire in 2 days. Use it soon!";

    // Prefer Service Worker showNotification for background mobile lock screen support
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body: body,
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%2309090b'/><path d='M20 50h60M50 20v60' stroke='%2310b981' stroke-width='8'/></svg>",
          badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%2310b981'/></svg>",
          vibrate: [200, 100, 200],
          tag: "foodlens-expiry-alert"
        });
        this.showToast("Sent mobile device notification!");
        return;
      } catch (err) {
        console.warn("Service worker notification failed, using fallback:", err);
      }
    }

    // Fallback to standard Window Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=96&auto=format&fit=crop&q=80"
      });
      this.showToast("Sent device notification!");
    } else {
      this.showToast(`In-App Alert: ${body}`);
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

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(err => {
        console.warn("Service Worker registration failed:", err);
      });
    }

    // Capture PWA beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.classList.remove("hidden");
      }
    });
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {
          this.showToast("Add to Home Screen for automatic fullscreen mode.");
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else {
        this.showToast("Add to Home Screen for automatic fullscreen mode.");
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  },

  promptPwaInstall() {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      this.deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          this.showToast("Installing FoodLens Standalone App...");
        }
        this.deferredInstallPrompt = null;
      });
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        this.showToast("iOS: Tap Share button ➔ 'Add to Home Screen'");
      } else {
        this.showToast("Tap browser menu (⋮) ➔ 'Add to Home Screen' / 'Install App'");
      }
    }
  },

  showToast(msg) {
    const t = document.getElementById("toast-el");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2800);
  }
};

document.addEventListener("DOMContentLoaded", () => app.init());
