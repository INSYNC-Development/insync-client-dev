const TEAM_ARC = {
  step: 15,
  radiusRatio: 2.013,
  scaleA: 0.06825,
  scaleB: 0.02125,
};

const lenis = new Lenis();

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

CustomEase.create("loader", "0.65, 0.01, 0.05, 0.99");

const LOADER_MIN_VISIBLE = 0.5;
const LOADER_MAX_WAIT = 8;
const LOADER_SMOOTHING = 6;

const LOADER_ASSET_SHARE = 0.8;

function whenPageLoaded(fn) {
  if (document.readyState === "complete") {
    fn();
    return;
  }
  window.addEventListener("load", fn, { once: true });
}

function initLogoRevealLoader(onCompleteCallback) {
  const wrap = document.querySelector("[data-load-wrap]");
  const done = () => {
    if (typeof onCompleteCallback === "function") onCompleteCallback();
  };

  if (!wrap) {
    done();
    return;
  }

  const container = wrap.querySelector("[data-load-container]");
  const bg = wrap.querySelector("[data-load-bg]");
  const logo = wrap.querySelector("[data-load-logo]");
  const resetTargets = Array.from(wrap.querySelectorAll("[data-load-reset]"));

  if (sessionStorage.getItem("loaderPlayed")) {
    gsap.set(wrap, { display: "none" });
    if (resetTargets.length) {
      gsap.set(resetTargets, { autoAlpha: 1 });
    }
    done();
    return;
  }

  sessionStorage.setItem("loaderPlayed", "true");

  gsap.set(wrap, { display: "block" });
  if (resetTargets.length) {
    gsap.set(resetTargets, { autoAlpha: 1 });
  }

  const viewportH = window.innerHeight || 0;
  const trackedImages = Array.from(document.images).filter((img) => {
    if (img.complete) return true;
    if (img.loading !== "lazy") return true;
    return img.getBoundingClientRect().top < viewportH * 1.25;
  });

  const FONT_WEIGHT = 3;
  const totalUnits = trackedImages.length + FONT_WEIGHT;

  let loadedUnits = 0;
  let pageLoaded = false;
  let target = 0;
  let creep = 0;

  const retarget = () => {
    const assetShare = (loadedUnits / totalUnits) * LOADER_ASSET_SHARE;
    target = pageLoaded ? 1 : assetShare;
    creep = 0;
  };

  const bump = (units) => {
    loadedUnits = Math.min(loadedUnits + units, totalUnits);
    retarget();
  };

  trackedImages.forEach((img) => {
    if (img.complete) {
      bump(1);
      return;
    }
    const settle = () => {
      img.removeEventListener("load", settle);
      img.removeEventListener("error", settle);
      bump(1);
    };
    img.addEventListener("load", settle);
    img.addEventListener("error", settle);
  });

  if (document.fonts && document.fonts.ready) {
    const fontsDone = () => bump(FONT_WEIGHT);
    document.fonts.ready.then(fontsDone).catch(fontsDone);
  } else {
    bump(FONT_WEIGHT);
  }

  whenPageLoaded(() => {
    pageLoaded = true;
    retarget();
  });

  const forceComplete = () => {
    pageLoaded = true;
    bump(totalUnits);
  };

  const ease = gsap.parseEase("loader");
  const paint = (p) => {
    const eased = typeof ease === "function" ? ease(p) : p;
    gsap.set(logo, { clipPath: `inset(0% ${(1 - eased) * 100}% 0% 0%)` });
  };

  const startAt = performance.now();
  let shown = 0;
  let finished = false;

  paint(0);

  function finish() {
    if (finished) return;
    finished = true;
    gsap.ticker.remove(tick);
    clearTimeout(maxWaitTimer);
    paint(1);

    gsap
      .timeline({ defaults: { ease: "loader" } })
      .to(container, { autoAlpha: 0, duration: 0.5 })
      .add("hideContent", "<")
      .call(done, null, "hideContent+=0.4")
      .to(bg, { yPercent: -101, duration: 1 }, "hideContent")
      .set(wrap, { display: "none" });
  }

  function tick(time, deltaMs) {
    const dt = Math.min(deltaMs, 100) / 1000;

    const ceiling = pageLoaded ? 1 : LOADER_ASSET_SHARE;
    if (target < ceiling) {
      creep = Math.min(creep + dt * 0.05, (ceiling - target) * 0.5);
    }

    const goal = Math.min(target + creep, ceiling);

    const step = (goal - shown) * (1 - Math.exp(-LOADER_SMOOTHING * dt));
    shown = Math.max(shown, shown + step);
    paint(shown);

    const elapsed = (performance.now() - startAt) / 1000;
    if (target >= 1 && shown > 0.995 && elapsed >= LOADER_MIN_VISIBLE) {
      finish();
    }
  }

  const maxWaitTimer = setTimeout(forceComplete, LOADER_MAX_WAIT * 1000);
  gsap.ticker.add(tick);
}

function initNavScroll() {
  const navComponent = document.querySelector("body > div > div.nav_component");

  if (!navComponent) return;

  let isScrolled = false;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 0) {
      if (!isScrolled) {
        navComponent.setAttribute("data-scroll", "true");
        isScrolled = true;
      }
    } else {
      if (isScrolled) {
        navComponent.setAttribute("data-scroll", "false");
        isScrolled = false;
      }
    }
  });
}

function initImageReveal() {
  const revealContainers = document.querySelectorAll('[data-reveal="image"]');

  if (revealContainers.length < 0) return;

  revealContainers.forEach((container) => {
    const image = container.querySelector("img");

    gsap.to(image, {
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
      },
      scale: 1,
      autoAlpha: 1,
      duration: 2,
      ease: "power3.out",
    });
  });
}

function initScrollAnimations() {
  const animationGroups = {
    "slide-up": [],
    "slide-from-left": [],
    "slide-from-right": [],
    "heading-reveal": [],
  };

  const animatedElements = gsap.utils.toArray("[data-scroll-animation]");

  animatedElements.forEach((element) => {
    const animationType = element.getAttribute("data-scroll-animation");

    if (!animationGroups.hasOwnProperty(animationType)) {
      console.warn(`Unknown animation type: ${animationType}`);
      return;
    }

    animationGroups[animationType].push(element);
  });

  for (const [animationType, elements] of Object.entries(animationGroups)) {
    if (elements.length === 0) continue;

    if (animationType === "heading-reveal") {
      elements.forEach((el) => {
        const split = new SplitText(el, {
          type: "lines",
          linesClass: "split-line-inner",
        });

        split.lines.forEach((line) => {
          const mask = document.createElement("div");
          mask.classList.add("split-line-mask");

          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });

        gsap.set(split.lines, { yPercent: 105 });

        el.innerLines = split.lines;
      });
    }

    ScrollTrigger.batch(elements, {
      start: "top 85%",
      end: "bottom center",
      onEnter: (batch) => {
        if (animationType === "heading-reveal") {
          gsap.set(batch, { autoAlpha: 1 });

          const allInnerLines = batch.flatMap((el) => el.innerLines || []);

          gsap.to(allInnerLines, {
            yPercent: 0,
            duration: 1.6,
            stagger: 0.2,
            ease: "power4.out",
            overwrite: true,
          });
        } else {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            x: 0,
            stagger: 0.2,
            duration: 1.4,
            ease: "power2.out",
            overwrite: true,
          });
        }
      },
    });
  }
}

function aboutSequenceAndReveal() {
  const wrapper = document.querySelector("[data-spacer='about']");
  const canvasContainer = document.querySelector(".about-m_canvas");
  const overlay = document.querySelector(".about-m_overlay");
  const textContainer = document.querySelector(".about-m_contain");

  if (!wrapper || !canvasContainer) {
    console.error("Elemen wrapper atau canvas container tidak ditemukan!");
    return;
  }

  const canvas = document.createElement("canvas");
  canvasContainer.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const config = {
    baseUrl:
      "https://cdn.jsdelivr.net/gh/INSYNC-Development/insync-client-dev@main/clients/CCS/optimized-assets/sequences/machine-reveal-v3/2560/",
    frameCount: 121,
    padding: 4,
    suffix: "",
    extension: ".webp",
    prefix: "machine-reveal-",

    // Frame 0-11 nyaris hitam (luminansi 0-25). Mulai dari frame terang
    // pertama supaya berhenti di scroll mana pun tidak pernah layar kosong.
    startFrame: 12,

    // Lebar asli file frame. Dipakai untuk membatasi resolusi canvas -
    // lihat sizeCanvas(). Sesuaikan kalau folder asset diganti.
    sourceWidth: 1440,

    // Tuning scroll. Ubah di sini, tidak perlu cari-cari di bawah.
    scrollStart: "top center",
    scrollEnd: "bottom bottom",
    scrub: 0.6,
    textStart: "60% bottom",
  };

  const images = [];
  const playhead = { frame: config.startFrame };
  let lastDrawnFrame = -1;

  const getImageUrl = (index) => {
    const paddedIndex = (index + 1).toString().padStart(config.padding, "0");
    return `${config.baseUrl}${config.prefix}${paddedIndex}${config.suffix}${config.extension}`;
  };

  function resolveFrame(index) {
    if (images[index] && images[index].complete) return index;

    const floor = Math.max(config.startFrame, index - 12);
    for (let i = index; i >= floor; i--) {
      if (images[i] && images[i].complete) return i;
    }
    return lastDrawnFrame >= 0 ? lastDrawnFrame : -1;
  }

  function render() {
    const index = resolveFrame(playhead.frame);
    if (index === -1) return;

    if (index === lastDrawnFrame) return;
    lastDrawnFrame = index;

    const img = images[index];

    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
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

  function sizeCanvas() {
    const rect = canvasContainer.getBoundingClientRect();
    const cssWidth = rect.width > 0 ? rect.width : window.innerWidth;
    const cssHeight = rect.height > 0 ? rect.height : window.innerHeight;

    const maxUseful = config.sourceWidth / cssWidth;
    const dpr = Math.max(
      1,
      Math.min(window.devicePixelRatio || 1, 2, maxUseful)
    );

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    lastDrawnFrame = -1;
    render();
  }

  const heading = textContainer.querySelector(".header_wrap .c-heading");
  let splitLines = [];

  if (heading) {
    if (typeof SplitText !== "undefined") {
      const split = new SplitText(heading, {
        type: "lines",
        linesClass: "split-line-inner",
      });
      split.lines.forEach((line) => {
        const mask = document.createElement("div");
        mask.classList.add("split-line-mask");
        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });
      splitLines = split.lines;
      gsap.set(splitLines, { yPercent: 105 });
    } else {
      console.warn(
        "Plugin SplitText tidak ditemukan! Efek teks dinonaktifkan."
      );
      splitLines = [heading];
      gsap.set(heading, { y: 50, autoAlpha: 0 });
    }
  }

  const slideUpElements = textContainer.querySelectorAll(
    ".tag_wrap, .c-paragraph, .about-m_item_wrap"
  );
  gsap.set(slideUpElements, { autoAlpha: 0, y: 40 });
  if (overlay) gsap.set(overlay, { autoAlpha: 0 });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initGSAP() {
    if (reduced) {
      playhead.frame = config.frameCount - 1;
      render();
      if (overlay) gsap.set(overlay, { autoAlpha: 1 });
      gsap.set(splitLines, { yPercent: 0, y: 0, autoAlpha: 1 });
      gsap.set(slideUpElements, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      playhead,
      { frame: config.startFrame },
      {
        frame: config.frameCount - 1,
        snap: "frame",
        ease: "none",
        onUpdate: render,
        scrollTrigger: {
          trigger: wrapper,
          start: config.scrollStart,
          end: config.scrollEnd,
          scrub: config.scrub,
        },
      }
    );

    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: config.textStart,
        toggleActions: "play none none reverse",
      },
    });

    if (overlay) {
      textTl.to(overlay, { autoAlpha: 1, duration: 0.8, ease: "power2.inOut" });
    }
    if (splitLines.length > 0) {
      textTl.to(
        splitLines,
        {
          yPercent: 0,
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power4.out",
        },
        "<0.2"
      );
    }
    if (slideUpElements.length > 0) {
      textTl.to(
        slideUpElements,
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" },
        "<0.2"
      );
    }
  }

  function preloadImages() {
    for (let i = config.startFrame + 1; i < config.frameCount; i++) {
      const img = new Image();
      img.src = getImageUrl(i);
      images[i] = img;

      if (img.decode) img.decode().catch(() => {});
    }
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 200);
  });

  const firstFrame = new Image();
  firstFrame.src = getImageUrl(config.startFrame);

  firstFrame.onload = () => {
    images[config.startFrame] = firstFrame;
    sizeCanvas();
    initGSAP();
    // Ditunda sampai event `load` lewat. 140 frame yang diunduh lewat
    // new Image() sebelum event itu ikut menahan `load` — dan loader memakai
    // `load` sebagai gerbang 20% terakhirnya, jadi tanpa penundaan ini bar
    // akan nyangkut di 80% sampai batas LOADER_MAX_WAIT. Sequence sendiri
    // tidak rugi: baru discroll jauh setelah loader hilang.
    whenPageLoaded(preloadImages);
  };

  firstFrame.onerror = () => {
    console.error("GAGAL MEMUAT GAMBAR PERTAMA!");
  };
}

function initScrollParallax() {
  const width = window.innerWidth;
  const isMobile = width < 480;
  const isMobileLandscape = width < 768;
  const isTablet = width < 992;
  const isDesktop = width > 991;

  const isTouchScreendevice = () =>
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const parallaxElements = document.querySelectorAll(
    "[data-scrub-animation='parallax']"
  );

  parallaxElements.forEach((el) => {
    const triggerEl = el.parentElement || el;

    gsap.fromTo(
      el,
      {
        yPercent: -10,
        scale: 1.1,
      },
      {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: triggerEl,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });

  return {
    isMobile,
    isMobileLandscape,
    isTablet,
    isDesktop,
    isTouchScreendevice,
  };
}

function initHighlightText() {
  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]");

  splitHeadingTargets.forEach((heading) => {
    const scrollStart =
      heading.getAttribute("data-highlight-scroll-start") || "top 90%";
    const scrollEnd =
      heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2;
    const staggerValue = heading.getAttribute("data-highlight-stagger") || 0.1;

    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            },
          });
          tl.from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear",
          });
        });
        return ctx;
      },
    });
  });
}

function initProductSlider() {
  const slider = document.querySelector(".machines_slider");

  if (!slider) return;

  const mainSwiper = new Swiper(slider, {
    slideClass: "products_slide_wrap",
    slidesPerView: 1.2,
    spaceBetween: 30,
    centeredSlides: true,
    speed: 400,
    loop: true,

    breakpoints: {
      992: {
        slidesPerView: 2,
      },
    },
  });

  slider.addEventListener("click", function (e) {
    const nextBtn = e.target.closest('[data-button="next"]');
    const prevBtn = e.target.closest('[data-button="previous"]');

    if (nextBtn) {
      e.preventDefault();
      e.stopPropagation();

      mainSwiper.slideNext();
    }

    if (prevBtn) {
      e.preventDefault();
      e.stopPropagation();

      mainSwiper.slidePrev();
    }
  });

  const thumbs = document.querySelectorAll(".products_thumbs_item");

  function updateActiveThumb(activeIndex) {
    thumbs.forEach((thumb, index) => {
      if (index === activeIndex) {
        thumb.setAttribute("data-active", "");
      } else {
        thumb.removeAttribute("data-active");
      }
    });
  }

  updateActiveThumb(mainSwiper.realIndex);

  mainSwiper.on("slideChange", function () {
    updateActiveThumb(mainSwiper.realIndex);
  });

  thumbs.forEach((thumb, index) => {
    thumb.setAttribute("data-index", index);

    thumb.addEventListener("click", function () {
      const slideIndex = parseInt(this.getAttribute("data-index"));

      mainSwiper.slideToLoop(slideIndex);
    });
  });
}

function initProductGallery() {
  const slider = document.querySelector(".product-i_slider");

  if (!slider) return;

  const mainSwiper = new Swiper(slider, {
    slideClass: "product-i_item_wrap",
    slidesPerView: 1,
    spaceBetween: 30,
    speed: 400,
    loop: true,
    navigation: {
      nextEl: '[data-button="next"]',
      prevEl: '[data-button="prev"]',
    },
  });

  const thumbs = document.querySelectorAll(".product-i_gallery_item");

  function updateActiveThumb(activeIndex) {
    thumbs.forEach((thumb, index) => {
      if (index === activeIndex) {
        thumb.setAttribute("data-active", "");
      } else {
        thumb.removeAttribute("data-active");
      }
    });
  }

  updateActiveThumb(mainSwiper.realIndex);

  mainSwiper.on("slideChange", function () {
    updateActiveThumb(mainSwiper.realIndex);
  });

  thumbs.forEach((thumb, index) => {
    thumb.setAttribute("data-index", index);

    thumb.addEventListener("click", function () {
      const slideIndex = parseInt(this.getAttribute("data-index"));

      mainSwiper.slideToLoop(slideIndex);
    });
  });
}

function initWhySlider() {
  const swiper = new Swiper(".about_slider", {
    slidesPerView: 1,

    spaceBetween: 30,

    loop: true,

    slideClass: "about_slider_item",

    navigation: {
      prevEl: ".about_wrap .slider-control .button_arrow_wrap:nth-child(1)",
      nextEl: ".about_wrap .slider-control .button_arrow_wrap:nth-child(2)",
    },

    pagination: {
      el: ".about_wrap .our-p_slider_pagination",
      clickable: true,
    },
  });
}

function initOurProductsSlider() {
  const sliderWraps = document.querySelectorAll(".our-p_slider_wrap");

  if (sliderWraps.length === 0) return;

  sliderWraps.forEach((wrap) => {
    const sliderElement = wrap.querySelector(".our-p_slider");
    const paginationElement = wrap.querySelector(".our-p_slider_pagination");

    const navButtons = wrap.querySelectorAll(".button_arrow_wrap");
    const prevButton = navButtons[0];
    const nextButton = navButtons[1];

    if (!sliderElement) return;

    const swiper = new Swiper(sliderElement, {
      slideClass: "our-p_slide_item",

      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      speed: 500,

      navigation: {
        prevEl: prevButton,
        nextEl: nextButton,
      },

      pagination: {
        el: paginationElement,
        clickable: true,
        bulletClass: "swiper-pagination-bullet",
        bulletActiveClass: "swiper-pagination-bullet-active",
      },
    });
  });
}

function initTestimonialSliders() {
  const mediaContainer = document.querySelector(".testimonial_slider");
  const quoteContainer = document.querySelector(".testimonial_quotes");

  if (!mediaContainer || !quoteContainer) return;

  const slideElements = quoteContainer.querySelectorAll(
    ".testimonial_quote_item"
  );
  const totalSlides = slideElements.length;

  const quoteSwiper = new Swiper(quoteContainer, {
    slideClass: "testimonial_quote_item",
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    speed: 600,
    loop: true,
    loopedSlides: totalSlides,
    navigation: {
      nextEl: '[data-button="next"]',
      prevEl: '[data-button="prev"]',
    },
  });

  const mediaSwiper = new Swiper(mediaContainer, {
    wrapperClass: "testimonial_track",
    slideClass: "testimonial_slide",
    slidesPerView: "auto",
    spaceBetween: 16,
    centeredSlides: true,
    speed: 600,
    loop: true,
    loopedSlides: totalSlides,
    direction: "horizontal",
    breakpoints: {
      992: {
        direction: "vertical",
        spaceBetween: 24,
      },
    },
  });

  quoteSwiper.on("slideChange", function () {
    if (mediaSwiper.realIndex !== quoteSwiper.realIndex) {
      mediaSwiper.slideToLoop(quoteSwiper.realIndex);
    }
  });

  mediaSwiper.on("slideChange", function () {
    if (quoteSwiper.realIndex !== mediaSwiper.realIndex) {
      quoteSwiper.slideToLoop(mediaSwiper.realIndex);
    }
  });
}

const initTeamWrap = () => {
  const section = document.querySelector(".team_wrap");
  const stage = document.querySelector("[data-team-stage]");
  if (!section || !stage || typeof gsap === "undefined") return;

  const cards = [...stage.querySelectorAll("[data-team-card]")];
  const nameEl = stage.querySelector("[data-team-name]");
  const roleEl = stage.querySelector("[data-team-role]");
  const prevEl = section.querySelector("[data-button='prev']");
  const nextEl = section.querySelector("[data-button='next']");
  if (cards.length < 2) return;

  const count = cards.length;
  const state = {
    position: Math.floor(count / 2),
  };
  let lastIndex = -1;

  const wrapOffset = gsap.utils.wrap(-count / 2, count / 2);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const render = () => {
    const w = cards[0].offsetWidth;
    const radius = w * TEAM_ARC.radiusRatio;
    cards.forEach((card, i) => {
      const offset = wrapOffset(i - state.position);
      const dist = Math.abs(offset);
      const rad = (offset * TEAM_ARC.step * Math.PI) / 180;
      gsap.set(card, {
        xPercent: -50,
        x: radius * Math.sin(rad),
        y: radius * (1 - Math.cos(rad)),
        rotation: TEAM_ARC.step * offset,
        scale: 1 - TEAM_ARC.scaleA * dist - TEAM_ARC.scaleB * dist * dist,
        zIndex: Math.round(100 - dist * 10),
      });
    });
    paintCaption();
  };

  const paintCaption = () => {
    const index = gsap.utils.wrap(0, count, Math.round(state.position));
    if (index === lastIndex) return;
    lastIndex = index;
    const card = cards[index];
    if (nameEl) nameEl.textContent = card.dataset.name || "";
    if (roleEl) roleEl.textContent = card.dataset.role || "";
  };

  const settleTo = (target) => {
    if (reduced) {
      state.position = Math.round(target);
      render();
      return;
    }
    gsap.to(state, {
      position: Math.round(target),
      duration: 0.6,
      ease: "power3.out",
      onUpdate: render,
    });
  };

  const step = (delta) => settleTo(state.position + delta);

  let startX = 0;
  let startPos = 0;
  let dragging = false;

  const onDown = (e) => {
    dragging = true;
    startX = e.clientX;
    startPos = state.position;
    stage.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging) return;
    const unit = cards[0].offsetWidth * 0.85;
    state.position = startPos - (e.clientX - startX) / unit;
    render();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    settleTo(state.position);
  };

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

  let wheelTimer = null;
  stage.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      state.position += e.deltaX / (cards[0].offsetWidth * 0.85);
      render();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => settleTo(state.position), 120);
    },
    {
      passive: false,
    }
  );

  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  prevEl?.addEventListener("click", () => step(-1));
  nextEl?.addEventListener("click", () => step(1));

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      settleTo(state.position + wrapOffset(i - state.position));
    });
  });

  window.addEventListener("resize", render);
  render();
};

function initTimelineAnimation() {
  const section = document.querySelectorAll(".timeline_wrap");
  const years = document.querySelectorAll(".timeline_year");
  const yearWindow = document.querySelector(".timeline_year_window");

  if (section.length === 0 || years.length === 0 || !yearWindow) return;

  const totalItems = years.length;
  const scrollDistance = "+=300%";

  const windowHeight = yearWindow.offsetHeight;
  const itemHeight = years[0].offsetHeight;

  const gap = 60;
  const itemSpacing = itemHeight + gap;

  const centerOffset = windowHeight / 2 - itemHeight / 2;

  years.forEach((year, i) => {
    gsap.set(year, {
      y: centerOffset + i * itemSpacing,
    });
  });

  let currentIndex = -1;

  function updateTextState(index) {
    if (index === currentIndex) return;

    const titles = document.querySelectorAll(".timeline_title");
    const texts = document.querySelectorAll(".timeline_text");

    gsap.to(titles, { opacity: 0, autoAlpha: 0, y: -15, duration: 0.4 });
    gsap.to(texts, { opacity: 0, autoAlpha: 0, y: -15, duration: 0.4 });

    if (titles[index]) {
      gsap.fromTo(
        titles[index],
        { y: 15 },
        { opacity: 1, autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1 }
      );
    }

    if (texts[index]) {
      gsap.fromTo(
        texts[index],
        { y: 15 },
        { opacity: 1, autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1 }
      );
    }

    years.forEach((year) => year.classList.remove("active"));
    if (years[index]) years[index].classList.add("active");

    currentIndex = index;
  }

  ScrollTrigger.create({
    trigger: ".timeline_wrap",
    start: "center center",
    end: scrollDistance,
    pin: true,
    pinSpacing: true,
    snap: {
      snapTo: 1 / (totalItems - 1),
      duration: 0.4,
      ease: "power1.inOut",
    },
    onUpdate: (self) => {
      let activeIndex = Math.round(self.progress * (totalItems - 1));
      updateTextState(activeIndex);
    },
  });

  gsap.to(".timeline_ruler_inner", {
    yPercent: -50,
    ease: "none",
    scrollTrigger: {
      trigger: ".timeline_wrap",
      start: "center center",
      end: scrollDistance,
      scrub: 1,
    },
  });

  const maxScrollDistance = (totalItems - 1) * itemSpacing;

  gsap.to(".timeline_year_list", {
    y: -maxScrollDistance,
    ease: "none",
    scrollTrigger: {
      trigger: ".timeline_wrap",
      start: "center center",
      end: scrollDistance,
      scrub: 1,
    },
  });

  updateTextState(0);
}

function initBuyersStep() {
  const duration = 6;
  let currentIndex = 0;
  let timerTween;
  let isSectionVisible = false;

  let imageZIndex = 2;

  const section = document.querySelector(".buyers_wrap");
  const images = gsap.utils.toArray(".buyers_visual .u-cover-absolute");
  const wraps = gsap.utils.toArray(".buyers_item_wrap");
  const contents = gsap.utils.toArray(".buyers_content_item");
  const progresses = gsap.utils.toArray(".buyers_progress");

  if (
    !section ||
    images.length === 0 ||
    wraps.length === 0 ||
    contents.length === 0 ||
    progresses.length === 0
  ) {
    return;
  }

  images.forEach((img, i) => {
    if (i === 0) {
      img.style.zIndex = 1;
      img.style.webkitClipPath = "inset(0% 0% 0% 0%)";
      img.style.clipPath = "inset(0% 0% 0% 0%)";
    } else {
      img.style.zIndex = 0;
      img.style.webkitClipPath = "inset(0% 0% 100% 0%)";
      img.style.clipPath = "inset(0% 0% 100% 0%)";
    }
  });

  wraps[0].setAttribute("data-active", "true");

  function switchTab(newIndex) {
    if (newIndex === currentIndex) return;

    const oldIndex = currentIndex;
    currentIndex = newIndex;

    const newImage = images[newIndex];
    const oldWrap = wraps[oldIndex];
    const newWrap = wraps[newIndex];
    const oldContent = contents[oldIndex];
    const newContent = contents[newIndex];
    const oldProgress = progresses[oldIndex];
    const newProgress = progresses[newIndex];

    oldWrap.removeAttribute("data-active");
    newWrap.setAttribute("data-active", "true");

    if (timerTween) timerTween.kill();

    gsap.killTweensOf(oldProgress);
    gsap.to(oldProgress, { scaleX: 0, duration: 0 });

    gsap.killTweensOf(oldContent);
    gsap.to(oldContent, { opacity: 0, autoAlpha: 0, duration: 0.5 });
    gsap.killTweensOf(newContent);
    gsap.to(newContent, { opacity: 1, autoAlpha: 1, duration: 0.5 });

    imageZIndex++;
    newImage.style.zIndex = imageZIndex;

    newImage.style.webkitClipPath = "inset(0% 0% 100% 0%)";
    newImage.style.clipPath = "inset(0% 0% 100% 0%)";

    gsap.killTweensOf(newImage);

    gsap.to(newImage, {
      webkitClipPath: "inset(0% 0% 0% 0%)",
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        if (newIndex === currentIndex) {
          images.forEach((img, i) => {
            if (i !== currentIndex) {
              gsap.killTweensOf(img);
              img.style.zIndex = 0;
              img.style.webkitClipPath = "inset(0% 0% 100% 0%)";
              img.style.clipPath = "inset(0% 0% 100% 0%)";
            }
          });
        }
      },
    });

    startProgressTimer(newProgress);
  }

  function startProgressTimer(progressElement) {
    timerTween = gsap.fromTo(
      progressElement,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: duration,
        ease: "none",
        onComplete: () => {
          let nextIndex = (currentIndex + 1) % wraps.length;
          switchTab(nextIndex);
        },
      }
    );

    if (!isSectionVisible) {
      timerTween.pause();
    }
  }

  wraps.forEach((wrap, index) => {
    wrap.addEventListener("click", () => {
      if (currentIndex !== index) {
        switchTab(index);
      } else {
        if (timerTween) timerTween.kill();
        startProgressTimer(progresses[index]);
      }
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isSectionVisible = true;
          if (timerTween) {
            timerTween.play();
          } else {
            startProgressTimer(progresses[currentIndex]);
          }
        } else {
          isSectionVisible = false;
          if (timerTween) {
            timerTween.pause();
          }
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
}

function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const initFlag = "data-odometer-initialized";
  const activeTweens = new WeakMap();

  const defaults = {
    duration: 1,
    ease: "power3.out",
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: "power2.out",
    triggerStart: "top 80%",
    staggerOrder: "left",
    digitCycles: 2,
  };

  document.querySelectorAll("[data-odometer-group]").forEach((group) => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, "");

    const elements = Array.from(
      group.querySelectorAll("[data-odometer-element]")
    );
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder =
      group.getAttribute("data-odometer-stagger-order") ||
      defaults.staggerOrder;
    const triggerStart =
      group.getAttribute("data-odometer-trigger-start") ||
      defaults.triggerStart;
    const elementStagger =
      parseFloat(group.getAttribute("data-odometer-stagger")) ||
      defaults.elementStagger;

    const elementData = elements.map((el) => {
      const originalText = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute("data-odometer-start");
      const startValue =
        parseFloat(el.getAttribute("data-odometer-start")) || 0;
      const duration =
        parseFloat(el.getAttribute("data-odometer-duration")) ||
        defaults.duration;
      const step = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map((revealEl) => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: "hidden" });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText, step }) => {
          cleanupElement(el, originalText);
        });
      },
    });

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(
          el,
          {
            width: widthEm + "em",
            opacity: 1,
            duration: defaults.revealDuration,
            ease: defaults.revealEase,
          },
          offset
        );
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(
          roller,
          {
            y: -targetPos * step + "em",
            duration,
            ease: defaults.ease,
            force3D: true,
          },
          offset + reversedIdx * defaults.digitStagger
        );
      });
    });
  });

  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease = options.ease || defaults.ease;
    const step = getLineHeightRatio(el);

    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      gsap.set(el, { clearProps: "width,overflow" });
    }

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments = parseSegments(currentText);
    const startDigitsStr = startSegments
      .filter((s) => s.type === "digit")
      .map((s) => s.char)
      .join("");
    const startValue = parseInt(startDigitsStr, 10) || 0;

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) {
      gsap.set(el, { width: oldWidthEm + "em", overflow: "hidden" });
    }

    const tl = gsap.timeline({
      onComplete() {
        cleanupElement(el, newText);
        activeTweens.delete(el);
      },
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(
        el,
        {
          width: newWidthEm + "em",
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    }

    revealEls.forEach((revealEl) => {
      if (revealEl.getAttribute("data-odometer-part") === "static") {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
      }
    });

    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(
        roller,
        {
          y: -targetPos * step + "em",
          duration,
          ease,
          force3D: true,
        },
        reversedIdx * defaults.digitStagger
      );
    });
  };

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === "normal") return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text) {
    return [...text].map((char) => ({
      type: /\d/.test(char) ? "digit" : "static",
      char,
    }));
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter((s) => s.type === "digit");
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, "0")
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map((s) =>
      s.type === "digit" ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
    );
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter((s) => s.type === "digit").length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
    return segments.map((seg) => {
      if (seg.type === "digit") {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      const hidden = firstDigitSeen && prevDigitHidden;
      return { ...seg, hidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute("data-odometer-grow")) {
      return el.getAttribute("data-odometer-grow") !== "false";
    }
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter((s) => s.type === "digit").length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = "";
    el.style.height = "";
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach((seg) => {
      if (seg.type === "static") {
        const span = document.createElement("span");
        span.setAttribute("data-odometer-part", "static");
        span.style.height = step + "em";
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 });
          revealEls.push(span);
        }
        return;
      }
      const mask = document.createElement("span");
      mask.setAttribute("data-odometer-part", "mask");
      mask.style.height = step + "em";
      mask.style.lineHeight = step;
      const roller = document.createElement("span");
      roller.setAttribute("data-odometer-part", "roller");
      roller.style.lineHeight = step;

      const digits = [];
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10);
      }
      roller.textContent = digits.join("\n");
      mask.appendChild(roller);
      el.appendChild(mask);
      const startDigit = seg.startDigit || 0;
      const isReveal = grow && seg.hidden;
      gsap.set(roller, {
        y: isReveal ? step + "em" : -startDigit * step + "em",
      });
      const endDigit = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });
    return { rollers, revealEls };
  }

  function cleanupElement(el, originalText) {
    el.style.overflow = "";
    el.style.height = "";

    const digits = [...originalText].filter((c) => /\d/.test(c));
    let di = 0;

    el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || "";
      mask.style.opacity = "";
      mask.style.overflow = "";
    });

    el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
      stat.style.opacity = "";
    });
  }

  function recalcOnResize() {
    document.querySelectorAll("[data-odometer-element]").forEach((el) => {
      const running = activeTweens.get(el);
      if (running) {
        running.progress(1);
        activeTweens.delete(el);
      }

      const hasRollers = el.querySelector('[data-odometer-part="roller"]');

      if (hasRollers) {
        const step = getLineHeightRatio(el);
        el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
          mask.style.height = step + "em";
          mask.style.lineHeight = step;
        });
        el.querySelectorAll('[data-odometer-part="roller"]').forEach(
          (roller) => {
            roller.style.lineHeight = step;
          }
        );
        el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
          stat.style.lineHeight = step;
        });
      }
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  });

  function applyStaggerOrder(items, order) {
    const arr = [...items];
    if (order === "right") return arr.reverse();
    if (order === "random") return shuffleArray(arr);
    return arr;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

let tocTriggers = [];

function getTocItems(content) {
  const headings = [...content.querySelectorAll("h2, h3, h4, h5, h6")].filter(
    (heading) => !heading.closest("[data-group]")
  );

  const highestHeading = ["h2", "h3", "h4", "h5", "h6"].find((tag) =>
    headings.some((heading) => heading.matches(tag))
  );

  const selector = highestHeading
    ? `[data-group], ${highestHeading}`
    : `[data-group]`;

  return [...content.querySelectorAll(selector)].filter((item) => {
    const isGroup = item.hasAttribute("data-group");
    const isHeading = highestHeading && item.matches(highestHeading);
    const isHeadingInsideGroup = isHeading && item.closest("[data-group]");

    return isGroup || (isHeading && !isHeadingInsideGroup);
  });
}

function initAutoTOC() {
  const tocList = document.querySelector('[data-toc="list"]');
  const content = document.querySelector('[data-toc="content"]');

  if (!tocList || !content) return;

  const items = getTocItems(content);

  if (!items.length) {
    tocList.innerHTML = "";
    return;
  }

  tocList.innerHTML = "";

  items.forEach((item, index) => {
    const title = item.getAttribute("data-group") || item.textContent.trim();
    let id = item.id;

    if (!id) {
      id =
        title
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") || `section-${index + 1}`;

      item.id = id;
    }

    tocList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="main_toc_item" data-toc="item">
        <a data-toc="link" href="#${id}" class="main_toc_link w-inline-block">
          <div class="main_toc_text u-text-style-main u-color-faded">
            ${title}
          </div>
        </a>
      </div>
      `
    );
  });

  requestAnimationFrame(() => {
    initTocAnimation(items);
    initTocLinks(items);
    ScrollTrigger.refresh();
  });
}

function initTocLinks(contentItems) {
  const links = [...document.querySelectorAll('[data-toc="link"]')];

  links.forEach((link, index) => {
    const target = contentItems[index];
    if (!target) return;

    link.setAttribute("href", "javascript:void(0)");

    link.addEventListener("click", (e) => {
      e.preventDefault();

      const y =
        window.pageYOffset +
        target.getBoundingClientRect().top -
        window.innerHeight * 0.39;

      gsap.to(window, {
        scrollTo: {
          y,
          autoKill: false,
        },
        duration: 1.6,
        ease: "smooth",
      });
    });
  });
}

function initTocAnimation(contentItems) {
  tocTriggers.forEach((trigger) => trigger.kill());
  tocTriggers = [];

  const tocItems = [...document.querySelectorAll('[data-toc="item"]')];

  tocItems.forEach((tocItem, index) => {
    const textElement = tocItem.querySelector(".main_toc_text");
    const target = contentItems[index];
    const nextTarget = contentItems[index + 1];

    if (!textElement || !target) return;

    const textTween = gsap.to(textElement, {
      color: "color-mix(in srgb, var(--_theme---text) 100%, transparent)",
      opacity: 1,
      duration: 0.2,
      paused: true,
    });

    const scrollTrigger = ScrollTrigger.create({
      trigger: target,
      start: "top 40%",
      endTrigger: nextTarget,
      end: "top 40%",
      onEnter: () => textTween.play(),
      onLeave: () => textTween.reverse(),
      onEnterBack: () => textTween.play(),
      onLeaveBack: () => textTween.reverse(),
    });

    tocTriggers.push(scrollTrigger);
  });
}

function initVideoHandler() {
  var videos = document.querySelectorAll(".lazy-video");

  videos.forEach(function (video) {
    gsap.set(video, { opacity: 0 });

    ScrollTrigger.create({
      trigger: video,
      start: "top 80%",
      onEnter: function () {
        if (!video.dataset.loaded) {
          video.querySelectorAll("source[data-src]").forEach(function (s) {
            s.src = s.dataset.src;
          });
          video.load();
          video.dataset.loaded = "true";
        }

        gsap.to(video, { opacity: 1, duration: 1 });
        video.play().catch(function () {});
      },
      onLeave: function () {
        video.pause();
      },
      onEnterBack: function () {
        gsap.to(video, { opacity: 1, duration: 1 });
        video.play().catch(function () {});
      },
      onLeaveBack: function () {
        video.pause();
      },
    });

    video.addEventListener("ended", function () {
      gsap.to(video, {
        opacity: 0,
        duration: 0.8,
        onComplete: function () {
          video.currentTime = 0;
          video.play().catch(function () {});
          gsap.to(video, { opacity: 1, duration: 0.8 });
        },
      });
    });
  });
}

function initBuyerStack() {
  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    const items = document.querySelectorAll(".buyers-s_item_wrap");

    items.forEach((item, index) => {
      if (index === items.length - 1) return;

      gsap.to(item, {
        scale: 0.85,
        opacity: 0,
        scrollTrigger: {
          trigger: item,
          start: "top 15%",
          endTrigger: items[index + 1],
          end: "top 15%",
          scrub: true,
        },
      });
    });
  });
}

function initVideoPlayer() {
  var videos = document.querySelectorAll("video.lazy-video");
  var io = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var video = entry.target;
        video.querySelectorAll("source[data-src]").forEach(function (s) {
          s.src = s.dataset.src;
        });
        video.load();

        obs.unobserve(video);
      });
    },
    { rootMargin: "200px" }
  );
  videos.forEach(function (v) {
    io.observe(v);
  });
}

// function initMainAnimations() {
//   initNavScroll();
//   initProductSlider();
//   initImageReveal();
//   initHighlightText();
//   initScrollAnimations();
//   initScrollParallax();
//   initTestimonialSliders();
//   initProductGallery();
//   initWhySlider();
//   initOurProductsSlider();
//   initTeamWrap();
//   initTimelineAnimation();
//   initBuyersStep();
//   initNumberOdometer();
//   initAutoTOC();
//   initVideoHandler();
//   initBuyerStack();
//   initBuyersStep()
//   initVideoPlayer();

//   setTimeout(() => {
//     ScrollTrigger.refresh();
//   }, 100);
// }

function initMainAnimations() {
  [
    initNavScroll,
    initProductSlider,
    initImageReveal,
    initHighlightText,
    initScrollAnimations,
    initScrollParallax,
    initTestimonialSliders,
    initProductGallery,
    initWhySlider,
    initOurProductsSlider,
    initTimelineAnimation,
    initBuyersStep,
    initNumberOdometer,
    initAutoTOC,
    initVideoHandler,
    initBuyerStack,
    initVideoPlayer,
    initTeamWrap,
  ].forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(fn.name + " failed:", e);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLogoRevealLoader(() => {
    document.fonts.ready.then(initMainAnimations).catch(initMainAnimations);
  });
});

document.addEventListener("DOMContentLoaded", aboutSequenceAndReveal);
