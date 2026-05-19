// SWIPER ANIM
// document.addEventListener("DOMContentLoaded", function () {
//   // 1. Ambil semua slide asli (sebelum di-clone oleh Swiper)
//   const allSlides = document.querySelectorAll(".swiper-slide.is-testi");
//   const totalSlides = allSlides.length;

// const { transform } = require("typescript");

//   // 2. Isi angka ke masing-masing slide
//   allSlides.forEach((slide, index) => {
//     const countText = slide.querySelector(".testimonial_bottom_count-text");
//     const totalSpan = slide.querySelector(".testimonial_bottom_count-total");

//     if (countText && totalSpan) {
//       // Mengatur angka saat ini (index + 1) dan totalnya
//       // Kita gunakan innerHTML agar struktur <span> untuk total tidak hilang
//       const currentIndex = index + 1;
//       countText.innerHTML = `${currentIndex}/<span class="testimonial_bottom_count-total">${totalSlides}</span>`;
//     }
//   });

//   // 3. Inisialisasi Swiper setelah angka terisi
//   const swiper = new Swiper(".swiper.is-testi", {
//     loop: true,
//     speed: 600,
//     spaceBetween: 20,
//     slidesPerView: 1,
//     navigation: {
//       nextEl: ".testimonial_navigation_button_wrap.is-next",
//       prevEl: ".testimonial_navigation_button_wrap.is-prev",
//     },
//   });
// });

// STATS COUNT ANIM
// document.addEventListener("DOMContentLoaded", function () {
//   gsap.registerPlugin(ScrollTrigger);

//   const statItems = document.querySelectorAll(
//     '[data-scroll-animation="count"]'
//   );

//   statItems.forEach((item) => {
//     const targetSpan = item.querySelector("span:first-child");

//     if (!targetSpan) return;
//     const rawValue = targetSpan.getAttribute("data-count");

//     if (!rawValue) return;
//     const isK = rawValue.includes("K");
//     const finalValue = parseFloat(rawValue.replace("K", ""));

//     let countObj = { val: 0 };

//     targetSpan.innerText = "0";

//     gsap.to(countObj, {
//       val: finalValue,
//       duration: 2,
//       ease: "power2.out",

//       scrollTrigger: {
//         trigger: item,

//         start: "top 90%",

//         toggleActions: "play none none none",
//       },
//       onUpdate: function () {
//         let formattedValue = Math.ceil(countObj.val);
//         targetSpan.innerText = isK ? formattedValue + "K" : formattedValue;
//       },
//     });
//   });
// });

// SPLIT TEXT
// document.addEventListener("DOMContentLoaded", (event) => {
//   const animatedTexts = document.querySelectorAll(
//     '[data-scrub-animation="text-opacity"]'
//   );

//   animatedTexts.forEach((textEl) => {
//     const splitText = new SplitText(textEl, { type: "words" });

//     gsap.fromTo(
//       splitText.words,
//       {
//         opacity: 0.3,
//       },
//       {
//         opacity: 1,
//         stagger: 0.05,
//         ease: "none",
//         scrollTrigger: {
//           trigger: textEl,
//           start: "top 16%",
//           end: "bottom 20%",
//           scrub: true,
//           markers: true,
//         },
//       }
//     );
//   });
// });

// let tickerFn;

// function horizontalLoop() {
//   const slider = document.querySelector('[data-animation="slider"]');

//   if (!slider) return;

//   const originalItems = Array.from(slider.children);

//   slider.innerHTML = "";
//   originalItems.forEach((item) => slider.appendChild(item));

//   const cloneCount = 4;
//   for (let i = 0; i < cloneCount; i++) {
//     originalItems.forEach((item) => {
//       const clone = item.cloneNode(true);
//       slider.appendChild(clone);
//     });
//   }

//   let singleSetWidth = 0;

//   originalItems.forEach((item) => {
//     const rect = item.getBoundingClientRect();
//     const style = window.getComputedStyle(item);
//     singleSetWidth +=
//       rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
//   });

//   gsap.set(slider, { willChange: "transform" });

//   const setX = gsap.quickSetter(slider, "x", "px");
//   const lerp = (a, b, n) => a + (b - a) * n;

//   let currentX = 0;

//   const autoScrollSpeed = 0.5;
//   const scrollForce = 0.05;
//   const dragForce = 0.1;
//   const friction = 0.05;

//   let velocity = autoScrollSpeed;

//   setX(0);

//   Observer.create({
//     target: window,
//     type: "wheel",
//     onChange: (self) => {
//       velocity += self.deltaY * scrollForce;
//     },
//   });

//   Observer.create({
//     target: slider,
//     type: "touch,pointer",
//     preventDefault: true,
//     onChange: (self) => {
//       velocity += -self.deltaX * dragForce;
//     },
//   });

//   if (tickerFn) gsap.ticker.remove(tickerFn);

//   tickerFn = () => {
//     velocity = lerp(velocity, autoScrollSpeed, friction);
//     currentX -= velocity;

//     if (currentX < -singleSetWidth) {
//       currentX += singleSetWidth;
//     } else if (currentX > 0) {
//       currentX -= singleSetWidth;
//     }

//     setX(currentX);
//   };

//   gsap.ticker.add(tickerFn);
// }

let tickerFn;

function horizontalLoop() {
  const slider = document.querySelector('[data-animation="slider"]');
  if (!slider) return;

  const originalItems = Array.from(slider.children);
  slider.innerHTML = "";
  originalItems.forEach((item) => slider.appendChild(item));

  const cloneCount = 4;
  for (let i = 0; i < cloneCount; i++) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      slider.appendChild(clone);
    });
  }

  let singleSetWidth = 0;
  originalItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const style = window.getComputedStyle(item);
    singleSetWidth +=
      rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
  });

  gsap.set(slider, { willChange: "transform" });

  const setX = gsap.quickSetter(slider, "x", "px");
  const lerp = (a, b, n) => a + (b - a) * n;

  let currentX = 0;
  const autoScrollSpeed = 0.8;
  const scrollForce = 0.03;
  const dragForce = 0.08;
  const friction = 0.03;

  let velocity = autoScrollSpeed;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 1025px)", () => {
    let obs1 = Observer.create({
      target: window,
      type: "wheel",
      onChange: (self) => {
        velocity += self.deltaY * scrollForce;
      },
    });

    let obs2 = Observer.create({
      target: slider,
      type: "touch,pointer",
      preventDefault: true,
      onChange: (self) => {
        velocity += -self.deltaX * dragForce;
      },
    });

    return () => {
      obs1.kill();
      obs2.kill();
      velocity = autoScrollSpeed;
    };
  });

  if (tickerFn) gsap.ticker.remove(tickerFn);

  tickerFn = () => {
    velocity = lerp(velocity, autoScrollSpeed, friction);
    currentX -= velocity;

    if (currentX < -singleSetWidth) {
      currentX += singleSetWidth;
    } else if (currentX > 0) {
      currentX -= singleSetWidth;
    }

    setX(currentX);
  };

  gsap.ticker.add(tickerFn);
}

function opacityText() {
  const animatedTexts = document.querySelectorAll(
    '[data-scrub-animation="text-opacity"]'
  );

  animatedTexts.forEach((textEl) => {
    const splitText = new SplitText(textEl, { type: "words" });

    gsap.fromTo(
      splitText.words,
      {
        opacity: 0.3,
      },
      {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: textEl,
          start: "top 80%",

          end: "bottom 40%",

          scrub: true,
        },
      }
    );
  });
}

function countAnimation() {
  const statItems = document.querySelectorAll(
    '[data-scroll-animation="count"]'
  );

  statItems.forEach((item) => {
    const targetSpan = item.querySelector("span:first-child");

    if (!targetSpan) return;
    const rawValue = targetSpan.getAttribute("data-count");

    if (!rawValue) return;
    const isK = rawValue.includes("K");
    const finalValue = parseFloat(rawValue.replace("K", ""));

    let countObj = { val: 0 };

    targetSpan.innerText = "0";

    gsap.to(countObj, {
      val: finalValue,
      duration: 2,
      ease: "power2.out",

      scrollTrigger: {
        trigger: item,
        start: "top bottom",
        toggleActions: "play none none none",
      },
      onUpdate: function () {
        let formattedValue = Math.ceil(countObj.val);
        targetSpan.innerText = isK ? formattedValue + "K" : formattedValue;
      },
    });
  });
}

function partnership() {
  const section = document.querySelector(".partnership_wrap");
  if (!section) return;

  const items = section.querySelectorAll(".partnership_item_wrap");
  const dots = section.querySelectorAll(".partnership_item_dot");

  items.forEach((item, index) => {
    const dot = dots[index];

    gsap.set(item, {
      opacity: 0.4,
    });

    gsap.set(dot, {
      opacity: 0.4,
    });

    gsap.to(item, {
      opacity: 1,
      scrollTrigger: {
        trigger: dot,
        start: "top center",
        toggleActions: "play reverse play reverse",
      },
    });

    if (dot) {
      gsap.to(dot, {
        opacity: 1,
        backgroundColor: "#ffffff",
        scrollTrigger: {
          trigger: dot,
          start: "top center",
          toggleActions: "play reverse play reverse",
        },
      });
    }
  });
}

function setupTextLinesReveal() {
  const getCSSVariable = (variableName, fallback = "#000") => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(
        variableName
      ) || fallback
    );
  };

  const BRAND_COLOR = getCSSVariable("--swatch--brand-500", "#000");

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

      gsap
        .timeline({
          scrollTrigger: {
            trigger: text,
            start: "top bottom",
            end: "top 80%",
            toggleActions: "play none none none",
          },
          defaults: {
            ease: "power1.out",
          },
        })
        .set(split.words, {
          willChange: "opacity",
        })
        .set(split.chars, {
          willChange: "color",
        })
        .from(split.words, {
          opacity: 0.2,
          delay: 0.1,
          duration: 0.8,
          stagger: { each: 0.1 },
        })
        .to(
          split.chars,
          {
            keyframes: [
              {
                color:
                  typeof BRAND_COLOR !== "undefined" ? BRAND_COLOR : "inherit",
                duration: 0.8,
              },
              { color: "inherit", duration: 0.8 },
            ],
            duration: 0.8,
            stagger: { each: 0.01 },
          },
          "<"
        );
    });
  });
}

function mapExpand() {
  const section = document.querySelector(".network-m_wrap");

  if (!section) return;

  const networkVisual = section.querySelector(".network-m_map");
  const buttonMain = section.querySelector(".button_main_wrap");
  const buttonLinkWrap = section.querySelector(".button_link_wrap");
  const networkList = section.querySelector(".network-m_list");
  const decorWrap = section.querySelector(".network-m_decor_wrap");
  const bgLinear = section.querySelector(".network-m_bg_linear");

  let isExpanded = false;

  if (buttonLinkWrap) {
    gsap.set(buttonLinkWrap, { opacity: 0, pointerEvents: "none" });
  }

  function toggleMap() {
    isExpanded = !isExpanded;

    if (networkVisual) {
      gsap.to(networkVisual, {
        "--h-ratio": isExpanded ? 680 : 340,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }

    if (bgLinear) {
      gsap.to(bgLinear, {
        height: isExpanded ? 0 : "100%",
        opacity: isExpanded ? 0 : 1,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }

    if (networkList) {
      gsap.to(networkList, {
        marginTop: isExpanded ? 0 : "",
        duration: 0.5,
        ease: "power2.inOut",
      });
    }

    if (decorWrap) {
      gsap.to(decorWrap, {
        opacity: isExpanded ? 0 : 1,
        pointerEvents: isExpanded ? "none" : "auto",
        duration: 0.5,
        ease: "power2.inOut",
      });
    }

    if (buttonLinkWrap) {
      gsap.to(buttonLinkWrap, {
        opacity: isExpanded ? 1 : 0,
        pointerEvents: isExpanded ? "auto" : "none",
        duration: 0.5,
        ease: "power2.inOut",
      });
    }
  }

  if (buttonMain) {
    buttonMain.addEventListener("click", function (e) {
      e.preventDefault();
      if (!isExpanded) toggleMap();
    });
  }

  if (buttonLinkWrap) {
    buttonLinkWrap.addEventListener("click", function (e) {
      e.preventDefault();
      if (isExpanded) toggleMap();
    });
  }
}

function mapPop() {
  gsap.set('[data-map="pop"]', {
    autoAlpha: 0,
    yPercent: 5,
    pointerEvents: "none",
    transformStyle: "preserve-3d",
    isolation: "isolate",
  });

  const dots = document.querySelectorAll('[data-map="dot"]');

  dots.forEach((dot) => {
    dot.addEventListener("mouseenter", function () {
      const city = this.getAttribute("data-city");
      const pop = document.querySelector(
        `[data-map="pop"][data-city="${city}"]`
      );

      if (pop) {
        gsap.to(pop, {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    });

    dot.addEventListener("mouseleave", function () {
      const city = this.getAttribute("data-city");
      const pop = document.querySelector(
        `[data-map="pop"][data-city="${city}"]`
      );

      if (pop) {
        gsap.to(pop, {
          opacity: 0,
          yPercent: 5,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    });
  });
}

function initLogoSwiper() {
  if (!document.querySelector(".logo_slider")) return;

  const swiper = new Swiper(".logo_slider", {
    slideClass: "logo_slide",

    loop: true,
    speed: 800,
    grabCursor: true,
    slidesPerView: "auto",
    spaceBetween: 20,
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
    },

    navigation: {
      nextEl: ".network-m_logo_nav .button_arrow_wrap:last-child",
      prevEl: ".network-m_logo_nav .button_arrow_wrap:first-child",
    },

    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
  });
}

function initFunction() {
  horizontalLoop();
  opacityText();
  countAnimation();
  partnership();
  setupTextLinesReveal();
  mapExpand();
  mapPop();
  initLogoSwiper();
}

document.addEventListener("DOMContentLoaded", initFunction);
