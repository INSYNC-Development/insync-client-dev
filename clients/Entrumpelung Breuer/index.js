/// Lenis
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

let lenis;

if (!isSafari) {
  lenis = new Lenis({
    autoRaf: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  lenis.scrollTo(0, 0);
} else {
  console.log("Lenis turn off on safari");
}

/// End

/* Count Animation Universal */
function countAnimation() {
  const items = document.querySelectorAll('[data-scroll-animation="count"]');

  items.forEach((element) => {
    const rawValue = element.dataset.count;
    const numbers = rawValue.match(/\d+/g).map(Number);
    const delimiters = rawValue.split(/\d+/);

    if (!numbers) return;

    const counter = {};
    const targets = {};

    numbers.forEach((num, i) => {
      counter[`val${i}`] = 0;
      targets[`val${i}`] = num;
    });

    ScrollTrigger.create({
      trigger: element,
      start: "top 90%",
      onEnter: () => {
        gsap.to(counter, {
          ...targets,
          duration: 1.5,
          ease: "expo.out",
          onUpdate: () => {
            element.textContent = delimiters.reduce((acc, delim, i) => {
              const val =
                counter[`val${i}`] !== undefined
                  ? Math.round(counter[`val${i}`])
                  : "";
              return acc + delim + val;
            }, "");
          },
        });
      },
      once: true,
    });
  });
}

// function countAnimation() {
//   const items = document.querySelectorAll('[data-scroll-animation="count"]');

//   items.forEach((element) => {
//     const targetCount = parseInt(element.dataset.count, 10);

//     let counter = { value: 0 };

//     ScrollTrigger.create({
//       trigger: element,
//       start: "top 90%",
//       onEnter: () => {
//         gsap.to(counter, {
//           value: targetCount,
//           duration: 1.5,
//           ease: "expo.out",
//           onUpdate: () => {
//             element.textContent = Math.round(counter.value);
//           },
//         });
//       },
//       once: true,
//     });
//   });
// }

function headingReveal() {
  const items = document.querySelectorAll('[data-text-animation="heading"]');

  if (items.length < 0) {
    return;
  }

  items.forEach((item) => {
    const text = new SplitText(item, {
      type: "lines",
      // mask: true,
    });

    gsap.from(text.lines, {
      duration: 0.6,
      opacity: 0,
      y: 20,
      ease: "power2.out",
      stagger: 0.2,
      scrollTrigger: {
        trigger: item,
        start: "start 90%",
        once: true,
      },
    });
  });
}

function initAnimation() {
  countAnimation();
  headingReveal();
}

document.addEventListener("DOMContentLoaded", initAnimation);

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error(
      "GSAP or ScrollTrigger is not loaded. Please include the libraries."
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function initScrollAnimations() {
    // Group elements by animation type for better organization
    const animationGroups = {
      "slide-up": [],
      "slide-from-left": [],
      "slide-from-right": [],
    };

    const animatedElements = gsap.utils.toArray("[data-scroll-animation]");

    animatedElements.forEach((element) => {
      const animationType = element.getAttribute("data-scroll-animation");

      if (!animationGroups.hasOwnProperty(animationType)) {
        console.warn(`Unknown animation type: ${animationType}`);
        return;
      }

      // Set initial state based on animation type
      switch (animationType) {
        case "slide-up":
          gsap.set(element, { opacity: 0, y: 40 });
          break;
        case "slide-from-left":
          gsap.set(element, { opacity: 0, x: -100 });
          break;
        case "slide-from-right":
          gsap.set(element, { opacity: 0, x: 100 });
          break;
      }

      animationGroups[animationType].push(element);
    });

    for (const [animationType, elements] of Object.entries(animationGroups)) {
      if (elements.length === 0) continue;

      ScrollTrigger.batch(elements, {
        start: "top 90%",
        end: "bottom center",
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            x: 0,
            stagger: 0.1,
            duration: 1,
            ease: "power2.out",
            overwrite: true,
          });
        },
        // markers: true
      });
    }
  }

  initScrollAnimations();
});
