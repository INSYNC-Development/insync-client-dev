document.addEventListener("DOMContentLoaded", () => {
  const btnWraps = document.querySelectorAll("[data-huly-btn]");
  if (!btnWraps.length) return;

  btnWraps.forEach((btnWrap) => {
    const cta = btnWrap.querySelector(".button_cta");
    const gradient = btnWrap.querySelector("[data-gradient]");
    const outerGlows = btnWrap.querySelectorAll("[data-outer-glow]");

    const CENTER_DEAD_ZONE = 0.25;
    const REST_ANGLE = 90;
    const REST_OPACITY = 1;

    let isInitialized = false; // ← flag

    // ── Helpers ──
    function getCtaRect() {
      return cta.getBoundingClientRect();
    }

    function getGradientWidth() {
      return gradient.getBoundingClientRect().width;
    }

    function getRestX() {
      const ctaWidth = getCtaRect().width;
      const gradWidth = getGradientWidth();
      return ctaWidth * 0.85 - gradWidth / 2;
    }

    // ── Init: dipanggil lazy, hanya sekali saat button visible ──
    function init() {
      if (isInitialized) return;

      // Pastikan dimensi sudah valid (dialog sudah visible)
      if (getCtaRect().width === 0) return;

      gsap.set(gradient, { x: getRestX() });

      outerGlows.forEach((el) => {
        gsap.set(el, {
          "--glow-angle": `${REST_ANGLE}deg`,
          opacity: REST_OPACITY,
        });
      });

      isInitialized = true;
    }

    // ── Outer glow ──
    function getGlowParams(normalizedX) {
      const distFromCenter = Math.abs(normalizedX - 0.5) * 2;
      const opacity =
        distFromCenter <= CENTER_DEAD_ZONE
          ? 0
          : gsap.utils.mapRange(CENTER_DEAD_ZONE, 1, 0, 1, distFromCenter);
      const angle = gsap.utils.interpolate(270, 90, normalizedX);
      return { angle, opacity };
    }

    function updateOuterGlow(normalizedX) {
      const { angle, opacity } = getGlowParams(normalizedX);
      outerGlows.forEach((el) => {
        gsap.to(el, {
          "--glow-angle": `${angle}deg`,
          opacity,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    }

    function resetOuterGlow() {
      outerGlows.forEach((el) => {
        gsap.to(el, {
          "--glow-angle": `${REST_ANGLE}deg`,
          opacity: REST_OPACITY,
          delay: 0.3,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    }

    // ── Gradient ──
    function moveGradient(e) {
      const rect = getCtaRect();
      const gradWidth = getGradientWidth();
      const mouseX = e.clientX - rect.left;
      const targetX = mouseX - gradWidth / 2;

      gsap.to(gradient, {
        x: targetX,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    function resetGradient() {
      gsap.to(gradient, {
        x: getRestX(),
        duration: 0.9,
        delay: 0.3,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // ── Events ──
    cta.addEventListener("mouseenter", (e) => {
      init(); // ← lazy init di sini

      const rect = getCtaRect();
      const mouseX = e.clientX - rect.left;
      const gradWidth = getGradientWidth();

      // Snap langsung ke cursor saat pertama masuk
      gsap.set(gradient, { x: mouseX - gradWidth / 2 });

      const normalizedX = gsap.utils.clamp(0, 1, mouseX / rect.width);
      updateOuterGlow(normalizedX);
    });

    cta.addEventListener("mousemove", (e) => {
      const rect = getCtaRect();
      const normalizedX = gsap.utils.clamp(
        0,
        1,
        (e.clientX - rect.left) / rect.width
      );
      moveGradient(e);
      updateOuterGlow(normalizedX);
    });

    cta.addEventListener("mouseleave", () => {
      resetGradient();
      resetOuterGlow();
    });
  });
});
