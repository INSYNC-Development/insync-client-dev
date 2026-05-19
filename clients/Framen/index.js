let lenis;
lenis = new Lenis({
  autoRaf: true,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

CustomEase.create("osmo", "M0,0 C0.625,0.05 0,1 1,1");
CustomEase.create(
  "bounce",
  "M0,0 C0.03,0 0.08,0.02 0.12,0.08 C0.18,0.2 0.22,0.5 0.28,0.85 C0.32,1.05 0.38,1.12 0.45,1.08 C0.52,1.02 0.6,0.98 0.7,1 C0.8,1.02 0.9,1 1,1"
);

document.addEventListener("DOMContentLoaded", () => {
  initNumberOdometer();
});

// Resource
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const initFlag = "data-odometer-initialized";
  const activeTweens = new WeakMap();

  // Configuration
  const defaults = {
    duration: 2,
    ease: "osmo",
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: "power2.out",
    triggerStart: "top 80%",
    staggerOrder: "left",
    digitCycles: 2,
  };

  // Scroll-triggered groups
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

  // Programmatic update (optional add-on)
  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease = options.ease || defaults.ease;
    const step = getLineHeightRatio(el);

    // Kill any running animation and clear its inline style locks
    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      gsap.set(el, { clearProps: "width,overflow" });
    }

    // Measure current width before rebuilding (in em for responsive scaling)
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    // Parse current text as start, new text as end
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

    // Measure new natural width (in em)
    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    // Lock to old width for smooth transition
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

    // Animate element width
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

    // Fade in hidden statics
    revealEls.forEach((revealEl) => {
      if (revealEl.getAttribute("data-odometer-part") === "static") {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
      }
    });

    // Roll digits
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

  // Helpers
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

    // Remove rollers, set final digit, clear inline bloat (but preserve width)
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
      // Force-complete any running programmatic animation
      const running = activeTweens.get(el);
      if (running) {
        running.progress(1);
        activeTweens.delete(el);
      }

      const hasRollers = el.querySelector('[data-odometer-part="roller"]');

      if (hasRollers) {
        // Pre-triggered: recalculate step-based inline styles
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
      // Completed elements: width is em-based, scales automatically, don't touch
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

// Button Hover animation
// function initButtonHover() {
//   const buttons = document.querySelectorAll(".button_main_wrap");

//   buttons.forEach(function (btn) {
//     const textWraps = btn.querySelectorAll(".button_main_text_wrap");
//     const first = textWraps[0];
//     const second = textWraps[1];

//     if (!first || !second) return;

//     // Set initial state: second text starts below
//     gsap.set(second, { yPercent: 100 });

//     const tl = gsap.timeline({
//       paused: true,
//       defaults: { duration: 0.6, ease: "bounce" },
//     });
//     tl.to(first, { yPercent: -100 }, 0).to(second, { yPercent: -100 }, 0);

//     btn.addEventListener("mouseenter", function () {
//       tl.play();
//     });

//     btn.addEventListener("mouseleave", function () {
//       tl.reverse();
//     });
//   });
// }

// function initButtonLinkHover() {
//   const buttons = document.querySelectorAll(".button_link_wrap");

//   buttons.forEach(function (btn) {
//     const textWraps = btn.querySelectorAll(".button_link_text_wrap");
//     const first = textWraps[0];
//     const second = textWraps[1];

//     if (!first || !second) return;

//     // Set initial state: second text starts below
//     gsap.set(second, { yPercent: 100 });

//     const tl = gsap.timeline({
//       paused: true,
//       defaults: { duration: 0.6, ease: "bounce" },
//     });
//     tl.to(first, { yPercent: -100 }, 0).to(second, { yPercent: -100 }, 0);

//     btn.addEventListener("mouseenter", function () {
//       tl.play();
//     });

//     btn.addEventListener("mouseleave", function () {
//       tl.reverse();
//     });
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   initButtonHover();
//   initButtonLinkHover();
// });

// // SWIPER ANIM PARTNER PAGE
// function mediaSlider() {
//   // 1. Cek apakah library Swiper sudah terload
//   if (typeof Swiper === "undefined") return;

//   // 2. Seleksi elemen utama (Container Swiper)
//   const swiperElement = document.querySelector(".swiper.is-media");

//   // 3. Seleksi semua slide untuk memastikan ada konten yang bisa di-slide
//   const allSlides = document.querySelectorAll(".swiper-slide.is-media");

//   // Jika elemen tidak ditemukan atau slide kosong, hentikan fungsi
//   if (!swiperElement || allSlides.length === 0) return;

//   // 4. Inisialisasi Swiper
//   new Swiper(swiperElement, {
//     speed: 800,
//     loop: true,
//     slidesPerView: "auto",
//     spaceBetween: 20,
//     centeredSlides: false,

//     // Konfigurasi Navigasi sesuai class di HTML kamu
//     navigation: {
//       nextEl: ".p-media_button.is-next",
//       prevEl: ".p-media_button.is-prev",
//     },

//     // Efek transisi (Opsional, bisa dihapus jika ingin default)
//     grabCursor: true,
//   });
// }

// // LIVE SEARCH AND LOAD MORE FUNCT
// document.addEventListener("DOMContentLoaded", function () {
//   const itemsInitial = 1;
//   const itemsNext = 3;
//   const transitionDuration = 450;

//   const wrapper = document.querySelector('[data-load-more="wrapper"]');
//   const items = Array.from(
//     wrapper.querySelectorAll('[data-load-more="item"]'),
//   );
//   const loadMoreBtn = document.querySelector('[data-load-more="button"]');
//   const filterBtns = Array.from(
//     document.querySelectorAll("[data-filter-target]"),
//   );

//   let currentVisible = itemsInitial;
//   let isSearching = false;

//   const hideBtn = () => {
//     loadMoreBtn.style.opacity = "0";
//     loadMoreBtn.style.pointerEvents = "none";
//   };

//   const showBtn = () => {
//     loadMoreBtn.style.opacity = "1";
//     loadMoreBtn.style.pointerEvents = "auto";
//   };

//   const setStatus = (targets, status) => {
//     targets.forEach((item) =>
//       item.setAttribute("data-filter-status", status),
//     );
//   };

//   const getActive = () =>
//     items.filter(
//       (item) => item.getAttribute("data-filter-status") === "active",
//     );

//   setStatus(items, "not-active");

//   const applyNormal = () => {
//     const toShow = items.slice(0, currentVisible);
//     const toHide = items.slice(currentVisible);

//     setStatus(toShow, "active");
//     setStatus(toHide, "transition-out");
//     setTimeout(() => setStatus(toHide, "not-active"), transitionDuration);

//     currentVisible >= items.length ? hideBtn() : showBtn();
//   };

//   const applyFilter = (category) => {
//     const matched = items.filter(
//       (item) => item.dataset.filterName === category,
//     );
//     const unmatched = items.filter(
//       (item) => item.dataset.filterName !== category,
//     );

//     setStatus(getActive(), "transition-out");

//     setTimeout(() => {
//       setStatus(unmatched, "not-active");
//       setStatus(matched, "active");
//     }, transitionDuration);

//     hideBtn();
//   };

//   const applySearch = (matchedItems) => {
//     const unmatched = items.filter((item) => !matchedItems.includes(item));

//     setStatus(getActive(), "transition-out");

//     setTimeout(() => {
//       setStatus(unmatched, "not-active");
//       setStatus(matchedItems, "active");
//     }, transitionDuration);

//     hideBtn();
//   };

//   const resetSearch = () => {
//     isSearching = false;
//     currentVisible = itemsInitial;

//     wrapper.style.opacity = "0";
//     setTimeout(() => {
//       setStatus(items, "not-active");
//       applyNormal();
//       wrapper.style.opacity = "1";
//     }, 300);
//   };

//   applyNormal();

//   loadMoreBtn.addEventListener("click", function (e) {
//     e.preventDefault();
//     if (isSearching) return;

//     currentVisible += itemsNext;
//     applyNormal();
//   });

//   filterBtns.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       if (isSearching) return;

//       const target = btn.dataset.filterTarget;

//       filterBtns.forEach((b) => {
//         b.dataset.filterStatus = "not-active";
//         b.setAttribute("aria-pressed", "false");
//       });
//       btn.dataset.filterStatus = "active";
//       btn.setAttribute("aria-pressed", "true");

//       if (target === "all") {
//         setStatus(getActive(), "transition-out");
//         wrapper.style.opacity = "0";
//         setTimeout(() => {
//           currentVisible = itemsInitial;
//           setStatus(items, "not-active");
//           applyNormal();
//           wrapper.style.opacity = "1";
//         }, 300);
//       } else {
//         applyFilter(target);
//       }
//     });
//   });

//   initLiveSearch({
//     onSearch: (matchedItems) => {
//       if (matchedItems.length === 0) return;
//       isSearching = true;
//       applySearch(matchedItems);
//     },
//     onReset: () => {
//       if (!isSearching) return;
//       resetSearch();
//     },
//   });
// });

// function initLiveSearch({ onSearch, onReset } = {}) {
//   document.querySelectorAll("[data-live-search]").forEach(function (root) {
//     const input = root.querySelector("[data-live-search-input]");
//     const notFound = root.querySelector("[data-live-search-not-found]");

//     const options = {
//       listClass: "stories_list",
//       valueNames: ["stories_item_text", "stories_item_category_text"],
//       fuzzySearch: {
//         location: 0,
//         distance: 100,
//         threshold: 0.3,
//       },
//     };

//     const list = new List(root, options);

//     function updateNotFound() {
//       if (!notFound) return;
//       const q = (input && input.value ? input.value : "").trim();
//       if (list.matchingItems.length === 0 && q !== "") {
//         notFound.style.display = "block";
//         const p = notFound.querySelector("p");
//         if (p) p.textContent = `We couldn't find a match for "${q}"`;
//       } else {
//         notFound.style.display = "none";
//       }
//     }

//     function runSearch() {
//       const q = (input && input.value ? input.value : "").trim();

//       if (!q) {
//         list.search();
//         updateNotFound();
//         if (onReset) onReset();

//         return;
//       }

//       if (typeof list.fuzzySearch === "function") {
//         list.fuzzySearch(q);
//       } else {
//         list.search(q, ["stories_item_text", "stories_item_category_text"]);
//       }

//       updateNotFound();

//       const matchedEls = list.matchingItems.map((i) => i.elm);
//       if (onSearch) onSearch(matchedEls);
//     }

//     if (input) {
//       input.addEventListener("input", runSearch);
//     }

//     root._pageSearchList = list;
//     list.search();
//     updateNotFound();
//   });
// }

/* ============================================================
   Main Hero — Scroll Animation
   GSAP ScrollTrigger
   Ref: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
   ============================================================ */

/* ─────────────────────────────────────────
   Hero Scroll Animation
   Runs between 768px and 1900px viewport widths
   Requires: GSAP + ScrollTrigger
   Ref: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
───────────────────────────────────────── */

const heroAnim = () => {
  gsap.registerPlugin(ScrollTrigger);

  /* Cover-scale: fills 100vw × 100vh from element's natural size */
  function getCoverScale(el) {
    const rect = el.getBoundingClientRect();
    const scaleX = window.innerWidth / rect.width;
    const scaleY = window.innerHeight / rect.height;
    return Math.max(scaleX, scaleY) * 1.3;
  }

  function initHeroScroll() {
    const section = document.querySelector(".main_hero_wrap");
    const scaleContainer = document.querySelector(".main_hero_scale_container");
    const heroSection = document.querySelector(".main_hero_section");
    const introSection = document.querySelector(".main_hero_intro");
    const blur = document.querySelector(".main_hero_blur_wrap");

    if (!section || !scaleContainer || !heroSection || !introSection) return;

    /* Hoisted as `let` — reassigned on resize */
    let startScale = getCoverScale(scaleContainer);

    /* — Initial states — */
    gsap.set(scaleContainer, { scale: startScale, transformOrigin: "50% 50%" });
    gsap.set(heroSection, { opacity: 1, filter: "blur(0px)" });
    gsap.set(introSection, { opacity: 0 });

    /* ─────────────────────────────────────────
         SCROLL TIMELINE
         Ref: https://gsap.com/docs/v3/GSAP/gsap.timeline()/
    ──────────────────────��────────────────── */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 0%",
        end: "bottom bottom",
        scrub: 1.5,
        // markers: true,
      },
    });

    /* Phase 1 (0–0.7): Blur + fade out hero, scale down container */
    tl.to(
      heroSection,
      {
        opacity: 0,
        filter: "blur(12px)",
        ease: "power2.in",
        duration: 0.075,
      },
      0
    )
      .to(blur, { height: 0 }, 0)
      .to(
        scaleContainer,
        {
          scale: 1,
          ease: "power2.inOut",
          duration: 0.7,
        },
        0
      );

    /* Phase 2 (0.5–0.8): Fade in intro — overlaps scale */
    tl.to(
      introSection,
      {
        opacity: 1,
        ease: "power2.inOut",
        duration: 0.3,
      },
      0.5
    );

    /* ─────────────────────────────────────────
         RESIZE — debounced per GSAP best practices
         Ref: https://gsap.com/resources/scrolltrigger-bugs/
    ───────────────────────────────────────── */
    let resizeTimer;

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        startScale = getCoverScale(scaleContainer);
        gsap.set(scaleContainer, { scale: startScale });
        ScrollTrigger.refresh();
      }, 200);
    }

    window.addEventListener("resize", onResize);
  }

  /* Run only between 768px and 1900px */
  const w = window.innerWidth;
  if (w >= 768 && w <= 2000) {
    initHeroScroll();
  }
};

document.addEventListener("DOMContentLoaded", heroAnim);

const startAnim = () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────
       UTIL: Calculate scale so element covers
       100vw × 100vh (like CSS cover)
    ───────────────────────────────────────── */
  function getCoverScale(el) {
    const rect = el.getBoundingClientRect();
    const scaleX = window.innerWidth / rect.width;
    const scaleY = window.innerHeight / rect.height;
    return Math.max(scaleX, scaleY) * 1.3; // slight overshoot for smoothness
  }

  /* ─────────────────────────────────────────
       MAIN INIT
    ───────────────────────────────────────── */
  function initStartAnim() {
    const section = document.querySelector(".start_wrap");
    const scaleContainer = document.querySelector(".start_scale_container");
    const heroSection = document.querySelector(".start_section");
    const introSection = document.querySelector(".start_intro");
    const blur = document.querySelector(".start_blur_wrap");

    if (!section || !scaleContainer || !heroSection || !introSection) return;

    const startScale = getCoverScale(scaleContainer);

    /* — Initial states — */
    gsap.set(scaleContainer, {
      scale: startScale,
      transformOrigin: "50% 50%",
    });

    gsap.set(heroSection, { opacity: 1, filter: "blur(0px)" });
    gsap.set(introSection, { opacity: 0 });

    /* ─────────────────────────────────────────
         SCROLL TIMELINE
      ───────────────────────────────────────── */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 0%",
        end: "bottom bottom",
        scrub: 1.5,
        // markers: true,
      },
    });

    /* ── Phase 1 (0–70%): Blur + fade out hero, scale down ── */
    tl.to(
      heroSection,
      {
        opacity: 0,
        filter: "blur(12px)",
        ease: "power2.in",
        duration: 0.075, // fades away fast on scroll start
      },
      0
    ).to(blur, {
      height: 0,
    });

    tl.to(
      scaleContainer,
      {
        scale: 1,
        ease: "power2.inOut",
        duration: 0.7,
      },
      0
    );

    /* ── Phase 2 (0.5–0.75%): Fade in intro — overlaps scale ── */
    tl.to(
      introSection,
      {
        opacity: 1,
        ease: "power2.inOut",
        duration: 0.3,
      },
      0.5
    );

    /* ─────────────────────────────────────────
         RESIZE — Recalculate scale on resize
      ───────────────────────────────────────── */
    function onResize() {
      startScale = getCoverScale(scaleContainer);
      ScrollTrigger.refresh();
    }

    window.addEventListener("resize", onResize);
  }

  const w = window.innerWidth;
  if (w >= 768 && w <= 2000) {
    initStartAnim();
  }
};
document.addEventListener("DOMContentLoaded", startAnim);

// /* ─────────────────────────────────────────
//          SWIPER - TESTIMONIAL
//    ───────────────────────────────────────── */
// document.addEventListener("DOMContentLoaded", function () {
//   const testimonialSwiper = new Swiper(
//     ".testimonial_wrap .testimonial_swiper",
//     {
//       slideClass: "testimonial_slider",
//       wrapperClass: "swiper-wrapper",

//       slidesPerView: "auto",
//       spaceBetween: 20,
//       loop: false,
//       grabCursor: true,

//       effect: "creative",
//       creativeEffect: {
//         prev: {
//           shadow: true,
//           translate: ["-120%", 0, -500],
//         },
//         next: {
//           shadow: true,
//           translate: ["120%", 0, -500],
//         },
//       },

//       navigation: {
//         nextEl:
//           '.testimonial_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
//         prevEl:
//           '.testimonial_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
//         disabledClass: "is-disabled",
//       },
//     }
//   );
// });

// /* ─────────────────────────────────────────
// //          SWIPER - AREAS
// // ───────────────────────────────────────── */
// document.addEventListener("DOMContentLoaded", function () {
//   const areasSwiper = new Swiper(".areas_wrap .areas_slider", {
//     // Pengaturan kelas
//     slideClass: "areas_item_wrap",
//     wrapperClass: "swiper-wrapper",

//     // Konfigurasi Dasar (Mobile - Layar < 768px)
//     slidesPerView: "auto",
//     spaceBetween: 20,
//     grabCursor: true,
//     loop: false,

//     // Navigasi
//     navigation: {
//       nextEl:
//         '.areas_footer .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
//       prevEl:
//         '.areas_footer .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
//       disabledClass: "is-disabled",
//     },
//   });
// });

// /* ─────────────────────────────────────────
//                SWIPER - CASE STUDIES
//    ───────────────────────────────────────── */
// document.addEventListener("DOMContentLoaded", function () {
//   const areasSwiper = new Swiper(".case_wrap .case_list_wrap", {
//     slideClass: "case_item",
//     wrapperClass: "swiper-wrapper",

//     slidesPerView: "auto",
//     spaceBetween: 20,
//     grabCursor: true,
//     loop: false,

//     navigation: {
//       nextEl:
//         '.case_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
//       prevEl:
//         '.case_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
//       disabledClass: "is-disabled",
//     },
//   });
// });

// /* ─────────────────────────────────────────
//             SWIPER - EVENTS
//    ───────────────────────────────────────── */
// document.addEventListener("DOMContentLoaded", function () {
//   const eventsSwiper = new Swiper(".events_wrap .events_slider", {
//     slideClass: "events_item",
//     wrapperClass: "swiper-wrapper",

//     slidesPerView: "auto",
//     spaceBetween: 20,
//     grabCursor: true,
//     loop: false,

//     navigation: {
//       nextEl:
//         '.events_collection_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
//       prevEl:
//         '.events_collection_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
//       disabledClass: "is-disabled",
//     },
//   });
// });

// /* ─────────────────────────────────────────
//                SWIPER - Partner
//    ───────────────────────────────────────── */
// document.addEventListener("DOMContentLoaded", function () {
//   const mediaSwiper = new Swiper(".swiper.is-media", {
//     slideClass: "swiper-slide",
//     wrapperClass: "swiper-wrapper",

//     // Konfigurasi Fade
//     effect: "fade",
//     fadeEffect: {
//       crossFade: true,
//     },

//     speed: 800,
//     loop: true,
//     grabCursor: true,

//     // Konfigurasi Autoplay
//     autoplay: {
//       delay: 4000, // Slide berganti setiap 4 detik
//       disableOnInteraction: false, // Tetap autoplay meskipun user sudah klik manual
//       pauseOnMouseEnter: true, // Berhenti sebentar saat mouse hover (UX yang baik)
//     },

//     // Navigasi
//     navigation: {
//       nextEl: ".p-media_button.is-next",
//       prevEl: ".p-media_button.is-prev",
//     },
//   });
// });

/* ─────────────────────────────────────────
                Video Animation
   ───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const processItems = document.querySelectorAll("[data-video-anim-trigger]");

  processItems.forEach((item) => {
    const video = item.querySelector("[data-video-animation]");
    if (!video) return;

    const animType = video.getAttribute("data-video-animation");
    let isPlaying = false;

    const playVideoOnce = () => {
      if (!isPlaying) {
        isPlaying = true;
        video.currentTime = 0;
        video.play();
      }
    };

    video.addEventListener("ended", () => {
      isPlaying = false;
    });

    if (animType === "loop") {
      video.loop = true;
      video.play();
    }

    if (animType === "scroll-hover") {
      item.addEventListener("mouseenter", playVideoOnce);

      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        delay: 0.3,
        once: true,
        onEnter: playVideoOnce,
      });
    }

    if (animType === "scroll") {
      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        once: true,
        delay: 0.3,

        onEnter: playVideoOnce,
      });
    }
  });
});

/* ─────────────────────────────────────────
                EMAIL TEL VALIDATION
   ───────────────────────────────────────── */
const telInputValidation = () => {
  // Select all input fields with type="tel"
  const telInputs = document.querySelectorAll('input[type="tel"]');

  if (!telInputs) return;

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
        showError("Only numbers and a leading + are allowed.", errorMsgElement);
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
};

const emailValidation = () => {
  // Select all input fields with type="email"
  const emailInputs = document.querySelectorAll('input[type="email"]');

  if (!emailInputs.length) return;

  // Loop through each email input field found
  emailInputs.forEach((emailInput) => {
    // Find the sibling element for the error message
    const errorMsgElement = emailInput.nextElementSibling;

    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    ) {
      console.error(
        "Could not find the error message element for an email input.",
        emailInput
      );
      return; // Skip this field if no error message element is found
    }

    emailInput.addEventListener("blur", function () {
      const email = this.value.trim();
      const emailParts = email.split("@");

      if (emailParts.length === 2 && emailParts[1].length > 0) {
        const domain = emailParts[1];
        validateDomain(domain, errorMsgElement);
      } else if (email.length > 0) {
        showError("Please enter a valid email address.", errorMsgElement);
      } else {
        hideError(errorMsgElement); // Hide error if the field is empty
      }
    });
  });

  async function validateDomain(domain, errorElement) {
    try {
      // Show a loading/checking message for better UX
      showError("Verifying domain...", errorElement);

      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();

      // Check for a valid response and if an "Answer" section with records exists
      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement); // Domain is valid
      } else {
        showError(
          "The email domain appears to be invalid or non-existent.",
          errorElement
        );
      }
    } catch (error) {
      console.error("Error during domain validation:", error);
      // Optional: Show an error if the API is unreachable
      showError(
        "Validation failed. Please check your connection.",
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
};
document.addEventListener("DOMContentLoaded", function () {
  emailValidation();
  telInputValidation();
});

/* ─────────────────────────────────────────────
   Split Text — Color Fade Animation
   Attr: data-text-animation="split-text"
   Effect: chars animate correct color (20% opacity) → brand-500 → correct color (scrub + stagger)
   <strong> tags preserve their own computed color
   ───────────────────────────────────────────── */

// gsap.registerPlugin(SplitText, ScrollTrigger);

// function initSplitTextAnimation() {
//   const targets = document.querySelectorAll(
//     '[data-text-animation="split-text"]'
//   );

//   if (!targets.length) return;

//   // Resolve the brand color from CSS variable once
//   const brandColor = getComputedStyle(document.documentElement)
//     .getPropertyValue("--swatch--brand-500")
//     .trim();

//   targets.forEach(function (el) {
//     // Split element text into individual chars
//     const split = SplitText.create(el, {
//       type: "chars, words",
//       aria: "auto",
//     });

//     // Pre-map each char's resolved final color and its 20%-opacity variant
//     const toColors = split.chars.map(function (char) {
//       const strongEl = char.closest("strong") || char.querySelector("strong");
//       return getComputedStyle(strongEl ? strongEl : el).color;
//     });

//     const fromColors = toColors.map(function (color) {
//       return gsap.utils.interpolate("rgba(0,0,0,0)", color, 0.2);
//     });

//     // Set each char's initial color to its own 20%-opacity correct color
//     split.chars.forEach(function (char, i) {
//       gsap.set(char, { color: fromColors[i] });
//     });

//     // gsap.to() is required for keyframes with "at" percentage
//     gsap.to(split.chars, {
//       ease: "none",
//       stagger: 0.05,
//       keyframes: [
//         // Step 1 — transition through brand color
//         { color: brandColor, at: "50%" },
//         // Step 2 — resolve back to each char's actual correct color
//         {
//           color: function (i) {
//             return toColors[i];
//           },
//           at: "100%",
//         },
//       ],
//       scrollTrigger: {
//         trigger: el,
//         start: "top 80%",
//         end: "bottom 60%",
//         scrub: true,
//       },
//     });
//   });
// }

// // Guard against font mis-splits on custom typefaces
// document.fonts.ready.then(function () {
//   initSplitTextAnimation();
// });

const lineAnim = () => {
  const lines = document.querySelectorAll("[data-element='horizontal-line']");
  lines.forEach((line) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: line,
        start: "top 90%",
      },
    });

    gsap.from(line, {
      transform: "scaleX(0%)",
      ease: "osmo",
      duration: 2,
    });
  });
};

document.addEventListener("DOMContentLoaded", lineAnim);

gsap.registerPlugin(SplitText, ScrollTrigger);

function initSplitTextAnimation() {
  const targets = document.querySelectorAll(
    '[data-text-animation="split-text"]'
  );
  if (!targets.length) return;

  // Resolve brand color
  const brandColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--swatch--brand-500")
    .trim();

  targets.forEach(function (el) {
    // Split text
    const split = new SplitText(el, {
      type: "chars, words",
      aria: "auto",
    });

    // Map final colors and 20% opacity variants
    const toColors = split.chars.map(function (char) {
      const strongEl = char.closest("strong") || char.querySelector("strong");
      return getComputedStyle(strongEl ? strongEl : el).color;
    });

    const fromColors = toColors.map(function (color) {
      return gsap.utils.interpolate("rgba(0,0,0,0)", color, 0.2);
    });

    // Set initial colors
    split.chars.forEach(function (char, i) {
      gsap.set(char, { color: fromColors[i] });
    });

    // Animate keyframes (GSAP automatically distributes array objects equally)
    gsap.to(split.chars, {
      ease: "none",
      stagger: 0.05,
      keyframes: [
        { color: brandColor }, // Automatically 50%
        {
          color: function (i) {
            return toColors[i];
          },
        }, // Automatically 100%
      ],
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  });
}

// Init after fonts load
document.fonts.ready.then(function () {
  initSplitTextAnimation();
});

function initDetectScrollingDirection() {
  let lastScrollTop = 0;
  let scrollTimeout; // Variable to hold the timer
  let isScrolling = false; // Flag to prevent excessive DOM updates

  const threshold = 10; // Minimal scroll distance to switch to up/down
  const thresholdTop = 50; // Minimal scroll distance from top of window to start
  const scrollStopDelay = 150; // Time in ms to wait before assuming scroll has stopped

  window.addEventListener("scroll", () => {
    const nowScrollTop = window.scrollY;

    // ==========================================
    // 1. SCROLL STOP/START LOGIC
    // ==========================================

    // If we weren't scrolling, set the attribute to false (scrolling is active)
    if (!isScrolling) {
      isScrolling = true;
      document
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "false"));
    }

    // Clear the timeout on every scroll event
    clearTimeout(scrollTimeout);

    // Set a timer. If it isn't cleared by another scroll event within 150ms,
    // it will run and set the stopped attribute to true.
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "true"));
    }, scrollStopDelay);

    // ==========================================
    // 2. SCROLL DIRECTION & TOP THRESHOLD LOGIC
    // ==========================================

    if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
      // Update Scroll Direction
      const direction = nowScrollTop > lastScrollTop ? "down" : "up";
      document
        .querySelectorAll("[data-scrolling-direction]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-direction", direction)
        );

      // Update Scroll Started
      const started = nowScrollTop > thresholdTop;
      document
        .querySelectorAll("[data-scrolling-started]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-started", started ? "true" : "false")
        );

      lastScrollTop = nowScrollTop;
    }
  });
}

// Initialize Detect Scrolling Direction
document.addEventListener("DOMContentLoaded", () => {
  initDetectScrollingDirection();

  // Optional: Initialize the stopped state to 'true' on page load
  document
    .querySelectorAll("[data-scrolling-stopped]")
    .forEach((el) => el.setAttribute("data-scrolling-stopped", "true"));
});

function initDraggableMarquee(container) {
  const wrappers = container.querySelectorAll("[data-draggable-marquee-init]");

  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.getAttribute("data-draggable-marquee-init") === "initialized")
      return;

    const collection = wrapper.querySelector(
      "[data-draggable-marquee-collection]"
    );
    const list = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier = getNumberAttr(wrapper, "data-multiplier", 40);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.01);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // Make enough duplicates to cover screen
    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);

    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px",
      },
    });

    // Direction can be used for css + set initial direction on load
    const initialDirectionAttr = (
      wrapper.getAttribute("data-direction") || "left"
    ).toLowerCase();
    const baseDirection = initialDirectionAttr === "right" ? -1 : 1;

    const timeScale = { value: 1 };

    timeScale.value = baseDirection;
    wrapper.setAttribute(
      "data-direction",
      baseDirection < 0 ? "right" : "left"
    );

    if (baseDirection < 0) marqueeLoop.progress(1);

    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);
      wrapper.setAttribute(
        "data-direction",
        timeScale.value < 0 ? "right" : "left"
      );
    }

    applyTimeScale();

    // Drag observer
    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,
      onChangeX: (observerEvent) => {
        let velocityTimeScale = observerEvent.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(
          -multiplier,
          multiplier,
          velocityTimeScale
        );

        gsap.killTweensOf(timeScale);

        gsap
          .timeline({ onUpdate: applyTimeScale })
          .to(timeScale, {
            value: velocityTimeScale,
            duration: 0.1,
            overwrite: true,
          })
          .to(timeScale, {
            value: baseDirection,
            duration: 1.0,
            ease: "power2.out",
          });
      },
    });

    // Pause marquee when scrolled out of view
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        marqueeLoop.resume();
        applyTimeScale();
        marqueeObserver.enable();
      },
      onEnterBack: () => {
        marqueeLoop.resume();
        applyTimeScale();
        marqueeObserver.enable();
      },
      onLeave: () => {
        marqueeLoop.pause();
        marqueeObserver.disable();
      },
      onLeaveBack: () => {
        marqueeLoop.pause();
        marqueeObserver.disable();
      },
    });

    wrapper.setAttribute("data-draggable-marquee-init", "initialized");
  });
}
