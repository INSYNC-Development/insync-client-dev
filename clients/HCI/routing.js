(function () {
  // --- CONFIGURATION: ARABIC COUNTRIES LIST ---
  // You can easily add or remove lines here.
  // The code uses the 'code' value for checking.
  const arabicCountriesList = [
    { code: "DZ", name: "Algeria" },
    { code: "BH", name: "Bahrain" },
    { code: "KM", name: "Comoros" },
    { code: "DJ", name: "Djibouti" },
    { code: "EG", name: "Egypt" },
    { code: "IQ", name: "Iraq" },
    { code: "JO", name: "Jordan" },
    { code: "KW", name: "Kuwait" },
    { code: "LB", name: "Lebanon" },
    { code: "LY", name: "Libya" },
    { code: "MR", name: "Mauritania" },
    { code: "MA", name: "Morocco" },
    { code: "OM", name: "Oman" },
    { code: "PS", name: "Palestine" },
    { code: "QA", name: "Qatar" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SO", name: "Somalia" },
    { code: "SD", name: "Sudan" },
    { code: "SY", name: "Syria" },
    { code: "TN", name: "Tunisia" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "YE", name: "Yemen" },
  ];

  // Helper: Create a simple list of just the codes (e.g., ['SA', 'EG', ...])
  const arabicCodes = arabicCountriesList.map((item) => item.code);

  // 1. Check if user already manually selected a language
  const savedLang = localStorage.getItem("user_lang_preference");
  if (savedLang) {
    // User has a preference, do NOT auto-redirect
    return;
  }

  // 2. Fetch IP and Redirect
  // This runs asynchronously. It will trigger as soon as the API responds.
  fetch("https://free.freeipapi.com/api/json/")
    .then((response) => response.json())
    .then((data) => {
      const countryCode = data.countryCode;
      const currentPath = window.location.pathname;

      // --- Logic for Germany ---
      if (countryCode === "DE") {
        // If user is NOT already on the German page, redirect
        if (currentPath.indexOf("/de") === -1) {
          window.location.replace("/de");
        }
      }

      // --- Logic for Arabic Countries ---
      else if (arabicCodes.includes(countryCode)) {
        // If user is NOT already on the Arabic page, redirect
        if (currentPath.indexOf("/ar") === -1) {
          window.location.replace("/ar");
        }
      }

      // --- Logic for English (Default) ---
      // We do nothing. If they are from US/UK/France/etc, they stay on the current page.
    })
    .catch((err) => {
      console.log("IP Routing skipped due to API error", err);
    });
})();

// -----------------------------------------------------------------------
// PART 2: UI INTERACTION (Waits for HTML to load)
// -----------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  // Find all links that change language based on your HTML attributes
  const langLinks = document.querySelectorAll("[data-lang-link]");

  langLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const selectedLang = this.getAttribute("data-lang-link");

      // Save the choice so the Auto-Redirect (Part 1) doesn't run next time
      localStorage.setItem("user_lang_preference", selectedLang);
    });
  });
});
