// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimationFade(next) {
  const tl = gsap.timeline();

  tl.call(
    () => {
      resetPage(next);
    },
    null,
    0
  );

  return tl;
}

function runPageLeaveAnimationFade(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(
    current,
    {
      autoAlpha: 0,
      ease: "power1.in",
      duration: 0.5,
    },
    0
  );

  return tl;
}

function runPageEnterAnimationFade(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.fromTo(
    next,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
      ease: "power1.inOut",
      duration: 0.75,
    },
    "startEnter"
  );

  tl.fromTo(
    next.querySelector("h1"),
    {
      yPercent: 25,
      autoAlpha: 0,
    },
    {
      yPercent: 0,
      autoAlpha: 1,
      ease: "expo.out",
      duration: 1,
    },
    "< 0.3"
  );

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}
