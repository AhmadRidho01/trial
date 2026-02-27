// --- ---

// Penjelasan Metode Client-Side API Fetching
// > Direct API Call (Pemanggilan API Langsung): Karena browser Anda "berbicara" langsung ke server API (seperti ZenQuotes atau Quotable) tanpa perantara server sendiri. MDN Web Docs menjelaskan ini sebagai penggunaan standar Fetch API.

// > Client-Side Rendering (CSR): Karena seluruh proses pengambilan data dan pembaruan tampilan dilakukan sepenuhnya oleh browser pengguna menggunakan JavaScript.

// > Cross-Origin Request: Karena Anda meminta data dari satu domain (misalnya localhost atau index.html) ke domain lain (zenquotes.io). Inilah yang memicu aturan CORS (Cross-Origin Resource Sharing) yang sering menyebabkan error jika tidak menggunakan Proxy.

// > Static Site Architecture: Metode ini umum digunakan pada situs statis (hanya HTML/CSS/JS) yang tidak memiliki server backend sendiri.

// > Cara Lama (Client-Side): Browser ↔️ API Luar. (Cepat dibuat, tapi rentan masalah keamanan/CORS).

// --- ---

// ========================================
// QUOTE GENERATOR - OPTIMIZED VERSION
// API: quote-vercel.vercel.app (TIDAK DIUBAH!)
// ========================================

/**
 * Quote Generator Module
 * Menggunakan IIFE untuk menghindari global scope pollution
 */
const QuoteGenerator = (() => {
  // ============ KONFIGURASI ============
  const CONFIG = {
    API_URL: "https://trial-hazel-one.vercel.app/api/quotes",
    SHARE_URL: "https://ahmadridho01.github.io/projectQuoteGenerator/",
    DEBOUNCE_DELAY: 500, // milliseconds (cegah spam click)
    FETCH_TIMEOUT: 10000, // 10 detik timeout
  };

  const MESSAGES = {
    LOADING: "Loading...",
    FETCH_ERROR: "Failed to load quote. Please try again.",
    COPY_SUCCESS: "Quote copied!",
    COPY_ERROR: "Failed to copy. Try again.",
    NO_SPEECH: "Speech not supported in this browser.",
    OPENING_PLATFORM: "Quote copied! Opening",
  };

  // ============ STATE MANAGEMENT ============
  let isFetching = false; // Mencegah double fetch
  let isSpeaking = false; // Track status text-to-speech
  let availableVoices = []; // Cache voices untuk performa

  // ============ DOM ELEMENTS ============
  const elements = {
    quoteText: document.querySelector(".quote"),
    authorName: document.querySelector(".name"),
    quoteBtn: document.querySelector(".features button"),
    features: document.querySelector(".features"),
    soundBtn: document.querySelector(".sound"),
    copyBtn: document.querySelector(".copy"),
    twitterBtn: document.querySelector(".twitter"),
    fbBtn: document.querySelector(".fb"),
    igBtn: document.querySelector(".instagram"),
    tiktokBtn: document.querySelector(".tiktok"),
  };

  // ============ UTILITY FUNCTIONS ============

  /**
   * Debounce function - mencegah user spam click button
   */
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  /**
   * Tampilkan notifikasi ke user (toast notification)
   */
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Styling inline untuk notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 25px",
      background:
        type === "error"
          ? "#e74c3c"
          : type === "success"
            ? "#27ae60"
            : "#3498db",
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      zIndex: "9999",
      fontSize: "14px",
      fontWeight: "500",
      animation: "slideIn 0.3s ease",
      maxWidth: "300px",
    });

    document.body.appendChild(notification);

    // Auto remove setelah 3 detik
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  /**
   * Update state button (loading, disabled, text)
   */
  const setButtonState = (button, isLoading, text) => {
    button.disabled = isLoading;
    button.classList.toggle("loading", isLoading);
    if (text) button.textContent = text;
  };

  /**
   * Validasi quote object dari API
   */
  const isValidQuote = (quote) => {
    return (
      quote &&
      typeof quote.quote === "string" &&
      quote.quote.trim() !== "" &&
      typeof quote.author === "string" &&
      quote.author.trim() !== ""
    );
  };

  // ============ SPEECH SYNTHESIS SETUP ============

  /**
   * Load available voices (async di mobile)
   */
  function loadVoices() {
    availableVoices = speechSynthesis.getVoices();

    // Debug: log available voices
    if (availableVoices.length > 0) {
      console.log(`✅ ${availableVoices.length} voices loaded`);

      // Show English voices
      const englishVoices = availableVoices.filter((v) =>
        v.lang.startsWith("en"),
      );
      console.log(`📢 English voices available: ${englishVoices.length}`);
      englishVoices.forEach((v) => console.log(`  - ${v.name} (${v.lang})`));
    }
  }

  /**
   * Get best English voice available
   */
  function getBestEnglishVoice() {
    if (availableVoices.length === 0) {
      availableVoices = speechSynthesis.getVoices();
    }

    // Priority order untuk memilih voice terbaik
    const priorities = [
      (v) => v.lang === "en-US" && v.name.toLowerCase().includes("google"),
      (v) => v.lang === "en-US" && v.name.toLowerCase().includes("microsoft"),
      (v) => v.lang === "en-GB" && v.name.toLowerCase().includes("google"),
      (v) => v.lang === "en-US",
      (v) => v.lang === "en-GB",
      (v) => v.lang.startsWith("en-"),
    ];

    for (const priority of priorities) {
      const voice = availableVoices.find(priority);
      if (voice) {
        console.log(`✅ Selected voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    console.warn("⚠️ No English voice found, using default");
    return null;
  }

  // Listen untuk voice loading (penting untuk mobile!)
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  loadVoices(); // Initial load

  // ============ API FUNCTIONS ============

  /**
   * Fetch quote dari API dengan proper error handling
   * ✅ API ENDPOINT TIDAK BERUBAH!
   */
  async function fetchQuotes() {
    // Cegah double fetch
    if (isFetching) {
      console.log("⚠️ Already fetching, please wait...");
      return;
    }

    isFetching = true;
    setButtonState(elements.quoteBtn, true, MESSAGES.LOADING);

    try {
      // AbortController untuk timeout (10 detik)
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CONFIG.FETCH_TIMEOUT,
      );

      // ✅ FETCH API - SAMA PERSIS DENGAN CODE ANDA
      const response = await fetch(CONFIG.API_URL, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Validasi response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ PARSE JSON - SAMA PERSIS DENGAN CODE ANDA
      const data = await response.json();

      // Validasi data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No quote data received from API");
      }

      // ✅ AMBIL DATA[0] - SAMA PERSIS DENGAN CODE ANDA
      const randomQuote = data[0];

      // Validasi quote object
      if (!isValidQuote(randomQuote)) {
        throw new Error("Invalid quote format from API");
      }

      // ✅ DISPLAY KE LAYAR - DENGAN ANIMASI SMOOTH
      displayQuote(randomQuote.quote, randomQuote.author);

      console.log("✅ Quote loaded successfully");
    } catch (error) {
      console.error("❌ Fetch Error:", error);

      // User-friendly error messages
      let errorMessage = MESSAGES.FETCH_ERROR;
      if (error.name === "AbortError") {
        errorMessage = "Request timeout. Check your connection.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Check your internet.";
      }

      // Display error ke user
      elements.quoteText.textContent = errorMessage;
      elements.authorName.textContent = "";
      showNotification(errorMessage, "error");
    } finally {
      isFetching = false;
      setButtonState(elements.quoteBtn, false, "New Quote");
    }
  }

  /**
   * Display quote dengan smooth animation
   */
  function displayQuote(quote, author) {
    // Fade out
    elements.quoteText.style.opacity = "0";
    elements.authorName.style.opacity = "0";

    setTimeout(() => {
      // Update text
      elements.quoteText.textContent = quote;
      elements.authorName.textContent = author;

      // Fade in
      elements.quoteText.style.opacity = "1";
      elements.authorName.style.opacity = "1";
    }, 200);
  }

  // ============ FEATURE FUNCTIONS ============

  /**
   * Text-to-Speech dengan pronunciation FIX untuk mobile!
   * ✅ FIXED: Sekarang baca dengan aksen English yang benar
   */
  function speakQuote() {
    // Check browser support
    if (!("speechSynthesis" in window)) {
      showNotification(MESSAGES.NO_SPEECH, "error");
      return;
    }

    // Toggle: jika sedang berbicara, stop
    if (isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
      elements.soundBtn.classList.remove("speaking");
      return;
    }

    // Prepare text
    const text = `${elements.quoteText.textContent} by ${elements.authorName.textContent}`;
    const utterance = new SpeechSynthesisUtterance(text);

    // ✅ FIX 1: Set language ke English (CRITICAL!)
    utterance.lang = "en-US";

    // ✅ FIX 2: Pilih English voice (CRITICAL untuk mobile!)
    const englishVoice = getBestEnglishVoice();
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // ✅ FIX 3: Optimize speech parameters
    utterance.rate = 0.9; // Sedikit lebih lambat agar jelas
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Event handlers
    utterance.onstart = () => {
      isSpeaking = true;
      elements.soundBtn.classList.add("speaking");
      console.log("🔊 Speaking...");
    };

    utterance.onend = () => {
      isSpeaking = false;
      elements.soundBtn.classList.remove("speaking");
      console.log("✅ Speech ended");
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      elements.soundBtn.classList.remove("speaking");
      console.error("❌ Speech error:", event.error);
      showNotification("Speech error: " + event.error, "error");
    };

    // Speak!
    speechSynthesis.speak(utterance);
  }

  /**
   * Copy quote to clipboard
   */
  async function copyQuote(showNotif = true) {
    const fullText = `"${elements.quoteText.textContent}" — ${elements.authorName.textContent}`;

    try {
      await navigator.clipboard.writeText(fullText);

      if (showNotif) {
        showNotification(MESSAGES.COPY_SUCCESS, "success");
      }

      // Visual feedback
      elements.copyBtn.classList.add("copied");
      setTimeout(() => elements.copyBtn.classList.remove("copied"), 1000);

      console.log("✅ Copied:", fullText);
      return true;
    } catch (error) {
      console.error("❌ Copy failed:", error);

      if (showNotif) {
        showNotification(MESSAGES.COPY_ERROR, "error");
      }

      return false;
    }
  }

  /**
   * Share to social media
   */
  async function shareToSocial(platform) {
    const fullText = `"${elements.quoteText.textContent}" — ${elements.authorName.textContent}`;
    const encodedText = encodeURIComponent(fullText);
    const encodedUrl = encodeURIComponent(CONFIG.SHARE_URL);

    // Direct share URLs
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    // Platform URLs untuk copy+open
    const platformUrls = {
      instagram: "https://www.instagram.com",
      tiktok: "https://www.tiktok.com",
    };

    if (shareUrls[platform]) {
      // Direct share (Twitter, Facebook)
      window.open(
        shareUrls[platform],
        "_blank",
        "width=600,height=400,noopener,noreferrer",
      );
    } else if (platformUrls[platform]) {
      // Copy + Open (Instagram, TikTok)
      const copySuccess = await copyQuote(false); // No notification dari copyQuote

      if (copySuccess) {
        const platformName =
          platform.charAt(0).toUpperCase() + platform.slice(1);
        showNotification(
          `${MESSAGES.OPENING_PLATFORM} ${platformName}...`,
          "info",
        );

        setTimeout(() => {
          window.open(platformUrls[platform], "_blank", "noopener,noreferrer");
        }, 500);
      } else {
        showNotification(MESSAGES.COPY_ERROR, "error");
      }
    }
  }

  // ============ UI SETUP ============

  /**
   * Setup social share UI structure
   */
  function setupSocialUI() {
    const socialIcons = elements.features.querySelectorAll(
      ".twitter, .fb, .instagram, .tiktok",
    );

    if (socialIcons.length === 0) return;

    // Create container
    const socialUl = document.createElement("ul");
    socialUl.className = "social-icons";

    // Create label
    const shareText = document.createElement("p");
    shareText.textContent = "Share on:";
    Object.assign(shareText.style, {
      margin: "10px 0 5px",
      fontWeight: "600",
      fontStyle: "italic",
    });

    // Move icons to list
    socialIcons.forEach((icon) => {
      const li = document.createElement("li");
      li.appendChild(icon);
      socialUl.appendChild(li);
    });

    // Insert before button
    elements.features.insertBefore(shareText, elements.quoteBtn);
    elements.features.insertBefore(socialUl, elements.quoteBtn);
  }

  /**
   * Inject CSS animations
   */
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Notification animations */
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      /* Quote fade transition */
      .quote, .name {
        transition: opacity 0.3s ease-in-out;
      }

      /* Speaking animation */
      .speaking {
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }

      /* Copy button feedback */
      .copied {
        animation: bounce 0.5s ease;
      }
      @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      /* Loading state */
      .loading {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // ============ EVENT LISTENERS ============

  function attachEventListeners() {
    // New Quote Button (dengan debounce)
    const debouncedFetch = debounce(fetchQuotes, CONFIG.DEBOUNCE_DELAY);
    elements.quoteBtn.addEventListener("click", debouncedFetch);

    // Feature Buttons
    elements.soundBtn.addEventListener("click", speakQuote);
    elements.copyBtn.addEventListener("click", () => copyQuote(true));

    // Social Share Buttons
    elements.twitterBtn.addEventListener("click", () =>
      shareToSocial("twitter"),
    );
    elements.fbBtn.addEventListener("click", () => shareToSocial("facebook"));
    elements.igBtn.addEventListener("click", () => shareToSocial("instagram"));
    elements.tiktokBtn.addEventListener("click", () => shareToSocial("tiktok"));

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // Ctrl + Space = New Quote
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        fetchQuotes();
      }
      // Ctrl + Shift + C = Copy Quote
      else if (e.ctrlKey && e.shiftKey && e.key === "c") {
        e.preventDefault();
        copyQuote(true);
      }
      // Ctrl + Shift + S = Speak Quote
      else if (e.ctrlKey && e.shiftKey && e.key === "s") {
        e.preventDefault();
        speakQuote();
      }
    });

    console.log("⌨️ Keyboard shortcuts:");
    console.log("  Ctrl + Space = New Quote");
    console.log("  Ctrl + Shift + C = Copy");
    console.log("  Ctrl + Shift + S = Speak");
  }

  // ============ INITIALIZATION ============

  function init() {
    // Validate required DOM elements
    if (!elements.quoteText || !elements.authorName || !elements.quoteBtn) {
      console.error("❌ Required DOM elements not found!");
      return;
    }

    console.log("🚀 Initializing Quote Generator...");

    // Setup
    injectStyles();
    setupSocialUI();
    attachEventListeners();

    // Load first quote
    fetchQuotes();

    console.log("✅ Quote Generator initialized successfully!");
  }

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ============ PUBLIC API (optional) ============
  return {
    fetchQuotes,
    speakQuote,
    copyQuote,
    getAvailableVoices: () => availableVoices,
  };
})();

// Export for module usage (optional)
if (typeof module !== "undefined" && module.exports) {
  module.exports = QuoteGenerator;
}
