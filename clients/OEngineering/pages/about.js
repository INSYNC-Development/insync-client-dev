const scrubWordAnim = () => {
  const texts = gsap.utils.toArray("[data-text-animation='scrub-word']");
  if (texts.length === 0) return;
  const getCSSVariable = (variableName, fallback = "#000") => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(
        variableName
      ) || fallback
    );
  };

  const BRAND_COLOR = getCSSVariable("--swatch--brand-500", "#289cee");
  const SECONDARY_COLOR = getCSSVariable(
    "--swatch--secondary-brand",
    "#002678"
  );
  //   const TEXT_COLOR = getCSSVariable("--_theme---text", "#E7E7E7");
  const TEXT_COLOR = "#E7E7E7";
  const FADED_COLOR = "rgba(231, 231, 231, 0.50)";

  texts.forEach((text) => {
    let split = new SplitText(text, {
      type: "words, chars",
      wordsClass: "word",
      charsClass: "char",
    });

    gsap.set(text, {
      color:
        typeof FADED_COLOR !== "undefined"
          ? FADED_COLOR
          : "rgba(231, 231, 231, 0.50)",
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: text,
          start: "top 80%",
          end: "bottom 50%",
          scrub: true,
        },
        defaults: {
          ease: "power3",
        },
      })
      .from(split.words, {
        delay: 0.2,
        duration: 0.8,
        stagger: { each: 0.1 },
      })
      .to(
        split.chars,
        {
          keyframes: [
            {
              color:
                typeof FADED_COLOR !== "undefined"
                  ? FADED_COLOR
                  : "rgba(26, 35, 43, 0.40)",
              duration: 0.2,
            },
            {
              color:
                typeof BRAND_COLOR !== "undefined" ? BRAND_COLOR : "#289cee",
              duration: 0.2,
            },
            {
              color:
                typeof SECONDARY_COLOR !== "undefined"
                  ? SECONDARY_COLOR
                  : "#fc6c26",
              duration: 0.2,
            },
            {
              color: typeof TEXT_COLOR !== "undefined" ? TEXT_COLOR : "#e7e7e7",
              duration: 0.4,
            },
          ],
          duration: 0.8,
          stagger: { each: 0.01 },
        },
        "<"
      );
  });

  // gsap.set("[data-prevent-flicker='true']", {
  //   visibility: "visible",
  // });
};

function initFunction() {
  document.fonts.ready.then(() => {
    scrubWordAnim();
  });
}

document.addEventListener("DOMContentLoaded", initFunction);
