CustomEase.create("smooth", "M0,0 C0.38,0.005 0.215,1 1,1");

let insightTicker = null;
let insightResizeHandler = null;
let insightScrollTrigger = null;
let autoScrollMultiplier = 1;

const lenis = new Lenis({
  autoRaf: true,
});

lenis.on("scroll", (e) => {});

/* ================================
  Nav
================================ */
function navScrollBehavior() {
  const nav = document.querySelector(".nav_component");

  if (!nav) return;

  function updateNavStatus() {
    const isScrolled = window.scrollY > 0;

    nav.setAttribute("data-status", isScrolled ? "scroll" : "no-scroll");
  }

  updateNavStatus();
  window.addEventListener("scroll", updateNavStatus);
}

/* ================================
  Glossary
================================ */
function initGlossaryContent() {
  const group = document.querySelector('[data-filter="group"]');
  const source = group?.nextElementSibling?.classList.contains("w-dyn-list")
    ? group.nextElementSibling
    : document.querySelector(".glossary_wrap .w-dyn-list");

  const sourceItems = source?.querySelectorAll("a.glossary_item");
  const targetContent = group?.querySelector('[data-filter="content"]');
  const targetCategory = group?.querySelector(".glossary_list");

  if (
    !group ||
    !source ||
    !sourceItems.length ||
    !targetContent ||
    !targetCategory
  )
    return;

  const groups = {};

  sourceItems.forEach((item) => {
    const title = item.textContent.trim();
    const href = item.getAttribute("href");
    const firstLetter = title.charAt(0).toUpperCase();

    if (!title) return;
    if (!groups[firstLetter]) groups[firstLetter] = [];

    groups[firstLetter].push({ title, href });
  });

  const letters = Object.keys(groups).sort();

  targetContent.innerHTML = "";
  targetCategory.innerHTML = "";

  letters.forEach((letter) => {
    const categoryText = document.createElement("div");
    categoryText.className = "glossary_text u-text-style-h4";
    categoryText.textContent = letter;
    categoryText.setAttribute("data-category", letter);
    targetCategory.appendChild(categoryText);

    const contentItem = document.createElement("div");
    contentItem.className = "glossary_content_item";
    contentItem.setAttribute("data-category", letter);

    const heading = document.createElement("h3");
    heading.className = "glossary_content_title u-text-style-h1";
    heading.setAttribute("data-category", letter);
    heading.textContent = letter;

    const list = document.createElement("div");
    list.className = "glossary_content_list";

    groups[letter].forEach((item) => {
      const link = document.createElement("a");
      link.className = "glossary_item u-text-style-main u-color-faded";
      link.href = item.href;
      link.textContent = item.title;
      link.setAttribute("data-content", "item");
      link.setAttribute("data-text", item.title.toLowerCase());

      list.appendChild(link);
    });

    contentItem.appendChild(heading);
    contentItem.appendChild(list);
    targetContent.appendChild(contentItem);
  });

  source.remove();
}

function updateGlossaryCategoryVisibility(group) {
  const categoryItems = group.querySelectorAll(".glossary_content_item");

  categoryItems.forEach((categoryItem) => {
    const hasVisibleItem = [
      ...categoryItem.querySelectorAll('[data-content="item"]'),
    ].some((item) => item.style.display !== "none");

    categoryItem.style.display = hasVisibleItem ? "" : "none";
  });
}

function initGlossaryLetterFilter() {
  const group = document.querySelector('[data-filter="group"]');
  if (!group) return;

  const categoryButtons = group.querySelectorAll(".glossary_text");
  const categoryItems = group.querySelectorAll(".glossary_content_item");
  const resetButton = document.querySelector('[data-button="reset"]');

  const searchInput = document.querySelector(
    'input[type="text"], input[type="search"]'
  );

  let activeLetter = null;

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedLetter = button.getAttribute("data-category");

      activeLetter = activeLetter === selectedLetter ? null : selectedLetter;

      categoryButtons.forEach((item) => {
        item.setAttribute(
          "data-state",
          item.getAttribute("data-category") === activeLetter
            ? "active"
            : "inactive"
        );
      });

      categoryItems.forEach((item) => {
        const itemLetter = item.getAttribute("data-category");
        item.style.display =
          !activeLetter || itemLetter === activeLetter ? "" : "none";
      });
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      activeLetter = null;

      categoryButtons.forEach((item) => {
        item.setAttribute("data-state", "inactive");
      });

      categoryItems.forEach((item) => {
        item.style.display = "";

        const glossaryItems = item.querySelectorAll('[data-content="item"]');
        glossaryItems.forEach((glosItem) => {
          glosItem.style.display = "";
        });
      });

      if (searchInput) {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  }
}

/* ================================
  TOC
================================ */
let tocTriggers = [];

function updateTocLines() {
  document.querySelectorAll(".main_toc_wrap").forEach((wrap) => {
    const items = [...wrap.querySelectorAll(".main_toc_item")];

    items.forEach((item, index) => {
      const line = item.querySelector(".main_toc_line");
      const dot = item.querySelector(".main_toc_dot");
      const nextDot = items[index + 1]?.querySelector(".main_toc_dot");

      if (!line || !dot || !nextDot) return;

      const dotRect = dot.getBoundingClientRect();
      const nextDotRect = nextDot.getBoundingClientRect();

      const dotCenter = dotRect.top + dotRect.height / 2;
      const nextDotCenter = nextDotRect.top + nextDotRect.height / 2;

      const height = nextDotCenter - dotCenter - dotRect.height / 2;

      line.style.setProperty("--toc-line-height", `${height}px`);
    });
  });
}

function getTocItems(content) {
  const headings = [...content.querySelectorAll("h2, h3, h4, h5, h6")].filter(
    (heading) => !heading.closest("[data-group]")
  );

  const highestHeading = ["h2", "h3", "h4", "h5", "h6"].find((tag) =>
    headings.some((heading) => heading.matches(tag))
  );

  const selector = highestHeading
    ? `[data-group], ${highestHeading}`
    : `[data-group]`;

  return [...content.querySelectorAll(selector)].filter((item) => {
    const isGroup = item.hasAttribute("data-group");
    const isHeading = highestHeading && item.matches(highestHeading);
    const isHeadingInsideGroup = isHeading && item.closest("[data-group]");

    return isGroup || (isHeading && !isHeadingInsideGroup);
  });
}

function initAutoTOC() {
  const tocList = document.querySelector('[data-toc="list"]');
  const content = document.querySelector('[data-toc="content"]');

  if (!tocList || !content) return;

  const items = getTocItems(content);

  if (!items.length) {
    tocList.innerHTML = "";
    return;
  }

  tocList.innerHTML = "";

  items.forEach((item, index) => {
    const title = item.getAttribute("data-group") || item.textContent.trim();
    let id = item.id;

    if (!id) {
      id =
        title
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") || `section-${index + 1}`;

      item.id = id;
    }

    tocList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="main_toc_item" data-toc="item">
        <div class="main_toc_bullet">
          <div class="main_toc_dot"></div>
          <div class="main_toc_line">
            <div class="main_toc_progress"></div>
          </div>
        </div>

        <a data-toc="link" href="#${id}" class="main_toc_link w-inline-block">
          <div class="main_toc_text u-text-style-main u-color-faded">
            ${title}
          </div>
        </a>
      </div>
      `
    );
  });

  requestAnimationFrame(() => {
    updateTocLines();
    initTocAnimation(items);
    initTocLinks(items);
    ScrollTrigger.refresh();
  });
}

function initTocLinks(contentItems) {
  const links = [...document.querySelectorAll('[data-toc="link"]')];

  links.forEach((link, index) => {
    const target = contentItems[index];
    if (!target) return;

    link.setAttribute("href", "javascript:void(0)");

    link.addEventListener("click", (e) => {
      e.preventDefault();

      const y =
        window.pageYOffset +
        target.getBoundingClientRect().top -
        window.innerHeight * 0.39;

      gsap.to(window, {
        scrollTo: {
          y,
          autoKill: false,
        },
        duration: 1.6,
        ease: "smooth",
      });
    });
  });
}

function initTocAnimation(contentItems) {
  tocTriggers.forEach((trigger) => trigger.kill());
  tocTriggers = [];

  const tocItems = [...document.querySelectorAll('[data-toc="item"]')];

  tocItems.forEach((tocItem, index) => {
    const dot = tocItem.querySelector(".main_toc_dot");
    const progress = tocItem.querySelector(".main_toc_progress");

    const target = contentItems[index];
    const nextTarget = contentItems[index + 1];

    if (!dot || !target) return;

    gsap.set(dot, {
      backgroundColor: "",
    });

    const dotTween = gsap.to(dot, {
      backgroundColor: "var(--swatch--dark-900)",
      duration: 0.2,
      paused: true,
    });

    const dotTrigger = ScrollTrigger.create({
      trigger: target,
      start: "top 40%",
      onEnter: () => dotTween.play(),
      onLeaveBack: () => dotTween.reverse(),
    });

    tocTriggers.push(dotTrigger);

    if (!progress || !nextTarget) return;

    gsap.set(progress, {
      scaleY: 0,
      transformOrigin: "top center",
    });

    const lineTween = gsap.to(progress, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: target,
        start: "top 40%",
        endTrigger: nextTarget,
        end: "top 40%",
        scrub: true,
      },
    });

    tocTriggers.push(lineTween.scrollTrigger);
  });
}

/* ================================
  Social Share
================================ */
function initSocialShare() {
  document.querySelectorAll("[data-social-share]").forEach((root) => {
    if (root._socialShareBound) return;
    root._socialShareBound = true;

    const link = root.getAttribute("data-social-share-link") || location.href;
    const title =
      root.getAttribute("data-social-share-title") || document.title;

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-social-share-type]");
      if (!btn) return;

      e.preventDefault();

      const type = btn.getAttribute("data-social-share-type");
      const u = encodeURIComponent(link);
      const t = encodeURIComponent(title);

      const map = {
        x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
        telegram: `https://t.me/share/url?url=${u}&text=${t}`,
        whatsapp: `https://api.whatsapp.com/send?text=${t}%20${u}`,
        mail: `mailto:?subject=${t}&body=${t}%0A%0A${u}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        pinterest: `https://www.pinterest.com/pin/create/button/?url=${u}&description=${t}`,
      };

      if (type === "clipboard") {
        navigator.clipboard.writeText(link).then(() => {
          btn.setAttribute("data-social-share-success", "");

          setTimeout(() => {
            btn.removeAttribute("data-social-share-success");
          }, 2000);
        });

        return;
      }

      const url = map[type];

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  });
}

/* ================================
  Filter Helpers
================================ */
function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function getItemText(item) {
  return normalizeText(
    item.querySelector("[data-text]")?.getAttribute("data-text") ||
      item.getAttribute("data-text") ||
      item.textContent
  );
}

function getItemDetails(item) {
  const details = {};

  item.querySelectorAll("[data-type]").forEach((typeGroup) => {
    const key = typeGroup.getAttribute("data-type");
    if (!key) return;

    const listItems = typeGroup.querySelectorAll("[data-item][data-value]");

    if (listItems.length) {
      details[key] = Array.from(listItems).map((el) =>
        normalizeText(el.getAttribute("data-value") || el.textContent)
      );

      return;
    }

    const singleValue = typeGroup.getAttribute("data-value");

    if (singleValue) {
      details[key] = [normalizeText(singleValue)];
    }
  });

  return details;
}

function collectFilterData(group) {
  const items = Array.from(group.querySelectorAll('[data-content="item"]'));

  return items.map((item) => ({
    element: item,
    text: getItemText(item),
    details: getItemDetails(item),
  }));
}

/* ================================
  Filter UI
================================ */
function createCheckboxFilter(wrap, key, values) {
  const isTabletDown = window.matchMedia("(max-width: 991px)").matches;

  const filterItem = document.createElement(isTabletDown ? "details" : "div");

  filterItem.setAttribute("data-filter", key);
  filterItem.className = "filter_content_item";

  if (isTabletDown) {
    filterItem.setAttribute("name", "filter");

    filterItem.innerHTML = `
      <summary class="filter_content_head">
        <div class="filter_content_text u-text-style-main u-color-faded u-text-transform-capitalize">
          ${key}
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none" class="filter_content_icon">
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </summary>

      <div class="filter_content_detail">
        <div class="filter_list"></div>
      </div>
    `;
  } else {
    filterItem.innerHTML = `
      <div class="filter_content_text u-text-style-main u-color-faded u-text-transform-capitalize">
        ${key}
      </div>
      <div class="filter_list"></div>
    `;
  }

  const list = filterItem.querySelector(".filter_list");

  values.forEach((value) => {
    const item = document.createElement("label");
    item.setAttribute("role", "none");
    item.className = "form_ui_item u-color-faded u-text-transform-capitalize";
    item.setAttribute("data-state", "unchecked");

    item.innerHTML = `
      <label
        data-wf--check-ui--variant="checkbox"
        role="listitem"
        data-state="unchecked"
        class="form_ui_label"
      >
        <input
          type="checkbox"
          class="form_ui_input"
          value="${value}"
        >
        <span class="form_ui_visual_wrap">
          <span class="form_ui_visual_inner">
            <svg viewBox="0 0 11 8" fill="none" aria-hidden="true" class="form_ui_visual_icon">
              <path d="M1 4L4 7L10 1" stroke="currentColor" vector-effect="non-scaling-stroke" stroke-width="0.125rem"></path>
            </svg>
          </span>
        </span>
        <span class="form_ui_text">${value}</span>
      </label>
    `;

    list.appendChild(item);
  });

  wrap.appendChild(filterItem);
}

function updateFilterDetailsMode() {
  const isTabletDown = window.matchMedia("(max-width: 991px)").matches;

  document.querySelectorAll(".filter_content_item").forEach((item) => {
    if (item.tagName.toLowerCase() !== "details") return;

    if (isTabletDown) {
      item.setAttribute("name", "filter");
    } else {
      item.removeAttribute("name");
      item.setAttribute("open", "");
    }
  });
}

function renderAutoFilters(group, data) {
  const wrap = group.querySelector('[data-filter="wrap"]');

  if (!wrap) return;

  wrap.innerHTML = "";
  const filters = {};

  data.forEach((item) => {
    Object.entries(item.details).forEach(([key, values]) => {
      if (!filters[key]) filters[key] = new Set();

      values.forEach((value) => {
        filters[key].add(value);
      });
    });
  });

  Object.entries(filters).forEach(([key, values]) => {
    createCheckboxFilter(wrap, key, Array.from(values));
  });
}

function updateCheckboxState(group) {
  group.querySelectorAll(".form_ui_item").forEach((item) => {
    const input = item.querySelector("input[type='checkbox']");
    const label = item.querySelector(".form_ui_label");

    const state = input?.checked ? "checked" : "unchecked";

    item.setAttribute("data-state", state);
    label?.setAttribute("data-state", state);
  });
}

/* ================================
  Filter Logic
================================ */
function getActiveFilters(group) {
  const activeFilters = {};

  group
    .querySelectorAll('[data-filter="wrap"] [data-filter]')
    .forEach((filterGroup) => {
      const key = filterGroup.getAttribute("data-filter");

      if (!key) return;

      const checkedValues = Array.from(
        filterGroup.querySelectorAll("input[type='checkbox']:checked")
      ).map((input) =>
        normalizeText(
          input.value ||
            input.closest(".form_ui_label")?.querySelector(".form_ui_text")
              ?.textContent
        )
      );

      activeFilters[key] = checkedValues;
    });

  return activeFilters;
}

function itemMatchesSearch(itemData, searchValue) {
  if (!searchValue) return true;

  return itemData.text.includes(searchValue);
}

function itemMatchesFilters(itemData, activeFilters) {
  return Object.entries(activeFilters).every(([key, values]) => {
    if (!values.length) return true;

    const itemValues = itemData.details[key] || [];

    return values.some((value) => itemValues.includes(value));
  });
}

function applyFilters(group, data) {
  const searchInput = group.querySelector('[data-filter="search"]');
  const searchValue = normalizeText(searchInput?.value);
  const activeFilters = getActiveFilters(group);

  data.forEach((itemData) => {
    const isSearchMatch = itemMatchesSearch(itemData, searchValue);
    const isFilterMatch = itemMatchesFilters(itemData, activeFilters);

    itemData.element.style.display =
      isSearchMatch && isFilterMatch ? "" : "none";
  });

  updateCheckboxState(group);

  if (group.querySelector(".glossary_content_item")) {
    updateGlossaryCategoryVisibility(group);
  }
}

/* ================================
  Filter Init
================================ */
function initSearchFilter(group, data) {
  const searchInput = group.querySelector('[data-filter="search"]');

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    applyFilters(group, data);
  });
}

function initCheckboxFilter(group, data) {
  const checkboxWrap = group.querySelector('[data-filter="wrap"]');

  if (!checkboxWrap) return;

  checkboxWrap.addEventListener("change", (e) => {
    if (!e.target.matches("input[type='checkbox']")) return;

    applyFilters(group, data);
  });
}

function initAutoFilter() {
  document.querySelectorAll('[data-filter="group"]').forEach((group) => {
    if (group._autoFilterInitialized) return;

    group._autoFilterInitialized = true;

    const data = collectFilterData(group);

    renderAutoFilters(group, data);
    initSearchFilter(group, data);
    initCheckboxFilter(group, data);
    applyFilters(group, data);
  });
}

/* ================================
  Read Time
================================ */
function initDisplayReadTime() {
  const wordsPerMinute = 200;
  const articles = document.querySelectorAll("[data-read-time-article]");

  articles.forEach((article, index) => {
    const matchValue = article.getAttribute("data-read-time-article");
    const text = article.textContent.trim();

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

    let targets;

    if (matchValue) {
      targets = document.querySelectorAll(
        `[data-read-time-target="${matchValue}"]`
      );
    } else {
      const emptyTargets = document.querySelectorAll(
        '[data-read-time-target=""], [data-read-time-target]:not([data-read-time-target*="-"])'
      );
      targets = emptyTargets[index] ? [emptyTargets[index]] : [];
    }

    targets.forEach((target) => {
      target.textContent = `${minutes}`;
    });
  });
}

/* ================================
  Testimonial Slider
================================ */
function testimonialSlider() {
  const section = document.querySelector(".testimonial_wrap");
  if (!section) return;

  const slider = section.querySelector(".testimonial_slider");
  const prevBtn = section.querySelector('[data-button="prev"]');
  const nextBtn = section.querySelector('[data-button="next"]');

  if (!slider) return;

  const mm = gsap.matchMedia();

  mm.add("(max-width: 767px)", () => {
    const swiper = new Swiper(slider, {
      slideClass: "testimonial_item_wrap",
      slidesPerView: 1,
      loop: true,
      navigation: {
        prevEl: prevBtn,
        nextEl: nextBtn,
      },
    });

    return () => swiper.destroy(true, true);
  });
}

/* ================================
  Team Slider
================================ */
function teamSlider() {
  const section = document.querySelector(".team_wrap");
  if (!section) return;

  const slider = section.querySelector(".team_slider");
  const wrapper = slider?.querySelector(".swiper-wrapper");
  const prevBtn = section.querySelector('[data-button="prev"]');
  const nextBtn = section.querySelector('[data-button="next"]');

  if (!slider || !wrapper) return;

  // Remove old clones if function re-runs
  wrapper
    .querySelectorAll('[data-clone="true"]')
    .forEach((slide) => slide.remove());

  const originalSlides = [...wrapper.querySelectorAll(".team_item_wrap")];

  if (!originalSlides.length) return;

  const minSlides = 12;
  let index = 0;

  while (wrapper.children.length < minSlides) {
    const clone = originalSlides[index % originalSlides.length].cloneNode(true);
    clone.setAttribute("data-clone", "true");
    wrapper.appendChild(clone);
    index++;
  }

  new Swiper(slider, {
    slideClass: "team_item_wrap",
    slidesPerView: 1.2,
    spaceBetween: 16,
    loop: true,
    centeredSlides: true,
    loopAdditionalSlides: 4,

    autoplay: {
      delay: 5000, // 5 detik
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },

    navigation:
      prevBtn && nextBtn
        ? {
            prevEl: prevBtn,
            nextEl: nextBtn,
          }
        : false,

    breakpoints: {
      667: {
        slidesPerView: 2,
        centeredSlides: true,
        spaceBetween: 20,
      },
      992: {
        slidesPerView: 4,
        spaceBetween: 20,
      },
    },
  });
}

/* ================================
  Insight Infinite Slider
================================ */
function initInsightInfiniteSlider() {
  const viewport = document.querySelector(".insight_slider");
  const slider = document.querySelector(".insight_list");

  if (!viewport || !slider) return;

  if (insightTicker) {
    gsap.ticker.remove(insightTicker);
    insightTicker = null;
  }

  if (insightResizeHandler) {
    window.removeEventListener("resize", insightResizeHandler);
    insightResizeHandler = null;
  }

  if (insightScrollTrigger) {
    insightScrollTrigger.kill();
    insightScrollTrigger = null;
  }

  const originalItems = Array.from(slider.children).filter(
    (item) => !item.hasAttribute("data-clone")
  );

  if (!originalItems.length) return;

  slider.innerHTML = "";
  originalItems.forEach((item) => slider.appendChild(item));

  gsap.set(slider, {
    display: "flex",
    flexWrap: "nowrap",
    width: "max-content",
    willChange: "transform",
  });

  originalItems.forEach((item) => {
    gsap.set(item, {
      flex: "0 0 auto",
    });
  });

  const getFullSetWidth = () => {
    return originalItems.reduce((total, item) => {
      const style = getComputedStyle(item);
      const marginLeft = parseFloat(style.marginLeft) || 0;
      const marginRight = parseFloat(style.marginRight) || 0;

      return total + item.offsetWidth + marginLeft + marginRight;
    }, 0);
  };

  let fullSetWidth = getFullSetWidth();
  if (!fullSetWidth) return;

  const cloneCount = 4;

  for (let i = 0; i < cloneCount; i++) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("data-clone", "true");
      slider.appendChild(clone);
    });
  }

  const setX = gsap.quickSetter(slider, "x", "px");

  let target = 0;
  let current = 0;
  let lastInteractionTime = Date.now();
  let isInView = false;

  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchX = 0;
  let isDragging = false;
  let isHorizontalGesture = false;
  let gestureChecked = false;

  const sensitivity = 1;
  const touchSensitivity = 1.4;
  const easeFactor = 0.06;
  const autoScrollSpeed = 0.45;
  const gestureThreshold = 8;

  const isMobile = () => window.innerWidth <= 991;
  const lerp = (a, b, n) => a + (b - a) * n;

  insightScrollTrigger = ScrollTrigger.create({
    trigger: viewport,
    start: "top bottom+=50%",
    end: "bottom top-=50%",
    onEnter: () => {
      isInView = true;
      lastInteractionTime = Date.now();
    },
    onEnterBack: () => {
      isInView = true;
      lastInteractionTime = Date.now();
    },
    onLeave: () => {
      isInView = false;
    },
    onLeaveBack: () => {
      isInView = false;
    },
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (!isInView || isMobile()) return;

      const isHorizontalScroll =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

      if (isHorizontalScroll) {
        if (!viewport.contains(e.target)) return;

        e.preventDefault();

        const delta = e.shiftKey ? e.deltaY : e.deltaX;
        target += delta * sensitivity;
        lastInteractionTime = Date.now();

        return;
      }

      target += e.deltaY * sensitivity;
      lastInteractionTime = Date.now();
    },
    { passive: false }
  );

  viewport.addEventListener(
    "touchstart",
    (e) => {
      if (!isInView || !isMobile()) return;

      const touch = e.touches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastTouchX = touch.clientX;

      isDragging = true;
      isHorizontalGesture = false;
      gestureChecked = false;
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (e) => {
      if (!isInView || !isMobile() || !isDragging) return;

      const touch = e.touches[0];

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (!gestureChecked) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX < gestureThreshold && absY < gestureThreshold) return;

        isHorizontalGesture = absX > absY;
        gestureChecked = true;
      }

      if (!isHorizontalGesture) return;

      e.preventDefault();

      const moveX = touch.clientX - lastTouchX;

      target -= moveX * touchSensitivity;
      lastTouchX = touch.clientX;
      lastInteractionTime = Date.now();
    },
    { passive: false }
  );

  viewport.addEventListener("touchend", () => {
    isDragging = false;
    isHorizontalGesture = false;
    gestureChecked = false;
  });

  viewport.addEventListener("touchcancel", () => {
    isDragging = false;
    isHorizontalGesture = false;
    gestureChecked = false;
  });

  viewport.addEventListener("mouseenter", () => {
    gsap.to(
      { value: autoScrollMultiplier },
      {
        value: 0,
        duration: 1.2,
        ease: "power3.out",
        onUpdate() {
          autoScrollMultiplier = this.targets()[0].value;
        },
      }
    );
  });

  viewport.addEventListener("mouseleave", () => {
    gsap.to(
      { value: autoScrollMultiplier },
      {
        value: 1,
        duration: 1.2,
        ease: "power3.out",
        onUpdate() {
          autoScrollMultiplier = this.targets()[0].value;
        },
      }
    );
  });

  insightTicker = () => {
    if (!isInView) return;

    if (Date.now() - lastInteractionTime > 1500) {
      target += autoScrollSpeed * autoScrollMultiplier;
    }

    current = lerp(current, target, easeFactor);

    let mod = current % fullSetWidth;

    if (mod < 0) {
      mod += fullSetWidth;
    }

    setX(-mod);
  };

  gsap.ticker.add(insightTicker);

  insightResizeHandler = () => {
    fullSetWidth = getFullSetWidth();
  };

  window.addEventListener("resize", insightResizeHandler);
}

/* ================================
  Button & Link Animation
================================ */
function initButtonAnimation() {
  const buttons = gsap.utils
    .toArray(
      ".button_main_wrap, .nav_links_link, .footer_link_wrap, .footer_bottom_link_wrap, .button_link_wrap"
    )
    .filter((button) => {
      return !button.closest(".nav_mobile_wrap.w-nav");
    });

  if (!buttons.length) return;

  buttons.forEach((button) => {
    const textEl = button.querySelector(
      ".button_main_text, .nav_links_text, .footer_link_text, .footer_bottom_link_text, .button_link_text"
    );

    if (!textEl) return;

    // Hapus SplitText lama jika ada
    if (textEl._split) {
      textEl._split.revert();
    }

    const split = SplitText.create(textEl, {
      type: "lines,chars",
      linesClass: "line",
      charsClass: "char",
      mask: "lines",
    });

    textEl._split = split;

    split.chars.forEach((char) => {
      const value = char.textContent;

      if (value.trim() !== "") {
        char.setAttribute("data-char", value);
      }
    });

    gsap.set(split.chars, {
      yPercent: 0,
    });

    const animate = () => {
      gsap.fromTo(
        split.chars,
        {
          yPercent: 0,
        },
        {
          yPercent: -100,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.025,
          overwrite: true,
          onComplete: () => {
            gsap.set(split.chars, {
              yPercent: 0,
            });
          },
        }
      );
    };

    // Hindari listener dobel
    if (button._mouseenterHandler) {
      button.removeEventListener("mouseenter", button._mouseenterHandler);
    }

    button._mouseenterHandler = animate;

    button.addEventListener("mouseenter", button._mouseenterHandler);
  });
}

/* ================================
  Text Scroll Reveal
================================ */
function initTextScrollReveal() {
  document
    .querySelectorAll("[data-text-reveal] h1, [data-text-reveal] h2")
    .forEach((heading) => {
      SplitText.create(heading, {
        type: "lines, words",
        autoSplit: true,
        wordsClass: "word",
        onSplit(instance) {
          return gsap.from(instance.words, {
            opacity: 0,
            yPercent: 10,
            filter: "blur(24px)",
            duration: 0.8,
            stagger: 0.04,
            ease: "smooth",
            scrollTrigger: {
              trigger: heading,
              start: "clamp(top 80%)",
              once: true,
            },
          });
        },
      });
    });
}

/* ================================
  Hero Scroll Animation
================================ */
function initHeroScrollAnimation() {
  const section = document.querySelector('[data-section="hero"]');

  if (!section) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    gsap.to(section, {
      y: 120,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  });
}

/* ================================
  Highlight Text
================================ */
function initHighlightText() {
  let splitHeadingTargets = document.querySelectorAll("[data-text-highlight]");
  splitHeadingTargets.forEach((heading) => {
    const scrollStart =
      heading.getAttribute("data-highlight-scroll-start") || "top 85%";
    const scrollEnd =
      heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2;
    const staggerValue = heading.getAttribute("data-highlight-stagger") || 0.1;

    new SplitText(heading, {
      type: "words",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            },
          });
          tl.from(self.words, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear",
          });
        });
        return ctx;
      },
    });
  });
}

/* ================================
  Number Odometer
================================ */
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const initFlag = "data-odometer-initialized";
  const activeTweens = new WeakMap();

  const defaults = {
    duration: 1,
    ease: "power3.out",
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: "power2.out",
    triggerStart: "top 80%",
    staggerOrder: "left",
    digitCycles: 2,
  };

  document.querySelectorAll("[data-odometer-group]").forEach((group) => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, "");

    const elements = Array.from(
      group.querySelectorAll("[data-odometer-element]")
    );
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder =
      group.getAttribute("data-odometer-stagger-order") ||
      defaults.staggerOrder;
    const triggerStart =
      group.getAttribute("data-odometer-trigger-start") ||
      defaults.triggerStart;
    const elementStagger =
      parseFloat(group.getAttribute("data-odometer-stagger")) ||
      defaults.elementStagger;

    const elementData = elements.map((el) => {
      const originalText = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute("data-odometer-start");
      const startValue =
        parseFloat(el.getAttribute("data-odometer-start")) || 0;
      const duration =
        parseFloat(el.getAttribute("data-odometer-duration")) ||
        defaults.duration;
      const step = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map((revealEl) => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: "hidden" });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText, step }) => {
          cleanupElement(el, originalText);
        });
      },
    });

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(
          el,
          {
            width: widthEm + "em",
            opacity: 1,
            duration: defaults.revealDuration,
            ease: defaults.revealEase,
          },
          offset
        );
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(
          roller,
          {
            y: -targetPos * step + "em",
            duration,
            ease: defaults.ease,
            force3D: true,
          },
          offset + reversedIdx * defaults.digitStagger
        );
      });
    });
  });

  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease = options.ease || defaults.ease;
    const step = getLineHeightRatio(el);

    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      gsap.set(el, { clearProps: "width,overflow" });
    }

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments = parseSegments(currentText);
    const startDigitsStr = startSegments
      .filter((s) => s.type === "digit")
      .map((s) => s.char)
      .join("");
    const startValue = parseInt(startDigitsStr, 10) || 0;

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) {
      gsap.set(el, { width: oldWidthEm + "em", overflow: "hidden" });
    }

    const tl = gsap.timeline({
      onComplete() {
        cleanupElement(el, newText);
        activeTweens.delete(el);
      },
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(
        el,
        {
          width: newWidthEm + "em",
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    }

    revealEls.forEach((revealEl) => {
      if (revealEl.getAttribute("data-odometer-part") === "static") {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
      }
    });

    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(
        roller,
        {
          y: -targetPos * step + "em",
          duration,
          ease,
          force3D: true,
        },
        reversedIdx * defaults.digitStagger
      );
    });
  };

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === "normal") return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text) {
    return [...text].map((char) => ({
      type: /\d/.test(char) ? "digit" : "static",
      char,
    }));
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter((s) => s.type === "digit");
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, "0")
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map((s) =>
      s.type === "digit" ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
    );
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter((s) => s.type === "digit").length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
    return segments.map((seg) => {
      if (seg.type === "digit") {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      const hidden = firstDigitSeen && prevDigitHidden;
      return { ...seg, hidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute("data-odometer-grow")) {
      return el.getAttribute("data-odometer-grow") !== "false";
    }
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter((s) => s.type === "digit").length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = "";
    el.style.height = "";
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach((seg) => {
      if (seg.type === "static") {
        const span = document.createElement("span");
        span.setAttribute("data-odometer-part", "static");
        span.style.height = step + "em";
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 });
          revealEls.push(span);
        }
        return;
      }
      const mask = document.createElement("span");
      mask.setAttribute("data-odometer-part", "mask");
      mask.style.height = step + "em";
      mask.style.lineHeight = step;
      const roller = document.createElement("span");
      roller.setAttribute("data-odometer-part", "roller");
      roller.style.lineHeight = step;

      const digits = [];
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10);
      }
      roller.textContent = digits.join("\n");
      mask.appendChild(roller);
      el.appendChild(mask);
      const startDigit = seg.startDigit || 0;
      const isReveal = grow && seg.hidden;
      gsap.set(roller, {
        y: isReveal ? step + "em" : -startDigit * step + "em",
      });
      const endDigit = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });
    return { rollers, revealEls };
  }

  function cleanupElement(el, originalText) {
    el.style.overflow = "";
    el.style.height = "";

    const digits = [...originalText].filter((c) => /\d/.test(c));
    let di = 0;

    el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || "";
      mask.style.opacity = "";
      mask.style.overflow = "";
    });

    el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
      stat.style.opacity = "";
    });
  }

  function recalcOnResize() {
    document.querySelectorAll("[data-odometer-element]").forEach((el) => {
      const running = activeTweens.get(el);
      if (running) {
        running.progress(1);
        activeTweens.delete(el);
      }

      const hasRollers = el.querySelector('[data-odometer-part="roller"]');

      if (hasRollers) {
        const step = getLineHeightRatio(el);
        el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
          mask.style.height = step + "em";
          mask.style.lineHeight = step;
        });
        el.querySelectorAll('[data-odometer-part="roller"]').forEach(
          (roller) => {
            roller.style.lineHeight = step;
          }
        );
        el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
          stat.style.lineHeight = step;
        });
      }
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  });

  function applyStaggerOrder(items, order) {
    const arr = [...items];
    if (order === "right") return arr.reverse();
    if (order === "random") return shuffleArray(arr);
    return arr;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/* ================================
  Clickable Cards
================================ */
function initClickableCards(cardSelector, linkSelector) {
  const cards = document.querySelectorAll(cardSelector);
  if (!cards || cards.length === 0) {
    console.warn(
      `initClickableCards: Elemen '${cardSelector}' tidak ditemukan.`
    );
    return;
  }

  cards.forEach((card) => {
    card.style.cursor = "pointer";

    card.addEventListener("click", function (e) {
      if (!this) return;

      const link = this.querySelector(linkSelector);

      if (link && link.hasAttribute("href")) {
        const href = link.getAttribute("href").trim();

        if (href && href !== "" && href !== "#") {
          window.location.href = href;
        }
      }
    });
  });
}

/* ================================
  How it work
================================ */
function initHowItWork() {
  let mm = gsap.matchMedia();

  const cards = gsap.utils.toArray(".how_card_wrap");

  mm.add("(min-width: 769px)", () => {
    let tlDesktop = gsap.timeline({
      scrollTrigger: {
        trigger: ".how_list",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    cards.forEach((card) => {
      let arrow = card.querySelector(".how_card_arrow");

      tlDesktop.fromTo(
        card,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "smooth" }
      );

      if (arrow) {
        tlDesktop.fromTo(
          arrow,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "smooth" },
          "-=0.1"
        );
      }
    });
  });

  mm.add("(max-width: 768px)", () => {
    let tlMobile = gsap.timeline({
      scrollTrigger: {
        trigger: ".how_list",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    cards.forEach((card) => {
      let arrow = card.querySelector(".how_card_arrow");

      tlMobile.fromTo(
        card,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "smooth" }
      );

      if (arrow) {
        tlMobile.fromTo(
          arrow,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "smooth" },
          "-=0.1"
        );
      }
    });
  });
}

/* ================================
  Integration Details
================================ */

function initIntegrationDetails() {
  const contentItems = document.querySelectorAll(".learning_content_item");

  if (contentItems.length < 0) return;

  contentItems.forEach((item) => {
    const h2Element = item.querySelector(".learning_content_title");

    if (h2Element) {
      const groupName = h2Element.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const detailsElements = item.querySelectorAll("details.integ_item_wrap");

      detailsElements.forEach((details, index) => {
        details.setAttribute("name", groupName);

        if (index === 0) {
          details.setAttribute("open", "");
        } else {
          details.removeAttribute("open");
        }
      });
    }
  });
}

/* ================================
  Init
================================ */
function initFunction() {
  lenis.scrollTo(0, 0);

  navScrollBehavior();
  initTextScrollReveal();
  initHighlightText();
  initHeroScrollAnimation();
  initNumberOdometer();
  initGlossaryContent();
  initGlossaryLetterFilter();
  initAutoTOC();
  updateTocLines();
  initSocialShare();
  initAutoFilter();
  initDisplayReadTime();
  testimonialSlider();
  teamSlider();
  initInsightInfiniteSlider();
  initButtonAnimation();
  initClickableCards(".software_item_wrap", ".clickable_link");
  initHowItWork();
  initIntegrationDetails();

  ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", initFunction);

window.addEventListener("load", updateTocLines);

window.addEventListener("resize", () => {
  updateTocLines();

  ScrollTrigger.refresh();
});
