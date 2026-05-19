function initInvestorSlider() {
  const component = document.querySelector(".investor_slider_component");
  if (!component) return;

  const swiperEl = component.querySelector(".swiper.is-investor");
  const prevBtn = component.querySelector("[data-nav-btn='prev']");
  const nextBtn = component.querySelector("[data-nav-btn='next']");
  if (!swiperEl) return;

  const swiper = new Swiper(swiperEl, {
    slidesPerView: 1,
    grabCursor: true,
    speed: 800,
    keyboard: { enabled: true, pageUpDown: false },
    mousewheel: { enabled: true, forceToAxis: true, thresholdDelta: 25 },
    watchSlidesProgress: true,
    navigation: {
      prevEl: prevBtn,
      nextEl: nextBtn,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
    },
  });
}

function recruitmentAnim() {
  const section = document.querySelector(".recruitment_wrap");
  if (!section) return;
  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    gsap.context(() => {
      const items = section.querySelectorAll(".recruitment_list_item");
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
        });
      });
    });
    return () => {
      gsap.set(section.querySelectorAll(".recruitment_list_item"), {
        clearProps: "all",
      });
    };
  });
}

function initTestimonialSecondSlider() {
  const component = document.querySelector(".testimonial_2_slider_component");
  if (!component) return;

  const swiperEl = component.querySelector(".swiper.is-testimonial-2");
  const prevBtn = component.querySelector("[data-nav-btn='prev']");
  const nextBtn = component.querySelector("[data-nav-btn='next']");
  if (!swiperEl) return;

  const swiper = new Swiper(swiperEl, {
    slidesPerView: 1,
    // loop: true,
    grabCursor: true,
    speed: 800,
    keyboard: { enabled: true, pageUpDown: false },
    mousewheel: { enabled: true, forceToAxis: true, thresholdDelta: 25 },
    watchSlidesProgress: true,
    navigation: {
      prevEl: prevBtn,
      nextEl: nextBtn,
    },

    breakpoints: {
      768: {
        slidesPerView: 2,
      },

      992: {
        slidesPerView: 3,
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTestimonialSecondSlider();
  recruitmentAnim();
  initInvestorSlider();
});
