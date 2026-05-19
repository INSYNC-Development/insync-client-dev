// function textAccentAnimation() {
//   const headingElements = document.querySelectorAll(".u-heading-accent strong");
//   if (headingElements.length === 0) return;

//   if (typeof opentype === "undefined") {
//     console.error("opentype.js belum ter-load.");
//     return;
//   }

//   headingElements.forEach((headingElement, i) => {
//     const textToConvert =
//       headingElement.textContent || headingElement.innerText || "";
//     const elementClass = headingElement.className || "";

//     opentype.load(
//       "https://cdn.prod.website-files.com/69dde06f3a74b094333ccd17/69ddf0845d3ee52bd9fefe41_Memper-aYa1m.ttf",
//       function (err, font) {
//         if (err) {
//           console.error("Gagal memuat font: ", err);
//           return;
//         }

//         const fontSize = 72;
//         const path = font.getPath(textToConvert, 0, 0, fontSize);
//         const bbox = path.getBoundingBox();

//         // Padding agar ujung lekukan font tidak terpotong bingkai
//         const pad = 20;
//         const x = bbox.x1 - pad;
//         const y = bbox.y1 - pad;
//         const w = Math.max(1, bbox.x2 - bbox.x1) + pad * 2;
//         const h = Math.max(1, bbox.y2 - bbox.y1) + pad * 2;

//         const viewBox = `${x} ${y} ${w} ${h}`;
//         const svgPathMarkup = path.toSVG();
//         const uid = `hw-${Date.now()}-${i}`;

//         // Kita gunakan CSS Animation di dalam SVG agar lebih smooth dan mudah dikontrol
//         const svgElement = `
//   <svg class="${elementClass} handwriting-svg" id="svg-${uid}"
//        xmlns="http://www.w3.org/2000/svg"
//        viewBox="${viewBox}"
//        preserveAspectRatio="xMinYMid meet"
//        style="display:inline-block;height:1em;width:auto;vertical-align:baseline;overflow:visible;">
//     <defs>
//       <mask id="mask-${uid}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
//         <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="black"></rect>

//         <rect class="reveal-brush" x="${
//           x - w
//         }" y="${y}" width="${w}" height="${h}" fill="white" />
//       </mask>

//       <style>
//         /* Animasi menggeser kotak putih sejauh lebar teks */
//         @keyframes sweepRight-${uid} {
//           to { transform: translateX(${w}px); }
//         }

//         #svg-${uid} .reveal-brush {
//           /* Berjalan selama 1.6 detik, melambat di akhir (ease-out) */
//           animation: sweepRight-${uid} 1.6s cubic-bezier(0.42, 0, 0.58, 1) forwards;
//         }
//       </style>
//     </defs>

//     <g mask="url(#mask-${uid})" fill="currentColor">
//       ${svgPathMarkup}
//     </g>
//   </svg>
//   `.trim();

//         // Ganti teks asli HTML dengan elemen SVG yang baru
//         headingElement.outerHTML = svgElement;
//       }
//     );
//   });
// }

// function navAnimation() {
//     const navGroups = document.querySelectorAll(".nav_links_component");

//     navGroups.forEach((group) => {
//       const navLinks = group.querySelectorAll(".nav_links_link");
//       const currentLink = group.querySelector(".nav_links_link.w--current");
//       const sign =
//         group.querySelector(".nav_links_sign") || document.createElement("div");

//       if (!sign.classList.contains("nav_links_sign")) {
//         sign.classList.add("nav_links_sign");
//       }

//       if (currentLink && !currentLink.contains(sign)) {
//         currentLink.prepend(sign);
//       }

//       const isDesktop = window.matchMedia("(min-width: 992px)");
//       let timeoutId;

//       navLinks.forEach((link) => {
//         link.addEventListener("mouseenter", function () {
//           if (!isDesktop.matches) return;

//           clearTimeout(timeoutId);
//           if (this.contains(sign)) return;

//           const state = Flip.getState(sign);
//           this.prepend(sign);

//           Flip.from(state, {
//             duration: 0.4,
//             ease: "power2.out",
//           });
//         });

//         link.addEventListener("mouseleave", function () {
//           if (!isDesktop.matches) return;

//           timeoutId = setTimeout(() => {
//             if (currentLink && !currentLink.contains(sign)) {
//               const state = Flip.getState(sign);
//               currentLink.prepend(sign);

//               Flip.from(state, {
//                 duration: 0.4,
//                 ease: "power2.out",
//               });
//             }
//           }, 500);
//         });
//       });

//       isDesktop.addEventListener("change", (e) => {
//         if (!e.matches && currentLink && !currentLink.contains(sign)) {
//           currentLink.prepend(sign);
//         }
//       });
//     });
//   }

// function navThemeOnScroll() {
//     const navComponent = document.querySelector(".nav_component");
//     const sections = document.querySelectorAll(
//       "section, .section, .footer_wrap, .hero_sticky_spacer, .spacer_wrap"
//     );

//     if (
//       !navComponent ||
//       sections.length === 0 ||
//       typeof ScrollTrigger === "undefined"
//     )
//       return;

//     sections.forEach((section) => {
//       const isDarkSection = section.classList.contains("u-theme-dark");

//       ScrollTrigger.create({
//         trigger: section,
//         start: "top 80px",
//         end: "bottom 80px",

//         onEnter: () => {
//           navComponent.setAttribute(
//             "data-theme",
//             isDarkSection ? "light" : "dark"
//           );
//         },
//         onEnterBack: () => {
//           navComponent.setAttribute(
//             "data-theme",
//             isDarkSection ? "light" : "dark"
//           );
//         },
//       });
//     });
//   }

// function stackCardAnimation() {
//   const items = document.querySelectorAll('[data-toc="item"]');
//   const tocLinks = document.querySelectorAll('[data-toc="link"]');
//   const isTabletOrMobile = window.innerWidth < 992;

//   if (items.length === 0 || tocLinks.length === 0) return;

//   const tocTriggers = {};

//   items.forEach((item, index) => {
//     const targetTocLink = tocLinks[index];
//     const itemId = item.id;

//     if (targetTocLink) {
//       const st = ScrollTrigger.create({
//         trigger: item,
//         start: "top 50%",
//         end: "bottom 50%",
//         toggleClass: {
//           targets: targetTocLink,
//           className: "is-active",
//         },
//       });

//       if (itemId) {
//         tocTriggers[itemId] = st;
//       }
//     }

//     if (!isTabletOrMobile) {
//       gsap.to(item, {
//         filter: "blur(50px)",
//         opacity: 0,
//         scale: 0.6,
//         scrollTrigger: {
//           trigger: item,
//           start: "top 7.5%",
//           end: "bottom top",
//           scrub: 1,
//         },
//       });
//     }
//   });

//   tocLinks.forEach((link) => {
//     link.addEventListener("click", (e) => {
//       e.preventDefault();

//       const targetId = link.getAttribute("data-toc");
//       const targetTrigger = tocTriggers[targetId];

//       if (targetTrigger) {
//         const centerPosition = (targetTrigger.start + targetTrigger.end) / 2;

//         gsap.to(window, {
//           duration: 1.2,
//           ease: "power2.inOut",
//           scrollTo: {
//             y: centerPosition,
//           },
//         });
//       } else {
//         console.warn(`ScrollTrigger tidak ditemukan untuk ID: ${targetId}`);
//       }
//     });
//   });
// }

// function navAnimation() {
//   const navGroups = document.querySelectorAll(".nav_links_component");

//   navGroups.forEach((group) => {
//     const navLinks = group.querySelectorAll(".nav_links_link");
//     const currentLink = group.querySelector(".nav_links_link.w--current");
//     const sign =
//       group.querySelector(".nav_links_sign") || document.createElement("div");

//     if (!sign.classList.contains("nav_links_sign")) {
//       sign.classList.add("nav_links_sign");
//     }

//     if (currentLink && !currentLink.contains(sign)) {
//       currentLink.prepend(sign);
//     }

//     const isDesktop = window.matchMedia("(min-width: 992px)");
//     let timeoutId;

//     navLinks.forEach((link) => {
//       link.addEventListener("mouseenter", function () {
//         if (!isDesktop.matches) return;

//         clearTimeout(timeoutId);
//         if (this.contains(sign)) return;

//         const state = Flip.getState(sign);
//         this.prepend(sign);

//         Flip.from(state, {
//           duration: 0.4,
//           ease: "power2.out",
//         });
//       });

//       link.addEventListener("mouseleave", function () {
//         if (!isDesktop.matches) return;

//         timeoutId = setTimeout(() => {
//           if (currentLink && !currentLink.contains(sign)) {
//             const state = Flip.getState(sign);
//             currentLink.prepend(sign);

//             Flip.from(state, {
//               duration: 0.4,
//               ease: "power2.out",
//             });
//           }
//         }, 500);
//       });
//     });

//     isDesktop.addEventListener("change", (e) => {
//       if (!e.matches && currentLink && !currentLink.contains(sign)) {
//         currentLink.prepend(sign);
//       }
//     });
//   });
// }

// function heroScrollFlip() {
//   const child = document.querySelector('[data-flip="child"]');
//   const initialParent = document.querySelector('[data-flip="initial"]');
//   const targetParent = document.querySelector('[data-flip="parent"]');
//   const spacer = document.querySelector(".hero_sticky_wrap");

//   if (!child || !initialParent || !targetParent || !spacer) return;

//   const lerp = (start, end, t) => start + (end - start) * t;

//   ScrollTrigger.create({
//     trigger: spacer,
//     start: "top top",
//     end: "80% bottom",
//     scrub: true,
//     onUpdate: (self) => {
//       const progress = self.progress;

//       const initialRect = initialParent.getBoundingClientRect();
//       const targetRect = targetParent.getBoundingClientRect();

//       if (progress > 0 && progress < 1) {
//         gsap.set(child, {
//           position: "fixed",
//           x: lerp(initialRect.left, targetRect.left, progress),
//           y: lerp(initialRect.top, targetRect.top, progress),
//           width: lerp(initialRect.width, targetRect.width, progress),
//           height: lerp(initialRect.height, targetRect.height, progress),
//           top: 0,
//           left: 0,
//           zIndex: 999,
//         });
//       } else if (progress <= 0) {
//         initialParent.appendChild(child);
//         gsap.set(child, { clearProps: "all", position: "relative" });
//       } else if (progress >= 1) {
//         targetParent.appendChild(child);
//         gsap.set(child, {
//           clearProps: "all",
//           position: "relative",
//           width: "100%",
//           height: "100%",
//         });
//       }
//     },
//     onRefresh: (self) => {
//       if (self.progress === 0) {
//         initialParent.appendChild(child);
//       } else if (self.progress >= 1) {
//         targetParent.appendChild(child);
//       }
//     },
//   });
// }

// function galleryAnimation() {
//   const container = document.querySelector(".gallery_list");

//   if (!container) return;

//   const items = gsap.utils.toArray(".gallery_item_wrap");

//   items.forEach((item, index) => {
//     gsap.set(item, { transformOrigin: "center center" });

//     let tl = gsap.timeline({
//       repeat: -1,
//       delay: index * 2.5,
//     });

//     tl.fromTo(
//       item,
//       { xPercent: 200, yPercent: 40 },
//       { xPercent: -200, yPercent: -40, duration: 10, ease: "none" },
//       0
//     );

//     tl.fromTo(
//       item,
//       { scale: 0.25 },
//       { scale: 1, duration: 5, ease: "none" },
//       0
//     );

//     tl.to(item, { scale: 0.25, duration: 5, ease: "none" }, 5);
//   });
// }

// function teamSection() {
//     const mainContainer = document.querySelector(".spacer_wrap");

//     if (!mainContainer) return;

//     const progressBar = mainContainer.querySelector(".team_progress");
//     const extraLongContainer = mainContainer.querySelector(".team_contain");
//     const teamItems = document.querySelectorAll(".team_item_wrap");

//     mainContainer.style.height = `${extraLongContainer.offsetWidth * 2}px`;

//     let scrollTween = gsap.to(extraLongContainer, {
//       xPercent: -100,
//       x: () => window.innerWidth,
//       ease: "none",
//       scrollTrigger: {
//         trigger: mainContainer,
//         start: "left left",
//         end: () => `+=${extraLongContainer.offsetWidth * 2} bottom`,
//         scrub: 1,
//         onUpdate: (self) => {
//           if (progressBar) {
//             const progress = self.progress;
//             let activeIndex = 0;

//             if (progress < 0.515) {
//               activeIndex = 0;
//             } else if (progress < 0.7) {
//               activeIndex = 1;
//             } else if (progress < 0.885) {
//               activeIndex = 2;
//             } else {
//               activeIndex = 3;
//             }

//             teamItems.forEach((item, index) => {
//               if (index === activeIndex) {
//                 item.classList.add("is-active");
//               } else {
//                 item.classList.remove("is-active");
//               }
//             });

//             gsap.set(progressBar, { width: `${self.progress * 100}%` });
//           }
//         },
//         // markers: true,
//       },
//     });
//   }

// function blobAnimation() {
//     const containers = document.querySelectorAll(".background_wrap");

//     if (containers.length < 0) return;

//     containers.forEach((container) => {
//       const canvas = container.querySelector('[data-canvas="blob"]');
//       const ctx = canvas.getContext("2d");

//       if (!container || !canvas) return;

//       const colorPalette = [
//         { r: 126, g: 57, b: 255, a: 0.8 },
//         { r: 57, g: 166, b: 255, a: 0.8 },
//       ];
//       const blackColor = { r: 0, g: 0, b: 0, a: 0.6 };

//       let colorBlobs = [];
//       let blackBlobs = [];
//       let width, height;

//       function resizeCanvas() {
//         width = canvas.width = container.clientWidth;
//         height = canvas.height = container.clientHeight;
//       }

//       class Blob {
//         constructor(colorConfig, sizeMultiplier = 1) {
//           this.x = Math.random() * width;
//           this.y = Math.random() * height;

//           this.radius = (Math.random() * 400 + 600) * sizeMultiplier;

//           this.vx = (Math.random() - 0.5) * 1.5;
//           this.vy = (Math.random() - 0.5) * 1.5;

//           this.color = colorConfig;
//         }

//         update() {
//           this.x += this.vx;
//           this.y += this.vy;

//           if (this.x < -this.radius || this.x > width + this.radius)
//             this.vx *= -1;
//           if (this.y < -this.radius || this.y > height + this.radius)
//             this.vy *= -1;
//         }

//         draw() {
//           ctx.beginPath();
//           let gradient = ctx.createRadialGradient(
//             this.x,
//             this.y,
//             0,
//             this.x,
//             this.y,
//             this.radius
//           );
//           gradient.addColorStop(
//             0,
//             `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`
//           );
//           gradient.addColorStop(
//             1,
//             `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`
//           );

//           ctx.fillStyle = gradient;
//           ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
//           // ctx.filter = "blur(90px)";
//           ctx.fill();
//         }
//       }

//       function init() {
//         resizeCanvas();
//         colorBlobs = [];
//         blackBlobs = [];

//         for (let i = 0; i < 4; i++) {
//           let randomColor =
//             colorPalette[Math.floor(Math.random() * colorPalette.length)];
//           colorBlobs.push(new Blob(randomColor, 1));
//         }

//         for (let i = 0; i < 1; i++) {
//           blackBlobs.push(new Blob(blackColor, 1.2));
//         }
//       }

//       function animate() {
//         ctx.globalCompositeOperation = "source-over";
//         ctx.clearRect(0, 0, width, height);

//         ctx.globalCompositeOperation = "lighter";
//         colorBlobs.forEach((blob) => {
//           blob.update();
//           blob.draw();
//         });

//         ctx.globalCompositeOperation = "soft-light";
//         blackBlobs.forEach((blob) => {
//           blob.update();
//           blob.draw();
//         });

//         requestAnimationFrame(animate);
//       }

//       window.addEventListener("resize", () => {
//         resizeCanvas();
//       });

//       init();
//       animate();
//     });
//   }

// function heroScrollFlip() {
//     const child = document.querySelector('[data-flip="child"]');
//     const initialParent = document.querySelector('[data-flip="initial"]');
//     const targetParent = document.querySelector('[data-flip="parent"]');
//     const spacer = document.querySelector(".hero_sticky_wrap");

//     if (!child || !initialParent || !targetParent || !spacer) return;

//     const lerp = (start, end, t) => start + (end - start) * t;

//     const iRectInit = initialParent.getBoundingClientRect();

//     targetParent.appendChild(child);
//     const tRectInit = targetParent.getBoundingClientRect();

//     initialParent.appendChild(child);

//     gsap.set(initialParent, {
//       width: iRectInit.width,
//       height: iRectInit.height,
//       overflow: "hidden",
//       padding: 0,
//     });

//     gsap.set(targetParent, {
//       width: tRectInit.width,
//       height: tRectInit.height,
//       padding: 0,
//     });

//     gsap.set(child, {
//       position: "absolute",
//       top: 0,
//       left: 0,
//       width: "100%",
//       height: "100%",
//       objectFit: "cover",
//       margin: 0,
//       boxSizing: "border-box",
//     });

//     ScrollTrigger.create({
//       trigger: spacer,
//       start: "top top",
//       end: "80% bottom",
//       scrub: true,
//       onUpdate: (self) => {
//         const progress = self.progress;

//         const iRect = initialParent.getBoundingClientRect();
//         const tRect = targetParent.getBoundingClientRect();

//         if (progress > 0 && progress < 1) {
//           if (child.parentNode !== document.body) {
//             document.body.appendChild(child);
//           }

//           gsap.set(child, {
//             position: "fixed",
//             top: 0,
//             left: 0,
//             x: lerp(iRect.left, tRect.left, progress),
//             y: lerp(iRect.top, tRect.top, progress),
//             width: lerp(iRect.width, tRect.width, progress),
//             height: lerp(iRect.height, tRect.height, progress),
//             margin: 0,
//             zIndex: 999,
//           });
//         } else if (progress <= 0) {
//           if (child.parentNode !== initialParent) {
//             initialParent.appendChild(child);
//             gsap.set(child, {
//               clearProps: "position,top,left,x,y,zIndex",
//               position: "absolute",
//               top: 0,
//               left: 0,
//               width: "100%",
//               height: "100%",
//               margin: 0,
//             });
//           }
//         } else if (progress >= 1) {
//           if (child.parentNode !== targetParent) {
//             targetParent.appendChild(child);
//             gsap.set(child, {
//               clearProps: "position,top,left,x,y,zIndex",
//               position: "absolute",
//               top: 0,
//               left: 0,
//               width: "100%",
//               height: "100%",
//               margin: 0,
//             });
//           }
//         }
//       },
//     });
//   }
