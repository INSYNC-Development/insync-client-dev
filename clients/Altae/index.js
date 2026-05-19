const heroAnim = () => {
  const wrap = document.querySelector(".main_hero_wrap");
  const tag = wrap.querySelector(".tag_wrap");
  const heading = wrap.querySelector(".main_hero_heading");
  const subheading = wrap.querySelector(".main_hero_subheading");
  const nav = document.querySelector(".navbar_component");
  const cursor = document.querySelector(".cursor_wrap");

  let split1 = SplitText.create(heading, {
    type: "words, lines",
    mask: "lines",
  });

  console.log("split1", split1);

  let split2 = SplitText.create(subheading, {
    type: "lines",
    mask: "lines",
  });

  const tl = gsap.timeline({
    ease: "power2.inOut",
    duration: 1,
  });

  tl.from(tag, {
    autoAlpha: 0,
    yPercent: 100,
  })
    .from(
      split1.words,
      {
        opacity: 0,
        yPercent: 100,
        stagger: 0.1,
      },
      "<+=20%"
    )
    .from(
      split2.lines,
      {
        opacity: 0,
        yPercent: 100,
        stagger: 0.1,
      },
      "<+=90%"
    )
    .from([nav, cursor], {
      opacity: 0,
    });
};

document.addEventListener("DOMContentLoaded", () => {
  heroAnim();
});
