let swiperInstances = [];

function executionSlider() {
  const slider = document.querySelector(".execution_slider");

  if (!slider) return;

  const executionInstance = new Swiper(slider, {
    slideClass: "execution_item_wrap",
    slidesPerView: 1.00000001,
    spaceBetween: 140,
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    observer: true,
    observeParents: true,
    pagination: {
      el: ".slider_pagination",
      clickable: true,
    },
    speed: 500,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    effect: "coverflow",
    coverflowEffect: {
      rotate: 0,
      stretch: -0,
      depth: 200,
      modifier: 1,
      slideShadows: false,
    },
  });
}

function actionSlider() {
  const sliders = document.querySelectorAll(".action_content_slider");

  sliders.forEach((slider, index) => {
    const parent = slider.closest(".action_content");

    const slidesAt1200 = index === 0 || index === 1 ? 3 : 3.1;

    const actionInstance = new Swiper(slider, {
      slideClass: "action_item_wrap",
      slidesPerView: 1.1,
      spaceBetween: 12,
      grabCursor: true,
      // navigation: {
      //   nextEl: parent ? parent.querySelector("[data-control='next']") : null,
      //   prevEl: parent ? parent.querySelector("[data-control='prev']") : null,
      // },
      observer: true,
      observeParents: true,
      breakpoints: {
        724: {
          slidesPerView: 2.1,
        },
        1200: {
          slidesPerView: slidesAt1200,
        },
      },
    });

    swiperInstances.push(actionInstance);
  });
}

function navigationSlider() {
  const section = document.querySelector(".action_wrap");

  if (!section) return;

  const globalNextBtn = section.querySelector("[data-control='next']");
  const globalPrevBtn = section.querySelector("[data-control='prev']");

  globalNextBtn.addEventListener("click", () => {
    const activeSliderEl = document.querySelector(
      ".action_content_wrap[data-filter-status='active'] .action_content_slider"
    );

    if (activeSliderEl && activeSliderEl.swiper) {
      activeSliderEl.swiper.slideNext();
    }
  });

  globalPrevBtn.addEventListener("click", () => {
    const activeSliderEl = document.querySelector(
      ".action_content_wrap[data-filter-status='active'] .action_content_slider"
    );

    if (activeSliderEl && activeSliderEl.swiper) {
      activeSliderEl.swiper.slidePrev();
    }
  });
}

function initSlider() {
  executionSlider();
  actionSlider();
  navigationSlider();
}

document.addEventListener("DOMContentLoaded", initSlider);
