(function () {
  // --- Configuration ---
  const targetCountryCode = "DE";
  const englishPath = "/en";
  const noRedirectPaths = ["/services", "/blog"]; // Paths where URL should NEVER change
  const storageKey = "user_language_preference";

  // --- Helper: Hide Elements by Language ---
  const hideElementsByLang = (lang) => {
    // 1. Hide the target language (e.g., hide 'en' if we want German)
    const elementsToHide = document.querySelectorAll(
      `[data-element-language="${lang}"]`
    );
    elementsToHide.forEach((el) => {
      // !important ensures we override Webflow's default display: block/flex
      el.style.setProperty("display", "none", "important");
    });

    // 2. Show the opposite language
    const oppositeLang = lang === "en" ? "de" : "en";
    const elementsToShow = document.querySelectorAll(
      `[data-element-language="${oppositeLang}"]`
    );
    elementsToShow.forEach((el) => {
      el.style.display = ""; // Clear inline styles so CSS classes take over
    });
  };

  // --- Helper: Update ALL Navbar ISO Codes ---
  const updateNavbarIso = (code) => {
    const isoElements = document.querySelectorAll(
      '[data-localization-dropdown="iso-code"]'
    );
    isoElements.forEach((el) => {
      el.textContent = code;
    });
  };

  // --- Helper: Redirect Functionality ---
  const performRedirect = (toLang) => {
    const currentPath = window.location.pathname;
    const searchHash = window.location.search + window.location.hash;

    if (toLang === "en") {
      // Only redirect if NOT already on English path
      if (!currentPath.startsWith(englishPath)) {
        window.location.href = englishPath + currentPath + searchHash;
      }
    } else {
      // Only redirect if currently ON English path
      if (currentPath.startsWith(englishPath)) {
        const newPath = currentPath.replace(englishPath, "") || "/";
        window.location.href = newPath + searchHash;
      }
    }
  };

  // --- State Application Functions ---
  const setEnglishState = () => {
    updateNavbarIso("EN");
    hideElementsByLang("de");
  };

  const setGermanState = () => {
    updateNavbarIso("DE");
    hideElementsByLang("en");
  };

  // --- MAIN INITIALIZATION (Wait for DOM) ---
  const initLocalization = () => {
    const currentPath = window.location.pathname;
    const savedPreference = localStorage.getItem(storageKey);

    // Check if current page is in the exception list
    const isNoRedirectPage = noRedirectPaths.some((path) =>
      currentPath.startsWith(path)
    );

    // 1. CHECK SAVED PREFERENCE (Manual Override)
    if (savedPreference) {
      if (savedPreference === "en") {
        setEnglishState();
        // Redirect ONLY if it's NOT a no-redirect page
        if (!currentPath.startsWith(englishPath) && !isNoRedirectPage) {
          performRedirect("en");
        }
      } else if (savedPreference === "de") {
        setGermanState();
        if (currentPath.startsWith(englishPath)) {
          performRedirect("de");
        }
      }
    }
    // 2. NO PREFERENCE (GeoIP)
    else {
      // Default visual state based on URL
      if (currentPath.startsWith(englishPath)) setEnglishState();
      else setGermanState();

      fetch("https://free.freeipapi.com/api/json/")
        .then((res) => {
          if (!res.ok) throw new Error("Network error");
          return res.json();
        })
        .then((data) => {
          if (data && data.countryCode) {
            const userCountryCode = data.countryCode;

            if (userCountryCode === targetCountryCode) {
              // User IS from Germany
              if (currentPath.startsWith(englishPath)) {
                setGermanState();
              } else {
                setGermanState();
              }
            } else {
              // User is International
              // Redirect ONLY if NOT a no-redirect page
              if (!isNoRedirectPage && !currentPath.startsWith(englishPath)) {
                performRedirect("en");
              } else {
                setEnglishState();
              }
            }
          }
        })
        .catch(() => {
          if (currentPath.startsWith(englishPath)) setEnglishState();
          else setGermanState();
        });
    }

    // --- SETUP CLICK LISTENERS (Updated Logic) ---

    // 1. English Button Click
    const allEnButtons = document.querySelectorAll(
      '[data-localization-dropdown="en"]'
    );
    allEnButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.setItem(storageKey, "en");

        if (isNoRedirectPage) {
          // If on /services or /blog, just change the VISUALS, do not redirect
          setEnglishState();
        } else {
          // Otherwise, go to /en/...
          performRedirect("en");
        }
      });
    });

    // 2. German Button Click
    const allDeButtons = document.querySelectorAll(
      '[data-localization-dropdown="de"]'
    );
    allDeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.setItem(storageKey, "de");

        if (isNoRedirectPage) {
          // If on /services or /blog, just change the VISUALS
          setGermanState();
        } else {
          // Otherwise, go to root
          performRedirect("de");
        }
      });
    });
  };

  // --- EXECUTE WHEN DOM IS READY ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLocalization);
  } else {
    initLocalization();
  }
})();
