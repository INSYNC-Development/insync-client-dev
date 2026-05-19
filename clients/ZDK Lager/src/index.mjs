// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let lastScrollTop = 0;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  // if (has('[data-something]')) initSomething();

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }

  initialFunction(nextPage);
}

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(
    () => {
      resetPage(next);
    },
    null,
    0
  );

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(current, { autoAlpha: 0, duration: 0.4 });

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0.6);

  tl.fromTo(
    next,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
    },
    "startEnter"
  );

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter((data) => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
});

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
  // Run page functions
  initAfterEnterFunctions(data.next.container);

  // Settle
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(
          data.current.container,
          data.next.container
        );
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },
  ],
});

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light",
  },
  dark: {
    nav: "light",
    transition: "dark",
  },
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  var currentNodes = document.querySelectorAll("nav [data-barba-update]");

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    // Aria-current sync
    var newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    // Class list sync
    var newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
  });
}

// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

function initialFunction(container) {
  const q = gsap.utils.selector(container);

  gsap.set(container, { clearProps: "all" });

  window.scrollTo(0, 0);

  setTimeout(() => {
    const hash = window.location.hash;

    if (hash) {
      const targetElement = container.querySelector(hash);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, 200);

  initServicesDesktopScroll(container);
  backToTop(container);
  initNavHide();
  whySlider(container);
  initNumberOdometer(container);
  initLineRevealTestimonials(container);
  initStoryAnimation(container);
  setupTextLinesReveal(container);
  initServicesMobileSwiper(container);
  initHighlightText(container);

  ScrollTrigger.refresh();
}

function initNavHide() {
  const navbar = document.querySelector(".nav_component");

  if (!navbar) return;

  window.addEventListener("scroll", () => {
    let scrollTop = window.pageYOffset;

    if (scrollTop < 0) {
      scrollTop = 0;
    }

    if (scrollTop > lastScrollTop && scrollTop > 50) {
      gsap.to(navbar, {
        yPercent: -100,
        duration: 0.4,
        ease: "power2.out",
      });
    } else if (scrollTop < lastScrollTop) {
      gsap.to(navbar, {
        yPercent: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    lastScrollTop = scrollTop;
  });
}

function whySlider(container) {
  const slider = container.querySelector(".why_slider");
  const sliderContent = container.querySelector(".why_content_slider");

  if (!slider || !sliderContent) return;

  function duplicateImageSlides() {
    const wrapperItem = slider.querySelector(".swiper-wrapper");
    const itemSlides = Array.from(
      wrapperItem.querySelectorAll(".why_item_wrap")
    );
    if (itemSlides.length < 3) {
      const needed = 3 - itemSlides.length;
      const originalCount = itemSlides.length;
      for (let i = 0; i < needed; i++) {
        wrapperItem.appendChild(itemSlides[i % originalCount].cloneNode(true));
      }
    }
  }
  duplicateImageSlides();

  const contentItems = Array.from(
    sliderContent.querySelectorAll(".why_content_item")
  );
  const totalContent = contentItems.length;
  if (!totalContent) return;

  const elCurrent = container.querySelector("[data-current]");
  const elTotal = container.querySelector("[data-total]");
  if (elTotal) elTotal.textContent = String(totalContent);

  const btnNext = container.querySelector("[data-button='next']");
  const btnPrev = container.querySelector("[data-button='prev']");

  let activeContentIndex = 0;
  let isAnimating = false;
  let currentTween = null;
  let reduceMotion = false;
  let whyInstance;

  gsap
    .matchMedia()
    .add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      reduceMotion = ctx.conditions.reduce;
    });

  const slides = contentItems.map((item) => ({
    item,
    splitInstances: [],
    getLines() {
      return this.splitInstances.flatMap((s) => s.lines);
    },
  }));

  function setSlideState(index, isActive) {
    const { item } = slides[index];
    item.classList.toggle("is--active", isActive);
    item.setAttribute("aria-hidden", String(!isActive));
    gsap.set(item, {
      autoAlpha: isActive ? 1 : 0,
      pointerEvents: isActive ? "auto" : "none",
    });
  }

  function updateCounter() {
    if (elCurrent) elCurrent.textContent = String(activeContentIndex + 1);
  }

  function buildSplitText() {
    slides.forEach((slide, i) => {
      if (slide.splitInstances.length) {
        slide.splitInstances.forEach((s) => s.revert());
      }
      const targets = [
        slide.item.querySelector('[data-slider="title"]'),
        slide.item.querySelector('[data-slider="desc"]'),
      ].filter(Boolean);

      slide.splitInstances = targets.map((el) =>
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
        })
      );

      if (!reduceMotion) {
        const lines = slide.getLines();
        gsap.set(lines, { yPercent: i === activeContentIndex ? 0 : 110 });
      }
    });
  }

  buildSplitText();
  slides.forEach((_, i) => setSlideState(i, i === 0));
  updateCounter();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      buildSplitText();
    }, 250);
  });

  function toggleSwiperLock(isLocked) {
    if (!whyInstance) return;

    whyInstance.allowSlideNext = !isLocked;
    whyInstance.allowSlidePrev = !isLocked;
    whyInstance.allowTouchMove = !isLocked;

    if (btnNext) btnNext.style.pointerEvents = isLocked ? "none" : "auto";
    if (btnPrev) btnPrev.style.pointerEvents = isLocked ? "none" : "auto";
  }

  function goTo(nextIndex) {
    const targetIndex =
      typeof nextIndex === "number" ? nextIndex % totalContent : nextIndex;
    if (targetIndex === activeContentIndex) return;

    isAnimating = true;
    toggleSwiperLock(true);

    const prevIndex = activeContentIndex;
    activeContentIndex = targetIndex;
    updateCounter();

    const outgoing = slides[prevIndex];
    const incoming = slides[targetIndex];

    if (currentTween) currentTween.kill();

    if (reduceMotion) {
      currentTween = gsap
        .timeline({
          onComplete() {
            setSlideState(prevIndex, false);
            setSlideState(targetIndex, true);
            isAnimating = false;
            toggleSwiperLock(false);
          },
        })
        .to(outgoing.item, { autoAlpha: 0, duration: 0.4, ease: "power2" }, 0)
        .fromTo(
          incoming.item,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4, ease: "power2" },
          0
        );
      return;
    }

    const outLines = outgoing.getLines();
    const inLines = incoming.getLines();

    gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(inLines, { yPercent: 110 });

    currentTween = gsap
      .timeline({
        onComplete() {
          setSlideState(prevIndex, false);
          setSlideState(targetIndex, true);
          isAnimating = false;
          toggleSwiperLock(false);
        },
      })
      .to(
        outLines,
        {
          yPercent: -110,
          duration: 0.6,
          ease: "power4.inOut",
          stagger: { amount: 0.25 },
        },
        0
      )
      .to(
        inLines,
        {
          yPercent: 0,
          duration: 0.7,
          ease: "power4.inOut",
          stagger: { amount: 0.4 },
        },
        ">-=0.3"
      )
      .set(outgoing.item, { autoAlpha: 0 }, ">");
  }

  whyInstance = new Swiper(slider, {
    slidesPerView: 1,
    spaceBetween: 20,
    slideClass: "why_item_wrap",
    loop: true,
    speed: 600,
    navigation: {
      nextEl: btnNext,
      prevEl: btnPrev,
    },
    breakpoints: {
      748: { slidesPerView: 2 },
      1024: {
        initialSlide: 0,
        slidesPerView: 3,
        centeredSlides: true,
      },
    },
    on: {
      slideChange(swiper) {
        if (isAnimating) return;

        goTo(swiper.realIndex);
      },
    },
  });
}

function initNumberOdometer(container) {
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

  container.querySelectorAll("[data-odometer-group]").forEach((group) => {
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
    container.querySelectorAll("[data-odometer-element]").forEach((el) => {
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

function initHighlightText(container) {
  let splitHeadingTargets = container.querySelectorAll("[data-highlight-text]");
  splitHeadingTargets.forEach((heading) => {
    const scrollStart =
      heading.getAttribute("data-highlight-scroll-start") || "top 90%";
    const scrollEnd =
      heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2;
    const staggerValue = heading.getAttribute("data-highlight-stagger") || 0.1;

    new SplitText(heading, {
      type: "words, chars",
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
          tl.from(self.chars, {
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

function initLineRevealTestimonials(container) {
  const wraps = container.querySelectorAll("[data-testimonial-wrap]");
  if (!wraps.length) return;

  const imageClipHidden = "circle(0% at 50% 50%)";
  const imageClipVisible = "circle(50% at 50% 50%)";

  wraps.forEach((wrap) => {
    const list = wrap.querySelector("[data-testimonial-list]");
    if (!list) return;

    const items = Array.from(list.querySelectorAll("[data-testimonial-item]"));
    if (!items.length) return;

    const btnPrev = wrap.querySelector("[data-button='prev']");
    const btnNext = wrap.querySelector("[data-button='next']");
    const elCurrent = wrap.querySelector("[data-current]");
    const elTotal = wrap.querySelector("[data-total]");

    if (elTotal) elTotal.textContent = String(items.length);

    let activeIndex = items.findIndex((el) =>
      el.classList.contains("is--active")
    );
    if (activeIndex < 0) activeIndex = 0;

    let isAnimating = false;
    let reduceMotion = false;

    const autoplayEnabled = wrap.getAttribute("data-autoplay") === "true";
    const autoplayDuration =
      parseInt(wrap.getAttribute("data-autoplay-duration"), 10) || 4000;

    let autoplayCall = null;
    let isInView = true;

    const slides = items.map((item) => ({
      item,
      image: item.querySelector("[data-testimonial-img]"),

      splitTargets: [
        item.querySelector("[data-testimonial-text]"),
        ...item.querySelectorAll("[data-testimonial-split]"),
      ].filter(Boolean),

      splitInstances: [],

      getLines() {
        return this.splitInstances.flatMap((instance) => instance.lines);
      },
    }));

    function setSlideState(slideIndex, isActive) {
      const { item } = slides[slideIndex];
      item.classList.toggle("is--active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
      gsap.set(item, {
        autoAlpha: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
      });
    }

    function updateCounter() {
      if (elCurrent) elCurrent.textContent = String(activeIndex + 1);
    }

    function startAutoplay() {
      if (!autoplayEnabled) return;
      if (autoplayCall) autoplayCall.kill();

      autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
        if (!isInView || isAnimating) {
          startAutoplay();
          return;
        }
        goTo((activeIndex + 1) % slides.length);
        startAutoplay();
      });
    }

    function pauseAutoplay() {
      if (autoplayCall) autoplayCall.pause();
    }

    function resumeAutoplay() {
      if (!autoplayEnabled) return;
      if (!autoplayCall) startAutoplay();
      else autoplayCall.resume();
    }

    function resetAutoplay() {
      if (!autoplayEnabled) return;
      startAutoplay();
    }

    slides.forEach((_, i) => setSlideState(i, i === activeIndex));
    updateCounter();

    gsap
      .matchMedia()
      .add({ reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
        reduceMotion = context.conditions.reduce;
      });

    slides.forEach((slide, slideIndex) => {
      slide.splitInstances = slide.splitTargets.map((el) =>
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "text-line",
          autoSplit: true,
          onSplit(self) {
            if (reduceMotion) return;

            const isActive = slideIndex === activeIndex;
            gsap.set(self.lines, { yPercent: isActive ? 0 : 110 });

            if (slide.image) {
              gsap.set(slide.image, {
                clipPath: isActive ? imageClipVisible : imageClipHidden,
              });
            }
          },
        })
      );
    });

    function goTo(nextIndex) {
      if (isAnimating || nextIndex === activeIndex) return;
      isAnimating = true;

      const outgoingSlide = slides[activeIndex];
      const incomingSlide = slides[nextIndex];

      const tl = gsap.timeline({
        onComplete: () => {
          setSlideState(activeIndex, false);
          setSlideState(nextIndex, true);
          activeIndex = nextIndex;
          updateCounter();
          isAnimating = false;
        },
      });

      if (reduceMotion) {
        tl.to(
          outgoingSlide.item,
          {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2",
          },
          0
        ).fromTo(
          incomingSlide.item,
          {
            autoAlpha: 0,
          },
          {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2",
          },
          0
        );

        return;
      }

      const outgoingLines = outgoingSlide.getLines();
      const incomingLines = incomingSlide.getLines();

      gsap.set(incomingSlide.item, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(incomingLines, { yPercent: 110 });

      if (outgoingSlide.image)
        gsap.set(outgoingSlide.image, { clipPath: imageClipVisible });

      tl.to(
        outgoingLines,
        {
          yPercent: -110,
          duration: 0.6,
          ease: "power4.inOut",
          stagger: { amount: 0.25 },
        },
        0
      );

      if (outgoingSlide.image) {
        tl.to(
          outgoingSlide.image,
          {
            clipPath: imageClipHidden,
            duration: 0.6,
            ease: "power4.inOut",
          },
          0
        );
      }

      tl.to(
        incomingLines,
        {
          yPercent: 0,
          duration: 0.7,
          ease: "power4.inOut",
          stagger: { amount: 0.4 },
        },
        ">-=0.3"
      );

      if (incomingSlide.image) {
        tl.fromTo(
          incomingSlide.image,
          {
            clipPath: imageClipHidden,
          },
          {
            clipPath: imageClipVisible,
            duration: 0.75,
            ease: "power4.inOut",
          },
          "<"
        );
      }

      tl.set(outgoingSlide.item, { autoAlpha: 0 }, ">");
    }

    startAutoplay();

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        resetAutoplay();
        goTo((activeIndex + 1) % slides.length);
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        resetAutoplay();
        goTo((activeIndex - 1 + slides.length) % slides.length);
      });
    }

    function onKeyDown(e) {
      if (!isInView) return;

      const t = e.target;
      const isTypingTarget =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);

      if (isTypingTarget) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        resetAutoplay();
        goTo((activeIndex + 1) % slides.length);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        resetAutoplay();
        goTo((activeIndex - 1 + slides.length) % slides.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    ScrollTrigger.create({
      trigger: wrap,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        isInView = true;
        resumeAutoplay();
      },
      onEnterBack: () => {
        isInView = true;
        resumeAutoplay();
      },
      onLeave: () => {
        isInView = false;
        pauseAutoplay();
      },
      onLeaveBack: () => {
        isInView = false;
        pauseAutoplay();
      },
    });
  });
}

function initStoryAnimation(container) {
  const wraps = container.querySelectorAll("[data-story-wrap]");

  console.log(wraps);

  if (!wraps.length) return;

  wraps.forEach((wrap) => {
    const list = wrap.querySelector("[data-content='list']");
    if (!list) return;

    const items = Array.from(list.querySelectorAll("[data-content='item']"));
    if (!items.length) return;

    const progressList = wrap.querySelector("[data-progress='list']");
    const visualList = wrap.querySelector("[data-visual='list']");
    const visualItems = visualList
      ? Array.from(visualList.querySelectorAll("[data-visual='item']"))
      : [];
    const elCurrent = wrap.querySelector("[data-current]");

    let activeIndex = items.findIndex((el) =>
      el.classList.contains("is--active")
    );
    if (activeIndex < 0) activeIndex = 0;

    let isAnimating = false;
    let reduceMotion = false;
    let isInView = false;
    let progressTween = null;

    const autoplayDuration =
      parseInt(wrap.getAttribute("data-autoplay-duration"), 10) || 4000;

    if (progressList) {
      progressList.innerHTML = "";
      items.forEach((_, i) => {
        const pItem = document.createElement("div");
        pItem.setAttribute("data-progress", "item");
        pItem.setAttribute(
          "data-status",
          i === activeIndex ? "active" : "inactive"
        );

        pItem.classList.add("story_progress_item");

        if (i === activeIndex) {
          pItem.classList.add("is-active");
        }

        const pBar = document.createElement("div");
        pBar.className = "story_progress";
        pItem.appendChild(pBar);
        progressList.appendChild(pItem);
      });
    }

    const progressItems = progressList
      ? Array.from(progressList.querySelectorAll("[data-progress='item']"))
      : [];

    const slides = items.map((item, i) => ({
      item,
      visual: visualItems[i] || null,
      contentEl: item,
      lines: [],
    }));

    function setSlideState(slideIndex, isActive) {
      const { item } = slides[slideIndex];
      item.classList.toggle("is--active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    }

    function setProgressState(slideIndex, status) {
      if (!progressItems[slideIndex]) return;
      progressItems[slideIndex].setAttribute("data-status", status);
    }

    function updateCounter() {
      if (elCurrent) elCurrent.textContent = String(activeIndex + 1);
    }

    function resetProgressBar(slideIndex) {
      const bar = progressItems[slideIndex]?.querySelector(".story_progress");
      if (bar) gsap.set(bar, { width: "0%" });
    }

    function fillProgressBar(slideIndex, onComplete) {
      const bar = progressItems[slideIndex]?.querySelector(".story_progress");
      if (!bar) return null;
      return gsap.to(bar, {
        width: "100%",
        duration: autoplayDuration / 1000,
        ease: "none",
        onComplete,
      });
    }

    function startProgressAndAdvance() {
      if (progressTween) progressTween.kill();
      resetProgressBar(activeIndex);
      setProgressState(activeIndex, "active");

      progressTween = fillProgressBar(activeIndex, () => {
        if (!isInView || isAnimating) return;
        goTo((activeIndex + 1) % slides.length);
      });
    }

    function pauseProgress() {
      if (progressTween) progressTween.pause();
    }

    function resumeProgress() {
      if (progressTween) progressTween.resume();
    }

    slides.forEach((slide, i) => {
      setSlideState(i, i === activeIndex);
      setProgressState(i, i === activeIndex ? "active" : "inactive");

      if (slide.visual) {
        gsap.set(slide.visual, { autoAlpha: i === activeIndex ? 1 : 0 });
      }

      if (slide.contentEl) {
        gsap.set(slide.contentEl, {
          height: i === activeIndex ? "auto" : 0,
          autoAlpha: i === activeIndex ? 1 : 0,
        });
      }
    });

    updateCounter();

    gsap
      .matchMedia()
      .add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        reduceMotion = ctx.conditions.reduce;
      });

    slides.forEach((slide, slideIndex) => {
      const textEl = slide.contentEl;

      if (!textEl) return;

      const paras = Array.from(textEl.querySelectorAll("h3, p, li")).filter(
        Boolean
      );
      slide.lines = paras.length ? paras : [textEl];

      const isActive = slideIndex === activeIndex;
      if (!reduceMotion) {
        gsap.set(slide.lines, {
          yPercent: isActive ? 0 : 110,
          autoAlpha: isActive ? 1 : 0,
        });
      }
    });

    function goTo(nextIndex) {
      if (isAnimating || nextIndex === activeIndex) return;
      isAnimating = true;

      if (progressTween) progressTween.kill();

      const outgoing = slides[activeIndex];
      const outgoingIndex = activeIndex;
      const incoming = slides[nextIndex];

      const tl = gsap.timeline({
        onComplete: () => {
          setSlideState(outgoingIndex, false);
          setProgressState(outgoingIndex, "inactive");
          resetProgressBar(outgoingIndex);

          setSlideState(nextIndex, true);
          activeIndex = nextIndex;
          updateCounter();
          isAnimating = false;

          if (isInView) startProgressAndAdvance();
        },
      });

      if (reduceMotion) {
        if (outgoing.contentEl)
          tl.to(
            outgoing.contentEl,
            { autoAlpha: 0, height: 0, duration: 0.3, ease: "power2.in" },
            0
          );
        if (incoming.contentEl)
          tl.to(
            incoming.contentEl,
            { autoAlpha: 1, height: "auto", duration: 0.3, ease: "power2.out" },
            0.2
          );
        return;
      }

      if (outgoing.lines.length) {
        tl.to(
          outgoing.lines,
          {
            yPercent: -110,
            autoAlpha: 0,
            duration: 0.55,
            ease: "power4.inOut",
            stagger: { amount: 0.2 },
          },
          0
        );
      }
      if (outgoing.contentEl) {
        tl.to(
          outgoing.contentEl,
          { height: 0, duration: 0.5, ease: "power4.inOut" },
          0.1
        );
      }
      if (outgoing.visual) {
        tl.to(
          outgoing.visual,
          { autoAlpha: 0, scale: 1.04, duration: 0.5, ease: "power4.inOut" },
          0
        );
      }

      if (incoming.contentEl) {
        tl.to(
          incoming.contentEl,
          { height: "auto", autoAlpha: 1, duration: 0.5, ease: "power4.inOut" },
          ">-=0.2"
        );
      }
      if (incoming.lines.length) {
        gsap.set(incoming.lines, { yPercent: 110, autoAlpha: 0 });
        tl.to(
          incoming.lines,
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.65,
            ease: "power4.inOut",
            stagger: { amount: 0.35 },
          },
          ">-=0.2"
        );
      }
      if (incoming.visual) {
        gsap.set(incoming.visual, { autoAlpha: 0, scale: 0.96 });
        tl.to(
          incoming.visual,
          { autoAlpha: 1, scale: 1, duration: 0.65, ease: "power4.inOut" },
          ">-=0.4"
        );
      }
    }

    items.forEach((item, i) => {
      item.addEventListener("click", () => {
        if (i !== activeIndex) goTo(i);
      });
    });

    function onKeyDown(e) {
      if (!isInView) return;
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goTo((activeIndex + 1) % slides.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        goTo((activeIndex - 1 + slides.length) % slides.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);

    ScrollTrigger.create({
      trigger: wrap,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        isInView = true;
        startProgressAndAdvance();
      },
      onEnterBack: () => {
        isInView = true;
        resumeProgress();
      },
      onLeave: () => {
        isInView = false;
        pauseProgress();
      },
      onLeaveBack: () => {
        isInView = false;
        pauseProgress();
      },
    });
  });
}

function setupTextLinesReveal() {
  const getCSSVariable = (variableName, fallback = "#000") => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();

    return value || fallback;
  };

  const BRAND_COLOR = getCSSVariable("--swatch--brand-500", "#000");

  const textEls = gsap.utils.toArray("[data-heading-reveal] strong");
  if (!textEls.length) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    const splits = [];
    const timelines = [];

    textEls.forEach((text) => {
      const split = new SplitText(text, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char",
      });

      splits.push(split);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: text,
          start: "top bottom",
          end: "top 80%",
          toggleActions: "play none none none",
          refreshPriority: -1,
        },
        defaults: {
          ease: "power3.out",
        },
        onComplete: () => {
          gsap.set([split.words, split.chars], {
            clearProps: "willChange",
          });
        },
      });

      timelines.push(tl);

      tl.set(split.words, {
        willChange: "transform, opacity, filter",
      })
        .set(split.chars, {
          willChange: "color",
        })
        .from(split.words, {
          color: "color-mix(in srgb, var(--_theme---text) 40%, transparent)",
          delay: 0.2,
          duration: 0.8,
          stagger: { each: 0.1 },
        })
        .to(
          split.chars,
          {
            keyframes: [
              {
                color: BRAND_COLOR,
                duration: 0.25,
              },
              {
                color:
                  "color-mix(in srgb, var(--_theme---text) 100%, transparent)",
                duration: 0.35,
              },
            ],
            stagger: { each: 0.01 },
          },
          "<"
        );
    });

    gsap.set("[data-prevent-flicker='true']", {
      visibility: "visible",
    });

    return () => {
      timelines.forEach((tl) => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      });

      splits.forEach((split) => split.revert());

      gsap.set("[data-prevent-flicker='true']", {
        clearProps: "visibility",
      });
    };
  });
}

function initServicesMobileSwiper(container) {
  container.querySelectorAll("[data-service='group']").forEach((group) => {
    const visualSliderEl = group.querySelector(".services_visual_slider");
    const contentSliderEl = group.querySelector(".services_content_slider");

    if (!visualSliderEl || !contentSliderEl) return;

    const visualItems = group.querySelectorAll("[data-visual='item']");
    const serviceItems = group.querySelectorAll("[data-service='item']");
    let visualSwiper;

    let contentSwiper;

    const setActive = (index) => {
      visualItems.forEach((item, i) => {
        item.setAttribute("data-status", i === index ? "active" : "");
      });

      serviceItems.forEach((item, i) => {
        item.setAttribute("data-status", i === index ? "active" : "");
      });
    };

    const mm = gsap.matchMedia();

    mm.add("(max-width: 991px)", () => {
      setActive(0);

      visualSwiper = new Swiper(visualSliderEl, {
        slideClass: "services_visual",
        slidesPerView: 1.2,
        speed: 600,
        allowTouchMove: false,
        centeredSlides: true,
        // effect: "fade",
        // fadeEffect: {
        //   crossFade: true,
        // },
      });

      contentSwiper = new Swiper(contentSliderEl, {
        slideClass: "services_item_wrap",
        slidesPerView: 1.2,
        spaceBetween: 16,
        centeredSlides: true,
        slideToClickedSlide: true,
        speed: 600,
        breakpoints: {
          768: {
            slidesPerView: 2.3,

            spaceBetween: 24,
          },
        },
        on: {
          init(swiper) {
            setActive(swiper.realIndex);

            visualSwiper.slideTo(swiper.realIndex);
          },

          slideChange(swiper) {
            setActive(swiper.realIndex);

            visualSwiper.slideTo(swiper.realIndex);
          },
        },
      });

      serviceItems.forEach((item, index) => {
        item.addEventListener("click", () => {
          contentSwiper.slideTo(index);
          visualSwiper.slideTo(index);
          setActive(index);
        });
      });

      return () => {
        if (visualSwiper) visualSwiper.destroy(true, true);

        if (contentSwiper) contentSwiper.destroy(true, true);
      };
    });
  });
}

function initServicesDesktopScroll(container) {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    container.querySelectorAll("[data-service='group']").forEach((group) => {
      console.log("Working.....");

      const serviceItems = gsap.utils.toArray(
        group.querySelectorAll("[data-content='item']")
      );

      const visualItems = gsap.utils.toArray(
        group.querySelectorAll("[data-visual='item']")
      );

      if (!serviceItems.length || !visualItems.length) return;

      let activeIndex = -1;

      gsap.set(visualItems, {
        autoAlpha: 0,
        filter: "blur(8px)",
        zIndex: 1,
      });

      gsap.set(visualItems[0], {
        autoAlpha: 1,
        filter: "blur(0px)",
        zIndex: 2,
      });

      const setActive = (index) => {
        if (index === activeIndex) return;

        activeIndex = index;

        serviceItems.forEach((item, i) => {
          item.setAttribute("data-status", i === index ? "active" : "");
        });

        visualItems.forEach((item, i) => {
          item.setAttribute("data-status", i === index ? "active" : "");
        });

        gsap.to(visualItems, {
          autoAlpha: 0,
          filter: "blur(8px)",
          zIndex: 1,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        });

        gsap.to(visualItems[index], {
          autoAlpha: 1,
          filter: "blur(0px)",
          zIndex: 2,
          duration: 0.65,
          ease: "power3.out",
          overwrite: true,
        });
      };

      setActive(0);

      const trigger = ScrollTrigger.create({
        trigger: group,
        start: "top top",
        end: () => `+=${window.innerHeight * serviceItems.length}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
        onUpdate(self) {
          const index = Math.min(
            serviceItems.length - 1,

            Math.floor(self.progress * serviceItems.length)
          );

          setActive(index);
        },
      });

      return () => {
        trigger.kill();
      };
    });
  });
}

function backToTop(container) {
  const button = container.querySelector('[data-button="to-top"]');

  if (!button) return;

  button.addEventListener("click", () => {
    lenis.scrollTo(0);
  });
}
