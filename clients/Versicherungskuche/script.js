// const lenis = new Lenis();

// function raf(time) {
//   lenis.raf(time);
//   requestAnimationFrame(raf);
// }

// requestAnimationFrame(raf);

// lenis.scrollTo(0, 0);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: "vertical",
  gestureDirection: "vertical",
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

// Connect Lenis to ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

function initSupportTabs() {
  const tabHeaders = document.querySelectorAll(".support_header_item");
  if (!tabHeaders.length) return;

  const ACTIVE_TARGETS = [
    ".support_header_item_icon_wrap",
    ".support_card_item_visual_wrap",
    ".support_card_content_wrap",
    ".button_main_wrap",
  ].join(", ");

  function activateTab(header) {
    const step = header.getAttribute("data-step-item");

    document
      .querySelectorAll(ACTIVE_TARGETS)
      .forEach((el) => el.classList.remove("is-active"));

    const iconWrap = header.querySelector(".support_header_item_icon_wrap");
    if (iconWrap) iconWrap.classList.add("is-active");

    document
      .querySelectorAll(`[data-step-item="${step}"]`)
      .forEach((el) => el.classList.add("is-active"));
  }

  tabHeaders.forEach((header) => {
    if (!header.hasAttribute("tabindex")) {
      header.setAttribute("tabindex", "0");
      header.setAttribute("role", "button");
    }

    header.addEventListener("click", function () {
      activateTab(this);
    });

    header.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateTab(this);
      }
    });
  });

  activateTab(tabHeaders[0]);
}

function initTestimonialSwiper() {
  const swiperElement = document.querySelector(".swiper.is-testimonial");
  if (!swiperElement) return;

  new Swiper(swiperElement, {
    slidesPerView: 1,
    spaceBetween: 30,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    speed: 500,
    pagination: {
      el: ".testimonial_dot_wrap",
      clickable: true,
    },
    navigation: {
      nextEl: "[data-swiper-button='next']",
      prevEl: "[data-swiper-button='prev']",
    },
  });
}

// function initHeadingAnimation() {
//   if (
//     typeof gsap === "undefined" ||
//     typeof SplitText === "undefined" ||
//     typeof CustomEase === "undefined"
//   )
//     return;

//   if (!gsap.parseEase("elegantEase")) {
//     CustomEase.create("elegantEase", "M0,0 C0.16,1 0.3,1 1,1");
//   }

//   const items = document.querySelectorAll("[data-text-animation-heading]");

//   items.forEach((item) => {
//     const ctx = gsap.context(() => {
//       const splitText = new SplitText(item, {
//         type: "lines",
//         mask: "lines",
//         linesClass: "heading-line",
//       });

//       gsap.set(splitText.lines, {
//         yPercent: 100,
//         opacity: 0,
//       });

//       gsap.to(splitText.lines, {
//         yPercent: 0,
//         opacity: 1,
//         duration: 0.9,
//         ease: "elegantEase",
//         stagger: 0.12,
//         scrollTrigger: {
//           trigger: item,
//           start: "top 88%",
//           once: true,
//           // markers: true
//         },
//       });
//     }, item);

//     item._headingAnimationCleanup = () => ctx.revert();
//   });
// }

function initHeadingAnimation() {
  if (
    typeof gsap === "undefined" ||
    typeof SplitText === "undefined" ||
    typeof ScrollTrigger === "undefined"
  )
    return;

  if (!gsap.parseEase("elegantEase")) {
    CustomEase.create("elegantEase", "0.25, 1, 0.5, 1");
  }

  const items = document.querySelectorAll("[data-text-animation-heading]");

  items.forEach((item) => {
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const split = new SplitText(item, {
        type: "lines",
        mask: "lines",
        linesClass: "heading-line",
      });

      gsap.set(split.lines, {
        yPercent: 100,
      });

      gsap.to(split.lines, {
        yPercent: 0,
        duration: 1,
        delay: 0.3,
        stagger: 0.3,
        ease: "elegantEase",
        scrollTrigger: {
          trigger: item,
          start: "top 95%",
          once: true,
        },
      });
    }, item);

    item._headingAnimationCleanup = () => ctx.revert();
  });
}

// function initDescriptionAnimation() {
//   if (typeof gsap === "undefined" || typeof SplitText === "undefined") return;

//   if (!gsap.parseEase("elegantEase")) {
//     CustomEase.create("elegantEase", "0.25, 1, 0.5, 1");
//   }

//   const runAnimation = () => {
//     const items = document.querySelectorAll("[data-text-animation-desc]");

//     items.forEach((item) => {
//       const ctx = gsap.context(() => {
//         if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
//           return;
//         }

//         const split = new SplitText(item, {
//           type: "lines",
//           mask: "lines",
//           linesClass: "desc-line",
//         });

//         gsap.set(split.lines, {
//           yPercent: 100,
//         });

//         gsap.to(split.lines, {
//           yPercent: 0,
//           duration: 1,
//           ease: "elegantEase",
//           stagger: 0.3,
//           scrollTrigger: {
//             trigger: item,
//             start: "top 95%",
//             once: true,
//           },
//         });
//       }, item);

//       item._descAnimationCleanup = () => ctx.revert();
//     });
//   };

//   if (document.fonts && document.fonts.ready) {
//     document.fonts.ready.then(runAnimation);
//   } else {
//     window.addEventListener("load", runAnimation);
//   }
// }

function recruitmentAnim() {
  const section = document.querySelector(".challenge_wrap");
  if (!section) return;
  const mm = gsap.matchMedia();

  ScrollTrigger.config({ ignoreMobileResize: true });

  // mm.add("(min-width: 992px)", () => {
  gsap.context(() => {
    const items = section.querySelectorAll(".challenge_card_item");
    if (items.length === 0) return;

    items.forEach((item, index) => {
      if (index === items.length - 1) return;
      ScrollTrigger.create({
        trigger: item,
        start: "top 20%",
        scrub: true,
        onEnter: () => {
          gsap.to(item, { scale: 0.85, filter: "blur(2px)" });
        },
        onLeaveBack: () => {
          gsap.to(item, { scale: 1, filter: "blur(0px)" });
        },
        // markers: true,
      });
    });
  });
  return () => {
    gsap.set(section.querySelectorAll(".challenge_card_item"), {
      clearProps: "all",
    });
  };
  // });
}

function initStatsAnimation() {
  const numberElements = document.querySelectorAll(
    ".insurance_stats_number span:first-child"
  );

  numberElements.forEach((el) => {
    const originalText = el.innerText.trim();
    const targetNumber = parseFloat(originalText);
    const suffix = originalText.replace(/[0-9.,]/g, "");

    el.innerText = "0" + suffix;

    let counter = { val: 0 };

    gsap.to(counter, {
      val: targetNumber,
      duration: 2.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".insurance_stats_wrap",
        start: "top 80%",
        toggleActions: "play none none none",
      },
      onUpdate: function () {
        el.innerText = Math.ceil(counter.val) + suffix;
      },
    });
  });
}

function initLottie() {
  if (typeof lottie === "undefined") return;

  const lottieContainers = document.querySelectorAll(
    ".lottie-animation:not(.u-lottie)"
  );

  lottieContainers.forEach((container) => {
    if (container.getAttribute("data-animation-type") === "lottie") return;

    const lottieUrl = container.getAttribute("data-lottie-url");
    if (!lottieUrl) return;

    const anim = lottie.loadAnimation({
      container: container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: lottieUrl,
    });

    let isHovering = false;

    // Scroll trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Hanya jalankan via scroll jika TIDAK sedang di-hover
          if (entry.isIntersecting && !isHovering) {
            anim.goToAndPlay(0, true);
          }
        });
      },
      { threshold: 0.5 }
    ); // Ubah ke 0.5 agar lebih responsif

    observer.observe(container);

    // Hover trigger
    const cardItem = container.closest(".service_card_item");
    if (cardItem) {
      cardItem.addEventListener("mouseenter", () => {
        if (anim.isLoaded) {
          isHovering = true;
          anim.goToAndPlay(0, true);
        }
      });

      cardItem.addEventListener("mouseleave", () => {
        isHovering = false;
      });
    }
  });
}

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

function initFunction() {
  initSupportTabs();
  initTestimonialSwiper();
  initHeadingAnimation();
  recruitmentAnim();
  initStatsAnimation();

  initLottie();

  // FORM VALIDATION
  telInputValidation();
  emailValidation();
}

document.addEventListener("DOMContentLoaded", function () {
  document.fonts.ready.then(() => {
    document.body.style.opacity = "1";
    initFunction();
    ScrollTrigger.refresh();
  });
});
