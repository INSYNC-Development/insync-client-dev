// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

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

// -----------------------------------------------------------------------------
// initCustomTabs(container)
// -----------------------------------------------------------------------------
// Re-attaches custom click handlers to every Webflow tab group (.w-tabs) inside
// the given container. Webflow ships its own tab logic, but those listeners
// belong to the old DOM and stop working after a Barba page swap, so we rebind
// them here. On click the handler toggles the active classes + ARIA attributes
// on the matching link/pane and updates the URL hash to the tab anchor.
// A "data-customTabInit" flag is set on each link so the handler is never
// bound twice when the same page is re-entered.
// To target different markup, change the ".w-tabs" / ".w-tab-link" /
// ".w-tab-pane" selectors below (these are Webflow's defaults).
function initCustomTabs(container = document) {
  const tabGroups = container.querySelectorAll(".w-tabs");

  tabGroups.forEach((tabsWrap) => {
    const links = tabsWrap.querySelectorAll(".w-tab-link");
    const panes = tabsWrap.querySelectorAll(".w-tab-pane");

    links.forEach((link, index) => {
      const pane = panes[index];
      if (!pane) return;

      // Prevent duplicate listeners after Barba transitions
      if (link.dataset.customTabInit === "true") return;
      link.dataset.customTabInit = "true";

      link.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        links.forEach((item) => {
          item.classList.remove("w--current");
          item.setAttribute("aria-selected", "false");
          item.setAttribute("tabindex", "-1");
        });

        panes.forEach((item) => {
          item.classList.remove("w--tab-active");
          item.style.opacity = "";
          item.style.display = "";
        });

        link.classList.add("w--current");
        link.setAttribute("aria-selected", "true");
        link.setAttribute("tabindex", "0");

        pane.classList.add("w--tab-active");

        const href = link.getAttribute("href");
        if (href) {
          history.replaceState(null, "", href);
        }
      });
    });
  });
}

// -----------------------------------------------------------------------------
// reinitWebflowComponents(container)
// -----------------------------------------------------------------------------
// After Barba swaps the page DOM, Webflow's own systems (Interactions/IX2,
// Lottie players, tab redraw) need to be kicked off again on the new
// container — otherwise scroll triggers and hover animations silently die.
// This calls Webflow.destroy() then ready() to reset internal state, re-inits
// IX2 and Lottie, and on the next animation frame repairs the tab ARIA markup
// and rebinds our custom tab handlers. Run this exactly once per page enter.
function reinitWebflowComponents(container) {
  if (!window.Webflow) return;

  window.Webflow.destroy();
  window.Webflow.ready();

  const ix2 = window.Webflow.require("ix2");
  if (ix2) ix2.init();

  const lottie = window.Webflow.require("lottie");
  if (lottie) lottie.init();

  requestAnimationFrame(() => {
    repairWebflowTabs(container);

    const tabs = window.Webflow.require("tabs");
    if (tabs) tabs.redraw();

    initCustomTabs(nextPage);
  });
}

// -----------------------------------------------------------------------------
// repairWebflowTabs(container)
// -----------------------------------------------------------------------------
// After Barba swaps DOM, Webflow's auto-generated tab IDs and ARIA wiring are
// stale (IDs collide between old/new containers or get lost entirely). This
// rewrites every tab inside every ".w-tabs" group with a fresh ID, matching
// aria-controls / aria-labelledby on the corresponding pane, and resets role
// + aria-selected + tabindex so the tabs are accessible again.
// Called automatically from reinitWebflowComponents() — you normally don't
// need to call this directly.
function repairWebflowTabs(container) {
  const tabsWraps = container.querySelectorAll(".w-tabs");

  tabsWraps.forEach((tabsWrap, tabsIndex) => {
    const links = tabsWrap.querySelectorAll(".w-tab-link");
    const panes = tabsWrap.querySelectorAll(".w-tab-pane");

    const menu = tabsWrap.querySelector(".w-tab-menu");
    if (menu) {
      menu.setAttribute("role", "tablist");
    }

    links.forEach((link, index) => {
      const pane = panes[index];
      if (!pane) return;

      const tabId = `w-tabs-${tabsIndex}-data-w-tab-${index}`;
      const paneId = `w-tabs-${tabsIndex}-data-w-pane-${index}`;

      link.id = tabId;
      link.href = `#${paneId}`;
      link.setAttribute("role", "tab");
      link.setAttribute("aria-controls", paneId);

      pane.id = paneId;
      pane.setAttribute("role", "tabpanel");
      pane.setAttribute("aria-labelledby", tabId);

      const isCurrent = link.classList.contains("w--current");

      link.setAttribute("aria-selected", isCurrent ? "true" : "false");
      link.setAttribute("tabindex", isCurrent ? "0" : "-1");
    });
  });
}

// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------
//
// Three init phases driven by the Barba lifecycle. Decide where new inits
// belong based on WHEN they need to run:
//   - initOnceFunctions()        runs ONCE per browser session (first load).
//                                Put truly global setup here (e.g. Lenis).
//                                Re-entering the same page will NOT re-run it.
//   - initBeforeEnterFunctions() runs before the new page becomes visible.
//                                Use for setup that must happen while the
//                                page is still hidden (e.g. pre-scaling the
//                                hero so the entrance animation lands right).
//   - initAfterEnterFunctions()  runs after the new page is visible. This is
//                                where per-page code is dispatched from
//                                initfunction() at the bottom of this file.
// Rule of thumb: new per-page inits go inside initfunction(), NOT here.
function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  prepareHeroScale(nextPage);
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
  reinitWebflowComponents(nextPage);

  initfunction(nextPage);
}

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------
//
// Default "slide-up panel" transition used for the routes listed in
// `allowedSlugs` further down (Barba init). Any route NOT in that list falls
// back to the simpler fade transition in the next section.
//
// Barba calls these three functions in order:
//   runPageOnceAnimation   first load only; just resets scroll + inline styles.
//   runPageLeaveAnimation  old page slides up to -15vh while the panel rises
//                          and the "next page name" label fades in.
//   runPageEnterAnimation  new page rises from +15vh, panel slides off the
//                          top of the screen, label fades out. Returns a
//                          Promise that resolves once the page is settled.
//
// If you tweak duration values, keep the leave timing (0.8s) and the enter
// pre-roll (1.25s) in sync — they're tuned to meet in the middle.
// If reduced-motion is enabled (OS-level a11y setting), all three functions
// short-circuit to instant swaps.
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
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector(
    "[data-transition-panel]"
  );
  const transitionLabel = transitionWrap.querySelector(
    "[data-transition-label]"
  );
  const transitionLabelText = transitionWrap.querySelector(
    "[data-transition-label-text]"
  );

  const nextPageName = next.getAttribute("data-page-name");
  transitionLabelText.innerText = nextPageName || "FRAMEN";

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(
    transitionPanel,
    {
      autoAlpha: 1,
    },
    0
  );

  tl.set(
    next,
    {
      autoAlpha: 0,
    },
    0
  );

  tl.fromTo(
    transitionPanel,
    {
      yPercent: 0,
    },
    {
      yPercent: -100,
      duration: 0.8,
    },
    0
  );

  tl.fromTo(
    transitionLabel,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
    },
    "<+=0.2"
  );

  tl.fromTo(
    current,
    {
      y: "0vh",
    },
    {
      y: "-15vh",
      duration: 0.8,
    },
    0
  );
}

function runPageEnterAnimation(next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector(
    "[data-transition-panel]"
  );
  const transitionLabel = transitionWrap.querySelector(
    "[data-transition-label]"
  );
  const transitionLabelText = transitionWrap.querySelector(
    "[data-transition-label-text]"
  );

  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1.25);

  tl.set(
    next,
    {
      autoAlpha: 1,
    },
    "startEnter"
  );

  tl.fromTo(
    transitionPanel,
    {
      yPercent: -100,
    },
    {
      yPercent: -200,
      duration: 1,
      overwrite: "auto",
      immediateRender: false,
    },
    "startEnter"
  );

  tl.set(
    transitionPanel,
    {
      autoAlpha: 0,
    },
    ">"
  );

  tl.fromTo(
    transitionLabel,
    {
      autoAlpha: 1,
    },
    {
      autoAlpha: 0,
      duration: 0.4,
      overwrite: "auto",
      immediateRender: false,
    },
    "startEnter+=0.1"
  );

  tl.from(
    next,
    {
      y: "15vh",
      duration: 1,
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
// PAGE TRANSITIONS FADE
// -----------------------------------------
//
// Fallback transition for any route NOT in `allowedSlugs`. Simpler than the
// slide-up panel: the old page fades out, the new page fades in, and the H1
// of the new page pops in with a slight upward motion. Same three-phase API
// as the default transition above (once / leave / enter). Use this style when
// adding pages that don't need the branded panel effect.
function runPageOnceAnimationFade(next) {
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

function runPageLeaveAnimationFade(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(
    current,
    {
      autoAlpha: 0,
      ease: "power1.in",
      duration: 0.5,
    },
    0
  );

  return tl;
}

function runPageEnterAnimationFade(next) {
  const tl = gsap.timeline();
  const heading = next.querySelector("h1");

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.fromTo(
    next,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
      ease: "power1.inOut",
      duration: 0.75,
    },
    "startEnter"
  );

  if (heading) {
    tl.fromTo(
      heading,
      {
        yPercent: 25,
        autoAlpha: 0,
      },
      {
        yPercent: 0,
        autoAlpha: 1,
        ease: "expo.out",
        duration: 1,
      },
      "< 0.3"
    );
  }

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------
//
// These hooks fire on EVERY page transition regardless of which transition
// variant (slide-up or fade) runs. They handle the cross-cutting concerns
// that aren't part of the visual animation itself:
//   beforeEnter  pins the new container on top with fixed positioning so it
//                can sit over the outgoing one, pauses Lenis, runs the
//                "before enter" inits, applies the page theme (light/dark)
//                from the next container's data-page-theme attribute.
//   afterLeave   kills every active GSAP ScrollTrigger so they don't leak
//                references to the destroyed DOM.
//   enter        syncs the nav menu's active state to the new page (the nav
//                lives outside Barba's container, so it isn't replaced).
//   afterEnter   runs the "after enter" inits (i.e. all per-page code via
//                initfunction()), then resizes Lenis and refreshes
//                ScrollTrigger so measurements reflect the new layout.
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

// -----------------------------------------------------------------------------
// allowedSlugs + barba.init
// -----------------------------------------------------------------------------
// `allowedSlugs` is the whitelist of routes that get the branded slide-up
// panel transition. Add new paths here when you want that transition on them.
// Trailing slash matters: "/screens/" matches any subroute like /screens/abc;
// without a trailing slash the match is exact (e.g. "/pricing" matches only
// /pricing). The root "/" is special-cased to exact-match only — otherwise
// it would match every URL.
//
// barba.init configures:
//   - debug:           leave true while iterating, turn off in production.
//   - timeout:         max ms Barba waits for a transition before bailing.
//   - prevent:         skips Barba on links flagged with data-barba-prevent
//                      and on Webflow tab links (so tab clicks don't trigger
//                      a full page transition).
//   - transitions[0]:  the slide-up panel; gated by `custom` returning true
//                      only when the target slug is in allowedSlugs.
//   - transitions[1]:  the fade fallback, used for everything else.
const allowedSlugs = [
  "/", // The home page (exact match)
  "/venues",
  "/advertising",
  "/screens/",
  "/pricing",
];

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  prevent: ({ el }) => {
    // 1. Ignore anything with data-barba-prevent
    if (el.hasAttribute("data-barba-prevent")) return true;
    if (el.closest("[data-barba-prevent]")) return true;

    // 2. Explicitly ignore Webflow tab links
    if (el.classList.contains("w-tab-link")) return true;
    if (el.closest(".w-tab-link")) return true;

    return false;
  },
  transitions: [
    {
      name: "animated-transition", // Changed from "default" just to be clear
      sync: true,
      custom: ({ next }) => {
        // You can use Barba's built-in path parser, it's cleaner!
        const nextSlug = next.url.path;

        return allowedSlugs.some((slug) => {
          // THE FIX: Ensure we aren't accidentally treating the root "/" as a wildcard
          if (slug !== "/" && slug.endsWith("/")) {
            return nextSlug.startsWith(slug);
          }
          // Exact match for everything else (including "/")
          return nextSlug === slug;
        });
      },

      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(
          data.current.container,
          data.next.container
        );
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },

    // 2. THE INSTANT TRANSITION (The default fallback for everything else)
    {
      name: "instant-default",
      sync: true,
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },
      // Barba knows this is instant because we don't return a Promise
      async leave(data) {
        return runPageLeaveAnimationFade(
          data.current.container,
          data.next.container
        );
      },
      async enter(data) {
        return runPageEnterAnimationFade(data.next.container);
      },
    },
  ],
});

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

// -----------------------------------------------------------------------------
// themeConfig + applyThemeFrom(container)
// -----------------------------------------------------------------------------
// The site supports light and dark page themes. Each page declares its theme
// via `data-page-theme="light|dark"` on its top-level container.
// applyThemeFrom() reads that attribute and propagates the matching theme
// tokens to three places: the <body> (data-page-theme), the nav element
// (data-theme-nav), and the transition overlay (data-theme-transition).
// CSS then targets those data attributes to swap colors.
// To add a new theme: add an entry to themeConfig and define matching CSS
// rules for the new data-page-theme value.
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

// -----------------------------------------------------------------------------
// initLenis()
// -----------------------------------------------------------------------------
// Sets up Lenis smooth-scrolling. ONE instance, shared across the whole site.
// Called once from initOnceFunctions(). Tuning knobs:
//   - lerp:            how soft the scroll feels (lower = smoother + slower,
//                      higher = snappier). 0.165 is the current default.
//   - wheelMultiplier: scales mousewheel speed. Bump up for faster scroll.
// If ScrollTrigger is loaded, Lenis's scroll event is piped into it so all
// GSAP scroll triggers stay in sync with the smooth scroll.
// Do NOT call this more than once — the early return guards against that.
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

// -----------------------------------------------------------------------------
// resetPage(container)
// -----------------------------------------------------------------------------
// Called at the end of every page transition. Scrolls back to the top, clears
// the fixed-positioning inline styles that beforeEnter set, and restarts
// Lenis. If a page lands scrolled to the wrong position or stays stuck under
// the nav, the bug is usually here or in Lenis timing.
function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

// -----------------------------------------------------------------------------
// debounceOnWidthChange(fn, ms)
// -----------------------------------------------------------------------------
// Utility: returns a debounced version of `fn` that only fires if the viewport
// WIDTH actually changed during the debounce window. Used to skip pointless
// layout re-inits on iOS Safari's vertical-only resize events (when the URL
// bar shows/hides). Wrap any function that recomputes layout (swiper re-init,
// scroll position recalc, etc.) with this to avoid jank on mobile.
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

// -----------------------------------------------------------------------------
// initBarbaNavUpdate(data)
// -----------------------------------------------------------------------------
// Keeps the nav menu's "current page" indicator in sync during Barba swaps.
// The nav element lives OUTSIDE Barba's container, so it isn't replaced when
// pages swap — meaning aria-current and the active class would otherwise
// stay frozen on the previous link. This function reads the incoming page's
// HTML, finds every nav item flagged with `data-barba-update`, and copies
// the aria-current + class list onto the matching live nav element.
//
// Markup contract: every nav item that should sync needs `data-barba-update`
// on BOTH the current DOM and the matching item in the new page's HTML.
// Items are paired by index, so the order must match between pages.
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

// ==========================================
// FUNCTIONS
// ==========================================

/* ─────────────────────────────────────────
                Number Odometer
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initNumberOdometer(container)
// -----------------------------------------------------------------------------
// Builds a slot-machine-style "rolling number" animation for any element
// inside a [data-odometer-group]. When the group scrolls into view, each
// number animates from its start value (or 0) up to the final number shown
// in the text content, rolling each digit independently like an old odometer.
//
// MARKUP CONTRACT (set these in Webflow):
//   [data-odometer-group]                       wraps a set of numbers that
//                                               should animate together.
//   [data-odometer-element]                     the actual number text node.
//   [data-odometer-start="42"]    (optional)    start value (default 0).
//   [data-odometer-duration="3"]  (optional)    roll duration per element.
//   [data-odometer-grow="true|false"] (opt.)    reveal new digits as it grows.
//   [data-odometer-stagger="0.1"]   (optional)  delay between elements.
//   [data-odometer-stagger-order]   (optional)  "left" | "right" | "random".
//   [data-odometer-trigger-start]   (optional)  ScrollTrigger start (default "top 80%").
//
// TUNING — change inside the `defaults` object below:
//   duration         seconds per number to roll
//   elementStagger   delay between adjacent numbers in a group
//   digitStagger     delay between adjacent digits within a number
//   digitCycles      how many times each digit cycles 0-9 before landing
//   triggerStart     where in viewport the animation starts
//
// RETURNS: a programmatic `updateOdometer(el, newText)` function — call it
// later to re-animate the same element to a new number without re-scrolling.
//
// Respects prefers-reduced-motion (skips animation entirely).
function initNumberOdometer(container) {
  const groups = container.querySelectorAll("[data-odometer-group]");
  if (!groups.length) return; // Early return if no odometers found

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
  groups.forEach((group) => {
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
    container.querySelectorAll("[data-odometer-element]").forEach((el) => {
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

/* ─────────────────────────────────────────
   Main Hero Video Control
   Works with Barba
───────────────────────────────────────── */

// -----------------------------------------------------------------------------
// initMainHeroVideoControl(container)
// -----------------------------------------------------------------------------
// Wires up the custom play/pause toggle for the homepage's main hero video.
// Behaviour:
//   1. Mirrors the play/pause icon to the video's real state, even if play
//      state changes from somewhere else (autoplay, end of clip, etc.) —
//      hooks into the native "play" and "pause" events for reliability.
//   2. The button click manually toggles the video.
//   3. Tries to autoplay 100ms after init. If the browser blocks autoplay
//      (Safari iOS, etc.), it falls back to playing on the FIRST user
//      interaction anywhere in the container (touch or click).
//
// MARKUP CONTRACT:
//   .main_hero_visual_video > video       the video element itself.
//   [data-main-hero="control-btn"]        the toggle wrapper (catches clicks).
//   .button_toggle_play / .button_toggle_pause   the two icon states.
//
// To target a different hero or icon set, change the four selectors above.
function initMainHeroVideoControl(container) {
  const video = container.querySelector(".main_hero_visual_video video");
  // Listening on the wrapper is safer to catch all clicks inside the button area
  const toggleWrap = container.querySelector("[data-main-hero='control-btn']");
  if (!video || !toggleWrap) return;

  const playIcon = toggleWrap.querySelector(".button_toggle_play");
  const pauseIcon = toggleWrap.querySelector(".button_toggle_pause");

  // 1. Helper to sync UI perfectly with the video's TRUE state
  const updateUI = () => {
    if (!playIcon || !pauseIcon) return;

    if (video.paused) {
      // Video is paused: Show Play, hide Pause
      playIcon.style.opacity = "1";
      pauseIcon.style.opacity = "0";
    } else {
      // Video is playing: Hide Play, show Pause
      playIcon.style.opacity = "0";
      pauseIcon.style.opacity = "1";
    }
  };

  // 2. Sync immediately on load to prevent initial desync
  updateUI();

  // 3. Listen to native events (this guarantees UI is always correct)
  video.addEventListener("play", updateUI);
  video.addEventListener("pause", updateUI);

  // 4. Handle custom Play/Pause button click
  let userInteracted = false; // Flag to track if user took manual control

  toggleWrap.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    userInteracted = true; // Mark that user explicitly clicked the control

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  // 5. Attempt Autoplay
  setTimeout(() => {
    // If the user already clicked the button before this timeout finished,
    // OR if the video is already successfully playing, do not force another play command.
    if (userInteracted || !video.paused) return;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Success! Native 'play' event listener will update the UI.
        })
        .catch((error) => {
          console.warn("Autoplay prevented, waiting for interaction.");

          const handleFallbackPlay = (e) => {
            // Prevent conflict: If the user is clicking the actual toggle button,
            // ignore this fallback so it doesn't double-fire.
            if (toggleWrap.contains(e.target)) return;

            video.play();

            // Clean up listeners so this only runs once
            container.removeEventListener("touchstart", handleFallbackPlay);
            container.removeEventListener("click", handleFallbackPlay);
          };

          container.addEventListener("touchstart", handleFallbackPlay, {
            once: true,
          });
          container.addEventListener("click", handleFallbackPlay, {
            once: true,
          });
        });
    }
  }, 100);
}

// -----------------------------------------------------------------------------
// initStartVideoControl(container)
// -----------------------------------------------------------------------------
// Same play/pause + autoplay-with-fallback logic as initMainHeroVideoControl,
// but targeted at the "start" section video (the second hero further down
// the page). The two functions are intentionally kept separate so each can
// be tuned independently if needed — they use different markup attributes:
//   [data-start-el="video"] > video       the video element.
//   [data-start-el="control-btn"]         the toggle wrapper.
// If both videos should ever behave identically, this can be refactored into
// a single function that takes a selector prefix.
function initStartVideoControl(container) {
  const video = container.querySelector("[data-start-el='video'] video");
  // Listening on the wrapper is safer to catch all clicks inside the button area
  const toggleWrap = container.querySelector("[data-start-el='control-btn']");
  if (!video || !toggleWrap) return;

  const playIcon = toggleWrap.querySelector(".button_toggle_play");
  const pauseIcon = toggleWrap.querySelector(".button_toggle_pause");

  // 1. Helper to sync UI perfectly with the video's TRUE state
  const updateUI = () => {
    if (!playIcon || !pauseIcon) return;

    if (video.paused) {
      // Video is paused: Show Play, hide Pause
      playIcon.style.opacity = "1";
      pauseIcon.style.opacity = "0";
    } else {
      // Video is playing: Hide Play, show Pause
      playIcon.style.opacity = "0";
      pauseIcon.style.opacity = "1";
    }
  };

  // 2. Sync immediately on load to prevent initial desync
  updateUI();

  // 3. Listen to native events (this guarantees UI is always correct)
  video.addEventListener("play", updateUI);
  video.addEventListener("pause", updateUI);

  // 4. Handle custom Play/Pause button click
  let userInteracted = false; // Flag to track if user took manual control

  toggleWrap.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    userInteracted = true; // Mark that user explicitly clicked the control

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  // 5. Attempt Autoplay
  setTimeout(() => {
    // If the user already clicked the button before this timeout finished,
    // OR if the video is already successfully playing, do not force another play command.
    if (userInteracted || !video.paused) return;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Success! Native 'play' event listener will update the UI.
        })
        .catch((error) => {
          console.warn("Autoplay prevented, waiting for interaction.");

          const handleFallbackPlay = (e) => {
            // Prevent conflict: If the user is clicking the actual toggle button,
            // ignore this fallback so it doesn't double-fire.
            if (toggleWrap.contains(e.target)) return;

            video.play();

            // Clean up listeners so this only runs once
            container.removeEventListener("touchstart", handleFallbackPlay);
            container.removeEventListener("click", handleFallbackPlay);
          };

          container.addEventListener("touchstart", handleFallbackPlay, {
            once: true,
          });
          container.addEventListener("click", handleFallbackPlay, {
            once: true,
          });
        });
    }
  }, 100);
}

// -----------------------------------------
// HERO PREPARATION HELPERS
// -----------------------------------------
//
// The hero video starts the page scaled UP and centered, then scrolls down
// into its natural 1:1 size as the user scrolls (see initHeroAnimation
// further below). To avoid a visible "pop" on page load, the scaling has to
// be applied BEFORE the page becomes visible — that's what prepareHeroScale
// does (called from initBeforeEnterFunctions).
//
// The four helpers below compute the right scale + Y offset to make the hero
// behave like `background-size: cover`, then build the CSS matrix() value:
//   getCoverScale(el)   how much to scale so the element covers the viewport.
//                       The multipliers (1.6 on mobile, 1.3 on desktop) are
//                       tuned by eye — change these if the scaled hero looks
//                       too small or too large at any breakpoint.
//   getHeroMatrixY(el)  the vertical offset to keep the scaled hero centered.
//                       Tweak the formula here if the hero starts too high or
//                       too low on first paint.
//   getHeroMatrix(...)  formats the scale + Y into a CSS matrix() transform.
//   prepareHeroScale()  applies the initial transform + opacity to the hero
//                       container BEFORE it becomes visible.
function getCoverScale(el) {
  if (!el) return 1;

  const w = el.offsetWidth || window.innerWidth;
  const h = el.offsetHeight || window.innerHeight;

  const scaleX = window.innerWidth / w;
  const scaleY = window.innerHeight / h;

  if (w <= 767) {
    return Math.max(scaleX, scaleY) * 1.6;
  } else if (w >= 768 && w <= 2000) {
    return Math.max(scaleX, scaleY) * 1.3;
  } else {
    return Math.max(scaleX, scaleY) * 1.6;
  }
}

/* Optional: change this formula if you want a different starting Y offset */
function getHeroMatrixY(el) {
  if (!el) return 0;

  const scale = getCoverScale(el);
  const h = el.offsetHeight || window.innerHeight;

  // This compensates for visual center shift when scaled.
  // Positive value moves the hero down.
  return (h * scale - h) / 2;
}

function getHeroMatrix(el, scale, y) {
  return `matrix(${scale}, 0, 0, ${scale}, 0, ${y})`;
}

/* Pre-scales the hero BEFORE the page becomes visible */
function prepareHeroScale(container) {
  const scaleContainer = container.querySelector(".main_hero_scale_container");
  const heroSection = container.querySelector(".main_hero_section");
  const introSection = container.querySelector(".main_hero_intro");

  if (!scaleContainer || !heroSection || !introSection) return;

  const startScale = getCoverScale(scaleContainer);
  const startY = getHeroMatrixY(scaleContainer);

  gsap.set(scaleContainer, {
    transform: getHeroMatrix(scaleContainer, startScale, startY),
    transformOrigin: "50% 100%",
  });

  gsap.set(heroSection, { opacity: 1, filter: "blur(0px)" });
  gsap.set(introSection, { opacity: 0 });
}

/* ─────────────────────────────────────────
                Hero Animation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initHeroAnimation(container)
// -----------------------------------------------------------------------------
// The main hero scroll animation on the homepage. As the user scrolls down
// the page, this scrubs through a GSAP timeline that:
//   1. Fades + blurs out the hero foreground content.
//   2. Collapses the blur layer's height to 0.
//   3. Scales the hero video from "cover" size back down to its natural 1:1
//      (using the matrix computed by the hero preparation helpers above).
//   4. Fades the CTA button group out at 20% into the scale.
//   5. Fades the intro section in at the 50% mark of the scrub.
// When the timeline completes it triggers initStartAnimation() to wire up
// the second hero section below.
//
// MARKUP CONTRACT (Webflow class names):
//   .main_hero_wrap                  ScrollTrigger anchor.
//   .main_hero_scale_container       element that gets scaled / matrix-transformed.
//   .main_hero_section               foreground that fades+blurs out.
//   .main_hero_intro                 intro that fades in.
//   .main_hero_blur_wrap             blur layer that collapses.
//   .main_hero_btn_wrap              CTA button group that fades out.
//
// TUNING:
//   scrub: 1.2          how much "smoothing" the scrub has (lower = snappier).
//   duration: 0.7       proportional speed of the scale phase (relative to scrub).
//   "power2.in/inOut"   easing per phase — swap for any GSAP ease.
function initHeroAnimation(container) {
  const section = container.querySelector(".main_hero_wrap");
  const scaleContainer = container.querySelector(".main_hero_scale_container");
  const heroSection = container.querySelector(".main_hero_section");
  const introSection = container.querySelector(".main_hero_intro");
  const blur = container.querySelector(".main_hero_blur_wrap");
  const buttonWrap = container.querySelector(".main_hero_btn_wrap");

  if (!section || !scaleContainer || !heroSection || !introSection) return;

  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 0%",
      end: "bottom bottom",
      scrub: 1.2,
      invalidateOnRefresh: true,
    },
    onComplete: () => {
      ScrollTrigger.refresh();
      initStartAnimation(container);
    },
  });

  tl.to(
    heroSection,
    {
      opacity: 0,
      filter: "blur(12px)",
      ease: "power2.in",
      duration: 0.075,
    },
    0
  );

  if (blur) {
    tl.to(blur, { height: 0, duration: 0.075 }, 0);
  }

  tl.fromTo(
    scaleContainer,
    {
      transform: () => {
        const startScale = getCoverScale(scaleContainer);
        const startY = getHeroMatrixY(scaleContainer);

        return getHeroMatrix(scaleContainer, startScale, startY);
      },
    },
    {
      transform: "matrix(1, 0, 0, 1, 0, 0)",
      ease: "power2.inOut",
      duration: 0.7,
    },
    0
  ).to(
    buttonWrap,
    {
      opacity: 0,
      duration: 0.2,
    },
    "<+=20%"
  );

  tl.to(
    introSection,
    {
      opacity: 1,
      ease: "power2.inOut",
      duration: 0.3,
    },
    0.5
  );

  return () => {
    gsap.set([scaleContainer, heroSection, introSection, blur], {
      clearProps: "all",
    });
  };
}

/* ─────────────────────────────────────────
                Start Animation
   ───────────────────────────────────────── */
//  This function is called after the hero animation completed to fix the issue on load when the hero animation scaling
// -----------------------------------------------------------------------------
// initStartAnimation(container)
// -----------------------------------------------------------------------------
// Sister to initHeroAnimation, but for the SECOND hero section ("start"
// section, lower on the page). Triggered automatically by initHeroAnimation's
// onComplete so the ScrollTrigger only registers once the main hero is done
// (avoiding measurement bugs from the first hero's transform).
//
// Same scrub-scale-fade pattern as the main hero, but uses gsap.matchMedia
// so the trigger start point can differ between mobile (top top+=15%) and
// desktop (top top-=10%). Reduced-motion users get no animation.
//
// MARKUP CONTRACT:
//   .start_wrap                ScrollTrigger anchor.
//   .start_scale_container     element that gets scaled.
//   .start_section             foreground that fades+blurs out.
//   .start_intro               intro that fades in.
//   .start_blur_wrap           blur layer that collapses.
//   .start_btn_wrap            CTA button group that fades out.
//
// TUNING:
//   breakPoint: 768            mobile/desktop split.
//   start "top top+=15%"       trigger start on mobile.
//   start "top top-=10%"       trigger start on desktop.
function initStartAnimation(container) {
  const section = container.querySelector(".start_wrap");
  const scaleContainer = container.querySelector(".start_scale_container");
  const heroSection = container.querySelector(".start_section");
  const introSection = container.querySelector(".start_intro");
  const blur = container.querySelector(".start_blur_wrap");
  const buttonWrap = container.querySelector(".start_btn_wrap");
  const breakPoint = 768;

  // Early return if missing elements
  if (!section || !scaleContainer || !heroSection || !introSection) return;

  gsap.registerPlugin(ScrollTrigger);

  let mm = gsap.matchMedia();

  // Run only between 768px and 2000px
  mm.add(
    {
      // set up any number of arbitrarily-named conditions. The function below will be called when ANY of them match.
      isDesktop: `(min-width: ${breakPoint}px)`,
      isMobile: `(max-width: ${breakPoint - 1}px)`,
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      // context.conditions has a boolean property for each condition defined above indicating if it's matched or not.
      let { isDesktop, isMobile, reduceMotion } = context.conditions;
      const startScale = getCoverScale(scaleContainer);
      /* — Initial states — */
      gsap.set(scaleContainer, {
        scale: startScale,
        transformOrigin: "50% 50%",
      });

      gsap.set(heroSection, { opacity: 1, filter: "blur(0px)" });
      gsap.set(introSection, { opacity: 0 });

      ScrollTrigger.refresh();
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: isDesktop ? "top top-=10%" : "top top+=15%",
          end: "bottom bottom",
          scrub: 1.2,
          // markers: true,
          invalidateOnRefresh: true,
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
      );

      if (blur) {
        tl.to(blur, { height: 0 }, 0);
      }

      tl.fromTo(
        scaleContainer,
        {
          scale: () => getCoverScale(scaleContainer),
        },
        {
          scale: 1,
          ease: "power2.inOut",
          duration: 0.9,
        },
        0
      ).to(
        buttonWrap,
        {
          opacity: 0,
          duration: 0.2,
        },
        "<"
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

      return () => {
        gsap.set([scaleContainer, heroSection, introSection, blur], {
          clearProps: "all",
        });
      };
    }
  );
}

/* ─────────────────────────────────────────
                Video Animation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initVideoAnimation(container)
// -----------------------------------------------------------------------------
// Generic "play video when it appears" handler. Used for inline videos
// scattered through the site (case studies, feature highlights, etc.) that
// should NOT autoplay on page load but should start when scrolled into view
// or hovered.
//
// MARKUP CONTRACT:
//   [data-video-anim-trigger]                       wraps each video tile.
//   [data-video-animation="loop|scroll|scroll-hover"]   set on the <video>
//                                                   element itself; picks
//                                                   the behaviour:
//     "loop"          starts immediately and loops forever (background videos).
//     "scroll"        plays ONCE when the tile enters the viewport (top 80%).
//     "scroll-hover"  same as "scroll" + also restarts on mouseenter.
//
// All variants reset currentTime to 0 before playing so the video always
// starts from frame 0, no matter how the page was navigated to.
function initVideoAnimation(container) {
  const processItems = container.querySelectorAll("[data-video-anim-trigger]");
  if (!processItems.length) return; // Early return if no video items found

  gsap.registerPlugin(ScrollTrigger);

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
}

/* ─────────────────────────────────────────
                Telephone Validation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initTelephoneValidation(container)
// -----------------------------------------------------------------------------
// Live-cleans every <input type="tel"> in the container as the user types:
// strips anything that isn't a digit, allows a single leading "+" for the
// country code, and shows an inline error message if forbidden characters
// were entered. The error message slot is expected to be the input's NEXT
// sibling and must carry `data-input-form="error-msg"` — if it's missing
// the input is skipped and a console error is logged.
function initTelephoneValidation(container) {
  const telInputs = container.querySelectorAll('input[type="tel"]');
  if (!telInputs.length) return; // Early return if no telephone fields

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
      if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
        showError("Only numbers and a leading + are allowed.", errorMsgElement);
      } else {
        hideError(errorMsgElement);
      }
    });

    // Helper functions to show/hide errors
    function showError(message, element) {
      element.textContent = message;
      element.style.display = "block";
    }

    function hideError(element) {
      element.style.display = "none";
    }
  });
}

/* ─────────────────────────────────────────
                Email Validation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initEmailValidation(container)
// -----------------------------------------------------------------------------
// Validates every <input type="email"> in two phases:
//   1. Shape check on blur: ensures the value contains exactly one "@" with
//      something on each side. If not, shows an inline error.
//   2. Domain MX-record check via Google's public DNS-over-HTTPS endpoint
//      (https://dns.google/resolve). If the domain has no MX records (i.e.
//      nobody can actually receive mail there), the error message says so.
//
// Same error-slot contract as initTelephoneValidation: the input's next
// sibling must carry `data-input-form="error-msg"`.
//
// NOTE: the validation is on BLUR, not on input — users won't see errors
// while still typing. If you change the API endpoint above, make sure the
// response shape still has `data.Answer` for the success check to work.
function initEmailValidation(container) {
  const emailInputs = container.querySelectorAll('input[type="email"]');
  if (!emailInputs.length) return; // Early return if no email fields

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
}

/* ─────────────────────────────────────────
                Line Animation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initLineAnimation(container)
// -----------------------------------------------------------------------------
// Reveals horizontal divider lines by scaling them from 0% to 100% width
// once they scroll into view (top 90%). Targets any element flagged with
// `data-element="horizontal-line"`. Duration is 2s using the custom "osmo"
// ease defined at the top of this file.
function initLineAnimation(container) {
  const lines = container.querySelectorAll("[data-element='horizontal-line']");
  if (!lines.length) return; // Early return if no lines found

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
}

/* ─────────────────────────────────────────
                Split Text Animation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initSplitTextAnimation(container)
// -----------------------------------------------------------------------------
// The "brand color sweep" headline effect. Each character of an element
// flagged with `data-text-animation="split-text"` gets split into its own
// <span>, then scroll-scrubbed through three color states:
//   start  faded-out version of the final color (20% opacity blend).
//   mid    the brand color from CSS variable --swatch--brand-500.
//   end    the original text color (preserves <strong> color overrides).
//
// Uses GSAP's SplitText plugin. The character stagger is 0.05s; the scrub is
// linear (ease: "none") between start at "top 80%" and end at "bottom 60%"
// of the trigger element.
//
// To change the mid color: edit the CSS custom property --swatch--brand-500.
// To change the timing curve: replace ease/start/end in the ScrollTrigger.
function initSplitTextAnimation(container) {
  const targets = container.querySelectorAll(
    '[data-text-animation="split-text"]'
  );
  if (!targets.length) return; // Early return if no split text elements

  gsap.registerPlugin(SplitText, ScrollTrigger);

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

/* ─────────────────────────────────────────
                Scroll Direction Detect
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// initDetectScrollingDirection(container)
// -----------------------------------------------------------------------------
// Publishes the current scroll state as data-attributes on any element that
// opts in. CSS can then react to them — e.g. fade the nav out while
// scrolling down, slide it back in on scroll up, hide a banner while the
// user is actively scrolling, etc.
//
// Attributes set:
//   [data-scrolling-stopped]   "true" when no scroll for >150ms, "false" while moving.
//   [data-scrolling-direction] "up" or "down" — updated only when scroll
//                              changes by at least `threshold` (10px) to
//                              ignore micro-jitter.
//   [data-scrolling-started]   "true" once scrolled past `thresholdTop` (50px),
//                              "false" while still near the top of the page.
//
// TUNING (locals near the top of the function):
//   threshold        min px to count as a direction change.
//   thresholdTop     min px from top of page to count as "started" scrolling.
//   scrollStopDelay  ms of no scroll before we declare scrolling stopped.
function initDetectScrollingDirection(container) {
  const scrollStoppedEls = container.querySelectorAll(
    "[data-scrolling-stopped]"
  );
  const scrollDirEls = container.querySelectorAll("[data-scrolling-direction]");
  const scrollStartedEls = container.querySelectorAll(
    "[data-scrolling-started]"
  );

  // Early return if NO elements exist that rely on these scroll direction attributes
  if (
    !scrollStoppedEls.length &&
    !scrollDirEls.length &&
    !scrollStartedEls.length
  )
    return;

  // Optional: Initialize the stopped state to 'true' on page load
  scrollStoppedEls.forEach((el) =>
    el.setAttribute("data-scrolling-stopped", "true")
  );

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
      // Use container to re-query dynamically just in case new elements are added
      container
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "false"));
    }

    // Clear the timeout on every scroll event
    clearTimeout(scrollTimeout);

    // Set a timer. If it isn't cleared by another scroll event within 150ms,
    // it will run and set the stopped attribute to true.
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      container
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "true"));
    }, scrollStopDelay);

    // ==========================================
    // 2. SCROLL DIRECTION & TOP THRESHOLD LOGIC
    // ==========================================

    if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
      // Update Scroll Direction
      const direction = nowScrollTop > lastScrollTop ? "down" : "up";
      container
        .querySelectorAll("[data-scrolling-direction]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-direction", direction)
        );

      // Update Scroll Started
      const started = nowScrollTop > thresholdTop;
      container
        .querySelectorAll("[data-scrolling-started]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-started", started ? "true" : "false")
        );

      lastScrollTop = nowScrollTop;
    }
  });
}

/* ─────────────────────────────────────────
                Areas Swiper Animation
   ───────────────────────────────────────── */
// -----------------------------------------------------------------------------
// SWIPER CAROUSELS — shared pattern
// -----------------------------------------------------------------------------
// Several sections on the site use Swiper.js carousels with the same general
// shape: a slider wrapper inside a section, "auto" slides per view, drag-able,
// no loop, and arrow buttons wired to the section's `.button_arrow_wrap`
// elements (distinguished by an inner SVG with data-wf--icon-arrow--direction).
//
// The init helpers below follow that pattern almost identically — only the
// section's class prefix and a few Swiper options differ. Common knobs:
//   slidesPerView    "auto" lets the slide's CSS width define count; set a
//                    number to force N slides at once.
//   spaceBetween     px gap between slides.
//   loop             true wraps end-to-start; usually false on this site.
//   navigation       arrow selectors — change these if the buttons move.
//   effect           Swiper visual transition; only the testimonial swiper
//                    overrides this to "creative" (3D stack).
// To add a new swiper for a new section: copy initCaseSwiper, swap the
// section class prefix, and add it to initfunction() at the bottom.

// initAreasSwiper — horizontal carousel for the "Areas" section.
const initAreasSwiper = (container) => {
  const selector = container.querySelector(".areas_wrap .areas_slider");
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "areas_item_wrap",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    grabCursor: true,
    loop: false,

    navigation: {
      nextEl:
        '.areas_footer .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.areas_footer .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
};

// -----------------------------------------------------------------------------
// initStickySteps(container)
// -----------------------------------------------------------------------------
// Drives the "sticky step indicator" UI: a column of steps where the one
// closest to the viewport center is marked "active", the ones above it are
// "before", and the ones below it are "after". CSS reads the status
// attribute to highlight the current step.
//
// MARKUP CONTRACT:
//   [data-sticky-steps-init]      wraps a step group (one per section).
//   [data-sticky-steps-item]      each step inside the group.
//   [data-sticky-steps-anchor]    optional inner element whose position is
//                                 measured (defaults: not required, but if
//                                 present its CENTER is matched against the
//                                 viewport center to pick the active step).
//   [data-sticky-steps-item-status]   set by this function to "active" |
//                                     "before" | "after".
//
// Wiring is done via a ScrollTrigger that only fires updates while the group
// is on-screen, so off-screen groups don't burn CPU. Updates also fire on
// resize (ScrollTrigger refresh).
function initStickySteps(container) {
  const groups = container.querySelectorAll("[data-sticky-steps-init]");
  if (!groups.length) return;

  // Make sure ScrollTrigger is registered
  gsap.registerPlugin(ScrollTrigger);

  groups.forEach((group) => {
    const items = [...group.querySelectorAll("[data-sticky-steps-item]")];
    if (!items.length) return;

    function updateSteps() {
      const viewportCenter = window.innerHeight / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const anchor = item.querySelector("[data-sticky-steps-anchor]");
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const anchorCenter = rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - anchorCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      items.forEach((item, index) => {
        let status = "active";

        if (index < closestIndex) status = "before";
        if (index > closestIndex) status = "after";

        // Only update the DOM if the attribute actually changed (improves performance)
        if (item.getAttribute("data-sticky-steps-item-status") !== status) {
          item.setAttribute("data-sticky-steps-item-status", status);
        }
      });
    }

    // Run once on initial load to set the correct starting states
    requestAnimationFrame(updateSteps);

    // Tie the logic to ScrollTrigger instead of the window
    ScrollTrigger.create({
      trigger: group,
      start: "top 100%", // Start calculating when the group enters the bottom of the screen
      end: "bottom 0%", // Stop calculating when the group leaves the top of the screen
      onUpdate: updateSteps, // Runs on scroll (but ONLY when visible)
      onRefresh: updateSteps, // Runs automatically on browser resize
    });
  });
}

// -----------------------------------------------------------------------------
// initDraggableMarquee(container)
// -----------------------------------------------------------------------------
// A horizontal scrolling marquee (ticker) that auto-scrolls at a steady speed
// AND can be flicked / dragged left or right by the user — after the drag,
// it eases back to the resting auto-scroll speed.
//
// HOW IT WORKS:
//   1. Reads the natural width of the list, calculates how many clones are
//      needed to fill the wrapper width + 1 for buffer, clones the list.
//   2. Runs an infinite GSAP tween that translates the collection by -listWidth
//      every `duration` seconds. A modifier wraps the X back to 0 so the
//      animation never visibly resets.
//   3. Wraps the wrapper in a GSAP Observer that listens for pointer/touch
//      drag, converts drag velocity into a timeScale boost, then eases back
//      to the resting direction over 1s.
//   4. Pauses the loop AND the observer while the marquee is scrolled off
//      screen (via ScrollTrigger) so it doesn't waste cycles.
//
// MARKUP CONTRACT:
//   [data-draggable-marquee-init]            the wrapper (gets cursor + obs).
//   [data-draggable-marquee-collection]      direct child that holds the lists.
//   [data-draggable-marquee-list]            the original list — gets cloned.
//
// TUNING via data-attributes on the wrapper:
//   data-duration       seconds per full loop (default 20).
//   data-multiplier     max timeScale on flick (default 40 — higher = wilder).
//   data-sensitivity    velocity-to-timeScale factor (default 0.01).
//   data-direction      "left" (default) or "right" — initial scroll direction.
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

    // Prevent Webflow's flexbox from squishing the lists, which breaks calculations
    gsap.set(list, { flexShrink: 0 });

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    // Use getBoundingClientRect for more accurate sub-pixel reading than scrollWidth
    const listWidth = list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // FIX #1: Calculate clones mathematically instead of relying on DOM reflow
    // We add + 1 to ensure there is always enough trailing coverage during the wrap
    const clonesNeeded = Math.ceil(wrapperWidth / listWidth) + 1;

    for (let i = 0; i < clonesNeeded; i++) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      gsap.set(listClone, { flexShrink: 0 }); // Prevent clone squishing
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

    // FIX #2: Apply default grab cursor
    wrapper.style.cursor = "grab";

    // Drag observer
    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,
      // Update Cursor on drag start/end
      onPress: () => {
        wrapper.style.cursor = "grabbing";
      },
      onRelease: () => {
        wrapper.style.cursor = "grab";
      },
      onChangeX: (observerEvent) => {
        let velocityTimeScale = observerEvent.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(
          -multiplier,
          multiplier,
          velocityTimeScale
        );

        gsap.killTweensOf(timeScale);

        const restingDirection = velocityTimeScale < 0 ? -1 : 1;

        gsap
          .timeline({ onUpdate: applyTimeScale })
          .to(timeScale, {
            value: velocityTimeScale,
            duration: 0.1,
            overwrite: true,
          })
          .to(timeScale, { value: restingDirection, duration: 1.0 });
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

// initFaqOpenFirstItem — opens the first FAQ item on page load so users
// land on visible content instead of an empty accordion. Targets the first
// element with class ".faq_item" inside the container.
const initFaqOpenFirstItem = (container) => {
  // Target the first details element within the FAQ component
  const item = container.querySelector(".faq_item");
  if (!item) return;
  item.setAttribute("open", " ");
};

const iniDynamicYear = (container) => {
  const elements = container.querySelectorAll("[data-dynamic-year]");
  if (!elements.length) return;

  elements.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
};

// -----------------------------------------------------------------------------
// initLottieNav(container)
// -----------------------------------------------------------------------------
// Loads a Lottie animation into every nav dropdown icon and plays it on
// hover of the parent nav item (mouseenter starts the loop, mouseleave
// stops it). Each icon's source file is read from the element's
// `data-src` attribute (the .json or .lottie path).
//
// MARKUP CONTRACT:
//   .nav_dropdown_type_icon div[data-src]    the Lottie container — the
//                                            data-src value is the JSON path.
//   .nav_dropdown_type_item                  the parent nav item that
//                                            triggers play on hover.
const initLottieNav = (container) => {
  const elements = container.querySelectorAll(
    ".nav_dropdown_type_icon div[data-src]"
  );

  elements.forEach((el) => {
    const animation = lottie.loadAnimation({
      container: el,
      renderer: "svg",
      loop: true,
      autoplay: false,

      path: el.getAttribute("data-src"),
    });

    const parentLink = el.closest(".nav_dropdown_type_item");

    if (parentLink) {
      parentLink.addEventListener("mouseenter", () => animation.play());
      parentLink.addEventListener("mouseleave", () => animation.stop());
    }
  });
};

// initCaseSwiper — horizontal carousel for the "Case studies" section.
const initCaseSwiper = (container) => {
  const selector = container.querySelector(".case_wrap .case_list_wrap");
  if (!selector) return;

  // selectors.forEach((selector) => {
  new Swiper(selector, {
    slideClass: "case_item",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 0,

    grabCursor: true,
    loop: false,

    navigation: {
      nextEl:
        '.case_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.case_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
  // });
};

// initTestimonialSwiper — one-slide-at-a-time carousel for testimonials with
// a "creative" 3D effect (outgoing slide slides + scales away to -500 z,
// incoming slide enters from the opposite side). The translate distances
// (140%) are intentionally larger than 100% so adjacent slides clear the
// viewport entirely before fading out.
const initTestimonialSwiper = (container) => {
  const selector = container.querySelector(
    ".testimonial_wrap .testimonial_swiper"
  );
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "testimonial_slider",
    wrapperClass: "swiper-wrapper",

    slidesPerView: 1,
    spaceBetween: 0,
    loop: false,
    grabCursor: true,

    effect: "creative",
    creativeEffect: {
      prev: {
        shadow: true,
        translate: ["-140%", 0, -500],
      },
      next: {
        shadow: true,
        translate: ["140%", 0, -500],
      },
    },

    navigation: {
      nextEl:
        '.testimonial_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.testimonial_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
};

// -----------------------------------------------------------------------------
// initFilterBasic(container)
// -----------------------------------------------------------------------------
// Drives a simple click-to-filter UI: click a category button, the matching
// items stay visible, the rest hide. Includes a built-in fade-out / fade-in
// transition (300ms) and an empty-state element that shows when no items
// match the current filter.
//
// MARKUP CONTRACT:
//   [data-filter-group]                  wraps one filter set (buttons + items).
//   [data-filter-target="<name>"]        a filter button — "all" shows everything.
//   [data-filter-name="<name>"]          an item — must match a button target.
//   [data-filter-empty]                  optional empty state. Gets attribute
//                                        "visible" when no items match, "hidden"
//                                        otherwise — style with CSS.
//   [data-filter-status]                 written by this function on items
//                                        and buttons. Values: "active",
//                                        "not-active", "transition-out".
//   aria-pressed / aria-hidden           also kept in sync for a11y.
//
// TUNING: change `transitionDelay` (default 300ms) to match your CSS fade
// duration — items use it as the delay before switching the active/inactive
// status, so animations have time to finish.
//
// NOTE: there's a more advanced multi-match version (initBasicFilterSetupMultiMatch)
// further down in this file that supports filtering by multiple criteria at once.
function initFilterBasic(container) {
  const groups = container.querySelectorAll("[data-filter-group]");
  if (!groups.length) return;

  groups.forEach((group) => {
    const buttons = group.querySelectorAll("[data-filter-target]");
    const items = group.querySelectorAll("[data-filter-name]");
    const emptyEl = group.querySelector("[data-filter-empty]");
    const transitionDelay = 300;

    const updateStatus = (element, shouldBeActive) => {
      element.setAttribute(
        "data-filter-status",
        shouldBeActive ? "active" : "not-active"
      );
      element.setAttribute("aria-hidden", shouldBeActive ? "false" : "true");
    };

    // Show/hide the empty state based on whether any item is active
    const updateEmptyState = () => {
      if (!emptyEl) return;
      const hasMatch = [...items].some(
        (el) => el.getAttribute("data-filter-status") === "active"
      );
      emptyEl.setAttribute(
        "data-filter-empty",
        hasMatch ? "hidden" : "visible"
      );
    };

    const handleFilter = (target) => {
      items.forEach((item) => {
        const shouldBeActive =
          target === "all" || item.getAttribute("data-filter-name") === target;
        const currentStatus = item.getAttribute("data-filter-status");

        if (currentStatus === "active") {
          item.setAttribute("data-filter-status", "transition-out");
          setTimeout(() => updateStatus(item, shouldBeActive), transitionDelay);
        } else {
          setTimeout(() => updateStatus(item, shouldBeActive), transitionDelay);
        }
      });

      buttons.forEach((button) => {
        const isActive = button.getAttribute("data-filter-target") === target;
        button.setAttribute(
          "data-filter-status",
          isActive ? "active" : "not-active"
        );
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      // Check after items have finished transitioning
      setTimeout(updateEmptyState, transitionDelay);
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-filter-target");
        if (button.getAttribute("data-filter-status") === "active") return;
        handleFilter(target);
      });
    });
  });
}

// const initStoriesDialog = (container) => {
//   const section = container.querySelector(".stories_wrap");
//   // if (!section) return; // Un-comment if you use this check in your actual code
//   const items = container.querySelectorAll("[data-stories-item]");
//   if (!items.length) return;

//   items.forEach((item) => {
//     const dialogEl = item.querySelector("[data-modal-stories='dialog']");
//     if (!dialogEl) return;

//     const openDialog = item.querySelector("[data-modal-stories='open-dialog']");
//     const closeDialog = item.querySelector(
//       "[data-modal-stories='close-dialog']"
//     );

//     // 1. Get the hash/slug from your existing anchor tag
//     const slugLink = item.querySelector("[data-modal-stories='slug-link']");
//     const hash = slugLink ? slugLink.getAttribute("href") : null; // Output: "#hp"

//     // Helper function to remove hash from URL cleanly
//     const clearUrlHash = () => {
//       if (window.location.hash === hash) {
//         // Removes hash without reloading or jumping the page
//         history.pushState(
//           null,
//           "",
//           window.location.pathname + window.location.search
//         );
//       }
//     };

//     if (openDialog) {
//       openDialog.addEventListener("click", () => {
//         dialogEl.showModal();
//         // 2. Update the URL when opened
//         if (hash) history.pushState(null, "", hash);
//       });
//     }

//     if (closeDialog) {
//       closeDialog.addEventListener("click", () => {
//         dialogEl.close();
//       });
//     }

//     // 3. Listen to the native 'close' event (handles both click-close and Escape key)
//     dialogEl.addEventListener("close", () => {
//       clearUrlHash();
//     });

//     // You can keep this, but <dialog> natively closes on Escape anyway.
//     // The native 'close' listener above will catch it!
//     container.addEventListener("keydown", (event) => {
//       if (event.key === "Escape" && dialogEl.open) {
//         dialogEl.close();
//       }
//     });

//     // 4. On page load: If the URL hash matches this item's hash, open it
//     if (hash && window.location.hash === hash) {
//       // Small timeout ensures the browser finishes rendering before popping the modal
//       setTimeout(() => {
//         dialogEl.showModal();
//       }, 0);
//     }
//   });

//   // 5. Handle browser Back/Forward buttons
//   window.addEventListener("hashchange", () => {
//     const currentHash = window.location.hash;
//     items.forEach((item) => {
//       const dialogEl = item.querySelector("[data-modal-stories='dialog']");
//       const slugLink = item.querySelector("[data-modal-stories='slug-link']");
//       const hash = slugLink ? slugLink.getAttribute("href") : null;

//       if (hash === currentHash) {
//         if (!dialogEl.open) dialogEl.showModal();
//       } else {
//         if (dialogEl.open) dialogEl.close();
//       }
//     });
//   });
// };
// -----------------------------------------------------------------------------
// initStoriesDialog(container)
// -----------------------------------------------------------------------------
// Powers the "stories" modal pop-ups (native <dialog>) with shareable URLs.
// Each story can be opened by clicking either an <a> link (the SEO-friendly
// route) or a plain <div> trigger, and the URL hash updates to "#<slug>" so
// the open story can be shared, bookmarked, or reopened via direct link.
//
// MARKUP CONTRACT:
//   [data-stories-item]                       wraps a single story card.
//   [data-modal-stories="dialog"]             the native <dialog> element.
//   [data-modal-stories="open-dialog"]        <div> open trigger (optional).
//   [data-modal-stories="close-dialog"]       close button inside the dialog.
//   a[data-stories-slug="<slug>"]             SEO link — its slug attr becomes
//                                             the URL hash (e.g. #behind-the-scenes).
//
// BEHAVIOUR:
//   - Clicking the <a> link opens the dialog instead of navigating (unless
//     the user holds cmd/ctrl/shift/middle-click to open in a new tab).
//   - Clicking the <div> trigger opens the dialog without touching navigation.
//   - Closing (Esc key, backdrop click, or close button) clears the URL hash.
//   - On page load, if the URL already has a matching hash, the dialog opens.
//   - Browser Back/Forward syncs the dialog state to whatever the hash is.
//
// NOTE: the large commented-out block immediately above this is the previous
// implementation kept for reference — do not delete without checking git history.
const initStoriesDialog = (container) => {
  const items = container.querySelectorAll("[data-stories-item]");
  if (!items.length) return;

  items.forEach((item) => {
    const dialogEl = item.querySelector("[data-modal-stories='dialog']");
    if (!dialogEl) return;

    const openDialog = item.querySelector("[data-modal-stories='open-dialog']");
    const closeDialog = item.querySelector(
      "[data-modal-stories='close-dialog']"
    );
    const slugLink = item.querySelector("a[data-stories-slug]"); // Targets the <a> tag

    // 1. Extract the hash from data-stories-slug="hp"
    let hash = null;
    if (slugLink) {
      const slug = slugLink.getAttribute("data-stories-slug");
      if (slug) hash = `#${slug}`; // Result: "#hp"
    }

    const clearUrlHash = () => {
      if (window.location.hash === hash) {
        history.pushState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    };

    // ==========================================
    // 2. THE <a> TAG NAV INTERCEPTOR
    // ==========================================
    if (slugLink) {
      slugLink.addEventListener(
        "click",
        (e) => {
          // Let power users open the link in a new tab
          if (
            e.button !== 0 ||
            e.ctrlKey ||
            e.metaKey ||
            e.shiftKey ||
            e.altKey
          ) {
            return;
          }

          // ONLY stop navigation because this is an actual <a> tag
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Open popup
          if (!dialogEl.open) dialogEl.showModal();

          // Update URL to hash
          if (hash && window.location.hash !== hash) {
            history.pushState(null, "", hash);
          }
        },
        { capture: true }
      );
    }

    // ==========================================
    // 3. THE <div> FALLBACK TRIGGER
    // ==========================================
    if (openDialog) {
      openDialog.addEventListener("click", () => {
        // No need for preventDefault() here because a <div> doesn't navigate!
        if (!dialogEl.open) dialogEl.showModal();

        if (hash && window.location.hash !== hash) {
          history.pushState(null, "", hash);
        }
      });
    }

    // Close Button Click
    if (closeDialog) {
      closeDialog.addEventListener("click", () => {
        dialogEl.close();
      });
    }

    // Native Close Catch (Esc key or backdrop close)
    dialogEl.addEventListener("close", () => {
      clearUrlHash();
    });

    // 4. On Page Load
    if (hash && window.location.hash === hash) {
      setTimeout(() => {
        dialogEl.showModal();
      }, 0);
    }
  });

  // 5. Handle browser Back/Forward buttons smoothly
  window.addEventListener("hashchange", () => {
    const currentHash = window.location.hash;

    items.forEach((item) => {
      const dialogEl = item.querySelector("[data-modal-stories='dialog']");
      const slugLink = item.querySelector("a[data-stories-slug]");

      let itemHash = null;
      if (slugLink) {
        const slug = slugLink.getAttribute("data-stories-slug");
        if (slug) itemHash = `#${slug}`;
      }

      if (itemHash === currentHash) {
        if (!dialogEl.open) dialogEl.showModal();
      } else {
        if (dialogEl.open) dialogEl.close();
      }
    });
  });
};

// initMilestonesSwiper — horizontal carousel for the "Milestones" section.
const initMilestonesSwiper = (container) => {
  const selector = container.querySelector(".milestones_slider");
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "milestones_item",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 0,

    grabCursor: true,
    loop: false,

    navigation: {
      nextEl:
        '.milestones_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.milestones_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
};

// initPressOtherSwiper — horizontal carousel for the "Other press" section.
const initPressOtherSwiper = (container) => {
  const selector = container.querySelector(".press_other_slider");
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "press_other_item",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 0,

    grabCursor: true,
    loop: false,

    navigation: {
      nextEl:
        '.press_other_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.press_other_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
};

// initEventsSwiper — horizontal carousel for the "Events" section.
const initEventsSwiper = (container) => {
  const selector = container.querySelector(".events_wrap .events_slider");
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "events_item",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 0,

    grabCursor: true,
    loop: false,

    navigation: {
      nextEl:
        '.events_collection_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="right"])',
      prevEl:
        '.events_collection_wrap .button_arrow_wrap:has([data-wf--icon-arrow--direction="left"])',
      disabledClass: "is-disabled",
    },
  });
};

const initGalleryEventSwiper = (container) => {
  const selector = container.querySelector(
    ".hero_events_wrap .hero_events_gallery_slider"
  );
  if (!selector) return;

  new Swiper(selector, {
    slideClass: "hero_events_gallery",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 0,

    grabCursor: true,
    // loop: true,
    autoplay: {
      delay: 3000,
    },
  });
};

const initPartnerFunc = (container) => {
  const itemsInitial = 8;
  const itemsNext = 4;
  const transitionDuration = 450;

  const wrapper = container.querySelector('[data-load-more="wrapper"]');
  if (!wrapper) return;
  const items = Array.from(wrapper.querySelectorAll('[data-load-more="item"]'));
  const loadMoreBtn = container.querySelector('[data-load-more="button"]');
  const filterBtns = Array.from(
    container.querySelectorAll("[data-filter-target]")
  );

  if (!items.length || !loadMoreBtn || !filterBtns.length) return;

  let currentVisible = itemsInitial;
  let isSearching = false;

  const hideBtn = () => {
    loadMoreBtn.style.opacity = "0";
    loadMoreBtn.style.pointerEvents = "none";
  };

  const showBtn = () => {
    loadMoreBtn.style.opacity = "1";
    loadMoreBtn.style.pointerEvents = "auto";
  };

  const setStatus = (targets, status) => {
    targets.forEach((item) => item.setAttribute("data-filter-status", status));
  };

  const getActive = () =>
    items.filter(
      (item) => item.getAttribute("data-filter-status") === "active"
    );

  setStatus(items, "not-active");

  const applyNormal = () => {
    const toShow = items.slice(0, currentVisible);
    const toHide = items.slice(currentVisible);

    setStatus(toShow, "active");
    setStatus(toHide, "transition-out");
    setTimeout(() => setStatus(toHide, "not-active"), transitionDuration);

    currentVisible >= items.length ? hideBtn() : showBtn();
  };

  const applyFilter = (category) => {
    // 1. Convert the searched category to lowercase
    const targetCategory = category.toLowerCase();

    // 2. Safely parse and check the item's categories
    const matched = items.filter((item) => {
      // Get data-filter-name, lowercase it, split by '|', and trim spaces
      const itemCategories = item.dataset.filterName
        ? item.dataset.filterName
            .toLowerCase()
            .split("|")
            .map((str) => str.trim())
        : [];

      return itemCategories.includes(targetCategory);
    });

    const unmatched = items.filter((item) => !matched.includes(item));

    setStatus(getActive(), "transition-out");

    setTimeout(() => {
      setStatus(unmatched, "not-active");
      setStatus(matched, "active");
    }, transitionDuration);

    hideBtn();
  };

  const applySearch = (matchedItems) => {
    const unmatched = items.filter((item) => !matchedItems.includes(item));

    setStatus(getActive(), "transition-out");

    setTimeout(() => {
      setStatus(unmatched, "not-active");
      setStatus(matchedItems, "active");
    }, transitionDuration);

    hideBtn();
  };

  const resetSearch = () => {
    isSearching = false;
    currentVisible = itemsInitial;

    wrapper.style.opacity = "0";
    setTimeout(() => {
      setStatus(items, "not-active");
      applyNormal();
      wrapper.style.opacity = "1";
    }, 300);
  };

  applyNormal();

  loadMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (isSearching) return;

    currentVisible += itemsNext;
    applyNormal();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isSearching) return;

      const target = btn.dataset.filterTarget;

      filterBtns.forEach((b) => {
        b.dataset.filterStatus = "not-active";
        b.setAttribute("aria-pressed", "false");
      });
      btn.dataset.filterStatus = "active";
      btn.setAttribute("aria-pressed", "true");

      if (target === "all") {
        setStatus(getActive(), "transition-out");
        wrapper.style.opacity = "0";
        setTimeout(() => {
          currentVisible = itemsInitial;
          setStatus(items, "not-active");
          applyNormal();
          wrapper.style.opacity = "1";
        }, 300);
      } else {
        applyFilter(target);
      }
    });
  });

  initLiveSearch({
    onSearch: (matchedItems) => {
      if (matchedItems.length === 0) return;
      isSearching = true;
      applySearch(matchedItems);
    },
    onReset: () => {
      if (!isSearching) return;
      resetSearch();
    },
  });

  function initLiveSearch({ onSearch, onReset } = {}) {
    container.querySelectorAll("[data-live-search]").forEach(function (root) {
      const input = root.querySelector("[data-live-search-input]");
      const notFound = root.querySelector("[data-live-search-not-found]");

      const options = {
        listClass: "stories_list",
        valueNames: [
          "stories_item_text",
          "stories_item_category_text",
          "stories_categories_text",
        ],
        fuzzySearch: {
          location: 0,
          distance: 100,
          threshold: 0.3,
        },
      };

      const list = new List(root, options);

      function updateNotFound() {
        if (!notFound) return;
        const q = (input && input.value ? input.value : "").trim();
        if (list.matchingItems.length === 0 && q !== "") {
          notFound.style.display = "block";
          const p = notFound.querySelector("p");
          if (p) p.textContent = `We couldn't find a match for "${q}"`;
        } else {
          notFound.style.display = "none";
        }
      }

      function runSearch() {
        const q = (input && input.value ? input.value : "").trim();

        if (!q) {
          list.search();
          updateNotFound();
          if (onReset) onReset();

          return;
        }

        if (typeof list.fuzzySearch === "function") {
          list.fuzzySearch(q);
        } else {
          list.search(q, [
            "stories_item_text",
            "stories_item_category_text",
            "stories_categories_text",
          ]);
        }

        updateNotFound();

        const matchedEls = list.matchingItems.map((i) => i.elm);
        if (onSearch) onSearch(matchedEls);
      }

      if (input) {
        input.addEventListener("input", runSearch);
      }

      root._pageSearchList = list;
      list.search();
      updateNotFound();
    });
  }
};

const initListLoadMore = (container, config = {}) => {
  const {
    itemSelector = "[data-list-load-more='item']",
    buttonSelector = '[data-list-load-more="button"]',
    initialItems = 6,
    itemsPerLoad = 4,
    hiddenStyle = "none",
    visibleStyle = "",
  } = config;

  const items = container.querySelectorAll(itemSelector);
  const loadMoreBtnWrap = container.querySelector(buttonSelector);

  if (!items.length || !loadMoreBtnWrap) return;

  let currentlyVisible = initialItems;

  const renderItems = () => {
    items.forEach((item, index) => {
      if (index < currentlyVisible) {
        item.style.display = visibleStyle;
      } else {
        item.style.display = hiddenStyle;
      }
    });
  };

  const updateButtonVisibility = () => {
    if (currentlyVisible >= items.length) {
      loadMoreBtnWrap.style.display = hiddenStyle;
    } else {
      loadMoreBtnWrap.style.display = visibleStyle;
    }
  };

  const handleLoadMoreClick = (e) => {
    e.preventDefault();
    currentlyVisible += itemsPerLoad;
    renderItems();
    updateButtonVisibility();
  };

  renderItems();
  updateButtonVisibility();

  loadMoreBtnWrap.addEventListener("click", handleLoadMoreClick);
};

const initTOCCaseStudy = (container) => {
  const tocLinks = container.querySelectorAll(".stories_toc_text");
  const sections = container.querySelectorAll(
    ".stories-main_content_wrap > div[id]"
  );

  const removeActiveClasses = () => {
    tocLinks.forEach((link) => link.classList.remove("is-active"));
  };

  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.textContent.trim().toLowerCase();
      const targetSection = container.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -70% 0px",

    threshold: 0,
  };

  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");

        removeActiveClasses();

        const activeLink = Array.from(tocLinks).find(
          (link) => link.textContent.trim().toLowerCase() === id
        );

        if (activeLink) {
          activeLink.classList.add("is-active");
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  sections.forEach((section) => observer.observe(section));
};

function initBasicFilterSetupMultiMatch(container) {
  const transitionDelay = 300;

  // --- LOAD MORE CONFIGURATION ---
  const initialItemsCount = 8; // <-- The number of items to show initially
  const itemsToLoadCount = 4; // <-- The number of items to add per "Load More" click
  // -------------------------------

  const groups = [...container.querySelectorAll("[data-filter-group]")];
  if (!groups.length) return;

  groups.forEach((group) => {
    let currentLimit = initialItemsCount; // Tracks the current max allowed items
    let isInitialLoad = true; // Prevents animation delays on the first page load

    const buttons = [...group.querySelectorAll("[data-filter-target]")];
    const items = [...group.querySelectorAll("[data-filter-name]")];
    const emptyEl = group.querySelector("[data-filter-empty]");

    // Select the actual Load More button directly (instead of the wrapper)
    const loadMoreBtnEl = group.querySelector('[data-filter-btn="load-more"]');

    // Collect category names from child collect-nodes and store pipe-delimited
    items.forEach((item) => {
      const cs = item.querySelectorAll("[data-filter-name-collect]");
      if (!cs.length) return;
      const seen = new Set(),
        out = [];
      cs.forEach((c) => {
        const v = (c.getAttribute("data-filter-name-collect") || "")
          .trim()
          .toLowerCase();
        if (v && !seen.has(v)) {
          seen.add(v);
          out.push(v);
        }
      });
      if (out.length) item.setAttribute("data-filter-name", out.join("|"));
    });

    // Cache token sets, splitting on "|"
    const itemTokens = new Map();
    items.forEach((el) => {
      const tokens = (el.getAttribute("data-filter-name") || "")
        .trim()
        .toLowerCase()
        .split("|")
        .map((t) => t.trim())
        .filter(Boolean);
      itemTokens.set(el, new Set(tokens));
    });

    const setItemState = (el, on) => {
      const next = on ? "active" : "not-active";
      if (el.getAttribute("data-filter-status") !== next) {
        el.setAttribute("data-filter-status", next);
        el.setAttribute("aria-hidden", on ? "false" : "true");
      }
    };

    const setButtonState = (btn, on) => {
      const next = on ? "active" : "not-active";
      if (btn.getAttribute("data-filter-status") !== next) {
        btn.setAttribute("data-filter-status", next);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      }
    };

    // Show/hide the empty state based on whether any item is active
    const updateEmptyState = () => {
      if (!emptyEl) return;
      const hasMatch = items.some(
        (el) => el.getAttribute("data-filter-status") === "active"
      );
      emptyEl.setAttribute(
        "data-filter-empty",
        hasMatch ? "hidden" : "visible"
      );
    };

    let activeTarget = null;

    const itemMatches = (el) => {
      if (!activeTarget || activeTarget === "all") return true;
      return itemTokens.get(el).has(activeTarget);
    };

    const paint = (rawTarget) => {
      const target = (rawTarget || "").trim().toLowerCase();
      activeTarget = !target || target === "all" ? "all" : target;

      let matchCount = 0; // Tracks how many items match the current category

      items.forEach((el) => {
        if (el._ft) clearTimeout(el._ft);

        const isMatch = itemMatches(el);
        let next = false;

        // Count match and apply limits
        if (isMatch) {
          matchCount++;
          // Only flag as 'next = true' if it falls within the current Load More limit
          if (matchCount <= currentLimit) {
            next = true;
          }
        }

        const cur = el.getAttribute("data-filter-status");
        const targetStatus = next ? "active" : "not-active";

        // ANTI-FLICKER: If the item is already in the correct state, don't re-animate it.
        if (cur === targetStatus) return;

        // INSTANT LOAD: Hide excess items immediately on first load without animation
        if (isInitialLoad) {
          setItemState(el, next);
          return;
        }

        if (cur === "active" && transitionDelay > 0 && !next) {
          el.setAttribute("data-filter-status", "transition-out");
          el._ft = setTimeout(() => {
            setItemState(el, next);
            el._ft = null;
          }, transitionDelay);
        } else if (transitionDelay > 0) {
          el._ft = setTimeout(() => {
            setItemState(el, next);
            el._ft = null;
          }, transitionDelay);
        } else {
          setItemState(el, next);
        }
      });

      // BUTTON VISIBILITY: Hide the actual "Load More" button if there are no more matches to reveal
      if (loadMoreBtnEl) {
        if (matchCount > currentLimit) {
          loadMoreBtnEl.style.display = ""; // Show Button
        } else {
          loadMoreBtnEl.style.display = "none"; // Hide Button
        }
      }

      buttons.forEach((btn) => {
        const t = (btn.getAttribute("data-filter-target") || "")
          .trim()
          .toLowerCase();
        setButtonState(
          btn,
          (activeTarget === "all" && t === "all") || (t && t === activeTarget)
        );
      });

      // Check after items have finished transitioning
      setTimeout(updateEmptyState, transitionDelay);

      isInitialLoad = false; // Turn off initial load override after first paint
    };

    group.addEventListener("click", (e) => {
      const filterBtn = e.target.closest("[data-filter-target]");
      const loadMoreBtn = e.target.closest('[data-filter-btn="load-more"]');

      // 1. If a Category Filter is Clicked
      if (filterBtn && group.contains(filterBtn)) {
        currentLimit = initialItemsCount; // Reset back to initial limit
        paint(filterBtn.getAttribute("data-filter-target"));
      }
      // 2. If the 'Load More' button is Clicked
      else if (loadMoreBtn && group.contains(loadMoreBtn)) {
        currentLimit += itemsToLoadCount; // Expand the limit
        paint(activeTarget); // Repaint with the new limit
      }
    });

    // Run the script on Page Load to instantly apply limits
    paint("all");
  });
}

const startDialog = (container) => {
  const dialogEl = container.querySelector("[data-modal-start='dialog']");
  if (!dialogEl) return;

  const openDialogs = container.querySelectorAll("[data-modal-start='open']");
  const closeDialogs = container.querySelectorAll("[data-modal-start='close']");

  if (openDialogs) {
    openDialogs.forEach((openDialog) => {
      openDialog.addEventListener("click", () => {
        dialogEl.showModal();
      });
    });
  }

  if (closeDialogs) {
    closeDialogs.forEach((closeDialog) => {
      closeDialog.addEventListener("click", () => {
        dialogEl.close();
      });
    });
  }
};

const initMediaSwiper = (container) => {
  const selector = container.querySelector(".swiper.is-media");
  if (!selector) return;
  new Swiper(selector, {
    slideClass: "swiper-slide",
    wrapperClass: "swiper-wrapper",
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },

    speed: 800,
    loop: true,

    autoplay: {
      delay: 4000,

      disableOnInteraction: false,

      pauseOnMouseEnter: true,
    },

    navigation: {
      nextEl: ".p-media_button.is-next",
      prevEl: ".p-media_button.is-prev",
    },
  });
};

const initNavMenuAnim = (container) => {
  // 1. Setup MatchMedia for Mobile (65em)
  let mm = gsap.matchMedia();

  // mm.add("(max-width: 65em)", () => {
  const navMobile = container.querySelector(".nav_mobile_wrap");
  if (!navMobile) return;
  // Scoped queries using container
  const toggles = navMobile.querySelectorAll("[data-dropdown-toggle]");
  const navListItems = navMobile.querySelectorAll("[data-nav-list-item]");
  const panels = navMobile.querySelectorAll("[data-nav-content]");
  const megaNavWrap = navMobile.querySelector(".meganav_dropdown_wrap");
  const megaNavBg = navMobile.querySelector(".meganav_dropdown_bg");
  const backBtn = navMobile.querySelector("[data-mobile-back]");
  const hamburger = navMobile.querySelector(".nav_button_wrap.w-nav-button");

  let activePanel = null;
  let isAnimating = false;

  // 3. Open Panel Animation
  const openPanel = (panelName) => {
    if (isAnimating) return;
    isAnimating = true;

    const targetPanel = navMobile.querySelector(
      `[data-nav-content="${panelName}"]`
    );
    activePanel = targetPanel;

    // Get the specific fade/slide items inside the panel that is opening
    const panelFadeItems = targetPanel.querySelectorAll("[data-menu-fade]");

    // Enable pointer events on wrapper and show panel wrapper
    gsap.set(megaNavWrap, { pointerEvents: "auto" });
    gsap.set(targetPanel, { visibility: "visible", display: "flex" });

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
      },
    });

    // Fade in Mega Menu Background
    tl.to(
      megaNavBg,
      {
        opacity: 1,
        duration: 0.6,
        ease: "osmo",
      },
      0
    );

    // Slide and fade OUT the main nav list items (staggered to the left)
    tl.to(
      navListItems,
      {
        x: -20,
        opacity: 0,
        duration: 0.6,
        ease: "osmo",
        stagger: 0.05,
      },
      0
    );

    // Fade in the panel wrapper itself
    tl.fromTo(
      targetPanel,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "osmo" },
      0.1
    );

    // Slide and fade IN the panel elements (staggered from the right)
    if (panelFadeItems.length) {
      tl.fromTo(
        panelFadeItems,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "osmo", stagger: 0.06 },
        0.1
      );
    }

    // Slide and fade IN the Back Button
    tl.fromTo(
      backBtn,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: "osmo" },
      0
    );
  };

  // 4. Close Panel Animation (Back Button)
  const closePanel = (instant = false) => {
    if (!activePanel || isAnimating) return;
    isAnimating = true;

    const duration = instant ? 0 : 0.6;
    const easeType = instant ? "none" : "osmo";
    const panelFadeItems = activePanel.querySelectorAll("[data-menu-fade]");

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(activePanel, { visibility: "hidden", opacity: 0 });
        gsap.set(megaNavWrap, { pointerEvents: "none" });
        activePanel = null;
        isAnimating = false;
      },
    });

    // Slide and fade OUT the panel elements (to the right)
    if (panelFadeItems.length) {
      tl.to(
        panelFadeItems,
        {
          x: 20,
          opacity: 0,
          duration: duration,
          ease: easeType,
        },
        0
      );
    }

    // Fade out the panel wrapper
    tl.to(
      activePanel,
      {
        opacity: 0,
        duration: duration,
        ease: easeType,
      },
      0
    );

    // Fade out Mega Menu Background
    tl.to(
      megaNavBg,
      {
        opacity: 0,
        duration: duration,
        ease: easeType,
      },
      0
    );

    // Slide and fade OUT the Back Button
    tl.to(
      backBtn,
      {
        opacity: 0,
        x: -10,
        duration: 0,
        ease: easeType,
      },
      0
    );

    // Slide and fade IN the main nav list items (staggered from the left)
    tl.to(
      navListItems,
      {
        x: 0,
        opacity: 1,
        duration: duration,
        ease: easeType,
        stagger: instant ? 0 : 0.02, // Reverses stagger direction
      },
      0
    );
  };

  // 5. Event Listeners for Toggles
  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      // Prevent Webflow native dropdown behavior
      e.preventDefault();
      e.stopPropagation();

      const toggleName = toggle.getAttribute("data-dropdown-toggle");
      openPanel(toggleName);
    });
  });

  // 6. Event Listener for Back Button
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closePanel();
    });
  }

  // 7. Reset Menu if Hamburger is closed while a panel is open
  if (hamburger) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          // Check if Webflow removed the 'w--open' class from the hamburger
          if (!hamburger.classList.contains("w--open") && activePanel) {
            // Pass 'true' to instantly close without animation
            closePanel(true);
          }
        }
      });
    });

    observer.observe(hamburger, { attributes: true });
  }

  // Cleanup function when resizing above 65em to prevent desktop layout breaking
  return () => {
    const allFadeItems = container.querySelectorAll("[data-menu-fade]");
    gsap.set(
      [
        megaNavWrap,
        megaNavBg,
        backBtn,
        ...panels,
        ...navListItems,
        ...allFadeItems,
      ],
      {
        clearProps: "all",
      }
    );
    activePanel = null;
    isAnimating = false;
  };
  // });
};

function initBackHistory(container) {
  const backButtons = container.querySelectorAll(
    '[data-button="back-history"]'
  );

  if (backButtons.length === 0) return;

  backButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      window.history.back();
    });
  });
}

function initfunction(container) {
  gsap.set(container, { clearProps: "all" });

  window.scrollTo(0, 0);

  setTimeout(() => {
    const hash = window.location.hash;

    if (hash) {
      const targetElement = document.querySelector(hash);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, 200);

  // Global
  initSplitTextAnimation(container);
  initNumberOdometer(container);
  initVideoAnimation(container);
  initLineAnimation(container);
  initDetectScrollingDirection(container);
  initFaqOpenFirstItem(container);
  iniDynamicYear(container);
  initLottieNav(container);
  initTelephoneValidation(container);
  initEmailValidation(container);
  initFilterBasic(container);
  initBasicFilterSetupMultiMatch(container);
  startDialog(container);
  initNavMenuAnim(container);
  initListLoadMore(container);
  initBackHistory(container);

  // Swiper
  initAreasSwiper(container);
  initCaseSwiper(container);
  initTestimonialSwiper(container);
  initMilestonesSwiper(container);
  initEventsSwiper(container);
  initGalleryEventSwiper(container);
  initMediaSwiper(container);
  initPressOtherSwiper(container);

  // Home
  initHeroAnimation(container);
  initMainHeroVideoControl(container);
  initStartAnimation(container);
  initStartVideoControl(container);
  initStickySteps(container);
  initDraggableMarquee(container);

  // Success Stories
  initStoriesDialog(container);

  // Screen Location
  initPartnerFunc(container);

  // News & Blog
  initListLoadMore(
    container,
    (config = {
      itemSelector: "[data-list-load-more='blog-item']",
      buttonSelector: '[data-list-load-more="blog-button"]',
      initialItems: 4,
      itemsPerLoad: 6,
    })
  );

  // Case Study
  initTOCCaseStudy(container);
}
