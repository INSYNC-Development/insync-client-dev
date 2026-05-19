// const emailValidation = () => {
//   // Select all input fields with type="email"
//   const emailInputs = document.querySelectorAll('input[type="email"]');

//   if (!emailInputs.length) return;

//   // Loop through each email input field found
//   emailInputs.forEach((emailInput) => {
//     // Find the sibling element for the error message
//     const errorMsgElement = emailInput.nextElementSibling;

//     if (
//       !errorMsgElement ||
//       errorMsgElement.getAttribute("data-input-form") !== "error-msg"
//     ) {
//       console.error(
//         "Could not find the error message element for an email input.",
//         emailInput
//       );
//       return; // Skip this field if no error message element is found
//     }

//     emailInput.addEventListener("blur", function () {
//       const email = this.value.trim();
//       const emailParts = email.split("@");

//       if (emailParts.length === 2 && emailParts[1].length > 0) {
//         const domain = emailParts[1];
//         validateDomain(domain, errorMsgElement);
//       } else if (email.length > 0) {
//         showError(
//           "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
//           errorMsgElement
//         );
//       } else {
//         hideError(errorMsgElement); // Hide error if the field is empty
//       }
//     });
//   });

//   async function validateDomain(domain, errorElement) {
//     try {
//       // Show a loading/checking message for better UX
//       showError("Domain wird überprüft...", errorElement);

//       const response = await fetch(
//         `https://dns.google/resolve?name=${domain}&type=MX`
//       );
//       const data = await response.json();

//       // Check for a valid response and if an "Answer" section with records exists
//       if (response.ok && data.Answer && data.Answer.length > 0) {
//         hideError(errorElement); // Domain is valid
//       } else {
//         showError(
//           "Die E-Mail-Domain scheint ungültig oder nicht existent zu sein.",
//           errorElement
//         );
//       }
//     } catch (error) {
//       console.error("Error during domain validation:", error);
//       // Optional: Show an error if the API is unreachable
//       showError(
//         "Die Validierung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Verbindung.",
//         errorElement
//       );
//     }
//   }

//   function showError(message, element) {
//     element.textContent = message;
//     element.style.display = "block";
//   }

//   function hideError(element) {
//     element.style.display = "none";
//   }
// };

// const telInputValidation = () => {
//   // Select all input fields with type="tel"
//   const telInputs = document.querySelectorAll('input[type="tel"]');

//   if (!telInputs.length) return;

//   telInputs.forEach((telInput) => {
//     const errorMsgElement = telInput.nextElementSibling;

//     if (
//       !errorMsgElement ||
//       errorMsgElement.getAttribute("data-input-form") !== "error-msg"
//     ) {
//       console.error(
//         "Could not find the error message element for a telephone input.",
//         telInput
//       );
//       return;
//     }

//     telInput.addEventListener("input", function (event) {
//       const originalValue = this.value;
//       // Remove any character that is not a digit, except for a leading '+'
//       let sanitizedValue = originalValue.replace(/[^\d+]/g, "");

//       // Ensure '+' only appears at the beginning
//       if (sanitizedValue.lastIndexOf("+") > 0) {
//         sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
//       }

//       // If the first character is not a digit or a plus, remove it
//       if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue)) {
//         sanitizedValue = sanitizedValue.substring(1);
//       }

//       // Update the input's value only if it changed
//       if (originalValue !== sanitizedValue) {
//         this.value = sanitizedValue;
//       }

//       // Simple validation check for the error message
//       // (Can be customized, e.g., to check for minimum length)
//       if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
//         showError(
//           "Zulässig sind nur Zahlen und ein vorangestelltes Pluszeichen.",
//           errorMsgElement
//         );
//       } else {
//         hideError(errorMsgElement);
//       }
//     });

//     // Helper functions to show/hide errors (if not already present)
//     function showError(message, element) {
//       element.textContent = message;
//       element.style.display = "block";
//     }

//     function hideError(element) {
//       element.style.display = "none";
//     }
//   });
// };

// NAV ANIM
// const navObserve = () => {
//   const navbar = document.querySelector(".nav_component");

//   const AT_TOP_OFFSET = 100; // 👈 Change this value to whatever you need

//   let lastScrollY = window.scrollY;
//   let ticking = false;
//   let scrollTimeout = null;
//   let currentState = "at-top";

//   function setState(newState) {
//     if (newState === currentState) return;
//     currentState = newState;

//     navbar.classList.remove(
//       "is-at-top",
//       "is-scrolling-down",
//       "is-scrolling-up",
//       "is-stopped"
//     );

//     switch (newState) {
//       case "at-top":
//         navbar.classList.add("is-at-top");
//         break;
//       case "scrolling-down":
//         navbar.classList.add("is-scrolling-down");
//         break;
//       case "scrolling-up":
//         navbar.classList.add("is-scrolling-up");
//         break;
//       case "stopped":
//         navbar.classList.add("is-stopped");
//         break;
//     }
//   }

//   function updateScroll() {
//     const currentScrollY = window.scrollY;

//     if (currentScrollY <= AT_TOP_OFFSET) {
//       // 👈 Updated
//       setState("at-top");
//     } else if (currentScrollY > lastScrollY) {
//       setState("scrolling-down");
//     } else if (currentScrollY < lastScrollY) {
//       setState("scrolling-up");
//     }

//     lastScrollY = currentScrollY;
//     ticking = false;
//   }

//   function onScroll() {
//     if (!ticking) {
//       window.requestAnimationFrame(updateScroll);
//       ticking = true;
//     }

//     clearTimeout(scrollTimeout);
//     scrollTimeout = setTimeout(() => {
//       if (window.scrollY > AT_TOP_OFFSET) {
//         // 👈 Updated
//         setState("stopped");
//       } else {
//         setState("at-top");
//       }
//     }, 350);
//   }

//   setState(window.scrollY <= AT_TOP_OFFSET ? "at-top" : "stopped"); // 👈 Updated

//   window.addEventListener("scroll", onScroll, { passive: true });
// };

// const roadmapAnim = () => {
//   // Roadmap scroll animation
//   function initRoadmap() {
//     const section = document.querySelector(".road_wrap");
//     if (!section) return;

//     const numbers = section.querySelectorAll(".road_line_number");
//     const items = section.querySelectorAll(".road_item_wrap");

//     if (!numbers.length || !items.length) return;

//     // Remove initial is-active states
//     numbers.forEach((num) => num.classList.remove("is-active"));
//     items.forEach((item) => item.classList.remove("is-active"));

//     // Create a ScrollTrigger for each number/item pair
//     numbers.forEach((number, index) => {
//       ScrollTrigger.create({
//         trigger: number,
//         start: "top 55%",
//         onEnter: () => activateStep(index, numbers, items),
//         onLeaveBack: () => deactivateStep(index, numbers, items),
//       });
//     });
//   }

//   // Activate a roadmap step
//   function activateStep(index, numbers, items) {
//     numbers[index].classList.add("is-active");
//     if (items[index]) items[index].classList.add("is-active");
//   }

//   // Deactivate a roadmap step
//   function deactivateStep(index, numbers, items) {
//     numbers[index].classList.remove("is-active");
//     if (items[index]) items[index].classList.remove("is-active");
//   }

//   initRoadmap();
// };

// function initFunction() {
//   // telInputValidation();
//   // emailValidation();
//   navObserve();
//   roadmapAnim();
// }

// document.addEventListener("DOMContentLoaded", function () {
//   document.fonts.ready.then(() => {
//     document.body.style.opacity = "1";
//     initFunction();
//     ScrollTrigger.refresh();
//   });
// });

// Swiper Case Studies Page
// document.addEventListener("DOMContentLoaded", function () {
//   const currentNumber = document.querySelector(
//     ".testimonial_wrap .kunden_navigation-text span:nth-child(1)"
//   );

//   const totalNumber = document.querySelector(
//     ".testimonial_wrap .kunden_navigation-text span:nth-child(3)"
//   );

//   const swiperTestimonial = new Swiper(".swiper.is-testimonial", {
//     slidesPerView: 1,
//     speed: 600,
//     spaceBetween: 20,
//     loop: false,

//     navigation: {
//       nextEl: ".testimonial_wrap .kunden_navigation.is-next",
//       prevEl: ".testimonial_wrap .kunden_navigation.is-prev",
//     },

//     on: {
//       init: function (sw) {
//         const totalSlides = sw.slides.length;

//         if (totalNumber) totalNumber.textContent = totalSlides;
//         if (currentNumber) currentNumber.textContent = sw.activeIndex + 1;
//       },

//       slideChange: function (sw) {
//         if (currentNumber) {
//           currentNumber.textContent = sw.activeIndex + 1;
//         }
//       },
//     },
//   });
// });

// Swiper Homepage
// document.addEventListener("DOMContentLoaded", function () {
//   // 1. Inisialisasi Swiper Logo (Bagian Bawah)
//   const logoSwiper = new Swiper(".swiper.is-kunden-logo", {
//     slidesPerView: 1, // Sesuaikan jika ingin melihat lebih dari 1 logo
//     spaceBetween: 10,
//     allowTouchMove: true, // User bisa geser logo juga
//     speed: 800,
//     loop: false, // Disarankan false agar sinkronisasi lebih akurat dengan progress bar
//   });

//   // 2. Inisialisasi Swiper Card (Bagian Atas)
//   const cardSwiper = new Swiper(".swiper.is-kunden-card", {
//     slidesPerView: 1,
//     spaceBetween: 20,
//     speed: 800,
//     grabCursor: true,
//     navigation: {
//       nextEl: ".kunden_wrap .kunden_navigation.is-next",
//       prevEl: ".kunden_wrap .kunden_navigation.is-prev",
//     },
//     // Menghubungkan ke logoSwiper
//     controller: {
//       control: logoSwiper,
//     },
//     on: {
//       init: function () {
//         updateUI(this);
//       },
//       slideChange: function () {
//         updateUI(this);
//       },
//     },
//   });

//   // 3. Hubungkan balik logoSwiper ke cardSwiper (Dua Arah)
//   logoSwiper.controller.control = cardSwiper;

//   // 4. Fungsi untuk Update Progress Bar & Text Pagination
//   function updateUI(swiper) {
//     const totalSlides = swiper.slides.length;
//     const currentIndex = swiper.activeIndex + 1;

//     // Update Text (1/4)
//     const currentText = document.querySelector(
//       ".kunden_wrap .kunden_navigation-text:nth-child(1)"
//     );
//     const totalText = document.querySelector(
//       ".kunden_wrap .kunden_navigation-text:nth-child(3)"
//     );

//     if (currentText) currentText.textContent = currentIndex;
//     if (totalText) totalText.textContent = totalSlides;

//     // Update Progress Bar
//     const progressBar = document.querySelector(".kunden_progress_bar");
//     if (progressBar) {
//       const progressPercentage = (currentIndex / totalSlides) * 100;
//       progressBar.style.width = progressPercentage + "%";
//       progressBar.style.transition = "width 0.4s ease"; // Biar animasinya smooth
//     }
//   }
// });

// ANIM INIT

// document.addEventListener("DOMContentLoaded", () => {
//   if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
//     console.error("GSAP or ScrollTrigger is not loaded.");
//     return;
//   }

//   gsap.registerPlugin(ScrollTrigger);

//   function initScrollAnimations() {
//     const elements = gsap.utils.toArray('[data-scroll-animation="slide-up"]');

//     if (elements.length === 0) return;

//     gsap.set(elements, {
//       opacity: 0,
//       y: 40,
//     });

//     ScrollTrigger.batch(elements, {
//       start: "top 90%",
//       onEnter: (batch) => {
//         gsap.to(batch, {
//           opacity: 1,
//           y: 0,
//           stagger: 0.15,

//           duration: 1.2,
//           ease: "power3.out",
//           overwrite: true,
//         });
//       },
//     });
//   }

//   initScrollAnimations();
// });

// STATS ANIM
// const stats = document.querySelectorAll(".stats_stat_number");

// stats.forEach((stat) => {
//   // Ambil teks asli (misal: "4000" atau "7,5")
//   // Kita abaikan isi <span> (+ atau %) agar tidak ikut terhitung
//   const targetNode = stat.childNodes[0];
//   const targetValue = targetNode.textContent.replace(",", "."); // Ubah koma ke titik untuk kalkulasi
//   const isDecimal = targetValue.includes(".");

//   const obj = { value: 0 };

//   gsap.to(obj, {
//     value: parseFloat(targetValue),
//     duration: 2,
//     ease: "power2.out",
//     scrollTrigger: {
//       trigger: stat,
//       start: "top 90%", // Animasi mulai saat elemen 90% dari atas viewport
//       toggleActions: "play none none none",
//     },
//     onUpdate: () => {
//       // Format kembali ke gaya Jerman (koma untuk desimal)
//       let formattedValue = isDecimal
//         ? obj.value.toFixed(1).replace(".", ",")
//         : Math.floor(obj.value).toLocaleString("de-DE");

//       targetNode.textContent = formattedValue;
//     },
//   });
// });

// document.addEventListener("DOMContentLoaded", function () {
//   var lottieAnim = lottie.loadAnimation({
//     container: document.getElementById("lottie-canvas-container"),
//     renderer: "svg",
//     loop: false,

//     autoplay: false,

//     path: "https://cdn.prod.website-files.com/69b21f5842b7f511474fea85/69ca2692cef7cd7f62a7b089_Linetrack_improve_new.json",
//   });

//   lottieAnim.addEventListener("DOMLoaded", function () {
//     gsap.registerPlugin(ScrollTrigger);
//     let mm = gsap.matchMedia();

//     mm.add("(min-width: 992px)", () => {
//       let playhead = { frame: 0 };

//       gsap.to(playhead, {
//         frame: lottieAnim.totalFrames - 1,
//         ease: "none",
//         scrollTrigger: {
//           trigger: ".process_step_wrap",
//           start: "top 10%",
//           end: "+=2000",
//           pin: true,
//           pinSpacing: true,
//           refreshPriority: 1,
//           scrub: 1,
//           markers: false,
//         },
//         onUpdate: () => {
//           lottieAnim.goToAndStop(playhead.frame, true);
//         },
//       });
//     });

//     mm.add("(max-width: 991px)", () => {
//       ScrollTrigger.create({
//         trigger: ".process_step_wrap",
//         start: "top 80%",

//         onEnter: () => lottieAnim.play(),

//         onLeaveBack: () => lottieAnim.pause(),

//         markers: false,
//       });

//       return () => {
//         lottieAnim.stop();
//       };
//     });
//   });
// });
