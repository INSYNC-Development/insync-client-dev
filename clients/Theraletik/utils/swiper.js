// let heroIntance;

// function heroSlider() {
//   const slider = document.querySelector(".hero_slider");

//   if (!slider) return;

//   heroIntance = new Swiper(slider, {
//     direction: "vertical",
//     slideClass: "hero_item_wrap",
//     // wrapperClass: "hero_slider_wrapper",
//     slidesPerView: 1,
//     loop: true,
//     spaceBetween: 0,
//     navigation: {
//       nextEl: ".hero_slider [data-control='next']",
//       prevEl: ".hero_slider [data-control='prev']",
//     },
//   });
// }

function heroSlider() {
  const container = document.querySelector(".hero_slider");
  if (!container) return;

  console.log("Here");

  const slides = Array.from(container.querySelectorAll(".hero_item_wrap"));
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  console.log(totalSlides);

  let currentIndex = 0;
  let isAnimating = false;

  const nextBtn = container.querySelector("[data-control='next']");
  const prevBtn = container.querySelector("[data-control='prev']");

  const updateSlides = (direction, init = false) => {
    isAnimating = true;

    slides.forEach((slide, index) => {
      let diff = (index - currentIndex + totalSlides) % totalSlides;

      let targetY = "10%";
      let targetOpacity = 1;
      let targetZIndex = 1;
      let targetScale = 0.9; // Default scale

      if (diff === 0) {
        // Current
        targetY = "0%";
        targetScale = 1;
        targetZIndex = 4;
      } else if (diff === 1) {
        // Slide Next (Disembunyikan di atas)
        targetY = "-20%";
        targetOpacity = 0;
        targetScale = 1;
        targetZIndex = 5;
      } else if (diff === totalSlides - 1) {
        // Antrean 1 (Berada di bawah)
        targetY = "7.5%";
        targetScale = 0.95;
        targetZIndex = 3;
      } else if (diff === totalSlides - 2) {
        // Antrean 2 (Berada lebih di bawah lagi)
        targetY = "15%";
        targetScale = 0.9;
        targetZIndex = 2;
      }

      if (init) {
        gsap.set(slide, {
          y: targetY,
          opacity: targetOpacity,
          zIndex: targetZIndex,
          scale: targetScale,
        });
      } else {
        if (direction === "next" && diff === 1) {
          gsap.set(slide, {
            y: targetY,
            opacity: targetOpacity,
            zIndex: targetZIndex,
            scale: targetScale,
          });
        } else if (direction === "prev" && slide._wasNext && diff !== 0) {
          gsap.set(slide, {
            y: targetY,
            opacity: targetOpacity,
            zIndex: targetZIndex,
            scale: targetScale,
          });
        } else {
          gsap.to(slide, {
            y: targetY,
            opacity: targetOpacity,
            zIndex: targetZIndex,
            scale: targetScale,
            duration: 0.4,
            ease: "power2.inOut",
          });
        }
      }

      slide._wasNext = diff === 1;
    });

    if (!init) {
      setTimeout(() => {
        isAnimating = false;
      }, 400);
    }
  };

  updateSlides("next", true);

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlides("next");
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlides("prev");
    });
  }
}

function testimonialSlider() {
  if (typeof Swiper === "undefined") return;

  const allSlides = document.querySelectorAll(".swiper-slide.is-testi");

  if (!allSlides) return;

  const totalSlides = allSlides.length;

  allSlides.forEach((slide, index) => {
    const countText = slide.querySelector(".testimonial_bottom_count-text");
    const totalSpan = slide.querySelector(".testimonial_bottom_count-total");

    if (countText && totalSpan) {
      const currentIndex = index + 1;
      countText.innerHTML = `${currentIndex}/<span class="testimonial_bottom_count-total">${totalSlides}</span>`;
    }
  });

  const swiper = new Swiper(".swiper.is-testi", {
    loop: true,
    speed: 600,
    spaceBetween: 20,
    slidesPerView: 1,
    navigation: {
      nextEl: ".testimonial_navigation_button_wrap.is-next",
      prevEl: ".testimonial_navigation_button_wrap.is-prev",
    },
  });
}

function initSwiper() {
  heroSlider();
  testimonialSlider();
}

document.addEventListener("DOMContentLoaded", initSwiper);
