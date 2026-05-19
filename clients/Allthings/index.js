let lenis;
window.lenis = lenis;

function initLenisSmoothScrolling() {
  lenis = new Lenis({
    lerp: 0.125,
    wheelMultiplier: 0.8,
    gestureOrientation: "vertical",
    normalizeWheel: false,
    smoothTouch: false,
    autoResize: true,
  });

  // Update ScrollTrigger on Lenis scroll
  lenis.on("scroll", ScrollTrigger.update);
  lenis.scrollTo(0, 0);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// Text Line Reveal
function setupTextLinesReveal() {
  const getCSSVariable = (variableName, fallback = "#000") => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(
        variableName
      ) || fallback
    );
  };

  const BRAND_COLOR = getCSSVariable("--swatch--brand-500", "#000");
  const BLUE_500 = getCSSVariable("--swatch--blue-500", "#000");

  const textEls = gsap.utils.toArray("[data-heading-reveal]");

  if (textEls.length === 0) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    textEls.forEach((text) => {
      let split = new SplitText(text, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char",
      });

      // Create animation
      gsap
        .timeline({
          scrollTrigger: {
            trigger: text,
            start: "top bottom",
            end: "top 80%",
            toggleActions: "play none none none",
          },
          defaults: {
            ease: "power3",
          },
        })
        .set(split.words, {
          willChange: "transform, opacity, filter",
        })
        .set(split.chars, {
          willChange: "color",
        })
        .from(split.words, {
          yPercent: 110,
          filter: "blur(20px)",
          autoAlpha: 0,
          delay: 0.2,
          duration: 0.8,
          stagger: { each: 0.1 },
        })
        .to(
          split.chars,
          {
            keyframes: [
              {
                color: typeof BLUE_500 !== "undefined" ? BLUE_500 : "blue",
                duration: 0.2,
              }, // Fallback if var undefined
              {
                color:
                  typeof BRAND_COLOR !== "undefined" ? BRAND_COLOR : "black",
                duration: 0.2,
              },
              { color: "inherit", duration: 0.4 },
            ],
            duration: 0.8,
            stagger: { each: 0.01 },
          },
          "<"
        );
    });

    gsap.set("[data-prevent-flicker='true']", {
      visibility: "visible",
    });

    return () => {
      gsap.set("[data-prevent-flicker='true']", { clearProps: "visibility" });
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLenisSmoothScrolling();

  document.fonts.ready.then(() => {
    setupTextLinesReveal();
  });
});

const blogPagination = () => {
  const paginationButtons = document.querySelectorAll("[data-blog-pagination]");
  if (!paginationButtons) return;

  paginationButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetSection = document.querySelector("#blog-section");

      if (targetSection && window.lenis) {
        window.lenis.scrollTo(targetSection, {
          offset: -500,
          duration: 1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  blogPagination();
});
