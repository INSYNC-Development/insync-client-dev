const descAnim = () => {
  const section = document.querySelector(".desc_wrap");
  const text = document.getElementById("desc-paragraph");

  let split = new SplitText(text, {
    type: "words, chars",
    wordsClass: "word",
    charsClass: "char",
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: text,
      start: "top bottom",
      end: "top 80%",
    },
    defaults: {
      ease: "power3",
    },
  });

  tl.fromTo(
    split.chars,
    {
      filter: "blur(2px)",
      color: "inherit",
    },
    {
      filter: "blur(0px)",
      color: "#FAFAFA",
      stagger: { amount: 1.5 },
    },
    "<"
  );
};

document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready(() => {
    descAnim();
  });
});
