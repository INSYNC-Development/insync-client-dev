// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let tickerFn;
let teamInstance;
let teamContentInstance;
let socialInstance;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

gsap.registerPlugin(CustomEase, ScrollTrigger, Observer);
CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
}

// function initAfterEnterFunctions(next) {
//   nextPage = next || document;

//   if (hasLenis) {
//     lenis.resize();
//   }

//   if (hasScrollTrigger) {
//     ScrollTrigger.refresh();
//   }

//   // --- RE-INIT WEBFLOW IX2 ---
//   if (window.Webflow) {
//     window.Webflow.destroy();
//     window.Webflow.ready();

//     const ix2 = window.Webflow.require("ix2");
//     if (ix2) {
//       ix2.init();
//     }

//     const lottie = window.Webflow.require("lottie");
//     if (lottie) {
//       lottie.init();
//     }
//   }

//   initfunction(nextPage);
// }

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  if (hasLenis) {
    lenis.resize();
  }

  // --- RE-INIT WEBFLOW ---
  if (window.Webflow) {
    window.Webflow.destroy();
    window.Webflow.ready();

    const ix2 = window.Webflow.require("ix2");
    if (ix2) {
      ix2.init();
    }

    const lottie = window.Webflow.require("lottie");
    if (lottie) {
      lottie.init();

      setTimeout(() => {
        nextPage.querySelectorAll(".lottie_animation").forEach((el) => {
          const hasRendered = el.querySelector("svg, canvas");

          if (!hasRendered) {
            try {
              lottie.createInstance(el);
            } catch (err) {
              console.warn("Lottie re-init failed:", err);
            }
          }
        });
      }, 300);
    }
  }

  initfunction(nextPage);

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

// function runPageOnceAnimation(next) {
//   const tl = gsap.timeline();

//   tl.call(
//     () => {
//       resetPage(next);
//     },
//     null,
//     0
//   );

//   return tl;
// }

// function runPageLeaveAnimation(current, next) {
//   const transitionWrap = document.querySelector("[data-transition-wrap]");
//   const transitionPanel = transitionWrap.querySelector(
//     "[data-transition-panel]"
//   );
//   const transitionLabel = transitionWrap.querySelector(
//     "[data-transition-label]"
//   );
//   const transitionLabelText = transitionWrap.querySelector(
//     "[data-transition-label-text]"
//   );

//   const nextPageName = next.getAttribute("data-page-name");
//   transitionLabelText.innerText = nextPageName || "Hi there";

//   const tl = gsap.timeline({
//     onComplete: () => {
//       current.remove();
//     },
//   });

//   if (reducedMotion) {
//     return tl.set(current, { autoAlpha: 0 });
//   }

//   tl.set(transitionPanel, { autoAlpha: 1 }, 0);
//   tl.set(next, { autoAlpha: 0 }, 0);

//   tl.fromTo(
//     transitionPanel,
//     { yPercent: 0 },
//     { yPercent: -100, duration: 0.8 },
//     0
//   );

//   tl.fromTo(transitionLabel, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.2");

//   tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.8 }, 0);

//   return tl;
// }

// function runPageEnterAnimation(next) {
//   const transitionWrap = document.querySelector("[data-transition-wrap]");
//   const transitionPanel = transitionWrap.querySelector(
//     "[data-transition-panel]"
//   );
//   const transitionLabel = transitionWrap.querySelector(
//     "[data-transition-label]"
//   );

//   const tl = gsap.timeline();

//   if (reducedMotion) {
//     tl.set(next, { autoAlpha: 1 });
//     tl.add("pageReady");
//     tl.call(resetPage, [next], "pageReady");
//     return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
//   }

//   tl.add("startEnter", 1.25);

//   tl.set(next, { autoAlpha: 1 }, "startEnter");

//   tl.fromTo(
//     transitionPanel,
//     { yPercent: -100 },
//     { yPercent: -200, duration: 1, overwrite: "auto", immediateRender: false },
//     "startEnter"
//   );

//   tl.set(transitionPanel, { autoAlpha: 0 }, ">");

//   tl.fromTo(
//     transitionLabel,
//     { autoAlpha: 1 },
//     { autoAlpha: 0, duration: 0.4, overwrite: "auto", immediateRender: false },
//     "startEnter+=0.1"
//   );

//   tl.from(next, { y: "15vh", duration: 1 }, "startEnter");

//   tl.add("pageReady");
//   tl.call(resetPage, [next], "pageReady");

//   return new Promise((resolve) => {
//     tl.call(resolve, null, "pageReady");
//   });
// }

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(
    () => {
      resetPage(next);
    },
    null,
    0,
  );

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector(
    "[data-transition-panel]",
  );

  // Elemen dari animasi baru
  const transitionPanelTop = transitionWrap.querySelector(
    "[data-transition-panel-top]",
  );
  const transitionPanelBottom = transitionWrap.querySelector(
    "[data-transition-panel-bottom]",
  );
  const transitionLogo = transitionWrap.querySelector("[data-transition-logo]");
  const transitionLogoPath = transitionWrap.querySelectorAll("path");

  // Elemen label dari kode lama
  const transitionLabel = transitionWrap.querySelector(
    "[data-transition-label]",
  );
  const transitionLabelText = transitionWrap.querySelector(
    "[data-transition-label-text]",
  );

  // Update teks dinamis
  if (transitionLabelText) {
    const nextPageName = next.getAttribute("data-page-name");
    transitionLabelText.innerText = nextPageName || "Hi there";
  }

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  // Setup state awal
  tl.set(transitionPanel, { autoAlpha: 1 }, 0);
  if (transitionPanelTop)
    tl.set(transitionPanelTop, { scaleY: 0, height: "15vw" }, 0);
  if (transitionPanelBottom)
    tl.set(transitionPanelBottom, { scaleY: 1, height: "20vw" }, 0);
  if (transitionLogo) tl.set(transitionLogo, { autoAlpha: 1 }, 0);
  if (transitionLogoPath.length)
    tl.set(transitionLogoPath, { yPercent: 150, xPercent: -68.2 }, 0);

  tl.set(next, { autoAlpha: 0 }, 0);

  // Animasi panel
  tl.fromTo(
    transitionPanel,
    { yPercent: 0 },
    { yPercent: -100, duration: 1 },
    0,
  );
  if (transitionPanelTop)
    tl.fromTo(
      transitionPanelTop,
      { scaleY: 0 },
      { scaleY: 1, duration: 1 },
      "<",
    );

  // Animasi logo & label
  if (transitionLogoPath.length) {
    tl.fromTo(
      transitionLogoPath,
      { yPercent: 150, xPercent: -68.2 },
      {
        yPercent: 0,
        xPercent: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: { amount: 0.1, from: "start" },
      },
      "<+=0.4",
    );
  }
  if (transitionLabel) {
    tl.fromTo(transitionLabel, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.2");
  }

  // Animasi halaman keluar
  tl.fromTo(current, { y: "0vh" }, { y: "-15dvh", duration: 1 }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector(
    "[data-transition-panel]",
  );
  const transitionPanelBottom = transitionWrap.querySelector(
    "[data-transition-panel-bottom]",
  );
  const transitionLogoPath = transitionWrap.querySelectorAll("path");
  const transitionLabel = transitionWrap.querySelector(
    "[data-transition-label]",
  );

  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1.35);

  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.fromTo(
    transitionPanel,
    { yPercent: -100 },
    {
      yPercent: -200,
      duration: 1,
      overwrite: "auto",
      immediateRender: false,
    },
    "startEnter",
  );

  if (transitionPanelBottom) {
    tl.fromTo(
      transitionPanelBottom,
      { scaleY: 1 },
      { scaleY: 0, duration: 1 },
      "<",
    );
  }

  tl.set(transitionPanel, { autoAlpha: 0 }, ">");

  if (transitionLogoPath.length) {
    tl.to(
      transitionLogoPath,
      {
        yPercent: -150,
        xPercent: 68.2,
        duration: 1.2,
        ease: "expo.inOut",
        stagger: { amount: -0.1, from: "start" },
      },
      "startEnter-=0.4",
    );
  }

  if (transitionLabel) {
    tl.fromTo(
      transitionLabel,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        duration: 0.4,
        overwrite: "auto",
        immediateRender: false,
      },
      "startEnter+=0.1",
    );
  }

  tl.from(next, { y: "25dvh", duration: 1 }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter((data) => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
  if (typeof Observer !== "undefined") {
    Observer.getAll().forEach((obs) => obs.kill());
  }
});

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
  initAfterEnterFunctions(data.next.container);

  renderRecaptcha(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,
      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },
      async leave(data) {
        return runPageLeaveAnimation(
          data.current.container,
          data.next.container,
        );
      },
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },
  ],
});

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: { nav: "dark", transition: "light" },
  dark: { nav: "light", transition: "dark" },
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) transitionEl.dataset.themeTransition = config.transition;

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) nav.dataset.themeNav = config.nav;
}

function initLenis() {
  if (lenis || !hasLenis) return;

  lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  var currentNodes = document.querySelectorAll("nav [data-barba-update]");

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    var newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
  });
}

// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

function initfunction(container) {
  const q = gsap.utils.selector(container);

  gsap.set(container, { clearProps: "all" });

  window.scrollTo(0, 0);

  setTimeout(() => {
    const hash = window.location.hash;

    if (hash) {
      const targetElement = document.querySelector(hash);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, 200);

  headingAnimation(container);
  heroInitial(container, q);
  heroSequence(container);
  heroScrollOutAnimation(container, q);
  whoSectionAnimation(container);
  cloudAnimation(container);
  horizontalLoop(container);
  buttonAnimation(container);
  navbarInteraction(container);
  projetInteraction(container);
  processAnimation(container);
  teamSlider(container);
  teamContentSlider(container);
  socialSlider(container);
  formValidation(container);
  footerYear(container);
  // openProject(container);
  initModalBasic(container);
}

function headingAnimation(container) {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  container
    .querySelectorAll('[data-text-animation="heading"]')
    .forEach((text) => {
      const splitText = new SplitText(text, { type: "words" });

      gsap.from(splitText.words, {
        opacity: 0,
        y: 40,
        filter: "blur(10px)",
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: text,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          splitText.revert();
        },
      });
    });
}

function heroInitial(container, q) {
  const section = container.querySelector(".hero_wrap");
  if (!section) return;

  const tl = gsap.timeline({});

  tl.from(
    q(
      ".hero_content .tag_wrap, .hero_content h1, .hero_content .hero_desc, .hero_wrap .button_main_wrap",
    ),
    {
      y: 20,
      opacity: 0,
      filter: "blur(10px)",
      stagger: 0.2,
      ease: "power2.inOut",
    },
  );
}

function heroSequence(container) {
  const wrapper = container.querySelector(".scroll-wrap");
  const bg = container.querySelector(".scroll_bg");
  const canvas = container.querySelector("[data-hero='sequence-canvas']");

  if (!wrapper || !bg || !canvas) return;

  const ctx = canvas.getContext("2d");

  const config = {
    baseUrl:
      "https://scroll-sequence-prod.s3.eu-central-1.amazonaws.com/00000/inventry-v3/",
    frameCount: 211,
    padding: 5,
    suffix: "",
    extension: ".jpg",
    prefix: "frame",
  };

  // const config = {
  //   baseUrl:
  //     "https://scroll-sequence-prod.s3.eu-central-1.amazonaws.com/00000/inventry-v2/",
  //   frameCount: 150,
  //   padding: 5,
  //   suffix: "",
  //   extension: ".jpg",
  //   prefix: "frame",
  // };

  const images = [];
  const playhead = { frame: 0 };

  const getImageUrl = (index) => {
    const paddedIndex = (index + 1).toString().padStart(config.padding, "0");
    return `${config.baseUrl}${config.prefix}${paddedIndex}${config.suffix}${config.extension}`;
  };

  function render() {
    const img = images[playhead.frame];

    if (!img || !img.complete) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let renderWidth, renderHeight;

    if (canvasRatio > imgRatio) {
      renderWidth = canvas.width;
      renderHeight = canvas.width / imgRatio;
    } else {
      renderHeight = canvas.height;
      renderWidth = canvas.height * imgRatio;
    }

    const x = (canvas.width - renderWidth) * 0.5;
    const y = (canvas.height - renderHeight) * 0.5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, renderWidth, renderHeight);
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    canvas.width = rect.width;
    canvas.height = rect.height;

    render();
  }

  function initGSAP() {
    gsap.to(playhead, {
      frame: config.frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
      },
      onUpdate: render,
    });
  }

  function preloadRestOfImages() {
    for (let i = 1; i < config.frameCount; i++) {
      const img = new Image();
      img.src = getImageUrl(i);
      images[i] = img;
    }
  }

  const firstFrame = new Image();
  firstFrame.src = getImageUrl(0);

  firstFrame.onload = () => {
    images[0] = firstFrame;

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    initGSAP();

    preloadRestOfImages();
  };
}

// function heroScrollOutAnimation(container, q) {
//   const section = container.querySelector(".hero_wrap");
//   if (!section) return;

//   const tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: section,
//       start: "top top",
//       end: "bottom 80%",
//       scrub: true,
//     },
//   });

//   tl.to(
//     q(
//       ".hero_content .tag_wrap, .hero_content h1, .hero_content .hero_desc, .hero_wrap .button_main_wrap"
//     ),
//     {
//       y: -20,
//       opacity: 0,
//       filter: "blur(10px)",
//       stagger: 0.1,
//       ease: "power2.inOut",
//     }
//   );

//   tl.to(
//     q(".hero_bg"),
//     {
//       xPercent: -100,
//       ease: "power2.inOut",
//     },
//     "-=0.3"
//   );
// }

function heroScrollOutAnimation(container, q) {
  const section = container.querySelector(".hero_wrap");
  if (!section) return;

  const heroItems = q(
    ".hero_content .tag_wrap, .hero_content h1, .hero_content .hero_desc, .hero_wrap .button_main_wrap",
  );

  const heroBg = q(".hero_bg");

  gsap.set(heroItems, {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
  });

  gsap.set(heroBg, {
    xPercent: 0,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom 80%",
      scrub: true,
    },
  });

  tl.to(heroItems, {
    y: -20,
    opacity: 0,
    filter: "blur(10px)",
    stagger: 0.1,
    ease: "power2.inOut",
  });

  tl.to(
    heroBg,
    {
      xPercent: -100,
      ease: "power2.inOut",
    },
    "-=0.3",
  );
}

function whoSectionAnimation(container) {
  const wrapper = container.querySelector(".scroll-wrap");
  const section = container.querySelector(".who_wrap");
  const heading = container.querySelector(".who_heading");

  if (!section || !heading) return;

  const headingSplit = new SplitText(heading, { type: "words" });

  gsap.set(headingSplit.words, {
    opacity: 0,
    yPercent: 20,
    filter: "blur(10px)",
  });

  gsap.to(headingSplit.words, {
    opacity: 1,
    yPercent: 0,
    filter: "blur(0px)",
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: wrapper,
      start: "30% top",
      end: "60% bottom",
      // pin: true,
      scrub: true,
    },
  });
}

function cloudAnimation(container) {
  const section = container.querySelector(".scroll-wrap");
  const canvas = container.querySelector("[data-canvas='cloud-effect']");

  if (!section || !canvas) return;

  const ctx = canvas.getContext("2d");

  let width, height;
  let scrollProgress = 0;

  function resize() {
    width = canvas.width = Math.floor(canvas.clientWidth);
    height = canvas.height = Math.floor(canvas.clientHeight);
  }
  window.addEventListener("resize", resize);
  resize();

  function createCloudPuff(r, g, b, alpha) {
    const size = 256;
    const center = size / 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const oCtx = offscreen.getContext("2d");

    const gradient = oCtx.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    oCtx.fillStyle = gradient;
    oCtx.fillRect(0, 0, size, size);
    return offscreen;
  }

  const puffTextures = [
    createCloudPuff(100, 105, 110, 0.2),
    createCloudPuff(180, 185, 190, 0.2),
    createCloudPuff(255, 255, 255, 0.15),
  ];

  const particles = [];

  // --- PERUBAHAN UTAMA: Fungsi Dinamis ---
  function initParticles() {
    particles.length = 0;

    // 1. Jumlah Partikel Dinamis (Lebar layar * 0.15, minimal 120 awan)
    // Desktop (1920px) = ~380 awan | Mobile (400px) = ~180 awan
    let dynamicCount = Math.floor(window.innerWidth * 0.15) + 120;

    // 2. Ukuran Awan Dinamis
    // Desktop = Gumpalan awan lebih besar agar menutup celah | Mobile = Lebih kecil
    let baseSize = Math.max(window.innerWidth * 0.25, 300);

    for (let i = 0; i < dynamicCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 3.5), // Ekor awan panjang ke bawah
        // Ukuran acak berdasarkan baseSize
        size: Math.random() * baseSize + baseSize * 0.6,
        windX: (Math.random() - 0.5) * 1.5,
        layer: Math.floor(Math.random() * 3),
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.01,
      });
    }
    particles.sort((a, b) => a.layer - b.layer);
  }

  initParticles();

  // Regenerate awan jika ukuran layar berubah (misal HP di-rotate)
  // Kita pakai timeout (debounce) ringan agar tidak lag saat window di-drag di PC
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initParticles, 200);
  });

  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: section,
        start: "70% top",
        end: "bottom bottom",
        // markers: true,
        scrub: true,
        onUpdate: (self) => {
          scrollProgress = self.progress;
        },
      },
    },
  );

  const finalSolidColor = "253, 253, 253";

  function animate() {
    ctx.clearRect(0, 0, width, height);

    let cloudBankY = height + 300 - scrollProgress * (height * 3);

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];

      p.x += p.windX;
      p.angle += p.spinSpeed;

      if (p.x > width + p.size / 2) p.x = -p.size / 2;
      if (p.x < -p.size / 2) p.x = width + p.size / 2;

      let drawY = cloudBankY + p.y;

      if (drawY > -p.size && drawY < height + p.size) {
        ctx.save();
        ctx.translate(p.x, drawY);
        ctx.rotate(p.angle);
        ctx.drawImage(
          puffTextures[p.layer],
          -p.size / 2,
          -p.size / 2,
          p.size,
          p.size,
        );
        ctx.restore();
      }
    }

    // Transisi Warna Solid
    if (scrollProgress > 0.6) {
      let solidOpacity = Math.min(1, (scrollProgress - 0.6) * 5);
      ctx.fillStyle = `rgba(${finalSolidColor}, ${solidOpacity})`;
      ctx.fillRect(0, 0, width, height);
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function horizontalLoop(container) {
  const slider = container.querySelector('[data-animation="slider"]');
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
  let itemWidth = 0;

  originalItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const style = window.getComputedStyle(item);
    const w =
      rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);

    singleSetWidth += w;

    if (index === 0) {
      itemWidth = w;
    }
  });

  gsap.set(slider, {
    willChange: "transform",
    touchAction: "pan-y",
  });

  const setX = gsap.quickSetter(slider, "x", "px");
  const lerp = (a, b, n) => a + (b - a) * n;

  let currentX = 0;
  const speedMultiplier = parseFloat(slider.getAttribute("data-speed")) || 1;

  const autoScrollSpeed = 0.5 * speedMultiplier;
  const scrollForce = 0.05;
  const dragForce = 0.1;
  const friction = 0.05;
  let velocity = autoScrollSpeed;

  setX(0);

  Observer.create({
    target: window,
    type: "wheel,touch,scroll",
    onChange: (self) => {
      if (window.innerWidth <= 1024) return;

      if (window.scrollY <= 0 && self.deltaY < 0) return;
      velocity += self.deltaY * scrollForce;
    },
  });

  Observer.create({
    target: slider,
    type: "touch,pointer",
    // preventDefault: true,
    onChange: (self) => {
      velocity += -self.deltaX * dragForce;
    },
  });

  const prevBtn = container.querySelector(
    '.testimonial_controls [data-control="prev"]',
  );
  const nextBtn = container.querySelector(
    '.testimonial_controls [data-control="next"]',
  );

  function moveSliderBy(amount) {
    let proxy = { v: 0, prevV: 0 };
    gsap.to(proxy, {
      v: amount,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        let delta = proxy.v - proxy.prevV;
        currentX += delta;
        proxy.prevV = proxy.v;
      },
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      moveSliderBy(-itemWidth);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      moveSliderBy(itemWidth);
    });
  }

  if (typeof tickerFn !== "undefined" && tickerFn) {
    gsap.ticker.remove(tickerFn);
  }

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

function buttonAnimation(container) {
  $(container)
    .find(".button_main_wrap")
    .mouseenter(function (e) {
      var parentOffset = $(this).offset();
      var relX = e.pageX - parentOffset.left;
      var relY = e.pageY - parentOffset.top;

      var circle = $(this).find(".button-circle");
      circle.css({ left: relX, top: relY });
      circle.removeClass("desplode-circle");
      circle.addClass("explode-circle");
    });

  $(container)
    .find(".button_main_wrap")
    .mouseleave(function (e) {
      var parentOffset = $(this).offset();
      var relX = e.pageX - parentOffset.left;
      var relY = e.pageY - parentOffset.top;

      var circle = $(this).find(".button-circle");
      circle.css({ left: relX, top: relY });
      circle.removeClass("explode-circle");
      circle.addClass("desplode-circle");
    });
}

function navbarInteraction(container) {
  const nav = container.querySelector(".nav_component");

  if (!nav) return;

  gsap.set(nav, { yPercent: 0, clearProps: "transform" });

  const hideNavAnim = gsap.fromTo(
    nav,
    { yPercent: 0 },
    {
      yPercent: -100,
      paused: true,
      duration: 0.6,
      ease: "power2.inOut",
    },
  );

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      if (self.direction === 1) {
        hideNavAnim.play();
      } else if (self.direction === -1) {
        hideNavAnim.reverse();
      }

      if (self.scroll() > 0) {
        nav.classList.add("is-scroll");
      } else {
        nav.classList.remove("is-scroll");
      }
    },
  });
}

function projetInteraction(container) {
  const section = container.querySelector(".hero-p_wrap");
  if (!section) return;

  const detailsElements = section.querySelectorAll("details.hero-p_item_wrap");

  detailsElements.forEach((details) => {
    const summary = details.querySelector("summary.hero-p_item_top");
    const button = details.querySelector(".button_main_wrap");
    const buttonText = details.querySelector(".button_main_text");

    if (!summary || !button || !buttonText) return;

    const openText = button.getAttribute("data-open") || "View less";
    const closeText = button.getAttribute("data-close") || "View more";

    summary.addEventListener("click", (e) => {
      e.preventDefault();
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const isOpen = details.open;

      if (isOpen) {
        details.removeAttribute("open");
        buttonText.textContent = closeText;
      } else {
        details.setAttribute("open", "");
        buttonText.textContent = openText;
      }
    });
  });
}

function processAnimation(container) {
  const section = container.querySelector(".process_list");
  const items = container.querySelectorAll(".process_item_wrap");

  if (!section || items.length === 0) return;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 1103px)", () => {
    items.forEach((item, index) => {
      const number = item.querySelector(".process_number_wrap");
      const line = item.querySelector(".process_item_line line");
      const content = item.querySelectorAll(
        ".process_item_title, .process_item_desc",
      );

      if (line) gsap.set(line, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(content, { y: -20, opacity: 0 });

      if (index !== 0) {
        gsap.set(number, { scale: 0 });
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    items.forEach((item, index) => {
      const number = item.querySelector(".process_number_wrap");
      const line = item.querySelector(".process_item_line line");
      const content = item.querySelectorAll(
        ".process_item_title, .process_item_desc",
      );

      if (index === 0) {
        tl.to(content, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
        });

        if (line) {
          tl.to(
            line,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.8,
              ease: "power1.inOut",
            },
            "<",
          );
        }
      } else {
        tl.to(number, { scale: 1, duration: 0.5, ease: "back.out(1.7)" }).to(
          content,
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "power2.out" },
          "-=0.2",
        );

        if (line) {
          tl.to(
            line,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.8,
              ease: "power1.inOut",
            },
            "<",
          );
        }
      }
    });

    return () => {
      items.forEach((item) => {
        const elems = item.querySelectorAll(
          ".process_number_wrap, .process_item_line line, .process_item_title, .process_item_desc",
        );
        gsap.set(elems, { clearProps: "all" });
      });
    };
  });
}

function teamSlider(container) {
  const section = container.querySelector(".about-t_wrap");

  if (!section) return;

  const teamSliderEl = section.querySelector(".about-t_visual_slider");

  const slides = teamSliderEl.querySelectorAll(".about-t_visual_item");
  const slideCount = slides.length;

  if (slideCount > 0 && slideCount < 10) {
    const wrapper = slides[0].parentNode;
    let currentCount = slideCount;
    let index = 0;

    while (currentCount < 10) {
      const clone = slides[index % slideCount].cloneNode(true);
      wrapper.appendChild(clone);
      currentCount++;
      index++;
    }
  }

  teamInstance = new Swiper(teamSliderEl, {
    slideClass: "about-t_visual_item",
    slidesPerView: "auto",
    loop: true,
    simulateTouch: false,
    allowTouchMove: false,
    centeredSlides: true,
    watchSlidesProgress: true,
    navigation: {
      nextEl: ".about-t_wrap [data-control='next']",
      prevEl: ".about-t_wrap [data-control='prev']",
    },
    effect: "coverflow",
    coverflowEffect: {
      rotate: 0,
      stretch: -0,
      depth: 200,
      modifier: 1,
      slideShadows: false,
    },
    // breakpoints: {
    //   1024: {
    //     slidesPerView: 5,
    //   },
    // },
    // observer: true,
    // observeParents: true,
  });
}

function teamContentSlider(container) {
  const section = container.querySelector(".about-t_wrap");
  if (!section) return;

  const teamContentSliderEl = section.querySelector(".about-t_slider");

  teamContentInstance = new Swiper(teamContentSliderEl, {
    slideClass: "about-t_item_wrap",
    slidesPerView: "auto",
    loop: true,
    simulateTouch: false,
    allowTouchMove: false,
    navigation: {
      nextEl: ".about-t_wrap [data-control='next']",
      prevEl: ".about-t_wrap [data-control='prev']",
    },
  });
}

function socialSlider(container) {
  const section = container.querySelector(".social_wrap");

  if (!section) return;

  const teamSliderEl = section.querySelector(".social_slider");

  socialInstance = new Swiper(teamSliderEl, {
    slideClass: "social_item_wrap",
    slidesPerView: 1,
    loop: true,
    simulateTouch: false,
    allowTouchMove: false,
    effect: "fade",
    speed: 1000,
    fadeEffect: {
      crossFade: true,
    },
    autoplay: {
      delay: 3000,
    },
    navigation: {
      nextEl: ".social_wrap [data-control='next']",
      prevEl: ".social_wrap [data-control='prev']",
    },
  });
}

function formValidation(container) {
  // Jika container tidak diberikan, gunakan document sebagai default
  const formContainer = container || document;

  function showError(message, element) {
    element.textContent = message;
    element.style.display = "block";
  }

  function hideError(element) {
    element.style.display = "none";
  }

  // --- Email Validation ---
  const emailInputs = formContainer.querySelectorAll('input[type="email"]');

  if (!emailInputs) return;

  if (emailInputs.length) {
    async function validateDomain(domain, errorElement) {
      try {
        showError("Verifying domain...", errorElement);
        const response = await fetch(
          `https://dns.google/resolve?name=${domain}&type=MX`,
        );
        const data = await response.json();

        if (response.ok && data.Answer && data.Answer.length > 0) {
          hideError(errorElement);
        } else {
          showError(
            "The email domain appears to be invalid or non-existent.",
            errorElement,
          );
        }
      } catch (error) {
        console.error("Error during domain validation:", error);
        showError(
          "Validation failed. Please check your connection.",
          errorElement,
        );
      }
    }

    emailInputs.forEach((emailInput) => {
      const errorMsgElement = emailInput.nextElementSibling;

      if (
        !errorMsgElement ||
        errorMsgElement.getAttribute("data-input-form") !== "error-msg"
      ) {
        console.error(
          "Could not find the error message element for an email input.",
          emailInput,
        );
        return;
      }

      emailInput.addEventListener("blur", function () {
        const email = this.value.trim();
        const emailParts = email.split("@");

        if (emailParts.length === 2 && emailParts[1].length > 0) {
          const domain = emailParts[1];
          validateDomain(domain, errorMsgElement);
        } else if (email.length > 0) {
          showError("Please enter a valid email address.", errorMsgElement);
        } else {
          hideError(errorMsgElement);
        }
      });
    });
  }

  // --- Telephone Validation ---
  const telInputs = formContainer.querySelectorAll('input[type="tel"]');

  if (!telInputs) return;

  if (telInputs.length) {
    telInputs.forEach((telInput) => {
      const errorMsgElement = telInput.nextElementSibling;

      if (
        !errorMsgElement ||
        errorMsgElement.getAttribute("data-input-form") !== "error-msg"
      ) {
        console.error(
          "Could not find the error message element for a telephone input.",
          telInput,
        );
        return;
      }

      telInput.addEventListener("input", function (event) {
        const originalValue = this.value;
        let sanitizedValue = originalValue.replace(/[^\d+]/g, "");

        if (sanitizedValue.lastIndexOf("+") > 0) {
          sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
        }

        if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue)) {
          sanitizedValue = sanitizedValue.substring(1);
        }

        if (originalValue !== sanitizedValue) {
          this.value = sanitizedValue;
        }

        if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
          showError(
            "Only numbers and a leading + are allowed.",
            errorMsgElement,
          );
        } else {
          hideError(errorMsgElement);
        }
      });
    });
  }
}

function footerYear(container) {
  container.querySelectorAll("[data-dynamic-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}

// function openProject(container) {
//   const firstProject = container.querySelector(".hero-p_item_wrap");
//   if (firstProject) {
//     firstProject.setAttribute("open", "open");
//   }
// }

// function initModalBasic(container) {
//   const modalGroup = container.querySelector("[data-modal-group-status]");
//   const modals = container.querySelectorAll("[data-modal-name]");
//   const modalTargets = container.querySelectorAll("[data-modal-target]");

//   modalTargets.forEach((modalTarget) => {
//     modalTarget.addEventListener("click", function () {
//       const modalTargetName = this.getAttribute("data-modal-target");

//       console.log(modalTargetName);

//       modalTargets.forEach((target) =>
//         target.setAttribute("data-modal-status", "not-active")
//       );
//       modals.forEach((modal) =>
//         modal.setAttribute("data-modal-status", "not-active")
//       );

//       container
//         .querySelector(`[data-modal-target="${modalTargetName}"]`)
//         .setAttribute("data-modal-status", "active");
//       container
//         .querySelector(`[data-modal-name="${modalTargetName}"]`)
//         .setAttribute("data-modal-status", "active");

//       if (modalGroup) {
//         modalGroup.setAttribute("data-modal-group-status", "active");
//       }

//       if (typeof lenis !== "undefined") lenis.stop();
//     });
//   });

//   container.querySelectorAll("[data-modal-close]").forEach((closeBtn) => {
//     closeBtn.addEventListener("click", closeAllModals);
//   });

//   container.addEventListener("keydown", function (event) {
//     if (event.key === "Escape") {
//       closeAllModals();
//     }
//   });

//   function closeAllModals() {
//     modalTargets.forEach((target) =>
//       target.setAttribute("data-modal-status", "not-active")
//     );

//     if (modalGroup) {
//       modalGroup.setAttribute("data-modal-group-status", "not-active");
//     }

//     if (typeof lenis !== "undefined") lenis.start();
//   }
// }

function initModalBasic(container) {
  const modalGroup = container.querySelector("[data-modal-group-status]");
  const modals = container.querySelectorAll("[data-modal-name]");
  const modalTargets = container.querySelectorAll("[data-modal-target]");

  function openModal(modalTargetName) {
    const target = container.querySelector(
      `[data-modal-target="${modalTargetName}"]`,
    );
    const modal = container.querySelector(
      `[data-modal-name="${modalTargetName}"]`,
    );

    if (!target || !modal) return;

    modalTargets.forEach((target) =>
      target.setAttribute("data-modal-status", "not-active"),
    );

    modals.forEach((modal) =>
      modal.setAttribute("data-modal-status", "not-active"),
    );

    target.setAttribute("data-modal-status", "active");
    modal.setAttribute("data-modal-status", "active");

    if (modalGroup) {
      modalGroup.setAttribute("data-modal-group-status", "active");
    }

    if (typeof lenis !== "undefined") lenis.stop();
  }

  function closeAllModals() {
    modalTargets.forEach((target) =>
      target.setAttribute("data-modal-status", "not-active"),
    );

    modals.forEach((modal) =>
      modal.setAttribute("data-modal-status", "not-active"),
    );

    if (modalGroup) {
      modalGroup.setAttribute("data-modal-group-status", "not-active");
    }

    if (typeof lenis !== "undefined") lenis.start();

    const url = new URL(window.location.href);
    url.searchParams.delete("modal");
    window.history.replaceState({}, "", url);
  }

  modalTargets.forEach((modalTarget) => {
    modalTarget.addEventListener("click", function (event) {
      event.preventDefault();

      const modalTargetName = this.getAttribute("data-modal-target");

      openModal(modalTargetName);

      const url = new URL(window.location.href);
      url.searchParams.set("modal", modalTargetName);
      window.history.pushState({}, "", url);
    });
  });

  container.querySelectorAll("[data-modal-close]").forEach((closeBtn) => {
    closeBtn.addEventListener("click", closeAllModals);
  });

  container.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  const url = new URL(window.location.href);
  const modalFromUrl = url.searchParams.get("modal");

  if (modalFromUrl) {
    openModal(modalFromUrl);
  }
}

function renderRecaptcha(container) {
  const recaptchas = container.querySelectorAll(".g-recaptcha");

  if (!recaptchas.length) return;
  if (!window.grecaptcha || typeof grecaptcha.render !== "function") return;

  grecaptcha.ready(() => {
    recaptchas.forEach((el) => {
      if (el.dataset.rendered === "true") return;

      const sitekey = el.getAttribute("data-sitekey");
      if (!sitekey) return;

      try {
        grecaptcha.render(el, { sitekey });
        el.dataset.rendered = "true";
      } catch (err) {
        console.warn("[reCAPTCHA] render failed:", err);
      }
    });
  });
}
