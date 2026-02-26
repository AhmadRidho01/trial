// 1. SELEKTOR UTAMA
const quoteText = document.querySelector(".quote");
const authorName = document.querySelector(".name");
const quoteBtn = document.querySelector(".features button");
const features = document.querySelector(".features");
const soundBtn = document.querySelector(".sound");
const copyBtn = document.querySelector(".copy");
const twitterBtn = document.querySelector(".twitter");
const fbBtn = document.querySelector(".fb");
const igBtn = document.querySelector(".instagram");
const tiktokBtn = document.querySelector(".tiktok");

// 2. MODIFIKASI STRUKTUR SHARE (Agar tetap ada tampilan "Share on")
const socialIcons = document.querySelectorAll(
  ".twitter, .fb, .instagram, .tiktok",
);
const socialUl = document.createElement("ul");
socialUl.className = "social-icons";
const shareText = document.createElement("p");
shareText.innerText = "Share on:";
Object.assign(shareText.style, {
  margin: "10px 0 5px",
  fontWeight: "600",
  fontStyle: "italic",
});

socialIcons.forEach((icon) => socialUl.appendChild(icon));
features.insertBefore(shareText, quoteBtn);
features.insertBefore(socialUl, quoteBtn);

// --- ---

// Penjelasan Metode Client-Side API Fetching
// > Direct API Call (Pemanggilan API Langsung): Karena browser Anda "berbicara" langsung ke server API (seperti ZenQuotes atau Quotable) tanpa perantara server sendiri. MDN Web Docs menjelaskan ini sebagai penggunaan standar Fetch API.

// > Client-Side Rendering (CSR): Karena seluruh proses pengambilan data dan pembaruan tampilan dilakukan sepenuhnya oleh browser pengguna menggunakan JavaScript.

// > Cross-Origin Request: Karena Anda meminta data dari satu domain (misalnya localhost atau index.html) ke domain lain (zenquotes.io). Inilah yang memicu aturan CORS (Cross-Origin Resource Sharing) yang sering menyebabkan error jika tidak menggunakan Proxy.

// > Static Site Architecture: Metode ini umum digunakan pada situs statis (hanya HTML/CSS/JS) yang tidak memiliki server backend sendiri.

// > Cara Lama (Client-Side): Browser ↔️ API Luar. (Cepat dibuat, tapi rentan masalah keamanan/CORS).

// --- ---

// 3. LOGIKA NODE.JS UNTUK API NINJAS
const targetUrl = "https://trial-hazel-one.vercel.app/api/quotes";
async function fetchQuotes() {
  quoteBtn.classList.add("loading");
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error("Server bermasalah");

    const data = await response.json();

    // Karena API Ninjas gratis cuma kasih 1 data dalam array, ambil indeks [0]
    const randomQuote = data[0];

    // Langsung tampilkan ke layar
    quoteText.innerText = randomQuote.quote;
    authorName.innerText = randomQuote.author;
  } catch (error) {
    console.error("Error:", error);
    quoteText.innerText = "Gagal memuat kutipan.";
  } finally {
    quoteBtn.classList.remove("loading");
  }
}

function showNewQuote() {
  // Jika library kosong (karena error fetch), coba ambil ulang
  if (quotesLibrary.length === 0) return fetchQuotes();

  // Pilih satu kutipan secara acak dari 50 data yang sudah tersimpan
  const randomIndex = Math.floor(Math.random() * quotesLibrary.length);
  const randomQuote = quotesLibrary[randomIndex];

  quoteText.innerText = randomQuote.quote;
  authorName.innerText = randomQuote.author;

  quotesLibrary.splice(randomIndex, 1);
}

soundBtn.addEventListener("click", () => {
  let utterance = new SpeechSynthesisUtterance(
    `${quoteText.innerText} by ${authorName.innerText}`,
  );
  speechSynthesis.speak(utterance);
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(quoteText.innerText);
});

twitterBtn.addEventListener("click", () => {
  const fullText = `"${quoteText.innerText}" — ${authorName.innerText}`;

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;

  window.open(xUrl, "_blank", "width=600,height=400");
});

fbBtn.addEventListener("click", () => {
  const shareUrl = encodeURIComponent(
    "https://ahmadridho01.github.io/projectQuoteGenerator/",
  );

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;

  window.open(fbUrl, "_blank", "width=600,height=400");
});

igBtn.addEventListener("click", () => {
  // Menggabungkan kutipan dan penulis agar yang disalin lebih lengkap
  const fullText = `"${quoteText.innerText}" — ${authorName.innerText}`;

  navigator.clipboard
    .writeText(fullText)
    .then(() => {
      alert("Quote and Author copied! Opening Instagram...");
      window.open("https://www.instagram.com", "_blank");
    })
    .catch((err) => {
      console.error(`Failed to copy text: ${err}`);
    });
});

tiktokBtn.addEventListener("click", () => {
  const fullText = `"${quoteText.innerText}" — ${authorName.innerText}`;

  navigator.clipboard
    .writeText(fullText)
    .then(() => {
      alert("Quote and Author copied! Opening TikTok...");

      // Membuka TikTok setelah salin
      window.open("https://www.tiktok.com", "_blank");
    })
    .catch((err) => {
      alert(`Failed to copy text: ${err}`);
    });
});

// 4. EVENT LISTENER
// Karena akun gratis API Ninjas hanya memberi 1 data per panggil,
// kita harus fetch ke server setiap kali tombol diklik.
quoteBtn.addEventListener("click", fetchQuotes);

// Jalankan pengambilan data pertama kali saat halaman dibuka
fetchQuotes();
