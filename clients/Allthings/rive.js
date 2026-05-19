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

// Rive Home Start

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

// Rive Home End

// Product Rive Start
function initProductHeroVisual() {
  const section = document.querySelector(".solutions_hero_wrap");
  const riveSrc = document.querySelector("#productRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  loadRiveFile(
    riveUrl,
    (file) => {
      setupRiveInstance(
        file,
        "productHero",
        "products_visual_hero",
        "State Machine 1"
      );
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

function initProductThumbnailVisual() {
  const section = document.querySelector(".solutions_items_wrap");
  const riveSrc = document.querySelector("#productRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  const itemJsons = [
    {
      canvasId: "impulse",
      artboard: "products_07",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "build",
      artboard: "products_06",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "portale",
      artboard: "products_05",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "dossier",
      artboard: "products_04",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "echo",
      artboard: "products_03",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "community",
      artboard: "products_02",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "task",
      artboard: "products_01",
      stateMachine: "State Machine 1",
    },
  ];

  loadRiveFile(
    riveUrl,
    (file) => {
      itemJsons.forEach(({ canvasId, artboard, stateMachine }) => {
        setupRiveInstance(file, canvasId, artboard, stateMachine);
      });
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

function initProductHeroItem() {
  const section = document.querySelector(".solutions_hero_wrap");
  const riveSrc = document.querySelector("#productRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  const itemJsons = [
    {
      canvasId: "impulse",
      artboard: "products_07",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "build",
      artboard: "products_06",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "portale",
      artboard: "products_05",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "dossier",
      artboard: "products_04",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "echo",
      artboard: "products_03",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "community",
      artboard: "products_02",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "task",
      artboard: "products_01",
      stateMachine: "State Machine 1",
    },
  ];

  loadRiveFile(
    riveUrl,
    (file) => {
      itemJsons.forEach(({ canvasId, artboard, stateMachine }) => {
        setupRiveInstance(file, canvasId, artboard, stateMachine);
      });
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}
// Product Rive End

// Solutions Rive Start
function solutionsHeroVisual() {
  const section = document.querySelector(".solutions_hero_wrap");
  const riveSrc = document.querySelector("#solutionsRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  if (!section) return;

  loadRiveFile(
    riveUrl,
    (file) => {
      setupRiveInstance(
        file,
        "solutionsHero",
        "solutions_visual_hero",
        "State Machine 1"
      );
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

function initSolutionsThumbnailVisual() {
  const section = document.querySelector(".solutions_items_wrap");
  if (!section) return;
  const riveSrc = document.querySelector("#solutionsRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  const itemJsons = [
    {
      canvasId: "transparente",
      artboard: "solutions_04",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "wertvolle",
      artboard: "solutions_03",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "communities",
      artboard: "solutions_02",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "efficient",
      artboard: "solutions_01",
      stateMachine: "State Machine 1",
    },
  ];

  loadRiveFile(
    riveUrl,
    (file) => {
      itemJsons.forEach(({ canvasId, artboard, stateMachine }) => {
        setupRiveInstance(file, canvasId, artboard, stateMachine);
      });
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

function initSolutionHeroItem() {
  const section = document.querySelector(".solutions_hero_wrap");

  if (!section) return;

  const riveSrc = document.querySelector("#solutionsRive");
  const riveUrl = riveSrc?.dataset?.riveUrl;

  const itemJsons = [
    {
      canvasId: "transparente",
      artboard: "solutions_04",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "wertvolle",
      artboard: "solutions_03",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "communities",
      artboard: "solutions_02",
      stateMachine: "State Machine 1",
    },
    {
      canvasId: "efficient",
      artboard: "solutions_01",
      stateMachine: "State Machine 1",
    },
  ];

  loadRiveFile(
    riveUrl,
    (file) => {
      itemJsons.forEach(({ canvasId, artboard, stateMachine }) => {
        setupRiveInstance(file, canvasId, artboard, stateMachine);
      });
    },
    (error) => {
      console.error("Failed to load Rive file:", error);
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // Home
  initVisualScroll();
  setupRiveVisualScroll();
  initVisualScrollMobile();

  // Product
  initProductHeroVisual();
  initProductThumbnailVisual();
  initProductHeroItem();

  //   Solutions
  solutionsHeroVisual();
  initSolutionsThumbnailVisual();
  initSolutionHeroItem();
});
