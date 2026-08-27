/* =========================================
   Odd Meter Start
   ========================================= */
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const initFlag = "data-odometer-initialized";
  const activeTweens = new WeakMap();

  // Configuration
  const defaults = {
    duration: 1,
    ease: CustomEase.create("osmo", "M0,0 C0.625,0.05 0,1 1,1"),
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.8,
    revealEase: "power2.out",
    triggerStart: "top 90%",
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
/* =========================================
     Odd Meter End
     ========================================= */

/* =========================================
    Swiper List
    ========================================= */
// function initWebinarPin() {
//   const items = document.querySelectorAll(".s-webinar_item");
//   const images = document.querySelectorAll(".s-webinar_visual_img_wrap");
//   const progressBar = document.querySelector(".s-webinar_step_progress");
//   const sectionWrap = document.querySelector(".s-webinar_main_wrap");

//   if (!items.length || !images.length || !progressBar) return;

//   let mm = gsap.matchMedia();

//   // mm.add("(min-width: 992px)", () => {
//   //   let currentIndex = 0;
//   //   let progressTween = null;
//   //   const stepDuration = 5;
//   //   const totalSteps = items.length;
//   //   const percentagePerStep = 100 / totalSteps;

//   //   gsap.set(progressBar, { height: "100%", width: "0%" });
//   //   gsap.set(images, { opacity: 0, zIndex: 0 });
//   //   gsap.set(images[0], { opacity: 1, zIndex: 1 });
//   //   gsap.set(items, { opacity: 0.6 });
//   //   gsap.set(items[0], { opacity: 1 });

//   //   function goToStep(index) {
//   //     if (progressTween) progressTween.kill();

//   //     gsap.to(images, { opacity: 0, zIndex: 0, duration: 0.5 });
//   //     gsap.to(images[index], { opacity: 1, zIndex: 1, duration: 0.5 });

//   //     gsap.to(items, { opacity: 0.6, duration: 0.3 });
//   //     gsap.to(items[index], { opacity: 1, duration: 0.3 });

//   //     const startWidth = index * percentagePerStep;
//   //     const endWidth = (index + 1) * percentagePerStep;

//   //     gsap.set(progressBar, { width: `${startWidth}%` });

//   //     progressTween = gsap.to(progressBar, {
//   //       width: `${endWidth}%`,
//   //       duration: stepDuration,
//   //       ease: "none",
//   //       onComplete: () => {
//   //         let nextIndex = (index + 1) % totalSteps;
//   //         goToStep(nextIndex);
//   //       },
//   //     });

//   //     currentIndex = index;
//   //   }

//   //   goToStep(0);

//   //   items.forEach((item, index) => {
//   //     item.onclick = () => {
//   //       if (currentIndex !== index) goToStep(index);
//   //     };
//   //   });

//   //   return () => {
//   //     if (progressTween) progressTween.kill();
//   //   };
//   // });

//   mm.add("(min-width: 992px)", () => {
//     const totalSteps = items.length;
//     const mainWrap = document.querySelector(".s-webinar_main_wrap");

//     // initial state
//     gsap.set(images, { opacity: 0, zIndex: 0 });
//     gsap.set(images[0], { opacity: 1, zIndex: 1 });
//     gsap.set(items, { opacity: 0.6 });
//     gsap.set(items[0], { opacity: 1 });
//     gsap.set(progressBar, { width: "0%" });

//     let tl = gsap.timeline({
//       scrollTrigger: {
//         trigger: mainWrap, // 🔥 trigger baru
//         start: "top 15%",
//         markers: true,
//         end: `+=${totalSteps * 700}`,
//         scrub: 1,
//         pin: sectionWrap, // 🔥 tetap pin yang ini
//         anticipatePin: 1,
//         invalidateOnRefresh: true,
//         pinSpacing: true,
//       },
//     });

//     items.forEach((item, index) => {
//       const progress = (index + 1) / totalSteps;

//       tl.to(progressBar, {
//         width: `${progress * 100}%`,
//         ease: "none",
//       });

//       tl.to(
//         images,
//         {
//           opacity: 0,
//           zIndex: 0,
//           duration: 0.3,
//         },
//         "<"
//       );

//       tl.to(
//         images[index],
//         {
//           opacity: 1,
//           zIndex: 1,
//           duration: 0.3,
//         },
//         "<"
//       );

//       tl.to(
//         items,
//         {
//           opacity: 0.6,
//           duration: 0.2,
//         },
//         "<"
//       );

//       tl.to(
//         items[index],
//         {
//           opacity: 1,
//           duration: 0.2,
//         },
//         "<"
//       );
//     });
//   });

//   mm.add("(max-width: 991px)", () => {
//     gsap.set(progressBar, { width: "100%", height: "0%" });
//     gsap.set(items, { opacity: 0.6 });

//     const listWrapper = document.querySelector(".s-webinar_list_wrapper");

//     gsap.to(progressBar, {
//       height: "100%",
//       ease: "none",
//       scrollTrigger: {
//         trigger: listWrapper,

//         start: "top center",

//         end: "bottom center",
//         scrub: true,
//       },
//     });

//     items.forEach((item, index) => {
//       ScrollTrigger.create({
//         trigger: item,
//         start: "top center",
//         end: "bottom center",
//         onToggle: (self) => {
//           if (self.isActive) {
//             gsap.to(item, { opacity: 1, duration: 0.3 });
//             gsap.to(images, { opacity: 0, zIndex: 0, duration: 0.5 });
//             gsap.to(images[index], { opacity: 1, zIndex: 1, duration: 0.5 });
//           } else {
//             gsap.to(item, { opacity: 0.6, duration: 0.3 });
//           }
//         },
//       });
//     });
//   });
// }

// function initWebinarPin() {
//   const items = document.querySelectorAll(".s-webinar_item");
//   const images = document.querySelectorAll(".s-webinar_visual_img_wrap");
//   const progressBar = document.querySelector(".s-webinar_step_progress");
//   const mainWrap = document.querySelector(".s-webinar_main_wrap");

//   if (!items.length || !images.length || !progressBar || !mainWrap) return;

//   gsap.registerPlugin(ScrollTrigger);

//   // 🔥 GLOBAL INITIAL STATE
//   gsap.set(images, { opacity: 0, zIndex: 0 });
//   gsap.set(images[0], { opacity: 1, zIndex: 1 });
//   gsap.set(items, { opacity: 0.6 });
//   gsap.set(items[0], { opacity: 1 });

//   let mm = gsap.matchMedia();

//   // =========================
//   // DESKTOP
//   // =========================
//   mm.add("(min-width: 992px)", () => {
//     const totalSteps = items.length;

//     gsap.set(progressBar, { width: "0%" });

//     let tl = gsap.timeline({
//       scrollTrigger: {
//         trigger: mainWrap,
//         start: "top 15%",
//         end: `+=${totalSteps * 700}`,
//         scrub: 1,
//         pin: true,
//         anticipatePin: 1,
//         invalidateOnRefresh: true,
//         fastScrollEnd: true,
//         pinSpacing: true,
//       },
//     });

//     // 🔥 FIX: force start sync
//     tl.set(progressBar, { width: "0%" });

//     items.forEach((item, index) => {
//       const progress = (index + 1) / totalSteps;
//       const current = images[index];
//       const prev = images[index - 1];

//       // progress
//       tl.to(progressBar, {
//         width: `${progress * 100}%`,
//         ease: "none",
//       });

//       // 🔥 CROSSFADE IMAGE (NO RESET)
//       if (prev) {
//         tl.to(
//           prev,
//           {
//             opacity: 0,
//             duration: 0.3,
//             immediateRender: false,
//           },
//           "<"
//         );
//       }

//       tl.to(
//         current,
//         {
//           opacity: 1,
//           duration: 0.3,
//           immediateRender: false,
//         },
//         "<"
//       );

//       // item highlight
//       tl.to(
//         items,
//         {
//           opacity: 0.6,
//           duration: 0.2,
//         },
//         "<"
//       );

//       tl.to(
//         item,
//         {
//           opacity: 1,
//           duration: 0.2,
//         },
//         "<"
//       );
//     });
//   });

//   // =========================
//   // TABLET & MOBILE (HORIZONTAL SWIPER)
//   // =========================
//   mm.add("(max-width: 991px)", () => {
//     const list = document.querySelector(".s-webinar_list");
//     const totalSteps = items.length;

//     if (!list) return;

//     gsap.set(progressBar, { width: "0%" });
//     gsap.set(list, { xPercent: 0 });

//     let tl = gsap.timeline({
//       scrollTrigger: {
//         trigger: mainWrap,
//         start: "top 15%",
//         end: `+=${totalSteps * 700}`,
//         scrub: 1,
//         pin: true,
//         anticipatePin: 1,
//         invalidateOnRefresh: true,
//         fastScrollEnd: true,
//         pinSpacing: true,
//       },
//     });

//     // 🔥 FIX: force initial sync
//     tl.set(list, { xPercent: 0 });
//     tl.set(progressBar, { width: "0%" });

//     items.forEach((item, index) => {
//       const progress = (index + 1) / totalSteps;
//       const current = images[index];
//       const prev = images[index - 1];

//       // 🔥 HORIZONTAL MOVE
//       tl.to(list, {
//         xPercent: -100 * index,
//         ease: "none",
//       });

//       // 🔥 PROGRESS
//       tl.to(
//         progressBar,
//         {
//           width: `${progress * 100}%`,
//           ease: "none",
//         },
//         "<"
//       );

//       // 🔥 IMAGE CROSSFADE
//       if (prev) {
//         tl.to(
//           prev,
//           {
//             opacity: 0,
//             duration: 0.3,
//             immediateRender: false,
//           },
//           "<"
//         );
//       }

//       tl.to(
//         current,
//         {
//           opacity: 1,
//           duration: 0.3,
//           immediateRender: false,
//         },
//         "<"
//       );

//       // 🔥 ITEM HIGHLIGHT
//       tl.to(
//         items,
//         {
//           opacity: 0.6,
//           duration: 0.2,
//         },
//         "<"
//       );

//       tl.to(
//         item,
//         {
//           opacity: 1,
//           duration: 0.2,
//         },
//         "<"
//       );
//     });
//   });
// }

function initWebinarPin() {
  const items = document.querySelectorAll(".s-webinar_item");
  const images = document.querySelectorAll(".s-webinar_visual_img_wrap");
  const progressBar = document.querySelector(".s-webinar_step_progress");
  const mainWrap = document.querySelector(".s-webinar_main_wrap");

  if (!items.length || !images.length || !progressBar || !mainWrap) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.set(images, { opacity: 0, zIndex: 0 });
  gsap.set(images[0], { opacity: 1, zIndex: 1 });
  gsap.set(items, { opacity: 0.6 });
  gsap.set(items[0], { opacity: 1 });

  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    const totalSteps = items.length;

    gsap.set(progressBar, { width: "0%" });

    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: mainWrap,
        start: "top 12%",
        end: `+=${totalSteps * 700}`,
        scrub: 1,
        pin: true,
        // anticipatePin: 1,
        invalidateOnRefresh: true,
        // fastScrollEnd: true,
        pinSpacing: true,
      },
    });

    tl.set(progressBar, { width: "0%" });

    items.forEach((item, index) => {
      const progress = (index + 1) / totalSteps;
      const current = images[index];
      const prev = images[index - 1];

      tl.to(progressBar, {
        width: `${progress * 100}%`,
        ease: "none",
      });

      if (prev) {
        tl.to(
          prev,
          {
            opacity: 0,
            duration: 0.3,
            immediateRender: false,
          },
          "<"
        );
      }

      tl.to(
        current,
        {
          opacity: 1,
          duration: 0.3,
          immediateRender: false,
        },
        "<"
      );

      tl.to(
        items,
        {
          opacity: 0.6,
          duration: 0.2,
        },
        "<"
      );

      tl.to(
        item,
        {
          opacity: 1,
          duration: 0.2,
        },
        "<"
      );
    });
  });

  mm.add("(max-width: 991px)", () => {
    const list = document.querySelector(".s-webinar_list");
    const totalSteps = items.length;

    if (!list) return;

    gsap.set(progressBar, { width: "0%" });
    gsap.set(list, { xPercent: 0 });

    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: mainWrap,
        start: "top 15%",
        end: `+=${totalSteps * 700}`,
        scrub: 1,
        pin: true,
        // anticipatePin: 1,
        invalidateOnRefresh: true,
        // fastScrollEnd: true,
        pinSpacing: true,
      },
    });

    tl.set(list, { xPercent: 0 });
    tl.set(progressBar, { width: "0%" });

    items.forEach((item, index) => {
      const progress = (index + 1) / totalSteps;
      const current = images[index];
      const prev = images[index - 1];

      tl.to(list, {
        xPercent: -100 * index,
        ease: "none",
      });

      tl.to(
        progressBar,
        {
          width: `${progress * 100}%`,
          ease: "none",
        },
        "<"
      );

      if (prev) {
        tl.to(
          prev,
          {
            opacity: 0,
            duration: 0.3,
            immediateRender: false,
          },
          "<"
        );
      }

      tl.to(
        current,
        {
          opacity: 1,
          duration: 0.3,
          immediateRender: false,
        },
        "<"
      );

      tl.to(
        items,
        {
          opacity: 0.6,
          duration: 0.2,
        },
        "<"
      );

      tl.to(
        item,
        {
          opacity: 1,
          duration: 0.2,
        },
        "<"
      );
    });
  });
}

function initWebinarSwiper() {
  const sliderEl = document.querySelector(".p-webinar_slider");

  if (!sliderEl) return;

  const webinarSwiper = new Swiper(sliderEl, {
    wrapperClass: "swiper-wrapper",
    slideClass: "p-webinar_slide",

    slidesPerView: 1,
    spaceBetween: 16,
    grabCursor: true,
    watchSlidesProgress: true,

    navigation: {
      nextEl: ".p-webinar_nav_wrap .button_arrow_wrap:last-child",
      prevEl: ".p-webinar_nav_wrap .button_arrow_wrap:first-child",
    },

    pagination: {
      el: ".p-webinar_main_progress_wrap",
      type: "progressbar",
    },

    breakpoints: {
      768: {
        slidesPerView: "auto",
        spaceBetween: 20,
      },
    },

    on: {
      init: function () {
        console.log("Webinar Swiper Initialized");
      },
    },
  });

  return webinarSwiper;
}

function initUpcomingWebinarSwiper() {
  const sliderEl = document.querySelector(".swiper.is-upcoming");

  if (!sliderEl) return;

  const webinarSwiper = new Swiper(sliderEl, {
    wrapperClass: "swiper-wrapper",
    slideClass: "swiper-slide",

    // Default: Mobile (< 768px)
    slidesPerView: 1,
    spaceBetween: 16,
    grabCursor: true,
    watchSlidesProgress: true,

    navigation: {
      nextEl: ".u-webinar_nav_wrap .button_arrow_wrap:last-child",
      prevEl: ".u-webinar_nav_wrap .button_arrow_wrap:first-child",
    },

    breakpoints: {
      // Tablet (768px - 991px)
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      // Desktop (>= 992px)
      992: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
    },

    on: {
      init: function () {
        console.log("Webinar Swiper Initialized");
      },
    },
  });

  return webinarSwiper;
}

function initAppSwiper() {
  const appSliderEl = document.querySelector(".i-app_slider");

  if (!appSliderEl) return;

  const appSwiper = new Swiper(appSliderEl, {
    wrapperClass: "swiper-wrapper",
    slideClass: "i-app_slide",

    slidesPerView: "auto",
    spaceBetween: 16,
    centeredSlides: false,
    grabCursor: true,

    navigation: {
      nextEl: ".i-app_nav_wrap .button_arrow_wrap:last-child",
      prevEl: ".i-app_nav_wrap .button_arrow_wrap:first-child",
    },

    speed: 600,
  });

  return appSwiper;
}

// function initSwiperCareer() {
//   const sliderContainer = document.querySelector(".p-career_slider");
//   if (!sliderContainer) return;

//   if (sliderContainer.swiper) return;
//   if (typeof Swiper === "undefined") return;

//   new Swiper(sliderContainer, {
//     slideClass: "p-career_slide",
//     slidesPerView: "auto",
//     spaceBetween: 16,
//     grabCursor: true,

//     navigation: {
//       nextEl: '.p-career_nav [data-slider-nav="next"]',
//       prevEl: '.p-career_nav [data-slider-nav="prev"]',
//     },
//   });
// }

function initSwiperCareer() {
  const sliderContainer = document.querySelector(".p-career_slider");
  if (!sliderContainer) return;
  if (typeof Swiper === "undefined") return;

  const destroyBreakpoint = window.matchMedia("(max-width: 767px)").matches;

  if (destroyBreakpoint) {
    if (sliderContainer.swiper) {
      sliderContainer.swiper.destroy(true, true);
    }

    return;
  }

  if (sliderContainer.swiper) return;

  new Swiper(sliderContainer, {
    slideClass: "p-career_slide",
    slidesPerView: "auto",
    spaceBetween: 16,
    grabCursor: true,

    navigation: {
      nextEl: '.p-career_nav [data-slider-nav="next"]',
      prevEl: '.p-career_nav [data-slider-nav="prev"]',
    },
  });
}

function processSlider() {
  let swiper = null;

  function handle() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile && !swiper) {
      swiper = new Swiper(".process_main_slider", {
        wrapperClass: "process_card_list",
        slideClass: "process_card",

        slidesPerView: 1.1,
        spaceBetween: 24,
        grabCursor: true,
      });
    }

    if (!isMobile && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  }

  handle();

  window.addEventListener("resize", handle);
}

function initPortoSlider() {
  let swiper = null;

  function handle() {
    const isMobile = window.matchMedia("(max-width: 991px)").matches;

    if (isMobile && !swiper) {
      swiper = new Swiper(".intro_slider", {
        wrapperClass: "intro_card_wrap",
        slideClass: "intro_card",

        slidesPerView: 1.1,
        spaceBetween: 20,
        grabCursor: true,
      });
    }

    if (!isMobile && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  }

  handle();

  window.addEventListener("resize", handle);
}

function initTestimonialSlider() {
  let swiper = null;

  function handle() {
    const isMobile = window.matchMedia("(max-width: 991px)").matches;

    if (isMobile && !swiper) {
      swiper = new Swiper(".testimonial_slider", {
        wrapperClass: "testimonial_card_wrap",
        slideClass: "testimonial_card",

        slidesPerView: 1.1,
        spaceBetween: 20,
        grabCursor: true,
      });
    }

    if (!isMobile && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  }

  handle();

  window.addEventListener("resize", handle);
}

function initTeamSlider() {
  let swiper = null;

  function handle() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile && !swiper) {
      swiper = new Swiper(".team_slider", {
        wrapperClass: "team_list",
        slideClass: "team_slide",

        slidesPerView: 1.1,
        spaceBetween: 20,
        grabCursor: true,
      });
    }

    if (!isMobile && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  }

  handle();

  window.addEventListener("resize", handle);
}

function initEventCareer() {
  let swiper = null;

  function handle() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile && !swiper) {
      swiper = new Swiper(".c-career_slider", {
        wrapperClass: "c-career_list",
        slideClass: "c-career_card",

        slidesPerView: 1.1,
        spaceBetween: 16,
        grabCursor: true,
      });
    }

    if (!isMobile && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  }

  handle();

  window.addEventListener("resize", handle);
}

document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".e-features_slider", {
    // Menggunakan class dari HTML Anda
    wrapperClass: "e-features",
    slideClass: "e-features_slide",

    // Konfigurasi Dasar
    slidesPerView: 1.1,
    spaceBetween: 16,
    loop: false,

    // Breakpoints untuk Responsif
    breakpoints: {
      640: {
        slidesPerView: "auto",
      },
      1024: {
        slidesPerView: "auto",
      },
    },

    // Navigasi
    navigation: {
      nextEl: '.e-features_nav [data-slider-nav="next"]',
      prevEl: '.e-features_nav [data-slider-nav="prev"]',
    },

    // Efek transisi (opsional)
    grabCursor: true,
  });
});

/* =========================================
    Swiper List End
    ========================================= */

    function initStructureAccordion() {
      const structureItems = document.querySelectorAll(".i-structure_item");
    
      if (!structureItems.length) return;
    
      // (1) timer bersama untuk delay saat kembali ke state "semua tertutup"
      const RESET_DELAY = 1200;
      let resetTimer;
    
      const updateItemsHeight = (activeItem = null) => {
        // (2) apa pun yang terjadi, batalkan reset yang masih antre
        clearTimeout(resetTimer);
    
        structureItems.forEach((item) => {
          const itemTriggerWrap = item.querySelector("[structure-data-trigger-wrapper]");
          const itemDetails = item.querySelector(".i-structure_details");
          const isOpen = itemDetails && itemDetails.hasAttribute("open");
    
          if (!itemTriggerWrap) return;
    
          itemTriggerWrap.style.transition = "height 0.3s ease, opacity 0.3s ease";
          itemTriggerWrap.style.overflow = "hidden";
    
          if (activeItem === null) {
            itemTriggerWrap.style.height = "";
            itemTriggerWrap.style.visibility = "visible";
            itemTriggerWrap.style.opacity = "1";
          } else if (item === activeItem) {
            itemTriggerWrap.style.height = "0px";
            itemTriggerWrap.style.visibility = "hidden";
            itemTriggerWrap.style.opacity = "0";
          } else {
            itemTriggerWrap.style.height = "auto";
            itemTriggerWrap.style.visibility = "visible";
            itemTriggerWrap.style.opacity = "1";
          }
        });
    
        // (3) tinggi CARD-nya sendiri
        if (activeItem === null) {
          // semua tertutup → tunggu 1.6s baru balik sejajar (height:100% dari CSS)
          resetTimer = setTimeout(() => {
            structureItems.forEach((item) => {
              item.style.height = "";
            });
          }, RESET_DELAY);
        } else {
          // ada yang open → langsung auto, tanpa delay
          structureItems.forEach((item) => {
            item.style.height = "auto";
          });
        }
      };
    
      structureItems.forEach((item) => {
        const triggerWrap = item.querySelector("[structure-data-trigger-wrapper]");
        const trigger = item.querySelector("[structure-data-trigger]");
        const details = item.querySelector(".i-structure_details");
        const statusElements = item.querySelectorAll("[structure-data-status]");
        const closeTrigger = item.querySelector("[structure-data-trigger='close']");
    
        if (!triggerWrap || !trigger || !details) return;
    
        const closeItem = () => {
          details.removeAttribute("open");
    
          statusElements.forEach((el) =>
            el.setAttribute("structure-data-status", "not-active")
          );
    
          const anyOpen = Array.from(structureItems).some((i) => {
            const d = i.querySelector(".i-structure_details");
            return d && d.hasAttribute("open");
          });
    
          if (!anyOpen) {
            updateItemsHeight(null);
          } else {
            const currentActive = Array.from(structureItems).find((i) => {
              const d = i.querySelector(".i-structure_details");
              return d && d.hasAttribute("open");
            });
            updateItemsHeight(currentActive);
          }
        };
    
        if (closeTrigger) {
          closeTrigger.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeItem();
          });
        }
    
        trigger.addEventListener("click", (e) => {
          e.preventDefault();
    
          details.setAttribute("open", "");
          statusElements.forEach((el) =>
            el.setAttribute("structure-data-status", "active")
          );
    
          structureItems.forEach((otherItem) => {
            if (otherItem === item) return;
            const otherDetails = otherItem.querySelector(".i-structure_details");
            const otherStatusElements = otherItem.querySelectorAll("[structure-data-status]");
    
            if (otherDetails) otherDetails.removeAttribute("open");
            otherStatusElements.forEach((el) =>
              el.setAttribute("structure-data-status", "not-active")
            );
          });
    
          updateItemsHeight(item);
        });
      });
    }

function initScrubProgress() {
  const container = document.querySelector(".c-app_list");
  const dots = document.querySelectorAll(".c-app_line_progress_dot");
  const lines = document.querySelectorAll(".c-app_line_progress");
  const cards = document.querySelectorAll(".c-app_wrap .icon_card_utility");

  if (!container || dots.length === 0) return;

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(lines, {
      opacity: 0.4,
      scaleY: 0,
      transformOrigin: "top center",
    });
    gsap.set(dots, { opacity: 0.4 });
    gsap.set(cards, { opacity: 0.4 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 70%",
        end: "bottom 70%",
        scrub: 1,
      },
    });

    tl.to([dots[0], cards[0]], {
      opacity: 1,
      duration: 0.2,
    });

    cards.forEach((card, index) => {
      if (lines[index]) {
        tl.to(lines[index], {
          scaleY: 1,
          opacity: 1,
          duration: 1,
          ease: "none",
        });
      }

      if (dots[index + 1]) {
        tl.to(
          [dots[index + 1], cards[index + 1]],
          {
            opacity: 1,
            duration: 0.3,
            ease: "power1.out",
          },
          "-=0.2"
        );
      }
    });
  }
}

function initDetectScrollingDirection() {
  let lastScrollTop = 0;
  let scrollTimeout;

  let isScrolling = false;

  const threshold = 10;

  const thresholdTop = 50;

  const scrollStopDelay = 150;

  window.addEventListener("scroll", () => {
    const nowScrollTop = window.scrollY;

    if (!isScrolling) {
      isScrolling = true;
      document
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "false"));
    }

    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document
        .querySelectorAll("[data-scrolling-stopped]")
        .forEach((el) => el.setAttribute("data-scrolling-stopped", "true"));
    }, scrollStopDelay);

    if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
      const direction = nowScrollTop > lastScrollTop ? "down" : "up";
      document
        .querySelectorAll("[data-scrolling-direction]")
        .forEach((el) =>
          el.setAttribute("data-scrolling-direction", direction)
        );

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

/* =========================================
     Step
     ========================================= */
function initStep() {
  gsap.registerPlugin(ScrollTrigger);

  const stepWraps = document.querySelectorAll('[data-step="wrap"]');
  if (stepWraps.length === 0) return;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    stepWraps.forEach((stepWrap) => {
      const steps = stepWrap.querySelectorAll('[data-step="item"]');
      const progressBars = stepWrap.querySelectorAll('[data-step="progress"]');
      const dots = stepWrap.querySelectorAll('[data-step="dot"]');

      gsap.set(steps, { opacity: 0.4 });
      gsap.set(dots, { opacity: 0 });
      gsap.set(progressBars, { scaleX: 0, transformOrigin: "left" });

      const tl = gsap.timeline({
        // repeat: -1,
        paused: true,
        defaults: { ease: "none" },
      });

      tl.to(steps[0], { opacity: 1, duration: 0.3 })
        .to(progressBars[0], { scaleX: 1, duration: 1.5 })
        .to(dots[0], { opacity: 1, duration: 0.3 })
        .to(steps[1], { opacity: 1, duration: 0.3 }, "<")
        .to(progressBars[1], { scaleX: 1, duration: 1.5 })
        .to(dots[1], { opacity: 1, duration: 0.3 })
        .to(steps[2], { opacity: 1, duration: 0.3 }, "<")
        .to(progressBars[2], { scaleX: 1, duration: 1.5 })
        .to({}, { duration: 1.5 });

      ScrollTrigger.create({
        trigger: stepWrap,
        start: "top 90%",
        onEnter: () => tl.play(),
        onEnterBack: () => tl.restart(),
        onLeave: () => tl.pause(0),
        onLeaveBack: () => tl.pause(0),
        invalidateOnRefresh: true,
      });
    });
  });
}

// function initStep() {
//   gsap.registerPlugin(ScrollTrigger);

//   const stepWrap = document.querySelector(".strategy_step_wrap");
//   if (!stepWrap) return;

//   const steps = stepWrap.querySelectorAll(".strategy_step_item");
//   const progressBars = stepWrap.querySelectorAll(".strategy_step_progress");
//   const dots = stepWrap.querySelectorAll(".strategy_step_progress_dot");

//   let mm = gsap.matchMedia();

//   mm.add("(min-width: 992px)", () => {
//     gsap.set(steps, { opacity: 0.4 });
//     gsap.set(dots, { opacity: 0 });
//     gsap.set(progressBars, { scaleX: 0, transformOrigin: "left" });

//     const tl = gsap.timeline({
//       repeat: -1,
//       paused: true,
//       defaults: { ease: "none" },
//     });

//     tl.to(steps[0], { opacity: 1, duration: 0.5 })
//       .to(progressBars[0], { scaleX: 1, duration: 2.5 })
//       .to(dots[0], { opacity: 1, duration: 0.3 })
//       .to(steps[1], { opacity: 1, duration: 0.5 }, "<")
//       .to(progressBars[1], { scaleX: 1, duration: 2.5 })
//       .to(dots[1], { opacity: 1, duration: 0.3 })
//       .to(steps[2], { opacity: 1, duration: 0.5 }, "<")
//       .to(progressBars[2], { scaleX: 1, duration: 2.5 })
//       .to({}, { duration: 1.5 });

//     ScrollTrigger.create({
//       trigger: stepWrap,
//       start: "top 90%",
//       onEnter: () => tl.play(),
//       onEnterBack: () => tl.restart(),
//       onLeave: () => tl.pause(0),
//       onLeaveBack: () => tl.pause(0),
//       invalidateOnRefresh: true,
//     });
//   });
// }

function initProcessSliderSecond() {
  const container = document.querySelector(".f-prosess_slider");
  if (!container) return;

  const prevBtn = document.querySelector(
    ".f-prosess_nav_wrap .button_arrow_wrap:first-child"
  );
  const nextBtn = document.querySelector(
    ".f-prosess_nav_wrap .button_arrow_wrap:last-child"
  );

  const progressBar = document.querySelector(".f-prosess_main_progress");

  const swiper = new Swiper(container, {
    slideClass: "f-prosess_slide",
    wrapperClass: "swiper-wrapper",

    slidesPerView: "auto",
    spaceBetween: 20,

    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 16,
      },
      768: {
        slidesPerView: "auto",
        spaceBetween: 20,
      },
    },

    navigation: {
      prevEl: prevBtn,
      nextEl: nextBtn,
    },

    on: {
      init: function () {
        updateProgress(this);
      },
      progress: function () {
        updateProgress(this);
      },
    },
  });

  function updateProgress(swiper) {
    if (!progressBar) return;
    progressBar.style.width = swiper.progress * 100 + "%";
  }
}

/* =========================================
     Card Stack Pin
     ========================================= */
function initFeaturesWorkflow() {
  const sections = document.querySelectorAll(".s-features_wrap");

  if (sections.length === 0) return;

  sections.forEach((element) => {
    // Re-initialization check
    if (element.dataset.scriptInitialized) return;
    element.dataset.scriptInitialized = "true";

    const section = element;
    const steps = [...section.querySelectorAll(".s-features_step_item_wrap")];
    const cards = [...section.querySelectorAll(".s-features_card_wrap")];
    const lineActive = section.querySelector(".s-features_step_line_active");
    const totalSteps = steps.length;
    const MOBILE_BP = 991;

    let currentIndex = -1;

    // Helper: Circular index untuk rotasi kartu
    function wrapIndex(i) {
      return ((i % totalSteps) + totalSteps) % totalSteps;
    }

    // Fungsi aktivasi step & accordion
    function activateStep(index) {
      if (index === currentIndex) return;
      currentIndex = index;

      steps.forEach((step, i) => {
        step.classList.toggle("is-active", i === index);
      });

      animateCards(index);
    }

    // Fungsi animasi kartu (Stacking effect)
    function animateCards(activeIndex) {
      const frontIdx = activeIndex;
      const secondIdx = wrapIndex(activeIndex - 1);
      const thirdIdx = wrapIndex(activeIndex - 2);

      cards.forEach((card, i) => {
        gsap.killTweensOf(card);
        const icon = card.querySelector(".s-features_card_icon");
        const blocksWrap = card.querySelector(".s-features_card_blocks_wrap");

        if (i === frontIdx) {
          gsap.to(card, {
            opacity: 1,
            right: "0%",
            bottom: "25%",
            zIndex: 3,
            duration: 0.5,
            ease: "power2.out",
          });
          if (icon) gsap.to(icon, { color: "#FFFFA0", duration: 0.4 });
          if (blocksWrap)
            gsap.to(blocksWrap, { opacity: 1, duration: 0.4, delay: 0.2 });
        } else if (i === secondIdx) {
          gsap.to(card, {
            opacity: 0.7,
            right: "5%",
            bottom: "35%",
            zIndex: 2,
            duration: 0.5,
            ease: "power2.out",
          });
          if (icon) gsap.to(icon, { color: "currentColor", duration: 0.3 });
          if (blocksWrap) gsap.to(blocksWrap, { opacity: 0, duration: 0.3 });
        } else if (i === thirdIdx) {
          gsap.to(card, {
            opacity: 0.4,
            right: "10%",
            bottom: "45%",
            zIndex: 1,
            duration: 0.5,
            ease: "power2.out",
          });
          if (icon) gsap.to(icon, { color: "currentColor", duration: 0.3 });
          if (blocksWrap) gsap.to(blocksWrap, { opacity: 0, duration: 0.3 });
        } else {
          gsap.to(card, {
            opacity: 0,
            right: "15%",
            bottom: "55%",
            zIndex: 0,
            duration: 0.4,
            ease: "power2.out",
          });
          if (icon) gsap.to(icon, { color: "currentColor", duration: 0.3 });
          if (blocksWrap) gsap.to(blocksWrap, { opacity: 0, duration: 0.2 });
        }
      });
    }

    // Media Queries menggunakan GSAP MatchMedia
    let mm = gsap.matchMedia();

    // DESKTOP: Pinning 500svh
    mm.add(`(min-width: ${MOBILE_BP + 1}px)`, () => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=3000svh",
        pin: true,
        pinSpacing: true,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Update Progress Line
          if (lineActive) {
            gsap.set(lineActive, { height: progress * 100 + "%" });
          }

          // Hitung index aktif berdasarkan scroll
          const stepIndex = Math.min(
            Math.floor(progress * totalSteps),
            totalSteps - 1
          );
          activateStep(stepIndex);
        },
      });
    });

    // MOBILE: Click Interaction
    mm.add(`(max-width: ${MOBILE_BP}px)`, () => {
      activateStep(0);

      steps.forEach((step, index) => {
        const clickHandler = () => {
          activateStep(index);
          if (lineActive) {
            gsap.to(lineActive, {
              height: ((index + 1) / totalSteps) * 100 + "%",
              duration: 0.4,
            });
          }
        };
        step.addEventListener("click", clickHandler);
      });
    });
  });
}

/* =========================================
     Heading Anim
     ========================================= */
function initHeadingAnimations() {
  const headings = document.querySelectorAll("[data-heading-animation]");

  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    headings.forEach((el, index) => {
      if (el.getAttribute("data-heading-animation") === "false") return;

      const split = new SplitText(el, {
        type: "lines,words",
        linesClass: "line",
        wordsClass: "word",
        mask: "words",
      });

      gsap.from(split.words, {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
        },
        delay: index === 1 ? 0.3 : 0,
        duration: 1,
        yPercent: 105,
        ease: "power3.out",
        stagger: 0.05,
        onComplete: () => split.revert(),
      });
    });
  });
}

// Validation
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

function initHideNavOnScroll() {
  const navComponents = document.querySelectorAll(".nav_component");
  if (!navComponents.length) return;

  gsap.registerPlugin(ScrollTrigger);

  navComponents.forEach((component) => {
    if (component.hasAttribute("data-nav-1")) return;
    component.setAttribute("data-nav-1", "");

    let lastDirection;
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (lastDirection === self.direction) return;
        lastDirection = self.direction;
        
        if (self.direction === 1) {
          component.classList.add("is-hidden");
        } else {
          component.classList.remove("is-hidden");
        }
      }
    });
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initHideNavOnScroll();
  initStructureAccordion();
  initWebinarPin();
  initSwiperCareer();
  initDetectScrollingDirection();
  // processSlider();
  initNumberOdometer();
  initStep();
  initProcessSliderSecond();
  initWebinarSwiper();
  initUpcomingWebinarSwiper();
  initTestimonialSlider();
  initAppSwiper();
  initScrubProgress();
  // initPortoSlider();
  initTeamSlider();
  initFeaturesWorkflow();
  initEventCareer();
  initHeadingAnimations();
  emailValidation();
  telInputValidation();
});

// Stripe Via JS
const cartState = {
  items: [],
  template: null,
};

// Format tampilan mata uang ke Euro (Format Jerman)
const formatCurrency = (num) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(num);
};

// Hitung total belanjaan dan jumlah item di icon cart
const calculateTotals = () => {
  const totalDisplay = document.querySelector('[data-cart-element="subtotal"]');
  const countDisplay = document.querySelector(".shop_cart_count");

  const totals = cartState.items.reduce(
    (acc, item) => {
      acc.price += item.price * item.qty;
      acc.count += item.qty;
      return acc;
    },
    { price: 0, count: 0 }
  );

  if (totalDisplay) {
    totalDisplay.innerText = formatCurrency(totals.price)
      .replace("€", "")
      .trim();
  }
  if (countDisplay) {
    countDisplay.innerText = totals.count;
  }
};

// Render ulang isi keranjang belanja secara dinamis
const updateCartUI = () => {
  const container = document.querySelector('[data-cart="container"]');
  const cartWrap = document.querySelector(".shop_cart_list_wrap");

  if (!container || !cartState.template) return;

  // Logika Sembunyikan/Munculkan Bungkus Keranjang Belanja
  if (cartState.items.length === 0) {
    if (cartWrap) cartWrap.style.display = "none";
    container.innerHTML = "";
    calculateTotals();
    return;
  } else {
    if (cartWrap) cartWrap.style.display = "flex";
  }

  container.innerHTML = "";

  cartState.items.forEach((item, index) => {
    const node = cartState.template.cloneNode(true);

    const img = node.querySelector('[data-cart-element="image"]');
    const name = node.querySelector('[data-cart-element="name"]');
    const price = node.querySelector('[data-cart-element="price"]');
    const qtyText = node.querySelector('[data-cart-element="qty"]');
    const removeBtn = node.querySelector('[data-cart-element="remove"]');
    const plusBtn = node.querySelector('[data-cart-element="plus"]');
    const minBtn = node.querySelector('[data-cart-element="minus"]');

    if (img) {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.setAttribute("src", item.image);
    }
    if (name) name.innerText = item.name;
    if (price) price.innerText = item.price;
    if (qtyText) qtyText.innerText = item.qty;

    if (removeBtn)
      removeBtn.onclick = () => {
        cartState.items.splice(index, 1);
        updateCartUI();
      };

    if (plusBtn)
      plusBtn.onclick = () => {
        cartState.items[index].qty++;
        updateCartUI();
      };

    if (minBtn)
      minBtn.onclick = () => {
        if (cartState.items[index].qty > 1) {
          cartState.items[index].qty--;
        } else {
          cartState.items.splice(index, 1);
        }
        updateCartUI();
      };

    container.appendChild(node);
  });

  calculateTotals();
};

// Logika membaca atribut elemen ketika klik "Add to Cart"
const addToCart = (wrapper) => {
  const stripeId =
    wrapper.querySelector("[data-stripe-id]")?.getAttribute("data-stripe-id") ||
    wrapper.querySelector("[data-stripe-id]")?.innerText;
  const name =
    wrapper.querySelector("[data-name]")?.getAttribute("data-name") ||
    wrapper.querySelector("[data-name]")?.innerText;
  const rawPrice =
    wrapper.querySelector("[data-price]")?.getAttribute("data-price") ||
    wrapper.querySelector("[data-price]")?.innerText;

  const imgElement = wrapper.querySelector('[data-item="image"]');
  const image = imgElement
    ? imgElement.currentSrc || imgElement.getAttribute("src")
    : "";

  const qtyElem = wrapper.querySelector('[data-quantity="text"]');
  const qty = parseInt(qtyElem.innerText) || 0;

  if (qty <= 0 || !stripeId) return;

  const price = parseFloat(rawPrice.replace(/[^0-9,.]/g, "").replace(",", "."));

  const existing = cartState.items.find((i) => i.stripeId === stripeId);
  if (existing) {
    existing.qty += qty;
  } else {
    cartState.items.push({ stripeId, name, price, image, qty });
  }

  qtyElem.innerText = "0";
  updateCartUI();
};

// Inisialisasi Utama (Event Delegation)
const initMaster = () => {
  const firstItem = document.querySelector(".shop_cart_item");
  if (firstItem) {
    cartState.template = firstItem.cloneNode(true);
    firstItem.remove();
  }

  updateCartUI();

  // Menangani semua interaksi klik lewat satu handler global
  document.addEventListener("click", async (e) => {
    const catalogPlus = e.target.closest('[data-quantity="plus-button"]');
    const catalogMin = e.target.closest('[data-quantity="min-button"]');
    const addBtn = e.target.closest('[data-action="add-to-cart"]');
    const checkoutBtn = e.target.closest('[data-action="checkout"]');

    if (catalogPlus || catalogMin) {
      const wrap = (catalogPlus || catalogMin).closest(".shop_item_wrap");
      const txt = wrap.querySelector('[data-quantity="text"]');
      let val = parseInt(txt.innerText) || 0;
      txt.innerText = catalogPlus ? val + 1 : val > 0 ? val - 1 : 0;
      return;
    }

    if (addBtn) {
      e.preventDefault();
      addToCart(addBtn.closest(".shop_item_wrap"));
      return;
    }

    // PERBAIKAN UTAMA: Langsung eksekusi fetch, tidak ditumpuk addEventListener lagi
    if (checkoutBtn) {
      e.preventDefault();

      if (cartState.items.length === 0) return alert("Warenkorb ist leer!");

      // Tampilkan status loading pada teks tombol
      const btnText =
        checkoutBtn.querySelector(".button_main_text") || checkoutBtn;
      const originalText = btnText.innerText;
      btnText.innerText = "Processing...";

      const payload = {
        items: cartState.items.map((item) => ({
          stripeId: item.stripeId,
          quantity: item.qty,
        })),
      };

      try {
        // Menggunakan URL Cloudflare Worker live milikmu
        const response = await fetch(
          "https://xcapital.autumn-haze-9b8a.workers.dev/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url; // Alihkan user ke portal bayar Stripe
        } else {
          throw new Error(data.error || "Unerwarteter Fehler");
        }
      } catch (err) {
        console.error("Checkout failed:", err);
        alert("Checkout Error: " + err.message);
        btnText.innerText = originalText; // Kembalikan teks tombol jika gagal
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", initMaster);


