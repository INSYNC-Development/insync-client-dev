function waswirInteraction() {
  const triggers = document.querySelectorAll(".clearing_main_text_wrap");
  const visuals = document.querySelectorAll(".clearing_main_visual_item");

  let activeIndex = 0;
  let isAnimating = false;

  visuals.forEach((visual, index) => {
    if (index !== 0) {
      gsap.set(visual, { autoAlpha: 0, display: "none" });
    }
  });

  gsap.set(triggers, {
    backgroundSize: "0% 100%",
    backgroundRepeat: "no-repeat",
  });

  gsap.set(triggers[0], { backgroundSize: "100% 100%", color: "#fff" });

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => {
      if (index === activeIndex || isAnimating) return;
      isAnimating = true;

      const outgoingTrigger = triggers[activeIndex];
      const incomingTrigger = trigger;
      const outgoingVisual = visuals[activeIndex];
      const incomingVisual = visuals[index];

      const tl = gsap.timeline({
        onComplete: () => {
          activeIndex = index;
          isAnimating = false;
        },
      });

      tl.to(
        outgoingTrigger,
        {
          backgroundSize: "0% 100%",
          color: "",
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            outgoingTrigger.classList.remove("is-active");
          },
        },
        0
      );

      tl.to(
        outgoingVisual,
        {
          autoAlpha: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(outgoingVisual, { display: "none" });
          },
        },
        0
      );

      tl.call(() => {
        incomingTrigger.classList.add("is-active");
        gsap.set(incomingVisual, { display: "block" });
      });

      tl.fromTo(
        incomingTrigger,
        { backgroundSize: "0% 100%", color: "" },
        {
          backgroundSize: "100% 100%",
          color: "#fff",
          duration: 0.5,
          ease: "power2.out",
        }
      );

      tl.fromTo(
        incomingVisual,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "<0.1"
      );
    });
  });
}

// function reveiwInteraction() {
//   const thumbs = document.querySelectorAll(".reviews_thumbnail_item");
//   const visuals = document.querySelectorAll(".reviews_content_visual_list");
//   const heads = document.querySelectorAll(".reviews_content_head");
//   const texts = document.querySelectorAll(".reviews_item_text");
//   const nextBtn = document.querySelectorAll(".reviews_btn_nav")[1];
//   const prevBtn = document.querySelectorAll(".reviews_btn_nav")[0];

//   let activeIndex = 0;
//   let isAnimating = false;
//   const totalItems = thumbs.length;

//   const splits = [];

//   texts.forEach((text) => {
//     const split = new SplitText(text, { type: "lines" });
//     splits.push(split);
//   });

//   function setInitialState() {
//     gsap.set([heads, texts], { autoAlpha: 0 });

//     // Set initial clip-paths for all (Hidden state)
//     // Visual: Hidden Right | Thumb: Hidden Bottom (Top-to-bottom reveal)
//     gsap.set(visuals, { autoAlpha: 0, clipPath: "inset(0% 0% 0% 100%)" });

//     const allThumbBgs = document.querySelectorAll(".reviews_thumbnail_bg_wrap");
//     gsap.set(allThumbBgs, { clipPath: "inset(0% 0% 100% 0%)" });

//     // Reveal Active Item
//     gsap.set(visuals[0], { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
//     gsap.set(heads[0], { autoAlpha: 1 });
//     gsap.set(texts[0], { autoAlpha: 1 });

//     const firstThumbBg = thumbs[0].querySelector(".reviews_thumbnail_bg_wrap");
//     const firstThumbText = thumbs[0].querySelectorAll("h3, p");

//     gsap.set(firstThumbBg, { clipPath: "inset(0% 0% 0% 0%)" });
//     gsap.set(firstThumbText, { color: "#ffffff" });
//   }

//   setInitialState();

//   function changeSlide(index) {
//     if (index === activeIndex || isAnimating) return;
//     isAnimating = true;

//     const prevIndex = activeIndex;
//     activeIndex = index;

//     const outTl = gsap.timeline();

//     // Out: Fade content
//     outTl
//       .to(visuals[prevIndex], { autoAlpha: 0, duration: 0.4 })
//       .to(heads[prevIndex], { autoAlpha: 0, duration: 0.3 }, "<")
//       .to(texts[prevIndex], { autoAlpha: 0, duration: 0.3 }, "<");

//     // Out: Thumb Mask (Collapse back to top)
//     const prevThumbBg = thumbs[prevIndex].querySelector(
//       ".reviews_thumbnail_bg_wrap"
//     );
//     const prevThumbText = thumbs[prevIndex].querySelectorAll("h3, p");

//     gsap.to(prevThumbBg, {
//       clipPath: "inset(100% 0% 0% 0%)",
//       duration: 0.5,
//       ease: "power3.inOut",
//     });
//     gsap.to(prevThumbText, { color: "", duration: 0.4 });

//     outTl.add(() => {
//       const inTl = gsap.timeline({
//         onComplete: () => {
//           isAnimating = false;
//         },
//       });

//       // In: Visual Wipe (Right to Left)
//       inTl.fromTo(
//         visuals[activeIndex],
//         { autoAlpha: 1, clipPath: "inset(0% 0% 0% 100%)" },
//         { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power3.inOut" }
//       );

//       // In: Thumb Wipe (Top to Bottom)
//       const nextThumbBg = thumbs[activeIndex].querySelector(
//         ".reviews_thumbnail_bg_wrap"
//       );
//       const nextThumbText = thumbs[activeIndex].querySelectorAll("h3, p");

//       inTl.fromTo(
//         nextThumbBg,
//         { clipPath: "inset(0% 0% 100% 0%)" },
//         { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.inOut" },
//         "<"
//       );
//       inTl.to(nextThumbText, { color: "#ffffff", duration: 0.4 }, "<");

//       // In: Stars
//       const stars = heads[activeIndex].querySelectorAll(".reviews_item_star");
//       inTl.set(heads[activeIndex], { autoAlpha: 1 }, "<+=0.2");
//       inTl.fromTo(
//         stars,
//         { y: 20, opacity: 0 },
//         {
//           y: 0,
//           opacity: 1,
//           duration: 0.5,
//           stagger: 0.08,
//           ease: "back.out(1.7)",
//         },
//         "<"
//       );

//       // In: Text
//       const currentSplit = splits[activeIndex];
//       inTl.set(texts[activeIndex], { autoAlpha: 1 }, "<");
//       inTl.fromTo(
//         currentSplit.lines,
//         { y: 20, opacity: 0 },
//         { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
//         "-=0.4"
//       );
//     });
//   }

//   thumbs.forEach((thumb, i) => {
//     thumb.addEventListener("click", () => changeSlide(i));
//   });

//   if (nextBtn) {
//     nextBtn.addEventListener("click", () => {
//       let nextIndex = activeIndex + 1;
//       if (nextIndex >= totalItems) nextIndex = 0;
//       changeSlide(nextIndex);
//     });
//   }

//   if (prevBtn) {
//     prevBtn.addEventListener("click", () => {
//       let prevIndex = activeIndex - 1;
//       if (prevIndex < 0) prevIndex = totalItems - 1;
//       changeSlide(prevIndex);
//     });
//   }
// }

function reviewInteraction() {
  const thumbs = document.querySelectorAll(".reviews_thumbnail_item");
  const visuals = document.querySelectorAll(".reviews_content_visual_list");
  const heads = document.querySelectorAll(".reviews_content_head");
  const texts = document.querySelectorAll(".reviews_item_text");
  const nextBtn = document.querySelectorAll(".reviews_btn_nav")[1];
  const prevBtn = document.querySelectorAll(".reviews_btn_nav")[0];

  const tablet = window.innerWidth <= 1024;

  // console.log(heads[1].querySelectorAll(".reviews_item_star"));

  const slides = Array.from(thumbs).map((thumb, i) => ({
    thumb: {
      bg: tablet ? thumb : thumb.querySelector(".reviews_thumbnail_bg_wrap"),
      text: thumb.querySelectorAll("h3, p"),
      visual: thumb.querySelectorAll(".reviews_thumbnail_visual_item"),
    },
    visual: visuals[i],
    head: heads[i],
    text: texts[i],
    split: new SplitText(texts[i], { type: "lines" }),
    stars: heads[i].querySelectorAll(".reviews_item_star"),
  }));

  let activeIndex = 0;
  let isAnimating = false;
  const totalItems = thumbs.length;

  function setInitialState() {
    gsap.set([heads, texts], { autoAlpha: 0 });
    gsap.set(visuals, { autoAlpha: 0, clipPath: "inset(0% 0% 0% 100%)" });

    slides.forEach((slide) => {
      gsap.set(slide.thumb.bg, { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(slide.thumb.text, { color: "" });

      gsap.set(slide.thumb.visual, { height: 0, autoAlpha: 1 });
    });

    const first = slides[0];
    gsap.set(first.visual, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set([first.head, first.text], { autoAlpha: 1 });
    gsap.set(first.thumb.bg, { clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(first.thumb.text, { color: "#ffffff" });

    gsap.set(first.thumb.visual, { height: "auto", autoAlpha: 1 });
  }

  function animateSlideOut(index) {
    const slide = slides[index];
    const tl = gsap.timeline();

    tl.to(slide.visual, { autoAlpha: 0, duration: 0.4 })
      .to([slide.head, slide.text], { autoAlpha: 0, duration: 0.3 }, "<")
      .to(
        slide.thumb.bg,
        {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 0.5,
          ease: "power3.inOut",
        },
        "<"
      )
      .to(slide.thumb.text, { color: "", duration: 0.4 }, "<")
      .to(slide.thumb.visual, { height: 0, autoAlpha: 0 }, "<");

    return tl;
  }

  function animateSlideIn(index) {
    const slide = slides[index];
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    tl.fromTo(
      slide.visual,
      { autoAlpha: 1, clipPath: "inset(0% 0% 0% 100%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7 }
    );

    tl.fromTo(
      slide.thumb.bg,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5 },
      "<"
    );

    tl.to(slide.thumb.text, { color: "#ffffff", duration: 0.4 }, "<").to(
      slide.thumb.visual,
      { height: "auto", autoAlpha: 1 },
      "<"
    );

    // 2. Text & Star Content
    tl.set(slide.head, { autoAlpha: 1 }, "<+=0.2");
    tl.fromTo(
      slide.stars,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "back.out(1.7)" },
      "<"
    );

    tl.set(slide.text, { autoAlpha: 1 }, "<");
    tl.fromTo(
      slide.split.lines,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    );

    return tl;
  }

  function changeSlide(nextIndex) {
    if (nextIndex === activeIndex || isAnimating) return;
    isAnimating = true;

    const masterTl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
      },
    });

    masterTl
      .add(animateSlideOut(activeIndex))
      .add(animateSlideIn(nextIndex), "-=0.2");

    activeIndex = nextIndex;
  }

  setInitialState();

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener("click", () => changeSlide(i));
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const nextIndex = (activeIndex + 1) % totalItems;
      changeSlide(nextIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const prevIndex = (activeIndex - 1 + totalItems) % totalItems;
      changeSlide(prevIndex);
    });
  }
}

function timelineAnimation() {
  const items = document.querySelectorAll(".timeline_content_item");
  const dots = document.querySelectorAll(".timeline_content_line_dot");

  if (!items || !dots) return;

  items.forEach((item, index) => {
    gsap.set(item, { opacity: 0.5 });

    gsap.to(item, {
      opacity: 1,
      scale: 1,
      scrollTrigger: {
        trigger: dots[index],
        start: "top 60%",
        end: "bottom 40%",
        scrub: true,
        // markers: true,
      },
    });
  });
}

function initAnimation() {
  waswirInteraction();
  reviewInteraction();
  timelineAnimation();
}

document.addEventListener("DOMContentLoaded", initAnimation);
