let tickerFn;

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

function heroSequence() {
  const wrapper = document.querySelector(".scroll-wrap");

  if (!wrapper) return;

  const canvas = document.querySelector("[data-hero='sequence-canvas']");
  const ctx = canvas.getContext("2d");

  const config = {
    baseUrl:
      "https://scroll-sequence-prod.s3.eu-central-1.amazonaws.com/00000/inventry/",
    frameCount: 304,
    padding: 5,
    suffix: "",
    extension: ".jpg",
    prefix: "frame",
  };

  const images = [];
  const playhead = { frame: 0 };

  const getImageUrl = (index) => {
    const paddedIndex = (index + 1).toString().padStart(config.padding, "0");
    return `${config.baseUrl}${config.prefix}${paddedIndex}${config.suffix}${config.extension}`;
  };

  for (let i = 0; i < config.frameCount; i++) {
    const img = new Image();
    img.src = getImageUrl(i);
    images.push(img);
  }

  images[0].onload = render;

  // function render() {
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   if (images[playhead.frame].complete) {
  //     ctx.drawImage(images[playhead.frame], 0, 0, canvas.width, canvas.height);
  //   }
  // }

  function render() {
    const img = images[playhead.frame];

    if (!img || !img.complete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );
    const renderWidth = img.width * scale;
    const renderHeight = img.height * scale;

    const x = (canvas.width - renderWidth) / 2;
    const y = (canvas.height - renderHeight) / 2;

    ctx.drawImage(img, x, y, renderWidth, renderHeight);
  }

  gsap.to(playhead, {
    frame: config.frameCount - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
      trigger: ".scroll-wrap",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
    },
    onUpdate: render,
  });
}

function heroScrollOutAnimation() {
  const section = document.querySelector(".hero_wrap");
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "center top",
      scrub: true,
    },
  });

  tl.to(
    [
      ".hero_wrap .hero_content .tag_wrap",
      ".hero_wrap .hero_content h1",
      ".hero_wrap .hero_content .hero_desc",
      ".hero_wrap .button_main_wrap",
    ],
    {
      y: -20,
      opacity: 0,
      filter: "blur(10px)",
      stagger: 0.1,
      ease: "power2.inOut",
    }
  );

  tl.to(
    ".hero_bg",
    {
      xPercent: -100,
      ease: "power2.inOut",
    },
    "-=0.3"
  );
}

function whoSectionAnimation() {
  const section = document.querySelector(".who_wrap");

  if (!section) return;

  const headingSplit = new SplitText(".who_heading", { type: "words,chars" });

  gsap.set(headingSplit.chars, { opacity: 0.15 });

  gsap.to(headingSplit.chars, {
    opacity: 1,
    stagger: 0.5,
    ease: "none",
    scrollTrigger: {
      trigger: ".who_wrap",
      start: "center center",
      end: "+=800vh",
      pin: true,
      scrub: 0.5,
      // markers: true,
    },
  });
}

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

function buttonAnimation() {
  $(".button_main_wrap").mouseenter(function (e) {
    var parentOffset = $(this).offset();
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;

    var circle = $(this).find(".button-circle");
    circle.css({ left: relX, top: relY });
    circle.removeClass("desplode-circle");
    circle.addClass("explode-circle");
  });

  $(".button_main_wrap").mouseleave(function (e) {
    var parentOffset = $(this).offset();
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;

    var circle = $(this).find(".button-circle");
    circle.css({ left: relX, top: relY });
    circle.removeClass("explode-circle");
    circle.addClass("desplode-circle");
  });
}

function navbarInteraction() {
  const nav = document.querySelector(".nav_component");

  const hideNavAnim = gsap.to(nav, {
    yPercent: -100,
    paused: true,
    duration: 0.6,
    ease: "power2.inOut",
  });

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      if (self.direction === 1) {
        hideNavAnim.play();
      } else {
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

function projetInteraction() {
  const section = document.querySelector(".hero-p_wrap");

  if (!section) return;

  const detailsElements = section.querySelectorAll("details.hero-p_item_wrap");

  detailsElements.forEach((details) => {
    const summary = details.querySelector("summary.hero-p_item_top");
    const button = details.querySelector(".button_main_wrap");

    if (summary && button) {
      summary.addEventListener("click", (e) => {
        e.preventDefault();
      });

      button.addEventListener("click", (e) => {
        e.stopPropagation();

        if (details.open) {
          details.removeAttribute("open");
        } else {
          details.setAttribute("open", "");
        }
      });
    }
  });
}

function initFunction() {
  heroSequence();
  whoSectionAnimation();
  heroScrollOutAnimation();
  horizontalLoop();
  buttonAnimation();
  navbarInteraction();
  projetInteraction();
}

document.addEventListener("DOMContentLoaded", initFunction);
