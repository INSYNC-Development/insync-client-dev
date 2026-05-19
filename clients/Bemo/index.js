// Global Animation
window.addEventListener("load", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error(
      "GSAP or ScrollTrigger is not loaded. Please include the libraries."
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const deviceInfo = {
    isMobile: window.innerWidth < 480,
    isMobileLandscape: window.innerWidth < 768,
    isTablet: window.innerWidth < 992,
    isDesktop: window.innerWidth > 991,
    isTouchScreen: () =>
      "ontouchstart" in window || navigator.maxTouchPoints > 0,
    isSafariOrArc: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  };

  let lenis;

  lenis = new Lenis({
    autoRaf: true,
  });

  function initMaskingImgAnimations() {
    const containers = document.querySelectorAll("section, header");
    containers.forEach((container) => {
      const maskElements = container.querySelectorAll(
        "[data-scroll-animation='masking-img']"
      );
      maskElements.forEach((el, index) => {
        const visualEl = el.querySelector("img");
        if (!visualEl) return;
        gsap.set(visualEl, { scale: 1.3 });
        // gsap.set(visualEl, { scale: 1.15 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          })
          .fromTo(
            visualEl,
            { clipPath: "inset(0 0 100% 0)" },
            {
              clipPath: "inset(0 0 0% 0)",
              duration: 1.2,
              delay: index * 0.1,
              stagger: { each: 0.2 },
              ease: "power1.out",
            }
          )
          .fromTo(
            visualEl,
            { scale: 1.3 },
            {
              scale: 1,
              clearProps: "transform",
              ease: "power2.out",
              duration: 1.2,
            },
            "<"
          );
      });
    });
  }

  function initMaskingElAnimations() {
    const containers = document.querySelectorAll("section, header");
    containers.forEach((container) => {
      const maskElements = container.querySelectorAll(
        "[data-scroll-animation='masking-el']"
      );
      maskElements.forEach((el, index) => {
        gsap.set(maskElements, { clipPath: "inset(0 0 100% 0)" });
        ScrollTrigger.batch(maskElements, {
          start: "top 85%",
          onEnter: (batch) => {
            gsap.to(batch, {
              clipPath: "inset(0 0 0% 0)",
              duration: 1.2,
              stagger: 0.4,
              ease: "power1.out",
            });
          },
          once: true,
        });
      });
    });
  }

  function initHorizontalLineAnim() {
    const containers = document.querySelectorAll("section, header");
    containers.forEach((container) => {
      const lineElements = container.querySelectorAll(
        "[data-line-animation='horizontal']"
      );
      lineElements.forEach((el, index) => {
        gsap.set(el, {
          scaleX: "0%",
        });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          })
          .to(
            el,
            {
              scaleX: "100%",
              duration: 1.35,
              delay: index * 0.05,
              stagger: { each: 0.2 },
              ease: "power4.inOut",
            },
            "<"
          );
      });
    });
  }

  function initScrubAnimations() {
    gsap.utils.toArray("[data-scrub-animation]").forEach((el) => {
      const animationType = el.getAttribute("data-scrub-animation");
      if (animationType === "parallax") initParallaxEffect(el);
      else if (animationType === "slow-zoom") initSlowZoomEffect(el);
      else if (animationType === "parallax-hero") initParallaxHeroEffect(el);
    });
  }

  function initParallaxHeroEffect(el) {
    gsap.to(el, {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        // markers: true,
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  function initParallaxEffect(el) {
    const height = el.offsetHeight;
    const offset = height * 0.15;
    gsap.set(el, { y: -offset * 2 });
    gsap.to(el, {
      y: offset * 2,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        end: "bottom+=20% top",
        scrub: true,
      },
    });
  }

  function initSlowZoomEffect(el) {
    // gsap.set(el, { scale: 1.3 });
    gsap.to(el, {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        end: "bottom 10%",
        scrub: true,
      },
    });
  }

  function initEntranceAnimations() {
    const animationTypes = {
      "slide-up": { opacity: 0, y: 40 },
      "slide-from-left": { opacity: 0, x: -100 },
      "slide-from-right": { opacity: 0, x: 100 },
      "fade-in": { opacity: 0 },
    };

    // Get all sections as containers
    const containers = document.querySelectorAll("section");

    // Loop through each section
    containers.forEach((container, containerIndex) => {
      // Process each animation type within the current section
      Object.entries(animationTypes).forEach(([type, initialProps]) => {
        const elements = container.querySelectorAll(
          `[data-scroll-animation="${type}"]`
        );

        if (elements.length === 0) return;

        // Set initial properties for elements in this section
        gsap.set(elements, initialProps);

        // Create ScrollTrigger for elements in this section
        ScrollTrigger.batch(Array.from(elements), {
          start: "top 98%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              y: 0,
              stagger: 0.125,
              duration: 1,
              ease: "power2.out",
              overwrite: true,
            }),
          once: true,
        });
      });
    });
  }

  function initAnimations() {
    // initMaskingImgAnimations();
    // initMaskingElAnimations();
    initScrubAnimations();
    // initEntranceAnimations();
    initHorizontalLineAnim();
  }

  function cleanUp() {
    lenis.destroy();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initAnimations();
  window.addEventListener("beforeunload", cleanUp);
  window.deviceInfo = deviceInfo;
});

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
      nav.classList.remove("is-scrolled");
      nav.classList.remove("scrolling-down");
      nav.classList.remove("is-stopped");
    } else {
      nav.classList.add("is-scrolled");
      nav.classList.remove("is-at-top");
    }

    // 3. Check scroll direction (Down vs Up)
    if (currentScrollY > lastScrollY && currentScrollY > 0) {
      // User is moving DOWN
      nav.classList.add("scrolling-down");
    } else if (currentScrollY < lastScrollY) {
      // User is moving UP
      nav.classList.remove("scrolling-down");
    }

    // 4. Update last position
    lastScrollY = currentScrollY;

    // 5. Detect when scrolling STOPS
    // Clear the previous timer so it doesn't fire while moving
    window.clearTimeout(scrollTimeout);

    // Set a new timer. If 150ms passes without a scroll event, this runs:
    scrollTimeout = window.setTimeout(() => {
      // Only add stopped class if we are not at the very top
      if (currentScrollY > 0) {
        nav.classList.add("is-stopped");
      }
    }, 150); // 150ms is the standard "wait" time to detect a stop
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Init on load
};

const roomSwiper = () => {
  const target = document.querySelector(".swiper.is-rooms");
  if (!target) return;
  new Swiper(target, {
    slidesPerView: "auto",
    loop: true,
    centeredSlides: true,
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 2,
      },
    },
    navigation: {
      prevEl: "[data-rooms-swiper='prev-btn']",
      nextEl: "[data-rooms-swiper='next-btn']",
    },
  });
};

const testimonialSwiper = () => {
  const target = document.querySelector(".swiper.is-testimonial");
  if (!target) return;
  new Swiper(target, {
    slidesPerView: 1,
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      1080: {
        slidesPerView: 3.01,
      },
    },
    navigation: {
      prevEl: "[data-testimonial-swiper='prev-btn']",
      nextEl: "[data-testimonial-swiper='next-btn']",
    },
  });
};

const planSwiper = () => {
  const target = document.querySelector(".swiper.is-plan");
  if (!target) return;
  new Swiper(target, {
    slidesPerView: 1,
    loop: true,
    centeredSlides: true,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    navigation: {
      prevEl: "[data-plan-swiper='prev-btn']",
      nextEl: "[data-plan-swiper='next-btn']",
    },
  });
};

const readMoreFunc = () => {
  // Select all read more buttons
  const readMoreButtons = document.querySelectorAll(".team_item_content_btn");
  if (!readMoreButtons.length) return;

  readMoreButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Prevent default browser behavior
      e.preventDefault();

      // 1. Find the wrapper that holds both the button and the text
      const wrapper = this.closest(".team_item_content_desc_wrap");

      // 2. Find the specific text element inside that wrapper
      const textElement = wrapper.querySelector(".team_item_content_desc");

      // 3. Toggle the expanded class on the text
      textElement.classList.toggle("is-expanded");

      // 4. Update Button Text (Read More <-> Read Less)
      // We look for the span inside the button
      const btnSpan = this.querySelector("span");

      if (textElement.classList.contains("is-expanded")) {
        if (btnSpan) btnSpan.textContent = "Weniger lesen";
      } else {
        if (btnSpan) btnSpan.textContent = "Mehr lesen";
      }
    });
  });
};

const philosophyAnim = () => {
  const container = document.querySelector(".philosophy_wrap");
  const visualContainer = document.querySelector(".philosophy_bg_wrap");

  if (container) {
    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top center",
        end: "bottom bottom",
        scrub: true,
      },
    });

    const split = SplitText.create("[data-text-animation='scrub']", {
      type: "chars, words",
    });

    textTl.from(
      split.chars,
      {
        color: "rgba(15, 22, 16, 0.20)",
        duration: 1,
        stagger: 0.2,
      },
      "<"
    );
  }

  if (visualContainer) {
    const visualTl = gsap.timeline({
      scrollTrigger: {
        trigger: visualContainer,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // const items = visualContainer.querySelectorAll(".philosophy_visual_wrap");
    // items.forEach((el, index) => {
    //   const visualEl = el.querySelector("img");
    //   if (!visualEl) return;
    //   gsap.set(visualEl, { scale: 1.3 });
    //   gsap
    //     .timeline({
    //       scrollTrigger: {
    //         trigger: el,
    //         start: "top 95%",
    //         toggleActions: "play none none none",
    //       },
    //     })
    //     .fromTo(
    //       visualEl,
    //       { clipPath: "inset(0 0 100% 0)" },
    //       {
    //         clipPath: "inset(0 0 0% 0)",
    //         duration: 1.2,
    //         ease: "power3.out",
    //       }
    //     )
    //     .fromTo(
    //       visualEl,
    //       { scale: 1.3 },
    //       {
    //         scale: 1,
    //         clearProps: "transform",
    //         ease: "power2.out",
    //         duration: 1.2,
    //       },
    //       "<"
    //     );
    // });

    visualTl.to(
      ".philosophy_visual_wrap.is-1",
      { yPercent: 290, ease: "none" },
      0
    );

    visualTl.to(
      ".philosophy_visual_wrap.is-2",
      { yPercent: 200, ease: "none" },
      0
    );

    visualTl.to(
      ".philosophy_visual_wrap.is-3",
      { yPercent: 120, ease: "none" },
      0
    );

    visualTl.to(
      ".philosophy_visual_wrap.is-4",
      { yPercent: -80, ease: "none" },
      0
    );

    visualTl.to(
      ".philosophy_visual_wrap.is-5",
      { yPercent: -120, ease: "none" },
      0
    );

    visualTl.to(
      ".philosophy_visual_wrap.is-6",
      { yPercent: -180, ease: "none" },
      0
    );
  }
};

const aboutDescAnim = () => {
  const container = document.querySelector(".about_desc_wrap");
  const visualContainer = document.querySelector(".about_desc_visual_list");

  if (container) {
    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top center",
        end: "bottom bottom",
        scrub: true,
      },
    });

    const split = SplitText.create("[data-text-animation='scrub']", {
      type: "chars, words",
    });

    textTl.from(
      split.chars,
      {
        opacity: 0.2,
        duration: 1,
        stagger: 0.2,
      },
      "<"
    );
  }

  if (visualContainer) {
    // mm.add("(min-width: 768px)", () => {
    const visualTl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // const items = visualContainer.querySelectorAll(".about_desc_visual_item");
    // items.forEach((el, index) => {
    //   const visualEl = el.querySelector("img");
    //   if (!visualEl) return;
    //   gsap.set(visualEl, { scale: 1.3 });
    //   gsap
    //     .timeline({
    //       scrollTrigger: {
    //         trigger: el,
    //         start: "top bottom",
    //         toggleActions: "play none none none",
    //       },
    //     })
    //     .fromTo(
    //       visualEl,
    //       { clipPath: "inset(0 0 100% 0)" },
    //       {
    //         clipPath: "inset(0 0 0% 0)",
    //         duration: 1.2,
    //         ease: "power3.out",
    //       }
    //     )
    //     .fromTo(
    //       visualEl,
    //       { scale: 1.3 },
    //       {
    //         scale: 1,
    //         clearProps: "transform",
    //         ease: "power2.out",
    //         duration: 1.2,
    //       },
    //       "<"
    //     );
    // });

    visualTl.to(
      ".about_desc_visual_item.is-1",
      { yPercent: 50, ease: "none" },
      0
    );

    visualTl.to(
      ".about_desc_visual_item.is-2",
      { yPercent: -5, ease: "none" },
      0
    );
    // });
  }
};

const countNumberAnim = () => {
  const numbers = document.querySelectorAll("[data-text-animation='number']");

  gsap.from(numbers, {
    textContent: 0,
    duration: 1.5,
    stagger: 0.25,
    snap: { textContent: 1 },
    scrollTrigger: {
      trigger: numbers,
      start: "top 90%",
    },
  });
};

const offersSwiper = () => {
  const target = document.querySelector(".swiper.is-offers");
  if (!target) return;
  new Swiper(target, {
    slidesPerView: "auto",
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
    },
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

  if (!telInputs.length) return;

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

function NavbarChangeTheme() {
  const navbar = document.querySelector(".nav_component");
  const sections = document.querySelectorAll("section");

  if (!sections.length) return;

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
        navbar.classList.remove("u-theme-light");
        navbar.classList.add("u-theme-dark");
      } else {
        navbar.classList.remove("u-theme-dark");
        navbar.classList.add("u-theme-light");
      }
    }
  }

  window.addEventListener("scroll", updateNavbarColor);
  window.addEventListener("resize", updateNavbarColor);
  updateNavbarColor();
}

function headingAnimation() {
  const items = document.querySelectorAll('[data-text-animation="heading"]');

  if (!items.length) return;

  items.forEach((item) => {
    const splitText = new SplitText(item, {
      type: "chars, words",
      charsClass: "split-char",
    });

    gsap.fromTo(
      splitText.chars,
      {
        // y: 50,
        autoAlpha: 0,
        filter: "blur(20px)",
        scale: 1.2,
      },
      {
        // y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        scale: 1,
        duration: 1.2,
        ease: "power4.out",
        stagger: {
          amount: 0.5,
          from: "start",
        },
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          once: true,
          // toggleActions: "play none none reverse",
        },
      }
    );
  });
}

const referencesSwiper = () => {
  const target = document.querySelector(".swiper.is-references");

  if (!target) return;

  new Swiper(target, {
    slidesPerView: "auto",
    centeredSlides: false,
    breakpoints: {
      768: {
        centeredSlides: true, // Key: Keeps the expanding item in focus
        initialSlide: 1,
      },
    },
    speed: 600, // Duration of the slide movement
    // Functionality
    slideToClickedSlide: true, // Allows clicking a side item to make it active/big

    navigation: {
      prevEl: "[data-references-swiper='prev-btn']",
      nextEl: "[data-references-swiper='next-btn']",
    },

    // Optional: Keyboard control
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  navObserve();
  countNumberAnim();

  emailValidation();
  telInputValidation();

  NavbarChangeTheme();

  testimonialSwiper();

  headingAnimation();

  // Home Page
  philosophyAnim();
  offersSwiper();

  referencesSwiper();

  // Real Estate Detail Page
  roomSwiper();
  planSwiper();

  // About Us Page
  aboutDescAnim();
  readMoreFunc();
});
