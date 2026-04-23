// ================= GLOBAL LANGUAGE ENGINE =================

const MCN_LANG = {

  en: {
    title: "MCN Engine",
    ads: "Sponsored Ads",
    prices: "Live Prices",
    discover: "Discover Feed",
    logout: "Logout"
  },

  fr: {
    title: "Moteur MCN",
    ads: "Publicités sponsorisées",
    prices: "Prix en direct",
    discover: "Fil d’actualité",
    logout: "Déconnexion"
  },

  es: {
    title: "Motor MCN",
    ads: "Anuncios patrocinados",
    prices: "Precios en vivo",
    discover: "Descubrir",
    logout: "Cerrar sesión"
  },

  de: {
    title: "MCN Motor",
    ads: "Gesponserte Anzeigen",
    prices: "Live Preise",
    discover: "Entdecken",
    logout: "Abmelden"
  },

  ar: {
    title: "محرك MCN",
    ads: "الإعلانات الممولة",
    prices: "الأسعار المباشرة",
    discover: "اكتشف",
    logout: "تسجيل الخروج"
  }
};

// ================= APPLY LANGUAGE GLOBALLY =================
function applyMCNLanguage(lang) {

  const t = MCN_LANG[lang] || MCN_LANG.en;

  // NAV TITLE
  const title = document.querySelector(".nav-title");
  if (title) title.innerText = t.title;

  // CARD HEADINGS (safe check)
  const cards = document.querySelectorAll(".card h4");
  if (cards[0]) cards[0].innerText = "🔥 " + t.ads;
  if (cards[1]) cards[1].innerText = "📊 " + t.prices;
  if (cards[2]) cards[2].innerText = "📰 " + t.discover;

  // SAVE
  localStorage.setItem("mcn_lang", lang);
}

// ================= INIT ON EVERY PAGE =================
(function () {
  const saved = localStorage.getItem("mcn_lang") || "en";
  applyMCNLanguage(saved);
})();