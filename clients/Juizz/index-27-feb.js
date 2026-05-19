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
  // Select all filter dropdown components on the page
  const allFilterDropdowns = document.querySelectorAll(
    ".shop_filters_dropdown"
  );

  allFilterDropdowns.forEach((dropdown) => {
    // For each dropdown, try to find a search input and a vendor filter list
    const searchInput = dropdown.querySelector(".input_search");
    const brandListContainer = dropdown.querySelector('[sf-filter="vendor"]');

    // If a dropdown doesn't have both a search input and a brand list, skip it
    if (!searchInput || !brandListContainer) {
      return;
    }

    // --- Script Initialization Guard ---
    // Prevents the script from running more than once on the same element
    if (dropdown.dataset.brandFilterInitialized) return;
    dropdown.dataset.brandFilterInitialized = "true";

    // Get all the individual brand items within this specific dropdown
    const brandItems = brandListContainer.querySelectorAll(".w-dyn-item");

    // --- Event Listener ---
    // Listen for the 'input' event, which fires every time the user types, pastes, or deletes text
    searchInput.addEventListener("input", () => {
      // Get the current value from the search input, convert to lowercase, and trim whitespace
      const searchQuery = searchInput.value.toLowerCase().trim();

      // --- Filtering Logic ---
      // Loop through each brand item to decide if it should be shown or hidden
      brandItems.forEach((item) => {
        // Find the element containing the brand name text
        const brandNameElement = item.querySelector(".filters_item_text");

        // Safety check in case the text element doesn't exist
        if (!brandNameElement) return;

        const brandName = brandNameElement.textContent.toLowerCase();

        // Check if the brand name includes the search query
        if (brandName.includes(searchQuery)) {
          // If it's a match, ensure the item is visible
          item.style.display = ""; // Resetting display lets CSS control it
        } else {
          // If it's not a match, hide the item
          item.style.display = "none";
        }
      });
    });
  });
});

// --- Global Configuration ---
const itemsPerPage = 12;
let currentlyVisibleCount = itemsPerPage;

/**
 * A centralized function that filters and paginates the CURRENTLY VISIBLE products in the DOM.
 * @param {boolean} shouldResetPagination - If true, resets view to the first page.
 */
function applyAllFilters(shouldResetPagination = false) {
  if (shouldResetPagination) {
    currentlyVisibleCount = itemsPerPage;
  }

  const productListContainer = document.querySelector('[sf-list="1"]');
  if (!productListContainer) return;

  // CRITICAL: Query the DOM for the live, current list of products every time.
  // This list contains only the items Shopyflow has NOT removed.
  const currentProducts =
    productListContainer.querySelectorAll(".product_item_wrap");

  const noResultsMessage = document.querySelector('[sf-no-result="1"]');
  const loadMoreButton = document.querySelector(
    '[data-btn-pagination="load-more"]'
  );

  // Get current custom filter values
  const searchInput = document.querySelector('[data-input-el="title"]');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const fromInput = document.querySelector('[data-input-el="price-from"]');
  const toInput = document.querySelector('[data-input-el="price-to"]');

  const fromPrice =
    fromInput && fromInput.value ? parseFloat(fromInput.value) : 0;
  const toPrice =
    toInput && toInput.value ? parseFloat(toInput.value) : Infinity;

  const lowerBound = isNaN(fromPrice) ? 0 : fromPrice;
  const upperBound = isNaN(toPrice) ? Infinity : toPrice;

  let matchedProductsCount = 0;

  // This time, we loop through the LIVE list of products.
  currentProducts.forEach((product) => {
    // Get data for custom filtering
    const titleElement = product.querySelector('[data-product-el="title"]');
    const productTitle = titleElement
      ? titleElement.textContent.toLowerCase()
      : "";
    const productPrice = parseFloat(product.dataset.price || 0);

    // Custom Filter Conditions
    const titleMatch = productTitle.includes(searchTerm);
    const priceMatch = productPrice >= lowerBound && productPrice <= upperBound;

    if (titleMatch && priceMatch) {
      matchedProductsCount++;
      // Apply pagination to this pre-filtered list
      if (matchedProductsCount <= currentlyVisibleCount) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    } else {
      product.style.display = "none";
    }
  });

  // Update "Load More" & "No Results" based on the final count
  if (loadMoreButton) {
    loadMoreButton.style.display =
      matchedProductsCount > currentlyVisibleCount ? "flex" : "none";
  }
  if (noResultsMessage) {
    noResultsMessage.style.display =
      matchedProductsCount === 0 ? "flex" : "none";
  }
}

/**
 * A function to re-apply sorting to the currently visible set of products.
 */
function performSort() {
  const productListContainer = document.querySelector('[sf-list="1"]');
  if (!productListContainer) return;

  const sortRadios = document.querySelectorAll('input[name="Sort-By"]');
  const checkedRadio = Array.from(sortRadios).find((r) => r.checked);
  if (!checkedRadio) return; // No sort option selected

  const direction = checkedRadio.id.includes("asc") ? "asc" : "desc";

  // Get the LIVE list of products from the DOM
  const currentProducts = Array.from(
    productListContainer.querySelectorAll(".product_item_wrap")
  );

  // Sort this live list
  const sortedProducts = currentProducts.sort((a, b) => {
    const priceA = parseFloat(a.dataset.price);
    const priceB = parseFloat(b.dataset.price);
    return direction === "asc" ? priceA - priceB : priceB - priceA;
  });

  // Apply visual order.
  sortedProducts.forEach((product, index) => {
    product.style.order = index;
  });
}

/**
 * Initializes listeners for all filtering and sorting controls.
 */
function initializeEventListeners() {
  // Shopyflow Filter Listener
  const shopyflowFilterContainers = document.querySelectorAll(
    "[sf-filter], [sf-option-filter]"
  );
  shopyflowFilterContainers.forEach((container) => {
    container.addEventListener("click", () => {
      setTimeout(() => {
        // After Shopyflow removes items, re-sort the remaining ones, then re-paginate.
        performSort();
        applyAllFilters(true);
      }, 200); // Increased delay slightly for safety with DOM removal
    });
  });

  // Load More Button
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

  // Title Search
  const searchInput = document.querySelector('[data-input-el="title"]');
  if (searchInput) {
    searchInput.addEventListener("input", () => applyAllFilters(true));
  }

  // Price Range
  const fromInputs = document.querySelectorAll('[data-input-el="price-from"]');
  const toInputs = document.querySelectorAll('[data-input-el="price-to"]');
  const validateNumeric = (input) => {
    let val = input.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 1) val = parts[0] + "." + parts.slice(1).join("");
    if (input.value !== val) input.value = val;
  };
  const sync = (src, targets) =>
    targets.forEach((t) => {
      if (t !== src) t.value = src.value;
    });
  const handlePriceInput = (input, targets) => {
    validateNumeric(input);
    sync(input, targets);
    applyAllFilters(true);
  };
  fromInputs.forEach((input) =>
    input.addEventListener("input", () => handlePriceInput(input, fromInputs))
  );
  toInputs.forEach((input) =>
    input.addEventListener("input", () => handlePriceInput(input, toInputs))
  );

  // Sort Radios
  const sortRadios = document.querySelectorAll('input[name="Sort-By"]');
  const syncSortRadios = (clicked) =>
    sortRadios.forEach((r) => (r.checked = r.value === clicked.value));
  sortRadios.forEach((radio) => {
    radio.addEventListener("click", (e) => {
      setTimeout(() => {
        syncSortRadios(e.target);
        // After changing sort, re-sort the list, then re-apply filters/pagination
        performSort();
        applyAllFilters(false); // Don't reset pagination when only sorting
      }, 50);
    });
  });
}

/**
 * Pre-processes all product items on initial load to attach price data.
 */
function preProcessProductData() {
  const allProducts = document.querySelectorAll(".product_item_wrap");
  allProducts.forEach((product) => {
    const priceElement = product.querySelector('[data-product-el="price"]');
    if (priceElement && priceElement.textContent) {
      const priceText = priceElement.textContent.replace(/[€.]/g, "").trim();
      const priceValue = parseFloat(priceText);
      product.dataset.price = isNaN(priceValue) ? 0 : priceValue;
    } else {
      product.dataset.price = 0;
    }
  });
}

// --- Main Execution ---
const cloneFilterEl = () => {
  const source = document.querySelector('[data-filter-container="element"]');
  const target = document.querySelector('[data-filter-container="target"]');
  if (!source || !target) return;
  target.innerHTML = "";
  Array.from(source.children).forEach((child) =>
    target.appendChild(child.cloneNode(true))
  );
};

document.addEventListener("DOMContentLoaded", () => {
  cloneFilterEl();
  preProcessProductData(); // Attach price data to all items ONCE.
  initializeEventListeners(); // Set up all interactions.

  // Initial run after a short delay for Shopyflow.
  setTimeout(() => {
    performSort(); // Set initial sort order
    applyAllFilters(true); // Apply initial pagination
  }, 200);
});
