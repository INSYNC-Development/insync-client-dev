document.addEventListener("DOMContentLoaded", () => {
  const btnWraps = document.querySelectorAll("[data-huly-btn]");
  if (!btnWraps.length) return;

  btnWraps.forEach((btnWrap) => {
    const cta = btnWrap.querySelector(".button_cta");
    const gradient = btnWrap.querySelector("[data-gradient]");
    const outerGlows = btnWrap.querySelectorAll("[data-outer-glow]");

    const CENTER_DEAD_ZONE = 0.25;
    const REST_ANGLE = 90;
    const REST_OPACITY = 1;

    let isInitialized = false; // ← flag

    // ── Helpers ──
    function getCtaRect() {
      return cta.getBoundingClientRect();
    }

    function getGradientWidth() {
      return gradient.getBoundingClientRect().width;
    }

    function getRestX() {
      const ctaWidth = getCtaRect().width;
      const gradWidth = getGradientWidth();
      return ctaWidth * 0.85 - gradWidth / 2;
    }

    // ── Init: dipanggil lazy, hanya sekali saat button visible ──
    function init() {
      if (isInitialized) return;

      // Pastikan dimensi sudah valid (dialog sudah visible)
      if (getCtaRect().width === 0) return;

      gsap.set(gradient, { x: getRestX() });

      outerGlows.forEach((el) => {
        gsap.set(el, {
          "--glow-angle": `${REST_ANGLE}deg`,
          opacity: REST_OPACITY,
        });
      });

      isInitialized = true;
    }

    // ── Outer glow ──
    function getGlowParams(normalizedX) {
      const distFromCenter = Math.abs(normalizedX - 0.5) * 2;
      const opacity =
        distFromCenter <= CENTER_DEAD_ZONE
          ? 0
          : gsap.utils.mapRange(CENTER_DEAD_ZONE, 1, 0, 1, distFromCenter);
      const angle = gsap.utils.interpolate(270, 90, normalizedX);
      return { angle, opacity };
    }

    function updateOuterGlow(normalizedX) {
      const { angle, opacity } = getGlowParams(normalizedX);
      outerGlows.forEach((el) => {
        gsap.to(el, {
          "--glow-angle": `${angle}deg`,
          opacity,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    }

    function resetOuterGlow() {
      outerGlows.forEach((el) => {
        gsap.to(el, {
          "--glow-angle": `${REST_ANGLE}deg`,
          opacity: REST_OPACITY,
          delay: 0.3,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    }

    // ── Gradient ──
    function moveGradient(e) {
      const rect = getCtaRect();
      const gradWidth = getGradientWidth();
      const mouseX = e.clientX - rect.left;
      const targetX = mouseX - gradWidth / 2;

      gsap.to(gradient, {
        x: targetX,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    function resetGradient() {
      gsap.to(gradient, {
        x: getRestX(),
        duration: 0.9,
        delay: 0.3,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // ── Events ──
    cta.addEventListener("mouseenter", (e) => {
      init(); // ← lazy init di sini

      const rect = getCtaRect();
      const mouseX = e.clientX - rect.left;
      const gradWidth = getGradientWidth();

      // Snap langsung ke cursor saat pertama masuk
      gsap.set(gradient, { x: mouseX - gradWidth / 2 });

      const normalizedX = gsap.utils.clamp(0, 1, mouseX / rect.width);
      updateOuterGlow(normalizedX);
    });

    cta.addEventListener("mousemove", (e) => {
      const rect = getCtaRect();
      const normalizedX = gsap.utils.clamp(
        0,
        1,
        (e.clientX - rect.left) / rect.width
      );
      moveGradient(e);
      updateOuterGlow(normalizedX);
    });

    cta.addEventListener("mouseleave", () => {
      resetGradient();
      resetOuterGlow();
    });
  });
});

// const heroHoverAnim = () => {
//   const target = document.querySelector(".hero_bg_wrap");
//   const imgVisual = document.querySelector(".hero_bg_visual_wrap");

//   target.addEventListener("mousemove", (e) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const el = imgVisual;
//     if (el) {
//       el.style.setProperty("--mx", `${x}px`);
//       el.style.setProperty("--my", `${y}px`);
//     }
//   });

//   target.addEventListener("mouseleave", (e) => {
//     const el = imgVisual;
//     if (el) {
//       el.style.setProperty("--mx", "-9999px");
//       el.style.setProperty("--my", "-9999px");
//     }
//   });
// };

function heroHoverAnim() {
  const container = document.querySelector(".hero_contain");
  const target = document.querySelector(".hero_bg_visual_wrap");

  if (!container || !target) return;

  let idleTween;

  // Move mask randomly when user is not interacting
  const startIdle = () => {
    idleTween = gsap.to(target, {
      "--mx": gsap.utils.random(20, 80) + "%",
      "--my": gsap.utils.random(20, 80) + "%",
      duration: gsap.utils.random(3, 6),
      ease: "sine.inOut",
      onComplete: startIdle,
    });
  };

  // Follow mouse cursor
  // const onMove = (e) => {
  //   const rect = container.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;

  //   gsap.to(target, {
  //     "--mx": x + "px",
  //     "--my": y + "px",
  //     duration: 0.6,
  //     ease: "power2.out",
  //     overwrite: "auto",
  //   });
  // };

  // Switch to mouse tracking
  // const onEnter = () => {
  //   if (idleTween) idleTween.kill();
  //   container.addEventListener("mousemove", onMove);
  // };

  // // Switch back to idle
  // const onLeave = () => {
  //   container.removeEventListener("mousemove", onMove);
  //   startIdle();
  // };

  // // Init listeners and start
  // container.addEventListener("mouseenter", onEnter);
  // container.addEventListener("mouseleave", onLeave);
  startIdle();
}

function setFullWidthFontSize() {
  $("[data-text='full-width']").each(function () {
    let parentWidth = $(this).width();
    let child = $(this).children();

    let fontSize = 0.5;
    child.css("font-size", fontSize + "cqw");
    while (child.width() < parentWidth) {
      fontSize += 0.1;
      child.css("font-size", fontSize + "cqw");
    }
    fontSize -= 0.1;
    child.css("font-size", fontSize + "cqw");
  });
}

// const testimonialMarquee = () => {
//   // Select all the <h4> elements inside the rail container as an array
//   const scrollingText = gsap.utils.toArray(
//     ".testimonial_content_list .testimonial_item_wrap"
//   );

//   if (!scrollingText.length) return;
//   // Create a horizontal looping animation on the text elements, repeating infinitely
//   const tl = horizontalLoop(scrollingText, {
//     repeat: -1, // Infinite repeat
//   });

//   // Variable to store current speed tween animation (for smooth speed changes)
//   let speedTween;

//   // Create a ScrollTrigger instance to control speed of scrolling text based on scroll
//   ScrollTrigger.create({
//     trigger: ".testimonial_wrap", // Element that triggers scroll animations
//     start: "top bottom", // When top of trigger hits bottom of viewport
//     end: "bottom top", // Until bottom of trigger hits top of viewport
//     onUpdate: (self) => {
//       // On every scroll update
//       // Kill previous speed animation if any to avoid stacking tweens
//       if (speedTween) speedTween.kill();

//       // Create a new timeline to animate the speed of the horizontal scroll
//       speedTween = gsap
//         .timeline()
//         .to(tl, {
//           timeScale: 1.5 * self.direction, // Speed up animation 3x in scroll direction
//           duration: 0.25, // Over 0.25 seconds
//         })
//         .to(
//           tl,
//           {
//             timeScale: 1 * self.direction, // Then slow back to normal speed in scroll direction
//             duration: 1.5, // Over 1.5 seconds
//           },
//           "+=0.5"
//         ); // Start this tween after 0.5 second delay
//     },
//     markers: false, // Disable visual markers (set to true if you want debug markers)
//   });

//   // Function to create an infinitely looping horizontal animation on given items
//   function horizontalLoop(items, config) {
//     items = gsap.utils.toArray(items); // Ensure items is an array
//     if (!items.length) {
//       return;
//     }

//     config = config || {}; // Use config or empty object if none provided

//     // Create a timeline for animation, repeat and paused can be configured
//     let tl = gsap.timeline({
//       repeat: config.repeat,
//       paused: config.paused,
//       defaults: { ease: "none" }, // Linear easing
//       onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100), // Loop logic when reversed
//     });

//     // Store lengths and positions for calculations
//     let length = items.length,
//       startX = items[0].offsetLeft,
//       times = [],
//       widths = [],
//       xPercents = [],
//       curIndex = 0,
//       pixelsPerSecond = (config.speed || 1) * 100,
//       snap =
//         config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // Snapping helper for smoothness
//       totalWidth,
//       curX,
//       distanceToStart,
//       distanceToLoop,
//       item,
//       i;

//     // Convert 'x' values to percentages for responsive animation and cache widths
//     gsap.set(items, {
//       xPercent: (i, el) => {
//         let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
//         xPercents[i] = snap(
//           (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
//             gsap.getProperty(el, "xPercent")
//         );
//         return xPercents[i];
//       },
//     });

//     // Reset x position to zero for all items before animation
//     gsap.set(items, { x: 0 });

//     // Calculate total width of all items combined including scale and padding
//     totalWidth =
//       items[length - 1].offsetLeft +
//       (xPercents[length - 1] / 100) * widths[length - 1] -
//       startX +
//       items[length - 1].offsetWidth *
//         gsap.getProperty(items[length - 1], "scaleX") +
//       (parseFloat(config.paddingRight) || 0);

//     // Loop through each item to set its animation on the timeline
//     for (i = 0; i < length; i++) {
//       item = items[i];
//       curX = (xPercents[i] / 100) * widths[i];
//       distanceToStart = item.offsetLeft + curX - startX;
//       distanceToLoop =
//         distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

//       // Move each item to the left (looping) over a duration based on its width and speed
//       tl.to(
//         item,
//         {
//           xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
//           duration: distanceToLoop / pixelsPerSecond,
//         },
//         0
//       )
//         // Then move the item instantly back to right outside the loop to create the loop illusion
//         .fromTo(
//           item,
//           {
//             xPercent: snap(
//               ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
//             ),
//           },
//           {
//             xPercent: xPercents[i],
//             duration:
//               (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
//             immediateRender: false,
//           },
//           distanceToLoop / pixelsPerSecond
//         )
//         .add("label" + i, distanceToStart / pixelsPerSecond); // Label for timeline sync

//       times[i] = distanceToStart / pixelsPerSecond; // Store time position for this item
//     }

//     // Function to animate to a specific index in the timeline, with wrapping for smoothness
//     function toIndex(index, vars) {
//       vars = vars || {};

//       if (Math.abs(index - curIndex) > length / 2) {
//         index += index > curIndex ? -length : length; // Go shortest direction
//       }

//       let newIndex = gsap.utils.wrap(0, length, index),
//         time = times[newIndex];

//       if (time > tl.time() !== index > curIndex) {
//         vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
//         time += tl.duration() * (index > curIndex ? 1 : -1);
//       }

//       curIndex = newIndex;
//       vars.overwrite = true;

//       return tl.tweenTo(time, vars);
//     }

//     // Helper methods for controlling the timeline externally
//     tl.next = (vars) => toIndex(curIndex + 1, vars);
//     tl.previous = (vars) => toIndex(curIndex - 1, vars);
//     tl.current = () => curIndex;
//     tl.toIndex = (index, vars) => toIndex(index, vars);
//     tl.times = times;

//     // Pre-render the timeline for performance optimization
//     tl.progress(1, true).progress(0, true);

//     if (config.reversed) {
//       tl.vars.onReverseComplete();
//       tl.reverse();
//     }

//     return tl; // Return the created timeline to the caller
//   }
// };

const testimonialMarquee = () => {
  // Select the specific track containers (rows) instead of all items at once
  const rows = gsap.utils.toArray(".testimonial_content_list");

  if (!rows.length) return;

  rows.forEach((row) => {
    // Select items scoped to this specific row
    const items = row.querySelectorAll(".testimonial_item_wrap");

    // Check if this row has the reverse attribute
    const isReverse = row.hasAttribute("reverse");

    // Create the marquee for this row
    const tl = horizontalLoop(items, {
      repeat: -1,
      reversed: isReverse, // Pass the reverse flag to the helper config
    });

    // Variable to store current speed tween animation
    let speedTween;

    // Create ScrollTrigger for this specific row
    ScrollTrigger.create({
      trigger: ".testimonial_wrap",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        if (speedTween) speedTween.kill();

        // Calculate direction multiplier:
        // If row is reverse, we invert the timeScale logic to keep it moving Right
        const directionFactor = isReverse ? -1 : 1;

        speedTween = gsap
          .timeline()
          .to(tl, {
            timeScale: 1.5 * self.direction * directionFactor,
            duration: 0.25,
          })
          .to(
            tl,
            {
              timeScale: 1 * self.direction * directionFactor,
              duration: 1.5,
            },
            "+=0.5"
          );
      },
      markers: false,
    });
  });

  // --- No changes made to the helper function below ---
  function horizontalLoop(items, config) {
    items = gsap.utils.toArray(items);
    if (!items.length) {
      return;
    }

    config = config || {};

    let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
    });

    let length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      xPercents = [],
      curIndex = 0,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
      totalWidth,
      curX,
      distanceToStart,
      distanceToLoop,
      item,
      i;

    gsap.set(items, {
      xPercent: (i, el) => {
        let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
            gsap.getProperty(el, "xPercent")
        );
        return xPercents[i];
      },
    });

    gsap.set(items, { x: 0 });

    totalWidth =
      items[length - 1].offsetLeft +
      (xPercents[length - 1] / 100) * widths[length - 1] -
      startX +
      items[length - 1].offsetWidth *
        gsap.getProperty(items[length - 1], "scaleX") +
      (parseFloat(config.paddingRight) || 0);

    for (i = 0; i < length; i++) {
      item = items[i];
      curX = (xPercents[i] / 100) * widths[i];
      distanceToStart = item.offsetLeft + curX - startX;
      distanceToLoop =
        distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0
      )
        .fromTo(
          item,
          {
            xPercent: snap(
              ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
            ),
          },
          {
            xPercent: xPercents[i],
            duration:
              (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond
        )
        .add("label" + i, distanceToStart / pixelsPerSecond);

      times[i] = distanceToStart / pixelsPerSecond;
    }

    function toIndex(index, vars) {
      vars = vars || {};

      if (Math.abs(index - curIndex) > length / 2) {
        index += index > curIndex ? -length : length;
      }

      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];

      if (time > tl.time() !== index > curIndex) {
        vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }

      curIndex = newIndex;
      vars.overwrite = true;

      return tl.tweenTo(time, vars);
    }

    tl.next = (vars) => toIndex(curIndex + 1, vars);
    tl.previous = (vars) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.times = times;

    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }

    return tl;
  }
};

const riveAnim = () => {
  const wrap = document.querySelector(".function_wrap");
  if (!wrap) return;
  const items = wrap.querySelectorAll(".function_item_wrap");
  if (!items.length) return;

  const layout = new rive.Layout({
    fit: rive.Fit.Cover, // Change to: Fit.Contain, or Cover
    layoutScaleFactor: 1,
  });

  const RIVEURL =
    "https://cdn.prod.website-files.com/6985a0387baa89798c2200e1/698ad647a14ea50d167ec4f6_insync_finance_estate_V2-fix.riv";
  const sm = "State Machine 1";
  const artboards = ["bento_01", "bento_02", "bento_03", "bento_04"];

  items.forEach((item, idx) => {
    const visual = item.querySelector("canvas");
    if (!visual) return;

    const r = new rive.Rive({
      src: RIVEURL,
      canvas: visual,
      stateMachines: sm,
      layout: layout,
      artboard: artboards[idx],
      autoplay: true,
      autoBind: true,
      isTouchScrollEnabled: true,
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
      },
      onLoadError: (err) => {
        console.error("Rive loading error:", err);
      },
    });
  });
};

const whyRiveAnim = () => {
  const wrap = document.querySelector(".why_wrap");
  if (!wrap) return;

  const visual = document.querySelector("[data-rive='why-el']");
  if (!visual) return;

  const layout = new rive.Layout({
    fit: rive.Fit.Cover, // Change to: Fit.Contain, or Cover
    layoutScaleFactor: 1,
  });

  const RIVEURL =
    "https://cdn.prod.website-files.com/6985a0387baa89798c2200e1/69a79ca73033611942da2e2d_insync_finance_estate_wieso_v2.riv";
  const sm = "State Machine 1";
  const artboard = "section_02";

  const r = new rive.Rive({
    src: RIVEURL,
    canvas: visual,
    stateMachines: sm,
    layout: layout,
    artboard: artboard,
    autoplay: true,
    autoBind: true,
    isTouchScrollEnabled: true,
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      const inputs = r.stateMachineInputs(sm);
      const playTrigger = inputs.find((i) => i.name === "play");
      if (playTrigger) {
        playTrigger.fire();
      }
    },
    onLoadError: (err) => {
      console.error("Rive loading error:", err);
    },
  });
};

const whyStepAnim = () => {
  const wrap = document.querySelector(".why_wrap");
  if (!wrap) return;
  const stickyWrap = wrap.querySelector(".why_sticky_wrap");
  const lineActive = stickyWrap.querySelector(".why_line_active");
  const items = stickyWrap.querySelectorAll(".why_item_wrap");
  const totalItems = items.length;

  // Set initial state
  gsap.set(lineActive, { scaleY: 0, transformOrigin: "top center" });

  // Build timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrap,
      start: "top 60%",
      end: "bottom bottom",
      scrub: true,
    },
  });

  // Animate line scaleY across the full scroll
  tl.to(lineActive, {
    scaleY: 1,
    duration: 1,
    ease: "none",
  });

  // Add is-active class at evenly spaced points
  items.forEach((item, i) => {
    const activateAt = i / totalItems; // e.g. 0, 0.33, 0.66

    tl.call(
      () => item.classList.add("is-active"),
      null,
      activateAt // position in timeline (0–1)
    );
  });

  // Remove is-active on reverse scroll
  ScrollTrigger.create({
    trigger: wrap,
    start: "top center",
    end: "bottom bottom",
    onUpdate: (self) => {
      const progress = self.progress;

      items.forEach((item, i) => {
        const threshold = i / totalItems;

        if (progress >= threshold) {
          item.classList.add("is-active");
        } else {
          item.classList.remove("is-active");
        }
      });
    },
  });
};
// const processStepAnim = () => {
//   const processWrap = document.querySelector(".process_wrap");
//   const lineActive = processWrap.querySelector(".process_step_line_active");
//   const items = processWrap.querySelectorAll(".process_step_item_wrap");
//   const totalItems = items.length;

//   // Set initial state
//   gsap.set(lineActive, { scaleY: 0, transformOrigin: "top center" });
//   items.forEach((item) => item.classList.remove("is-active"));

//   ScrollTrigger.create({
//     trigger: processWrap,
//     start: "top top",
//     end: "bottom bottom",
//     scrub: true,
//     onUpdate: (self) => {
//       const progress = self.progress;

//       // Animate line scaleY
//       gsap.set(lineActive, { scaleY: progress });

//       // Determine the single active index
//       const activeIndex = Math.min(
//         Math.floor(progress * totalItems),
//         totalItems - 1
//       );

//       // Toggle is-active on only the current item
//       items.forEach((item, i) => {
//         item.classList.toggle("is-active", i === activeIndex);
//       });
//     },
//   });
// };

const hoverProcessVisualAnim = () => {
  const visualWrap = document.querySelector(".process_visual_wrap");
  if (!visualWrap) return;

  const card1 = visualWrap.querySelector(".process_card_wrap.is-1");
  const card2 = visualWrap.querySelector(".process_card_wrap.is-2");
  const card3 = visualWrap.querySelector(".process_card_wrap.is-3");

  if (!card1 || !card2 || !card3) return;

  // Create a timeline paused by default — we'll play/reverse on hover
  const hoverTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.5, ease: "power2.out" },
  });

  hoverTl
    // Card 1 (farthest back): move closer in position & increase opacity
    .to(
      card1,
      {
        bottom: "25%", // from 25% → nudge slightly (was 45% → 27%)
        right: "0%", // from 10% → 2%
        // opacity: 0.65,
      },
      0
    )
    // Card 2 (middle): tighten position & increase opacity
    .to(
      card2,
      {
        bottom: "28%", // from 35% → 26%
        right: "2%", // from 5% → 1%
        // opacity: 0.85,
      },
      0
    )
    // Card 3 (front): bring slightly up to meet the stack
    .to(
      card3,
      {
        bottom: "30%", // stays roughly the same or fine-tune
        right: "4%", // from 0% (default) stays
      },
      0
    );

  // Play on hover, reverse on leave
  card1.addEventListener("mouseenter", () => hoverTl.play());
  card1.addEventListener("mouseleave", () => hoverTl.reverse());
};

function initProcessSteps() {
  const steps = document.querySelectorAll(".process_step_item_wrap");
  const line = document.querySelector(".process_step_line_active");
  const listWrapper = document.querySelector(".process_step_list_wrap");

  // Guard clause
  if (!steps.length || !line || !listWrapper) return;

  // 1. Initial Setup: Override CSS to give GSAP control
  // We remove grid/transitions and use standard block height for smoother JS animation
  gsap.set(".process_step_item_hide_wrap", {
    display: "block",
    height: 0,
    overflow: "hidden",
    marginTop: 0,
    marginBottom: 0,
    transition: "none", // Kill CSS transition
    gridTemplateRows: "none", // Disable grid rows if present
  });

  // Helper: Calculate distance from top of list to center of a specific title's icon
  const getIconPosition = (stepElement) => {
    const title = stepElement.querySelector(".process_step_item_title_wrap");
    const listRect = listWrapper.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    return titleRect.top - listRect.top + titleRect.height / 2;
  };

  // State to track animation
  let activeAnimation = null;

  // 2. Interaction Loop
  steps.forEach((step, index) => {
    const title = step.querySelector(".process_step_item_title_wrap");
    const content = step.querySelectorAll(".process_step_item_hide_wrap");

    title.addEventListener("click", () => {
      // Ignore if clicking the already active item
      if (step.classList.contains("is-active")) return;

      // Find currently active item
      const currentActive = document.querySelector(
        ".process_step_item_wrap.is-active"
      );
      const currentContent = currentActive
        ? currentActive.querySelectorAll(".process_step_item_hide_wrap")
        : null;

      // Record Starting Line Height
      const startLineHeight = line.offsetHeight;

      // Kill any running animation to prevent conflicts
      if (activeAnimation) activeAnimation.kill();

      // Update Classes immediately for visual state (colors, icons)
      if (currentActive) currentActive.classList.remove("is-active");
      step.classList.add("is-active");

      // 3. Create a Single Synchronized Timeline
      // This ensures accordion expansion and line movement use the EXACT same timing
      const tl = gsap.timeline({
        defaults: { duration: 0.6, ease: "power3.inOut" },
      });

      activeAnimation = tl;

      // A. Close Old Item
      if (currentContent) {
        tl.to(currentContent, { height: 0 }, 0);
      }

      // B. Open New Item
      tl.to(content, { height: "auto" }, 0);

      // C. Animate Line using Proxy Interpolation
      // We animate a dummy object 'val' from 0 to 1.
      // In onUpdate, we mathmatically blend the Start Position with the Moving Target Position.
      const proxy = { t: 0 };

      tl.to(
        proxy,
        {
          t: 1,
          onUpdate: () => {
            // 1. Get the LIVE position of the new active icon (it moves as accordion opens)
            const targetPosition = getIconPosition(step);

            // 2. Interpolate: Current = Start + (Difference * Progress)
            const currentHeight =
              startLineHeight + (targetPosition - startLineHeight) * proxy.t;

            // 3. Apply
            line.style.height = `${currentHeight}px`;
          },
        },
        0
      );
    });
  });

  // 4. Initialize First Item (Open by default)
  const firstStep = steps[0];
  if (firstStep) {
    firstStep.classList.add("is-active");
    const firstContent = firstStep.querySelectorAll(
      ".process_step_item_hide_wrap"
    );

    // Set initial height
    gsap.set(firstContent, { height: "auto" });

    // Set initial line height slightly delayed to ensure layout render
    // or use requestAnimationFrame
    requestAnimationFrame(() => {
      gsap.set(line, { height: getIconPosition(firstStep) });
    });
  }

  // Handle Resize (Snap line to correct position without animation)
  window.addEventListener("resize", () => {
    const activeStep = document.querySelector(
      ".process_step_item_wrap.is-active"
    );
    if (activeStep && !gsap.isTweening(line)) {
      gsap.set(line, { height: getIconPosition(activeStep) });
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".about_video_wrap").forEach((element) => {
    if (element.dataset.scriptInitialized) return;
    element.dataset.scriptInitialized = "true";

    const tabLinks = gsap.utils.toArray(".video_tabs_link");
    const currentShape = document.querySelector(".video_tabs_current");

    tabLinks.forEach((tabLink) => {
      tabLink.addEventListener("click", () => {
        const cState = Flip.getState(currentShape);

        tabLink.appendChild(currentShape);

        Flip.from(cState, { duration: 0.5, ease: "power2.inOut" });
      });
    });
  });
});

const priceTabFlip = () => {
  const tabLinks = gsap.utils.toArray(".price_tabs_link");
  const currentShape = document.querySelector("[data-tab-price='flip']");

  tabLinks.forEach((tabLink) => {
    tabLink.addEventListener("click", () => {
      const cState = Flip.getState(currentShape);

      tabLink.appendChild(currentShape);

      Flip.from(cState, { duration: 0.5, ease: "power2.inOut" });
    });
  });
};

function initIntegrationHover() {
  const wrap = document.querySelector(".integration_card_inner_wrap");
  const triggerSection = document.querySelector(".integration_wrap");

  if (!wrap || !triggerSection) return;

  const itemsData = [
    {
      el: wrap.querySelector(".integration_card_float_item.is-outlook"),
      x: -50,
      y: 130,
      cls: "is-idle-outlook",
    },
    {
      el: wrap.querySelector(".integration_card_float_item.is-finance"),
      x: 20,
      y: 450,
      cls: "is-idle-finance",
    },
    {
      el: wrap.querySelector(".integration_card_float_meeting"),
      x: 0,
      y: 55,
      cls: "is-idle-meeting",
    },
  ];

  const elements = itemsData.map((item) => item.el).filter(Boolean);
  if (elements.length !== 3) return;

  const toggleIdle = (isActive) => {
    itemsData.forEach(({ el, cls }) => el.classList.toggle(cls, isActive));
  };

  const snapToCenter = () => {
    toggleIdle(false);
    gsap.set(elements, { x: 0, y: 0, xPercent: 0, yPercent: 0 });
  };

  const isDesktop = window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 992px)"
  );

  ScrollTrigger.create({
    trigger: triggerSection,
    start: "top 80%",
    onEnter: () => (isDesktop.matches ? toggleIdle(true) : snapToCenter()),
    onEnterBack: () => isDesktop.matches && toggleIdle(true),
    onLeave: () => toggleIdle(false),
    onLeaveBack: () => toggleIdle(false),
  });

  if (isDesktop.matches) {
    wrap.addEventListener("mouseenter", () => {
      gsap.killTweensOf(elements);

      gsap.to(elements, {
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
        duration: 0.5,
        ease: "power3.out",
        onStart: () => toggleIdle(false),
      });
    });

    wrap.addEventListener("mouseleave", () => {
      gsap.killTweensOf(elements);

      itemsData.forEach(({ el, x, y }, i) => {
        gsap.to(el, {
          x: 0,
          y: 0,
          xPercent: x,
          yPercent: y,
          duration: 0.5,
          ease: "power2.out",
          onComplete:
            i === elements.length - 1
              ? () => {
                  // Removed clearProps so inline styles act as a seamless bridge during CSS animation delay
                  toggleIdle(true);
                }
              : null,
        });
      });
    });
  }
}
// function initIntegrationHover() {
//   gsap.registerPlugin(ScrollTrigger);

//   const wrap = document.querySelector(".integration_card_inner_wrap");
//   const triggerSection = document.querySelector(".integration_wrap");

//   if (!wrap || !triggerSection) return;

//   const outlook = wrap.querySelector(".integration_card_float_item.is-outlook");
//   const finance = wrap.querySelector(".integration_card_float_item.is-finance");
//   const meeting = wrap.querySelector(".integration_card_float_meeting");
//   const items = [outlook, finance, meeting];

//   const config = {
//     outlook: { x: -50, y: 130 },
//     finance: { x: 20, y: 450 },
//     meeting: { x: 0, y: 55 },
//   };

//   function runIdleAnimation() {
//     // PENTING: Matikan semua animasi yang sedang berjalan pada items
//     gsap.killTweensOf(items);

//     gsap.fromTo(
//       outlook,
//       { xPercent: config.outlook.x, yPercent: config.outlook.y },
//       {
//         yPercent: config.outlook.y - 5,
//         duration: 2,
//         yoyo: true,
//         repeat: -1,
//         ease: "sine.inOut",
//       }
//     );

//     gsap.fromTo(
//       finance,
//       { xPercent: config.finance.x, yPercent: config.finance.y },
//       {
//         yPercent: config.finance.y - 5,
//         duration: 2.2,
//         delay: 0.2,
//         yoyo: true,
//         repeat: -1,
//         ease: "sine.inOut",
//       }
//     );

//     gsap.fromTo(
//       meeting,
//       { xPercent: config.meeting.x, yPercent: config.meeting.y },
//       {
//         yPercent: config.meeting.y + 5,
//         duration: 1.8,
//         delay: 0.1,
//         yoyo: true,
//         repeat: -1,
//         ease: "sine.inOut",
//       }
//     );
//   }

//   function snapToCenter() {
//     gsap.killTweensOf(items);
//     gsap.set(items, { xPercent: 0, yPercent: 0 });
//   }

//   const isDesktop = window.matchMedia(
//     "(hover: hover) and (pointer: fine) and (min-width: 992px)"
//   );

//   // Perbaikan ScrollTrigger: Hapus 'once: true' agar bisa trigger berulang
//   ScrollTrigger.create({
//     trigger: triggerSection,
//     start: "top 80%",
//     onEnter: () => {
//       if (isDesktop.matches) {
//         runIdleAnimation();
//       } else {
//         snapToCenter();
//       }
//     },
//     // Tambahkan onEnterBack agar saat scroll balik ke atas, animasi tetap jalan
//     onEnterBack: () => {
//       if (isDesktop.matches) runIdleAnimation();
//     },
//   });

//   if (isDesktop.matches) {
//     wrap.addEventListener("mouseenter", () => {
//       // Matikan animasi melayang sebelum bergerak ke center
//       gsap.killTweensOf(items);

//       gsap.to(items, {
//         xPercent: 0,
//         yPercent: 0,
//         duration: 0.5,
//         ease: "power3.out",
//         overwrite: "auto", // Otomatis menimpa animasi lain jika ada konflik
//       });
//     });

//     wrap.addEventListener("mouseleave", () => {
//       // Kembalikan ke posisi idle, lalu jalankan loop melayang lagi
//       gsap.to(outlook, {
//         xPercent: config.outlook.x,
//         yPercent: config.outlook.y,
//         duration: 0.5,
//         ease: "power2.out",
//       });
//       gsap.to(finance, {
//         xPercent: config.finance.x,
//         yPercent: config.finance.y,
//         duration: 0.5,
//         ease: "power2.out",
//       });
//       gsap.to(meeting, {
//         xPercent: config.meeting.x,
//         yPercent: config.meeting.y,
//         duration: 0.5,
//         ease: "power2.out",
//         onComplete: runIdleAnimation, // Panggil loop setelah kembali ke posisi asal
//       });
//     });
//   }
// }

// const testimonialSlider = () => {
//   const testimonialEl = document.querySelector(
//     ".splide.is-testimonial:not([is-reversed])"
//   );
//   const testimonialReversedEl = document.querySelector(
//     ".splide.is-testimonial[is-reversed]"
//   );

//   // Standard Slider
//   if (testimonialEl) {
//     new Splide(testimonialEl, {
//       type: "loop",
//       autoWidth: true,
//       wheel: false, // Prevents Lenis conflict
//       // drag: "free",
//       arrows: false,
//       pagination: false,
//       autoScroll: { speed: 1 },
//     }).mount(window.splide.Extensions);
//   }

//   // Reversed Slider
//   if (testimonialReversedEl) {
//     new Splide(testimonialReversedEl, {
//       type: "loop",
//       autoWidth: true,
//       wheel: false,
//       direction: "rtl",
//       // drag: "free",
//       arrows: false,
//       pagination: false,
//       autoScroll: { speed: 1 },
//     }).mount(window.splide.Extensions);
//   }
// };

function NavbarChangeTheme() {
  const navbar = document.querySelector(".nav_component");
  const sections = document.querySelectorAll("section");

  // Pastikan navbar ada sebelum melanjutkan
  if (!navbar) return;

  function updateNavbarColor() {
    if (window.scrollY > 50) {
      navbar.classList.add("is-scroll");
    } else {
      navbar.classList.remove("is-scroll");
    }

    if (!sections.length) return;

    const navTop = navbar.getBoundingClientRect().top + window.scrollY;
    const navHeight = navbar.offsetHeight;

    let currentSection = null;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (navTop + navHeight > sectionTop && navTop < sectionBottom) {
        currentSection = section;
      }
    });

    if (currentSection) {
      if (currentSection.classList.contains("u-theme-light")) {
        navbar.classList.remove("u-theme-dark");
        navbar.classList.add("u-theme-light");
      } else {
        navbar.classList.remove("u-theme-light");
        navbar.classList.add("u-theme-dark");
      }
    }
  }

  window.addEventListener("scroll", updateNavbarColor);
  window.addEventListener("resize", updateNavbarColor);
  updateNavbarColor();
}

const navObserve = () => {
  const nav = document.querySelector(".nav_component");
  if (!nav) return;
  let lastScrollY = window.scrollY;
  let scrollTimeout; // Variable to store the timer

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // 1. Reset the "stopped" status immediately when moving
    nav.classList.remove("is-stopped");

    // 2. Check if at the very top vs. scrolled
    if (currentScrollY <= 100) {
      nav.classList.add("is-at-top");
    } else {
      nav.classList.add("is-scrolled");
      nav.classList.remove("is-at-top");
    }

    // 4. Update last position
    lastScrollY = currentScrollY;

    // 5. Detect when scrolling STOPS
    // Clear the previous timer so it doesn't fire while moving
    window.clearTimeout(scrollTimeout);
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Init on load
};

const footerAnim = () => {
  const trigger = document.querySelector(".footer_bottom_wrap");
  if (!trigger) return;

  const gradient = trigger.querySelectorAll(".footer_bottom_gradient");

  gsap.fromTo(
    gradient,
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 1.5,
      delay: 0.15,
      stagger: 0.1,
      scrollTrigger: {
        trigger: trigger,
        start: "top bottom",
        toggleActions: "play pause resume reset",
        // markers: true,
      },
    }
  );
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
        showError(
          "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
          errorMsgElement
        );
      } else {
        hideError(errorMsgElement); // Hide error if the field is empty
      }
    });
  });

  async function validateDomain(domain, errorElement) {
    try {
      // Show a loading/checking message for better UX
      showError("Domain wird überprüft...", errorElement);

      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();

      // Check for a valid response and if an "Answer" section with records exists
      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement); // Domain is valid
      } else {
        showError(
          "Die E-Mail-Domain scheint ungültig oder nicht existent zu sein.",
          errorElement
        );
      }
    } catch (error) {
      console.error("Error during domain validation:", error);
      // Optional: Show an error if the API is unreachable
      showError(
        "Die Validierung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Verbindung.",
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
        showError(
          "Zulässig sind nur Zahlen und ein vorangestelltes Pluszeichen.",
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
};

const registModal = () => {
  const modal = document.getElementById("regist-modal");
  if (!modal) return;

  const openDialogs = document.querySelectorAll(
    "[data-regist-modal='open-btn']"
  );

  const closeDialogs = document.querySelectorAll(
    "[data-regist-modal='close-btn']"
  );

  if (openDialogs) {
    openDialogs.forEach((open) => {
      open.addEventListener("click", () => {
        modal.showModal();
        lenis.stop();
      });
    });
  }

  if (closeDialogs) {
    closeDialogs.forEach((close) => {
      close.addEventListener("click", () => {
        modal.close();
        lenis.start();
      });
    });
  }

  // document.addEventListener("keydown", (event) => {
  //   if (event.key === "Escape") {
  //     modal.close();
  //   }
  // });
};

/**
 * Main initialization function for Custom Selects
 */
function initCustomSelects() {
  const selectWrappers = document.querySelectorAll(".form_main_select_wrap");

  // Handle clicking outside to close all dropdowns
  document.addEventListener("click", (e) => {
    selectWrappers.forEach((wrapper) => {
      if (!wrapper.contains(e.target)) {
        closeDropdown(wrapper);
      }
    });
  });

  selectWrappers.forEach((wrapper) => {
    const nativeSelect = wrapper.querySelector("select");
    const textDisplay = wrapper.querySelector(".form_main_select_text");
    const dropdownWrap = wrapper.querySelector(".form_main_select_opt_wrap");

    if (!nativeSelect || !textDisplay || !dropdownWrap) return;

    // Ensure smooth transitions are set
    dropdownWrap.style.transition = "opacity 0.3s ease";
    const triggerIcon = wrapper.querySelector(".form_main_select_icon");
    if (triggerIcon) triggerIcon.style.transition = "transform 0.3s ease";

    // --- NEW: Validation Setup ---
    const fieldWrap = wrapper.closest(".form_field_wrap");
    const errorMsg = fieldWrap
      ? fieldWrap.querySelector('[data-input-form="error-msg"]')
      : null;

    // Hide error message initially
    if (errorMsg) errorMsg.style.display = "none";

    if (nativeSelect.hasAttribute("required")) {
      // Override Webflow's display: none so HTML5 validation can process it
      nativeSelect.style.setProperty("display", "inline-block", "important");
      nativeSelect.style.position = "absolute";
      nativeSelect.style.opacity = "0";
      nativeSelect.style.width = "1px";
      nativeSelect.style.height = "1px";
      nativeSelect.style.zIndex = "-1";
      nativeSelect.style.pointerEvents = "none";

      // Listen for HTML5 validation failure
      nativeSelect.addEventListener("invalid", (e) => {
        e.preventDefault(); // Prevent standard browser tooltip
        if (errorMsg) errorMsg.style.display = "block"; // Show custom Webflow error
      });

      // Listen for change to hide the error if the user makes a valid selection
      nativeSelect.addEventListener("change", () => {
        const isMultiple = nativeSelect.hasAttribute("multiple");
        let isValid = isMultiple
          ? Array.from(nativeSelect.options).some(
              (opt) => opt.selected && opt.value !== ""
            )
          : nativeSelect.value !== "";

        if (isValid && errorMsg) errorMsg.style.display = "none";
      });
    }

    // 1. DYNAMIC LOOKUP: Generate custom UI items directly from the native <select> options
    const customItems = buildDynamicOptions(wrapper, nativeSelect);

    // --- NEW: Fix Auto-Selection ---
    // Force reset to empty if no options were explicitly marked as 'selected' in HTML
    const hasExplicitSelection = Array.from(nativeSelect.options).some(
      (opt) => opt.hasAttribute("selected") && opt.value !== ""
    );
    if (!hasExplicitSelection) {
      nativeSelect.value = ""; // Forces it to the placeholder option
    }

    // 2. Set the entire wrapper as the trigger to toggle the dropdown
    wrapper.addEventListener("click", (e) => {
      const clickedDropdownContent = e.target.closest(
        ".form_main_select_opt_wrap"
      );
      if (clickedDropdownContent) return;

      e.preventDefault();

      const computedStyle = window.getComputedStyle(dropdownWrap);
      const isOpen =
        computedStyle.pointerEvents === "auto" ||
        dropdownWrap.style.pointerEvents === "auto";

      selectWrappers.forEach((w) => {
        if (w !== wrapper) closeDropdown(w);
      });

      if (isOpen) {
        closeDropdown(wrapper);
      } else {
        openDropdown(wrapper);
      }
    });

    // 3. Extract the base placeholder
    const isMultiple = nativeSelect.hasAttribute("multiple");
    const rawPlaceholder =
      nativeSelect.options[0]?.textContent || textDisplay.textContent;
    const basePlaceholder = rawPlaceholder.split(" (")[0].trim();

    // 4. Attach click events to dynamically generated items
    customItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const optionValue = item.dataset.value;

        if (isMultiple) {
          handleMultipleSelect(
            item,
            optionValue,
            nativeSelect,
            textDisplay,
            basePlaceholder
          );
        } else {
          handleSingleSelect(
            item,
            optionValue,
            nativeSelect,
            textDisplay,
            basePlaceholder,
            customItems
          );
          closeDropdown(wrapper);
        }
      });
    });
  });
}

/**
 * Dynamically generates the custom dropdown items based on the actual <select> options
 */
function buildDynamicOptions(wrapper, nativeSelect) {
  const listContainer = wrapper.querySelector(".form_main_select_opt_list");
  const staticItems = listContainer.querySelectorAll(
    ".form_main_select_opt_item"
  );

  if (staticItems.length === 0) return [];

  const templateItem = staticItems[0].cloneNode(true);
  listContainer.innerHTML = "";

  const generatedItems = [];

  Array.from(nativeSelect.options).forEach((option, index) => {
    // Skip the first option if it acts as a default placeholder
    if (index === 0 && option.value === "") return;

    const newItem = templateItem.cloneNode(true);
    const textSpan = newItem.querySelector("span");
    if (textSpan) {
      textSpan.textContent = option.textContent;
    }

    newItem.dataset.value = option.value;

    const icon = newItem.querySelector(".form_main_select_opt_icon");
    if (icon) {
      // Use hasAttribute to prevent browser's automatic selection behavior
      icon.style.opacity = option.hasAttribute("selected") ? "1" : "0";
      icon.style.transition = "opacity 0.2s ease";
    }

    listContainer.appendChild(newItem);
    generatedItems.push(newItem);
  });

  return generatedItems;
}

/**
 * Opens the dropdown
 */
function openDropdown(wrapper) {
  const dropdownWrap = wrapper.querySelector(".form_main_select_opt_wrap");
  const triggerIcon = wrapper.querySelector(".form_main_select_icon");

  if (dropdownWrap) {
    dropdownWrap.style.opacity = "1";
    dropdownWrap.style.pointerEvents = "auto";
  }
  if (triggerIcon) {
    triggerIcon.style.transform = "rotate(180deg)";
  }
}

/**
 * Closes the dropdown
 */
function closeDropdown(wrapper) {
  const dropdownWrap = wrapper.querySelector(".form_main_select_opt_wrap");
  const triggerIcon = wrapper.querySelector(".form_main_select_icon");

  if (dropdownWrap) {
    dropdownWrap.style.opacity = "0";
    dropdownWrap.style.pointerEvents = "none";
  }
  if (triggerIcon) {
    triggerIcon.style.transform = "rotate(0deg)";
  }
}

/**
 * Handles logic for Single Custom Selects
 */
function handleSingleSelect(
  clickedItem,
  optionValue,
  nativeSelect,
  textDisplay,
  basePlaceholder,
  allItems
) {
  nativeSelect.value = optionValue;
  // Dispatches change event to trigger validation check
  nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

  allItems.forEach((item) => {
    const icon = item.querySelector(".form_main_select_opt_icon");
    if (icon) icon.style.opacity = "0";
  });

  const clickedIcon = clickedItem.querySelector(".form_main_select_opt_icon");
  if (clickedIcon) clickedIcon.style.opacity = "1";

  const selectedText = nativeSelect.options[nativeSelect.selectedIndex].text;
  textDisplay.textContent = `${basePlaceholder} (${selectedText})`;
  textDisplay.classList.remove("u-color-faded");
}

/**
 * Handles logic for Multiple Custom Selects
 */
function handleMultipleSelect(
  clickedItem,
  optionValue,
  nativeSelect,
  textDisplay,
  basePlaceholder
) {
  const targetOption = Array.from(nativeSelect.options).find(
    (opt) => opt.value === optionValue
  );
  if (!targetOption) return;

  targetOption.selected = !targetOption.selected;
  // Dispatches change event to trigger validation check
  nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

  const clickedIcon = clickedItem.querySelector(".form_main_select_opt_icon");
  if (clickedIcon) {
    clickedIcon.style.opacity = targetOption.selected ? "1" : "0";
  }

  const selectedCount = Array.from(nativeSelect.options).filter(
    (opt) => opt.selected && opt.value !== ""
  ).length;

  if (selectedCount > 0) {
    textDisplay.textContent = `${basePlaceholder} (Ausgewählt: ${selectedCount})`;
    textDisplay.classList.remove("u-color-faded");
  } else {
    textDisplay.textContent = `${basePlaceholder} (Ausgewählt: 0)`;
    textDisplay.classList.add("u-color-faded");
  }
}

let testimonialSwiper;

function testimonialSlider() {
  const swiperElement = document.querySelector(".testimonial_content_slider");

  if (testimonialSwiper) {
    testimonialSwiper.destroy(true, true);
  }

  if (swiperElement) {
    testimonialSwiper = new Swiper(swiperElement, {
      initialSlide: 1,
      slidesPerView: "auto",
      centeredSlides: true,
      spaceBetween: 24,
      slideClass: "testimonial_item_wrap",
      loop: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: "[data-slider-button='next']",
        prevEl: "[data-slider-button='prev']",
      },
    });
  }
}

const headingAnim = () => {
  const textEls = gsap.utils.toArray("[data-heading-reveal='true']");

  if (textEls.length === 0) return;

  textEls.forEach((text) => {
    let split = new SplitText(text, {
      type: "lines, words",
      mask: "lines",
    });

    // Create animation
    gsap
      .timeline({
        scrollTrigger: {
          trigger: text,
          start: "top 90%",
          end: "top 80%",
          toggleActions: "play none none none",
        },
        defaults: {
          ease: "power3",
        },
      })
      .from(
        split.words,
        {
          yPercent: 110,
          autoAlpha: 0,
          duration: 0.8,
          delay: 0.1,
          stagger: { each: 0.1 },
        },
        "<"
      );
  });
};

// Digital Immobilien Workflow — scroll-driven process animation
function initProcessWorkflow() {
  const section = document.querySelector(".process_wrap");
  if (!section) return;

  const steps = [...section.querySelectorAll(".process_step_item_wrap")];
  const cards = [...section.querySelectorAll(".process_card_wrap")];
  const lineActive = section.querySelector(".process_step_line_active");
  const totalSteps = steps.length;
  const MOBILE_BP = 991;

  let currentIndex = -1;
  let isDesktop = window.innerWidth > MOBILE_BP;

  // Initialize lottie — handle Webflow pre-rendered SVGs
  const lotties = steps.map((step) => {
    const el = step.querySelector(".process_step_item_icon .lottie-animation");
    if (!el) return null;

    const src = el.getAttribute("data-src");
    if (!src) return null;

    // Remove ALL existing SVGs (Webflow pre-renders them)
    const existingSvgs = el.querySelectorAll("svg");
    existingSvgs.forEach((svg) => svg.remove());

    // Prevent Webflow from re-initializing this element
    el.removeAttribute("data-animation-type");
    el.removeAttribute("data-is-ix2-target");

    const anim = lottie.loadAnimation({
      container: el,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: src,
    });

    // Ensure clean state once loaded
    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(0, true);
    });

    return anim;
  });

  function playLottie(index) {
    const anim = lotties[index];
    if (!anim) return;
    anim.stop();
    anim.setDirection(1);
    anim.play();
  }

  function resetLottie(index) {
    const anim = lotties[index];
    if (!anim) return;
    anim.stop();
    anim.goToAndStop(0, true);
  }

  function wrapIndex(i) {
    return ((i % totalSteps) + totalSteps) % totalSteps;
  }

  function activateStep(index) {
    if (index === currentIndex) return;
    currentIndex = index;

    // Accordion
    steps.forEach((step, i) => {
      if (i === index) {
        step.classList.add("is-active");
      } else {
        step.classList.remove("is-active");
      }
    });

    // Lottie — reset all, play active
    lotties.forEach((anim, i) => {
      if (!anim) return;
      if (i === index) {
        playLottie(i);
      } else {
        resetLottie(i);
      }
    });

    animateCards(index);
  }

  function animateCards(activeIndex) {
    const frontIdx = activeIndex;
    const secondIdx = wrapIndex(activeIndex - 1);
    const thirdIdx = wrapIndex(activeIndex - 2);

    cards.forEach((card, i) => {
      gsap.killTweensOf(card);

      const icon = card.querySelector(".process_card_icon");
      const blocksWrap = card.querySelector(".process_card_blocks_wrap");

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

  // Desktop: scroll-driven
  function updateOnScroll() {
    if (!isDesktop) return;

    const rect = section.getBoundingClientRect();
    const sectionHeight = section.offsetHeight;
    const viewportHeight = window.innerHeight;

    const scrolled = -rect.top;
    const scrollable = sectionHeight - viewportHeight;
    const progress = Math.max(0, Math.min(1, scrolled / scrollable));

    if (lineActive) {
      gsap.set(lineActive, { height: progress * 100 + "%" });
    }

    const stepIndex = Math.min(
      Math.floor(progress * totalSteps),
      totalSteps - 1
    );

    activateStep(stepIndex);
  }

  // Mobile: click-driven
  function handleStepClick(e) {
    if (isDesktop) return;

    const clickedStep = e.currentTarget;
    const index = steps.indexOf(clickedStep);
    if (index === -1) return;

    if (index === currentIndex) {
      clickedStep.classList.remove("is-active");
      resetLottie(index);
      currentIndex = -1;
      return;
    }

    activateStep(index);

    if (lineActive) {
      const progress = (index + 1) / totalSteps;
      gsap.to(lineActive, { height: progress * 100 + "%", duration: 0.4 });
    }
  }

  steps.forEach((step) => {
    step.addEventListener("click", handleStepClick);
  });

  function onResize() {
    const wasDesktop = isDesktop;
    isDesktop = window.innerWidth > MOBILE_BP;

    if (isDesktop && !wasDesktop) {
      currentIndex = -1;
      updateOnScroll();
    }

    if (!isDesktop && wasDesktop) {
      currentIndex = -1;
      activateStep(0);
      if (lineActive) {
        gsap.set(lineActive, { height: (1 / totalSteps) * 100 + "%" });
      }
    }
  }

  function resetInitialState() {
    cards.forEach((card) => {
      card.classList.remove("is-1", "is-2", "is-3");
    });
  }

  window.addEventListener("scroll", updateOnScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  resetInitialState();

  if (isDesktop) {
    updateOnScroll();
  } else {
    activateStep(0);
    if (lineActive) {
      gsap.set(lineActive, { height: (1 / totalSteps) * 100 + "%" });
    }
  }
}

function updateScale() {
  const minVw = 425;
  const maxVw = 1200;
  const minScale = 0.3;
  const maxScale = 1;

  let vw = window.innerWidth;
  // Clamp nilai vw
  vw = Math.max(minVw, Math.min(maxVw, vw));

  // Hitung skala
  const scale =
    minScale + (maxScale - minScale) * ((vw - minVw) / (maxVw - minVw));

  document.documentElement.style.setProperty("--fluid-scale", scale);
}

window.addEventListener("resize", updateScale);
updateScale();

function updateMargin() {
  const minVw = 425;
  const maxVw = 1200;
  const minMargin = -45;
  const maxMargin = 0;

  let vw = window.innerWidth;
  vw = Math.max(minVw, Math.min(maxVw, vw));

  const currentMargin =
    minMargin + (maxMargin - minMargin) * ((vw - minVw) / (maxVw - minVw));

  document.documentElement.style.setProperty(
    "--fluid-mt",
    `${currentMargin}vh`
  );
}

window.addEventListener("resize", updateMargin);
updateMargin();

const lenis = new Lenis({
  autoRaf: true,
});

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lenis

  NavbarChangeTheme();
  navObserve();
  registModal();
  emailValidation();
  telInputValidation();
  initCustomSelects();
  document.fonts.ready.then(headingAnim);

  heroHoverAnim();
  whyRiveAnim();

  initProcessWorkflow();

  // testimonialMarquee();
  testimonialSlider();

  document.fonts.ready.then(setFullWidthFontSize);

  riveAnim();

  whyStepAnim();

  // processStepAnim();

  priceTabFlip();

  // initProcessSteps();

  // hoverProcessVisualAnim();

  initIntegrationHover();

  footerAnim();
});
