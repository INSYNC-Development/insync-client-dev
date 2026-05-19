// Rive Set up Start
function loadRiveFile(src, onSuccess, onError) {
  const file = new rive.RiveFile({
    src: src,
    onLoad: () => onSuccess(file),
    onLoadError: onError,
  });
  // Remember to call init() to trigger the load;
  file.init().catch(onError);
}

const riveInstances = [];

function setupRiveInstance(loadedRiveFile, canvasId, artboard, stateMachine) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const riveInstance = new rive.Rive({
    riveFile: loadedRiveFile,
    // If you have multiple canvases,  either use @rive-app/canvas
    // or set useOffscreenRenderer to true.
    useOffscreenRenderer: true,
    stateMachines: stateMachine,
    canvas: canvas,
    artboard: artboard,
    layout: new rive.Layout({
      fit: rive.Fit.Contain,
    }),
    autoplay: false,
    onLoad: () => {
      riveInstance.resizeDrawingSurfaceToCanvas();
      if (stateMachine) {
        try {
          const inputs = riveInstance.stateMachineInputs(stateMachine);
          const playTrigger = inputs && inputs.find((i) => i.name === "play");
          if (playTrigger && typeof playTrigger.fire === "function") {
            playTrigger.fire();
          }
        } catch (e) {
          console.error("Rive state machine input error:", e);
        }
      }
    },
  });

  riveInstances.push(riveInstance);

  const handlePlay = () => {
    riveInstance.play();
  };

  const handlePause = () => {
    riveInstance.pause();
  };

  ScrollTrigger.create({
    trigger: canvas,
    start: "top bottom",
    end: "bottom top",
    onEnter: handlePlay,
    onLeave: handlePause,
    onEnterBack: handlePlay,
    onLeaveBack: handlePause,
  });
}

// // Example Usage:
// loadRiveFile(
// 	"rive's_animated_emojis.riv",
// 	(file) => {
// 		setupRiveInstance(file, "rive-canvas-1", "Mindblown", "controller");
// 		setupRiveInstance(file, "rive-canvas-2", "Bullseye", "controller");
// 		setupRiveInstance(file, "rive-canvas-3", "love", "controller");
// 		setupRiveInstance(file, "rive-canvas-4", "joy", "controller");
// 		setupRiveInstance(file, "rive-canvas-5", "Tada", "controller");
// 		setupRiveInstance(file, "rive-canvas-6", "Onfire", "controller");
// 	},
// 	(error) => {
// 		console.error("Failed to load Rive file:", error);
// 	}
// );

window.addEventListener(
  "resize",
  () => {
    riveInstances.forEach((instance) => {
      if (instance) {
        instance.resizeDrawingSurfaceToCanvas();
      }
    });
  },
  false
);
// Rive Set up End

// Rive Code Home Start
function initVisualScroll() {
  const section = document.querySelector(".values_wrap");
  const riveSrc = document.querySelector("#homeSrcRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  loadRiveFile(
    riveUrl,
    (file) => {
      setupRiveVisualScroll(
        file,
        "visual_scroll",
        "visual_scroll_new",
        "State Machine 1"
      );
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

function setupRiveVisualScroll(
  loadedRiveFile,
  canvasId,
  artboard,
  stateMachine
) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const riveInstance = new rive.Rive({
    riveFile: loadedRiveFile,
    useOffscreenRenderer: true,
    stateMachines: stateMachine,
    canvas: canvas,
    artboard: artboard,
    layout: new rive.Layout({
      fit: rive.Fit.Contain,
    }),
    autoplay: true,
    autoBind: true, // enable auto binding
    onLoad: () => {
      riveInstance.resizeDrawingSurfaceToCanvas();
      const section = document.querySelector(".values_wrap");
      const items = section.querySelectorAll(".values_item");

      if (stateMachine) {
        try {
          const triggers = ["step_01", "step_02", "step_03"];
          const inputs = riveInstance.stateMachineInputs(stateMachine);
          let currentRiveIndex = -1;

          function fireRive(idx) {
            const trigger = inputs.find((j) => j.name === triggers[idx]);
            if (trigger) {
              trigger.fire();
              trigger.fire();
            }
          }
          items.forEach((item, index) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: item,
                start: "top 70%",
                end: "bottom 50%",
                onEnter: () => {
                  fireRive(index);
                },
                onEnterBack: () => {
                  fireRive(index);
                },
              },
            });
          });
        } catch (e) {
          console.error("Rive state machine input error:", e);
        }
      }
    },
  });
}

function initVisualScrollMobile() {
  const section = document.querySelector(".values_wrap");
  const riveSrc = document.querySelector("#homeSrcRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  const artboard = "visual_scroll_new";
  const sm = "State Machine 1";

  const canvasItems = [
    {
      canvasId: "#visual_scroll_1",
      trigger: "step_01",
    },
    {
      canvasId: "#visual_scroll_2",
      trigger: "step_02",
    },
    {
      canvasId: "#visual_scroll_3",
      trigger: "step_03",
    },
  ];

  const mm = gsap.matchMedia();

  mm.add("(max-width: 767px)", () => {
    canvasItems.forEach((item, index) => {
      const riveInstance = new rive.Rive({
        src: riveUrl,
        useOffscreenRenderer: true,
        stateMachines: sm,
        canvas: document.querySelector(item.canvasId),
        artboard: artboard,
        isTouchScrollEnabled: true,
        layout: new rive.Layout({
          fit: rive.Fit.Contain,
        }),
        autoplay: true,
        onLoad: () => {
          riveInstance.resizeDrawingSurfaceToCanvas();
          const inputs = riveInstance.stateMachineInputs(sm);
          const triggerInput = inputs.find((i) => i.name === item.trigger);

          ScrollTrigger.create({
            trigger: item.canvasId,
            start: "top bottom",
            onEnter: () => {
              if (triggerInput && typeof triggerInput.fire === "function") {
                triggerInput.fire();
              }
            },
          });
        },
      });
    });
  });
}
// Rive Code Home End

function initTestimonialSlider() {
  const component = document.querySelector(".testimonial_slider_component");
  if (!component) return;

  const swiperEl = component.querySelector(".swiper.is-testimonial");
  const prevBtn = component.querySelector("[data-nav-btn='prev']");
  const nextBtn = component.querySelector("[data-nav-btn='next']");
  if (!swiperEl) return;

  const swiper = new Swiper(swiperEl, {
    slidesPerView: 1,
    loop: true,
    grabCursor: true,
    speed: 800,
    keyboard: { enabled: true, pageUpDown: false },
    mousewheel: { enabled: true, forceToAxis: true, thresholdDelta: 25 },
    navigation: {
      prevEl: prevBtn,
      nextEl: nextBtn,
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Rive Codes
  initVisualScroll();
  setupRiveVisualScroll();
  initVisualScrollMobile();
  //   Rive Codes End

  initTestimonialSlider();
});
