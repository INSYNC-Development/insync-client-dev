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

function initSwiperFooter() {
  const swiperFooter = document.querySelector(".swiper.is-footer");
  if (!swiperFooter) return;

  new Swiper(swiperFooter, {
    slidesPerView: "auto",
    loop: "true",
    autoplay: {
      delay: 3000,
    },
  });
}

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
        stagger: 0.3,
        ease: "elegantEase",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          once: true,
        },
      });
    }, item);

    item._headingAnimationCleanup = () => ctx.revert();
  });
}

function initDescReveal() {
  const descriptions = gsap.utils.toArray('[data-text-animation="desc"]');

  descriptions.forEach((desc) => {
    gsap.set(desc, { autoAlpha: 1 });

    desc.split = new SplitText(desc, {
      type: "lines",
      mask: "lines",
      linesClass: "desc-line",
    });

    gsap.set(desc.split.lines, {
      yPercent: 100,
      opacity: 0,
    });
  });

  ScrollTrigger.batch('[data-text-animation="desc"]', {
    start: "top 85%",

    onEnter: (batchElements) => {
      batchElements.forEach((el, index) => {
        gsap.to(el.split.lines, {
          yPercent: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power3.out",
          stagger: 0.1,
          overwrite: true,
        });
      });
    },
  });
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

const navbar = document.querySelector(".nav_component");

const AT_TOP_OFFSET = 100; // 👈 Change this value to whatever you need

let lastScrollY = window.scrollY;
let ticking = false;
let scrollTimeout = null;
let currentState = "at-top";

function setState(newState) {
  if (newState === currentState) return;
  currentState = newState;

  navbar.classList.remove(
    "is-at-top",
    "is-scrolling-down",
    "is-scrolling-up",
    "is-stopped"
  );

  switch (newState) {
    case "at-top":
      navbar.classList.add("is-at-top");
      break;
    case "scrolling-down":
      navbar.classList.add("is-scrolling-down");
      break;
    case "scrolling-up":
      navbar.classList.add("is-scrolling-up");
      break;
    case "stopped":
      navbar.classList.add("is-stopped");
      break;
  }
}

function updateScroll() {
  const currentScrollY = window.scrollY;

  if (currentScrollY <= AT_TOP_OFFSET) {
    // 👈 Updated
    setState("at-top");
  } else if (currentScrollY > lastScrollY) {
    setState("scrolling-down");
  } else if (currentScrollY < lastScrollY) {
    setState("scrolling-up");
  }

  lastScrollY = currentScrollY;
  ticking = false;
}

function onScroll() {
  if (!ticking) {
    window.requestAnimationFrame(updateScroll);
    ticking = true;
  }

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (window.scrollY > AT_TOP_OFFSET) {
      // 👈 Updated
      setState("stopped");
    } else {
      setState("at-top");
    }
  }, 350);
}

setState(window.scrollY <= AT_TOP_OFFSET ? "at-top" : "stopped"); // 👈 Updated

window.addEventListener("scroll", onScroll, { passive: true });

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

const otherProductSwiper = () => {
  const target = document.querySelector(".swiper.is-other-product");
  if (!target) return;

  new Swiper(target, {
    slidesPerView: 1,
    spaceBetween: 8,
    breakpoints: {
      767: {
        slidesPerView: 2,
      },
      991: {
        slidesPerView: 3,
      },
      1280: {
        slidesPerView: 4,
      },
    },
  });
};

// Nav Dropdown — Fetch nested CMS items from /navbar and inject into all component targets

function initNavDropdown() {
  const TARGET_SELECTOR = '[data-nav-menu="target"]';
  const SOURCE_SELECTOR = '[data-nav-menu="content"]';
  const SOURCE_PAGE = "/navbar";

  const targets = document.querySelectorAll(TARGET_SELECTOR);
  if (!targets.length) return;

  fetchNavContent(SOURCE_PAGE, SOURCE_SELECTOR, targets);
}

function fetchNavContent(pageUrl, sourceSelector, targets) {
  fetch(pageUrl)
    .then(function (res) {
      if (!res.ok) throw new Error("Nav fetch failed: " + res.status);
      return res.text();
    })
    .then(function (html) {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const content = parsed.querySelector(sourceSelector);
      if (!content)
        throw new Error("Source element not found: " + sourceSelector);

      targets.forEach(function (target) {
        injectNavContent(content, target);
      });
    })
    .catch(function (err) {
      console.warn("[NavDropdown]", err);
    });
}

function injectNavContent(content, target) {
  // Preserve the "Shop All" link before replacing
  const shopAllLink = target.querySelector(".nav_dropdown_link");

  target.innerHTML = "";

  if (shopAllLink) {
    target.appendChild(shopAllLink.cloneNode(true));
  }

  // Append all fetched nav mega lists
  Array.from(content.children).forEach(function (child) {
    target.appendChild(child.cloneNode(true));
  });
}

function initBackHistory() {
  const backButtons = document.querySelectorAll('[data-button="back-history"]');

  if (backButtons.length === 0) return;

  backButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      window.history.back();
    });
  });
}

function initFunction() {
  initSwiperFooter();
  initHeadingAnimation();
  // navObserve();
  initNavDropdown();
  initBackHistory();

  initDescReveal();

  // Product Detail
  otherProductSwiper();

  // Form validation
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
