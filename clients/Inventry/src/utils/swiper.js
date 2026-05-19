let teamInstance;
let teamContentInstance;

function teamSlider() {
  const section = document.querySelector(".about-t_wrap");

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
    slidesPerView: 5,
    loop: true,
    simulateTouch: false,
    centeredSlides: true,
    effect: "coverflow",
    coverflowEffect: {
      rotate: 0,
      stretch: -0,
      depth: 200,
      modifier: 1,
      slideShadows: false,
    },
    navigation: {
      nextEl: ".about-t_wrap [data-control='next']",
      prevEl: ".about-t_wrap [data-control='prev']",
    },
  });
}

function teamContentSlider() {
  const section = document.querySelector(".about-t_wrap");
  if (!section) return;

  const teamContentSliderEl = section.querySelector(".about-t_slider");

  teamContentInstance = new Swiper(teamContentSliderEl, {
    slideClass: "about-t_item_wrap",
    slidesPerView: "auto",
    loop: true,
    simulateTouch: false,
    navigation: {
      nextEl: ".about-t_wrap [data-control='next']",
      prevEl: ".about-t_wrap [data-control='prev']",
    },
  });
}

function initSwiper() {
  teamSlider();
  teamContentSlider();
}

document.addEventListener("DOMContentLoaded", initSwiper);
