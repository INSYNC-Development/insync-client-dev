// Phone Validation
document.addEventListener("DOMContentLoaded", function () {
  const phone = document.getElementById("Phone");
  if (!phone) return;
  document.getElementById("Phone").addEventListener("input", function (event) {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // DOM Elements
  const countryCodeSelect = document.getElementById("Country-Code");

  // Default country code (Germany)
  const defaultCountry = "MY";

  // Fetch country codes from API
  fetchCountryCodes();

  // Setup dropdown search functionality
  setupDropdownSearch();

  /**
   * Setup keyboard-based search for the dropdown
   */
  function setupDropdownSearch() {
    // Variables to manage the search state
    let searchString = "";
    let searchTimer = null;

    // Listen for keyboard input when the dropdown is focused
    countryCodeSelect.addEventListener("keydown", function (e) {
      // Prevent default for alphanumeric characters to avoid dropdown's default behavior
      if (/^[a-zA-Z0-9\+]$/.test(e.key)) {
        e.preventDefault();

        // Add the pressed key to the search string
        searchString += e.key;

        // Find matching option
        findMatchingOption(searchString);

        // Reset search string after a delay
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchString = "";
        }, 1500); // Reset after 1.5 seconds of no typing
      }
    });

    // Focus the dropdown when clicked to enable keyboard input
    countryCodeSelect.addEventListener("click", function () {
      this.focus();
    });
  }

  /**
   * Find an option matching the search string and select it
   * @param {string} search - The current search string
   */
  function findMatchingOption(search) {
    search = search.toLowerCase();

    // Get all options
    const options = Array.from(countryCodeSelect.options);

    // Try different search strategies (country code, country name, dial code)
    let found = false;

    // Strategy 1: Exact match for country code
    if (!found) {
      const matchingOption = options.find(
        (option) =>
          option.dataset.code && option.dataset.code.toLowerCase() === search
      );

      if (matchingOption) {
        countryCodeSelect.value = matchingOption.value;
        found = true;
      }
    }

    // Strategy 2: Starts with for country name
    if (!found) {
      const matchingOption = options.find(
        (option) =>
          option.dataset.name &&
          option.dataset.name.toLowerCase().startsWith(search)
      );

      if (matchingOption) {
        countryCodeSelect.value = matchingOption.value;
        found = true;
      }
    }

    // Strategy 3: Match for dial code (including the + sign)
    if (!found && search.includes("+")) {
      const matchingOption = options.find((option) =>
        option.value.toLowerCase().includes(search)
      );

      if (matchingOption) {
        countryCodeSelect.value = matchingOption.value;
        found = true;
      }
    }

    // If any match was found, trigger change event
    if (found) {
      countryCodeSelect.dispatchEvent(new Event("change"));
    }
  }

  /**
   * Convert country code to emoji flag
   * @param {string} countryCode - Two-letter country code
   * @returns {string} - Flag emoji for the country
   */
  function getFlagEmoji(countryCode) {
    if (!countryCode) return "";
    // Convert country code to regional indicator symbols
    // which will be displayed as a flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Fetch country codes from REST Countries API
   */
  function fetchCountryCodes() {
    // Display loading message
    countryCodeSelect.innerHTML = "<option>Loading...</option>";

    fetch("https://restcountries.com/v3.1/all?fields=name,idd,cca2")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        populateCountryCodes(data);
      })
      .catch((error) => {
        console.error("Error fetching country codes:", error);
        // Use fallback country codes
        useFallbackCountryCodes();
      });
  }

  /**
   * Populate the country code dropdown with data from API
   * @param {Array} countries - Array of country data from API
   */
  function populateCountryCodes(countries) {
    // Clear existing options
    countryCodeSelect.innerHTML = "";

    // Filter and map countries to get those with phone codes
    const countriesWithCodes = countries
      .filter(
        (country) => country.idd && country.idd.root && country.name.common
      )
      .map((country) => {
        const suffix =
          country.idd.suffixes && country.idd.suffixes.length === 1
            ? country.idd.suffixes[0]
            : "";
        return {
          code: country.cca2,
          name: country.name.common,
          dialCode: `${country.idd.root}${suffix}`,
        };
      })
      // Sort by dial code numerically (strip the "+" and convert to number)
      .sort((a, b) => {
        const numA = parseInt(a.dialCode.replace(/\D/g, ""), 10);
        const numB = parseInt(b.dialCode.replace(/\D/g, ""), 10);
        return numA - numB;
      });

    // Add options to select
    countriesWithCodes.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.dialCode;
      option.dataset.code = country.code;
      // Store the country name in a data attribute for search functionality
      option.dataset.name = country.name;
      // Use flag emoji instead of country name in the display
      option.textContent = `${getFlagEmoji(country.code)} ${country.dialCode}`;

      // Set Belgium as default
      if (country.code === defaultCountry) {
        option.selected = true;
      }

      countryCodeSelect.appendChild(option);
    });

    // If Belgium wasn't found, set the first option as selected
    if (!countryCodeSelect.value && countryCodeSelect.options.length > 0) {
      countryCodeSelect.options[0].selected = true;
    }
  }

  /**
   * Use fallback country codes when API fails
   */
  function useFallbackCountryCodes() {
    const fallbackCodes = [
      { code: "NL", dialCode: "+31", name: "Netherlands" },
      { code: "BE", dialCode: "+32", name: "Belgium" },
      { code: "DE", dialCode: "+49", name: "Germany" },
      { code: "FR", dialCode: "+33", name: "France" },
      { code: "GB", dialCode: "+44", name: "United Kingdom" },
      { code: "US", dialCode: "+1", name: "United States" },
      { code: "IT", dialCode: "+39", name: "Italy" },
      { code: "ES", dialCode: "+34", name: "Spain" },
      { code: "PT", dialCode: "+351", name: "Portugal" },
      { code: "CH", dialCode: "+41", name: "Switzerland" },
    ];

    // Sort the fallback codes by dialCode numerically
    fallbackCodes.sort((a, b) => {
      const numA = parseInt(a.dialCode.replace(/\D/g, ""), 10);
      const numB = parseInt(b.dialCode.replace(/\D/g, ""), 10);
      return numA - numB;
    });

    // Clear existing options
    countryCodeSelect.innerHTML = "";

    // Add fallback options
    fallbackCodes.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.dialCode;
      option.dataset.code = country.code;
      // Store the country name in a data attribute for search functionality
      option.dataset.name = country.name;
      // Use flag emoji instead of country name in the display
      option.textContent = `${getFlagEmoji(country.code)} ${country.dialCode} `;

      if (country.code === defaultCountry) {
        option.selected = true;
      }

      countryCodeSelect.appendChild(option);
    });
  }
});

// Fluid Font Size to Container
function setFullWidthFontSize() {
  $("[data-text='full-width']").each(function () {
    let parentWidth = $(this).width();
    let child = $(this).children();

    let fontSize = 0.5;
    child.css("font-size", fontSize + "cqw");
    while (child.width() < parentWidth) {
      fontSize += 0.1;
      child.css("font-size", fontSize + "cqw");
    }
    fontSize -= 0.1;
    child.css("font-size", fontSize + "cqw");
  });
}

function setFullWidthFontSizeDesktop() {
  // 1. Define the Desktop Query (min-width: 992px)
  const isDesktop = window.matchMedia("(min-width: 992px)").matches;

  if (isDesktop) {
    // --- RUN DESKTOP LOGIC ---
    $("[data-text='full-width-desktop']").each(function () {
      let parentWidth = $(this).width();
      let child = $(this).children();

      // Reset start size
      let fontSize = 0.5;
      child.css("font-size", fontSize + "cqw");

      // Loop to increase size until it fills width
      // Added a safety break (fontSize < 100) to prevent infinite loops
      while (child.width() < parentWidth && fontSize < 100) {
        fontSize += 0.1;
        child.css("font-size", fontSize + "cqw");
      }

      // Step back one increment so it doesn't overflow
      fontSize -= 0.1;
      child.css("font-size", fontSize + "cqw");
    });
  } else {
    // --- MOBILE/TABLET: RESET STYLES ---
    // Important: Remove the inline font-size so CSS takes over again
    $("[data-text='full-width-desktop']").children().css("font-size", "");
  }
}

// 2. Run on Page Load
$(document).ready(function () {
  setFullWidthFontSizeDesktop();
});

// 3. Run on Resize
$(window).on("resize", function () {
  setFullWidthFontSizeDesktop();
});

document.addEventListener("DOMContentLoaded", () => {
  setFullWidthFontSize();
});

// Product Swiper
const productSwiper = new Swiper(".swiper.is-products", {
  slidesPerView: 1.2,
  spaceBetween: 16,
  breakpoints: {
    568: {
      slidesPerView: 2.2,
    },
    992: {
      slidesPerView: 3,
      spaceBetween: 20,
    },
  },
  navigation: {
    prevEl: "[data-swiper-nav='prev']",
    nextEl: "[data-swiper-nav='next']",
  },
});

// Team Swiper
const teamSwiper = new Swiper(".swiper.is-team", {
  slidesPerView: 1.2,
  spaceBetween: 16,
  breakpoints: {
    568: {
      slidesPerView: 2.2,
    },
    992: {
      slidesPerView: 3,
      spaceBetween: 20,
    },
  },
  navigation: {
    prevEl: "[data-swiper-nav='prev']",
    nextEl: "[data-swiper-nav='next']",
  },
});

// --------------------------------------------------------
// HELPER: Create Mask for Specific SVG
// --------------------------------------------------------
// This function wraps the target SVG and creates the blue overlay
// --------------------------------------------------------
// HELPER: Create Mask for Specific SVG
// --------------------------------------------------------
function createMaskForSVG(item, selector) {
  const targetSvg = item.querySelector(selector);

  // Safety check
  if (
    !targetSvg ||
    targetSvg.parentNode.classList.contains("line-mask-wrapper")
  ) {
    return targetSvg ? targetSvg.parentNode.querySelector(".mask-div") : null;
  }

  // 1. Get the exact height of the original SVG
  // This is the CRITICAL FIX to prevent stretching
  const svgHeight = targetSvg.getBoundingClientRect().height;

  // 2. Create a Wrapper
  const wrapper = document.createElement("div");
  wrapper.classList.add("line-mask-wrapper");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.display = "block";
  // We explicitly set the wrapper height to match the SVG to preserve layout
  wrapper.style.height = svgHeight + "px";

  // 3. Insert Wrapper
  targetSvg.parentNode.insertBefore(wrapper, targetSvg);
  wrapper.appendChild(targetSvg);

  // 4. Create the Mask Container
  const maskDiv = document.createElement("div");
  maskDiv.classList.add("mask-div");
  maskDiv.style.position = "absolute";
  maskDiv.style.top = "0";
  maskDiv.style.left = "0";
  maskDiv.style.width = "100%";
  maskDiv.style.height = "0%"; // Start invisible
  maskDiv.style.overflow = "hidden"; // This acts as the crop
  maskDiv.style.zIndex = "2";

  // 5. Clone the SVG
  const blueSvg = targetSvg.cloneNode(true);
  blueSvg.removeAttribute("id");
  blueSvg.removeAttribute("data-vertical-line");

  // Style the Blue SVG
  blueSvg.style.color = "#3105FA";
  blueSvg.style.width = "100%";
  blueSvg.style.position = "absolute";
  blueSvg.style.top = "0";
  blueSvg.style.left = "0";

  // FIX: Set to fixed pixel height so it doesn't shrink with the mask
  blueSvg.style.height = svgHeight + "px";

  // 6. Assemble
  maskDiv.appendChild(blueSvg);
  wrapper.appendChild(maskDiv);

  return maskDiv;
}

// --------------------------------------------------------
// MAIN EXECUTION
// --------------------------------------------------------
let mm = gsap.matchMedia();

// DESKTOP: Horizontal Scroll Sync
mm.add("(min-width: 992px)", () => {
  let horizontalSection = document.querySelector(".story_content");
  let activeLine = document.querySelector('[data-element-line="active-line"]');
  let storyItems = document.querySelectorAll(".story_item");

  if (!horizontalSection || !activeLine) return;

  // 1. Prepare Horizontal Line
  let length = activeLine.getTotalLength();
  gsap.set(activeLine, { strokeDasharray: length, strokeDashoffset: length });

  // 2. Create Master Timeline
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".story_content",
      start: "center 65%",
      end: "+=3000px",
      pin: ".story_layout",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  const totalDuration = 1;

  // A. Horizontal Movement
  tl.to(
    ".story_content",
    {
      x: () => horizontalSection.scrollWidth * -1,
      y: () => horizontalSection.scrollWidth * 0.1,
      xPercent: 100,
      ease: "none",
      duration: totalDuration,
    },
    0
  );

  // B. Horizontal Line Draw
  tl.to(
    activeLine,
    {
      strokeDashoffset: 0,
      ease: "none",
      duration: totalDuration,
    },
    0
  );

  // 3. Sync Desktop Vertical Lines
  storyItems.forEach((item) => {
    // Generate Mask specifically for Desktop SVG
    let mask = createMaskForSVG(item, '[data-vertical-line="desktop"]');

    if (mask) {
      // Calculate Timing
      // Note: We use the mask's wrapper (parentNode) to get the offset
      let itemX = item.offsetLeft;
      let lineOffset = mask.parentNode.offsetLeft;
      let totalPosition = itemX + lineOffset;

      let progress = totalPosition / horizontalSection.scrollWidth;

      // Animate Height
      tl.to(
        mask,
        {
          height: "100%",
          ease: "none",
          duration: 0.05, // Fast fill
        },
        progress * totalDuration
      );
    }
  });
});

// MOBILE: Vertical Scroll Trigger
mm.add("(max-width: 991px)", () => {
  const section = document.querySelector(".story_horizontal_wrap"); // Adjust selector if needed for mobile container
  // Or just target items generally if they are stacked
  const items = document.querySelectorAll(".story_item");

  items.forEach((item) => {
    // Generate Mask specifically for Mobile SVG
    let mask = createMaskForSVG(item, '[data-vertical-line="mobile"]');

    if (mask) {
      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: "top 80%",
          end: "bottom 60%",
          scrub: true,
        },
      });

      tl.from(item, {
        opacity: 0.7,
        duration: 1,
        ease: "power3.out",
      }).to(
        mask,
        {
          height: "100%",
          ease: "none",
          duration: 1,
        },
        ">"
      );
    }
  });
});
// Testimonial Animation
window.addEventListener("load", function () {
  // 1. Select the Track directly
  const track = document.querySelector(".testimonial_content_list");

  // Safety check
  if (!track) return;

  // 2. Get the items from the TRACK, not the container
  const items = Array.from(track.children);

  // 4. Measure height of the ORIGINAL set of items
  let totalHeight = 0;
  items.forEach((item) => {
    // Add the height of the item plus the gap below it
    totalHeight += item.offsetHeight;
  });

  // 5. Clone items
  items.forEach((item) => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  // 6. Create GSAP Animation
  const tl = gsap.timeline({
    repeat: -1,
    defaults: { ease: "none" },
  });

  tl.to(track, {
    y: -totalHeight, // Move exactly the height of the original set
    duration: 30,
  });

  // Optional: Pause on hover
  // We attach this to the track or the parent wrapper
  // const wrapper = document.querySelector(".testimonial_content_col-2");
  // if (wrapper) {
  //   wrapper.addEventListener("mouseenter", () => tl.pause());
  //   wrapper.addEventListener("mouseleave", () => tl.play());
  // }
});

// Nav on Scroll Func
document.addEventListener("DOMContentLoaded", () => {
  // Get all navbar elements (desktop & mobile)
  const navbars = document.querySelectorAll(".nav_component");

  // Calculate 10% of viewport height
  let scrollThreshold = window.innerHeight * 0.1;

  // Function to toggle navbar class based on scroll position
  function toggleNavbarClass() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > scrollThreshold) {
      // Add nav_light class when scrolled past 10%
      navbars.forEach((nav) => nav.classList.add("is-scrolled"));
    } else {
      // Remove nav_light class when at top
      navbars.forEach((nav) => nav.classList.remove("is-scrolled"));
    }
  }

  window.addEventListener("scroll", toggleNavbarClass);

  // Check initial state on page load
  toggleNavbarClass();

  // Handle window resize to recalculate threshold
  window.addEventListener("resize", () => {
    scrollThreshold = window.innerHeight * 0.1;
  });
});

// Partner Rive Animation
const partnerRive = () => {
  const section = document.querySelector(".gain_wrap");
  if (!section) return;

  const riveSource = document.getElementById("rive-partner");
  const visual = section.querySelector("[data-rive-element='partner']");
  if (!riveSource) return;

  const RIVEURL =
    "https://cdn.prod.website-files.com/692d4079d89a3df9c6a3f792/6939270e1aad880c9d4ba84c_asdf_running_line_one_shoot.riv";
  const sm = "State Machine 1";
  const artboard = "why_asdf_line_run";

  let mm = gsap.matchMedia();

  const r = new rive.Rive({
    src: RIVEURL,
    canvas: visual,
    stateMachines: sm,
    artboard: artboard,
    autoplay: true,
    isTouchScrollEnabled: true,
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      const inputs = r.stateMachineInputs(sm);
      const playTrigger = inputs.find((i) => i.name === "play");

      const rawItems = section.querySelectorAll("[data-gain-item]");

      const items = Array.from(rawItems).sort((a, b) => {
        const valA = parseInt(a.getAttribute("data-gain-item"), 10);
        const valB = parseInt(b.getAttribute("data-gain-item"), 10);
        return valA - valB; // Sorts Ascending (1, 2, 3...)
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",

          onEnter: () => {
            if (playTrigger) {
              playTrigger.fire();
            }
          },
        },
      });

      mm.add("(min-width: 992px)", () => {
        items.forEach((item) => {
          tl.fromTo(
            item,
            {
              opacity: 0.5,
            },
            {
              opacity: 1,
              duration: 0.5,
              delay: 1,
              stagger: 0.5,
            },
            ">"
          );
        });
      });

      mm.add("(max-width: 991)", () => {
        items.forEach((item) => {
          tl.from(item, {
            opacity: 0.5,
            stagger: 0.5,
          });
        });
      });
    },
    onLoadError: (err) => {
      console.error("Rive loading error:", err);
    },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  partnerRive();
});

const scrubWordAnim = () => {
  const texts = gsap.utils.toArray("[data-animation-text='scrub-word']");
  if (texts.length === 0) return;
  const getCSSVariable = (variableName, fallback = "#000") => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(
        variableName
      ) || fallback
    );
  };

  const BRAND_COLOR = getCSSVariable("--swatch--brand-500", "#3105FA");
  const TEXT_COLOR = getCSSVariable("--swatch--brand-text-heading", "#1a232b");
  const FADED_COLOR = "rgba(26, 35, 43, 0.40)";

  texts.forEach((text) => {
    let split = new SplitText(text, {
      type: "words, chars",
      wordsClass: "word",
      charsClass: "char",
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: text,
          start: "top 90%",
          scrub: true,
        },
        defaults: {
          ease: "power3",
        },
      })
      .set(text, {
        color:
          typeof FADED_COLOR !== "undefined"
            ? FADED_COLOR
            : "rgba(26, 35, 43, 0.40)",
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
            }, // Fallback if var undefined
            {
              color:
                typeof BRAND_COLOR !== "undefined" ? BRAND_COLOR : "#3105FA",
              duration: 0.2,
            },
            {
              color: typeof TEXT_COLOR !== "undefined" ? TEXT_COLOR : "#1a232b",
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

document.fonts.ready.then(() => {
  scrubWordAnim();
});

// const headingAnim = () => {
//   const headings = document.querySelectorAll("[data-animation-text='heading']");
//   if (!headings) return;

//   headings.forEach((heading) => {
//     const accent = heading.querySelector("strong");
//     gsap.set(accent, {
//       color: "#1A232B",
//     });
//     gsap
//       .timeline({
//         scrollTrigger: {
//           trigger: heading,
//           start: "top 85%",
//           stagger: 0.5,
//           toggleActions: "play none none none",
//         },
//         defaults: {
//           ease: "power3",
//         },
//       })
//       .to(accent, {
//         color: "#3105FA",
//         duration: 2,
//       });
//   });
// };

const headingAnim = () => {
  const headings = document.querySelectorAll("[data-animation-text='heading']");
  if (!headings.length) return;

  // Optional: Register plugins if you haven't already globally
  // gsap.registerPlugin(ScrollTrigger, SplitText);

  headings.forEach((heading) => {
    const accent = heading.querySelector("strong");

    // 2. Set initial accent color
    if (accent) {
      gsap.set(accent, { color: "#1A232B" });
    }

    // 3. Split the text into chars and lines
    const split = new SplitText(heading, {
      type: "words",
    });

    // 4. Create the Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heading,
        start: "top 85%",
        toggleActions: "play none none none", // Allows re-playing on scroll up
      },
      defaults: {
        ease: "back.out(1.7)", // Adds a subtle "pop" or overshoot for energy
        duration: 1,
      },
    });

    // 5. The "Outstanding" Animation
    // We animate the characters from 100% below, rotated -90deg (laying flat), and invisible.
    tl.from(split.words, {
      y: "50%",
      opacity: 0,
      stagger: 0.1,
    });

    // 6. Integrate the accent color change smoothly
    if (accent) {
      tl.to(
        accent,
        {
          color: "#3105FA",
          duration: 1.2, // Slightly slower than the move for a lingering effect
          ease: "power2.out",
        },
        "<+=50%" // Starts 0.1s after the text begins appearing
      );
    }

    // Cleanup: Revert text on window resize to prevent responsive layout issues
    // (Optional but recommended for SplitText)
    window.addEventListener("resize", () => {
      split.revert();
      ScrollTrigger.refresh();
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  headingAnim();
});

const bornToBeDiffAnim = () => {
  const wrap = document.querySelector(".main_tagline_wrap");
  if (!wrap) return;
  const text = wrap.querySelector(".main_tagline_heading");

  let split = new SplitText(text, {
    type: "words",
    wordsClass: "word",
    mask: "words",
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 90%",
        end: "bottom bottom",
        duration: 0.75,
        toggleActions: "play none none none",
      },
    })
    .from([split.words, "[data-text-el='glitch'"], {
      stagger: 0.25,
      yPercent: 110,
      autoAlpha: 0,
    });

  const glitch = document.querySelector("[data-text-el='glitch']");

  // Helper function to generate a random slice
  // Returns: inset(top% 0 bottom% 0)
  const getRandomSlice = () => {
    const top = gsap.utils.random(0, 95);
    // Height of the slice (between 2% and 20%)
    const height = gsap.utils.random(2, 20);
    const bottom = 100 - top - height;

    return `inset(${top}% 0 ${bottom}% 0)`;
  };

  // Create a timeline that loops infinitely
  const tl = gsap.timeline({
    repeat: -1,
    defaults: { ease: "steps(1)" }, // "steps(1)" creates the jagged, instant robotic feel
  });

  // We generate 20 "steps" (keyframes) to match your original SASS count
  // But unlike SASS, we can randomize it on every repeat if we want.
  // For now, let's strictly mimic the SASS 5s duration / 20 steps logic.

  const steps = 20;
  const duration = 5;
  const stepDuration = duration / steps;

  // for (let i = 0; i < steps; i++) {
  //   tl.to(glitch, {
  //     "--clip-one": getRandomSlice, // GSAP calls this function automatically
  //     "--clip-two": getRandomSlice,
  //     duration: stepDuration,
  //   });
  // }

  // OPTIONAL: TRUE RANDOMNESS
  // If you want it to never repeat the same pattern (better than SASS):

  gsap.to(glitch, {
    duration: 0.2, // speed of glitch updates
    repeat: -1,
    ease: "steps(1)",
    onRepeat: () => {
      gsap.set(glitch, {
        "--clip-one": getRandomSlice(),
        "--clip-two": getRandomSlice(),
      });
    },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  bornToBeDiffAnim();
});

// Device Swiper
const deviceSwiper = new Swiper(".swiper.is-device", {
  slidesPerView: 1,
  crossfade: true,
  effect: "fade",
  loop: true,
  grabCursor: true,
  autoplay: {
    delay: 3000,
    // pauseOnMouseEnter: true,
  },
  pagination: {
    el: "[data-swiper-nav='device']",
  },
});

const chargerSwiper = new Swiper(".swiper.is-charger", {
  slidesPerView: 1,
  crossfade: true,
  effect: "fade",
  loop: true,
  grabCursor: true,
  autoplay: {
    delay: 3000,
    // pauseOnMouseEnter: true,
  },
  pagination: {
    el: "[data-swiper-nav='charger']",
  },
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error("GSAP or ScrollTrigger is not loaded.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function initSlideUpThenFloat() {
    const elements = gsap.utils.toArray(
      '[data-scroll-animation="hero-slide-up"]'
    );

    if (elements.length === 0) return;

    gsap.set(elements, { opacity: 0, y: 50 });

    ScrollTrigger.batch(elements, {
      start: "top 90%",
      end: "bottom center",
      onEnter: (batch) => {
        batch.forEach((el, index) => {
          const tl = gsap.timeline();

          tl.to(el, {
            opacity: 1,
            y: -14,
            duration: 1,
            ease: "power2.out",
            delay: index * 0.1,
          }).to(el, {
            y: 0,
            duration: 2,
            ease: "power1.out",
            yoyo: true,
            repeat: -1,
          });
        });
      },
    });
  }

  initSlideUpThenFloat();
});

const latestCardSwiper = new Swiper(".swiper.is-latest-product", {
  slidesPerView: "auto",
  spaceBetween: 0,
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  navigation: {
    nextEl: ".main_hero_card_pagination.is-next",
    prevEl: ".main_hero_card_pagination.is-prev",
  },
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error(
      "GSAP or ScrollTrigger is not loaded. Please include the libraries."
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function initScrollAnimations() {
    // Group elements by animation type for better organization
    const animationGroups = {
      "slide-up": [],
      "slide-from-left": [],
      "slide-from-right": [],
    };

    const animatedElements = gsap.utils.toArray("[data-scroll-animation]");

    animatedElements.forEach((element) => {
      const animationType = element.getAttribute("data-scroll-animation");

      if (!animationGroups.hasOwnProperty(animationType)) {
        console.warn(`Unknown animation type: ${animationType}`);
        return;
      }

      // Set initial state based on animation type
      switch (animationType) {
        case "slide-up":
          gsap.set(element, { opacity: 0, y: 40 });
          break;
        case "slide-from-left":
          gsap.set(element, { opacity: 0, x: -100 });
          break;
        case "slide-from-right":
          gsap.set(element, { opacity: 0, x: 100 });
          break;
      }

      animationGroups[animationType].push(element);
    });

    for (const [animationType, elements] of Object.entries(animationGroups)) {
      if (elements.length === 0) continue;

      ScrollTrigger.batch(elements, {
        start: "top 90%",
        end: "bottom center",
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            x: 0,
            stagger: 0.1,
            duration: 1,
            ease: "power2.out",
            overwrite: true,
          });
        },
        // markers: true
      });
    }
  }

  initScrollAnimations();
});

document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger);

  gsap.set(".main_products_visual_wrap", { yPercent: 100 });

  ScrollTrigger.batch(".main_products_item", {
    onEnter: (elements) => {
      const targets = elements.map((el) =>
        el.querySelector(".main_products_visual_wrap")
      );

      gsap.to(targets, {
        yPercent: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15,
        overwrite: "auto",
      });
    },
    start: "top 90%",
    once: true,
  });
});

document.addEventListener("DOMContentLoaded", (event) => {
  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    gsap.to(".product_hero_visual_img", {
      width: "60%",
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: ".product_hero_layout",
        start: "top 50%",
        end: "60% 10%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  mm.add("(min-width: 992px)", () => {
    gsap.to(".main_hero_visual_wrap", {
      scale: 0.6,
      yPercent: 70,
      ease: "none",
      scrollTrigger: {
        trigger: ".main_hero_layout",
        start: "top 30%",
        // end: "60% 10%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Select all input fields with type="email"
  const emailInputs = document.querySelectorAll('input[type="email"]');

  // Loop through each email input field found
  emailInputs.forEach((emailInput) => {
    // Find the sibling element for the error message
    const errorMsgElement = emailInput.nextElementSibling;

    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    ) {
      console.error(
        "Could not find the error message element for an email input.",
        emailInput
      );
      return; // Skip this field if no error message element is found
    }

    emailInput.addEventListener("blur", function () {
      const email = this.value.trim();
      const emailParts = email.split("@");

      if (emailParts.length === 2 && emailParts[1].length > 0) {
        const domain = emailParts[1];
        validateDomain(domain, errorMsgElement);
      } else if (email.length > 0) {
        showError("Please enter a valid email address.", errorMsgElement);
      } else {
        hideError(errorMsgElement); // Hide error if the field is empty
      }
    });
  });

  async function validateDomain(domain, errorElement) {
    try {
      // Show a loading/checking message for better UX
      showError("Verifying domain...", errorElement);

      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();

      // Check for a valid response and if an "Answer" section with records exists
      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement); // Domain is valid
      } else {
        showError(
          "The email domain appears to be invalid or non-existent.",
          errorElement
        );
      }
    } catch (error) {
      console.error("Error during domain validation:", error);
      // Optional: Show an error if the API is unreachable
      showError(
        "Validation failed. Please check your connection.",
        errorElement
      );
    }
  }

  function showError(message, element) {
    element.textContent = message;
    element.style.display = "block";
  }

  function hideError(element) {
    element.style.display = "none";
  }
});
