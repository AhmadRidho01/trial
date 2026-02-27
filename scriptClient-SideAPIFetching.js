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

const CONFIG = {
  API_URL: "https://trial-hazel-one.vercel.app/api/quotes",
  SHARE_URL: "https://ahmadridho01.github.io/projectQuoteGenerator/",
  DEBOUNCE_DELAY: 500, // milliseconds (cegah spam click)
  FETCH_TIMEOUT: 10000, // 10 detik timeout
};
