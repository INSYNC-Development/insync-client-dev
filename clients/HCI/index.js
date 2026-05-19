const preloadImages = () => {
  return new Promise((resolve, reject) => {
    imagesLoaded(document.querySelectorAll("img"), resolve);
  });
};

function buttonLinkHoverAnim() {
  const buttons = gsap.utils.toArray("[data-button='wrap']");

  if (!buttons.length) return null;

  const context = gsap.context(() => {
    buttons.forEach((button) => {
      const textEl = button.querySelector("[data-button='text']");
      if (!textEl) return;

      const textElSplit = SplitText.create(textEl, {
        type: "lines, words, chars",
        linesClass: "lines",
        charsClass: "char",
      });

      textElSplit.chars.forEach((char) => {
        char.setAttribute("data-char", char.innerText);
      });

      gsap.set(textElSplit.chars, { yPercent: 0 });

      const tl = gsap.timeline({
        paused: true,
        defaults: {
          duration: 0.5,
          ease: "power3.inOut",
        },
      });

      tl.to(textElSplit.chars, {
        yPercent: -100,
        stagger: 0.025,
        force3D: true,
      });

      let isHovered = false;

      const handleMouseEnter = () => {
        if (!isHovered) {
          isHovered = true;
          tl.play();
        }
      };

      const handleMouseLeave = () => {
        if (isHovered) {
          isHovered = false;
          tl.reverse();
        }
      };

      button.addEventListener("mouseenter", handleMouseEnter, {
        passive: true,
      });
      button.addEventListener("mouseleave", handleMouseLeave, {
        passive: true,
      });

      button._cleanup = () => {
        button.removeEventListener("mouseenter", handleMouseEnter);
        button.removeEventListener("mouseleave", handleMouseLeave);
        textElSplit.revert();
        tl.kill();
      };
    });
  }, buttons);

  context.cleanup = () => {
    buttons.forEach((button) => {
      if (button._cleanup) button._cleanup();
    });
    context.revert();
  };

  return context;
}

function scrambleAnimation() {
  const items = gsap.utils.toArray('[data-text-animation="scramble"]');

  if (!items.length) return;

  const ctx = gsap.context(() => {
    items.forEach((item) => {
      const split = new SplitText(item, { type: "chars" });

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          split.revert();
        },
      });

      tl.from(split.chars, {
        duration: 0.6,
        autoAlpha: 0,
        scrambleText: {
          text: "{original}",
          chars: "XERSHKZN",
          speed: 1,
          tweenLength: false,
        },
        stagger: {
          amount: 0.4,
          from: "random",
        },
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top 95%",
        once: true,
        onEnter: () => tl.play(),
      });
    });
  });

  return ctx;
}

function headingRevealAnim() {
  document
    .querySelectorAll("[data-text-animation='heading']")
    .forEach((text) => {
      const split = SplitText.create(text, {
        // type: "words, chars",
        type: "lines",
        mask: "lines",
        linesClass: "word",
        // charsClass: "char",
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: text,
          start: "top 95%",
          end: "top 80%",
          toggleActions: "none play none none",
        },
      });

      tl.from(split.lines, {
        yPercent: 120,
        // delay: 0.5,
        duration: 0.6,
        filter: "blur(5px)",
        stagger: { amount: 0.15 },
      });
    });
}

document.addEventListener("DOMContentLoaded", function () {
  document.fonts.ready.then(() => {
    buttonLinkHoverAnim();
    headingRevealAnim();
    scrambleAnimation();
  });
});
