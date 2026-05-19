// function verticalLoop(wrapper, config) {
//   let items = gsap.utils.toArray(wrapper.querySelectorAll(":scope > div")),
//     tl = gsap.timeline({
//       repeat: config.repeat,
//       paused: config.paused,
//       defaults: { ease: "none" },
//       onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
//     }),
//     length = items.length,
//     startY = items[0].offsetTop,
//     times = [],
//     heights = [],
//     yPercents = [],
//     curIndex = 0,
//     pixelsPerSecond = (config.speed || 1) * 100,
//     snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
//     totalHeight,
//     curY,
//     distanceToStart,
//     distanceToLoop,
//     item,
//     i;

//   gsap.set(items, {
//     yPercent: (i, el) => {
//       let h = (heights[i] = parseFloat(gsap.getProperty(el, "height", "px")));
//       yPercents[i] = snap(
//         (parseFloat(gsap.getProperty(el, "y", "px")) / h) * 100 +
//           gsap.getProperty(el, "yPercent")
//       );
//       return yPercents[i];
//     },
//   });
//   gsap.set(items, { y: 0 });

//   totalHeight =
//     items[length - 1].offsetTop +
//     (yPercents[length - 1] / 100) * heights[length - 1] -
//     startY +
//     items[length - 1].offsetHeight *
//       gsap.getProperty(items[length - 1], "scaleY") +
//     (parseFloat(config.paddingBottom) || 0);

//   for (i = 0; i < length; i++) {
//     item = items[i];
//     curY = (yPercents[i] / 100) * heights[i];
//     distanceToStart = item.offsetTop + curY - startY;
//     distanceToLoop =
//       distanceToStart + heights[i] * gsap.getProperty(item, "scaleY");

//     tl.to(
//       item,
//       {
//         yPercent: snap(((curY - distanceToLoop) / heights[i]) * 100),
//         duration: distanceToLoop / pixelsPerSecond,
//       },
//       0
//     )
//       .fromTo(
//         item,
//         {
//           yPercent: snap(
//             ((curY - distanceToLoop + totalHeight) / heights[i]) * 100
//           ),
//         },
//         {
//           yPercent: yPercents[i],
//           duration:
//             (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond,
//           immediateRender: false,
//         },
//         distanceToLoop / pixelsPerSecond
//       )
//       .add("label" + i, distanceToStart / pixelsPerSecond);

//     times[i] = distanceToStart / pixelsPerSecond;
//   }

//   function toIndex(index, vars) {
//     vars = vars || {};
//     if (Math.abs(index - curIndex) > length / 2) {
//       index += index > curIndex ? -length : length;
//     }
//     let newIndex = gsap.utils.wrap(0, length, index),
//       time = times[newIndex];
//     if (time > tl.time() !== index > curIndex) {
//       vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
//       time += tl.duration() * (index > curIndex ? 1 : -1);
//     }
//     curIndex = newIndex;
//     vars.overwrite = true;
//     return tl.tweenTo(time, vars);
//   }

//   tl.next = (vars) => toIndex(curIndex + 1, vars);
//   tl.previous = (vars) => toIndex(curIndex - 1, vars);
//   tl.current = () => curIndex;
//   tl.toIndex = (index, vars) => toIndex(index, vars);
//   tl.times = times;

//   tl.progress(1, true).progress(0, true);

//   if (config.reversed) {
//     tl.vars.onReverseComplete();
//     tl.reverse();
//   }

//   return tl;
// }

// const initVerticalLoop = () => {
//   const wrappers = document.querySelectorAll("[data-visual-wrap]");
//   if (!wrappers) return;

//   const isDesktop = window.innerWidth >= 1024;

//   wrappers.forEach((wrapper) => {
//     const directionStr = wrapper.getAttribute("data-visual-wrap");
//     const isReverse = directionStr === "down";

//     const originalContent = wrapper.innerHTML;

//     // --- FIX 1: THE INFINITE LOOP PREVENTER ---
//     // We add a maxCount to ensure it never loops more than 10 times
//     // This prevents the browser from crashing if CSS prevents height growth
//     let limit = 0;
//     const maxLoops = 20; // Safety cap

//     wrapper.innerHTML = originalContent + originalContent; // Initial duplicate

//     while (
//       wrapper.offsetHeight < window.innerHeight * 1.5 &&
//       limit < maxLoops
//     ) {
//       wrapper.innerHTML += originalContent;
//       limit++;
//     }
//     // ------------------------------------------

//     let tl = verticalLoop(wrapper, {
//       speed: 0.5,
//       repeat: -1,
//       paused: false,
//       paddingBottom: 10,
//       reversed: isReverse,
//     });

//     if (isDesktop) {
//       ScrollTrigger.create({
//         trigger: wrapper, // Changed from class string to specific element
//         start: "top bottom", // Optimization: start when it enters viewport
//         end: "bottom top",
//         onUpdate: (self) => {
//           const velocity = self.getVelocity();

//           let velocityFactor = Math.abs(velocity / 200);
//           if (velocityFactor > 4) velocityFactor = 12;

//           let targetTimeScale = 1 + velocityFactor;

//           if (isReverse) {
//             targetTimeScale = targetTimeScale * -1;
//           }

//           gsap.to(tl, {
//             timeScale: targetTimeScale,
//             duration: 0.1,
//             overwrite: true,
//           });

//           gsap.to(tl, {
//             timeScale: isReverse ? -1 : 1,
//             duration: 0.8,
//             delay: 0.1,
//             ease: "power1.out",
//             overwrite: "auto",
//           });
//         },
//       });
//     }
//   });
// };

// document.addEventListener("DOMContentLoaded", () => {
//   initVerticalLoop();
// });

// 1. HELPER: HORIZONTAL LOOP (Robust Version)
function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times = [],
    widths = [],
    xPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
    totalWidth,
    curX,
    distanceToStart,
    distanceToLoop,
    item,
    i;

  gsap.set(items, {
    xPercent: (i, el) => {
      // FIX: Fallback to offsetWidth to ensure we never get 0
      let w = (widths[i] =
        parseFloat(gsap.getProperty(el, "width", "px")) || el.offsetWidth);

      // Safety check: if width is still 0, default to 1 to avoid Division by Zero
      if (w === 0) w = 1;

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

// 2. HELPER: VERTICAL LOOP (Unchanged)
function verticalLoop(wrapper, config) {
  let items = gsap.utils.toArray(wrapper.querySelectorAll(":scope > div")),
    tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
    }),
    length = items.length,
    startY = items[0].offsetTop,
    times = [],
    heights = [],
    yPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
    totalHeight,
    curY,
    distanceToStart,
    distanceToLoop,
    item,
    i;

  gsap.set(items, {
    yPercent: (i, el) => {
      let h = (heights[i] = parseFloat(gsap.getProperty(el, "height", "px")));
      yPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, "y", "px")) / h) * 100 +
          gsap.getProperty(el, "yPercent")
      );
      return yPercents[i];
    },
  });
  gsap.set(items, { y: 0 });

  totalHeight =
    items[length - 1].offsetTop +
    (yPercents[length - 1] / 100) * heights[length - 1] -
    startY +
    items[length - 1].offsetHeight *
      gsap.getProperty(items[length - 1], "scaleY") +
    (parseFloat(config.paddingBottom) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curY = (yPercents[i] / 100) * heights[i];
    distanceToStart = item.offsetTop + curY - startY;
    distanceToLoop =
      distanceToStart + heights[i] * gsap.getProperty(item, "scaleY");

    tl.to(
      item,
      {
        yPercent: snap(((curY - distanceToLoop) / heights[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        {
          yPercent: snap(
            ((curY - distanceToLoop + totalHeight) / heights[i]) * 100
          ),
        },
        {
          yPercent: yPercents[i],
          duration:
            (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond,
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

// 3. MAIN INIT FUNCTION
const initLoops = () => {
  const wrappers = document.querySelectorAll("[data-visual-wrap]");
  if (!wrappers.length) return;

  const isDesktop = window.innerWidth >= 1024;

  wrappers.forEach((wrapper) => {
    const directionStr = wrapper.getAttribute("data-visual-wrap");
    const isReverse = directionStr === "down"; // Reverse logic

    const originalContent = wrapper.innerHTML;
    let limit = 0;
    const maxLoops = 20;

    // Reset initially to avoid conflicts before we decide mode
    wrapper.style.display = "";
    wrapper.style.flexDirection = "";

    wrapper.innerHTML = originalContent + originalContent;

    if (isDesktop) {
      // === DESKTOP: VERTICAL ===
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";

      while (
        wrapper.offsetHeight < window.innerHeight * 1.5 &&
        limit < maxLoops
      ) {
        wrapper.innerHTML += originalContent;
        limit++;
      }

      let tl = verticalLoop(wrapper, {
        speed: 0.5,
        repeat: -1,
        paused: false,
        paddingBottom: 10,
        reversed: isReverse,
      });

      // Desktop ScrollTrigger Logic (unchanged)
      // ScrollTrigger.create({
      //   trigger: wrapper,
      //   start: "top bottom",
      //   end: "bottom top",
      //   onUpdate: (self) => {
      //     const velocity = self.getVelocity();
      //     let velocityFactor = Math.abs(velocity / 200);
      //     if (velocityFactor > 4) velocityFactor = 12;
      //     let targetTimeScale = 1 + velocityFactor;
      //     if (isReverse) targetTimeScale = targetTimeScale * -1;

      //     gsap.to(tl, {
      //       timeScale: targetTimeScale,
      //       duration: 0.1,
      //       overwrite: true,
      //     });
      //     gsap.to(tl, {
      //       timeScale: isReverse ? -1 : 1,
      //       duration: 0.8,
      //       delay: 0.1,
      //       ease: "power1.out",
      //       overwrite: "auto",
      //     });
      //   },
      // });
    } else {
      // === MOBILE: HORIZONTAL ===

      // 1. Force CSS to Horizontal Row
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "row";
      wrapper.style.flexWrap = "nowrap"; // Essential to keep in one line
      wrapper.style.whiteSpace = "nowrap"; // Helps text content
      wrapper.style.width = "max-content"; // Ensure container grows horizontally

      // 2. Duplicate content until we have enough width
      while (
        wrapper.scrollWidth < window.innerWidth * 1.5 &&
        limit < maxLoops
      ) {
        wrapper.innerHTML += originalContent;
        limit++;
      }

      // 3. IMPORTANT: Select items and FORCE sizes
      let items = Array.from(wrapper.querySelectorAll(":scope > div"));

      items.forEach((item) => {
        // Prevent items from shrinking to 0
        item.style.flexShrink = "0";
        item.style.flexGrow = "0";
        // Optionally force display block/inline-block if they are hidden
        item.style.display = "block";
      });

      // 4. Initialize Loop
      let tl = horizontalLoop(items, {
        speed: 0.5,
        repeat: -1,
        paused: false,
        paddingRight: 10,
        reversed: isReverse,
      });

      // Mobile Velocity Logic
      // ScrollTrigger.create({
      //   trigger: "body",
      //   start: 0,
      //   end: "max",
      //   onUpdate: (self) => {
      //     const velocity = self.getVelocity();
      //     let velocityFactor = Math.abs(velocity / 400);
      //     if (velocityFactor > 3) velocityFactor = 3;

      //     let targetTimeScale = 1 + velocityFactor;
      //     if (isReverse) targetTimeScale *= -1;

      //     gsap.to(tl, {
      //       timeScale: targetTimeScale,
      //       duration: 0.1,
      //       overwrite: true,
      //     });
      //     gsap.to(tl, {
      //       timeScale: isReverse ? -1 : 1,
      //       duration: 0.5,
      //       delay: 0.1,
      //       ease: "power1.out",
      //       overwrite: "auto",
      //     });
      //   },
      // });
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Optional: Wait for images if you have them,
  // otherwise DOMContentLoaded is fine for text/shapes.
  initLoops();
});
