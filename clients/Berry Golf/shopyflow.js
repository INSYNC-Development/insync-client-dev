// Product variant title updater
// Shows data-selected-color only on Color option group, updates text dynamically

// function initVariantTitles() {
//   var colorOptionList = document.querySelector('[sf-change-option="Color"]');
//   if (!colorOptionList) return;

//   var colorGroup = colorOptionList.closest(".product_option_group");
//   var allGroups = document.querySelectorAll(".product_option_group");

//   // Hide variant title on all non-Color groups
//   allGroups.forEach(function (group) {
//     var titleEl = group.querySelector("[data-selected-color]");
//     if (!titleEl) return;

//     if (group === colorGroup) {
//       titleEl.style.display = "";
//     } else {
//       titleEl.style.display = "none";
//     }
//   });

//   updateColorTitle(colorGroup, colorOptionList);
//   observeColorChanges(colorGroup, colorOptionList);
// }

// // Update the variant title text to match the active color value
// function updateColorTitle(colorGroup, colorOptionList) {
//   var titleEl = colorGroup.querySelector("[data-selected-color]");
//   if (!titleEl) return;

//   var activeItem = colorOptionList.querySelector(
//     ".product_option_item.sf-active"
//   );
//   if (!activeItem) return;

//   var colorValue = activeItem.getAttribute("sf-option-value");
//   if (colorValue) titleEl.textContent = colorValue;
// }

// // Watch for sf-active class changes on color option items
// function observeColorChanges(colorGroup, colorOptionList) {
//   var observer = new MutationObserver(function () {
//     updateColorTitle(colorGroup, colorOptionList);
//   });

//   var items = colorOptionList.querySelectorAll(".product_option_item");
//   items.forEach(function (item) {
//     observer.observe(item, { attributes: true, attributeFilter: ["class"] });
//   });
// }

// // Init on DOM ready
// document.addEventListener("DOMContentLoaded", initVariantTitles);

// Sync [data-selected-color] text with sf-current-color

function initSelectedColorLabel() {
  const groups = document.querySelectorAll("[data-selected-color]");
  if (!groups.length) return;

  function updateLabel() {
    // Get color from the active/current color option
    const activeItem = document.querySelector(
      "[sf-add-to-cart][sf-current-color]"
    );
    if (!activeItem) return;

    const color = activeItem.getAttribute("sf-current-color");

    groups.forEach((group) => {
      if (color) group.setAttribute("data-selected-color", color);
      group.textContent = color ? capitalize(color) : "";
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Initial run
  updateLabel();

  // Watch for sf-current-color changes on the add-to-cart element
  const cartBtn = document.querySelector("[sf-add-to-cart].button_main_wrap");
  if (cartBtn) {
    const observer = new MutationObserver(updateLabel);
    observer.observe(cartBtn, {
      attributes: true,
      attributeFilter: ["sf-current-color"],
    });
  }
}
document.addEventListener("DOMContentLoaded", initSelectedColorLabel);

function checkRelatedProductsVisibility() {
  const relatedSection = document.querySelector('[data-section="related"]');
  if (!relatedSection) return;

  // Find the items inside the swiper wrapper
  const swiperSlides = relatedSection.querySelectorAll(
    ".swiper-wrapper .swiper-slide"
  );

  // Hide section if no items exist
  if (swiperSlides.length === 0) {
    relatedSection.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", checkRelatedProductsVisibility);

/* Shop Page — Sort, Stock Filter & Dynamic Counts */

// (function () {
//   // --- State ---
//   const state = {
//     stock: false,
//     sort: null,
//   };

//   // --- Selectors ---
//   const LIST = document.querySelector("[sf-list]");
//   const NO_RESULT = document.querySelector("[sf-no-result]");
//   const TOTAL_COUNT = document.querySelector("[sf-show-total-count]");

//   if (!LIST || !NO_RESULT || !TOTAL_COUNT) return;

//   // --- Helpers ---

//   function getCards() {
//     return Array.from(LIST.querySelectorAll("[sf-product]"));
//   }

//   function getCardStock(card) {
//     const stockEl = card.querySelector("[sf-show-stock]");
//     if (!stockEl) return null;
//     return parseInt(stockEl.textContent.trim(), 10) || 0;
//   }

//   function getPriceValue(card) {
//     const priceEl = card.querySelector(".shop_product_price");
//     if (!priceEl) return 0;
//     return (
//       parseFloat(
//         priceEl.textContent.replace(/[^0-9,\.]/g, "").replace(",", ".")
//       ) || 0
//     );
//   }

//   function getNameValue(card) {
//     const nameEl = card.querySelector(".shop_product_name");
//     return nameEl ? nameEl.textContent.trim().toLowerCase() : "";
//   }

//   // Split multi-value option attributes by _&_ separator
//   function getOptionValues(card, attr) {
//     const raw = (card.getAttribute(attr) || "").trim();
//     if (!raw) return [];
//     return raw.split("_&_").map(function (v) {
//       return v.trim();
//     });
//   }

//   function getVisibleCards() {
//     return getCards().filter(function (card) {
//       return card.style.display !== "none";
//     });
//   }

//   // --- Stock filter ---

//   function applyStockFilter() {
//     getCards().forEach(function (card) {
//       if (!state.stock) {
//         card.style.display = "";
//         return;
//       }
//       const stock = getCardStock(card);
//       card.style.display = stock !== null && stock > 0 ? "" : "none";
//     });
//   }

//   // --- Sort ---

//   function applySort() {
//     if (!state.sort) return;

//     const visible = getVisibleCards();
//     const hidden = getCards().filter(function (c) {
//       return c.style.display === "none";
//     });

//     visible.sort(function (a, b) {
//       switch (state.sort) {
//         case "Alphabetically, A-Z":
//           return getNameValue(a).localeCompare(getNameValue(b));
//         case "Alphabetically, Z-A":
//           return getNameValue(b).localeCompare(getNameValue(a));
//         case "Price, low to high":
//           return getPriceValue(a) - getPriceValue(b);
//         case "Price, high to low":
//           return getPriceValue(b) - getPriceValue(a);
//         default:
//           return 0;
//       }
//     });

//     visible.concat(hidden).forEach(function (card) {
//       LIST.appendChild(card);
//     });
//   }

//   // --- Counts ---

//   function updateCounts() {
//     const domCards = getCards();
//     const visibleCards = getVisibleCards();

//     // Product type — single value attribute
//     updateSingleValueCount(domCards, "product-type", function (card) {
//       return [(card.getAttribute("sf-filterable-product-type") || "").trim()];
//     });

//     // Color — multi-value attribute split by _&_
//     updateSingleValueCount(domCards, "color", function (card) {
//       return getOptionValues(card, "sf-option-filterable-color");
//     });

//     // Size — multi-value attribute split by _&_
//     updateSingleValueCount(domCards, "size", function (card) {
//       return getOptionValues(card, "sf-option-filterable-size");
//     });

//     updateStockCount(domCards);

//     // Total visible count
//     const total = visibleCards.length;
//     NO_RESULT.style.display = total === 0 ? "" : "none";
//     if (TOTAL_COUNT) TOTAL_COUNT.textContent = total;
//   }

//   // Counts how many DOM-present cards include the filter value
//   function updateSingleValueCount(domCards, filterType, getValues) {
//     document
//       .querySelectorAll('[data-shop-filter="' + filterType + '-checkbox"]')
//       .forEach(function (checkbox) {
//         const value = (checkbox.getAttribute("sf-filter-value") || "").trim();
//         const countEl = checkbox.querySelector(
//           '[data-shop-filter="' + filterType + '-quantity"]'
//         );
//         if (!countEl) return;

//         const count = domCards.filter(function (card) {
//           return getValues(card).includes(value);
//         }).length;

//         countEl.textContent = "(" + count + ")";
//       });
//   }

//   function updateStockCount(domCards) {
//     const countEl = document.querySelector(
//       '[data-shop-filter="stock-quantity"]'
//     );
//     if (!countEl) return;

//     const count = domCards.filter(function (card) {
//       return getCardStock(card) > 0;
//     }).length;

//     countEl.textContent = "(" + count + ")";
//   }

//   // --- Refresh: runs after every Shopyflow mutation or our own state change ---

//   function refresh() {
//     applyStockFilter();
//     applySort();
//     updateCounts();
//   }

//   // --- Shopyflow checkbox delegation ---

//   function bindCheckboxGroup(selector) {
//     document.querySelectorAll(selector).forEach(function (el) {
//       el.addEventListener("click", function () {
//         setCheckboxActive(el, !el.classList.contains("is-active"));
//       });
//     });
//   }

//   function setCheckboxActive(el, isActive) {
//     el.classList.toggle("is-active", isActive);
//   }

//   // --- Stock checkbox ---

//   function bindStockCheckbox() {
//     const el = document.querySelector('[data-shop-filter="stock-checkbox"]');
//     if (!el) return;
//     el.addEventListener("click", function () {
//       state.stock = !state.stock;
//       setCheckboxActive(el, state.stock);
//       refresh();
//     });
//   }

//   // --- Sort radios ---

//   function bindSortRadios() {
//     document
//       .querySelectorAll('[data-shop-filter="sort-radio"]')
//       .forEach(function (label) {
//         const radio = label.querySelector('input[type="radio"]');
//         if (!radio) return;
//         radio.addEventListener("change", function () {
//           state.sort = radio.value;
//           applySort();
//         });
//       });
//   }

//   // --- Reset ---

//   function bindResetButton() {
//     const btn = document.querySelector('[data-shop-filter="reset-filter"]');
//     if (!btn) return;
//     btn.addEventListener("click", function (e) {
//       e.preventDefault();
//       resetAll();
//     });
//   }

//   function resetAll() {
//     // Untoggle all active Shopyflow checkboxes by clicking them
//     document
//       .querySelectorAll(
//         '[data-shop-filter="product-type-checkbox"].is-active, ' +
//           '[data-shop-filter="color-checkbox"].is-active, ' +
//           '[data-shop-filter="size-checkbox"].is-active'
//       )
//       .forEach(function (el) {
//         el.click();
//       });

//     // Reset stock
//     state.stock = false;
//     document
//       .querySelector('[data-shop-filter="stock-checkbox"]')
//       ?.classList.remove("is-active");

//     // Reset sort
//     state.sort = null;
//     document
//       .querySelectorAll('[data-shop-filter="sort-radio"] input[type="radio"]')
//       .forEach(function (radio) {
//         radio.checked = false;
//       });

//     refresh();
//   }

//   // --- MutationObserver: reacts to Shopyflow DOM changes ---

//   function observeList() {
//     const observer = new MutationObserver(function () {
//       refresh();
//     });
//     observer.observe(LIST, { childList: true });
//   }

//   // --- Init ---

//   function init() {
//     bindCheckboxGroup('[data-shop-filter="product-type-checkbox"]');
//     bindCheckboxGroup('[data-shop-filter="color-checkbox"]');
//     bindCheckboxGroup('[data-shop-filter="size-checkbox"]');
//     bindStockCheckbox();
//     bindSortRadios();
//     bindResetButton();
//     observeList();
//     refresh();
//   }

//   document.addEventListener("DOMContentLoaded", function () {
//     const allFetched = Array.from(
//       document.querySelectorAll("[sf-product]")
//     ).every(function (card) {
//       return card.getAttribute("sf-data-fetched") === "true";
//     });

//     if (allFetched) {
//       init();
//       return;
//     }

//     const observer = new MutationObserver(function (_, obs) {
//       const ready = Array.from(document.querySelectorAll("[sf-product]")).every(
//         function (card) {
//           return card.getAttribute("sf-data-fetched") === "true";
//         }
//       );
//       if (ready) {
//         obs.disconnect();
//         init();
//       }
//     });

//     observer.observe(LIST, {
//       childList: true,
//       subtree: true,
//       attributes: true,
//     });
//   });
// })();

/**
 * Custom Shop Filters, Sorting & Smart Faceted Quantity Extension
 * Built for Webflow + Shopyflow within the Lumos Framework
 */
const initCustomShopFilters = () => {
  const listContainer = document.querySelector('[sf-list="1"]');
  const filterForm = document.querySelector(".shop_filter_list");
  const sortRadios = document.querySelectorAll('input[name="Sort"]');
  const stockCheckbox = document.querySelector(
    '[data-shop-filter="stock-checkbox"]'
  );
  const resetBtn = document.querySelector('[data-shop-filter="reset-filter"]');
  const totalCountEl = document.querySelector('[sf-show-total-count="1"]');

  if (!listContainer) return;

  // --- Smart Catalog Registry ---
  const catalogData = new Map();

  // --- Utility Helpers ---
  const getPriceValue = (card) => {
    const priceEl = card.querySelector(".shop_product_price");
    if (!priceEl) return 0;
    return (
      parseFloat(
        priceEl.textContent.replace(/[^0-9,\.]/g, "").replace(",", ".")
      ) || 0
    );
  };

  const getNameValue = (card) => {
    const nameEl = card.querySelector(".shop_product_name");
    return nameEl ? nameEl.textContent.trim().toLowerCase() : "";
  };

  // --- Core Functions ---

  /**
   * Updates the global product count text (e.g. "9 Produkte")
   */
  const updateTotalProductCount = () => {
    if (!totalCountEl) return;

    let visibleCount = 0;
    const cards = listContainer.querySelectorAll(".shop_product_card");

    cards.forEach((card) => {
      // Shopyflow manages DOM inclusion. We only need to check
      // if we manually hid it via our custom Stock filter.
      if (card.style.display !== "none") {
        visibleCount++;
      }
    });

    totalCountEl.textContent = visibleCount;
  };

  /**
   * Updates the selected count badges (e.g. "(1)") next to filter titles
   */
  const updateSelectedFilterCounts = () => {
    const filterGroups = document.querySelectorAll(".shop_filter_item");

    filterGroups.forEach((group) => {
      const countBadge = group.querySelector(
        '[data-shop-filter="selected-filter"]'
      );
      if (!countBadge) return;

      let selectedCount = 0;
      selectedCount += group.querySelectorAll(
        'input[type="radio"]:checked'
      ).length;
      selectedCount += group.querySelectorAll(
        ".shop_filter_checkbox_field.sf-active"
      ).length;
      selectedCount += group.querySelectorAll(
        '[data-shop-filter="stock-checkbox"].is-active'
      ).length;

      if (selectedCount > 0) {
        countBadge.textContent = `(${selectedCount})`;
        countBadge.style.display = "";
      } else {
        countBadge.textContent = `(0)`;
        countBadge.style.display = "none";
      }
    });
  };

  /**
   * Helper to grab all currently active filter values from a specific category
   */
  const getActiveFilters = (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return [];
    return Array.from(
      container.querySelectorAll(".shop_filter_checkbox_field.sf-active")
    )
      .map((el) => el.getAttribute("sf-filter-value"))
      .filter(Boolean);
  };

  /**
   * Faceted Matrix Algorithm
   */
  const updateFilterQuantities = () => {
    const cards = listContainer.querySelectorAll(".shop_product_card");
    cards.forEach((card) => {
      const id = card.getAttribute("sf-product");
      if (!id) return;

      catalogData.set(id, {
        type: (card.getAttribute("sf-filterable-product-type") || "")
          .split("_&_")
          .map((v) => v.trim())
          .filter(Boolean),
        color: (card.getAttribute("sf-option-filterable-color") || "")
          .split("_&_")
          .map((v) => v.trim())
          .filter(Boolean),
        size: (card.getAttribute("sf-option-filterable-size") || "")
          .split("_&_")
          .map((v) => v.trim())
          .filter(Boolean),
        outOfStock: card.classList.contains("sf-out-of-stock"),
      });
    });

    const activeTypes = getActiveFilters('[data-shop-filter="product-type"]');
    const activeColors = getActiveFilters('[data-shop-filter="color"]');
    const activeSizes = getActiveFilters('[data-shop-filter="size"]');
    const stockActive =
      stockCheckbox && stockCheckbox.classList.contains("is-active");

    const counts = { type: {}, color: {}, size: {}, stock: 0 };

    catalogData.forEach((product) => {
      const matchesType =
        activeTypes.length === 0 ||
        product.type.some((t) => activeTypes.includes(t));
      const matchesColor =
        activeColors.length === 0 ||
        product.color.some((c) => activeColors.includes(c));
      const matchesSize =
        activeSizes.length === 0 ||
        product.size.some((s) => activeSizes.includes(s));
      const matchesStock = !stockActive || !product.outOfStock;

      if (matchesColor && matchesSize && matchesStock) {
        product.type.forEach(
          (t) => (counts.type[t] = (counts.type[t] || 0) + 1)
        );
      }
      if (matchesType && matchesSize && matchesStock) {
        product.color.forEach(
          (c) => (counts.color[c] = (counts.color[c] || 0) + 1)
        );
      }
      if (matchesType && matchesColor && matchesStock) {
        product.size.forEach(
          (s) => (counts.size[s] = (counts.size[s] || 0) + 1)
        );
      }
      if (matchesType && matchesColor && matchesSize && !product.outOfStock) {
        counts.stock++;
      }
    });

    const updateQuantityDOM = (selector, countDictionary) => {
      document.querySelectorAll(selector).forEach((el) => {
        const parentField = el.closest("[sf-filter-value]");
        if (parentField) {
          const filterValue = parentField.getAttribute("sf-filter-value");
          const qty = countDictionary[filterValue] || 0;

          el.textContent = `(${qty})`;

          if (qty === 0) {
            parentField.classList.add("sf-filter-unavailable");
          } else {
            parentField.classList.remove("sf-filter-unavailable");
          }
        }
      });
    };

    updateQuantityDOM(
      '[data-shop-filter="product-type-quantity"]',
      counts.type
    );
    updateQuantityDOM('[data-shop-filter="color-quantity"]', counts.color);
    updateQuantityDOM('[data-shop-filter="size-quantity"]', counts.size);

    document
      .querySelectorAll('[data-shop-filter="stock-quantity"]')
      .forEach((el) => {
        el.textContent = `(${counts.stock})`;
      });
  };

  /**
   * Applies the selected sorting method instantly
   */
  const applySort = () => {
    const activeRadio = document.querySelector('input[name="Sort"]:checked');
    if (!activeRadio) return;

    const sortValue = activeRadio.value;
    const cards = Array.from(
      listContainer.querySelectorAll(".shop_product_card")
    );

    cards.sort((a, b) => {
      if (sortValue === "Alphabetically, A-Z")
        return getNameValue(a).localeCompare(getNameValue(b));
      if (sortValue === "Alphabetically, Z-A")
        return getNameValue(b).localeCompare(getNameValue(a));
      if (sortValue === "Price, low to high")
        return getPriceValue(a) - getPriceValue(b);
      if (sortValue === "Price, high to low")
        return getPriceValue(b) - getPriceValue(a);
      return 0;
    });

    cards.forEach((card) => listContainer.appendChild(card));
  };

  /**
   * Hides products with the 'sf-out-of-stock' class if the toggle is active
   */
  const applyStockFilter = () => {
    if (!stockCheckbox) return;
    const isActive = stockCheckbox.classList.contains("is-active");

    listContainer.querySelectorAll(".shop_product_card").forEach((card) => {
      if (isActive && card.classList.contains("sf-out-of-stock")) {
        card.style.display = "none";
      } else {
        card.style.display = "";
      }
    });
  };

  // --- Event Listeners ---

  sortRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      applySort();
      updateSelectedFilterCounts();
    });
  });

  if (stockCheckbox) {
    stockCheckbox.addEventListener("click", (e) => {
      e.preventDefault();
      stockCheckbox.classList.toggle("is-active");
      applyStockFilter();
      updateFilterQuantities();
      updateSelectedFilterCounts();
      updateTotalProductCount(); // Update the main UI Counter
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Reset UI States
      sortRadios.forEach((radio) => (radio.checked = false));
      if (stockCheckbox) stockCheckbox.classList.remove("is-active");

      // Clear Shopyflow states instantly to prevent lag
      document
        .querySelectorAll(".shop_filter_checkbox_field.sf-active")
        .forEach((el) => {
          el.classList.remove("sf-active");
        });

      // Force recalculations and DOM updates
      applyStockFilter();
      updateFilterQuantities();
      updateSelectedFilterCounts();
      updateTotalProductCount(); // Reset the main UI Counter
    });
  }

  // --- Initialization & Observers ---

  // Set Initial States
  updateSelectedFilterCounts();
  updateFilterQuantities();
  updateTotalProductCount();

  // Watch Form for Shopyflow highlighting checkboxes
  if (filterForm) {
    let timeout;
    const formObserver = new MutationObserver((mutations) => {
      let shouldUpdate = mutations.some((m) => m.attributeName === "class");

      if (shouldUpdate) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          updateFilterQuantities();
          updateSelectedFilterCounts();
        }, 10);
      }
    });
    formObserver.observe(filterForm, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Watch List for Shopyflow fetching new products
  const listObserver = new MutationObserver((mutations) => {
    let shouldUpdate = mutations.some(
      (m) =>
        (m.type === "childList" && m.addedNodes.length > 0) ||
        (m.type === "attributes" && m.attributeName === "sf-data-fetched")
    );

    if (shouldUpdate) {
      listObserver.disconnect();

      updateFilterQuantities();
      applyStockFilter();
      applySort();
      updateTotalProductCount(); // Keep counter synced when new data drops in

      observeList();
    }
  });

  const observeList = () => {
    listObserver.observe(listContainer, {
      childList: true,
      attributes: true,
      attributeFilter: ["sf-data-fetched"],
    });
  };

  observeList();
};

document.addEventListener("DOMContentLoaded", () => {
  initCustomShopFilters();
});

window.addEventListener("ShopyflowReady", (event) => {
  Shopyflow.on("collectionModuleReady", ({ el, collection }) => {
    console.log("Collection wrapper:", el);
    console.log("Collection:", collection);
    // Run your code here
  });
});
