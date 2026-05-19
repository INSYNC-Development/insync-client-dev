function servicesAnim() {
  let mm = gsap.matchMedia();

  mm.add("(min-width: 1024px)", () => {
    document
      .querySelectorAll(".services-main_item_wrap:not(:last-child)")
      .forEach((item) => {
        gsap.to(item, {
          opacity: 0,
          scrollTrigger: {
            trigger: item,
            start: "center 40%",
            end: "bottom 10%",
            scrub: true,
            // markers: true,
          },
        });
      });

    return () => {
      // Custom cleanup code (biasanya GSAP menanganinya secara otomatis)
    };
  });
}

function initFunction() {
  servicesAnim();
}

document.addEventListener("DOMContentLoaded", initFunction);
