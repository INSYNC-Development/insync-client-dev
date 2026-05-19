let resizeTimer;

$(window).on("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setFullWidthFontSize, 100);
});

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

lenis.scrollTo(0, 0);

gsap.registerPlugin(CustomEase);

CustomEase.create("hop", "0.65, 0.05, 0, 1");

gsap.defaults({
  ease: "hop",
  duration: 1,
});

gsap.registerEffect({
  name: "blink",
  effect: (target, config) => {
    if (config.direction === "to") {
      return gsap.to(target, {
        autoAlpha: config.autoAlpha || 0,
        duration: config.duration || 0.4,
        stagger: {
          from: config.from || "random",
          amount: config.amount || 0.1,
        },
        ease: "bounce.in",
      });
    } else {
      return gsap.from(target, {
        autoAlpha: config.autoAlpha || 0,
        duration: config.duration || 0.4,
        stagger: {
          from: config.from || "random",
          amount: config.amount || 0.1,
        },
        ease: "bounce.in",
      });
    }
  },
  extendTimeline: true,
});

gsap.blink = gsap.effects.blink;

// function setFullWidthFontSize() {
//   $(".footer_head").each(function () {
//     const $container = $(this);
//     const $text = $container.find("h2");

//     $text.css({
//       "white-space": "nowrap",
//       width: "auto",
//       display: "inline-block",
//     });

//     const baseSize = 50;
//     $text.css("font-size", baseSize + "px");

//     const containerWidth = $container.width();
//     const textWidth = $text.width();

//     if (textWidth > 0) {
//       const newSize = (containerWidth / textWidth) * baseSize;

//       $text.css("font-size", newSize - 0.5 + "px");
//     }
//   });
// }

function setFullWidthFontSize() {
  const elements = $(".footer_head");
  if (!elements.length) return;

  const baseSize = 50;
  const calculations = [];

  elements.each(function () {
    const $text = $(this).find("h2");
    $text.css({
      "white-space": "nowrap",
      width: "auto",
      display: "inline-block",
      "font-size": baseSize + "px",
    });
  });

  elements.each(function () {
    const $container = $(this);
    const $text = $container.find("h2");
    calculations.push({
      el: $text,
      cWidth: $container.width(),
      tWidth: $text.width(),
    });
  });

  calculations.forEach((item) => {
    if (item.tWidth > 0) {
      const newSize = (item.cWidth / item.tWidth) * baseSize;
      item.el.css("font-size", newSize - 0.5 + "px");
    }
  });
}

function buttonLinkHoverAnim() {
  const buttons = gsap.utils.toArray("[data-button='wrap']");

  if (!buttons.length) return null;

  const context = gsap.context(() => {
    buttons.forEach((button) => {
      const textEl = button.querySelector("[data-button='text']");
      if (!textEl) return;

      const textElSplit = SplitText.create(textEl, {
        type: "lines, words, chars",
        linesClass: "lines",
        charsClass: "char",
      });

      textElSplit.chars.forEach((char) => {
        char.setAttribute("data-char", char.innerText);
      });

      gsap.set(textElSplit.chars, { yPercent: 0 });

      const tl = gsap.timeline({
        paused: true,
        defaults: {
          duration: 0.5,
          ease: "power3.inOut",
        },
      });

      tl.to(textElSplit.chars, {
        yPercent: -150,
        stagger: 0.025,
        force3D: true,
      });

      let isHovered = false;

      const handleMouseEnter = () => {
        if (!isHovered) {
          isHovered = true;
          tl.play();
        }
      };

      const handleMouseLeave = () => {
        if (isHovered) {
          isHovered = false;
          tl.reverse();
        }
      };

      button.addEventListener("mouseenter", handleMouseEnter, {
        passive: true,
      });
      button.addEventListener("mouseleave", handleMouseLeave, {
        passive: true,
      });

      button._cleanup = () => {
        button.removeEventListener("mouseenter", handleMouseEnter);
        button.removeEventListener("mouseleave", handleMouseLeave);
        textElSplit.revert();
        tl.kill();
      };
    });
  }, buttons);

  context.cleanup = () => {
    buttons.forEach((button) => {
      if (button._cleanup) button._cleanup();
    });
    context.revert();
  };

  return context;
}

function headingRevealAnim() {
  // 1. SETUP DOM & SPLITTEXT
  if (window.innerWidth >= 992) {
    const breakElements = document.querySelectorAll(".text-break-desktop");
    breakElements.forEach((el) => {
      el.insertAdjacentHTML("beforebegin", "<br>");
      el.classList.remove("text-break-desktop");
    });
  }

  const headings = document.querySelectorAll("[data-text-animation='heading']");

  headings.forEach((text) => {
    // A. Buat SplitText
    text.split = SplitText.create(text, {
      type: "lines",
      mask: "lines",
      linesClass: "word",
    });

    gsap.set(text.split.lines, {
      yPercent: 120,
      filter: "blur(5px)",
    });
  });

  ScrollTrigger.batch("[data-text-animation='heading']", {
    start: "top 80%",
    once: true,

    onEnter: (batch) => {
      batch.forEach((text, i) => {
        gsap.to(text.split.lines, {
          yPercent: 0,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: 0.15,
          delay: i * 0.5,
          ease: "power2.out",
        });
      });
    },
  });
}

function descRevealAnim() {
  const descriptions = document.querySelectorAll(
    "[data-text-animation='desc']"
  );

  descriptions.forEach((text) => {
    text.split = SplitText.create(text, {
      type: "lines",
      linesClass: "word",
    });

    gsap.set(text.split.lines, {
      autoAlpha: 0,
      filter: "blur(5px)",
      y: 10,
    });
  });

  ScrollTrigger.batch("[data-text-animation='desc']", {
    start: "top 80%",
    once: true,

    onEnter: (batch) => {
      batch.forEach((text, i) => {
        gsap.to(text.split.lines, {
          autoAlpha: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.6,
          stagger: { amount: 0.15 },
          delay: i * 0.5,
          ease: "power2.out",
        });
      });
    },
  });
}

function scrambleAnimation() {
  const items = gsap.utils.toArray('[data-text-animation="scramble"]');

  if (!items.length) return;

  const ctx = gsap.context(() => {
    items.forEach((item) => {
      const split = new SplitText(item, { type: "chars" });

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          split.revert();
        },
      });

      tl.from(split.chars, {
        duration: 0.6,
        autoAlpha: 0,
        scrambleText: {
          text: "{original}",
          chars: "xershkzn",
          speed: 1,
          tweenLength: false,
        },
        stagger: {
          amount: 0.4,
          from: "random",
        },
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top 90%",
        once: true,
        onEnter: () => tl.play(),
      });
    });
  });

  return ctx;
}

function backgroundAnimation() {
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const lineWrap = section.querySelector(".line_bg");
    const lines = lineWrap.querySelectorAll(".line");
    const decorations = section.querySelectorAll(".decoration");

    gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 90%",
        once: true,
      },
    });

    tl.to(lines, {
      scaleY: 1,
      duration: 0.5,
      stagger: 0.2,
      ease: "hop",
    }).blink(decorations, {
      duration: 1,
      stagger: {
        amount: 0.2,
        from: "random",
      },
    });
  });
}

function footerFunction() {
  const heading = document.querySelector(".footer_heading");

  if (!heading) return;

  const split = new SplitText(heading, {
    type: "chars",
    mask: "chars",
    charsClass: "char",
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heading,
      start: "top 90%",
      end: "bottom 80%",
      scrub: 3,
      // markers: true,
    },
  });

  tl.from(split.chars, {
    yPercent: 100,
    duration: 1,
    stagger: { amount: 0.5, from: "start" },
    ease: "power2.out",
  });
}

function initFunction() {
  document.fonts.ready.then(() => {
    document.body.style.opacity = "1";

    if (typeof setFullWidthFontSize === "function") setFullWidthFontSize();
    buttonLinkHoverAnim();
    headingRevealAnim();
    descRevealAnim();
    backgroundAnimation();
    scrambleAnimation();
    footerFunction();
  });
}

document.addEventListener("DOMContentLoaded", initFunction);

document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth < 768) {
    const firstDetail = document.querySelector("details");
    if (firstDetail) {
      firstDetail.open = true;
    }
  }
});

// window.addEventListener("load", () => {
//   ScrollTrigger.refresh();
// });
