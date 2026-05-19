// Initialize Lenis
// lenis = new Lenis({
//   autoRaf: true,
// });

//
document.addEventListener("DOMContentLoaded", () => {
  function isSafari() {
    const ua = navigator.userAgent.toLowerCase();
    console.log("ua", ua);
    return (
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("crios") &&
      !ua.includes("fxios")
    );
  }

  if (!isSafari()) {
    lenis = new Lenis({
      lerp: 0.05,
      wheelMultiplier: 0.8,
      gestureOrientation: "vertical",
      normalizeWheel: false,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    lenis.scrollTo(0, 0);
  } else {
    console.log("Lenis Smooth Scroll disabled on Safari");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const videoSections = document.querySelectorAll(".video_wrap");

  videoSections.forEach((section) => {
    // 1. Define Elements
    const playBtn = section.querySelector(".video_head_btn_play");
    const expandBtn = section.querySelector(".video_btn_expand_wrap");
    const video = section.querySelector("video");

    if (!video) return; // Stop if no video found

    // 2. Define Actions

    // Function to Activate "Watch Mode"
    const openVideoMode = () => {
      section.classList.add("is-playing");
      video.muted = false; // Turn on sound
      video.loop = false; // IMPORTANT: Disable loop so the video can actually "end"
      video.currentTime = 0; // Start from beginning
      video.play();
    };

    // Function to Return to "Background Mode"
    const closeVideoMode = () => {
      section.classList.remove("is-playing");
      video.muted = true; // Mute sound
      video.loop = true; // Re-enable loop for background ambiance
      video.play(); // Keep it playing as a background element
    };

    // 3. Event Listeners

    // Toggle Logic for Buttons
    const handleToggle = () => {
      if (section.classList.contains("is-playing")) {
        closeVideoMode();
      } else {
        openVideoMode();
      }
    };

    if (playBtn) playBtn.addEventListener("click", handleToggle);
    if (expandBtn) expandBtn.addEventListener("click", handleToggle);

    // 4. The "Video Over" Logic
    // This event only fires if video.loop is set to false (which we do in openVideoMode)
    video.addEventListener("ended", () => {
      closeVideoMode();
    });
  });
});
