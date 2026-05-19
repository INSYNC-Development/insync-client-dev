// function heroSequence(container) {
//   const wrapper = container.querySelector(".scroll-wrap");
//   const bg = container.querySelector(".scroll_bg");
//   const canvas = container.querySelector("[data-hero='sequence-canvas']");

//   if (!wrapper || !bg || !canvas) return;

//   const ctx = canvas.getContext("2d");

//   const config = {
//     baseUrl:
//       "https://scroll-sequence-prod.s3.eu-central-1.amazonaws.com/00000/inventry-v3/",
//     frameCount: 211,
//     padding: 5,
//     suffix: "",
//     extension: ".jpg",
//     prefix: "frame",
//   };

//   // First frame: https://scroll-sequence-prod.s3.eu-central-1.amazonaws.com/00000/inventry-v3/frame00001.jpg

//   const images = [];
//   const playhead = { frame: 0 };

//   const getImageUrl = (index) => {
//     const paddedIndex = (index + 1).toString().padStart(config.padding, "0");
//     return `${config.baseUrl}${config.prefix}${paddedIndex}${config.suffix}${config.extension}`;
//   };

//   const preloadImages = () => {
//     const promises = [];
//     for (let i = 0; i < config.frameCount; i++) {
//       const img = new Image();
//       const promise = new Promise((resolve) => {
//         img.onload = resolve;
//         img.onerror = resolve;
//       });
//       img.src = getImageUrl(i);
//       images.push(img);
//       promises.push(promise);
//     }
//     return Promise.all(promises);
//   };

//   function render() {
//     const img = images[playhead.frame];
//     if (!img || !img.complete) return;

//     ctx.imageSmoothingEnabled = true;
//     ctx.imageSmoothingQuality = "high";

//     const imgRatio = img.width / img.height;
//     const canvasRatio = canvas.width / canvas.height;

//     let renderWidth, renderHeight;

//     if (canvasRatio > imgRatio) {
//       renderWidth = canvas.width;
//       renderHeight = canvas.width / imgRatio;
//     } else {
//       renderHeight = canvas.height;
//       renderWidth = canvas.height * imgRatio;
//     }

//     // Centering logic
//     const x = (canvas.width - renderWidth) * 0.5;
//     const y = (canvas.height - renderHeight) * 0.5;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(img, x, y, renderWidth, renderHeight);
//   }

//   function resizeCanvas() {
//     const dpr = window.devicePixelRatio || 1;
//     const rect = canvas.getBoundingClientRect();

//     canvas.width = rect.width * dpr;
//     canvas.height = rect.height * dpr;

//     ctx.scale(dpr, dpr);

//     canvas.width = rect.width;
//     canvas.height = rect.height;

//     render();
//   }

//   preloadImages().then(() => {
//     window.addEventListener("resize", resizeCanvas);
//     resizeCanvas();

//     gsap.to(playhead, {
//       frame: config.frameCount - 1,
//       snap: "frame",
//       ease: "none",
//       scrollTrigger: {
//         trigger: wrapper,
//         start: "top top",
//         end: "bottom bottom",
//         scrub: 0.5,
//       },
//       onUpdate: render,
//     });
//   });
// }
