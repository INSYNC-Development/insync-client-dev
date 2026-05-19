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
  timelineAnimation();
}

document.addEventListener("DOMContentLoaded", initAnimation);
