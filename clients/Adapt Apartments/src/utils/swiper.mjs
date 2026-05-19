let findInstance;
let testimonialInstance;
let glimpseInstance;
let exclusiveInstance;
let convinceInstance;
let livingInstance;
let insightsInstance;
let otherInstance;
let appointmentVisualInstance;
let appointmentContentInstance;

function findSlider() {
  const slider = document.querySelector(".find_slider");

  if (!slider) return;

  // const wrapper = slider.querySelector(".swiper-wrapper");
  // const slides = Array.from(wrapper.querySelectorAll(".find_item_wrap"));

  // if (slides.length > 0 && slides.length < 5) {
  //   let i = 0;
  //   while (wrapper.querySelectorAll(".find_item_wrap").length < 5) {
  //     const clone = slides[i % slides.length].cloneNode(true);
  //     wrapper.appendChild(clone);
  //     i++;
  //   }
  // }

  findInstance = new Swiper(slider, {
    slideClass: "find_item_wrap",
    slidesPerView: 1.05,
    spaceBetween: 20,
    navigation: {
      nextEl: ".find_wrap [data-control='next']",
      prevEl: ".find_wrap [data-control='prev']",
    },
    breakpoints: {
      797: {
        slidesPerView: 2,
      },
      1280: {
        slidesPerView: 4,
      },
    },
  });
}

function testimonialSlider() {
  const slider = document.querySelector(".testimonial_slider");

  if (!slider) return;

  testimonialInstance = new Swiper(slider, {
    slideClass: "testimonial_item_wrap",
    slidesPerView: "auto",
    spaceBetween: 20,
    loop: true,
    navigation: {
      nextEl: ".testimonial_wrap [data-control='next']",
      prevEl: ".testimonial_wrap [data-control='prev']",
    },
  });
}

function glimpseSlider() {
  const slider = document.querySelector(".glimpse_slider");
  if (!slider) return;

  glimpseInstance = new Swiper(slider, {
    slideClass: "glimpse_item_wrap",
    slidesPerView: "auto",
    centeredSlides: true,
    initialSlide: 1,
    spaceBetween: 20,
    loop: true,
    navigation: {
      nextEl: ".glimpse_wrap [data-control='next']",
      prevEl: ".glimpse_wrap [data-control='prev']",
    },
    breakpoints: {
      767: {
        slidesPerView: 2,
        centeredSlides: false,
      },
      1260: {
        slidesPerView: 3,
      },
    },
  });
}

function exclusiveSlider() {
  const slider = document.querySelector(".exclusive_slider");
  if (!slider) return;

  const mediaQuery = window.matchMedia("(max-width: 61.99em)");

  function handleSwiper(e) {
    if (e.matches) {
      if (!exclusiveInstance) {
        exclusiveInstance = new Swiper(slider, {
          slideClass: "exclusive_visual",
          slidesPerView: 1.1,
          spaceBetween: 20,
        });
      }
    } else {
      if (exclusiveInstance) {
        exclusiveInstance.destroy(true, true);
        exclusiveInstance = null;
      }
    }
  }

  handleSwiper(mediaQuery);

  mediaQuery.addEventListener("change", handleSwiper);
}

function convinceSlider() {
  const slider = document.querySelector(".convince_slider");
  if (!slider) return;

  convinceInstance = new Swiper(slider, {
    slideClass: "convince_item_wrap",
    slidesPerView: "auto",
    spaceBetween: 20,
    navigation: {
      nextEl: ".convince_slider [data-control='next']",
      prevEl: ".convince_slider [data-control='prev']",
    },
    breakpoints: {
      1024: {
        slidesPerView: 1.1,
      },
      1280: {
        slidesPerView: 1.5,
      },
    },
  });
}

function moveExternalItems() {
  const layouts = document.querySelectorAll(".bilder_layout");

  layouts.forEach((layout) => {
    const slider = layout.querySelector(".bilder_slider");
    if (!slider) return;

    const swiperWrapper = layout.querySelector(".swiper-wrapper");

    const externalItems = layout.querySelectorAll(":scope > .bilder_item_wrap");

    externalItems.forEach((item) => {
      swiperWrapper.appendChild(item);
    });
  });
}

function initBilderTagClick() {
  const sliders = document.querySelectorAll(".bilder_slider");

  sliders.forEach((sliderEl) => {
    const wrapper = sliderEl.closest(".bilder_slider_wrap");
    if (!wrapper) return;

    const tagElement = wrapper.querySelector(".bilder_tag");
    if (!tagElement) return;

    const originalSlides = sliderEl.querySelectorAll(
      ".bilder_item_wrap:not(.swiper-slide-duplicate)"
    );

    if (originalSlides.length === 0) return;

    const lastIndex = originalSlides.length - 1;
    const lastSlide = originalSlides[lastIndex];
    const targetIndex = lastSlide.classList.contains("is-video")
      ? lastIndex - 1
      : lastIndex;

    tagElement.addEventListener("click", function () {
      const swiperInstance = sliderEl.swiper;
      if (!swiperInstance) return;

      if (swiperInstance.params.loop) {
        swiperInstance.slideToLoop(targetIndex);
      } else {
        swiperInstance.slideTo(targetIndex);
      }
    });
  });
}

function bilderSlider() {
  const sliders = document.querySelectorAll(".bilder_slider");
  if (sliders.length === 0) return;

  const bilderInstances = [];

  sliders.forEach((slider) => {
    // Mencari wrapper spesifik untuk masing-masing slider agar tombol navigasi tidak bentrok
    const wrapper = slider.closest(".bilder_slider_wrap");

    const instance = new Swiper(slider, {
      slideClass: "bilder_item_wrap",
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      navigation: {
        nextEl: wrapper.querySelector("[data-control='next']"),
        prevEl: wrapper.querySelector("[data-control='prev']"),
      },
    });

    bilderInstances.push(instance);
  });

  return bilderInstances;
}

function livingSlider() {
  const slider = document.querySelector(".living-s_slider");
  if (!slider) return;

  livingInstance = new Swiper(slider, {
    slideClass: "living-s_item_group",
    slidesPerView: 1,
    spaceBetween: 20,
    loop: true,
    navigation: {
      nextEl: ".living-s_wrap [data-control='next']",
      prevEl: ".living-s_wrap [data-control='prev']",
    },
    breakpoints: {
      767: {
        slidesPerView: 1.8,
      },
      1260: {
        slidesPerView: 2.8,
      },
    },
    on: {
      init: function (swiper) {
        updateLivingPagination(swiper);
      },
      slideChange: function (swiper) {
        updateLivingPagination(swiper);
      },
    },
  });
}

function updateLivingPagination(swiper) {
  const currentEls = document.querySelectorAll("[data-slider='current']");
  const sumEls = document.querySelectorAll("[data-slider='sum']");

  if (currentEls.length === 0 || sumEls.length === 0) return;

  const total = swiper.slides.length;
  const current = swiper.realIndex + 1;

  currentEls.forEach((el) => {
    el.textContent = current;
  });

  sumEls.forEach((el) => {
    el.textContent = total;
  });
}

function insightsSlider() {
  const slider = document.querySelector(".insights_slider");
  if (!slider) return;

  insightsInstance = new Swiper(slider, {
    slideClass: "insights_item_wrap",
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
      nextEl: ".insights_wrap [data-control='next']",
      prevEl: ".insights_wrap [data-control='prev']",
    },
    breakpoints: {
      767: {
        slidesPerView: 2,
      },
      1260: {
        slidesPerView: 3,
      },
    },
  });
}

function otherSlider() {
  const slider = document.querySelector(".other_slider");
  if (!slider) return;

  otherInstance = new Swiper(slider, {
    slideClass: "other_item_wrap",
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
      nextEl: ".other_wrap [data-control='next']",
      prevEl: ".other_wrap [data-control='prev']",
    },
    breakpoints: {
      767: {
        slidesPerView: 2,
      },
      1260: {
        slidesPerView: 3,
      },
    },
  });
}

function controlVideo(swiper) {
  const allVideos = document.querySelectorAll(".swiper-wrapper video");
  allVideos.forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });

  const activeSlide = swiper.slides[swiper.activeIndex];
  const activeVideo = activeSlide.querySelector("video");

  if (activeVideo) {
    let playPromise = activeVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Video autoplay dicegah oleh browser:", error);
      });
    }
  }
}

function appointmentVisualSwiper() {
  const slider = document.querySelector(".appointment_visual_wrap");
  if (!slider) return;

  appointmentVisualInstance = new Swiper(slider, {
    slideClass: "appointment_visual",
    slidesPerView: 1.00001,
    spaceBetween: 20,
    navigation: {
      nextEl: ".appointment_wrap [data-control='next']",
      prevEl: ".appointment_wrap [data-control='prev']",
    },
    on: {
      init: function (swiper) {
        updateLivingPagination(swiper);
        controlVideo(this);
      },
      slideChange: function (swiper) {
        updateLivingPagination(swiper);
        controlVideo(this);
      },
    },
  });
}

function appointmentContentSwiper() {
  const slider = document.querySelector(".appointment_content_slider");
  if (!slider) return;

  appointmentContentInstance = new Swiper(slider, {
    slideClass: "appointment_content_head",
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    spaceBetween: 20,
    allowTouchMove: false,
    navigation: {
      nextEl: ".appointment_wrap [data-control='next']",
      prevEl: ".appointment_wrap [data-control='prev']",
    },
  });
}

function initSwiper() {
  findSlider();
  testimonialSlider();
  glimpseSlider();
  exclusiveSlider();
  convinceSlider();
  moveExternalItems();
  livingSlider();
  insightsSlider();
  otherSlider();
  appointmentVisualSwiper();
  appointmentContentSwiper();
}

document.addEventListener("DOMContentLoaded", initSwiper);

window.addEventListener("load", function () {
  setTimeout(() => {
    bilderSlider();
    initBilderTagClick();
  }, 1000);
});
