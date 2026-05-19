// let serviceIntence;

// function serviceSwiper() {
//   const swiperEl = document.querySelector(".service_slider");

//   if (!swiperEl) return;

//   if (!serviceIntence) {
//     serviceIntence = new Swiper(swiperEl, {
//       slideClass: "service_item_wrap",
//       slidesPerView: 1.2,
//       spaceBetween: 10,
//       breakpoints: {
//         472: {
//           slidesPerView: 1.5,
//           spaceBetween: 10,
//         },
//         992: {
//           slidesPerView: 3,
//           spaceBetween: 10,
//         },
//       },
//       navigation: {
//         nextEl: '[data-slider="next"]',
//         prevEl: '[data-slider="prev"]',
//       },
//     });
//   } else if (!isTablet && serviceIntence) {
//     serviceIntence.destroy(true, true);
//     serviceIntence = null;
//   }
// }

function stepAnimation() {
  const items = gsap.utils.toArray(".step_item");

  // Definisi Easing
  // let flickerEase =
  //   "rough({ template: circ.easeOut, strength: 4, points: 50, taper: 'out', randomize: true, clamp:  true})";

  if (!items.length) return;

  const ctx = gsap.context(() => {
    items.forEach((item) => {
      // Selector elemen anak
      const dot = item.querySelector(".step_dot");
      const progressWrap = item.querySelector(".step_progress_wrap");
      const progress = item.querySelector(".step_progress");
      const contents = item.querySelectorAll(".step_item_content > *");

      const tl = gsap.timeline({
        onComplete: () => tl.kill(),
      });
      const tl2 = gsap.timeline();
      const tl3 = gsap.timeline();

      tl.from(dot, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
      })
        .from(
          contents,
          {
            autoAlpha: 0,
            duration: 1,
            stagger: { each: 0.05, from: "random" },
            ease: "power2.out",
          },
          "<"
        )
        .from(
          progressWrap,
          {
            height: "0%",
            duration: 0.5,
            ease: "power2.out",
          },
          "<+=0.3"
        );

      tl2.to(progress, {
        height: "100%",
        ease: "none",
      });

      tl3.to(dot, {
        background: "white",
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        animation: tl,
        once: true,
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top center",
        end: "bottom center",
        scrub: true,
        animation: tl2,
      });

      ScrollTrigger.create({
        trigger: dot,
        start: "top 60%",
        end: "bottom 40%",
        scrub: true,
        animation: tl3,
      });
    });
  });

  return ctx;
}

function commitmentAnimation() {
  const items = document.querySelectorAll(".commitment_item");

  if (items.length === 0) return;

  items.forEach((item) => {
    gsap.from(item, {
      opacity: 0,
      blur: "10px",
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });
}

function servicesFunction() {
  const wrap = document.querySelector(".services_wrap");
  const contain = wrap.querySelector(".services_contain");
  const servicesBottom = document.querySelector(".services_bottom");
  const items = gsap.utils.toArray(".services_item_wrap");

  const ltr = document.querySelector('html[dir="rtl"]');

  console.log(ltr);

  if (!wrap || !servicesBottom || items.length === 0) return;

  let tween = gsap.to(items, {
    x: () =>
      !ltr
        ? -1 * (servicesBottom.scrollWidth - contain.offsetWidth)
        : servicesBottom.scrollWidth - contain.offsetWidth,
    ease: "none",
    scrollTrigger: {
      trigger: wrap,
      pin: true,
      pinSpacing: true,
      start: "top top",
      scrub: 1,
      invalidateOnRefresh: true,
      end: () => "+=" + (servicesBottom.scrollWidth - contain.offsetWidth),
    },
  });
}

function initFunction() {
  // serviceSwiper();
  servicesFunction();
  stepAnimation();
  commitmentAnimation();
}

document.addEventListener("DOMContentLoaded", initFunction);
