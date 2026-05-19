const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

function countAnimation() {
  const items = document.querySelectorAll('[data-text-animation="count"]');

  if (items.length > 0) {
    console.log("counting founds");
  } else {
    console.log("counting not founds");
  }

  items.forEach((element) => {
    const targetCount = parseFloat(element.dataset.count, 10);

    const decimalPlaces = (targetCount.toString().split(".")[1] || "").length;

    let counter = { value: 0 };

    ScrollTrigger.create({
      trigger: element,
      start: "top 90%",
      onEnter: () => {
        gsap.to(counter, {
          value: targetCount,
          duration: 1.5,
          ease: "expo.out",
          onUpdate: () => {
            element.textContent = counter.value.toFixed(decimalPlaces);
          },
        });
      },
      once: true,
    });
  });
}

function riveAnimation() {
  const wrap = document.querySelector(".product_wrap");
  if (!wrap) return;
  const items = wrap.querySelectorAll(".product_item_wrap");
  if (!items.length) return;

  const RIVEURL =
    "https://cdn.prod.website-files.com/6989549ad4e95cafcc64ffd8/698c1df796b1cde8331b0be2_insync_estate_of_the_art_v2.riv";
  const sm = "State Machine 1";
  const artboards = ["bento_01", "bento_02", "bento_03"];

  items.forEach((item, idx) => {
    const visual = item.querySelector("canvas");
    let hoverInput; // 1. Variable to store the Rive input

    const r = new rive.Rive({
      src: RIVEURL,
      canvas: visual,
      stateMachines: sm,
      artboard: artboards[idx],
      autoplay: true,
      autoBind: true,
      isTouchScrollEnabled: true,
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();

        const inputs = r.stateMachineInputs(sm);
        hoverInput = inputs.find((i) => i.name === "hover");
      },
      onLoadError: (err) => {
        console.error("Rive loading error:", err);
      },
    });

    item.addEventListener("mouseenter", () => {
      if (hoverInput) hoverInput.value = true;
    });

    item.addEventListener("mouseleave", () => {
      if (hoverInput) hoverInput.value = false;
    });
  });
}

function footerAnimation() {
  const bgDecor = document.querySelector(".footer_bg");

  if (!bgDecor) return;

  gsap.to(bgDecor, {
    scaleY: 1,
    duration: 1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".footer_wrap",
      start: "center 90%",
      toggleActions: "play none none reverse",
      // markers: true,
    },
  });
}

function initFutureStepsScrollTrigger() {
  const steps = document.querySelectorAll(".future_item_wrap");

  steps.forEach((step, index) => {
    const numberLine = document.querySelectorAll(".future_number_line")[index];
    const number = document.querySelectorAll(".future_number")[index];

    ScrollTrigger.create({
      trigger: step,
      start: "top center",
      end: "bottom center",
      onEnter: () => {
        step.classList.add("is-active");
        if (numberLine) numberLine.classList.add("is-active");
        if (number) number.classList.add("is-active");
      },
      onLeave: () => {},
      onEnterBack: () => {
        step.classList.add("is-active");
        if (numberLine) numberLine.classList.add("is-active");
        if (number) number.classList.add("is-active");
      },
      onLeaveBack: () => {
        step.classList.remove("is-active");
        if (numberLine) numberLine.classList.remove("is-active");
        if (number) number.classList.remove("is-active");
      },
    });
  });
}

function headingAnimation() {}

function initFunction() {
  countAnimation();
  riveAnimation();
  footerAnimation();
  initFutureStepsScrollTrigger();
  // headingAnimation();
}

document.addEventListener("DOMContentLoaded", initFunction);
