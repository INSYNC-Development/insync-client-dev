/**
 * Asiamed Webflow Application Module
 */
const AsiamedApp = {
    // 1. Central Configuration
    config: {
      brandColor: "#B03420",
      breakpoints: {
        tablet: 991,
        mobile: 767,
      },
      defaults: {
        duration: 0.6,
        ease: "power2.out",
      },
      // Only ever read by the disabled initCustomCursor(); the basic cursor
      // has no hover-target list. Uncomment together with that function.
      // cursorTriggers:
      //   "a, button, .button_main_wrap, .footer_group_item, .nav_links_link, .technic_nav_button, .handle_nav, .kongress_header, .xl-badge_wrapper",
    },
  
    // 2. Global Helpers
    helpers: {
      validateLibraries() {
        const missing = [];
        if (typeof gsap === "undefined") missing.push("GSAP");
        if (typeof ScrollTrigger === "undefined") missing.push("ScrollTrigger");
        if (typeof SplitText === "undefined") missing.push("SplitText");
        if (typeof Swiper === "undefined") missing.push("Swiper");
  
        if (missing.length > 0) {
          console.warn(
            `[AsiamedApp] Missing libraries: ${missing.join(", ")}. Some features may not work.`,
          );
          return false;
        }
        return true;
      },
      padZero(num) {
        return num < 10 ? "0" + num : num;
      },
      updatePagination(swiperInstance) {
        const currentCountEl = document.querySelector(".technic_count.is-count");
        const totalCountEl = document.querySelector(".technic_count.is-total");
  
        if (currentCountEl)
          currentCountEl.textContent = AsiamedApp.helpers.padZero(
            swiperInstance.realIndex + 1,
          );
        if (totalCountEl)
          totalCountEl.textContent = AsiamedApp.helpers.padZero(
            swiperInstance.slides.length,
          );
      },
      showValidationError(element, message) {
        if (element) {
          element.textContent = message;
          element.style.display = "block";
        }
      },
      hideValidationError(element) {
        if (element) {
          element.style.display = "none";
        }
      },
      // Odometer core module
      initNumberOdometer() {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
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
          // Above-the-fold groups (e.g. .hero_stats) already satisfy triggerStart
          // on load, so the roll fires while <body> is still fading in from
          // opacity 0 and the user never sees it. Hold them back by default.
          initialDelay: 1.8,
        };
  
        // Scroll-triggered groups
        document.querySelectorAll("[data-odometer-group]").forEach((group) => {
          if (group.hasAttribute(initFlag)) return;
          group.setAttribute(initFlag, "");
  
          // Count-up elements (data-odometer-count) are handled by
          // initOdometerCount() instead of the digit-roller path here.
          const elements = Array.from(
            group.querySelectorAll(
              "[data-odometer-element]:not([data-odometer-count])",
            ),
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
  
          // data-odometer-delay wins (including "0" to opt out); otherwise any
          // group already inside the viewport at init is treated as above-the-fold.
          const explicitDelay = parseFloat(
            group.getAttribute("data-odometer-delay"),
          );
          const isAboveFold =
            group.getBoundingClientRect().top < window.innerHeight;
          const startDelay = Number.isFinite(explicitDelay)
            ? Math.max(explicitDelay, 0)
            : isAboveFold
              ? defaults.initialDelay
              : 0;
  
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
            const { rollers, revealEls } = buildRollerDOM(
              el,
              segments,
              step,
              grow,
            );
  
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
            const offset = startDelay + orderIdx * elementStagger;
  
            revealData.forEach(({ el, widthEm }) => {
              tl.to(
                el,
                {
                  width: widthEm + "em",
                  opacity: 1,
                  duration: defaults.revealDuration,
                  ease: defaults.revealEase,
                },
                offset,
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
                offset + reversedIdx * defaults.digitStagger,
              );
            });
          });
        });
  
        // Programmatic update (optional add-on)
        const updateOdometer = function (el, newText, options = {}) {
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
              0,
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
              reversedIdx * defaults.digitStagger,
            );
          });
        };
  
        // Expose updateOdometer on helpers namespace
        AsiamedApp.helpers.updateOdometer = updateOdometer;
  
        // Internal Odometer Helpers
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
            s.type === "digit"
              ? { ...s, startDigit: parseInt(padded[di++], 10) }
              : s,
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
              el.querySelectorAll('[data-odometer-part="mask"]').forEach(
                (mask) => {
                  mask.style.height = step + "em";
                  mask.style.lineHeight = step;
                },
              );
              el.querySelectorAll('[data-odometer-part="roller"]').forEach(
                (roller) => {
                  roller.style.lineHeight = step;
                },
              );
              el.querySelectorAll('[data-odometer-part="static"]').forEach(
                (stat) => {
                  stat.style.lineHeight = step;
                },
              );
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
      },
      /**
       * Count-up odometer — opt-in alternative to the digit-roller above.
       * Add `data-odometer-count` to an element and its number counts up from
       * `data-odometer-start` (default 0) to the number in its text, with a strong
       * ease-out: it races through the early values and decelerates over the last
       * few — e.g. fast 0→32, then slowly 33, 34, 35. Runs once on scroll in.
       * Tune with: data-odometer-duration (default 2.4s), data-odometer-ease
       * (any GSAP ease, default "power4.out"), data-odometer-start,
       * data-odometer-delay, data-odometer-trigger-start.
       * Elements with this attribute are skipped by the roller odometer above.
       */
      initOdometerCount() {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
  
        // Default ease: race up, then a long, slow finish over the last few
        // values. Built-in power eases top out at power4.out, whose tail isn't
        // slow enough here, so we use a CustomEase (registered on the site
        // alongside ScrollTrigger) with a flatter tail. This curve reaches ~32
        // (of 35) at ~33% of the time — clearly faster than power4's 46% — then
        // crawls 32→35 over the remaining ~67%, with the last unit (34→35) taking
        // ~46% of the whole run. Falls back to power4.out where the plugin isn't
        // available. Verified numerically against power4.out.
        let defaultEase = "power4.out";
        if (
          typeof CustomEase !== "undefined" &&
          typeof CustomEase.create === "function"
        ) {
          defaultEase = CustomEase.create(
            "odoCountEase",
            "M0,0 C0.04,0.85 0.12,0.99 1,1",
          );
        }
  
        document.querySelectorAll("[data-odometer-count]").forEach((el) => {
          if (el.dataset.odoCountReady) return;
          el.dataset.odoCountReady = "1";
  
          const raw = el.textContent.trim();
          const match = raw.match(/\d[\d.,]*/); // the number to count to
          if (!match) return;
  
          const target = parseInt(match[0].replace(/[.,]/g, ""), 10);
          const prefix = raw.slice(0, match.index);
          const suffix = raw.slice(match.index + match[0].length);
          const start = parseFloat(el.getAttribute("data-odometer-start")) || 0;
          const duration =
            parseFloat(el.getAttribute("data-odometer-duration")) || 2.4;
          // fast then slow; override with any GSAP ease via data-odometer-ease
          const ease = el.getAttribute("data-odometer-ease") || defaultEase;
          const triggerStart =
            el.getAttribute("data-odometer-trigger-start") || "top 80%";
  
          const render = (v) => {
            el.textContent = prefix + Math.round(v) + suffix;
          };
  
          if (reduce) {
            render(target); // no motion — just show the final value
            return;
          }
  
          render(start);
  
          // Above the fold the trigger is already satisfied on load, so hold it
          // back (like the roller odometer's initialDelay) rather than counting
          // behind the still-fading body. data-odometer-delay overrides.
          const explicitDelay = parseFloat(
            el.getAttribute("data-odometer-delay"),
          );
          const aboveFold = el.getBoundingClientRect().top < window.innerHeight;
          const delay = Number.isFinite(explicitDelay)
            ? Math.max(explicitDelay, 0)
            : aboveFold
              ? 0.6
              : 0;
  
          const counter = { v: start };
          gsap.to(counter, {
            v: target,
            duration,
            delay,
            ease,
            scrollTrigger: { trigger: el, start: triggerStart, once: true },
            onUpdate: () => render(counter.v),
            onComplete: () => render(target),
          });
        });
      },
    },
  
    // 3. Swiper & Interactive Components
    components: {
      initTechnicSwiper() {
        const swiperElement = document.querySelector(".swiper.is-technic");
        if (!swiperElement) return;
  
        new Swiper(".swiper.is-technic", {
          slidesPerView: 1,
          effect: "fade",
          fadeEffect: { crossFade: true },
          slideClass: "swiper-slides",
          navigation: {
            nextEl: ".technic_nav_button.is-next",
            prevEl: ".technic_nav_button.is-prev",
          },
          on: {
            init: function () {
              AsiamedApp.helpers.updatePagination(this);
            },
            slideChange: function () {
              AsiamedApp.helpers.updatePagination(this);
            },
          },
        });
      },
      initHandleSwiper() {
        const swiperElement = document.querySelector(".swiper.is-handle");
        if (!swiperElement) return;
  
        const wrapper = swiperElement.querySelector(".swiper-wrapper");
        const slides = wrapper.querySelectorAll(".swiper-slides");
  
        // Loop mode with 'auto' width + centeredSlides needs enough slides or a
        // slot sits empty on wide viewports. Cloning the set once (e.g. 4 CMS
        // items -> 8) still left one empty, so clone WHOLE copies of the original
        // set until there are comfortably enough. Whole copies keep the loop
        // sequence seamless (always a multiple of the real count). Bump
        // MIN_SLIDES if a gap still shows on a very wide screen.
        const originalSlides = Array.from(slides);
        const MIN_SLIDES = 12;
        if (originalSlides.length > 0) {
          while (
            wrapper.querySelectorAll(".swiper-slides").length < MIN_SLIDES
          ) {
            originalSlides.forEach((slide) =>
              wrapper.appendChild(slide.cloneNode(true)),
            );
          }
        }
  
        new Swiper(".swiper.is-handle", {
          slidesPerView: "auto",
          spaceBetween: 20, // Gap mobile
          centeredSlides: true,
          loop: true,
          speed: 600,
          grabCursor: true,
          slideToClickedSlide: true,
          slideClass: "swiper-slides",
          navigation: {
            nextEl: ".handle_nav.is-next",
            prevEl: ".handle_nav.is-prev",
          },
          breakpoints: {
            768: {
              slidesPerView: "auto",
              spaceBetween: 40,
            },
            1024: {
              slidesPerView: "auto",
              spaceBetween: 80, // 80px = 5rem
            },
          },
        });
      },
      initTapeSwiper() {
        const swiperElement = document.querySelector(".swiper.is-tape");
        if (!swiperElement) return;
  
        new Swiper(".swiper.is-tape", {
          slidesPerView: 1,
          effect: "fade",
          fadeEffect: { crossFade: true },
          speed: 600,
          grabCursor: true,
          slideClass: "swiper-slides",
          navigation: {
            nextEl: ".technic_nav_button.is-next",
            prevEl: ".technic_nav_button.is-prev",
          },
          on: {
            init: function () {
              AsiamedApp.helpers.updatePagination(this);
            },
            slideChange: function () {
              AsiamedApp.helpers.updatePagination(this);
            },
          },
        });
      },
      initMagneticEffect(selector) {
        const magnets = document.querySelectorAll(selector);
        if (!magnets.length) return;
  
        magnets.forEach((magnet) => {
          const innerRing = magnet.querySelector(".xl-badge_inner-ring");
          const mainCircle = magnet.querySelector(".xl-badge_content");
          const target = innerRing
            ? null
            : magnet.children.length > 0
              ? magnet.children[0]
              : magnet;
  
          magnet.addEventListener("mousemove", (e) => {
            const rect = magnet.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
  
            const distX = e.clientX - centerX;
            const distY = e.clientY - centerY;
  
            if (innerRing && mainCircle) {
              const limitRing = 8;
              const limitCircle = 16;
  
              let ringX = distX * 0.1;
              let ringY = distY * 0.1;
  
              ringX = Math.max(-limitRing, Math.min(limitRing, ringX));
              ringY = Math.max(-limitRing, Math.min(limitRing, ringY));
  
              let circleX = distX * 0.25;
              let circleY = distY * 0.25;
  
              circleX = Math.max(-limitCircle, Math.min(limitCircle, circleX));
              circleY = Math.max(-limitCircle, Math.min(limitCircle, circleY));
  
              gsap.to(innerRing, {
                x: ringX,
                y: ringY,
                duration: 0.4,
                ease: "power2.out",
              });
              gsap.to(mainCircle, {
                x: circleX,
                y: circleY,
                duration: 0.4,
                ease: "power2.out",
              });
            } else if (target) {
              gsap.to(target, {
                x: distX * 0.3,
                y: distY * 0.3,
                duration: 0.4,
                ease: "power2.out",
              });
            }
          });
  
          magnet.addEventListener("mouseleave", () => {
            if (innerRing && mainCircle) {
              gsap.to([innerRing, mainCircle], {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)",
              });
            } else if (target) {
              gsap.to(target, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)",
              });
            }
          });
        });
      },
      /* ------------------------------------------------------------------
         DISABLED 2026-07-22 — replaced by initBasicCustomCursor() below.
         The SVG feTurbulence distortion cursor. Kept verbatim rather than
         deleted so it can be restored if the simpler cursor doesn't land.
         To bring it back: uncomment this block, uncomment config.cursorTriggers,
         and swap the safeInit call in init().
         ------------------------------------------------------------------ */
      /*
      initCustomCursor() {
        // Check if user is on desktop/fine pointer device
        if (!window.matchMedia("(any-pointer: fine)").matches) return;
  
        const cursorElements = document.querySelectorAll(".cursor");
        if (!cursorElements.length) return;
  
        // Interpolation helper
        const lerp = (a, b, n) => (1 - n) * a + n * b;
  
        // Map value helper
        const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
  
        // Mouse coordinates tracking
        let mousePos = { x: 0, y: 0 };
        window.addEventListener("mousemove", (ev) => {
          mousePos.x = ev.clientX;
          mousePos.y = ev.clientY;
        });
  
        class CursorElement {
          constructor(el) {
            this.DOM = {
              el: el,
              inner: el.querySelector(".cursor__inner"),
              feTurbulence: document.querySelector(
                "#cursor-filter > feTurbulence",
              ),
            };
  
            this.radiusOnEnter = 50;
            this.opacityOnEnter = 1;
            this.filterId = "#cursor-filter";
            this.primitiveValues = { turbulence: 0 };
  
            this.renderedStyles = {
              tx: { previous: 0, current: 0, amt: 0.15 },
              ty: { previous: 0, current: 0, amt: 0.15 },
              radius: { previous: 20, current: 20, amt: 0.15 },
              opacity: { previous: 1, current: 1, amt: 0.15 },
            };
  
            this.bounds = this.DOM.el.getBoundingClientRect();
  
            // Load parameters from data attributes if present
            this.radiusOnEnter =
              parseFloat(this.DOM.el.dataset.radiusEnter) || this.radiusOnEnter;
            this.opacityOnEnter =
              parseFloat(this.DOM.el.dataset.opacityEnter) || this.opacityOnEnter;
            const customAmt = parseFloat(this.DOM.el.dataset.amt);
            if (!isNaN(customAmt)) {
              for (const key in this.renderedStyles) {
                this.renderedStyles[key].amt = customAmt;
              }
            }
  
            this.radius = parseFloat(this.DOM.inner.getAttribute("r")) || 20;
            this.renderedStyles.radius.previous =
              this.renderedStyles.radius.current = this.radius;
  
            this.createFilterTimeline();
  
            // Hide initially
            this.DOM.el.style.opacity = 0;
  
            // Reveal on first mouse move and start loop
            const onFirstMove = () => {
              this.renderedStyles.tx.previous = this.renderedStyles.tx.current =
                mousePos.x - this.bounds.width / 2;
              this.renderedStyles.ty.previous = this.renderedStyles.ty.current =
                mousePos.y - this.bounds.height / 2;
              this.DOM.el.style.opacity = 1;
  
              requestAnimationFrame(() => this.render());
              window.removeEventListener("mousemove", onFirstMove);
            };
            window.addEventListener("mousemove", onFirstMove);
          }
  
          enter() {
            this.renderedStyles.opacity.current = this.opacityOnEnter;
            if (this.filterTimeline) {
              this.filterTimeline.restart();
            }
          }
  
          leave() {
            if (this.DOM.inner) {
              this.DOM.inner.style.filter = "none";
            }
            if (this.filterTimeline) {
              this.filterTimeline.kill();
            }
            this.renderedStyles.radius.current = this.radius;
            this.renderedStyles.opacity.current = 1;
          }
  
          createFilterTimeline() {
            if (!this.DOM.feTurbulence) return;
  
            const turbulenceValues = { from: 0.01, to: 0.04 };
  
            this.filterTimeline = gsap
              .timeline({
                paused: true,
                onStart: () => {
                  this.DOM.feTurbulence.setAttribute(
                    "seed",
                    Math.round(gsap.utils.random(1, 20)),
                  );
                  this.DOM.inner.style.filter = `url(${this.filterId})`;
                  this.renderedStyles.opacity.current = 1;
                },
                onUpdate: () => {
                  this.DOM.feTurbulence.setAttribute(
                    "baseFrequency",
                    this.primitiveValues.turbulence,
                  );
                  this.renderedStyles.opacity.current =
                    this.renderedStyles.opacity.previous = map(
                      this.primitiveValues.turbulence,
                      turbulenceValues.from,
                      turbulenceValues.to,
                      1,
                      0,
                    );
                  this.renderedStyles.radius.current =
                    this.renderedStyles.radius.previous = map(
                      this.primitiveValues.turbulence,
                      turbulenceValues.from,
                      turbulenceValues.to,
                      this.radius,
                      this.radiusOnEnter,
                    );
                },
                onComplete: () => {
                  this.DOM.inner.style.filter = "none";
                  this.renderedStyles.radius.current =
                    this.renderedStyles.radius.previous = this.radius;
                },
              })
              .to(this.primitiveValues, {
                duration: 1.5,
                ease: "power1",
                startAt: { turbulence: turbulenceValues.from },
                turbulence: turbulenceValues.to,
              });
          }
  
          render() {
            this.renderedStyles.tx.current = mousePos.x - this.bounds.width / 2;
            this.renderedStyles.ty.current = mousePos.y - this.bounds.height / 2;
  
            for (const key in this.renderedStyles) {
              this.renderedStyles[key].previous = lerp(
                this.renderedStyles[key].previous,
                this.renderedStyles[key].current,
                this.renderedStyles[key].amt,
              );
            }
  
            this.DOM.el.style.transform = `translateX(${this.renderedStyles.tx.previous}px) translateY(${this.renderedStyles.ty.previous}px)`;
            this.DOM.inner.setAttribute("r", this.renderedStyles.radius.previous);
            this.DOM.el.style.opacity = this.renderedStyles.opacity.previous;
  
            requestAnimationFrame(() => this.render());
          }
        }
  
        class Cursor {
          constructor(elements, triggers) {
            this.cursorElements = [];
            elements.forEach((el) =>
              this.cursorElements.push(new CursorElement(el)),
            );
  
            const hoverTargets = document.querySelectorAll(triggers);
            hoverTargets.forEach((target) => {
              target.addEventListener("mouseenter", () => this.enter());
              target.addEventListener("mouseleave", () => this.leave());
            });
          }
  
          enter() {
            this.cursorElements.forEach((el) => el.enter());
          }
  
          leave() {
            this.cursorElements.forEach((el) => el.leave());
          }
        }
  
        new Cursor(cursorElements, AsiamedApp.config.cursorTriggers);
      },
      */
      /**
       * Basic custom cursor — a single dot that trails the pointer.
       * Replaces the distortion cursor commented out above: same .cursor element,
       * none of the SVG filter machinery.
       */
      initBasicCustomCursor() {
        // Pointer-driven, so it has no meaning on touch-only devices — the same
        // guard the previous cursor used.
        if (!window.matchMedia("(any-pointer: fine)").matches) return;
  
        const cursors = document.querySelectorAll(".cursor");
        if (!cursors.length) return;
  
        // Trailing is the whole effect, but it is still motion: with reduced
        // motion the dot snaps to the pointer instead of easing after it.
        const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 0
          : 0.6;
  
        gsap.set(cursors, { xPercent: -50, yPercent: -50 });
  
        const xTo = gsap.quickTo(cursors, "x", { duration, ease: "power3" });
        const yTo = gsap.quickTo(cursors, "y", { duration, ease: "power3" });
  
        window.addEventListener("mousemove", (event) => {
          xTo(event.clientX);
          yTo(event.clientY);
        });
      },
    },
  
    // 4. GSAP & Scroll Animations
    animations: {
      initTextHoverAnimation(wrapperSelector, textSelector) {
        // Skip on touch / no-hover devices: a tap fires mouseenter (play) but
        // often no mouseleave (reverse), leaving the split chars stuck mid-slide
        // — which breaks the button text on mobile, especially when it wraps to
        // 2 lines. Mirrors the guard used in initCustomCursor.
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
          return;
  
        const wrappers = document.querySelectorAll(wrapperSelector);
        if (!wrappers.length) return;
  
        wrappers.forEach((wrapper) => {
          const textEl = wrapper.querySelector(textSelector);
          if (!textEl) return;
  
          const textContainer = document.createElement("div");
          textContainer.style.position = "relative";
          textContainer.style.overflow = "hidden";
          textContainer.style.display = "inline-flex";
  
          textEl.parentNode.insertBefore(textContainer, textEl);
          textContainer.appendChild(textEl);
  
          const cloneEl = textEl.cloneNode(true);
          cloneEl.style.position = "absolute";
          cloneEl.style.top = "140%"; // Diberikan jarak tambahan (140%) agar umlaut (titik di atas Ü, Ö) dari teks klon tidak terlihat di bawah container
          cloneEl.style.left = "0";
          textContainer.appendChild(cloneEl);
  
          const splitOriginal = SplitText.create(textEl, { type: "chars" });
          const splitClone = SplitText.create(cloneEl, { type: "chars" });
  
          const tl = gsap.timeline({ paused: true });
          tl.to(
            splitOriginal.chars,
            {
              yPercent: -140, // Diselaraskan dengan pergeseran klon agar kecepatan gerak tetap sama & sejajar
              duration: 0.4,
              stagger: 0.02,
              ease: "power3.inOut",
            },
            0,
          );
  
          tl.to(
            splitClone.chars,
            {
              yPercent: -140, // Naik 140% dari posisi awalnya di 140% sehingga berakhir pas di posisi 0% (sempurna di tengah)
              duration: 0.4,
              stagger: 0.02,
              ease: "power3.inOut",
            },
            0,
          );
  
          wrapper.addEventListener("mouseenter", () => tl.play());
          wrapper.addEventListener("mouseleave", () => tl.reverse());
        });
      },
      initScrollOpacityAnimation() {
        gsap.registerPlugin(ScrollTrigger, SplitText);
  
        const elements = document.querySelectorAll(
          '[data-scroll-animation="opacity"]',
        );
        if (!elements.length) return;
  
        elements.forEach((el) => {
          const splitText = SplitText.create(el, { type: "words" });
  
          gsap.set(splitText.words, { opacity: 0.2 });
  
          gsap.to(splitText.words, {
            keyframes: [
              {
                opacity: 1,
                color: AsiamedApp.config.brandColor,
                duration: 0.3,
                ease: "power2.out",
              },
              { color: "", duration: 0.5, ease: "power2.inOut" },
            ],
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "bottom 50%",
              scrub: 0.5,
            },
          });
        });
      },
      initAkupunturSectionAnimation() {
        const section = document.querySelector(
          ".studie_graphic_wrap.is-akupuntur",
        );
        if (!section) return;
  
        gsap.registerPlugin(ScrollTrigger, SplitText);
  
        const title = section.querySelector(".studie_akupuntur_title");
        const visualWrap = section.querySelectorAll(
          ".studie_graphic_akup-graph.is-1, .studie_graphic_akup-graph.is-2",
        );
  
        if (!title || !visualWrap) return;
  
        const splitText = SplitText.create(title, { type: "words" });
        const originalColor = window.getComputedStyle(title).color || "#0b0b0b";
  
        gsap.set(visualWrap, { autoAlpha: 0, xPercent: 10 });
        gsap.set(splitText.words, { opacity: 0 });
  
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            pinSpacing: true,
          },
        });
  
        tl.to(visualWrap, {
          autoAlpha: 1,
          xPercent: 0,
          duration: 1,
          ease: "power2.out",
        });
  
        tl.to(
          splitText.words,
          {
            keyframes: [
              {
                opacity: 1,
                color: AsiamedApp.config.brandColor,
                duration: 0.3,
                ease: "power2.out",
              },
              { color: originalColor, duration: 1.2, ease: "power2.out" },
            ],
            stagger: 0.05,
            duration: 1.8,
          },
          "-=0.3",
        );
      },
      initKinesiologieSectionAnimation() {
        const section = document.querySelector(
          ".studie_graphic_wrap.is-kinesiologie",
        );
        if (!section) return;
  
        gsap.registerPlugin(ScrollTrigger, SplitText);
  
        const titles = section.querySelectorAll(".studie_kinesologie_text");
        const visualWrap = section.querySelector(".studie_graphic_visual_wrap");
  
        if (!titles.length || !visualWrap) return;
  
        const splitTexts = Array.from(titles).map((t) =>
          SplitText.create(t, { type: "words" }),
        );
        const words = splitTexts.flatMap((s) => s.words);
        const originalColor =
          window.getComputedStyle(titles[0]).color || "#0b0b0b";
  
        gsap.set(visualWrap, { autoAlpha: 0, yPercent: -20 });
        gsap.set(words, { opacity: 0 });
  
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            pinSpacing: true,
          },
        });
  
        tl.to(words, {
          keyframes: [
            {
              opacity: 1,
              color: AsiamedApp.config.brandColor,
              duration: 0.3,
              ease: "power2.out",
            },
            { color: originalColor, duration: 1.2, ease: "power2.out" },
          ],
          stagger: 0.05,
          duration: 1.8,
        });
  
        tl.to(
          visualWrap,
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 1.0,
            ease: "power2.out",
          },
          "-=0.6",
        );
      },
      /**
       * Section grid lines entrance — opt-in per instance.
       * Set data-section-line-reveal="true" on a .section_line_wrap and its top
       * rule draws left-to-right, then the verticals draw downward, staggered.
       * "false" (or no attribute) leaves the instance completely alone.
       *
       * The ="true" match must stay identical to the one in styles.css: the CSS
       * holds the collapsed start state, so a selector that matched there but not
       * here would leave those lines invisible forever.
       */
      initSectionLineReveal() {
        const wraps = Array.from(
          document.querySelectorAll('[data-section-line-reveal="true"]'),
        );
        if (!wraps.length) return;
  
        // styles.css already renders the lines at their natural size under
        // prefers-reduced-motion, so there is nothing to release here.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  
        const config = {
          duration: 0.5,
          stagger: 0.08,
          topLead: 0.15,
          ease: "power2.out",
          triggerStart: "top 85%",
          // Same trap as the odometer: a wrap that is above the fold satisfies
          // triggerStart on load and would animate behind a still-fading body.
          initialDelay: 0.6,
        };
  
        wraps.forEach((wrap) => {
          const verticals = Array.from(wrap.querySelectorAll(".section_line"));
          const topLine = wrap.querySelector(".section_line-top");
          if (!verticals.length && !topLine) return;
  
          const explicitDelay = parseFloat(
            wrap.getAttribute("data-section-line-delay"),
          );
          const isAboveFold =
            wrap.getBoundingClientRect().top < window.innerHeight;
          const startDelay = Number.isFinite(explicitDelay)
            ? Math.max(explicitDelay, 0)
            : isAboveFold
              ? config.initialDelay
              : 0;
  
          const stagger =
            parseFloat(wrap.getAttribute("data-section-line-stagger")) ||
            config.stagger;
  
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: wrap,
              start: config.triggerStart,
              once: true,
            },
            onComplete() {
              // Drop the compositor hint once there is nothing left to animate.
              gsap.set([...verticals, topLine].filter(Boolean), {
                willChange: "auto",
              });
            },
          });
  
          if (topLine) {
            tl.to(
              topLine,
              { scaleX: 1, duration: config.duration, ease: config.ease },
              startDelay,
            );
          }
  
          if (verticals.length) {
            tl.to(
              verticals,
              {
                scaleY: 1,
                duration: config.duration,
                ease: config.ease,
                stagger,
              },
              startDelay + (topLine ? config.topLead : 0),
            );
          }
        });
      },
      initNavbarScroll() {
        const nav = document.querySelector(".nav_component");
        if (!nav) return;
  
        let closeTimeout = null;
  
        // Everything that should hold the navbar in its solid state. Webflow
        // marks all of them with .w--open: the mobile menu button, the mobile
        // menu itself, and — since 2026-07-22 — an open desktop dropdown.
        // Dropdowns are scoped to the navbar so page-level ones don't count.
        const OPEN_TARGETS =
          ".w-nav-button, .w-nav-menu," +
          " .nav_component .w-dropdown-toggle, .nav_component .w-dropdown-list";
  
        // Read live rather than cached: the delayed close path below re-checks
        // this after 400ms, and used to duplicate the condition — so a dropdown
        // opened during that window would have been missed by one of the copies.
        const isNavOpen = () =>
          Array.from(document.querySelectorAll(OPEN_TARGETS)).some((el) =>
            el.classList.contains("w--open"),
          );
  
        const getScroll = () =>
          typeof ScrollTrigger !== "undefined"
            ? ScrollTrigger.getScrollFunc(window)()
            : window.scrollY;
  
        const updateNavbarClass = (isFromObserver = false) => {
          const threshold = window.innerHeight * 0.02; // 2% of viewport height
  
          if (getScroll() > threshold || isNavOpen()) {
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              closeTimeout = null;
            }
            nav.classList.add("is-scroll");
          } else {
            if (isFromObserver) {
              if (!closeTimeout) {
                closeTimeout = setTimeout(() => {
                  if (getScroll() <= threshold && !isNavOpen()) {
                    nav.classList.remove("is-scroll");
                  }
                  closeTimeout = null;
                }, 400);
              }
            } else {
              if (!closeTimeout) {
                nav.classList.remove("is-scroll");
              }
            }
          }
        };
  
        // --- hide going down, come back when scrolling up or standing still ---
        const HIDE_BELOW = 120; // px from the top where hiding stays disabled
        const SCROLL_NOISE = 6; // px; smaller moves aren't a deliberate direction
        const IDLE_REVEAL = 400; // ms without scrolling before the navbar returns
  
        let lastScroll = getScroll();
        let idleTimer = null;
  
        const showNav = () => nav.classList.remove("is-hidden");
  
        const updateNavbarVisibility = () => {
          const current = getScroll();
          const delta = current - lastScroll;
  
          // "Standing still" is measured from scroll events going quiet. Under
          // Lenis those keep firing through the momentum tail, so this waits for
          // the glide to finish rather than for the wheel to stop.
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(showNav, IDLE_REVEAL);
  
          // An open menu or dropdown must never slide away with the page, and
          // near the top there is nothing to gain by hiding.
          if (isNavOpen() || current <= HIDE_BELOW) {
            showNav();
            lastScroll = current;
            return;
          }
  
          // Leave lastScroll alone below the noise floor, otherwise a slow drift
          // never accumulates enough delta to register as a direction.
          if (Math.abs(delta) < SCROLL_NOISE) return;
  
          nav.classList.toggle("is-hidden", delta > 0);
          lastScroll = current;
        };
  
        ScrollTrigger.create({
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          onUpdate: () => {
            updateNavbarClass(false);
            updateNavbarVisibility();
          },
        });
  
        // Watch the same set the open-check reads, or a state change could flip
        // .w--open without anything asking the navbar to re-evaluate.
        const observer = new MutationObserver(() => {
          updateNavbarClass(true);
          // Opening a dropdown while the navbar is hidden has to bring it back,
          // or the menu renders attached to something off-screen.
          updateNavbarVisibility();
        });
  
        document.querySelectorAll(OPEN_TARGETS).forEach((el) =>
          observer.observe(el, {
            attributes: true,
            attributeFilter: ["class"],
          }),
        );
      },
      /**
       * Timeline century flip — the pinned .begining_year.is-sticky shows the
       * shared century prefix ("19" / "20"); the .begining_item rows only hold
       * two-digit suffixes (89, 97, 02…). As a .begining_item[data-year] crosses
       * the sticky line, the prefix rolls to that item's data-year value.
       *
       * The value comes from data-year, so adding a third century (data-year="21")
       * needs no code change. Below 991px .is-sticky is display:none, so this
       * no-ops there.
       */
      initBeginingYearFlip() {
        // Desktop only. The sticky prefix is display:none below 992px anyway, but
        // this also gates the per-item reveal below — without it, mobile rows
        // would keep the masked opacity:0 start-state and never get revealed.
        // Matches the site's 991px tablet breakpoint.
        if (!window.matchMedia("(min-width: 992px)").matches) return;
  
        const sticky = document.querySelector(".begining_year.is-sticky");
        if (!sticky) return;
  
        const textEl = sticky.querySelector(".begining_year-text");
        if (!textEl) return;
  
        // .is-sticky is display:none at <=991px — nothing to animate there.
        if (getComputedStyle(sticky).display === "none") return;
  
        // Ordered top→bottom, so once one change-point is below the line the
        // rest are too. Each carries the century prefix it switches the sticky to.
        const changePoints = Array.from(
          document.querySelectorAll(".begining_item[data-year]"),
        ).map((el) => ({ el, value: el.getAttribute("data-year") }));
        if (!changePoints.length) return;
  
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
  
        // The sticky's own vertical centre — self-adjusting, so changing the
        // CSS top:50% needs no edit here. TUNE_OFFSET nudges the trigger line
        // if the flip feels early/late against the rendered layout.
        const TUNE_OFFSET = 0;
        const triggerLine = () => {
          const r = sticky.getBoundingClientRect();
          return r.top + r.height / 2 + TUNE_OFFSET;
        };
  
        const valueForLine = (line) => {
          let value = changePoints[0].value;
          for (let i = 0; i < changePoints.length; i++) {
            if (changePoints[i].el.getBoundingClientRect().top <= line) {
              value = changePoints[i].value;
            } else {
              break;
            }
          }
          return value;
        };
  
        let current = textEl.textContent.trim();
  
        const roll = (next) => {
          // Roll up when the century increases (19→20), down when it decreases
          // (scrolling back up), so the motion tracks scroll direction.
          const forward = Number(next) > Number(current);
  
          gsap
            .timeline()
            .to(textEl, {
              yPercent: forward ? -110 : 110,
              opacity: 0,
              duration: 0.28,
              ease: "power2.in",
              onComplete() {
                textEl.textContent = next;
              },
            })
            .set(textEl, { yPercent: forward ? 110 : -110 })
            .to(textEl, {
              yPercent: 0,
              opacity: 1,
              duration: 0.42,
              ease: "power3.out",
            });
        };
  
        const setValue = (next) => {
          if (next === current) return;
          if (reduceMotion) {
            textEl.textContent = next;
          } else {
            roll(next);
          }
          current = next;
        };
  
        // Clip the roll to the sticky box; harmless if the CSS already clips.
        sticky.style.overflow = "hidden";
  
        // Reveal: the sticky number starts at opacity:0 (set in the Designer) and
        // fades to 1 as it comes level with the row years — so it appears right as
        // the prefix ("19") lines up with the first suffix ("89") to read as one
        // number, not from page load. Geometry-based (first row year's top vs the
        // sticky's top) so it tracks the real layout. REVEAL_LEAD starts the fade
        // a touch before they sit level and is the knob to tune after publishing.
        // Reduced motion reveals it instantly. Caveat: the opacity:0 lives in
        // Webflow by the author's choice, so if this never runs it stays hidden.
        const REVEAL_LEAD = 140;
        const firstRow =
          changePoints[0].el.querySelector(".begining_year") ||
          changePoints[0].el;
        // Reversible: fade to 1 when the sticky sits level with the first row
        // year, and back to 0 when scrolling up moves it out of alignment again.
        // Only animate on a state change, so it doesn't re-fire every scroll tick.
        let revealed = false;
        const updateReveal = () => {
          const shouldShow =
            firstRow.getBoundingClientRect().top <=
            sticky.getBoundingClientRect().top + REVEAL_LEAD;
          if (shouldShow === revealed) return;
          revealed = shouldShow;
          gsap.to(sticky, {
            opacity: shouldShow ? 1 : 0,
            duration: reduceMotion ? 0 : 0.5,
            ease: "power2.out",
          });
        };
  
        ScrollTrigger.create({
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          onUpdate: () => {
            setValue(valueForLine(triggerLine()));
            updateReveal();
          },
        });
  
        // Correct value + reveal check on load, before any scroll. At the top the
        // condition is false and matches the Webflow opacity:0, so nothing fires.
        setValue(valueForLine(triggerLine()));
        updateReveal();
  
        // --- light per-item reveal: each row's two-digit year masks in once ---
        if (!reduceMotion && typeof IntersectionObserver === "function") {
          const rows = document.querySelectorAll(".begining_item .begining_year");
          const io = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-revealed");
                  io.unobserve(entry.target);
                }
              });
            },
            { rootMargin: "0px 0px -20% 0px" },
          );
          rows.forEach((row) => io.observe(row));
        }
      },
      /**
       * Sortiment deep-link — open + scroll to a specific accordion by hash.
       * A link to /product/<grip>#<sortiment-slug> lands on the product page,
       * opens the matching <details.guides_details id="<slug>">, and scrolls to
       * it under the sticky navbar. Each details' id is CMS-bound to the slug;
       * name="guide" makes them an exclusive group, so opening one closes the
       * rest natively — no sibling handling needed here.
       */
      initSortimentDeepLink() {
        const accordions = document.querySelectorAll(
          "details.guides_details[id]",
        );
        if (!accordions.length) return;
  
        const getScrollOffset = () => {
          const nav = document.querySelector(".nav_component");
          if (!nav) return 0;
          const { position } = getComputedStyle(nav);
          if (position !== "sticky" && position !== "fixed") return 0;
          return nav.offsetHeight + 16;
        };
  
        const scrollToEl = (el) => {
          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          const offset = getScrollOffset();
  
          // Lenis drives desktop scrolling via its own RAF loop, so a native
          // scrollTo gets overridden a frame later — use its API when exposed.
          if (window.lenis && typeof window.lenis.scrollTo === "function") {
            window.lenis.scrollTo(el, {
              offset: -offset,
              immediate: reduceMotion,
            });
            return;
          }
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({
            top: Math.max(top, 0),
            behavior: reduceMotion ? "auto" : "smooth",
          });
        };
  
        const openFromHash = (hash) => {
          const id = decodeURIComponent((hash || "").replace(/^#/, ""));
          if (!id) return;
  
          // getElementById avoids escaping slugs in a selector, and we still
          // confirm it's actually one of our sortiment accordions.
          const target = document.getElementById(id);
          if (
            !target ||
            target.tagName !== "DETAILS" ||
            !target.classList.contains("guides_details")
          ) {
            return;
          }
  
          target.open = true; // exclusive group closes the others itself
  
          // Summary sits at the details' top and content grows downward, so its
          // position is stable — but a closing sibling above reflows first. One
          // frame lets that settle before we measure.
          requestAnimationFrame(() => scrollToEl(target));
        };
  
        openFromHash(window.location.hash); // arriving with a hash (cross-page)
        window.addEventListener("hashchange", () =>
          openFromHash(window.location.hash),
        ); // same-page links
      },
      /**
       * General hash deep-link — scroll to ANY section by id (e.g. a footer link
       * to /#wissen-technic), pin-aware.
       *
       * The bug this fixes: a native browser anchor jump lands at the target's
       * position as measured BEFORE GSAP builds its pinned ScrollTriggers. Two
       * sections here use pin:true + pinSpacing:true, which inject spacer height
       * and push every downstream section down — so a jump taken before
       * ScrollTrigger has laid out the pins lands short of the real target. This
       * waits until the pins are built and refreshed, then scrolls to the settled
       * position with the sticky-nav offset applied.
       *
       * Ownership: skips ids already handled by initSortimentDeepLink
       * (details.guides_details) so the two never fight over the same hash. FAQ
       * jump-nav is click-driven (not hash), so there's no overlap there.
       *
       * Depends on window.lenis on desktop (same as the other scroll helpers):
       * Lenis drives scrolling from its own RAF loop, so a native scrollTo gets
       * overridden a frame later. Falls back to native scrollTo (mobile / no Lenis).
       */
      initHashScroll() {
        const getTarget = (hash) => {
          const id = decodeURIComponent((hash || "").replace(/^#/, ""));
          if (!id) return null;
          const el = document.getElementById(id);
          if (!el) return null;
          // Let the sortiment deep-link own its accordions.
          if (
            el.tagName === "DETAILS" &&
            el.classList.contains("guides_details")
          ) {
            return null;
          }
          return el;
        };
  
        // .nav_component is sticky, so the target would sit under it otherwise.
        const getScrollOffset = () => {
          const nav = document.querySelector(".nav_component");
          if (!nav) return 0;
          const { position } = getComputedStyle(nav);
          if (position !== "sticky" && position !== "fixed") return 0;
          return nav.offsetHeight + 16;
        };
  
        const scrollToEl = (el, immediate) => {
          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          const offset = getScrollOffset();
  
          if (window.lenis && typeof window.lenis.scrollTo === "function") {
            window.lenis.scrollTo(el, {
              offset: -offset,
              immediate: immediate || reduceMotion,
            });
            return;
          }
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({
            top: Math.max(top, 0),
            behavior: immediate || reduceMotion ? "auto" : "smooth",
          });
        };
  
        // Cross-page arrival: land at the corrected position AFTER the pins
        // settle. ScrollTrigger.refresh() recomputes the pin spacers; one rAF lets
        // Lenis/layout settle, then we jump (immediate — the bootstrap already
        // parked the page at the top, and a smooth sweep from the very top to a
        // deep section would be a long, odd animation on arrival).
        const arrivalTarget = getTarget(window.location.hash);
        if (arrivalTarget) {
          const run = () => {
            if (
              window.ScrollTrigger &&
              typeof ScrollTrigger.refresh === "function"
            ) {
              ScrollTrigger.refresh();
            }
            requestAnimationFrame(() => scrollToEl(arrivalTarget, true));
          };
          // By window.load the browser has done its native anchor jump(s) and the
          // layout is stable, so scheduling past it makes ours the final word. If
          // load already fired, run on the next frame.
          if (document.readyState === "complete") {
            requestAnimationFrame(run);
          } else {
            window.addEventListener("load", run, { once: true });
          }
        }
  
        // Same-page clicks (already on this page): the pins are already laid out,
        // so a smooth scroll to the settled position is enough.
        window.addEventListener("hashchange", () => {
          const el = getTarget(window.location.hash);
          if (el) scrollToEl(el, false);
        });
      },
      /**
       * FAQ jump-nav.
       * Click .faq_table_item[data-table="X"] -> scroll to .faq_list[data-list="X"].
       * data-table is CMS-bound (FAQ Category name), data-list is static per block.
       */
      initFaqTableScroll() {
        const items = Array.from(
          document.querySelectorAll(".faq_table_item[data-table]"),
        );
        const lists = Array.from(
          document.querySelectorAll(".faq_list[data-list]"),
        );
  
        // Both zero means the attributes exist in the Designer but not on the
        // published site. Returning silently there is indistinguishable from
        // "the script never loaded" — which cost a debugging session once.
        if (!items.length || !lists.length) {
          console.warn(
            `[AsiamedApp] FAQ jump-nav skipped — found ${items.length} [data-table] and ${lists.length} [data-list]. If both are 0, republish the site: the attributes are in the Designer but not live yet.`,
          );
          return;
        }
  
        // One side comes from the CMS, the other is typed by hand — normalise both.
        const normalize = (value) => (value || "").trim().toLowerCase();
  
        const listByKey = new Map();
        lists.forEach((list) =>
          listByKey.set(normalize(list.dataset.list), list),
        );
  
        // .nav_component is sticky, so the target would sit under it without this.
        const getScrollOffset = () => {
          const nav = document.querySelector(".nav_component");
          if (!nav) return 0;
          const { position } = getComputedStyle(nav);
          if (position !== "sticky" && position !== "fixed") return 0;
          return nav.offsetHeight + 16;
        };
  
        const pairs = [];
  
        const setActive = (item) => {
          pairs.forEach(({ item: candidate }) =>
            candidate.classList.toggle("is-active", candidate === item),
          );
        };
  
        // Lenis drives scrolling on desktop (see the Webflow footer embed) through
        // its own RAF loop, so a native window.scrollTo gets overridden on the next
        // frame. Use its API when the instance is exposed as window.lenis;
        // otherwise fall back to native, which is what mobile uses anyway.
        const scrollToList = (target) => {
          const offset = getScrollOffset();
          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
  
          if (window.lenis && typeof window.lenis.scrollTo === "function") {
            window.lenis.scrollTo(target, {
              offset: -offset,
              immediate: reduceMotion,
            });
            return;
          }
  
          const top =
            target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({
            top: Math.max(top, 0),
            behavior: reduceMotion ? "auto" : "smooth",
          });
        };
  
        items.forEach((item) => {
          const key = normalize(item.dataset.table);
  
          if (!key) {
            console.warn(
              "[AsiamedApp] A .faq_table_item has an empty data-table — check the CMS binding.",
            );
            return;
          }
  
          const target = listByKey.get(key);
          if (!target) {
            console.warn(
              `[AsiamedApp] No [data-list] block matches FAQ category "${item.dataset.table}". Skipped.`,
            );
            return;
          }
  
          pairs.push({ item, target });
  
          item.setAttribute("role", "button");
          item.setAttribute("tabindex", "0");
  
          const activate = () => {
            setActive(item); // instant feedback, before the scroll settles
            scrollToList(target);
          };
  
          item.addEventListener("click", activate);
          item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              activate();
            }
          });
        });
  
        if (!pairs.length) return;
  
        // Scroll-spy: whichever block is highest in the viewport owns .is-active,
        // so the sidebar tracks reading position instead of only the last click.
        if (typeof IntersectionObserver === "function") {
          const visible = new Set();
  
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) =>
                entry.isIntersecting
                  ? visible.add(entry.target)
                  : visible.delete(entry.target),
              );
  
              if (!visible.size) return;
              const topMost = Array.from(visible).sort(
                (a, b) =>
                  a.getBoundingClientRect().top - b.getBoundingClientRect().top,
              )[0];
              const pair = pairs.find(({ target }) => target === topMost);
              if (pair) setActive(pair.item);
            },
            { rootMargin: `-${getScrollOffset()}px 0px -55% 0px` },
          );
  
          pairs.forEach(({ target }) => observer.observe(target));
        }
  
        setActive(pairs[0].item); // first category active on load
      },
      /**
       * Research visual loop — start on scroll into view, then loop forever.
       * The SVG in .research_visual loops via CSS keyframes (animation … infinite)
       * inside its own <style>, running from page load. styles.css pauses it by
       * default; this adds .is-playing when the element reaches 80% down the
       * viewport (once), letting the loop run from there on. Option B: it is not
       * paused again when scrolled past.
       */
      initResearchVisualLoop() {
        const wraps = document.querySelectorAll(".research_visual");
        if (!wraps.length) return;
  
        // Under reduced motion the loop stays paused (CSS default) — leave it.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  
        const START = 0.5; // fraction down the viewport — matches "scroll 80%"
  
        wraps.forEach((wrap) => {
          // Already at/above the line on load (e.g. above the fold) → play now;
          // ScrollTrigger's onEnter wouldn't fire for a trigger already passed.
          if (wrap.getBoundingClientRect().top < window.innerHeight * START) {
            wrap.classList.add("is-playing");
            return;
          }
  
          ScrollTrigger.create({
            trigger: wrap,
            start: `top ${START * 100}%`,
            once: true, // fire once, then leave it looping
            onEnter: () => wrap.classList.add("is-playing"),
          });
        });
      },
      initKongressClick() {
        const headers = document.querySelectorAll(".kongress_header");
        if (!headers.length) return;
  
        headers.forEach((header) => {
          const container =
            header.closest(".kongress_item") ||
            header.closest(".kongress_component") ||
            document;
          const cardWrap =
            container.querySelector(".kongress_card_wrap") ||
            document.querySelector(".kongress_card_wrap");
          if (!cardWrap) return;
  
          if (cardWrap.dataset.originalBottom === undefined) {
            const computedBottom = window.getComputedStyle(cardWrap).bottom;
            cardWrap.dataset.originalBottom = computedBottom || "-100%";
          }
  
          header.addEventListener("click", () => {
            const currentCardWrap =
              container.querySelector(".kongress_card_wrap") ||
              document.querySelector(".kongress_card_wrap");
  
            let textElements = container.querySelectorAll(
              ".kongress_body_row > :has(p, h1, h2, h3, h4, h5, h6)",
            );
            if (textElements.length === 0) {
              textElements = document.querySelectorAll(
                ".kongress_body_row > :has(p, h1, h2, h3, h4, h5, h6)",
              );
            }
            if (textElements.length === 0) {
              textElements = container.querySelectorAll(".kongress_body_row > *");
            }
  
            const isOpen = currentCardWrap.classList.contains("is-open");
  
            if (isOpen) {
              currentCardWrap.classList.remove("is-open");
  
              gsap.to(currentCardWrap, {
                bottom: currentCardWrap.dataset.originalBottom,
                duration: 0.6,
                ease: "power2.inOut",
              });
  
              if (textElements.length > 0) {
                gsap.to(textElements, {
                  opacity: 0,
                  duration: 0.4,
                  ease: "power2.inOut",
                  stagger: 0.03,
                });
              }
            } else {
              currentCardWrap.classList.add("is-open");
  
              gsap.to(currentCardWrap, {
                bottom: "0%",
                duration: 0.6,
                ease: "power2.out",
              });
  
              if (textElements.length > 0) {
                gsap.to(textElements, {
                  opacity: 1,
                  duration: 0.5,
                  ease: "power2.out",
                  stagger: 0.05,
                });
              }
            }
          });
        });
      },
      initQualityBarAnimation() {
        const wrap = document.querySelector(".quality_col-2_bars_wrap");
        if (!wrap) return;
  
        const items = wrap.querySelectorAll(".quality_col-2_bar_wrap");
        if (!items.length) return;
  
        items.forEach((item) => {
          const bar = item.querySelector(".quality_col-2_bar");
          const text = item.querySelector(".quality_col-2_bar-text");
          if (!bar) return;
  
          gsap.set(bar, { overflow: "hidden" });
          if (text) {
            gsap.set(text, { whiteSpace: "nowrap" });
          }
  
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              once: true,
            },
          });
  
          tl.from(
            bar,
            {
              width: "0%",
              duration: 1.7,
              ease: "power2.out",
            },
            0,
          );
  
          if (text) {
            tl.from(
              text,
              {
                opacity: 0,
                duration: 0.7,
                ease: "power2.out",
              },
              0.5,
            );
          }
        });
      },
      initHighlightMarkerTextReveal() {
        const defaults = {
          direction: "right",
          theme: "pink",
          scrollStart: "top 90%",
          staggerStart: "start",
          stagger: 100,
          barDuration: 0.6,
          barEase: "power3.inOut",
        };
  
        const colorMap = {
          pink: AsiamedApp.config.brandColor,
          white: "#FFFFFF",
        };
  
        const directionMap = {
          right: { prop: "scaleX", origin: "right center" },
          left: { prop: "scaleX", origin: "left center" },
          up: { prop: "scaleY", origin: "center top" },
          down: { prop: "scaleY", origin: "center bottom" },
        };
  
        function resolveColor(value) {
          if (colorMap[value]) return colorMap[value];
          if (value.startsWith("--")) {
            return (
              getComputedStyle(document.body).getPropertyValue(value).trim() ||
              value
            );
          }
          return value;
        }
  
        function createBar(color, origin) {
          const bar = document.createElement("div");
          bar.className = "highlight-marker-bar";
          Object.assign(bar.style, {
            backgroundColor: color,
            transformOrigin: origin,
          });
          return bar;
        }
  
        function cleanupElement(el) {
          if (!el._highlightMarkerReveal) return;
          el._highlightMarkerReveal.timeline?.kill();
          el._highlightMarkerReveal.scrollTrigger?.kill();
          el._highlightMarkerReveal.split?.revert();
          el.querySelectorAll(".highlight-marker-bar").forEach((bar) =>
            bar.remove(),
          );
          delete el._highlightMarkerReveal;
        }
  
        let reduceMotion = false;
  
        gsap
          .matchMedia()
          .add({ reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
            reduceMotion = context.conditions.reduce;
          });
  
        if (reduceMotion) {
          document
            .querySelectorAll("[data-highlight-marker-reveal]")
            .forEach((el) => {
              gsap.set(el, { autoAlpha: 1 });
            });
          return;
        }
  
        // Mobile: no heading animation at all — the per-line marker sweep is
        // heavy on phones, and a plain reveal is preferred here. Just show the
        // headings (same as the reduced-motion path), no motion. Checked once at
        // init, consistent with the site's other breakpoint guards.
        if (window.matchMedia("(max-width: 991px)").matches) {
          document
            .querySelectorAll("[data-highlight-marker-reveal]")
            .forEach((el) => {
              gsap.set(el, { autoAlpha: 1 });
            });
  
          // Previously a fast slide-up on mobile — kept commented in case motion
          // is wanted back instead of a plain reveal.
          // document.querySelectorAll("[data-highlight-marker-reveal]").forEach((el) => {
          //   if (el.getAttribute("data-highlight-marker-reveal") === "false") {
          //     gsap.set(el, { autoAlpha: 1 });
          //     return;
          //   }
          //   const scrollStart =
          //     el.getAttribute("data-marker-scroll-start") || defaults.scrollStart;
          //   gsap.set(el, { autoAlpha: 0, y: 24 });
          //   gsap.to(el, {
          //     autoAlpha: 1,
          //     y: 0,
          //     duration: 0.45,
          //     ease: "power2.out",
          //     scrollTrigger: { trigger: el, start: scrollStart, once: true },
          //   });
          // });
          return;
        }
  
        document
          .querySelectorAll("[data-highlight-marker-reveal]")
          .forEach(cleanupElement);
  
        const elements = document.querySelectorAll(
          "[data-highlight-marker-reveal]",
        );
        if (!elements.length) return;
  
        elements.forEach((el) => {
          if (el.getAttribute("data-highlight-marker-reveal") === "false") {
            gsap.set(el, { autoAlpha: 1 });
            return;
          }
  
          const direction =
            el.getAttribute("data-marker-direction") || defaults.direction;
          const theme = el.getAttribute("data-marker-theme") || defaults.theme;
          const scrollStart =
            el.getAttribute("data-marker-scroll-start") || defaults.scrollStart;
          const staggerStart =
            el.getAttribute("data-marker-stagger-start") || defaults.staggerStart;
          const staggerOffset =
            (parseFloat(el.getAttribute("data-marker-stagger")) ||
              defaults.stagger) / 1000;
  
          const color = resolveColor(theme);
          const dirConfig = directionMap[direction] || directionMap.right;
  
          el._highlightMarkerReveal = {};
  
          const split = SplitText.create(el, {
            type: "lines",
            linesClass: "highlight-marker-line",
            autoSplit: true,
            onSplit(self) {
              const instance = el._highlightMarkerReveal;
  
              instance.timeline?.kill();
              instance.scrollTrigger?.kill();
              el.querySelectorAll(".highlight-marker-bar").forEach((bar) =>
                bar.remove(),
              );
  
              const lines = self.lines;
              const tl = gsap.timeline({ paused: true });
  
              lines.forEach((line, i) => {
                gsap.set(line, { position: "relative", overflow: "hidden" });
  
                const bar = createBar(color, dirConfig.origin);
                line.appendChild(bar);
  
                const staggerIndex =
                  staggerStart === "end" ? lines.length - 1 - i : i;
  
                tl.to(
                  bar,
                  {
                    [dirConfig.prop]: 0,
                    duration: defaults.barDuration,
                    ease: defaults.barEase,
                  },
                  staggerIndex * staggerOffset,
                );
              });
  
              gsap.set(el, { autoAlpha: 1 });
  
              const st = ScrollTrigger.create({
                trigger: el,
                start: scrollStart,
                once: true,
                onEnter: () => tl.play(),
              });
  
              instance.timeline = tl;
              instance.scrollTrigger = st;
            },
          });
  
          el._highlightMarkerReveal.split = split;
        });
      },
    },
  
    // 5. Forms & Validations
    forms: {
      initEmailValidation() {
        const emailInputs = document.querySelectorAll('input[type="email"]');
        if (!emailInputs.length) return;
  
        emailInputs.forEach((emailInput) => {
          const errorMsgElement = emailInput.nextElementSibling;
  
          if (
            !errorMsgElement ||
            errorMsgElement.getAttribute("data-input-form") !== "error-msg"
          ) {
            console.error(
              "Could not find the error message element for an email input.",
              emailInput,
            );
            return;
          }
  
          emailInput.addEventListener("blur", function () {
            const email = this.value.trim();
            const emailParts = email.split("@");
  
            if (emailParts.length === 2 && emailParts[1].length > 0) {
              const domain = emailParts[1];
              validateDomain(domain, errorMsgElement);
            } else if (email.length > 0) {
              AsiamedApp.helpers.showValidationError(
                errorMsgElement,
                "Please enter a valid email address.",
              );
            } else {
              AsiamedApp.helpers.hideValidationError(errorMsgElement);
            }
          });
        });
  
        async function validateDomain(domain, errorElement) {
          try {
            AsiamedApp.helpers.showValidationError(
              errorElement,
              "Verifying domain...",
            );
  
            const response = await fetch(
              `https://dns.google/resolve?name=${domain}&type=MX`,
            );
            const data = await response.json();
  
            if (response.ok && data.Answer && data.Answer.length > 0) {
              AsiamedApp.helpers.hideValidationError(errorElement);
            } else {
              AsiamedApp.helpers.showValidationError(
                errorElement,
                "The email domain appears to be invalid or non-existent.",
              );
            }
          } catch (error) {
            console.error("Error during domain validation:", error);
            AsiamedApp.helpers.showValidationError(
              errorElement,
              "Validation failed. Please check your connection.",
            );
          }
        }
      },
      initTelInputValidation() {
        const telInputs = document.querySelectorAll('input[type="tel"]');
        if (!telInputs.length) return;
  
        telInputs.forEach((telInput) => {
          const errorMsgElement = telInput.nextElementSibling;
  
          if (
            !errorMsgElement ||
            errorMsgElement.getAttribute("data-input-form") !== "error-msg"
          ) {
            console.error(
              "Could not find the error message element for a telephone input.",
              telInput,
            );
            return;
          }
  
          telInput.addEventListener("input", function () {
            const originalValue = this.value;
            let sanitizedValue = originalValue.replace(/[^\d+]/g, "");
  
            if (sanitizedValue.lastIndexOf("+") > 0) {
              sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
            }
  
            if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue)) {
              sanitizedValue = sanitizedValue.substring(1);
            }
  
            if (originalValue !== sanitizedValue) {
              this.value = sanitizedValue;
            }
  
            if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
              AsiamedApp.helpers.showValidationError(
                errorMsgElement,
                "Only numbers and a leading + are allowed.",
              );
            } else {
              AsiamedApp.helpers.hideValidationError(errorMsgElement);
            }
          });
        });
      },
    },
  
    // 6. Master Init & Bootstrapper
    init() {
      console.log("[AsiamedApp] Initializing app modules...");
  
      // 1. Library check
      if (!this.helpers.validateLibraries()) return;
  
      // Clear ScrollTrigger's scroll memory to prevent jump-back on refresh
      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.clearScrollMemory();
      }
  
      // 2. Safe execution wrappers
      const safeInit = (name, initFn) => {
        try {
          initFn();
        } catch (err) {
          console.error(
            `[AsiamedApp] Failed to initialize module "${name}":`,
            err,
          );
        }
      };
  
      // Bootstrapping each component cleanly
      safeInit("Odometer Module", () => this.helpers.initNumberOdometer());
      safeInit("Odometer Count-up", () => this.helpers.initOdometerCount());
      safeInit("Technic Swiper", () => this.components.initTechnicSwiper());
      safeInit("Handle Swiper", () => this.components.initHandleSwiper());
      safeInit("Tape Swiper", () => this.components.initTapeSwiper());
      safeInit("Badge Magnetic Effect", () =>
        this.components.initMagneticEffect(".xl-badge_wrapper"),
      );
      safeInit("Main Button Hover", () =>
        this.animations.initTextHoverAnimation(
          ".button_main_wrap",
          ".button_main_text",
        ),
      );
      safeInit("Footer Link Hover", () =>
        this.animations.initTextHoverAnimation(
          ".footer_group_item",
          ".footer_link_text",
        ),
      );
      safeInit("Navigation Link Hover", () =>
        this.animations.initTextHoverAnimation(
          ".nav_links_link",
          ".nav_links_text",
        ),
      );
      safeInit("Scroll Opacity Wave", () =>
        this.animations.initScrollOpacityAnimation(),
      );
      safeInit("Akupuntur Pinned Timeline", () =>
        this.animations.initAkupunturSectionAnimation(),
      );
      safeInit("Kinesiologie Pinned Timeline", () =>
        this.animations.initKinesiologieSectionAnimation(),
      );
      safeInit("Section Line Reveal", () =>
        this.animations.initSectionLineReveal(),
      );
      safeInit("Sticky Navbar Handler", () => this.animations.initNavbarScroll());
      safeInit("Begining Year Flip", () =>
        this.animations.initBeginingYearFlip(),
      );
      safeInit("FAQ Table Jump Scroll", () =>
        this.animations.initFaqTableScroll(),
      );
      safeInit("Sortiment Deep Link", () =>
        this.animations.initSortimentDeepLink(),
      );
      safeInit("Section Hash Deep Link", () =>
        this.animations.initHashScroll(),
      );
      safeInit("Research Visual Loop", () =>
        this.animations.initResearchVisualLoop(),
      );
      safeInit("Kongress Card Accordion", () =>
        this.animations.initKongressClick(),
      );
      safeInit("Quality Bar progress", () =>
        this.animations.initQualityBarAnimation(),
      );
      safeInit("Highlight Marker Text Reveal", () =>
        this.animations.initHighlightMarkerTextReveal(),
      );
      safeInit("Email Address Field Validator", () =>
        this.forms.initEmailValidation(),
      );
      safeInit("Telephone Field Sanitizer", () =>
        this.forms.initTelInputValidation(),
      );
      // safeInit("Custom Cursor Distortion Effect", () =>
      //   this.components.initCustomCursor(),
      // );
      safeInit("Basic Custom Cursor", () =>
        this.components.initBasicCustomCursor(),
      );
  
      console.log("[AsiamedApp] Initialization finished successfully.");
    },
  };
  
  // 7. Initialize Application
  document.addEventListener("DOMContentLoaded", () => {
    // Force scroll to top on page load/reload. scrollRestoration = "manual" stops
    // the browser from restoring a mid-page scroll on reload/back, and the
    // scrollTo lands the new page at the top.
    //
    // NOTE: there used to be a beforeunload -> window.scrollTo(0,0) here too. It
    // scrolled the OUTGOING page back to its hero the instant you clicked a link,
    // and the browser painted that frame before the next page loaded — the
    // "hero flashes back on navigation" clunkiness. Removed 2026-08-07; the two
    // lines above already guarantee every page starts at the top.
    if (history.scrollRestoration) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  
    if (document.fonts) {
      document.fonts.ready.then(() => {
        AsiamedApp.init();
      });
    } else {
      AsiamedApp.init();
    }
  });
  