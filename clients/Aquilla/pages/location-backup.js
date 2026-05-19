// document.addEventListener("DOMContentLoaded", () => {
//   const swiperGalleryTop = new Swiper(".swiper.is-villa-top", {
//     slidesPerView: 1,
//     spaceBetween: 24,
//     loop: true,
//     // autoplay: true,
//     autoplay: {
//       delay: 0,
//     },
//     breakpoints: {
//       //   768: {
//       //     slidesPerView: 2,
//       //   },
//       1024: {
//         slidesPerView: "auto",
//       },
//     },
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const swiperGalleryTop = new Swiper(".swiper.is-villa-top", {
//     slidesPerView: 1,
//     spaceBetween: 24,
//     loop: true,

//     speed: 5000,

//     autoplay: {
//       delay: 0,
//       //   disableOnInteraction: false, // PENTING: Agar setelah di-swipe user, marquee jalan lagi
//       //   pauseOnMouseEnter: true, // OPSIONAL: Marquee berhenti saat mouse hover (bagus untuk UX)
//     },
//     breakpoints: {
//       1024: {
//         slidesPerView: "auto",
//       },
//     },
//     on: {
//       touchStart: function () {
//         // Saat disentuh, kembalikan ke default ease agar swipe enak
//         this.wrapperEl.style.transitionTimingFunction = "ease-out";
//       },
//       transitionEnd: function () {
//         // Kembalikan ke linear untuk marquee setelah transisi selesai
//         // Catatan: Ini mungkin memberi sedikit efek 'hentakan' kecil saat beralih mode
//         this.wrapperEl.style.transitionTimingFunction = "linear";
//       },
//     },
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
  // Simpan kecepatan yang diinginkan dalam variabel
  const MARQUEE_SPEED = 6000; // Kecepatan jalan sendiri (makin besar makin pelan)
  const SWIPE_SPEED = 800; // Kecepatan saat di-swipe user (standar normal)

  const swiperGalleryTop = new Swiper(".swiper.is-villa-top", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,

    // Default awal adalah speed marquee
    speed: MARQUEE_SPEED,
    allowTouchMove: true, // Pastikan user bisa swipe

    autoplay: {
      delay: 0,
      disableOnInteraction: false, // PENTING: Autoplay nyala lagi setelah disentuh
    },

    breakpoints: {
      1024: {
        slidesPerView: "auto",
      },
    },

    // EVENT HANDLERS (Kunci Perbaikan Glitch)
    on: {
      // 1. Saat inisialisasi, set gaya linear untuk marquee
      init: function () {
        this.wrapperEl.style.transitionTimingFunction = "linear";
      },

      // 2. Saat User MENYENTUH slide (Touch Start)
      touchStart: function () {
        // Ubah speed jadi cepat agar responsif mengikuti jari
        this.params.speed = SWIPE_SPEED;
        // Ubah transisi jadi 'ease-out' agar swipe terasa natural (tidak kaku)
        this.wrapperEl.style.transitionTimingFunction = "ease-out";
      },

      // 3. Saat User MELEPAS slide (Touch End)
      touchEnd: function () {
        // Kita biarkan speed tetap SWIPE_SPEED dulu agar transisi 'lemparan' slide selesai dengan cepat.
        // Swiper akan otomatis memicu 'autoplayStart' atau 'transitionEnd' setelahnya.
      },

      // 4. Saat Transisi Swipe Selesai (Transition End)
      transitionEnd: function () {
        // Cek jika autoplay sedang berjalan/bersiap jalan lagi
        if (this.autoplay.running) {
          this.params.speed = MARQUEE_SPEED;
          this.wrapperEl.style.transitionTimingFunction = "linear";
        }
      },

      // 5. Penjaga tambahan: Saat Autoplay dimulai kembali
      autoplayStart: function () {
        this.params.speed = MARQUEE_SPEED;
        this.wrapperEl.style.transitionTimingFunction = "linear";
      },
    },
  });
});

// document.addEventListener("DOMContentLoaded", () => {
//   const swiperGalleryTop = new Swiper(".swiper.is-villa-bottom", {
//     slidesPerView: 1,
//     spaceBetween: 24,
//     loop: true,

//     // PENTING: Kecepatan jalannya marquee (makin besar angka, makin pelan/halus)
//     speed: 5000,

//     autoplay: {
//       delay: 0,
//       disableOnInteraction: false, // PENTING: Agar setelah di-swipe user, marquee jalan lagi
//       pauseOnMouseEnter: true, // OPSIONAL: Marquee berhenti saat mouse hover (bagus untuk UX)
//       reverseDirection: true,
//     },
//     breakpoints: {
//       1024: {
//         slidesPerView: "auto",
//       },
//     },
//     on: {
//       touchStart: function () {
//         // Saat disentuh, kembalikan ke default ease agar swipe enak
//         this.wrapperEl.style.transitionTimingFunction = "ease-out";
//       },
//       transitionEnd: function () {
//         // Kembalikan ke linear untuk marquee setelah transisi selesai
//         // Catatan: Ini mungkin memberi sedikit efek 'hentakan' kecil saat beralih mode
//         this.wrapperEl.style.transitionTimingFunction = "linear";
//       },
//     },
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const swiperGalleryTop = new Swiper(".swiper.is-villa-bottom", {
//     slidesPerView: 1,
//     spaceBetween: 24,
//     loop: true,
//     // autoplay: true,
//     autoplay: {
//       delay: 0,
//       reverseDirection: true,
//       //   disableOnInteraction: false,
//     },
//     breakpoints: {
//       //   768: {
//       //     slidesPerView: 2,
//       //   },
//       1024: {
//         slidesPerView: "auto",
//       },
//     },
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
  const swiperGalleryTop = new Swiper(".swiper.is-seaside-top", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    // autoplay: true,
    autoplay: {
      delay: 0,
    },
    breakpoints: {
      //   768: {
      //     slidesPerView: 2,
      //   },
      1024: {
        slidesPerView: "auto",
      },
    },
  });
});
