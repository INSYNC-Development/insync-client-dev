const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

let mm = gsap.matchMedia();

mm.add("(max-width: 1024px)", () => {
  ScrollTrigger.normalizeScroll(true);

  return () => {
    ScrollTrigger.normalizeScroll(false);
  };
});

function generatePillars() {
  const containers = document.querySelectorAll("[data-pillar]");

  if (containers.length < 0) return;

  containers.forEach((container) => {
    container.innerHTML = "";

    const containerWidth = container.offsetWidth;

    const maxItemWidth = 80;

    const itemCount = Math.ceil(containerWidth / maxItemWidth);

    for (let i = 0; i < itemCount; i++) {
      const item = document.createElement("div");
      item.classList.add("pillar_item");
      container.appendChild(item);
    }
  });
}

function blobAnimation() {
  const containers = document.querySelectorAll(".background_wrap");

  if (containers.length < 0) return;

  containers.forEach((container) => {
    const canvas = container.querySelector('[data-canvas="blob"]');
    const ctx = canvas.getContext("2d");

    if (!container || !canvas) return;

    const colorPalette = [
      { r: 126, g: 57, b: 255, a: 0.8 },
      { r: 57, g: 166, b: 255, a: 0.8 },
    ];
    const blackColor = { r: 0, g: 0, b: 0, a: 0.6 };

    let colorBlobs = [];
    let blackBlobs = [];
    let width, height;

    function resizeCanvas() {
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    }

    class Blob {
      constructor(colorConfig, sizeMultiplier = 1) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        this.sizeRatio = (Math.random() * 0.4 + 0.4) * sizeMultiplier;

        this.radius = Math.max(width, height) * this.sizeRatio;

        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;

        this.color = colorConfig;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // 3. UPDATE RADIUS TERUS MENERUS DI SINI
        // Agar ketika window di-resize, ukuran blob langsung ikut menyesuaikan
        this.radius = Math.max(width, height) * this.sizeRatio;

        if (this.x < -this.radius || this.x > width + this.radius)
          this.vx *= -1;
        if (this.y < -this.radius || this.y > height + this.radius)
          this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        let gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(
          0,
          `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`
        );
        gradient.addColorStop(
          1,
          `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`
        );

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // ctx.filter = "blur(90px)";
        ctx.fill();
      }
    }

    function init() {
      resizeCanvas();
      colorBlobs = [];
      blackBlobs = [];

      for (let i = 0; i < 4; i++) {
        let randomColor =
          colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colorBlobs.push(new Blob(randomColor, 1));
      }

      for (let i = 0; i < 1; i++) {
        blackBlobs.push(new Blob(blackColor, 1.2));
      }
    }

    function animate() {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      colorBlobs.forEach((blob) => {
        blob.update();
        blob.draw();
      });

      ctx.globalCompositeOperation = "soft-light";
      blackBlobs.forEach((blob) => {
        blob.update();
        blob.draw();
      });

      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => {
      resizeCanvas();
    });

    init();
    animate();
  });
}

function heroScrollFlip() {
  const child = document.querySelector('[data-flip="child"]');
  const initialParent = document.querySelector('[data-flip="initial"]');
  const targetParent = document.querySelector('[data-flip="parent"]');
  const spacer = document.querySelector(".hero_sticky_wrap");

  if (!child || !initialParent || !targetParent || !spacer) return;

  const lerp = (start, end, t) => start + (end - start) * t;

  const iRectInit = initialParent.getBoundingClientRect();

  targetParent.appendChild(child);
  const tRectInit = targetParent.getBoundingClientRect();

  initialParent.appendChild(child);

  gsap.set(initialParent, {
    width: iRectInit.width,
    height: iRectInit.height,
    overflow: "hidden",
    padding: 0,
  });

  gsap.set(targetParent, {
    width: tRectInit.width,
    height: tRectInit.height,
    padding: 0,
  });

  gsap.set(child, {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    margin: 0,
    boxSizing: "border-box",
  });

  ScrollTrigger.create({
    trigger: spacer,
    start: "top top",
    end: "95% bottom",
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;

      const iRect = initialParent.getBoundingClientRect();
      const tRect = targetParent.getBoundingClientRect();

      if (progress > 0 && progress < 1) {
        if (child.parentNode !== document.body) {
          document.body.appendChild(child);
        }

        gsap.set(child, {
          position: "fixed",
          top: 0,
          left: 0,
          x: lerp(iRect.left, tRect.left, progress),
          y: lerp(iRect.top, tRect.top, progress),
          width: lerp(iRect.width, tRect.width, progress),
          height: lerp(iRect.height, tRect.height, progress),
          margin: 0,
          zIndex: 999,
        });
      } else if (progress <= 0) {
        if (child.parentNode !== initialParent) {
          initialParent.appendChild(child);
          gsap.set(child, {
            clearProps: "position,top,left,x,y,zIndex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            margin: 0,
          });
        }
      } else if (progress >= 1) {
        if (child.parentNode !== targetParent) {
          targetParent.appendChild(child);
          gsap.set(child, {
            clearProps: "position,top,left,x,y,zIndex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            margin: 0,
          });
        }
      }
    },
  });
}

function visibilityElement() {
  const elements = document.querySelectorAll(".background_wrap");

  if (elements.length === 0) return;

  elements.forEach((el) => {
    gsap.set(el, { autoAlpha: 0 });

    gsap.to(el, {
      autoAlpha: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        toggleActions: "play reverse play reverse",
      },
    });
  });
}

function textRevealAnimation() {
  const texts = document.querySelectorAll('[data-text-animation="opacity"]');

  if (texts.length === 0) return;

  texts.forEach((text) => {
    let mySplitText = SplitText.create(text, {
      type: "chars, words",
      charsClass: "char",
    });

    let chars = mySplitText.chars;

    gsap.from(chars, {
      autoAlpha: 0.4,
      ease: "power2.out",
      stagger: 0.05,
      scrollTrigger: {
        trigger: text,
        start: "top 75%",
        end: "bottom center",
        scrub: true,
      },
      //   onComplete: () => {
      //     mySplitText.revert();
      //     text.removeAttribute("aria-hidden");
      //   },
    });
  });
}

function stackCardAnimation() {
  const items = document.querySelectorAll('[data-toc="item"]');
  const tocLinks = document.querySelectorAll('[data-toc="link"]');
  const tocContainer = document.querySelector(".memorable_toc_list"); // Tangkap container TOC
  const isTabletOrMobile = window.innerWidth < 992;

  if (items.length === 0 || tocLinks.length === 0) return;

  const tocTriggers = [];

  // Loop Pertama: Setup Animasi & ScrollTrigger
  items.forEach((item, index) => {
    const targetTocLink = tocLinks[index];

    if (targetTocLink) {
      const st = ScrollTrigger.create({
        trigger: item,
        start: "top 50%",
        end: "bottom 50%",
        toggleClass: {
          targets: targetTocLink,
          className: "is-active",
        },
        onToggle: (self) => {
          if (self.isActive && tocContainer) {
            const offsetX =
              (tocContainer.clientWidth - targetTocLink.clientWidth) / 2;

            gsap.to(tocContainer, {
              duration: 0.5,
              ease: "power2.out",
              scrollTo: {
                x: targetTocLink,
                offsetX: offsetX,
              },
            });
          }
        },
      });

      tocTriggers[index] = st;
    }

    if (!isTabletOrMobile) {
      gsap.to(item, {
        filter: "blur(50px)",
        opacity: 0,
        scale: 0.6,
        scrollTrigger: {
          trigger: item,
          start: "top 7.5%",
          end: "bottom top",
          scrub: 1,
        },
      });
    }
  });

  tocLinks.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const targetTrigger = tocTriggers[index];

      if (targetTrigger) {
        const centerPosition = (targetTrigger.start + targetTrigger.end) / 2;

        // Menggeser window secara vertikal (sumbu y)
        gsap.to(window, {
          duration: 1.2,
          ease: "power2.inOut",
          scrollTo: {
            y: centerPosition,
            autoKill: false,
          },
        });
      } else {
        console.warn(`ScrollTrigger tidak ditemukan untuk index: ${index}`);
      }
    });
  });
}

function teamSection() {
  const mainContainer = document.querySelector(".spacer_wrap");

  if (!mainContainer) return;

  const progressBar = mainContainer.querySelector(".team_progress");
  const extraLongContainer = mainContainer.querySelector(".team_contain");
  const teamItems = document.querySelectorAll(".team_item_wrap");

  const totalItems = teamItems.length;

  teamItems.forEach((item, index) => {
    if (index === 0) {
      item.classList.add("is-active");
    } else {
      item.classList.remove("is-active");
    }
  });

  if (progressBar) {
    gsap.set(progressBar, { width: "0%" });
  }

  mainContainer.style.height = `${extraLongContainer.offsetWidth * 2}px`;

  let scrollTween = gsap.to(extraLongContainer, {
    xPercent: -100,
    x: () => window.innerWidth,
    ease: "none",
    scrollTrigger: {
      trigger: mainContainer,
      start: "top top",
      end: () => `+=${extraLongContainer.offsetWidth * 2} bottom`,
      scrub: 1,
      onUpdate: (self) => {
        if (progressBar && totalItems > 0) {
          const progress = self.progress;

          let activeIndex;

          if (progress >= 0.99) {
            activeIndex = totalItems - 1;
          } else {
            activeIndex = Math.floor(progress * totalItems);
          }

          activeIndex = Math.max(0, Math.min(activeIndex, totalItems - 1));

          teamItems.forEach((item, index) => {
            if (index === activeIndex) {
              item.classList.add("is-active");
            } else {
              item.classList.remove("is-active");
            }
          });

          gsap.set(progressBar, { width: `${progress * 100}%` });
        }
      },
      // markers: true,
    },
  });
}

function galleryAnimation() {
  const CONFIG = {
    animDuration: 1.2,
    ease: "power2.inOut",
    pauseDuration: 2,
  };

  let itemsArr = [];

  function getPosValues() {
    const w = window.innerWidth;
    let pad, gap, smallW, smallH;

    if (w <= 768) {
      pad = 15;
      gap = 12;
      smallW = 70;
      smallH = 100;
    } else if (w <= 1024) {
      pad = 30;
      gap = 20;
      smallW = 150;
      smallH = 180;
    } else if (w <= 1440) {
      pad = 40;
      gap = 24;
      smallW = 280;
      smallH = 360;
    } else {
      pad = 60;
      gap = 40;
      smallW = 380;
      smallH = 480;
    }

    const container = document.querySelector(".gallery_list");

    if (!container) return;

    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;

    return {
      topleft: {
        width: smallW,
        height: smallH,
        top: pad,
        left: pad,
        zIndex: 2,
      },
      center: {
        width: containerW - smallW * 2 - gap * 2 - pad * 2,
        height: containerH - pad * 2,
        top: pad,
        left: pad + smallW + gap,
        zIndex: 3,
      },
      bottomright: {
        width: smallW,
        height: smallH,
        top: containerH - pad - smallH,
        left: containerW - pad - smallW,
        zIndex: 1,
      },
    };
  }

  function init() {
    // UPDATE: Targetkan class pembungkus item yang baru
    const elements = document.querySelectorAll(".gallery_item_wrap");

    if (elements.length === 0) return; // Hentikan jika tidak ada item

    itemsArr = Array.from(elements);
    const pos = getPosValues();

    itemsArr.forEach((item, index) => {
      // Inisialisasi posisi, transparansi 0 di awal untuk antrean
      if (index === 0) gsap.set(item, { ...pos.topleft, opacity: 0 });
      else if (index === 1) gsap.set(item, { ...pos.center, opacity: 0 });
      else gsap.set(item, { ...pos.bottomright, opacity: 0 });

      if (index > 2) gsap.set(item, { zIndex: 0 });
    });

    // Munculkan 3 item pertama
    gsap.to(itemsArr.slice(0, 3), {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {
        gsap.delayedCall(1, rotateState);
      },
    });
  }

  function rotateState() {
    itemsArr.push(itemsArr.shift());
    animateRotation();
  }

  function animateRotation() {
    const pos = getPosValues();
    const tl = gsap.timeline({
      onComplete: () => {
        itemsArr.forEach((item, index) => {
          if (index > 2) {
            gsap.set(item, { ...pos.bottomright, opacity: 0, zIndex: 0 });
          }
        });

        gsap.delayedCall(CONFIG.pauseDuration, rotateState);
      },
    });

    itemsArr.forEach((item, index) => {
      if (index === 0) {
        gsap.set(item, { zIndex: pos.topleft.zIndex });
        tl.to(
          item,
          {
            ...pos.topleft,
            opacity: 1,
            duration: CONFIG.animDuration,
            ease: CONFIG.ease,
          },
          0
        );
      } else if (index === 1) {
        gsap.set(item, { zIndex: pos.center.zIndex });
        tl.to(
          item,
          {
            ...pos.center,
            opacity: 1,
            duration: CONFIG.animDuration,
            ease: CONFIG.ease,
          },
          0
        );
      } else if (index === 2) {
        gsap.set(item, { zIndex: pos.bottomright.zIndex });
        tl.to(
          item,
          {
            ...pos.bottomright,
            opacity: 1,
            duration: CONFIG.animDuration,
            ease: CONFIG.ease,
          },
          0
        );
      } else if (index === itemsArr.length - 1 && itemsArr.length > 3) {
        gsap.set(item, { zIndex: 0 });
        tl.to(
          item,
          {
            opacity: 0,
            top: pos.topleft.top,
            left: pos.topleft.left,
            width: pos.topleft.width,
            height: pos.topleft.height,
            duration: CONFIG.animDuration * 0.5,
            ease: "power1.out",
          },
          0
        );
      }
    });

    return tl;
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const pos = getPosValues();
      itemsArr.forEach((item, index) => {
        let target =
          index === 0
            ? pos.topleft
            : index === 1
            ? pos.center
            : pos.bottomright;
        gsap.set(item, {
          width: target.width,
          height: target.height,
          top: target.top,
          left: target.left,
        });
      });
    }, 250);
  });

  init();
}

function navAnimation() {
  const navGroups = document.querySelectorAll(".nav_links_component");

  navGroups.forEach((group) => {
    const navLinks = group.querySelectorAll(".nav_links_link");
    const currentLink = group.querySelector(".nav_links_link.w--current");
    const sign =
      group.querySelector(".nav_links_sign") || document.createElement("div");

    if (!sign.classList.contains("nav_links_sign")) {
      sign.classList.add("nav_links_sign");
    }

    if (currentLink) {
      if (!currentLink.contains(sign)) {
        currentLink.prepend(sign);
      }
      gsap.set(sign, { opacity: 1 });
    } else {
      if (navLinks.length > 0 && !sign.parentNode) {
        navLinks[0].prepend(sign);
      }
      gsap.set(sign, { opacity: 0 });
    }
    // ---------------------------------------

    const isDesktop = window.matchMedia("(min-width: 992px)");
    let timeoutId;

    navLinks.forEach((link) => {
      link.addEventListener("mouseenter", function () {
        if (!isDesktop.matches) return;

        clearTimeout(timeoutId);

        if (!currentLink && gsap.getProperty(sign, "opacity") === 0) {
          gsap.to(sign, { opacity: 1, duration: 0.3, ease: "power1.out" });
        }

        if (this.contains(sign)) return;

        const state = Flip.getState(sign);
        this.prepend(sign);

        Flip.from(state, {
          duration: 0.4,
          ease: "power2.out",
        });
      });

      link.addEventListener("mouseleave", function () {
        if (!isDesktop.matches) return;

        timeoutId = setTimeout(() => {
          if (currentLink) {
            if (!currentLink.contains(sign)) {
              const state = Flip.getState(sign);
              currentLink.prepend(sign);

              Flip.from(state, {
                duration: 0.4,
                ease: "power2.out",
              });
            }
          } else {
            gsap.to(sign, {
              opacity: 0,
              duration: 0.3,
              ease: "power1.out",
            });
          }
        }, 500);
      });
    });

    isDesktop.addEventListener("change", (e) => {
      if (!e.matches) {
        if (currentLink) {
          if (!currentLink.contains(sign)) currentLink.prepend(sign);
          gsap.set(sign, { opacity: 1 });
        } else {
          gsap.set(sign, { opacity: 0 });
        }
      }
    });
  });
}

function svgAnimation() {
  const svgs = document.querySelectorAll('[data-animation="svg"]');
  if (svgs.length === 0) return;

  svgs.forEach((svg) => {
    const maskPaths = svg.querySelectorAll("[data-svg='path'] path");
    const underline = svg.querySelector("[data-svg='stroke']");

    gsap.set([maskPaths, underline].filter(Boolean), {
      strokeDasharray: (i, target) => target.getTotalLength() + 2,
      strokeDashoffset: (i, target) => target.getTotalLength() + 2,
      opacity: 1,
    });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: svg,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    if (maskPaths.length > 0) {
      const drawSpeed = 800;

      tl.to(maskPaths, {
        strokeDashoffset: 0,
        duration: (i, target) => target.getTotalLength() / drawSpeed,
        stagger: 0.2,
      });
    }

    if (underline) {
      tl.to(
        underline,
        {
          strokeDashoffset: 0,
          duration: 1,
        },

        "-=0.4"
      );
    }
  });
}

function initFilterBasic() {
  const groups = document.querySelectorAll("[data-filter-group]");

  if (groups.length === 0) return;

  groups.forEach((group) => {
    const buttons = group.querySelectorAll("[data-filter-target]");

    const container = group.closest(".action_layout");

    const items = container.querySelectorAll("[data-filter-name]");

    const transitionDelay = 300;

    const updateStatus = (element, shouldBeActive) => {
      element.setAttribute(
        "data-filter-status",
        shouldBeActive ? "active" : "not-active"
      );
      element.setAttribute("aria-hidden", shouldBeActive ? "false" : "true");
    };

    const handleFilter = (target) => {
      items.forEach((item) => {
        const isTargetMatch = item.getAttribute("data-filter-name") === target;
        const currentStatus = item.getAttribute("data-filter-status");

        if (currentStatus === "active") {
          item.setAttribute("data-filter-status", "transition-out");
          setTimeout(() => updateStatus(item, isTargetMatch), transitionDelay);
        } else {
          if (isTargetMatch) {
            updateStatus(item, true);
          } else {
            updateStatus(item, false);
          }
        }
      });

      buttons.forEach((button) => {
        const isActive = button.getAttribute("data-filter-target") === target;
        button.setAttribute(
          "data-filter-status",
          isActive ? "active" : "not-active"
        );
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-filter-target");
        if (button.getAttribute("data-filter-status") === "active") return;
        handleFilter(target);
      });
    });
  });
}

function navThemeOnScroll() {
  const navComponent = document.querySelector(".nav_component");

  if (!navComponent) return;

  let lastScrollY = window.scrollY;
  let isHidden = false;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
      navComponent.setAttribute("data-theme", "dark");
    } else {
      navComponent.setAttribute("data-theme", "light");
    }

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      if (!isHidden) {
        gsap.to(navComponent, {
          yPercent: -125,
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        });
        isHidden = true;
      }
    } else if (currentScrollY < lastScrollY) {
      if (isHidden) {
        gsap.to(navComponent, {
          yPercent: 0,
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        });
        isHidden = false;
      }
    }

    lastScrollY = currentScrollY;
  });
}

function initFunction() {
  lenis.scrollTo(0);

  navAnimation();
  generatePillars();
  heroScrollFlip();
  blobAnimation();
  textRevealAnimation();
  stackCardAnimation();
  teamSection();
  visibilityElement();
  svgAnimation();
  initFilterBasic();
  galleryAnimation();
  navThemeOnScroll();

  ScrollTrigger.refresh();
}

function initResize() {
  generatePillars();
}

document.addEventListener("DOMContentLoaded", initFunction);
window.addEventListener("resize", initResize);
