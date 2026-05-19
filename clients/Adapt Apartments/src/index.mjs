// const lenis = new Lenis();

// function raf(time) {
//   lenis.raf(time);
//   requestAnimationFrame(raf);
// }

// requestAnimationFrame(raf);

// lenis.scrollTo(0, 0);

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (!isSafari) {
  const lenis = new Lenis({});

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  lenis.scrollTo(0, 0);
} else {
  document.documentElement.classList.remove(
    "lenis",
    "lenis-smooth",
    "lenis-scrolling"
  );

  document.documentElement.style.overflow = "auto";
}

CustomEase.create("mainEase", "0.23, 1, 0.32, 1");

let vSlide;

function initHeroLocations() {
  const firstSlide = document.querySelector(".v-slide");
  const list = document.querySelector(".v-slides");
  if (!firstSlide || !list) return;

  let elementHeight = firstSlide.clientHeight;
  animateTitle(elementHeight);

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const s = document.querySelector(".v-slide");
      if (!s) return;
      elementHeight = s.clientHeight;
      animateTitle(elementHeight);
    }, 150);
  });
}

function animateTitle(height) {
  const list = document.querySelector(".v-slides");
  let slides = Array.from(document.querySelectorAll(".v-slide"));
  if (!list || slides.length === 0) return;

  const oldClone = list.querySelector(".v-slide.is-clone");
  if (oldClone) oldClone.remove();

  const clone = slides[0].cloneNode(true);
  clone.classList.add("is-clone");
  clone.textLines = null;
  list.appendChild(clone);

  slides = Array.from(document.querySelectorAll(".v-slide"));

  const vsOpts = {
    slides,
    list,
    duration: 0.3,
    lineHeight: height,
    hold: 2,
  };

  const progress = vSlide ? vSlide.progress() : 0;

  if (vSlide) vSlide.kill();

  vSlide = gsap.timeline({ repeat: -1 });

  gsap.set(vsOpts.list, { y: 0 });

  vsOpts.slides.forEach((slide, i) => {
    // PERBAIKAN: Ubah y menjadi 0. Biarkan slide menumpuk ke bawah secara natural (sesuai flow CSS)
    gsap.set(slide, { y: 0 });

    let textLines = slide.textLines;
    if (!textLines) {
      textLines = slide.textLines = new SplitText(slide, {
        type: "lines",
      }).lines;
    }

    gsap.set(textLines, { y: 0 });
  });

  for (let i = 0; i < vsOpts.slides.length; i++) {
    const slide = vsOpts.slides[i];
    const textLines = slide.textLines;

    const label = "slide" + i;
    vSlide.add(label);

    if (i > 0) {
      vSlide.to(
        vsOpts.list,
        {
          duration: vsOpts.duration,
          // List bergerak ke ATAS
          y: i * -1 * vsOpts.lineHeight,
          ease: "power2.inOut",
        },
        label
      );

      vSlide.from(
        textLines,
        {
          duration: vsOpts.duration,
          // Teks masuk dari BAWAH
          y: height,
          stagger: vsOpts.duration / 10,
          ease: "power2.out",
        },
        label
      );
    }

    const isClone = slide.classList.contains("is-clone");
    if (!isClone) {
      vSlide.to(
        textLines,
        {
          duration: vsOpts.duration,
          // Teks keluar ke ATAS
          y: -height,
          stagger: vsOpts.duration / 10,
          ease: "power2.in",
        },
        "+=" + vsOpts.hold
      );
    }

    if (isClone) {
      vSlide.set(vsOpts.list, { y: 0 });
      vSlide.set(textLines, { y: 0 });
    }
  }

  return vSlide.progress(progress);
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

function imageAnimation() {
  const wrappers = document.querySelectorAll('[data-img-animation="scale"]');

  if (wrappers.length < 0) return;

  wrappers.forEach((wrapper) => {
    const image = wrapper.querySelector("img");
    const cards = wrapper.parentElement.querySelectorAll(
      '[data-element="card"]'
    );

    if (!image) return;

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top 85%",
          once: true,
        },
      });

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

      if (cards.length > 0) {
        tl.from(
          cards,
          {
            autoAlpha: 0,
            y: 30,
            duration: 1,
            ease: "power2.out",
            stagger: 0.2,
          },
          "-=1.2"
        );
      }
    }, wrapper);

    return () => ctx.revert();
  });
}

function stepFunction() {
  const stepNumbers = gsap.utils.toArray(".step_number_wrap");

  stepNumbers.forEach((num) => {
    ScrollTrigger.create({
      trigger: num,
      start: "top center",
      end: "top 40%",
      // markers: true,

      onEnter: () => num.setAttribute("active", ""),
      onLeaveBack: () => num.removeAttribute("active"),
    });
  });
}

function tabList() {
  const section = document.querySelector(".bilder_wrap");

  if (!section) return;

  const layouts = section.querySelectorAll(".bilder_layout");
  // const layouts = section.querySelectorAll(".bilder_left");
  const container = section.querySelector(".bilder_contain");

  if (layouts.length === 0 || !container) return;

  const tabNav = document.createElement("div");
  tabNav.classList.add("bilder_tabs_nav", "slider-pagination");

  const paginationItems = [];

  layouts.forEach((layout, index) => {
    layout.classList.add("bilder_tab_panel");

    if (index === 0) {
      layout.style.display = "";
      layout.classList.add("is-active");
    } else {
      layout.style.display = "none";
    }

    const paginationItem = layout.querySelector(".bilder_pagination_item");

    if (paginationItem) {
      tabNav.appendChild(paginationItem);
      paginationItem.setAttribute("data-index", index);

      if (index === 0) {
        paginationItem.classList.add("is-active");
      }

      paginationItems.push(paginationItem);
    }
  });

  // container.parentNode.insertBefore(tabNav, container);
  container.appendChild(tabNav);

  paginationItems.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetIndex = parseInt(this.getAttribute("data-index"));

      paginationItems.forEach((t) => t.classList.remove("is-active"));
      layouts.forEach((l) => {
        l.style.display = "none";
        l.classList.remove("is-active");
      });

      this.classList.add("is-active");
      if (layouts[targetIndex]) {
        layouts[targetIndex].style.display = "";
        layouts[targetIndex].classList.add("is-active");
      }
    });
  });
}

function initializeActiveSteps() {
  const stepItems = document.querySelectorAll(".feature_item_wrap");
  if (!stepItems.length) return;

  const section = document.querySelector(".feature_wrap");

  let hasStarted = false;

  function activateStep(index, pauseAutoplay = false) {
    stepItems.forEach((item) => {
      item.removeAttribute("active");
      item.classList.remove("is-paused");
    });

    const currentItem = stepItems[index];

    void currentItem.offsetWidth;

    currentItem.setAttribute("active", "");

    if (pauseAutoplay) {
      currentItem.classList.add("is-paused");
    }
  }

  function startSteps() {
    if (hasStarted) return;
    hasStarted = true;
    activateStep(0);
  }

  // Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startSteps();
        }
      });
    },
    {
      threshold: 0.3,
    }
  );

  if (section) {
    observer.observe(section);
  }

  stepItems.forEach((item, index) => {
    item.addEventListener("animationend", (event) => {
      if (event.animationName === "fillProgress") {
        const nextIndex = (index + 1) % stepItems.length;
        activateStep(nextIndex);
      }
    });

    // item.addEventListener("click", () => {
    //   activateStep(index, true);
    // });

    // Pause saat hover
    // item.addEventListener("mouseenter", () => {
    //   const activeItem = document.querySelector(".feature_item_wrap[active]");
    //   if (activeItem) {
    //     activeItem.classList.add("is-paused");
    //   }
    // });

    // // Lanjutkan saat hover selesai
    // item.addEventListener("mouseleave", () => {
    //   const activeItem = document.querySelector(".feature_item_wrap[active]");
    //   if (activeItem && !activeItem.classList.contains("is-clicked")) {
    //     activeItem.classList.remove("is-paused");
    //   }
    // });

    item.addEventListener("click", () => {
      activateStep(index);
    });

    item.addEventListener("mouseenter", () => {
      if (window.innerWidth > 991) {
        const activeItem = document.querySelector(".feature_item_wrap[active]");
        if (activeItem) {
          activeItem.classList.add("is-paused");
        }
      }
    });

    item.addEventListener("mouseleave", () => {
      if (window.innerWidth > 991) {
        const activeItem = document.querySelector(".feature_item_wrap[active]");
        if (activeItem && !activeItem.classList.contains("is-clicked")) {
          activeItem.classList.remove("is-paused");
        }
      }
    });
  });

  // Tidak langsung activateStep(0), tunggu section on view
}

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
      trigger: elements,
      start: "top 90%",
      end: "bottom center",
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          x: 0,
          stagger: 0.3,
          duration: 1,
          ease: "mainEase",
          overwrite: true,
        });
      },
      // markers: true,
    });
  }
}

function vimeoHandler() {
  const containers = document.querySelectorAll(".video_vimeo_wrap");

  if (containers.length === 0) return;

  // Simpan SVG Anda dalam variabel agar kode rapi
  const playIconSVG = `<svg data-wf--icon-play--variant="base" xmlns="http://www.w3.org/2000/svg" width="65px" viewBox="0 0 65 65" fill="none" class="button_icon_play" style="color: white; filter: drop-shadow(0px 4px 10px rgba(0,0,0,0.3)); transition: transform 0.2s ease;"><path d="M32.5 0C26.0721 0 19.7886 1.90609 14.444 5.47724C9.09938 9.04838 4.93378 14.1242 2.47393 20.0628C0.0140817 26.0014 -0.629527 32.5361 0.624493 38.8404C1.87851 45.1448 4.97384 50.9358 9.51904 55.481C14.0643 60.0262 19.8552 63.1215 26.1596 64.3755C32.464 65.6295 38.9986 64.9859 44.9372 62.5261C50.8758 60.0662 55.9516 55.9006 59.5228 50.556C63.0939 45.2114 65 38.9279 65 32.5C64.9909 23.8833 61.5639 15.622 55.4709 9.52908C49.378 3.43612 41.1168 0.00909943 32.5 0ZM45.1719 34.5563L28.9219 45.8063C28.5467 46.0657 28.1078 46.2175 27.6525 46.2453C27.1973 46.2731 26.7431 46.1759 26.3391 45.9641C25.9352 45.7523 25.5969 45.4341 25.3608 45.0438C25.1248 44.6535 25 44.2061 25 43.75V21.25C25 20.7939 25.1248 20.3465 25.3608 19.9562C25.5969 19.5659 25.9352 19.2477 26.3391 19.0359C26.7431 18.8241 27.1973 18.7269 27.6525 18.7547C28.1078 18.7825 28.5467 18.9343 28.9219 19.1937L45.1719 30.4437C45.5045 30.6737 45.7763 30.981 45.9641 31.3391C46.1519 31.6973 46.25 32.0956 46.25 32.5C46.25 32.9044 46.1519 33.3027 45.9641 33.6609C45.7763 34.019 45.5045 34.3263 45.1719 34.5563Z" fill="currentColor"></path></svg>`;

  containers.forEach((container) => {
    const videoId = container.getAttribute("data-vimeo-id");
    if (!videoId) return;

    // 1. Styling Container Otomatis
    Object.assign(container.style, {
      position: "relative",
      width: "100%",
      aspectRatio: "16/9",
      backgroundColor: "#000",
      cursor: "pointer",
      backgroundImage: `url(https://vumbnail.com/${videoId}.jpg)`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    container.innerHTML = playIconSVG;

    container.onmouseenter = () => {
      container.querySelector("svg").style.transform = "scale(1.1)";
    };
    container.onmouseleave = () => {
      container.querySelector("svg").style.transform = "scale(1)";
    };

    // 4. Logika Klik
    container.addEventListener(
      "click",
      function () {
        const iframe = document.createElement("iframe");
        iframe.setAttribute(
          "src",
          `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`
        );
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "autoplay; fullscreen; picture-in-picture"
        );

        Object.assign(iframe.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          zIndex: "5",
        });

        this.innerHTML = "";
        this.appendChild(iframe);
      },
      { once: true }
    );
  });
}

// Inisialisasi
document.addEventListener("DOMContentLoaded", vimeoHandler);

function initFunction() {
  document.fonts.ready.then(() => {
    headingAnimation();
  });

  setTimeout(() => {
    imageAnimation();
    initHeroLocations();
  }, 1200);

  stepFunction();
  tabList();
  initializeActiveSteps();
  initScrollAnimations();
}

document.addEventListener("DOMContentLoaded", initFunction);

window.addEventListener("resize", initHeroLocations);

const navbar = document.querySelector(".nav_component");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("is-scroll", window.scrollY > 50);
});

document.addEventListener("DOMContentLoaded", function () {
  const stickyWrap = document.querySelector(".sticky_button_wrap");
  const greenLabel = document.querySelector(".hero_green_label");
  const buttonWrap = document.querySelector(
    ".sticky_button_wrap .button_main_wrap"
  );
  const footer = document.querySelector("footer");
  const heroSection = document.querySelector("section");

  if (!stickyWrap || !buttonWrap || !footer || !heroSection) return;

  function checkPosition() {
    const stickyRect = stickyWrap.getBoundingClientRect();
    const buttonRect = buttonWrap.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const heroRect = heroSection.getBoundingClientRect();

    const heroCenter = heroRect.top + heroRect.height / 4;

    if (stickyRect.top < heroCenter) {
      stickyWrap.classList.add("is-hidden");
      if (greenLabel) {
        greenLabel.classList.add("is-hidden");
      }
    } else {
      stickyWrap.classList.remove("is-hidden");
      if (greenLabel) {
        greenLabel.classList.remove("is-hidden");
      }
    }

    if (buttonRect.bottom >= footerRect.top) {
      buttonWrap.classList.add("u-theme-brand");
    } else {
      buttonWrap.classList.remove("u-theme-brand");
    }
  }

  window.addEventListener("scroll", checkPosition, { passive: true });
  window.addEventListener("resize", checkPosition, { passive: true });

  checkPosition();
});

// Test
// document.querySelectorAll(".page_main img").forEach((img) => {
//   const originalSrc = img.src;

//   if (!originalSrc || originalSrc.includes("images.weserv.nl")) return;

//   img.removeAttribute("srcset");
//   img.removeAttribute("sizes");

//   const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
//     originalSrc
//   )}&h=800&output=webp`;

//   img.src = proxyUrl;
// });
