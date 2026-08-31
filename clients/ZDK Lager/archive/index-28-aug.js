/* =============================================================================
   ZDK Langer — site custom code
   -----------------------------------------------------------------------------
   File map
     01  Environment & feature flags
     02  Utilities
     03  Page scope — every per-page instance is owned here and dies with the
         container Barba removes
     04  Shared event buses — one resize + one scroll listener for the whole
         site instead of one per module
     05  Shared motion primitives — the pieces the sliders have in common
     06  Function registry
     07  Page transitions + Barba wiring
     08  Generic helpers
     09  Page modules
     10  Parked / not in use

   Everything runs inside one IIFE so none of these names land on `window`
   alongside Webflow's and jQuery's globals. The two intentional exports are
   `window.lumos.modal` (the modal API the markup calls) and `window.ZDK`, a
   small handle for anything that needs to reach in from a Webflow embed.
============================================================================= */

(() => {
  "use strict";

  // -----------------------------------------
  // 01 · ENVIRONMENT & FEATURE FLAGS
  // -----------------------------------------

  gsap.registerPlugin(CustomEase);

  history.scrollRestoration = "manual";

  let lenis = null;
  let nextPage = document;
  let onceFunctionsInitialized = false;
  let navHideInitialized = false;
  let navDropdownInitialized = false;

  // Barba runs the full beforeEnter → enter → afterEnter chain on the initial
  // load as well, so the hooks alone cannot tell a cold load from a navigation.
  // The `once` transition sets this; afterEnter reads it and clears it.
  let isFirstLoad = false;

  const hasLenis = typeof window.Lenis !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

  // One source of truth for the motion preference. Every slider used to open its
  // own `gsap.matchMedia()` context purely to read this one boolean, and the
  // odometer ran its own `matchMedia()` query on top of that.
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  let reducedMotion = reducedMotionQuery.matches;

  function handleReducedMotionChange(event) {
    reducedMotion = event.matches;
  }

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
  } else if (reducedMotionQuery.addListener) {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  const DURATION_DEFAULT = 0.6;

  CustomEase.create("osmo", "0.625, 0.05, 0, 1");
  gsap.defaults({ ease: "osmo", duration: DURATION_DEFAULT });

  // -----------------------------------------
  // 02 · UTILITIES
  // -----------------------------------------

  const has = (s) => !!nextPage.querySelector(s);

  // A real array, so modules can map/filter/findIndex/flatMap over the result
  // instead of converting at each call site the way this file used to.
  const queryAll = (root, selector) =>
    Array.prototype.slice.call(root.querySelectorAll(selector));

  // `|| fallback` (not `??`) on purpose: a missing attribute parses to NaN and an
  // explicit `0` was already treated as "unset" by every caller.
  const numAttr = (el, name, fallback) =>
    parseFloat(el.getAttribute(name)) || fallback;

  const intAttr = (el, name, fallback) =>
    parseInt(el.getAttribute(name), 10) || fallback;

  const setText = (el, value) => {
    if (el) el.textContent = String(value);
  };

  // -----------------------------------------
  // 03 · PAGE SCOPE (teardown on Barba navigation)
  // -----------------------------------------
  //
  // Barba swaps containers but never unwinds what the per-page init functions
  // registered: gsap.matchMedia() contexts, SplitText instances (autoSplit
  // installs its own resize/font observers), Swiper instances, delayedCalls and
  // raw window listeners all survive the swap. Their cleanup callbacks only fire
  // on a media query change, so after N navigations the page carries N stacked
  // copies of everything — every scroll/resize then re-runs N× of work against
  // detached DOM, which is what freezes the page.
  //
  // Everything a page sets up must go through this scope so it dies with the
  // container it belongs to.

  let pageScope = null;

  function createPageScope(container) {
    destroyPageScope(container);

    pageScope = {
      container,
      mm: gsap.matchMedia(),
      cleanups: [],
    };

    return pageScope;
  }

  // Page-scoped matchMedia. Falls back to a bare instance if a page function ever
  // runs outside a scope, so nothing silently no-ops.
  function pageMatchMedia() {
    return pageScope ? pageScope.mm : gsap.matchMedia();
  }

  function onPageDestroy(fn) {
    if (typeof fn !== "function") return;

    if (pageScope) pageScope.cleanups.push(fn);
  }

  // `container` guards against hook ordering: with `sync: true` the outgoing
  // page's afterLeave can land after the incoming page has already initialised,
  // and we must never tear down the scope that just got built.
  function destroyPageScope(container) {
    if (!pageScope) return;
    if (container && pageScope.container && pageScope.container !== container) {
      return;
    }

    const scope = pageScope;
    pageScope = null;

    scope.cleanups.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Page cleanup failed:", err);
      }
    });

    scope.mm.revert();
    scope.mm.kill();
  }

  // Convenience for the `window.addEventListener` calls page functions make.
  function addPageListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    onPageDestroy(() => target.removeEventListener(type, handler, options));
  }

  // A timer a page starts has to be cancelled with it, or it fires against DOM
  // Barba has already thrown away.
  function pageTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    onPageDestroy(() => clearTimeout(id));
    return id;
  }

  function revertSplits(splits) {
    const list = Array.isArray(splits) ? splits : [splits];

    list.forEach((split) => {
      try {
        split?.revert();
      } catch (err) {
        /* already reverted with its container */
      }
    });
  }

  // SplitText instances (especially `autoSplit: true`) hold observers; revert
  // them with the page or they keep re-splitting detached DOM on every resize.
  // Modules that re-split on resize should call revertSplits() themselves and
  // register a single teardown, rather than tracking a new set on every rebuild.
  function trackSplits(splits) {
    const list = Array.isArray(splits) ? splits.slice() : [splits];

    onPageDestroy(() => revertSplits(list));

    return splits;
  }

  // -----------------------------------------
  // 04 · SHARED EVENT BUSES
  // -----------------------------------------
  //
  // One `resize` and one `scroll` listener for the whole site. Modules used to
  // attach their own — each with its own debounce timer — so a single resize woke
  // every timer on the page and a single scroll ran every handler. Subscriptions
  // are page-scoped and unsubscribe themselves when the container is destroyed.

  const RESIZE_DEBOUNCE_MS = 250;
  const widthChangeSubscribers = new Set();

  let lastKnownWidth = window.innerWidth;
  let resizeDebounceId = 0;

  function notifyWidthChange() {
    // Height-only resizes — mobile browser chrome collapsing as you scroll — fire
    // constantly and never change a line break or a roller width, so the
    // expensive re-splits and re-measures stay gated on width.
    if (window.innerWidth === lastKnownWidth) return;
    lastKnownWidth = window.innerWidth;

    widthChangeSubscribers.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("[resize] subscriber threw:", err);
      }
    });
  }

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeDebounceId);
      resizeDebounceId = setTimeout(notifyWidthChange, RESIZE_DEBOUNCE_MS);
    },
    { passive: true }
  );

  function onWidthChange(fn) {
    widthChangeSubscribers.add(fn);
    onPageDestroy(() => widthChangeSubscribers.delete(fn));
  }

  const scrollSubscribers = new Set();
  let scrollFrame = 0;

  function flushScroll() {
    scrollFrame = 0;

    const scrollTop = Math.max(0, window.pageYOffset);

    scrollSubscribers.forEach((fn) => {
      try {
        fn(scrollTop);
      } catch (err) {
        console.error("[scroll] subscriber threw:", err);
      }
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      // Coalesce to one callback per frame: scroll fires far more often than the
      // browser paints, and the nav used to build a fresh tween on every event.
      if (!scrollFrame) scrollFrame = requestAnimationFrame(flushScroll);
    },
    { passive: true }
  );

  function onScroll(fn) {
    scrollSubscribers.add(fn);
    return () => scrollSubscribers.delete(fn);
  }

  // -----------------------------------------
  // 05 · SHARED MOTION PRIMITIVES
  // -----------------------------------------

  // Every slider marks one item active and hides the rest from assistive tech and
  // pointer events the same way.
  function setSlideActive(item, isActive) {
    item.classList.toggle("is--active", isActive);
    item.setAttribute("aria-hidden", String(!isActive));
    gsap.set(item, {
      autoAlpha: isActive ? 1 : 0,
      pointerEvents: isActive ? "auto" : "none",
    });
  }

  // The masked-line swap shared by the "why" and testimonial sliders: outgoing
  // lines ride up out of their masks while the incoming ones ride in underneath.
  const LINE_SWAP = {
    hiddenY: 110,
    exitY: -110,
    outDuration: 0.6,
    inDuration: 0.7,
    ease: "power4.inOut",
    outStagger: { amount: 0.25 },
    inStagger: { amount: 0.4 },
    overlap: ">-=0.3",
  };

  // Kept as two halves as well as one call: the testimonial slider interleaves an
  // image clip tween between them, and `"<"` / `">"` positions depend on the order
  // tweens are added to the timeline.
  function addLinesOut(tl, lines) {
    return tl.to(
      lines,
      {
        yPercent: LINE_SWAP.exitY,
        duration: LINE_SWAP.outDuration,
        ease: LINE_SWAP.ease,
        stagger: LINE_SWAP.outStagger,
      },
      0
    );
  }

  function addLinesIn(tl, lines) {
    return tl.to(
      lines,
      {
        yPercent: 0,
        duration: LINE_SWAP.inDuration,
        ease: LINE_SWAP.ease,
        stagger: LINE_SWAP.inStagger,
      },
      LINE_SWAP.overlap
    );
  }

  function addLineSwap(tl, outLines, inLines) {
    addLinesOut(tl, outLines);
    return addLinesIn(tl, inLines);
  }

  // What both sliders fall back to when the visitor prefers reduced motion.
  function addCrossFade(tl, outItem, inItem, duration = 0.4) {
    return tl
      .to(outItem, { autoAlpha: 0, duration, ease: "power2" }, 0)
      .fromTo(
        inItem,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration, ease: "power2" },
        0
      );
  }

  // Self-rescheduling autoplay that registers its own teardown. The testimonial
  // and story sliders both used to leave a `gsap.delayedCall` running after Barba
  // removed their container — it kept driving a detached slider forever.
  function createAutoplay(seconds, onTick) {
    let call = null;

    const autoplay = {
      get started() {
        return Boolean(call);
      },
      start() {
        if (call) call.kill();
        call = gsap.delayedCall(seconds, onTick);
      },
      pause() {
        if (call) call.pause();
      },
      resume() {
        if (call) call.resume();
      },
      kill() {
        if (call) call.kill();
        call = null;
      },
    };

    onPageDestroy(autoplay.kill);

    return autoplay;
  }

  // Pointer + touch swipe detection on one element. Mouse drags arrive as pointer
  // events and finger drags as touch events — `pointerType === "touch"` is skipped
  // so a single touch is never counted twice. Returns `{ hasDragged }` so a click
  // handler on the same element can ignore the click that ends a drag.
  function createSwipe(el, options) {
    const {
      threshold = 50,
      moveTolerance = 8,
      canStart,
      onStart,
      onSwipe,
      onRelease,
    } = options;

    const state = { hasDragged: false };

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    function begin(x, y) {
      if (canStart && !canStart()) return;

      startX = x;
      startY = y;
      isDragging = true;
      state.hasDragged = false;

      el.classList.add("is-dragging");
      onStart?.();
    }

    function move(x, y) {
      if (!isDragging) return;

      if (
        Math.abs(x - startX) > moveTolerance ||
        Math.abs(y - startY) > moveTolerance
      ) {
        state.hasDragged = true;
      }
    }

    function end(x, y) {
      if (!isDragging) return;

      isDragging = false;
      el.classList.remove("is-dragging");

      const diffX = x - startX;
      const diffY = y - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        onSwipe?.(diffX < 0 ? 1 : -1);
        return;
      }

      onRelease?.();
    }

    function cancel() {
      isDragging = false;
      el.classList.remove("is-dragging");
      onRelease?.();
    }

    const fromMouse = (event) => event.pointerType !== "touch";
    const passive = { passive: true };

    addPageListener(el, "pointerdown", (e) => {
      if (fromMouse(e)) begin(e.clientX, e.clientY);
    });
    addPageListener(
      el,
      "pointermove",
      (e) => {
        if (fromMouse(e)) move(e.clientX, e.clientY);
      },
      passive
    );
    addPageListener(el, "pointerup", (e) => {
      if (fromMouse(e)) end(e.clientX, e.clientY);
    });
    addPageListener(el, "pointercancel", cancel);

    addPageListener(
      el,
      "touchstart",
      (e) => {
        if (e.touches.length) begin(e.touches[0].clientX, e.touches[0].clientY);
      },
      passive
    );
    addPageListener(
      el,
      "touchmove",
      (e) => {
        if (e.touches.length) move(e.touches[0].clientX, e.touches[0].clientY);
      },
      passive
    );
    addPageListener(
      el,
      "touchend",
      (e) => {
        if (e.changedTouches.length) {
          end(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      },
      passive
    );
    addPageListener(el, "touchcancel", cancel);

    return state;
  }

  // -----------------------------------------
  // 06 · FUNCTION REGISTRY
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

    // No lenis.resize()/ScrollTrigger.refresh() here: they used to run *before*
    // initialFunction had built anything, measuring an empty page, and the
    // afterEnter hook repeats both immediately afterwards. That was one wasted
    // full ScrollTrigger.refresh() — the most expensive call in the library — on
    // every navigation.
    initialFunction(nextPage);
  }

  // -----------------------------------------
  // 07 · PAGE TRANSITIONS
  // -----------------------------------------

  function runPageOnceAnimation(next) {
    return gsap.timeline().call(resetPage, [next], 0);
  }

  function runPageLeaveAnimation(current) {
    const tl = gsap.timeline({
      onComplete: () => {
        current.remove();
      },
    });

    if (reducedMotion) {
      // Immediate swap behavior if user prefers reduced motion
      return tl.set(current, { autoAlpha: 0 });
    }

    return tl.to(current, { autoAlpha: 0, duration: 0.4 });
  }

  function runPageEnterAnimation(next) {
    const tl = gsap.timeline();

    if (reducedMotion) {
      // Immediate swap behavior if user prefers reduced motion
      tl.set(next, { autoAlpha: 1 });
    } else {
      tl.add("startEnter", 0.6);
      tl.fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1 }, "startEnter");
    }

    // Both paths hand back the same "the container is now the live page" signal.
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

    // This transition now owns the scroll state; drop any hold still pending
    // from the initial load.
    cancelScrollLock();

    if (lenis && typeof lenis.stop === "function") {
      lenis.stop();
    }

    initBeforeEnterFunctions(data.next.container);
    applyThemeFrom(data.next.container);
  });

  barba.hooks.afterLeave((data) => {
    // Runs the outgoing page's own cleanups (Swiper.destroy, listener removal,
    // SplitText.revert, matchMedia revert) before the blanket ScrollTrigger
    // sweep, so those cleanups still see live triggers.
    destroyPageScope(data.current.container);

    if (hasScrollTrigger) {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
  });

  barba.hooks.enter((data) => {
    initBarbaNavUpdate(data);
  });

  barba.hooks.afterEnter((data) => {
    initAfterEnterFunctions(data.next.container);

    renderRecaptcha(data.next.container);

    // Settle
    if (hasLenis) {
      lenis.resize();
      lenis.start();
    }

    if (hasScrollTrigger) {
      ScrollTrigger.refresh();
    }

    // Last, and only on the first load. This hook runs on the initial load too
    // (Barba emits afterEnter after afterOnce), and the lenis.start() above is
    // what used to cancel the hold four milliseconds after it was applied when
    // it was armed from the `once` timeline instead.
    if (isFirstLoad) {
      isFirstLoad = false;
      lockScrollFor(LOAD_SCROLL_LOCK_MS);
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
          isFirstLoad = true;

          initOnceFunctions();

          return runPageOnceAnimation(data.next.container);
        },

        // Current page leaves
        async leave(data) {
          return runPageLeaveAnimation(data.current.container);
        },

        // New page enters
        async enter(data) {
          return runPageEnterAnimation(data.next.container);
        },
      },
    ],
  });

  // -----------------------------------------
  // 08 · GENERIC HELPERS
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

  // -----------------------------------------
  // LOAD SCROLL HOLD
  // -----------------------------------------
  //
  // Barba brackets every navigation with lenis.stop() in beforeEnter and
  // lenis.start() in afterEnter, so scrolling is already held while a transition
  // runs. The first load has no such bracket, and it is the one entry point
  // where the visitor can scroll while the browser is still decoding images,
  // swapping in webfonts and settling layout — which is exactly when scrolling
  // feels worst. Hold it for a beat, then hand control back.

  const LOAD_SCROLL_LOCK_MS = 500;

  let scrollLockTimer = 0;

  function releaseScrollLock() {
    scrollLockTimer = 0;

    document.documentElement.removeAttribute("data-scroll-locked");

    if (lenis) lenis.start();
    else document.documentElement.style.overflow = "";
  }

  function lockScrollFor(ms) {
    clearTimeout(scrollLockTimer);

    // lenis.stop() preventDefaults wheel and touchmove, which covers both
    // pointers without touching `overflow`. Setting overflow on the root would
    // pull the scrollbar and shift the whole layout sideways at the worst
    // possible moment; that branch is only the fallback for a page where Lenis
    // never loaded.
    if (lenis) lenis.stop();
    else document.documentElement.style.overflow = "hidden";

    // Hook for CSS, e.g. suppressing hover affordances while held.
    document.documentElement.setAttribute("data-scroll-locked", "");

    scrollLockTimer = setTimeout(releaseScrollLock, ms);
  }

  // A navigation that starts inside the hold window owns the scroll state from
  // then on. Without this, the pending release would fire mid-transition and
  // re-enable scrolling that beforeEnter had deliberately stopped.
  function cancelScrollLock() {
    if (!scrollLockTimer) return;

    clearTimeout(scrollLockTimer);
    scrollLockTimer = 0;

    document.documentElement.removeAttribute("data-scroll-locked");
  }

  // The nav lives outside the Barba container, so its active state has to be
  // copied across by hand from the incoming page's markup. `<template>` content is
  // inert — parsing it never fetches an image or runs a script.
  function initBarbaNavUpdate(data) {
    const currentNodes = queryAll(document, "nav [data-barba-update]");
    if (!currentNodes.length) return;

    const tpl = document.createElement("template");
    tpl.innerHTML = data.next.html.trim();

    const nextNodes = tpl.content.querySelectorAll("[data-barba-update]");

    currentNodes.forEach((curr, index) => {
      const next = nextNodes[index];
      if (!next) return;

      const ariaCurrent = next.getAttribute("aria-current");
      if (ariaCurrent !== null) {
        curr.setAttribute("aria-current", ariaCurrent);
      } else {
        curr.removeAttribute("aria-current");
      }

      curr.setAttribute("class", next.getAttribute("class") || "");
    });
  }

  // -----------------------------------------
  // 09 · PAGE MODULES
  // -----------------------------------------
  //
  // Two lists, deliberately. LIGHT_PAGE_TASKS only bind listeners or set a few
  // attributes, so they run in one synchronous pass. HEAVY_PAGE_TASKS build and
  // measure a lot of DOM (SplitText, roller markup, pinned ScrollTriggers, Swiper
  // instances); running them together after Barba swaps in a fully-built
  // container blocks the main thread long enough to freeze the page and delay
  // input — scroll only "catches up" once the task finishes. Spreading them
  // across animation frames lets the browser paint and handle input in between.
  //
  // To add a module: write it as `fn(container)` and drop its name in one of the
  // two lists. Anything it creates that outlives a tween — a listener, a timer, a
  // Swiper, a SplitText — goes through the page scope helpers in section 03.

  const LIGHT_PAGE_TASKS = [
    navDropdownHandler,
    initNavHide,
    formInputValidation,
    backToTop,
    initServicesMobileSwiper,
    copyrightYear,
    loadMoreBlogs,
    initModals,
    initFilterProject,
  ];

  const HEAVY_PAGE_TASKS = [
    initServicesDesktopScroll,
    whySlider,
    initNumberOdometer,
    initLineRevealTestimonials,
    initStoryAnimation,
    setupTextLinesReveal,
    initHighlightText,
    initWorkStack,
    initStepAnimation,
    initWorkSlider,
  ];

  const HASH_SCROLL_DELAY_MS = 200;

  function initialFunction(container) {
    createPageScope(container);

    gsap.set(container, { clearProps: "all" });

    window.scrollTo(0, 0);

    // Page-scoped: a fast second navigation would otherwise scroll the new page
    // to a hash target that belongs to the container Barba just removed.
    pageTimeout(() => {
      const hash = window.location.hash;
      if (!hash) return;

      const targetElement = container.querySelector(hash);
      if (targetElement) targetElement.scrollIntoView({ behavior: "smooth" });
    }, HASH_SCROLL_DELAY_MS);

    LIGHT_PAGE_TASKS.forEach((task) => runPageTask(task, container));

    runHeavyPageTasks(container, HEAVY_PAGE_TASKS);
  }

  // Add ?debug=perf to the URL to log the cost of every init, not just the slow
  // ones — useful for pinning down which function stalls a specific page.
  const PERF_VERBOSE =
    typeof location !== "undefined" && location.search.includes("debug=perf");
  const PERF_BUDGET_MS = 50;

  // Isolates each init: one throwing function used to abort every init after it,
  // which leaves the page half-built and looks indistinguishable from a hang.
  function runPageTask(task, container) {
    const start = performance.now();

    try {
      task(container);
    } catch (err) {
      console.error(`[init] ${task.name || "anonymous"} threw:`, err);
      return;
    }

    const ms = performance.now() - start;

    if (PERF_VERBOSE) {
      console.log(`[init] ${task.name || "anonymous"} — ${ms.toFixed(1)}ms`);
    } else if (ms > PERF_BUDGET_MS) {
      console.warn(
        `[init] ${
          task.name || "anonymous"
        } blocked the main thread for ${ms.toFixed(1)}ms`
      );
    }
  }

  function runHeavyPageTasks(container, tasks) {
    let i = 0;
    const scope = pageScope;
    let frame = requestAnimationFrame(step);

    // A navigation can land mid-run; without this the remaining tasks would
    // initialise the outgoing container into the incoming page's scope.
    onPageDestroy(() => cancelAnimationFrame(frame));

    function step() {
      if (pageScope !== scope) return;

      if (i >= tasks.length) {
        if (hasScrollTrigger) ScrollTrigger.refresh();
        return;
      }

      runPageTask(tasks[i++], container);
      frame = requestAnimationFrame(step);
    }
  }

  const NAV_HIDE_THRESHOLD = 50;
  const NAV_HIDE_TWEEN = { duration: 0.4, ease: "power2.out" };

  function initNavHide() {
    if (navHideInitialized) return;

    const navbar = document.querySelector(".nav_component");

    if (!navbar) return;

    navHideInitialized = true;

    let lastScrollTop = 0;
    let isHidden = false;

    // The nav sits outside the Barba container, so this subscribes for the life of
    // the session rather than per page. Two things are different from the old
    // handler: it runs at most once per painted frame (the shared bus coalesces
    // scroll events, which fire several times per frame), and it only builds a
    // tween when the nav actually flips between shown and hidden. Previously
    // *every* scroll event constructed a fresh 0.4s tween toward a target the nav
    // was already heading to — hundreds of throwaway tweens per swipe.
    onScroll((scrollTop) => {
      const isScrollingDown = scrollTop > lastScrollTop;
      const isScrollingUp = scrollTop < lastScrollTop;

      lastScrollTop = scrollTop;

      if (isScrollingDown && scrollTop > NAV_HIDE_THRESHOLD) {
        if (isHidden) return;
        isHidden = true;
        gsap.to(navbar, { yPercent: -100, ...NAV_HIDE_TWEEN });
        return;
      }

      if (isScrollingUp && isHidden) {
        isHidden = false;
        gsap.to(navbar, { yPercent: 0, ...NAV_HIDE_TWEEN });
      }
    });
  }

  // A looping Swiper needs at least three slides before it stops duplicating the
  // wrong one. An empty CMS list makes `i % 0` NaN, so `itemSlides[NaN]` is
  // undefined and `.cloneNode()` throws — bail before that.
  function ensureMinimumSlides(slider, slideSelector, minimum) {
    const wrapper = slider.querySelector(".swiper-wrapper");
    if (!wrapper) return;

    const itemSlides = queryAll(wrapper, slideSelector);
    if (!itemSlides.length || itemSlides.length >= minimum) return;

    // One append instead of one per clone: each direct appendChild would force
    // Swiper's wrapper to re-layout.
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < minimum - itemSlides.length; i++) {
      fragment.appendChild(itemSlides[i % itemSlides.length].cloneNode(true));
    }

    wrapper.appendChild(fragment);
  }

  // Some sections cost more to build than the whole rest of the page put
  // together. Deferring one until it is a screen away moves that cost off the
  // load, where it competes with image decoding and the visitor's first scroll,
  // and onto an idle moment later. `once: true` retires the trigger after it
  // fires; the blanket ScrollTrigger sweep in afterLeave retires it if the
  // visitor navigates before ever reaching the section.
  const DEFER_BUILD_START = "top bottom+=100%";

  function buildWhenNear(el, build) {
    const scope = pageScope;

    ScrollTrigger.create({
      trigger: el,
      start: DEFER_BUILD_START,
      once: true,
      onEnter: () => {
        // A navigation can land between the trigger being created and it
        // firing; never build the outgoing page into the incoming page's scope.
        if (pageScope !== scope) return;

        build();

        // The build changes the section's height (SplitText masks add line
        // wrappers), so everything below it has moved.
        if (hasScrollTrigger) ScrollTrigger.refresh();
      },
    });
  }

  function whySlider(container) {
    const slider = container.querySelector(".why_slider");
    const sliderContent = container.querySelector(".why_content_slider");

    if (!slider || !sliderContent) return;

    // Measured at 650ms of SplitText line measurement on a 4x-throttled CPU —
    // more than every other module on the page combined — for a section that
    // sits roughly five screens down. Nothing here is visible at load.
    buildWhenNear(slider, () =>
      buildWhySlider(container, slider, sliderContent)
    );
  }

  function buildWhySlider(container, slider, sliderContent) {
    ensureMinimumSlides(slider, ".why_item_wrap", 3);

    const contentItems = queryAll(sliderContent, ".why_content_item");
    const totalContent = contentItems.length;
    if (!totalContent) return;

    const elCurrent = container.querySelector("[data-current]");
    const elTotal = container.querySelector("[data-total]");
    const btnNext = container.querySelector("[data-button='next']");
    const btnPrev = container.querySelector("[data-button='prev']");

    setText(elTotal, totalContent);

    const slides = contentItems.map((item) => ({
      item,
      splitInstances: [],
      getLines() {
        return this.splitInstances.flatMap((s) => s.lines);
      },
    }));

    let activeContentIndex = 0;
    let isAnimating = false;
    let currentTween = null;
    let whyInstance = null;

    function buildSplitText() {
      slides.forEach((slide, i) => {
        revertSplits(slide.splitInstances);

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

        if (!reducedMotion) {
          gsap.set(slide.getLines(), {
            yPercent: i === activeContentIndex ? 0 : LINE_SWAP.hiddenY,
          });
        }
      });
    }

    buildSplitText();
    slides.forEach((slide, i) => setSlideActive(slide.item, i === 0));
    setText(elCurrent, 1);

    // Re-splitting is only ever needed when the width changes, and it now shares
    // the site-wide debounced resize instead of owning a listener and a timer.
    onWidthChange(buildSplitText);
    onPageDestroy(() =>
      slides.forEach((slide) => revertSplits(slide.splitInstances))
    );

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

      const outgoing = slides[activeContentIndex];
      const incoming = slides[targetIndex];

      activeContentIndex = targetIndex;
      setText(elCurrent, targetIndex + 1);

      if (currentTween) currentTween.kill();

      const tl = gsap.timeline({
        onComplete() {
          setSlideActive(outgoing.item, false);
          setSlideActive(incoming.item, true);
          isAnimating = false;
          toggleSwiperLock(false);
        },
      });

      currentTween = tl;

      if (reducedMotion) {
        addCrossFade(tl, outgoing.item, incoming.item);
        return;
      }

      const inLines = incoming.getLines();

      gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(inLines, { yPercent: LINE_SWAP.hiddenY });

      addLineSwap(tl, outgoing.getLines(), inLines).set(
        outgoing.item,
        { autoAlpha: 0 },
        ">"
      );
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

    onPageDestroy(() => {
      if (currentTween) currentTween.kill();
      if (whyInstance) whyInstance.destroy(true, true);
      currentTween = null;
      whyInstance = null;
    });
  }

  // Every roller is the same column of digits, so build the string once for the
  // whole session instead of once per digit of every number on the page.
  const ODOMETER_DIGIT_CYCLES = 2;
  const ODOMETER_DIGIT_COLUMN = Array.from(
    { length: 10 * ODOMETER_DIGIT_CYCLES },
    (_, d) => d % 10
  ).join("\n");

  function initNumberOdometer(container) {
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
    };

    queryAll(container, "[data-odometer-group]").forEach((group) => {
      if (group.hasAttribute(initFlag)) return;
      group.setAttribute(initFlag, "");

      const elements = queryAll(group, "[data-odometer-element]");
      if (!elements.length || reducedMotion) return;

      const staggerOrder =
        group.getAttribute("data-odometer-stagger-order") ||
        defaults.staggerOrder;
      const triggerStart =
        group.getAttribute("data-odometer-trigger-start") ||
        defaults.triggerStart;
      const elementStagger = numAttr(
        group,
        "data-odometer-stagger",
        defaults.elementStagger
      );

      // Setup runs in four passes — read, write, read, write — instead of
      // interleaving them per element. Every `offsetWidth` that follows a style
      // write forces a synchronous reflow, so the old one-element-at-a-time loop
      // cost one reflow per revealed digit; this costs one for the whole group.

      // Pass 1 (read): metrics and parsed segments, before any DOM is touched.
      const elementData = elements.map((el) => {
        const computed = getComputedStyle(el);
        const originalText = el.textContent.trim();
        const hasExplicitStart = el.hasAttribute("data-odometer-start");
        const startValue = numAttr(el, "data-odometer-start", 0);

        let segments = parseSegments(originalText);
        segments = mapStartDigits(segments, startValue);
        segments = markHiddenSegments(segments, startValue);

        return {
          el,
          segments,
          originalText,
          fontSize: parseFloat(computed.fontSize),
          step: lineHeightRatio(computed),
          duration: numAttr(el, "data-odometer-duration", defaults.duration),
          grow: shouldGrow(el, hasExplicitStart, startValue, segments),
        };
      });

      // Pass 2 (write): swap each number for its roller markup.
      elementData.forEach((data) => {
        const built = buildRollerDOM(
          data.el,
          data.segments,
          data.step,
          data.grow
        );
        data.rollers = built.rollers;
        data.revealEls = built.revealEls;
      });

      // Pass 3 (read): measure every reveal in a single reflow.
      elementData.forEach((data) => {
        data.revealData = data.revealEls.map((revealEl) => ({
          el: revealEl,
          widthEm: revealEl.offsetWidth / data.fontSize,
        }));
      });

      // Pass 4 (write): collapse them all.
      elementData.forEach((data) => {
        data.revealData.forEach(({ el }) => {
          gsap.set(el, { width: 0, overflow: "hidden" });
        });
      });

      const ordered = applyStaggerOrder(elementData, staggerOrder);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: triggerStart,
          once: true,
        },
        onComplete() {
          elementData.forEach(({ el, originalText }) => {
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

      // One computed style for both the line-height ratio and the font size.
      const computed = getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      const step = lineHeightRatio(computed);

      const existing = activeTweens.get(el);
      if (existing) {
        existing.kill();
        gsap.set(el, { clearProps: "width,overflow" });
      }

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

    // Split in two so callers that already hold a computed style — the setup
    // passes above read one per element — do not ask for a second one.
    function lineHeightRatio(computed) {
      const lineHeight = computed.lineHeight;
      if (lineHeight === "normal") return 1.2;
      return parseFloat(lineHeight) / parseFloat(computed.fontSize);
    }

    function getLineHeightRatio(el) {
      return lineHeightRatio(getComputedStyle(el));
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
        s.type === "digit"
          ? { ...s, startDigit: parseInt(padded[di++], 10) }
          : s
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

      const fragment = document.createDocumentFragment();
      const rollers = [];
      const revealEls = [];
      const positionCalls = [];

      segments.forEach((seg) => {
        if (seg.type === "static") {
          const span = document.createElement("span");
          span.setAttribute("data-odometer-part", "static");
          span.style.height = step + "em";
          span.style.lineHeight = step;
          span.textContent = seg.char;
          fragment.appendChild(span);

          if (grow && seg.hidden) {
            positionCalls.push(() => gsap.set(span, { opacity: 0 }));
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
        roller.textContent = ODOMETER_DIGIT_COLUMN;

        mask.appendChild(roller);
        fragment.appendChild(mask);

        const startDigit = seg.startDigit || 0;
        const isReveal = grow && seg.hidden;
        const endDigit = parseInt(seg.char, 10);

        positionCalls.push(() =>
          gsap.set(roller, {
            y: isReveal ? step + "em" : -startDigit * step + "em",
          })
        );

        rollers.push({
          roller,
          targetPos: endDigit > startDigit ? endDigit : 10 + endDigit,
        });

        if (isReveal) revealEls.push(mask);
      });

      // Attach the whole column in one insertion, then position. The positioning
      // has to happen after the nodes are in the document: GSAP resolves the `em`
      // offsets against computed style, which a node still inside a
      // DocumentFragment does not have.
      el.appendChild(fragment);
      positionCalls.forEach((run) => run());

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
      queryAll(container, "[data-odometer-element]").forEach((el) => {
        const running = activeTweens.get(el);
        if (running) {
          running.progress(1);
          activeTweens.delete(el);
        }

        // Read the new ratio once per element, then write every part of it.
        if (!el.querySelector('[data-odometer-part="roller"]')) return;

        const step = getLineHeightRatio(el);

        el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
          mask.style.height = step + "em";
          mask.style.lineHeight = step;
        });
        el.querySelectorAll(
          '[data-odometer-part="roller"], [data-odometer-part="static"]'
        ).forEach((part) => {
          part.style.lineHeight = step;
        });
      });

      ScrollTrigger.refresh();
    }

    // Shared, width-gated resize — this used to be a second private listener with
    // its own debounce timer running alongside the slider's.
    onWidthChange(recalcOnResize);

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
    queryAll(container, "[data-highlight-text]").forEach((heading) => {
      const scrollStart =
        heading.getAttribute("data-highlight-scroll-start") || "top 90%";
      const scrollEnd =
        heading.getAttribute("data-highlight-scroll-end") || "center 40%";
      const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2;
      const staggerValue =
        heading.getAttribute("data-highlight-stagger") || 0.1;

      const split = new SplitText(heading, {
        // Only `self.words` is animated and no stylesheet targets `.char`, so
        // splitting to characters as well just built one extra <span> per letter —
        // on a long heading that is hundreds of nodes to lay out, and `autoSplit`
        // rebuilds all of them on every re-split.
        type: "words",
        autoSplit: true,
        onSplit(self) {
          // Returning the context lets SplitText revert these tweens itself
          // before each re-split.
          return gsap.context(() => {
            gsap
              .timeline({
                scrollTrigger: {
                  scrub: true,
                  trigger: heading,
                  start: scrollStart,
                  end: scrollEnd,
                },
              })
              .from(self.words, {
                autoAlpha: fadedValue,
                stagger: staggerValue,
                ease: "linear",
              });
          });
        },
      });

      trackSplits(split);
    });
  }

  const TESTIMONIAL_CLIP_HIDDEN = "circle(0% at 50% 50%)";
  const TESTIMONIAL_CLIP_VISIBLE = "circle(50% at 50% 50%)";

  function initLineRevealTestimonials(container) {
    queryAll(container, "[data-testimonial-wrap]").forEach((wrap) => {
      const list = wrap.querySelector("[data-testimonial-list]");
      if (!list) return;

      const items = queryAll(list, "[data-testimonial-item]");
      if (!items.length) return;

      const btnPrev = wrap.querySelector("[data-button='prev']");
      const btnNext = wrap.querySelector("[data-button='next']");
      const elCurrent = wrap.querySelector("[data-current]");
      const elTotal = wrap.querySelector("[data-total]");

      setText(elTotal, items.length);

      let activeIndex = Math.max(
        0,
        items.findIndex((el) => el.classList.contains("is--active"))
      );

      let isAnimating = false;
      let isInView = true;

      const autoplayEnabled = wrap.getAttribute("data-autoplay") === "true";
      const autoplayDuration = intAttr(wrap, "data-autoplay-duration", 4000);

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

      // Reschedules itself even on a skipped tick, so the slider picks straight
      // back up once it is in view again. createAutoplay() kills it with the page.
      const autoplay = createAutoplay(autoplayDuration / 1000, () => {
        if (!isInView || isAnimating) {
          autoplay.start();
          return;
        }
        goTo((activeIndex + 1) % slides.length);
        autoplay.start();
      });

      function startAutoplay() {
        if (autoplayEnabled) autoplay.start();
      }

      function resumeAutoplay() {
        if (!autoplayEnabled) return;
        if (autoplay.started) autoplay.resume();
        else autoplay.start();
      }

      slides.forEach((slide, i) =>
        setSlideActive(slide.item, i === activeIndex)
      );
      setText(elCurrent, activeIndex + 1);

      slides.forEach((slide, slideIndex) => {
        slide.splitInstances = trackSplits(
          slide.splitTargets.map((el) =>
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              linesClass: "text-line",
              autoSplit: true,
              onSplit(self) {
                if (reducedMotion) return;

                const isActive = slideIndex === activeIndex;
                gsap.set(self.lines, {
                  yPercent: isActive ? 0 : LINE_SWAP.hiddenY,
                });

                if (slide.image) {
                  gsap.set(slide.image, {
                    clipPath: isActive
                      ? TESTIMONIAL_CLIP_VISIBLE
                      : TESTIMONIAL_CLIP_HIDDEN,
                  });
                }
              },
            })
          )
        );
      });

      function goTo(nextIndex) {
        if (isAnimating || nextIndex === activeIndex) return;
        isAnimating = true;

        const outgoing = slides[activeIndex];
        const incoming = slides[nextIndex];

        const tl = gsap.timeline({
          onComplete: () => {
            setSlideActive(outgoing.item, false);
            setSlideActive(incoming.item, true);
            activeIndex = nextIndex;
            setText(elCurrent, nextIndex + 1);
            isAnimating = false;
          },
        });

        if (reducedMotion) {
          addCrossFade(tl, outgoing.item, incoming.item);
          return;
        }

        const incomingLines = incoming.getLines();

        gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: "auto" });
        gsap.set(incomingLines, { yPercent: LINE_SWAP.hiddenY });

        if (outgoing.image) {
          gsap.set(outgoing.image, { clipPath: TESTIMONIAL_CLIP_VISIBLE });
        }

        // Insertion order is load-bearing: the incoming image below is placed at
        // "<", i.e. alongside whichever tween was added last — the incoming lines.
        addLinesOut(tl, outgoing.getLines());

        if (outgoing.image) {
          tl.to(
            outgoing.image,
            {
              clipPath: TESTIMONIAL_CLIP_HIDDEN,
              duration: LINE_SWAP.outDuration,
              ease: LINE_SWAP.ease,
            },
            0
          );
        }

        addLinesIn(tl, incomingLines);

        if (incoming.image) {
          tl.fromTo(
            incoming.image,
            { clipPath: TESTIMONIAL_CLIP_HIDDEN },
            {
              clipPath: TESTIMONIAL_CLIP_VISIBLE,
              duration: 0.75,
              ease: LINE_SWAP.ease,
            },
            "<"
          );
        }

        tl.set(outgoing.item, { autoAlpha: 0 }, ">");
      }

      const step = (delta) => {
        startAutoplay();
        goTo((activeIndex + delta + slides.length) % slides.length);
      };

      startAutoplay();

      if (btnNext) addPageListener(btnNext, "click", () => step(1));
      if (btnPrev) addPageListener(btnPrev, "click", () => step(-1));

      addPageListener(window, "keydown", (e) => {
        if (!isInView) return;
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

        const target = e.target;
        const isTypingTarget =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);

        if (isTypingTarget) return;

        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      });

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
          autoplay.pause();
        },
        onLeaveBack: () => {
          isInView = false;
          autoplay.pause();
        },
      });
    });
  }

  function initStoryAnimation(container) {
    queryAll(container, "[data-story-wrap]").forEach((wrap) => {
      const list = wrap.querySelector("[data-content='list']");
      if (!list) return;

      const items = queryAll(list, "[data-content='item']");
      if (!items.length) return;

      const visualList = wrap.querySelector("[data-visual='list']");
      const visualItems = visualList
        ? queryAll(visualList, "[data-visual='item']")
        : [];

      const currentEls = queryAll(wrap, "[data-current]");
      const totalEls = queryAll(wrap, "[data-total]");

      let activeIndex = Math.max(
        0,
        items.findIndex((el) => el.classList.contains("is--active"))
      );

      let isAnimating = false;
      let isInView = false;

      const autoplayDuration = intAttr(wrap, "data-autoplay-duration", 4000);

      totalEls.forEach((el) => setText(el, items.length));

      function updateCounter() {
        currentEls.forEach((el) => setText(el, activeIndex + 1));
      }

      // `item` is both the tab and the content panel here, so `lines` are the
      // block elements inside it.
      const slides = items.map((item, i) => ({
        item,
        visual: visualItems[i] || null,
        lines: [],
      }));

      function setSlideState(slideIndex, isActive) {
        const { item } = slides[slideIndex];
        item.classList.toggle("is--active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      }

      // Deliberately does not reschedule on a skipped tick — goTo's onComplete and
      // the ScrollTrigger below own restarting it. createAutoplay() registers the
      // teardown this module was missing: the old delayedCall kept firing goTo
      // against a detached slider for the rest of the session after Barba removed
      // the page, and every further visit stacked another one on top.
      const autoplay = createAutoplay(autoplayDuration / 1000, () => {
        if (!isInView || isAnimating) return;
        goTo((activeIndex + 1) % slides.length);
      });

      slides.forEach((slide, i) => {
        const isActive = i === activeIndex;

        setSlideState(i, isActive);

        if (slide.visual) {
          gsap.set(slide.visual, { autoAlpha: isActive ? 1 : 0 });
        }

        gsap.set(slide.item, {
          height: isActive ? "auto" : 0,
          autoAlpha: isActive ? 1 : 0,
        });
      });

      updateCounter();

      slides.forEach((slide, slideIndex) => {
        const paras = queryAll(slide.item, "h3, p, li");
        slide.lines = paras.length ? paras : [slide.item];

        if (!reducedMotion) {
          const isActive = slideIndex === activeIndex;
          gsap.set(slide.lines, {
            yPercent: isActive ? 0 : LINE_SWAP.hiddenY,
            autoAlpha: isActive ? 1 : 0,
          });
        }
      });

      function goTo(nextIndex) {
        if (isAnimating || nextIndex === activeIndex) return;
        isAnimating = true;

        autoplay.kill();

        const outgoing = slides[activeIndex];
        const outgoingIndex = activeIndex;
        const incoming = slides[nextIndex];

        activeIndex = nextIndex;
        updateCounter();

        const tl = gsap.timeline({
          onComplete: () => {
            setSlideState(outgoingIndex, false);
            setSlideState(nextIndex, true);

            isAnimating = false;

            if (isInView) autoplay.start();
          },
        });

        if (reducedMotion) {
          tl.to(
            outgoing.item,
            { autoAlpha: 0, height: 0, duration: 0.3, ease: "power2.in" },
            0
          ).to(
            incoming.item,
            { autoAlpha: 1, height: "auto", duration: 0.3, ease: "power2.out" },
            0.2
          );
          return;
        }

        if (outgoing.lines.length) {
          tl.to(
            outgoing.lines,
            {
              yPercent: LINE_SWAP.exitY,
              autoAlpha: 0,
              duration: 0.55,
              ease: LINE_SWAP.ease,
              stagger: { amount: 0.2 },
            },
            0
          );
        }

        tl.to(
          outgoing.item,
          { height: 0, duration: 0.5, ease: LINE_SWAP.ease },
          0.1
        );

        if (outgoing.visual) {
          tl.to(
            outgoing.visual,
            { autoAlpha: 0, scale: 1.04, duration: 0.5, ease: LINE_SWAP.ease },
            0
          );
        }

        tl.to(
          incoming.item,
          { height: "auto", autoAlpha: 1, duration: 0.5, ease: LINE_SWAP.ease },
          ">-=0.2"
        );

        if (incoming.lines.length) {
          gsap.set(incoming.lines, {
            yPercent: LINE_SWAP.hiddenY,
            autoAlpha: 0,
          });
          tl.to(
            incoming.lines,
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.65,
              ease: LINE_SWAP.ease,
              stagger: { amount: 0.35 },
            },
            ">-=0.2"
          );
        }

        if (incoming.visual) {
          gsap.set(incoming.visual, { autoAlpha: 0, scale: 0.96 });
          tl.to(
            incoming.visual,
            { autoAlpha: 1, scale: 1, duration: 0.65, ease: LINE_SWAP.ease },
            ">-=0.4"
          );
        }
      }

      const step = (delta) =>
        goTo((activeIndex + delta + slides.length) % slides.length);

      const swipe = createSwipe(wrap, {
        canStart: () => !isAnimating,
        onStart: () => autoplay.pause(),
        onSwipe: (direction) => step(direction),
        onRelease: () => {
          if (isInView) autoplay.resume();
        },
      });

      items.forEach((item, i) => {
        addPageListener(item, "click", (e) => {
          // A drag that ends on a tab must not also select it.
          if (swipe.hasDragged) {
            e.preventDefault();
            return;
          }
          if (i !== activeIndex) goTo(i);
        });
      });

      const prevButton = wrap.querySelector('[data-button="prev"]');
      const nextButton = wrap.querySelector('[data-button="next"]');

      if (prevButton) {
        addPageListener(prevButton, "click", (e) => {
          e.preventDefault();
          step(-1);
        });
      }

      if (nextButton) {
        addPageListener(nextButton, "click", (e) => {
          e.preventDefault();
          step(1);
        });
      }

      ScrollTrigger.create({
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          isInView = true;
          autoplay.start();
        },
        onEnterBack: () => {
          isInView = true;
          autoplay.resume();
        },
        onLeave: () => {
          isInView = false;
          autoplay.pause();
        },
        onLeaveBack: () => {
          isInView = false;
          autoplay.pause();
        },
      });
    });
  }

  // Every knob for the heading reveal in one place. `offset` is in em so the
  // travel scales with the heading size instead of being a fixed pixel nudge;
  // `triggerStart` is the one to move if the reveal fires too early.
  const HEADING_REVEAL = {
    offset: "0.4em",
    duration: 0.8,
    ease: "power3.out",
    triggerStart: "top bottom",
  };

  function setupTextLinesReveal(container) {
    const scope = container || document;

    // Scoped to the container: a document-wide query picks up the outgoing
    // page's headings too while both containers are in the DOM.
    const headings = queryAll(scope, "[data-heading-reveal]");
    if (!headings.length) return;

    const flickerEls = queryAll(scope, "[data-prevent-flicker='true']");

    pageMatchMedia().add("(min-width: 992px)", () => {
      const timelines = headings.map((heading) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heading,
            start: HEADING_REVEAL.triggerStart,
            toggleActions: "play none none none",
            refreshPriority: -1,
          },
          defaults: {
            ease: HEADING_REVEAL.ease,
          },
          onComplete: () => {
            gsap.set(heading, { clearProps: "willChange" });
          },
        });

        // The whole heading fades up as one block — no SplitText, so nothing
        // rewrites the markup, nothing has to be reverted, and nothing re-splits
        // on resize or on a late-loading webfont. Two compositor properties on
        // one element per heading.
        tl.set(heading, {
          willChange: "transform, opacity",
        }).from(heading, {
          y: HEADING_REVEAL.offset,
          autoAlpha: 0,
          duration: HEADING_REVEAL.duration,
        });

        return tl;
      });

      // --- Previous animation: brand-colour sweep across the <strong> parts ---
      // Needs SplitText back: split each "[data-heading-reveal] strong" into
      // words, keep the instances so they can be reverted in the cleanup below,
      // then run this instead of the fade-up above.
      //
      // const brandColor =
      //   getComputedStyle(document.documentElement)
      //     .getPropertyValue("--swatch--brand-500")
      //     .trim() || "#000";
      //
      // const split = new SplitText(text, { type: "words", wordsClass: "word" });
      //
      // tl.set(split.words, {
      //   willChange: "color",
      //   color: "color-mix(in srgb, var(--_theme---text) 100%, transparent)",
      // }).to(split.words, {
      //   keyframes: [
      //     { color: brandColor, duration: 0.25 },
      //     {
      //       color: "color-mix(in srgb, var(--_theme---text) 40%, transparent)",
      //       duration: 0.35,
      //     },
      //   ],
      //   delay: 0.2,
      //   stagger: { each: 0.08 },
      // });

      gsap.set(flickerEls, { visibility: "visible" });

      return () => {
        timelines.forEach((tl) => {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
        });

        gsap.set(headings, {
          clearProps: "transform,opacity,visibility,willChange",
        });
        gsap.set(flickerEls, { clearProps: "visibility" });
      };
    });
  }

  function initServicesMobileSwiper(container) {
    queryAll(container, "[data-service='group']").forEach((group) => {
      const visualSliderEl = group.querySelector(".services_visual_slider");
      const contentSliderEl = group.querySelector(".services_content_slider");

      if (!visualSliderEl || !contentSliderEl) return;

      const visualItems = queryAll(group, "[data-visual='item']");
      const serviceItems = queryAll(group, "[data-service='item']");

      let visualSwiper;
      let contentSwiper;
      let isSyncing = false;

      const setActive = (index) => {
        visualItems.forEach((item, i) => {
          item.setAttribute("data-status", i === index ? "active" : "");
        });

        serviceItems.forEach((item, i) => {
          item.setAttribute("data-status", i === index ? "active" : "");
        });
      };

      const syncTo = (index, source) => {
        if (isSyncing) return;

        isSyncing = true;

        setActive(index);

        if (source !== "visual" && visualSwiper) {
          visualSwiper.slideTo(index);
        }

        if (source !== "content" && contentSwiper) {
          contentSwiper.slideTo(index);
        }

        isSyncing = false;
      };

      pageMatchMedia().add("(max-width: 991px)", () => {
        setActive(0);

        const getClosestIndex = (swiper) => {
          let closestIndex = swiper.activeIndex;
          let closestProgress = Infinity;

          swiper.slides.forEach((slide, index) => {
            const progress = Math.abs(slide.progress);

            if (progress < closestProgress) {
              closestProgress = progress;
              closestIndex = index;
            }
          });

          return closestIndex;
        };

        visualSwiper = new Swiper(visualSliderEl, {
          slideClass: "services_visual",
          slidesPerView: 1.2,
          speed: 600,
          centeredSlides: true,
          slideToClickedSlide: true,
          watchSlidesProgress: true,
          on: {
            sliderMove(swiper) {
              syncTo(getClosestIndex(swiper), "visual");
            },

            slideChange(swiper) {
              syncTo(swiper.realIndex, "visual");
            },
          },
        });

        contentSwiper = new Swiper(contentSliderEl, {
          slideClass: "services_item_wrap",
          slidesPerView: 1.2,
          spaceBetween: 16,
          centeredSlides: true,
          slideToClickedSlide: true,
          watchSlidesProgress: true,
          speed: 600,
          breakpoints: {
            768: {
              slidesPerView: 2.3,
              spaceBetween: 24,
            },
          },
          on: {
            sliderMove(swiper) {
              syncTo(getClosestIndex(swiper), "content");
            },

            slideChange(swiper) {
              syncTo(swiper.realIndex, "content");
            },
          },
        });

        syncTo(0);

        const clickHandlers = serviceItems.map((item, index) => {
          const handler = () => syncTo(index);
          item.addEventListener("click", handler);
          return { item, handler };
        });

        return () => {
          clickHandlers.forEach(({ item, handler }) =>
            item.removeEventListener("click", handler)
          );

          if (visualSwiper) visualSwiper.destroy(true, true);
          if (contentSwiper) contentSwiper.destroy(true, true);

          visualSwiper = null;
          contentSwiper = null;
        };
      });
    });
  }

  function initServicesDesktopScroll(container) {
    pageMatchMedia().add("(min-width: 992px)", () => {
      // Collected and returned as one function. The per-group cleanup used to be
      // returned from inside `forEach`, where nothing could receive it, so
      // matchMedia had nothing to run when the viewport dropped below 992px.
      const cleanups = [];

      queryAll(container, "[data-service='group']").forEach((group) => {
        const serviceItems = queryAll(group, "[data-content='item']");
        const visualItems = queryAll(group, "[data-visual='item']");

        // A single item makes the pin range `+=0` and the click target
        // `index / 0` (NaN) — a zero-length pinned trigger that scrub still
        // drives. Nothing to scroll through, so don't pin at all.
        if (serviceItems.length < 2 || !visualItems.length) return;

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
          end: () => `+=${window.innerHeight * (serviceItems.length - 1)}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onUpdate(self) {
            const index = Math.round(self.progress * (serviceItems.length - 1));
            setActive(index);
          },
        });

        // Tracked so crossing the breakpoint back and forth does not stack a new
        // click handler on every pass — matchMedia re-runs this whole callback.
        const clickHandlers = serviceItems.map((item, index) => {
          item.style.cursor = "pointer";

          const handler = () => {
            const totalScrollDistance = trigger.end - trigger.start;
            const targetProgress = index / (serviceItems.length - 1);

            gsap.to(window, {
              scrollTo: trigger.start + totalScrollDistance * targetProgress,
              duration: 0.8,
              ease: "power2.inOut",
              overwrite: "auto",
            });
          };

          item.addEventListener("click", handler);

          return { item, handler };
        });

        cleanups.push(() => {
          clickHandlers.forEach(({ item, handler }) => {
            item.removeEventListener("click", handler);
            item.style.cursor = "";
          });

          trigger.kill();
        });
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    });
  }

  function backToTop(container) {
    const button = container.querySelector('[data-button="to-top"]');

    if (!button) return;

    addPageListener(button, "click", () => {
      // Guarded: this used to throw outright on any page where Lenis had not
      // loaded, which aborted the rest of the init pass.
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function copyrightYear(container) {
    const year = new Date().getFullYear();

    queryAll(container, "[data-dynamic-year]").forEach((el) =>
      setText(el, year)
    );
  }

  const FILTER_SHOW_ALL = "Alle";

  function initFilterProject(container) {
    const section = container.querySelector("[data-project-wrap]");

    if (!section) return;

    const filterWrap = section.querySelector('[data-filter="list"]');
    if (!filterWrap) return;

    // Guard against a second init on the same container appending a duplicate
    // set of category buttons.
    if (filterWrap.hasAttribute("data-filter-built")) return;
    filterWrap.setAttribute("data-filter-built", "");

    // Each item's category is read once, up front. The click handler used to
    // re-query `[data-filter="category"]` inside every item on every click — a
    // full DOM query per card per filter press.
    const entries = queryAll(section, '[data-content="item"]').map((item) => {
      const categoryEl = item.querySelector('[data-filter="category"]');

      return {
        item,
        category: categoryEl ? categoryEl.textContent.trim() : "",
      };
    });

    const categories = new Set(
      entries.map((entry) => entry.category).filter(Boolean)
    );

    const fragment = document.createDocumentFragment();

    categories.forEach((category) => {
      const btn = document.createElement("button");
      btn.setAttribute("data-filter", "item");
      btn.className = "work_filter_item";

      btn.innerHTML = `<div class="work_filter_text u-text-style-small">${category}</div>`;

      fragment.appendChild(btn);
    });

    filterWrap.appendChild(fragment);

    // Scoped to the section, not the document: during a `sync: true` transition
    // both containers are in the DOM, so a document-wide query would also bind
    // handlers to the outgoing page's buttons and keep that container alive.
    const allFilterButtons = queryAll(section, '[data-filter="item"]');

    allFilterButtons.forEach((button) => {
      addPageListener(button, "click", () => {
        allFilterButtons.forEach((btn) => btn.removeAttribute("active"));

        button.setAttribute("active", "");

        const selectedFilter = button.textContent.trim();
        const showAll = selectedFilter === FILTER_SHOW_ALL;

        entries.forEach(({ item, category }) => {
          const display = showAll || category === selectedFilter ? "" : "none";

          // Only write when it actually changes — an unchanged `style.display`
          // assignment still dirties style for that element.
          if (item.style.display !== display) item.style.display = display;
        });
      });
    });
  }

  function navDropdownHandler() {
    if (navDropdownInitialized) return;
    navDropdownInitialized = true;

    const navButton = document.querySelector(".nav_button_wrap");

    // Delegated on document and bound once for the session — the nav is outside
    // the Barba container, so it is never rebuilt.
    document.addEventListener("click", (e) => {
      const link = e.target.closest(
        ".nav_mobile_menu_wrap a, .nav_dropdown_component a"
      );

      if (!link) return;

      document
        .querySelectorAll(".nav_dropdown_component")
        .forEach((dropdown) => {
          const toggle = dropdown.querySelector(".w-dropdown-toggle");
          const list = dropdown.querySelector(".w-dropdown-list");

          toggle?.classList.remove("w--open");
          list?.classList.remove("w--open");
          toggle?.setAttribute("aria-expanded", "false");

          if (toggle) {
            toggle.dispatchEvent(new Event("w-close", { bubbles: true }));
          }
        });

      if (navButton?.classList.contains("w--open")) {
        navButton.click();
      }
    });
  }

  const BLOGS_PER_LOAD = 6;

  function loadMoreBlogs(container) {
    const section = container.querySelector(".blog_wrap");

    if (!section) return;

    const items = queryAll(section, '[data-blog="item"]');
    const loadMoreBtn = section.querySelector("[data-load]");

    let visibleCount = BLOGS_PER_LOAD;

    function updateItems() {
      items.forEach((item, index) => {
        const display = index < visibleCount ? "" : "none";
        if (item.style.display !== display) item.style.display = display;
      });

      if (loadMoreBtn) {
        loadMoreBtn.style.display = visibleCount >= items.length ? "none" : "";
      }
    }

    updateItems();

    if (loadMoreBtn) {
      addPageListener(loadMoreBtn, "click", () => {
        visibleCount += BLOGS_PER_LOAD;
        updateItems();
      });
    }
  }

  // MX lookups are network round-trips, and the same handful of domains come back
  // over and over — the client's own domain, gmail.com, and whatever the visitor
  // mistyped a moment ago. Cached for the session, keyed by domain. Failures are
  // evicted so the next attempt can retry.
  const emailDomainCache = new Map();

  function lookupEmailDomain(domain) {
    const cached = emailDomainCache.get(domain);
    if (cached) return cached;

    const request = fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
      .then(async (response) => {
        const data = await response.json();
        return Boolean(response.ok && data.Answer && data.Answer.length > 0);
      })
      .catch((error) => {
        emailDomainCache.delete(domain);
        throw error;
      });

    emailDomainCache.set(domain, request);

    return request;
  }

  function formInputValidation(container) {
    const emailInputs = queryAll(container, 'input[type="email"]');
    const telInputs = queryAll(container, 'input[type="tel"]');

    function getErrorElement(input) {
      const errorElement = input.nextElementSibling;

      if (
        !errorElement ||
        errorElement.getAttribute("data-input-form") !== "error-msg"
      ) {
        console.error("Could not find error message element.", input);
        return null;
      }

      return errorElement;
    }

    function showError(message, element) {
      element.textContent = message;
      element.style.display = "block";
    }

    function hideError(element) {
      element.textContent = "";
      element.style.display = "none";
    }

    async function validateEmailDomain(domain, errorElement, isCurrent) {
      try {
        showError("Verifying domain...", errorElement);

        const hasMxRecord = await lookupEmailDomain(domain);

        // A later blur has already started its own check; that one owns the
        // message now. Without this, a slow first response could land after a
        // fast second one and overwrite a correct verdict with a stale one.
        if (!isCurrent()) return;

        if (hasMxRecord) {
          hideError(errorElement);
        } else {
          showError(
            "The email domain appears to be invalid or non-existent.",
            errorElement
          );
        }
      } catch (error) {
        console.error("Error during domain validation:", error);

        if (!isCurrent()) return;

        showError(
          "Validation failed. Please check your connection.",
          errorElement
        );
      }
    }

    function initEmailValidation() {
      emailInputs.forEach((emailInput) => {
        const errorElement = getErrorElement(emailInput);
        if (!errorElement) return;

        let latestCheck = 0;

        addPageListener(emailInput, "blur", () => {
          const email = emailInput.value.trim();

          if (!email) {
            latestCheck += 1;
            hideError(errorElement);
            return;
          }

          const emailParts = email.split("@");

          if (emailParts.length !== 2 || !emailParts[1].length) {
            latestCheck += 1;
            showError("Please enter a valid email address.", errorElement);
            return;
          }

          const check = ++latestCheck;

          validateEmailDomain(
            emailParts[1],
            errorElement,
            () => check === latestCheck
          );
        });
      });
    }

    function initTelValidation() {
      telInputs.forEach((telInput) => {
        const errorElement = getErrorElement(telInput);
        if (!errorElement) return;

        addPageListener(telInput, "input", () => {
          const originalValue = telInput.value;

          let sanitizedValue = originalValue.replace(/[^\d+]/g, "");

          if (sanitizedValue.lastIndexOf("+") > 0) {
            sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
          }

          if (originalValue !== sanitizedValue) {
            telInput.value = sanitizedValue;
          }

          if (telInput.value.length > 0 && !/^\+?\d+$/.test(telInput.value)) {
            showError(
              "Only numbers and a leading + are allowed.",
              errorElement
            );
          } else {
            hideError(errorElement);
          }
        });
      });
    }

    initEmailValidation();
    initTelValidation();
  }

  function renderRecaptcha(container) {
    const recaptchas = container.querySelectorAll(".g-recaptcha");

    if (!recaptchas.length) return;
    if (!window.grecaptcha || typeof grecaptcha.render !== "function") return;

    grecaptcha.ready(() => {
      recaptchas.forEach((el) => {
        if (el.dataset.rendered === "true") return;

        const sitekey = el.getAttribute("data-sitekey");
        if (!sitekey) return;

        try {
          grecaptcha.render(el, { sitekey });
          el.dataset.rendered = "true";
        } catch (err) {
          console.warn("[reCAPTCHA] render failed:", err);
        }
      });
    });
  }

  function initModals(container) {
    const modalSystem = ((window.lumos ??= {}).modal ??= {
      list: {},
      open(id) {
        this.list[id]?.open?.();
      },
      closeAll() {
        Object.values(this.list).forEach((m) => m.close?.());
      },
    });

    // `modalSystem.list` is global but the modals are not. Every id this page
    // registers is dropped again when the container goes, otherwise ids from
    // pages you have navigated away from keep pointing at detached <dialog>s.
    const registeredIds = [];

    onPageDestroy(() => {
      registeredIds.forEach((id) => delete modalSystem.list[id]);
    });

    queryAll(container, ".modal_dialog").forEach((modal) => {
      if (modal.dataset.scriptInitialized) return;
      modal.dataset.scriptInitialized = "true";

      const modalId = modal.getAttribute("data-modal-target");
      if (!modalId) return;

      let lastFocusedElement;

      // `typeof lenis !== "undefined"` was always true — `lenis` is declared up
      // top, and `typeof null` is "object" — so on a page where Lenis failed to
      // load this threw instead of falling back to the overflow lock.
      function lockScroll() {
        if (lenis && lenis.stop) {
          lenis.stop();
        } else {
          document.body.style.overflow = "hidden";
        }
      }

      function unlockScroll() {
        if (lenis && lenis.start) {
          lenis.start();
        } else {
          document.body.style.overflow = "";
        }
      }

      function resetModal() {
        unlockScroll();

        if (modal.open) modal.close();

        if (lastFocusedElement) lastFocusedElement.focus();

        window.dispatchEvent(
          new CustomEvent("modal-close", { detail: { modal } })
        );
      }

      if (typeof gsap !== "undefined") {
        const ctx = gsap.context(() => {
          const modalContent = modal.querySelector(".modal_content");

          const tl = gsap.timeline({
            paused: true,
            onReverseComplete: resetModal,
          });

          tl.fromTo(
            modal,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power1.out" }
          );

          if (modalContent) {
            tl.fromTo(
              modalContent,
              { y: "6rem" },
              { y: "0rem", duration: 0.3, ease: "power1.out" },
              "<"
            );
          }

          modal.tl = tl;
        }, modal);

        // The context was never disposed, so a modal left mid-open when the
        // visitor navigated kept its timeline alive.
        onPageDestroy(() => ctx.kill());
      }

      function openModal() {
        lockScroll();
        lastFocusedElement = document.activeElement;

        if (!modal.open) modal.showModal();

        if (typeof gsap !== "undefined" && modal.tl) {
          modal.tl.play(0);
        } else {
          modal.style.opacity = "1";
        }

        modal.querySelectorAll("[data-modal-scroll]").forEach((el) => {
          el.scrollTop = 0;
        });

        window.dispatchEvent(
          new CustomEvent("modal-open", { detail: { modal } })
        );
      }

      function closeModal() {
        if (typeof gsap !== "undefined" && modal.tl) {
          modal.tl.reverse();
        } else {
          resetModal();
        }
      }

      addPageListener(modal, "cancel", (e) => {
        e.preventDefault();
        closeModal();
      });

      addPageListener(modal, "click", (e) => {
        if (e.target.closest("[data-modal-close]")) {
          closeModal();
        }
      });

      modalSystem.list[modalId] = {
        open: openModal,
        close: closeModal,
      };

      registeredIds.push(modalId);
    });

    if (!document.documentElement.dataset.modalTriggerInitialized) {
      document.documentElement.dataset.modalTriggerInitialized = "true";

      document.addEventListener("click", function (e) {
        const trigger = e.target.closest("[data-modal-trigger]");
        if (!trigger) return;

        const modalId = trigger.getAttribute("data-modal-trigger");
        window.lumos?.modal?.open?.(modalId);
      });
    }
  }

  function initWorkStack(container) {
    const cards = queryAll(container, ".work-m_item_wrap");

    if (!cards.length) return;

    cards.forEach((card, i) => {
      gsap.set(card, { "--opacity": 0.7, scale: 1 });

      gsap.to(card, {
        "--opacity": 0,
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          end: "center 80%",
          scrub: true,
        },
      });

      gsap.fromTo(
        card,
        {
          y: 0,
          scale: 1,
        },
        {
          y: i * 32,
          "--opacity": 0.7,
          scale: 0.9,
          scrollTrigger: {
            trigger: card,
            start: "top 40%",
            end: "bottom 40%",
            scrub: true,
            immediateRender: false,
          },
        }
      );
    });
  }

  function initStepAnimation(container) {
    const section = container.querySelector("[data-step-wrap]") || container;
    if (!section) return;

    const textItems = section.querySelectorAll(".step_item_wrap");

    const visualItems = section.querySelectorAll(".step_visual");
    const progressBars = section.querySelectorAll(".step_item_progress");

    gsap.set(progressBars, { transformOrigin: "left center" });

    function updateCardStack(activeIndex, animate = true) {
      visualItems.forEach((card, i) => {
        let props = {};

        let baseZIndex = 50 - i;

        if (i < activeIndex) {
          props = {
            scale: 1.15,
            opacity: 0,
            rotation: 0,
            yPercent: -5,
            zIndex: baseZIndex,
          };
        } else if (i === activeIndex) {
          props = {
            scale: 1,
            opacity: 1,
            rotation: 0,
            yPercent: 0,
            zIndex: baseZIndex,
          };
        } else {
          let offset = i - activeIndex;

          if (offset === 1) {
            props = {
              scale: 0.95,
              opacity: 0.6,
              rotation: -5,
              yPercent: 4,
              zIndex: baseZIndex,
            };
          } else {
            props = {
              scale: 0.9,
              opacity: 0,
              rotation: -10,
              yPercent: 8,
              zIndex: baseZIndex,
            };
          }
        }

        if (animate) {
          gsap.to(card, {
            ...props,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          gsap.set(card, props);
        }
      });
    }

    let mm = gsap.matchMedia();

    mm.add("(min-width: 992px)", () => {
      let currentIndex = 0;
      updateCardStack(currentIndex, false);

      textItems.forEach((item, i) => {
        if (i === currentIndex) item.setAttribute("open", "");
        else item.removeAttribute("open");
      });

      let st = ScrollTrigger.create({
        trigger: section,
        start: "top 10%",
        end: "bottom bottom",
        onUpdate: (self) => {
          const totalItems = textItems.length;
          const progress = self.progress;

          let activeIndex = Math.floor(progress * totalItems);
          if (activeIndex >= totalItems) activeIndex = totalItems - 1;

          if (activeIndex !== currentIndex) {
            currentIndex = activeIndex;
            updateCardStack(activeIndex, true);

            textItems.forEach((item, i) => {
              if (i === activeIndex) {
                item.setAttribute("open", "");
              } else {
                item.removeAttribute("open");
              }
            });
          }

          let chunk = 1 / totalItems;
          textItems.forEach((barContainer, i) => {
            let itemStart = i * chunk;
            let itemEnd = (i + 1) * chunk;
            let bar = progressBars[i];

            if (progress < itemStart) {
              gsap.set(bar, { scaleX: 0 });
            } else if (progress > itemEnd) {
              gsap.set(bar, { scaleX: 1 });
            } else {
              let itemProgress = (progress - itemStart) / chunk;
              gsap.set(bar, { scaleX: itemProgress });
            }
          });
        },
      });

      const clickHandlers = [];
      textItems.forEach((item, i) => {
        const summary = item.querySelector(".step_item_head");
        const handler = (e) => {
          e.preventDefault();

          const totalItems = textItems.length;
          const targetProgress = i / totalItems + 0.005;
          const targetScroll = st.start + (st.end - st.start) * targetProgress;

          gsap.to(window, {
            scrollTo: targetScroll,
            duration: 1,
            ease: "power3.inOut",
          });
        };

        summary.addEventListener("click", handler);
        clickHandlers.push({ summary, handler });
      });

      return () => {
        st.kill();
        clickHandlers.forEach(({ summary, handler }) =>
          summary.removeEventListener("click", handler)
        );
        textItems.forEach((item) => item.removeAttribute("open"));
      };
    });

    mm.add("(max-width: 991px)", () => {
      let activeIndex = 0;
      let progressTween = null;
      let isInView = false;
      const AUTOPLAY_DURATION = 8;

      gsap.set(progressBars, { scaleX: 0 });

      let stMobile = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          isInView = true;
          if (progressTween) progressTween.resume();
        },
        onLeave: () => {
          isInView = false;
          if (progressTween) progressTween.pause();
        },
        onEnterBack: () => {
          isInView = true;
          if (progressTween) progressTween.resume();
        },
        onLeaveBack: () => {
          isInView = false;
          if (progressTween) progressTween.pause();
        },
      });

      function goToStep(index, isInit = false) {
        activeIndex = index;

        textItems.forEach((item, i) => {
          if (i === index) {
            item.setAttribute("open", "");
          } else {
            item.removeAttribute("open");
          }
        });

        updateCardStack(index, !isInit);

        if (progressTween) progressTween.kill();
        gsap.set(progressBars, { scaleX: 0 });

        progressTween = gsap.fromTo(
          progressBars[index],
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: AUTOPLAY_DURATION,
            ease: "none",
            paused: !isInView,
            onComplete: () => {
              let nextIndex = (index + 1) % textItems.length;
              goToStep(nextIndex);
            },
          }
        );
      }

      const clickHandlers = [];
      textItems.forEach((item, i) => {
        const summary = item.querySelector(".step_item_head");
        const handler = (e) => {
          e.preventDefault();
          if (activeIndex !== i) {
            goToStep(i);
          }
        };
        summary.addEventListener("click", handler);
        clickHandlers.push({ summary, handler });
      });

      goToStep(0, true);

      return () => {
        if (progressTween) progressTween.kill();
        if (stMobile) stMobile.kill();

        clickHandlers.forEach(({ summary, handler }) =>
          summary.removeEventListener("click", handler)
        );

        gsap.set(progressBars, { clearProps: "all" });
        gsap.set(visualItems, { clearProps: "all" });
        textItems.forEach((item) => item.removeAttribute("open"));
      };
    });
  }

  function initWorkSlider(container) {
    const visualItems = container.querySelectorAll(".work-f_visual");

    function updateVisuals(activeIndex) {
      visualItems.forEach((item, index) => {
        if (index === activeIndex) {
          item.setAttribute("data-status", "active");
        } else {
          item.setAttribute("data-status", "inactive");
        }
      });
    }

    const workSlider = new Swiper(".work-f_slider", {
      slideClass: "work-f_item_wrap",
      slidesPerView: 1,
      spaceBetween: 32,
      loop: true,
      speed: 600,

      navigation: {
        nextEl: '[data-button="next"]',
        prevEl: '[data-button="prev"]',
      },

      on: {
        init: function () {
          updateVisuals(this.realIndex);
        },
        slideChange: function () {
          updateVisuals(this.realIndex);
        },
      },
    });
  }

  // -----------------------------------------
  // 10 · PARKED / NOT IN USE
  // -----------------------------------------
  //
  // Kept for reference, not wired into either task list. To bring one back,
  // uncomment it and add its name to LIGHT_PAGE_TASKS or HEAVY_PAGE_TASKS in
  // section 09.

  // function initialHeroAnimation(container) {}

  // Was listed in the page tasks; the nav dropdown is populated by Webflow's own
  // CMS binding now.
  // function navLinkReference() {
  //   const source = document.querySelector('[data-collection="reference"]');
  //   const targets = document.querySelectorAll('[data-dropdown="reference"]');

  //   if (!source || !targets.length) return;

  //   const items = source.querySelectorAll('[data-collection="item"]');

  //   targets.forEach((target) => {
  //     target.innerHTML = "";

  //     items.forEach((item) => {
  //       const link = item.querySelector('[data-collection="link"]');
  //       const title = item.querySelector(".nav_dropdown_text")?.textContent;
  //       const href = link?.href;

  //       const li = document.createElement("li");
  //       li.className = "nav_dropdown_item";

  //       li.innerHTML = `
  //         <a href="${href}" class="nav_dropdown_link w-variant-23049969-09ac-2789-520b-3c6ae895bbc6 w-inline-block">
  //           <div class="nav_dropdown_text">${title}</div>
  //         </a>
  //       `;

  //       target.appendChild(li);
  //     });
  //   });
  // }

  // Superseded by the delegated listener in navDropdownHandler().
  // function navDropdownMobileHandler() {
  //   const navLinks = document.querySelectorAll(".nav_mobile_menu_wrap a");
  //   const navButton = document.querySelector(".nav_button_wrap");

  //   navLinks.forEach((link) => {
  //     link.addEventListener("click", () => {
  //       if (navButton.classList.contains("w--open")) {
  //         navButton.click();
  //       }
  //     });
  //   });
  // }

  // -----------------------------------------
  // PUBLIC SURFACE
  // -----------------------------------------
  //
  // Deliberately small. Webflow embeds and CMS-authored markup should reach the
  // site through these, not by assuming a global function exists.

  window.ZDK = {
    get lenis() {
      return lenis;
    },
    modal: () => window.lumos?.modal,
    refresh() {
      if (hasLenis && lenis) lenis.resize();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    },
  };
})();
