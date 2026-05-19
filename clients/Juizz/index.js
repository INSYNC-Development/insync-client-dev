const offerSwiper = new Swiper(".swiper.is-offers", {
  slidesPerView: 1.1,
  spaceBetween: 10,
  watchSlidesProgress: true,
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 4,
    },
  },
  pagination: {
    el: "[data-swiper-nav='is-offers'] .swiper-nav-pagination",
    type: "custom",
    renderCustom: function (offerSwiper, current, total) {
      return current + " von " + total;
    },
  },
  navigation: {
    prevEl: "[data-swiper-nav='is-offers'] .swiper-nav-button.is-prev",
    nextEl: "[data-swiper-nav='is-offers'] .swiper-nav-button.is-next",
  },
});

const mainBlogSwiper = new Swiper(".swiper.is-main-blog", {
  slidesPerView: 1.1,
  spaceBetween: 10,
  watchSlidesProgress: true,
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 4,
    },
  },
  navigation: {
    prevEl: "[data-swiper-nav='is-main-blog'] .swiper-nav-button.is-prev",
    nextEl: "[data-swiper-nav='is-main-blog'] .swiper-nav-button.is-next",
  },
});

const teamSwiper = new Swiper(".swiper.is-team", {
  slidesPerView: 1.1,
  spaceBetween: 10,
  watchSlidesProgress: true,
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
    992: {
      slidesPerView: 4,
    },
  },
  pagination: {
    el: "[data-swiper-nav='is-team'] .swiper-nav-pagination",
    type: "custom",
    renderCustom: function (teamSwiper, current, total) {
      return current + " von " + total;
    },
  },
  navigation: {
    prevEl: "[data-swiper-nav='is-team'] .swiper-nav-button.is-prev",
    nextEl: "[data-swiper-nav='is-team'] .swiper-nav-button.is-next",
  },
});

const mainHeroSwiper = new Swiper(".swiper.is-main-hero", {
  slidesPerView: 1,
  loop: true,
  spaceBetween: 10,
  autoplay: {
    delay: 3000,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    768: {
      slidesPerView: 1.5,
    },
    992: {
      slidesPerView: 1.2,
    },
  },
});
const productNavSwiper = new Swiper("[data-swiper=nav-thumbnail]", {
  slidesPerView: "auto",
  direction: "vertical",
  spaceBetween: 8,
  freemode: true,
  slideToClickedSlide: true,
});

const productSwiper = new Swiper(".swiper.is-product-visual", {
  slidesPerView: 1,
  spaceBetween: 10,
  thumbs: {
    swiper: productNavSwiper,
  },
});

// productSwiper.controller.control = productNavSwiper;
// productNavSwiper.controller.control = productSwiper;

// console.log("etst");

// Multistep Form Start
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    const form =
      document.querySelector("#wf-form-Online-Advice-Form") ||
      document.querySelector(".advice_form_block form");
    if (!form) return;

    const rawPanels = Array.from(
      form.querySelectorAll("[data-form-step], [data-form-state]")
    );
    const panels = rawPanels
      .map((el, idx) => {
        const stepAttr =
          el.getAttribute("data-form-step") ||
          el.getAttribute("data-form-state");
        const stepNum = stepAttr ? parseInt(stepAttr, 10) : idx + 1;
        return { el, stepNum };
      })
      .sort((a, b) => a.stepNum - b.stepNum)
      .map((p) => p.el);

    const leftStepItems = Array.from(
      document.querySelectorAll(".advice_form_left_wrap .advice_form_step_item")
    );
    let activeIndex = 0;

    panels.forEach((panel, i) => {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-hidden", i === activeIndex ? "false" : "true");
      panel.classList.toggle("is-hidden", i !== activeIndex);
    });

    leftStepItems.forEach((item, i) => {
      item.classList.toggle("is-active", i === activeIndex);
      if (i === activeIndex) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    panels.forEach((panel, i) => {
      const nextBtns = Array.from(
        panel.querySelectorAll('[data-form-btn="next"]')
      );
      const backBtns = Array.from(
        panel.querySelectorAll('[data-form-btn="back"]')
      );

      nextBtns.forEach((btnWrap) => {
        btnWrap.addEventListener("click", (ev) => {
          const btn = ev.target.closest("button, a") || btnWrap;
          const isSubmit = btn && btn.getAttribute("type") === "submit";
          if (isSubmit) return; // Let Webflow handle submit
          if (btnWrap.classList.contains("is-disabled")) return; // block clicks
          ev.preventDefault();
          goToStep(activeIndex + 1);
        });
      });

      backBtns.forEach((btnWrap) => {
        btnWrap.addEventListener("click", (ev) => {
          ev.preventDefault();
          goToStep(activeIndex - 1);
        });
      });

      // Initialize validation state for each panel
      handleValidationState(panel);
      // Observe input changes for validation
      const inputs = panel.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
      );
      inputs.forEach((input) => {
        input.addEventListener("change", () => handleValidationState(panel));
      });
    });

    const radioSelectors = ['input[type="radio"]', 'input[type="checkbox"]'];
    radioSelectors.forEach((sel) => {
      form.querySelectorAll(sel).forEach((input) => {
        input.addEventListener("change", () => syncInputVisualState(input));
        syncInputVisualState(input);
      });
    });

    function syncInputVisualState(input) {
      const radioParent = input.closest(".advice_riding_radio_field");
      const checkboxParent = input.closest(
        ".form_ui_item, .advice_form_content_input_chekcbox"
      );
      const visualParent = radioParent || checkboxParent || input.parentElement;

      if (input.type === "radio") {
        const group = form.querySelectorAll(
          `input[type="radio"][name="${CSS.escape(input.name)}"]`
        );
        group.forEach((r) => {
          const parent =
            r.closest(".advice_riding_radio_field") ||
            r.closest(".form_ui_item");
          if (parent) parent.classList.toggle("is-selected", !!r.checked);
        });
      } else if (input.type === "checkbox") {
        if (visualParent)
          visualParent.classList.toggle("is-selected", !!input.checked);
      }
    }

    /** Validation logic **/
    function handleValidationState(panel) {
      const nextBtn = panel.querySelector('[data-form-btn="next"]');
      if (!nextBtn) return;

      const radios = panel.querySelectorAll('input[type="radio"]');
      const checkboxes = panel.querySelectorAll('input[type="checkbox"]');

      let isValid = false;
      if (radios.length > 0) {
        isValid = Array.from(radios).some((r) => r.checked);
      } else if (checkboxes.length > 0) {
        isValid = Array.from(checkboxes).some((c) => c.checked);
      } else {
        // No inputs (like last step), automatically valid
        isValid = true;
      }

      nextBtn.classList.toggle("is-disabled", !isValid);
      nextBtn.setAttribute("aria-disabled", !isValid ? "true" : "false");
    }

    function goToStep(index) {
      if (index < 0 || index >= panels.length) return;

      panels[activeIndex].classList.add("is-hidden");
      panels[activeIndex].setAttribute("aria-hidden", "true");
      const prevLeft = leftStepItems[activeIndex];
      if (prevLeft) {
        prevLeft.classList.remove("is-active");
        prevLeft.removeAttribute("aria-current");
      }

      activeIndex = index;
      panels[activeIndex].classList.remove("is-hidden");
      panels[activeIndex].setAttribute("aria-hidden", "false");
      const newLeft = leftStepItems[activeIndex];
      if (newLeft) {
        newLeft.classList.add("is-active");
        newLeft.setAttribute("aria-current", "step");
      }

      focusFirstIn(panels[activeIndex]);
      // Re-check button validation when changing steps
      handleValidationState(panels[activeIndex]);
    }

    function focusFirstIn(container) {
      const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
    }

    form.addEventListener("keydown", (ev) => {
      const tag = (
        (document.activeElement && document.activeElement.tagName) ||
        ""
      ).toLowerCase();
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        goToStep(activeIndex + 1);
      }
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        goToStep(activeIndex - 1);
      }
      if (ev.key === "Enter" && tag !== "textarea") {
        const currPanel = panels[activeIndex];
        const nextBtnWrap =
          currPanel &&
          currPanel.querySelector('[data-form-btn="next"]:not(.is-disabled)');
        if (nextBtnWrap) {
          ev.preventDefault();
          const actionable =
            nextBtnWrap.querySelector("button, a") || nextBtnWrap;
          actionable.click();
        }
      }
    });

    // Initialize validation states for all panels
    panels.forEach(handleValidationState);
  }
})();
// Multistep Form End

// TOC
// Wait for the entire page to load before running the script
window.addEventListener("load", () => {
  // Select all the Table of Contents items
  const tocItems = document.querySelectorAll(".legal_toc_item");

  // Check if any TOC items exist to avoid errors
  if (tocItems.length > 0) {
    // Loop through each TOC item
    tocItems.forEach((item) => {
      // Find the link and the number elements within the current item
      const linkElement = item.querySelector('[fs-toc-element="link"]');
      const numberElement = item.querySelector(".legal_toc_link_number");

      // Proceed only if both elements are found
      if (linkElement && numberElement) {
        // Get the full text content from the link (e.g., "1. General Provisions")
        const originalText = linkElement.textContent.trim();

        // Find the position of the first period '.' to isolate the number
        const dotIndex = originalText.indexOf(".");

        if (dotIndex !== -1) {
          // Extract the number part (e.g., "1")
          const number = originalText.substring(0, dotIndex);

          // Extract the text part and trim any leading space (e.g., "General Provisions")
          const text = originalText.substring(dotIndex + 1).trim();

          // Format the number to have a leading zero (e.g., "01", "12")
          const formattedNumber = number.padStart(2, "0");

          // Update the elements
          numberElement.textContent = `[${formattedNumber}]`; // Set the number text
          linkElement.textContent = text; // Set the cleaned link text
        }
      }
    });
  }
});

// Footer Animation
function footerAnim() {
  const footer = document.querySelector(".footer_wrap");
  const svgLogo = footer.querySelector("#footer-logo");
  const paths = svgLogo.querySelectorAll("path");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: "top 40%",
      end: "bottom bottom",
    },
  });

  tl.from(paths, {
    yPercent: 40,
    opacity: 0,
    filter: "blur(5px)",
    stagger: 0.1,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  footerAnim();
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error(
      "GSAP or ScrollTrigger is not loaded. Please include the libraries."
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function initScrollAnimations() {
    // Group elements by animation type for better organization
    const animationGroups = {
      "slide-up": [],
      "slide-from-left": [],
      "slide-from-right": [],
    };

    const animatedElements = gsap.utils.toArray("[data-scroll-animation]");

    animatedElements.forEach((element) => {
      const animationType = element.getAttribute("data-scroll-animation");

      if (!animationGroups.hasOwnProperty(animationType)) {
        console.warn(`Unknown animation type: ${animationType}`);
        return;
      }

      // Set initial state based on animation type
      switch (animationType) {
        case "slide-up":
          gsap.set(element, { opacity: 0, y: 40, filter: "blur(5px)" });
          break;
        case "slide-from-left":
          gsap.set(element, { opacity: 0, x: -100, filter: "blur(5px)" });
          break;
        case "slide-from-right":
          gsap.set(element, { opacity: 0, x: 100, filter: "blur(5px)" });
          break;
      }

      animationGroups[animationType].push(element);
    });

    for (const [animationType, elements] of Object.entries(animationGroups)) {
      if (elements.length === 0) continue;

      ScrollTrigger.batch(elements, {
        start: "top 90%",
        end: "bottom center",
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            x: 0,
            filter: "blur(0px)",
            stagger: 0.1,
            duration: 1,
            ease: "power2.out",
            overwrite: true,
          });
        },
        // markers: true
      });
    }
  }

  initScrollAnimations();
});

// Input Validation
document.addEventListener("DOMContentLoaded", function () {
  // Wählt alle Eingabefelder mit dem Typ "email" aus
  const emailInputs = document.querySelectorAll('input[type="email"]');

  // Geht durch jedes gefundene E-Mail-Eingabefeld
  emailInputs.forEach((emailInput) => {
    // Findet das Geschwister-Element für die Fehlermeldung
    const errorMsgElement = emailInput.nextElementSibling;

    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    ) {
      console.error(
        "Fehlermeldungs-Element für ein E-Mail-Feld nicht gefunden.",
        emailInput
      );
      return; // Überspringt dieses Feld, wenn keine Fehlermeldung vorhanden ist
    }

    emailInput.addEventListener("blur", function () {
      const email = this.value.trim();
      const emailParts = email.split("@");

      if (emailParts.length === 2 && emailParts[1].length > 0) {
        const domain = emailParts[1];
        validateDomain(domain, errorMsgElement);
      } else if (email.length > 0) {
        showError(
          "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
          errorMsgElement
        );
      } else {
        hideError(errorMsgElement); // Blendet Fehler aus, wenn das Feld leer ist
      }
    });
  });

  async function validateDomain(domain, errorElement) {
    try {
      // Zeigt eine Lade-/Prüfnachricht an
      showError("Domain wird überprüft...", errorElement);

      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();

      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement); // Domain ist gültig
      } else {
        showError(
          "Die E-Mail-Domain scheint ungültig oder nicht existent zu sein.",
          errorElement
        );
      }
    } catch (error) {
      console.error("Fehler bei der Domain-Validierung:", error);
      // Optional: Zeigt einen Fehler an, falls die API nicht erreichbar ist
      showError(
        "Validierung fehlgeschlagen. Bitte prüfen Sie Ihre Verbindung.",
        errorElement
      );
    }
  }

  function showError(message, element) {
    element.textContent = message;
    element.style.display = "block";
  }

  function hideError(element) {
    element.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Select all input fields with type="tel"
  const telInputs = document.querySelectorAll('input[type="tel"]');

  telInputs.forEach((telInput) => {
    const errorMsgElement = telInput.nextElementSibling;

    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    ) {
      console.error(
        "Could not find the error message element for a telephone input.",
        telInput
      );
      return;
    }

    telInput.addEventListener("input", function (event) {
      const originalValue = this.value;
      // Remove any character that is not a digit, except for a leading '+'
      let sanitizedValue = originalValue.replace(/[^\d+]/g, "");

      // Ensure '+' only appears at the beginning
      if (sanitizedValue.lastIndexOf("+") > 0) {
        sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
      }

      // If the first character is not a digit or a plus, remove it
      if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue)) {
        sanitizedValue = sanitizedValue.substring(1);
      }

      // Update the input's value only if it changed
      if (originalValue !== sanitizedValue) {
        this.value = sanitizedValue;
      }

      // Simple validation check for the error message
      // (Can be customized, e.g., to check for minimum length)
      if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
        showError(
          "Nur Zahlen und ein führendes + sind erlaubt.",
          errorMsgElement
        );
      } else {
        hideError(errorMsgElement);
      }
    });

    // Helper functions to show/hide errors (if not already present)
    function showError(message, element) {
      element.textContent = message;
      element.style.display = "block";
    }

    function hideError(element) {
      element.style.display = "none";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const allFilterDropdowns = document.querySelectorAll(
    ".shop_filters_dropdown"
  );

  allFilterDropdowns.forEach((dropdown) => {
    const searchInput = dropdown.querySelector(".input_search");
    const brandListContainer = dropdown.querySelector('[sf-filter="vendor"]');

    if (!searchInput || !brandListContainer) return;

    if (dropdown.dataset.brandFilterInitialized) return;
    dropdown.dataset.brandFilterInitialized = "true";

    const brandItems = brandListContainer.querySelectorAll(".w-dyn-item");

    searchInput.addEventListener("input", () => {
      const searchQuery = searchInput.value.toLowerCase().trim();
      brandItems.forEach((item) => {
        const brandNameElement = item.querySelector(".filters_item_text");
        if (!brandNameElement) return;
        const brandName = brandNameElement.textContent.toLowerCase();
        item.style.display = brandName.includes(searchQuery) ? "" : "none";
      });
    });
  });
});

// ============================================================
// URL PARAMS <-> FILTER MAPPING CONFIG
// ============================================================
const FILTER_PARAM_MAP = {
  category: { selector: '[sf-filter="collections"]', type: "sf-multi" },
  brand: { selector: '[sf-filter="vendor"]', type: "sf-multi" },
  size: { selector: '[sf-option-filter="Rahmenmaß"]', type: "sf-multi" },
  frame: { selector: '[sf-option-filter="rahmen"]', type: "sf-multi" },
  color: { selector: '[sf-option-filter="farbe"]', type: "sf-multi" },
  sale: { selector: '[data-filter="sale"]', type: "custom-toggle" },
  sort: { selector: 'input[name="Sort-By"]', type: "radio" },
  search: { selector: '[data-input-el="title"]', type: "text" },
  price_from: { selector: '[data-input-el="price-from"]', type: "text" },
  price_to: { selector: '[data-input-el="price-to"]', type: "text" },
};

const QUICK_FILTER_PARAM_TYPE_MAP = {
  category: FILTER_PARAM_MAP.category,
  brand: FILTER_PARAM_MAP.brand,
  size: FILTER_PARAM_MAP.size,
  frame: FILTER_PARAM_MAP.frame,
  color: FILTER_PARAM_MAP.color,
};

// ============================================================
// GLOBAL STATE
// ============================================================
const itemsPerPage = 12;
let currentlyVisibleCount = itemsPerPage;
let saleFilterActive = false;
let isInitialized = false;

let sidebarFilterContainer = null;
let sidebarPlaceholder = null;

// ============================================================
// URL PARAMETER UTILITIES
// ============================================================

function buildURLParamsFromState() {
  const params = new URLSearchParams();

  const filterContainer = document.querySelector(
    '[data-filter-container="element"]'
  );
  if (!filterContainer) return params;

  Object.entries(FILTER_PARAM_MAP).forEach(([paramName, config]) => {
    if (config.type === "sf-multi") {
      const container = filterContainer.querySelector(config.selector);
      if (!container) return;

      const activeItems = container.querySelectorAll(".w-dyn-item.sf-active");
      const values = [];
      activeItems.forEach((item) => {
        const val = item.getAttribute("sf-filter-value");
        if (val) values.push(val);
      });
      if (values.length > 0) {
        params.set(paramName, values.join(","));
      }
    }
  });

  if (saleFilterActive) {
    params.set("sale", "true");
  }

  const sortRadios = filterContainer.querySelectorAll('input[name="Sort-By"]');
  const checkedSort = Array.from(sortRadios).find((r) => r.checked);
  if (checkedSort) {
    params.set("sort", checkedSort.value);
  }

  const searchInput = document.querySelector('[data-input-el="title"]');
  if (searchInput && searchInput.value.trim()) {
    params.set("search", searchInput.value.trim());
  }

  const fromInput = filterContainer.querySelector(
    '[data-input-el="price-from"]'
  );
  const toInput = filterContainer.querySelector('[data-input-el="price-to"]');
  if (fromInput && fromInput.value.trim()) {
    params.set("price_from", fromInput.value.trim());
  }
  if (toInput && toInput.value.trim()) {
    params.set("price_to", toInput.value.trim());
  }

  return params;
}

function updateURL() {
  const params = buildURLParamsFromState();
  const newURL =
    params.toString().length > 0
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
  window.history.replaceState({}, "", newURL);
}

function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

// ============================================================
// DIALOG FILTER DOM MOVEMENT
// ============================================================

function moveFiltersToDialog() {
  const source = document.querySelector('[data-filter-container="element"]');
  const target = document.querySelector('[data-filter-container="target"]');
  if (!source || !target) return;

  sidebarFilterContainer = source;

  if (!sidebarPlaceholder) {
    sidebarPlaceholder = document.createElement("div");
    sidebarPlaceholder.setAttribute("data-filter-placeholder", "true");
    sidebarPlaceholder.style.display = "none";
  }

  target.innerHTML = "";
  source.insertBefore(sidebarPlaceholder, source.firstChild);

  while (source.children.length > 1) {
    const child = source.children[1];
    target.appendChild(child);
  }
}

function moveFiltersToSidebar() {
  const source = document.querySelector('[data-filter-container="element"]');
  const target = document.querySelector('[data-filter-container="target"]');
  if (!source || !target) return;

  while (target.firstChild) {
    source.appendChild(target.firstChild);
  }

  if (sidebarPlaceholder && sidebarPlaceholder.parentNode) {
    sidebarPlaceholder.parentNode.removeChild(sidebarPlaceholder);
  }
}

function setupDialogFilterMovement() {
  const dialog = document.querySelector("#filter-modal");
  if (!dialog) return;

  const openBtn = document.querySelector("[data-filter-element='open-btn']");
  const closeBtn = document.querySelector("[data-filter-element='close-btn']");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      moveFiltersToDialog();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      moveFiltersToSidebar();
    });
  }

  dialog.addEventListener("close", () => {
    moveFiltersToSidebar();
  });
}

// ============================================================
// SHOPYFLOW CLICK SIMULATION
// ============================================================

function activateSfFilterItem(containerSelector, filterValue) {
  const filterContainer =
    document.querySelector('[data-filter-container="element"]') ||
    document.querySelector('[data-filter-container="target"]');

  if (!filterContainer) return;

  const container = filterContainer.querySelector(containerSelector);
  if (!container) return;

  const items = container.querySelectorAll(".w-dyn-item");
  items.forEach((item) => {
    const itemValue = item.getAttribute("sf-filter-value");
    if (
      itemValue &&
      itemValue.toLowerCase() === filterValue.toLowerCase() &&
      !item.classList.contains("sf-active")
    ) {
      item.click();
    }
  });
}

// ============================================================
// QUICK FILTER
// ============================================================

function handleQuickFilter(filterValue, filterType) {
  const config = QUICK_FILTER_PARAM_TYPE_MAP[filterType];
  if (!config) {
    console.warn(
      `[QuickFilter] Unknown filter type: "${filterType}". ` +
        `Must be one of: ${Object.keys(QUICK_FILTER_PARAM_TYPE_MAP).join(", ")}`
    );
    return;
  }

  activateSfFilterItem(config.selector, filterValue);

  setTimeout(() => {
    performSort();
    applyAllFilters(true);
    updateURL();
  }, 200);
}

function initializeQuickFilters() {
  document.addEventListener("click", (e) => {
    // Quick filters work even before isInitialized is true
    // because they may be on pages without the filter panel

    const quickFilterEl = e.target.closest("[data-quick-filter]");
    if (!quickFilterEl) return;

    const filterValue = quickFilterEl.getAttribute("data-quick-filter");
    const filterType = quickFilterEl.getAttribute("data-quick-filter-type");

    if (!filterValue || !filterType) {
      console.warn(
        "[QuickFilter] Element is missing data-quick-filter or " +
          "data-quick-filter-type attribute.",
        quickFilterEl
      );
      return;
    }

    const config = QUICK_FILTER_PARAM_TYPE_MAP[filterType];
    if (!config) {
      console.warn(
        `[QuickFilter] Unknown filter type: "${filterType}". ` +
          `Must be one of: ${Object.keys(QUICK_FILTER_PARAM_TYPE_MAP).join(
            ", "
          )}`
      );
      return;
    }

    // Resolve the anchor — the element itself may be an <a>,
    // or it may be a child of an <a> (e.g. a div inside a link block)
    const anchor =
      quickFilterEl.tagName === "A"
        ? quickFilterEl
        : quickFilterEl.closest("a");

    // Determine if the link points to the current page or a different one
    const isSamePage =
      !anchor ||
      !anchor.href ||
      new URL(anchor.href, window.location.origin).pathname ===
        window.location.pathname;

    if (isSamePage) {
      // Already on the target page — activate the filter directly
      e.preventDefault();
      if (isInitialized) {
        handleQuickFilter(filterValue, filterType);
      }
    } else {
      // Different page — navigate to href with the filter param appended.
      // We intentionally do NOT call e.preventDefault() first so the
      // browser handles the navigation; we just override the destination.
      e.preventDefault();
      const targetURL = new URL(anchor.href, window.location.origin);
      // Append to any existing values for this param (supports multi-select)
      const existing = targetURL.searchParams.get(filterType);
      if (existing) {
        const values = existing.split(",").map((v) => v.trim());
        if (!values.includes(filterValue)) {
          values.push(filterValue);
          targetURL.searchParams.set(filterType, values.join(","));
        }
      } else {
        targetURL.searchParams.set(filterType, filterValue);
      }
      window.location.href = targetURL.toString();
    }
  });
}

// ============================================================
// SALE FILTER LOGIC
// ============================================================

function isProductOnSale(productEl) {
  const priceEl = productEl.querySelector("[sf-show-price]");
  const comparePriceEl = productEl.querySelector("[sf-show-compare-price]");

  if (!priceEl || !comparePriceEl) return false;

  if (comparePriceEl.getAttribute("sf-hide") === "true") return false;

  const comparePriceText = comparePriceEl.textContent.trim();
  if (
    !comparePriceText ||
    comparePriceEl.classList.contains("w-dyn-bind-empty")
  )
    return false;

  const parsePrice = (text) => {
    if (!text) return 0;
    return parseFloat(
      text.replace(/[€]/g, "").replace(/\./g, "").replace(",", ".").trim()
    );
  };

  const price = parsePrice(priceEl.textContent);
  const comparePrice = parsePrice(comparePriceText);

  return comparePrice > price && comparePrice > 0;
}

function toggleSaleFilter(forceState) {
  if (typeof forceState === "boolean") {
    saleFilterActive = forceState;
  } else {
    saleFilterActive = !saleFilterActive;
  }

  const saleItems = document.querySelectorAll('[data-filter="sale"]');
  saleItems.forEach((saleItem) => {
    const elements = [
      saleItem,
      saleItem.querySelector(".filters_item_checkbox"),
      saleItem.querySelector(".filters_item_checkbox_icon"),
      saleItem.querySelector(".filters_item_text"),
    ].filter(Boolean);

    elements.forEach((el) => {
      if (saleFilterActive) {
        el.classList.add("sf-active");
      } else {
        el.classList.remove("sf-active");
      }
    });
  });
}

// ============================================================
// APPLY FILTERS
// ============================================================

function applyAllFilters(shouldResetPagination = false) {
  if (shouldResetPagination) {
    currentlyVisibleCount = itemsPerPage;
  }

  const productListContainer = document.querySelector('[sf-list="1"]');
  if (!productListContainer) return;

  const currentProducts =
    productListContainer.querySelectorAll(".product_item_wrap");

  const noResultsMessage = document.querySelector('[sf-no-result="1"]');
  const loadMoreButton = document.querySelector(
    '[data-btn-pagination="load-more"]'
  );

  const searchInput = document.querySelector('[data-input-el="title"]');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const sidebarContainer = document.querySelector(
    '[data-filter-container="element"]'
  );
  const dialogContainer = document.querySelector(
    '[data-filter-container="target"]'
  );

  const fromInput =
    (sidebarContainer &&
      sidebarContainer.querySelector('[data-input-el="price-from"]')) ||
    (dialogContainer &&
      dialogContainer.querySelector('[data-input-el="price-from"]'));

  const toInput =
    (sidebarContainer &&
      sidebarContainer.querySelector('[data-input-el="price-to"]')) ||
    (dialogContainer &&
      dialogContainer.querySelector('[data-input-el="price-to"]'));

  const fromPrice =
    fromInput && fromInput.value ? parseFloat(fromInput.value) : 0;
  const toPrice =
    toInput && toInput.value ? parseFloat(toInput.value) : Infinity;

  const lowerBound = isNaN(fromPrice) ? 0 : fromPrice;
  const upperBound = isNaN(toPrice) ? Infinity : toPrice;

  let matchedProductsCount = 0;

  currentProducts.forEach((product) => {
    const titleElement = product.querySelector('[data-product-el="title"]');
    const productTitle = titleElement
      ? titleElement.textContent.toLowerCase()
      : "";
    const productPrice = parseFloat(product.dataset.price || 0);

    const titleMatch = productTitle.includes(searchTerm);
    const priceMatch = productPrice >= lowerBound && productPrice <= upperBound;

    let saleMatch = true;
    if (saleFilterActive) {
      saleMatch = isProductOnSale(product);
    }

    if (titleMatch && priceMatch && saleMatch) {
      matchedProductsCount++;
      if (matchedProductsCount <= currentlyVisibleCount) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    } else {
      product.style.display = "none";
    }
  });

  if (loadMoreButton) {
    loadMoreButton.style.display =
      matchedProductsCount > currentlyVisibleCount ? "flex" : "none";
  }
  if (noResultsMessage) {
    noResultsMessage.style.display =
      matchedProductsCount === 0 ? "flex" : "none";
  }
}

// ============================================================
// SORTING
// ============================================================

function performSort() {
  const productListContainer = document.querySelector('[sf-list="1"]');
  if (!productListContainer) return;

  const allSortRadios = document.querySelectorAll('input[name="Sort-By"]');
  const checkedRadio = Array.from(allSortRadios).find((r) => r.checked);
  if (!checkedRadio) return;

  const direction = checkedRadio.value === "asc" ? "asc" : "desc";

  const currentProducts = Array.from(
    productListContainer.querySelectorAll(".product_item_wrap")
  );

  currentProducts.sort((a, b) => {
    const priceA = parseFloat(a.dataset.price);
    const priceB = parseFloat(b.dataset.price);
    return direction === "asc" ? priceA - priceB : priceB - priceA;
  });

  currentProducts.forEach((product, index) => {
    product.style.order = index;
  });
}

// ============================================================
// APPLY URL PARAMS TO FILTERS
// ============================================================

function applyURLParamsToFilters() {
  const params = readURLParams();
  if (Object.keys(params).length === 0) return;

  const sfClickQueue = [];

  ["category", "brand", "size", "frame", "color"].forEach((paramName) => {
    if (!params[paramName]) return;
    const config = FILTER_PARAM_MAP[paramName];
    const values = params[paramName].split(",").map((v) => v.trim());
    values.forEach((value) => {
      sfClickQueue.push(() => activateSfFilterItem(config.selector, value));
    });
  });

  if (params.sale === "true") {
    toggleSaleFilter(true);
  }

  if (params.sort) {
    const allSortRadios = document.querySelectorAll('input[name="Sort-By"]');
    allSortRadios.forEach((radio) => {
      radio.checked = radio.value === params.sort;
    });
  }

  if (params.search) {
    const searchInputs = document.querySelectorAll('[data-input-el="title"]');
    searchInputs.forEach((input) => {
      input.value = params.search;
    });
  }

  if (params.price_from) {
    const fromInputs = document.querySelectorAll(
      '[data-input-el="price-from"]'
    );
    fromInputs.forEach((input) => {
      input.value = params.price_from;
    });
  }
  if (params.price_to) {
    const toInputs = document.querySelectorAll('[data-input-el="price-to"]');
    toInputs.forEach((input) => {
      input.value = params.price_to;
    });
  }

  if (sfClickQueue.length > 0) {
    let clickIndex = 0;
    const processNextClick = () => {
      if (clickIndex < sfClickQueue.length) {
        sfClickQueue[clickIndex]();
        clickIndex++;
        setTimeout(processNextClick, 150);
      } else {
        setTimeout(() => {
          performSort();
          applyAllFilters(true);
        }, 300);
      }
    };
    processNextClick();
  } else {
    setTimeout(() => {
      performSort();
      applyAllFilters(true);
    }, 200);
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function initializeEventListeners() {
  document.addEventListener("click", (e) => {
    if (!isInitialized) return;

    // Skip — handled by initializeQuickFilters
    if (e.target.closest("[data-quick-filter]")) return;

    const sfFilterItem = e.target.closest("[sf-filter-value]");
    if (sfFilterItem) {
      const inFilter = sfFilterItem.closest("[sf-filter], [sf-option-filter]");
      if (inFilter) {
        setTimeout(() => {
          performSort();
          applyAllFilters(true);
          updateURL();
        }, 200);
      }
      return;
    }

    const saleItem = e.target.closest('[data-filter="sale"]');
    if (saleItem) {
      toggleSaleFilter();
      setTimeout(() => {
        applyAllFilters(true);
        updateURL();
      }, 50);
      return;
    }

    const radioField = e.target.closest(".shop_filters_dropdown_radio_field");
    if (radioField) {
      const radioInput = radioField.querySelector('input[name="Sort-By"]');
      if (radioInput) {
        setTimeout(() => {
          const allSortRadios = document.querySelectorAll(
            'input[name="Sort-By"]'
          );
          allSortRadios.forEach(
            (r) => (r.checked = r.value === radioInput.value)
          );
          performSort();
          applyAllFilters(false);
          updateURL();
        }, 50);
      }
      return;
    }
  });

  const loadMoreButton = document.querySelector(
    '[data-btn-pagination="load-more"]'
  );
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentlyVisibleCount += itemsPerPage;
      applyAllFilters(false);
    });
  }

  const searchInput = document.querySelector('[data-input-el="title"]');
  if (searchInput) {
    let searchDebounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        applyAllFilters(true);
        updateURL();
      }, 300);
    });
  }

  let priceDebounce;
  document.addEventListener("input", (e) => {
    if (!isInitialized) return;

    const input = e.target;
    const isPriceFrom = input.getAttribute("data-input-el") === "price-from";
    const isPriceTo = input.getAttribute("data-input-el") === "price-to";

    if (isPriceFrom || isPriceTo) {
      let val = input.value.replace(/[^0-9.]/g, "");
      const parts = val.split(".");
      if (parts.length > 1) val = parts[0] + "." + parts.slice(1).join("");
      if (input.value !== val) input.value = val;

      clearTimeout(priceDebounce);
      priceDebounce = setTimeout(() => {
        applyAllFilters(true);
        updateURL();
      }, 300);
    }
  });
}

// ============================================================
// PRE-PROCESS PRODUCT DATA
// ============================================================

function preProcessProductData() {
  const allProducts = document.querySelectorAll(".product_item_wrap");
  allProducts.forEach((product) => {
    const priceElement = product.querySelector('[data-product-el="price"]');
    if (priceElement && priceElement.textContent) {
      const priceText = priceElement.textContent
        .replace(/[€]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
      const priceValue = parseFloat(priceText);
      product.dataset.price = isNaN(priceValue) ? 0 : priceValue;
    } else {
      product.dataset.price = 0;
    }
  });
}

// ============================================================
// SHOPYFLOW READY DETECTION (MutationObserver)
// ============================================================

function waitForShopyflow() {
  const productList = document.querySelector('[sf-list="1"]');

  if (!productList) {
    setTimeout(waitForShopyflow, 200);
    return;
  }

  const alreadyFetched = productList.querySelector('[sf-data-fetched="true"]');
  if (alreadyFetched) {
    initializeApp();
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "sf-data-fetched"
      ) {
        if (mutation.target.getAttribute("sf-data-fetched") === "true") {
          observer.disconnect();
          setTimeout(() => initializeApp(), 100);
          return;
        }
      }
      if (mutation.type === "childList") {
        const fetched = productList.querySelector('[sf-data-fetched="true"]');
        if (fetched) {
          observer.disconnect();
          setTimeout(() => initializeApp(), 100);
          return;
        }
      }
    }
  });

  observer.observe(productList, {
    attributes: true,
    attributeFilter: ["sf-data-fetched"],
    subtree: true,
    childList: true,
  });

  setTimeout(() => {
    if (!isInitialized) {
      observer.disconnect();
      initializeApp();
    }
  }, 5000);
}

// ============================================================
// MAIN INITIALIZATION
// ============================================================

function initializeApp() {
  if (isInitialized) return;
  isInitialized = true;

  preProcessProductData();
  setupDialogFilterMovement();
  initializeEventListeners();
  initializeQuickFilters();

  const params = readURLParams();
  if (Object.keys(params).length > 0) {
    applyURLParamsToFilters();
  } else {
    performSort();
    applyAllFilters(true);
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Quick filters are registered immediately on DOMContentLoaded
  // so they work on ANY page, even those without the shop filter panel.
  // The initializeApp() path (which requires Shopyflow) is only
  // triggered on pages that have the product list.
  initializeQuickFilters();
  waitForShopyflow();
});

(function () {
  // 1. Robust function to convert currency strings to valid numbers
  function cleanPriceToNumber(priceStr) {
    if (!priceStr) return "";

    // Skip if it's already a valid plain number (e.g., "54.99")
    if (/^\d+(\.\d+)?$/.test(priceStr)) return priceStr;

    // Remove everything except numbers, dots, and commas (e.g. €54,99 -> 54,99)
    let cleanStr = priceStr.replace(/[^\d.,]/g, "");
    if (!cleanStr) return "";

    // Determine if the format is European (1.299,00) or US (1,299.00)
    let lastComma = cleanStr.lastIndexOf(",");
    let lastDot = cleanStr.lastIndexOf(".");
    let isEuropean = lastComma > lastDot;

    if (isEuropean) {
      cleanStr = cleanStr.replace(/\./g, ""); // Remove thousand separators
      cleanStr = cleanStr.replace(/,/g, "."); // Convert decimal comma to dot
    } else {
      cleanStr = cleanStr.replace(/,/g, ""); // Remove thousand separators
    }

    // Parse to float and return as string for the attribute
    let finalNumber = parseFloat(cleanStr);
    return isNaN(finalNumber) ? "" : finalNumber.toString();
  }

  // 2. Function to process JobRad widgets
  function processJobradWidgets(node) {
    // Find widgets either as the node itself or within its children
    const widgets =
      node.tagName === "JOBRAD-PRICE-WIDGET"
        ? [node]
        : node.querySelectorAll
        ? node.querySelectorAll("jobrad-price-widget")
        : [];

    widgets.forEach((widget) => {
      const rawActual = widget.getAttribute("data-actual-price");
      const rawUvp = widget.getAttribute("data-uvp-price");

      // Clean both prices first
      const cleanActual = cleanPriceToNumber(rawActual);
      const cleanUvp = cleanPriceToNumber(rawUvp);

      // A. Update Actual Price if it contains non-number/non-dot characters (like € or ,)
      if (rawActual && /[^\d.]/.test(rawActual)) {
        widget.setAttribute("data-actual-price", cleanActual);
      }

      // B. Logic for UVP Price
      // If UVP is missing, empty, or equates to "0" (e.g. "€ 0,00"), mirror the actual price
      if (!cleanUvp || cleanUvp === "0") {
        // Only set if it isn't already matching, to prevent infinite loops from the observer
        if (widget.getAttribute("data-uvp-price") !== cleanActual) {
          widget.setAttribute("data-uvp-price", cleanActual);
        }
      } else {
        // Otherwise, if UVP has a valid value but needs currency formatting stripped, clean it
        if (rawUvp && /[^\d.]/.test(rawUvp)) {
          widget.setAttribute("data-uvp-price", cleanUvp);
        }
      }
    });
  }

  // 3. Process elements immediately on initial page load
  document.addEventListener("DOMContentLoaded", () => {
    processJobradWidgets(document.body);
  });
  // Fallback for elements already rendered before DOMContentLoaded fires
  processJobradWidgets(document.body);

  // 4. Set up a MutationObserver to handle Shopyflow dynamic variant changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // If Shopyflow updates the widget's attributes directly
      if (
        mutation.type === "attributes" &&
        mutation.target.tagName === "JOBRAD-PRICE-WIDGET"
      ) {
        if (
          mutation.attributeName === "data-actual-price" ||
          mutation.attributeName === "data-uvp-price"
        ) {
          processJobradWidgets(mutation.target);
        }
      }
      // If Shopyflow completely replaces the node/wrapper inside the DOM
      else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          processJobradWidgets(node);
        });
      }
    });
  });

  // Start observing the entire body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-actual-price", "data-uvp-price"],
  });
})();
