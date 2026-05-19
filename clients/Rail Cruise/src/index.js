let tickerFn;
let teamInstance;
let highlightsInstance;
let mm = gsap.matchMedia();

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

lenis.scrollTo(0, 0);

// Start Function
CustomEase.create("mainEase", "0.23, 1, 0.32, 1");

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

  const autoScrollSpeed = 0.5;
  const scrollForce = 0.05;
  const dragForce = 0.1;
  const friction = 0.05;

  let velocity = autoScrollSpeed;

  setX(0);

  Observer.create({
    target: window,
    type: "wheel",
    onChange: (self) => {
      velocity += self.deltaY * scrollForce;
    },
  });

  Observer.create({
    target: slider,
    type: "touch,pointer",
    preventDefault: true,
    onChange: (self) => {
      velocity += -self.deltaX * dragForce;
    },
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

function NavbarChangeTheme() {
  const navbar = document.querySelector(".nav_component");
  const sections = document.querySelectorAll("section");
  const banner = document.querySelector(".nav_banner_wrap");

  function updateNavbarColor() {
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
      if (currentSection.classList.contains("u-theme-dark")) {
        console.log("in");
        navbar.classList.remove("u-theme-light");
        navbar.classList.add("u-theme-dark");
        banner.classList.remove("u-theme-dark");
        banner.classList.add("u-theme-light");
      } else {
        navbar.classList.remove("u-theme-dark");
        navbar.classList.add("u-theme-light");
        banner.classList.remove("u-theme-light");
        banner.classList.add("u-theme-dark");
      }
    }
  }

  function hideBenner() {
    const navbar = document.querySelector(".nav_component");
    if (!navbar) return;

    gsap.to(navbar, {
      y: "-2.5rem",
      duration: 0.5,
      ease: "mainEase",
      scrollTrigger: {
        trigger: "body",
        start: "top -5%",
        toggleActions: "play none none reverse",
      },
    });
  }

  window.addEventListener("scroll", updateNavbarColor);
  window.addEventListener("resize", updateNavbarColor);
  updateNavbarColor();
  hideBenner();
}

function headingAnimation() {
  const items = document.querySelectorAll('[data-text-animation="heading"]');

  items.forEach((item, index) => {
    const splitText = new SplitText(item, {
      type: "lines",
      mask: "lines",
      linesClass: "line-class",
      autoSplit: true,
    });

    let ctx = gsap.context(() => {
      gsap.from(splitText.lines, {
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          once: true,
        },
        yPercent: 100,
        duration: 1,
        delay: index === 0 ? 0.3 : 0,
        ease: "mainEase",
        stagger: 0.3,
      });
    });

    return () => ctx.revert();
  });
}

function initScrollAnimations() {
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
        gsap.set(element, { opacity: 0, y: 20 });
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
          ease: "mainEase",
          overwrite: true,
        });
      },
    });
  }
}

function imageAnimation() {
  const wrappers = document.querySelectorAll('[data-img-animation="scale"]');

  if (wrappers.length < 0) return;

  wrappers.forEach((wrapper) => {
    const image = wrapper.querySelector("img");
    const card = wrapper.parentElement.querySelector('[data-element="card"]');

    if (!image) return;

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top 85%",
          once: true,
        },
      });

      // Animasi Image & Wrapper
      tl.from(wrapper, {
        scale: 0.8,
        duration: 1.8,
        ease: "mainEase",
      }).from(
        image,
        {
          scale: 1.5,
          duration: 1.8,
          ease: "mainEase",
        },
        "<"
      );

      if (card) {
        tl.from(
          card,
          {
            autoAlpha: 0,
            y: 50,
            duration: 1.5,
            ease: "mainEase",
          },
          "-=1.2"
        );
      }
    }, wrapper);
    return () => ctx.revert();
  });
}

function teamSwiper() {
  const swiperElement = document.querySelector(".team_slider");

  if (!swiperElement) return;

  const wrapper = swiperElement.querySelector(".team_slider .swiper-wrapper");
  const items = wrapper.querySelectorAll(".team_item_wrap");

  if (items.length > 0 && items.length < 6) {
    const itemsToClone = 6 - items.length;
    for (let i = 0; i < itemsToClone; i++) {
      const clone = items[i % items.length].cloneNode(true);
      wrapper.appendChild(clone);
    }
  }

  teamInstance = new Swiper(swiperElement, {
    slideClass: "team_item_wrap",
    slidesPerView: "auto",
    spaceBetween: 16,
    centeredSlides: true,
    autoplay: {
      delay: 5000,
    },
    loop: true,

    breakpoints: {
      768: {
        spaceBetween: 24,
      },
    },

    navigation: {
      nextEl: ".slider_button.is-next",
      prevEl: ".slider_button.is-prev",
    },
  });
}

function highlightsSwiper() {
  const swiperElement = document.querySelector(".highlights_slider");

  if (!swiperElement) return;

  const wrapper = swiperElement.querySelector(
    ".highlights_slider .swiper-wrapper"
  );

  const items = wrapper.querySelectorAll(".highlights_item_wrap");

  if (items.length > 0 && items.length < 6) {
    const itemsToClone = 6 - items.length;
    for (let i = 0; i < itemsToClone; i++) {
      const clone = items[i % items.length].cloneNode(true);
      wrapper.appendChild(clone);
    }
  }

  highlightsInstance = new Swiper(swiperElement, {
    slideClass: "highlights_item_wrap",
    slidesPerView: "auto",
    spaceBetween: 16,
    centeredSlides: true,
    loop: true,

    breakpoints: {
      768: {
        spaceBetween: 24,
      },
    },

    navigation: {
      nextEl: ".slider_button.is-next",
      prevEl: ".slider_button.is-prev",
    },
  });
}

function priceItem() {
  const section = document.querySelector(".itinerary_wrap");
  if (!section) return;

  const items = section.querySelectorAll(".itinerary_item_content");

  let mm = gsap.matchMedia();

  mm.add("(min-width: 62em)", () => {
    items.forEach((item) => {
      gsap.to(item, {
        background: "#F5F7F8",
        duration: 0.4,
        ease: "mainEase",
        scrollTrigger: {
          trigger: item,
          start: "top center",
          toggleActions: "play none none reverse",
        },
      });
    });
  });
}

function initFunction() {
  headingAnimation();
  initScrollAnimations();

  setTimeout(() => {
    NavbarChangeTheme();
    imageAnimation();
    horizontalLoop();
    teamSwiper();
    highlightsSwiper();
    priceItem();
  }, 1200);
}

document.addEventListener("DOMContentLoaded", function () {
  // gsap.to(".page_wrap", {
  //   autoAlpha: 1,
  //   duration: 0.1,
  // });
  document.body.style.opacity = "1";

  initFunction();
});

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
