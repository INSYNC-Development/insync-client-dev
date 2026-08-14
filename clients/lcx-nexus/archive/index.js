const lenis = new Lenis({
  autoRaf: true,
});

function initNavScroll() {
  const navComponent = document.querySelector(".nav_component");

  if (navComponent) {
    let isScrolled = false;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 0 && !isScrolled) {
        navComponent.setAttribute("data-scroll", "true");
        isScrolled = true;
      } else if (window.scrollY === 0 && isScrolled) {
        navComponent.setAttribute("data-scroll", "false");
        isScrolled = false;
      }
    });
  }
}

function initDeveloped() {
  const items = gsap.utils.toArray("[data-item]");
  const bgImages = gsap.utils.toArray("[data-background-wrap] img");
  const icons = gsap.utils.toArray("[data-icon]");
  const listWrapper = document.querySelector(".developed_list");

  if (items.length > 0 && listWrapper) {
    let mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 769px)",
        isMobile: "(max-width: 768px)",
      },
      (context) => {
        let { isMobile } = context.conditions;

        gsap.set(icons, { autoAlpha: 0, y: 20, filter: "blur(8px)" });
        gsap.set(icons[0], { autoAlpha: 1, y: 0, filter: "blur(0px)" });

        gsap.set(items, { filter: "blur(3px)" });
        gsap.set(items[0], { filter: "blur(0px)" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".spacer_wrap",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            snap: {
              snapTo: 1 / (items.length - 1),
              duration: { min: 0.3, max: 0.6 },
              ease: "power2.inOut",
            },
          },
        });

        items.forEach((item, i) => {
          if (i === 0) return;

          const stepLabel = `step${i}`;
          const movePercent = -(100 / items.length) * i;

          tl.to(
            listWrapper,
            {
              xPercent: isMobile ? movePercent : 0,
              yPercent: isMobile ? 0 : movePercent,
              ease: "none",
            },
            stepLabel
          );

          tl.to(
            items[i - 1],
            { opacity: 0.3, filter: "blur(3px)", ease: "none" },
            stepLabel
          );
          tl.to(
            items[i],
            { opacity: 1, filter: "blur(0px)", ease: "none" },
            stepLabel
          );

          if (bgImages[i]) {
            tl.fromTo(
              bgImages[i],
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", ease: "none" },
              stepLabel
            );
          }

          if (icons[i - 1] && icons[i]) {
            tl.to(
              icons[i - 1],
              { autoAlpha: 0, y: -20, filter: "blur(8px)", ease: "none" },
              stepLabel
            );

            tl.fromTo(
              icons[i],
              { autoAlpha: 0, y: 20, filter: "blur(8px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "none" },
              stepLabel
            );
          }
        });
      }
    );
  }
}

function initHow() {
  const triggerSection = document.querySelector(".spacer_wrap.is-how");
  const items = gsap.utils.toArray(".how_item_wrap");
  const indicators = gsap.utils.toArray(".how_indicator_item");

  if (!triggerSection || items.length === 0 || indicators.length === 0) return;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 1051px)", () => {
    let totalItems = items.length;
    let currentIndex = 0;

    items.forEach((item, i) => {
      if (i === 0) {
        item.classList.add("is-active");
        indicators[i].classList.add("is-active");
      } else {
        item.classList.remove("is-active");
        indicators[i].classList.remove("is-active");
      }
    });

    ScrollTrigger.create({
      trigger: triggerSection,
      start: "top top",
      end: "bottom bottom",
      scrub: true,

      onUpdate: (self) => {
        let progress = self.progress;

        let newIndex = Math.floor(progress * totalItems);

        if (newIndex >= totalItems) newIndex = totalItems - 1;

        if (newIndex !== currentIndex) {
          items[currentIndex].classList.remove("is-active");
          indicators[currentIndex].classList.remove("is-active");

          items[newIndex].classList.add("is-active");
          indicators[newIndex].classList.add("is-active");

          currentIndex = newIndex;
        }
      },
    });
  });
}

function initSlider() {
  const wrapper = document.querySelector("[data-drives-wrap]");

  if (!wrapper) return;

  const items = wrapper.querySelectorAll("[data-item]");
  const contents = wrapper.querySelectorAll("[data-content]");
  const track = wrapper.querySelector(".drives_list");
  const sliderContainer = wrapper.querySelector("[data-slider]");
  const btnPrev = wrapper.querySelector('[data-button="prev"]');
  const btnNext = wrapper.querySelector('[data-button="next"]');
  const contentWrapper = wrapper.querySelector("[data-content-wrap]");

  if (
    items.length === 0 ||
    items.length !== contents.length ||
    !track ||
    !sliderContainer ||
    !btnPrev ||
    !btnNext ||
    !contentWrapper
  )
    return;

  let currentIndex = 0;
  let mm = gsap.matchMedia();

  const activeDotColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--swatch--brand-500")
    .trim();

  mm.add("(min-width: 768px)", () => {
    const dots = gsap.utils.toArray(
      wrapper.querySelectorAll(".drives_item_dot")
    );
    const lines = gsap.utils.toArray(
      wrapper.querySelectorAll(".drives_item_line")
    );

    const centerTrack = (index, animate = true) => {
      const containerWidth = sliderContainer.offsetWidth;
      const targetItem = items[index];
      const itemLeft = targetItem.offsetLeft;
      const itemWidth = targetItem.offsetWidth;

      const targetX = containerWidth / 2 - (itemLeft + itemWidth / 2);

      if (animate) {
        gsap.to(track, { x: targetX, duration: 0.8, ease: "power3.inOut" });
      } else {
        gsap.set(track, { x: targetX });
      }
    };

    const goToSlide = (newIndex) => {
      if (newIndex === currentIndex && newIndex !== 0) return;

      const oldContent = contents[currentIndex];
      const newContent = contents[newIndex];
      const oldDot = dots[currentIndex];
      const oldLine = lines[currentIndex];
      const newDot = dots[newIndex];
      const newLine = lines[newIndex];

      if (oldContent !== newContent) {
        gsap.to(oldContent, {
          opacity: 0,
          filter: "blur(15px)",
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => gsap.set(oldContent, { visibility: "hidden" }),
        });
      }

      if (oldDot !== newDot) {
        gsap.to(oldDot, {
          borderColor: " rgba(255, 255, 255, 0.20)",
          duration: 0.4,
          ease: "power2.inOut",
        });
        gsap.to(oldLine, { scaleX: 0, duration: 0.4, ease: "power2.inOut" });
      }

      gsap.set(newContent, { visibility: "visible" });
      gsap.fromTo(
        newContent,
        { opacity: 0, filter: "blur(15px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          delay: 0.2,
          ease: "power2.out",
        }
      );

      gsap.to(newDot, {
        borderColor: activeDotColor,
        duration: 0.4,
        delay: 0.2,
        ease: "power2.inOut",
      });
      gsap.to(newLine, {
        scaleX: 1,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      });

      centerTrack(newIndex, true);

      currentIndex = newIndex;
    };

    gsap.set(contents, {
      opacity: 0,
      visibility: "hidden",
      filter: "blur(15px)",
    });

    gsap.set(dots, { borderColor: " rgba(255, 255, 255, 0.20)" });
    gsap.set(lines, { scaleX: 0 });

    requestAnimationFrame(() => {
      centerTrack(currentIndex, false);
      goToSlide(currentIndex);
    });

    const handleNext = () => goToSlide((currentIndex + 1) % items.length);
    const handlePrev = () =>
      goToSlide((currentIndex - 1 + items.length) % items.length);

    btnNext.addEventListener("click", handleNext);
    btnPrev.addEventListener("click", handlePrev);

    const itemClicks = [];
    items.forEach((item, index) => {
      const handler = () => goToSlide(index);
      item.addEventListener("click", handler);
      itemClicks.push({ item, handler });
    });

    window.addEventListener("resize", () => centerTrack(currentIndex, false));

    return () => {
      btnNext.removeEventListener("click", handleNext);
      btnPrev.removeEventListener("click", handlePrev);
      itemClicks.forEach((obj) =>
        obj.item.removeEventListener("click", obj.handler)
      );
      gsap.killTweensOf([contents, track, dots, lines]);
      gsap.set([contents, track, dots, lines], { clearProps: "all" });
    };
  });

  mm.add("(max-width: 767px)", () => {
    items.forEach((item, index) => {
      if (contents[index]) {
        item.appendChild(contents[index]);

        gsap.set(contents[index], {
          opacity: 1,
          visibility: "visible",
          filter: "blur(0px)",
        });
      }
    });

    return () => {
      contents.forEach((content) => {
        contentWrapper.appendChild(content);
      });
    };
  });
}

function initGallerySlider() {
  const MIN_SLIDES = 10;
  const sliders = document.querySelectorAll(".gallery_slider");

  if (sliders.length === 0 || typeof Swiper === "undefined") return;

  sliders.forEach((slider) => {
    const layout = slider.closest(".gallery_layout");
    const wrapper = slider.querySelector(".swiper-wrapper");

    if (!layout || !wrapper) return;

    const originalSlides = Array.from(wrapper.children);

    if (originalSlides.length > 0) {
      let i = 0;
      while (wrapper.children.length < MIN_SLIDES) {
        wrapper.appendChild(
          originalSlides[i % originalSlides.length].cloneNode(true)
        );
        i++;
      }
    }

    new Swiper(slider, {
      slidesPerView: "auto",
      spaceBetween: 18,
      loop: true,
      slideClass: "gallery_item_wrap",
      navigation: {
        nextEl: layout.querySelector('[data-button="next"]'),
        prevEl: layout.querySelector('[data-button="prev"]'),
      },
      pagination: {
        el: layout.querySelector(".v-line"),
        type: "progressbar",
      },
    });
  });
}

function initTabTestimonial() {
  const tabs = document.querySelectorAll(".partnerships_tab_item");
  const contents = document.querySelectorAll(".partnerships_item_wrap");

  if (tabs.length === 0 || contents.length === 0) return;

  let currentIndex = 0;
  let isAnimating = false;

  tabs[0].classList.add("is-active");

  gsap.set(contents[0], {
    autoAlpha: 1,
    filter: "blur(0px)",
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (index === currentIndex || isAnimating) return;

      if (!contents[index]) {
        console.warn(
          `Data konten untuk tab index ke-${index} belum ada di CMS/HTML.`
        );
        return;
      }

      isAnimating = true;

      const oldTab = tabs[currentIndex];
      const oldContent = contents[currentIndex];
      const newContent = contents[index];

      oldTab.classList.remove("is-active");
      tab.classList.add("is-active");

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          currentIndex = index;
        },
      });

      tl.to(
        oldContent,
        {
          duration: 0.4,
          autoAlpha: 0,
          filter: "blur(10px)",
          ease: "power2.inOut",
        },
        0
      ).to(
        newContent,
        {
          duration: 0.4,
          autoAlpha: 1,
          filter: "blur(0px)",
          ease: "power2.inOut",
        },
        0
      );
    });
  });
}

function initCasesAnimation() {
  const items = document.querySelectorAll(".cases_item_wrap");
  if (items.length === 0) return;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", (context) => {
    let activeItem = items[0];

    items.forEach((item, index) => {
      const contentWrap = item.querySelector(".cases_item_content_wrap");
      const content = item.querySelector(".cases_item_content");
      const thumbText = item.querySelector(".cases_thumb_text");
      const visual = item.querySelector(".cases_item_visual");

      if (index === 0) {
        gsap.set(item, { flexGrow: 1 });
        gsap.set(contentWrap, { flexGrow: 1, width: "100%" });
        gsap.set(visual, { width: 288, height: 380 });
        gsap.set(thumbText, { opacity: 0 });
        gsap.set(content, {
          opacity: 1,
          visibility: "visible",
          filter: "blur(0px)",
        });
      } else {
        gsap.set(item, { flexGrow: 0 });
        gsap.set(contentWrap, { flexGrow: 0, width: 0 });
        gsap.set(visual, { width: 178, height: 128 });
        gsap.set(thumbText, { opacity: 1 });
        gsap.set(content, {
          opacity: 0,
          visibility: "hidden",
          filter: "blur(10px)",
        });
      }
    });

    const handleMouseEnter = (e) => {
      const item = e.currentTarget;
      if (item === activeItem) return;

      const prevItem = activeItem;
      activeItem = item;

      const prevContentWrap = prevItem.querySelector(
        ".cases_item_content_wrap"
      );
      const prevContent = prevItem.querySelector(".cases_item_content");
      const prevThumbText = prevItem.querySelector(".cases_thumb_text");
      const prevVisual = prevItem.querySelector(".cases_item_visual");

      const newContentWrap = activeItem.querySelector(
        ".cases_item_content_wrap"
      );
      const newContent = activeItem.querySelector(".cases_item_content");
      const newThumbText = activeItem.querySelector(".cases_thumb_text");
      const newVisual = activeItem.querySelector(".cases_item_visual");

      gsap.killTweensOf([
        prevItem,
        prevContentWrap,
        prevContent,
        prevThumbText,
        prevVisual,
        activeItem,
        newContentWrap,
        newContent,
        newThumbText,
        newVisual,
      ]);

      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

      tl.to(prevContent, {
        opacity: 0,
        filter: "blur(10px)",
        duration: 0.2,
        onComplete: () => gsap.set(prevContent, { visibility: "hidden" }),
      });

      tl.to(prevItem, { flexGrow: 0, duration: 0.5 }, "expand")
        .to(prevContentWrap, { flexGrow: 0, width: 0, duration: 0.5 }, "expand")
        .to(prevVisual, { width: 178, height: 128, duration: 0.5 }, "expand")
        .to(prevThumbText, { opacity: 1, duration: 0.3 }, "expand+=0.2")

        .to(activeItem, { flexGrow: 1, duration: 0.5 }, "expand")
        .to(
          newContentWrap,
          { flexGrow: 1, width: "100%", duration: 0.5 },
          "expand"
        )
        .to(newVisual, { width: 288, height: 380, duration: 0.5 }, "expand")
        .to(newThumbText, { opacity: 0, duration: 0.3 }, "expand");

      tl.set(newContent, { visibility: "visible" }, "-=0.1").to(
        newContent,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.4,
        },
        "-=0.1"
      );
    };

    items.forEach((item) => {
      item.addEventListener("mouseenter", handleMouseEnter);
    });

    return () => {
      items.forEach((item) => {
        item.removeEventListener("mouseenter", handleMouseEnter);
      });
    };
  });
}

function initWhyMobile() {
  const desktopWrap = document.querySelector(".why_content");
  if (!desktopWrap) return;

  const desktopItems = desktopWrap.querySelectorAll(".why_item_wrap");
  if (desktopItems.length < 2) return;

  const itemTrad = desktopItems[0];
  const itemLcx = desktopItems[1];

  const mobileHeadContainer = document.querySelector(".why_mobile_head");
  const mobileListContainer = document.querySelector(".why_mobile_list");
  if (!mobileHeadContainer || !mobileListContainer) return;

  mobileHeadContainer.innerHTML = "";

  const headTradClone = itemTrad
    .querySelector(".why_item_head")
    .cloneNode(true);
  const headLcxClone = itemLcx.querySelector(".why_item_head").cloneNode(true);

  mobileHeadContainer.appendChild(headTradClone);
  mobileHeadContainer.appendChild(headLcxClone);

  const titleTrad =
    itemTrad
      .querySelector(".why_item_head h3, .why_item_head .c-heading")
      ?.textContent.trim() || "Traditional Pooling";
  const titleLcx =
    itemLcx
      .querySelector(".why_item_head h3, .why_item_head .c-heading")
      ?.textContent.trim() || "LCX Nexus";

  const listsTrad = itemTrad.querySelectorAll(".why_item_content li");
  const listsLcx = itemLcx.querySelectorAll(".why_item_content li");

  mobileListContainer.innerHTML = "";

  const iconLcx = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none" class="why_mobile_icon"><path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM15.535 8.381L10.585 13.331L8.465 11.21C8.37216 11.1171 8.26192 11.0434 8.14059 10.9931C8.01926 10.9428 7.8892 10.9168 7.75785 10.9168C7.49258 10.9167 7.23814 11.022 7.0505 11.2095C6.86286 11.397 6.75739 11.6514 6.7573 11.9166C6.7572 12.1819 6.86249 12.4364 7.05 12.624L9.808 15.382C9.91015 15.4842 10.0314 15.5653 10.1649 15.6206C10.2984 15.6759 10.4415 15.7044 10.586 15.7044C10.7305 15.7044 10.8736 15.6759 11.0071 15.6206C11.1406 15.5653 11.2618 15.4842 11.364 15.382L16.95 9.796C17.1376 9.60836 17.2431 9.35386 17.2431 9.0885C17.2431 8.82314 17.1376 8.56864 16.95 8.381C16.7624 8.19336 16.5079 8.08794 16.2425 8.08794C15.9771 8.08794 15.7226 8.19336 15.535 8.381Z" fill="#00E4C4"></path></svg>`;

  const iconTrad = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 23 23" fill="none" class="why_mobile_icon"><path d="M11.5 1.9375C5.89375 1.9375 1.4375 6.39375 1.4375 12C1.4375 17.6062 5.89375 22.0625 11.5 22.0625C17.1062 22.0625 21.5625 17.6062 21.5625 12C21.5625 6.39375 17.1062 1.9375 11.5 1.9375ZM15.3812 17.0312L11.5 13.15L7.61875 17.0312L6.46875 15.8812L10.35 12L6.46875 8.11875L7.61875 6.96875L11.5 10.85L15.3812 6.96875L16.5312 8.11875L12.65 12L16.5312 15.8812L15.3812 17.0312Z" fill="white" fill-opacity="0.2"></path></svg>`;

  const maxLength = Math.max(listsTrad.length, listsLcx.length);

  for (let i = 0; i < maxLength; i++) {
    const textTrad = listsTrad[i] ? listsTrad[i].textContent.trim() : "";
    const textLcx = listsLcx[i] ? listsLcx[i].textContent.trim() : "";

    const mobileItem = document.createElement("div");
    mobileItem.className = "why_mobile_item";

    mobileItem.innerHTML = `
          <div class="why_mobile_item_content">
              <div class="why_mobile_title">
                  ${iconLcx}
                  <div class="why_mobile_text u-text-style-small">${titleLcx}</div>
              </div>
              <p class="why_mobile_text u-text-style-small">${textLcx}</p>
          </div>
          
          <div class="why_mobile_item_content">
              <div class="why_mobile_title">
                  ${iconTrad}
                  <div class="why_mobile_text u-text-style-small">${titleTrad}</div>
              </div>
              <p class="why_mobile_text u-text-style-small">${textTrad}</p>
          </div>
      `;

    mobileListContainer.appendChild(mobileItem);
  }
}

function initFilterNews() {
  const items = Array.from(document.querySelectorAll(".news_item_wrap"));
  const tabWrap = document.querySelector(".news_tab_wrap");
  const templateTab = document.querySelector('[data-type="All"]');

  const uniqueTags = new Set();

  items.forEach((item) => {
    const tagElement = item.querySelector("[data-tag]");
    if (tagElement) {
      const tagValue = tagElement.getAttribute("data-tag");
      item.dataset.filterTag = tagValue;
      uniqueTags.add(tagValue);
    }
  });

  uniqueTags.forEach((tag) => {
    const newTab = templateTab.cloneNode(true);
    newTab.setAttribute("data-type", tag);

    const textElement = newTab.querySelector(".news_tab_text");
    if (textElement) textElement.textContent = tag;

    tabWrap.appendChild(newTab);
  });

  const allTabs = document.querySelectorAll(".news_tab_item");

  function applyFilter(filterType) {
    allTabs.forEach((tab) => {
      if (tab.dataset.type === filterType) {
        tab.classList.add("is-active");
      } else {
        tab.classList.remove("is-active");
      }
    });

    let isFirstVisible = true;
    const visibleItems = [];

    items.forEach((item) => {
      item.classList.remove("is-featured");
      gsap.set(item, { clearProps: "opacity,transform" });

      if (filterType === "All" || item.dataset.filterTag === filterType) {
        item.classList.remove("is-hidden");
        visibleItems.push(item);

        if (isFirstVisible) {
          item.classList.add("is-featured");
          isFirstVisible = false;
        }
      } else {
        item.classList.add("is-hidden");
      }
    });

    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === "newsStagger") st.kill();
    });

    ScrollTrigger.refresh();

    ScrollTrigger.batch(visibleItems, {
      id: "newsStagger",
      start: "top 85%",
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: true,
        });
      },
    });
  }

  allTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilter(tab.dataset.type);
    });
  });

  applyFilter("All");
}

function initRevealAnimation() {
  const items = gsap.utils.toArray("[data-reveal-animation]");
  if (items.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  items.forEach((item) => {
    if (prefersReducedMotion) {
      gsap.set(item, {
        "--reveal": "100%",
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      });
      return;
    }

    gsap.set(item, {
      "--reveal": "0%",
      opacity: 0,
      y: 20,
      filter: "blur(6px)",
    });

    gsap.to(item, {
      "--reveal": "100%",
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });
}

function initHighlightAnimation() {
  const items = gsap.utils.toArray("[data-highlight-animation]");
  if (items.length === 0 || typeof SplitText === "undefined") return;

  const ICON_SELECTOR = "[data-highlight-icon], .about_icon";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  items.forEach((item) => {
    const icons = gsap.utils.toArray(item.querySelectorAll(ICON_SELECTOR));

    const split = SplitText.create(item, {
      type: "words",
      wordsClass: "highlight_word",
      ignore: ICON_SELECTOR,
    });

    if (prefersReducedMotion) {
      gsap.set(split.words, { opacity: 1 });
      gsap.set(icons, { opacity: 1, scale: 1 });
      return;
    }

    gsap.set(split.words, { opacity: 0.4 });
    gsap.set(icons, { opacity: 0, scale: 0, transformOrigin: "center center" });

    const iconMarks = [];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top 75%",
        end: "bottom 55%",
        scrub: true,
        onUpdate: (self) => {
          iconMarks.forEach((mark) => {
            if (mark.played || self.progress < mark.progress) return;
            mark.played = true;
            gsap.to(mark.icon, {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: "bounce.out",
            });
          });
        },
      },
    });

    let wordCursor = 0;

    icons.forEach((icon, i) => {
      const wordsBeforeIcon = split.words
        .slice(wordCursor)
        .filter(
          (word) =>
            word.compareDocumentPosition(icon) &
            Node.DOCUMENT_POSITION_FOLLOWING
        );

      if (wordsBeforeIcon.length > 0) {
        tl.to(wordsBeforeIcon, { opacity: 1, stagger: 0.3, ease: "none" });
        wordCursor += wordsBeforeIcon.length;
      }

      tl.addLabel(`icon${i}`);
      iconMarks.push({ icon, played: false, progress: 0 });
    });

    const wordsAfterIcons = split.words.slice(wordCursor);
    if (wordsAfterIcons.length > 0) {
      tl.to(wordsAfterIcons, { opacity: 1, stagger: 0.3, ease: "none" });
    }

    iconMarks.forEach((mark, i) => {
      mark.progress = tl.labels[`icon${i}`] / tl.duration();
    });
  });
}

function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const initFlag = "data-odometer-initialized";
  const activeTweens = new WeakMap();

  const defaults = {
    duration: 1,
    ease: "power3.out",
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: "power2.out",
    triggerStart: "top 80%",
    staggerOrder: "left",
    digitCycles: 2,
  };

  document.querySelectorAll("[data-odometer-group]").forEach((group) => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, "");

    const elements = Array.from(
      group.querySelectorAll("[data-odometer-element]")
    );
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder =
      group.getAttribute("data-odometer-stagger-order") ||
      defaults.staggerOrder;
    const triggerStart =
      group.getAttribute("data-odometer-trigger-start") ||
      defaults.triggerStart;
    const elementStagger =
      parseFloat(group.getAttribute("data-odometer-stagger")) ||
      defaults.elementStagger;

    const elementData = elements.map((el) => {
      const originalText = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute("data-odometer-start");
      const startValue =
        parseFloat(el.getAttribute("data-odometer-start")) || 0;
      const duration =
        parseFloat(el.getAttribute("data-odometer-duration")) ||
        defaults.duration;
      const step = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map((revealEl) => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: "hidden" });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText, step }) => {
          cleanupElement(el, originalText);
        });
      },
    });

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(
          el,
          {
            width: widthEm + "em",
            opacity: 1,
            duration: defaults.revealDuration,
            ease: defaults.revealEase,
          },
          offset
        );
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(
          roller,
          {
            y: -targetPos * step + "em",
            duration,
            ease: defaults.ease,
            force3D: true,
          },
          offset + reversedIdx * defaults.digitStagger
        );
      });
    });
  });

  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease = options.ease || defaults.ease;
    const step = getLineHeightRatio(el);

    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      gsap.set(el, { clearProps: "width,overflow" });
    }

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments = parseSegments(currentText);
    const startDigitsStr = startSegments
      .filter((s) => s.type === "digit")
      .map((s) => s.char)
      .join("");
    const startValue = parseInt(startDigitsStr, 10) || 0;

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) {
      gsap.set(el, { width: oldWidthEm + "em", overflow: "hidden" });
    }

    const tl = gsap.timeline({
      onComplete() {
        cleanupElement(el, newText);
        activeTweens.delete(el);
      },
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(
        el,
        {
          width: newWidthEm + "em",
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    }

    revealEls.forEach((revealEl) => {
      if (revealEl.getAttribute("data-odometer-part") === "static") {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
      }
    });

    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(
        roller,
        {
          y: -targetPos * step + "em",
          duration,
          ease,
          force3D: true,
        },
        reversedIdx * defaults.digitStagger
      );
    });
  };

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === "normal") return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text) {
    return [...text].map((char) => ({
      type: /\d/.test(char) ? "digit" : "static",
      char,
    }));
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter((s) => s.type === "digit");
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, "0")
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map((s) =>
      s.type === "digit" ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
    );
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter((s) => s.type === "digit").length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
    return segments.map((seg) => {
      if (seg.type === "digit") {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      const hidden = firstDigitSeen && prevDigitHidden;
      return { ...seg, hidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute("data-odometer-grow")) {
      return el.getAttribute("data-odometer-grow") !== "false";
    }
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter((s) => s.type === "digit").length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = "";
    el.style.height = "";
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach((seg) => {
      if (seg.type === "static") {
        const span = document.createElement("span");
        span.setAttribute("data-odometer-part", "static");
        span.style.height = step + "em";
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 });
          revealEls.push(span);
        }
        return;
      }
      const mask = document.createElement("span");
      mask.setAttribute("data-odometer-part", "mask");
      mask.style.height = step + "em";
      mask.style.lineHeight = step;
      const roller = document.createElement("span");
      roller.setAttribute("data-odometer-part", "roller");
      roller.style.lineHeight = step;

      const digits = [];
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10);
      }
      roller.textContent = digits.join("\n");
      mask.appendChild(roller);
      el.appendChild(mask);
      const startDigit = seg.startDigit || 0;
      const isReveal = grow && seg.hidden;
      gsap.set(roller, {
        y: isReveal ? step + "em" : -startDigit * step + "em",
      });
      const endDigit = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });
    return { rollers, revealEls };
  }

  function cleanupElement(el, originalText) {
    el.style.overflow = "";
    el.style.height = "";

    const digits = [...originalText].filter((c) => /\d/.test(c));
    let di = 0;

    el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || "";
      mask.style.opacity = "";
      mask.style.overflow = "";
    });

    el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
      stat.style.opacity = "";
    });
  }

  function recalcOnResize() {
    document.querySelectorAll("[data-odometer-element]").forEach((el) => {
      const running = activeTweens.get(el);
      if (running) {
        running.progress(1);
        activeTweens.delete(el);
      }

      const hasRollers = el.querySelector('[data-odometer-part="roller"]');

      if (hasRollers) {
        const step = getLineHeightRatio(el);
        el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
          mask.style.height = step + "em";
          mask.style.lineHeight = step;
        });
        el.querySelectorAll('[data-odometer-part="roller"]').forEach(
          (roller) => {
            roller.style.lineHeight = step;
          }
        );
        el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
          stat.style.lineHeight = step;
        });
      }
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  });

  function applyStaggerOrder(items, order) {
    const arr = [...items];
    if (order === "right") return arr.reverse();
    if (order === "random") return shuffleArray(arr);
    return arr;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

function initAudienceStack() {
  const layouts = document.querySelectorAll(".audience_layout");
  if (layouts.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    layouts.forEach((layout) => {
      const items = gsap.utils.toArray(
        layout.querySelectorAll(".audience_item_wrap")
      );

      items.slice(0, -1).forEach((item) => {
        gsap.to(item, {
          filter: "blur(8px)",
          scale: 0.9,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    });

    return () => {
      layouts.forEach((layout) => {
        gsap.set(layout.querySelectorAll(".audience_item_wrap"), {
          clearProps: "filter,scale,transformOrigin",
        });
      });
    };
  });
}

function initFunction() {
  initRevealAnimation();
  initNumberOdometer();
  initHighlightAnimation();
  initNavScroll();
  initDeveloped();
  initHow();
  initSlider();
  initGallerySlider();
  initTabTestimonial();
  initCasesAnimation();
  initWhyMobile();
  initFilterNews();
  initAudienceStack();
}

document.addEventListener("DOMContentLoaded", initFunction);
