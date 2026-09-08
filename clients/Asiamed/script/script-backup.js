
const emailValidation = () => {
    // Select all input fields with type="email"
    const emailInputs = document.querySelectorAll('input[type="email"]');

    if (!emailInputs.length) return;

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
};
document.addEventListener('DOMContentLoaded', function () {
    emailValidation();
});

const telInputValidation = () => {
    // Select all input fields with type="tel"
    const telInputs = document.querySelectorAll('input[type="tel"]');

    if (!telInputs) return;

    telInputs.forEach((telInput) => {
        const errorMsgElement = telInput.nextElementSibling;

        if (
            !errorMsgElement ||
            errorMsgElement.getAttribute("data-input-form") !== "error-msg"
        ) {
            console.error(
                "Could not find the error message element for a telephone input.",
                telInput
            );
            return;
        }

        telInput.addEventListener("input", function (event) {
            const originalValue = this.value;
            // Remove any character that is not a digit, except for a leading '+'
            let sanitizedValue = originalValue.replace(/[^\d+]/g, "");

            // Ensure '+' only appears at the beginning
            if (sanitizedValue.lastIndexOf("+") > 0) {
                sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
            }

            // If the first character is not a digit or a plus, remove it
            if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue)) {
                sanitizedValue = sanitizedValue.substring(1);
            }

            // Update the input's value only if it changed
            if (originalValue !== sanitizedValue) {
                this.value = sanitizedValue;
            }

            // Simple validation check for the error message
            // (Can be customized, e.g., to check for minimum length)
            if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
                showError("Only numbers and a leading + are allowed.", errorMsgElement);
            } else {
                hideError(errorMsgElement);
            }
        });

        // Helper functions to show/hide errors (if not already present)
        function showError(message, element) {
            element.textContent = message;
            element.style.display = "block";
        }

        function hideError(element) {
            element.style.display = "none";
        }
    });
};
document.addEventListener('DOMContentLoaded', function () {
    telInputValidation();
});


// Odometer
// Resource
function initNumberOdometer() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const initFlag = 'data-odometer-initialized'
    const activeTweens = new WeakMap()

    // Configuration
    const defaults = {
        duration: 1,
        ease: 'power3.out',
        elementStagger: 0.1,
        digitStagger: 0.04,
        revealDuration: 0.5,
        revealEase: 'power2.out',
        triggerStart: 'top 80%',
        staggerOrder: 'left',
        digitCycles: 2
    }

    // Scroll-triggered groups
    document.querySelectorAll('[data-odometer-group]').forEach(group => {
        if (group.hasAttribute(initFlag)) return
        group.setAttribute(initFlag, '')

        const elements = Array.from(group.querySelectorAll('[data-odometer-element]'))
        if (!elements.length || prefersReducedMotion) return

        const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder
        const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart
        const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger

        const elementData = elements.map(el => {
            const originalText = el.textContent.trim()
            const hasExplicitStart = el.hasAttribute('data-odometer-start')
            const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0
            const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration
            const step = getLineHeightRatio(el)

            let segments = parseSegments(originalText)
            segments = mapStartDigits(segments, startValue)
            segments = markHiddenSegments(segments, startValue)

            const grow = shouldGrow(el, hasExplicitStart, startValue, segments)
            const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow)

            const fontSize = parseFloat(getComputedStyle(el).fontSize)
            const revealData = revealEls.map(revealEl => {
                const widthEm = revealEl.offsetWidth / fontSize
                gsap.set(revealEl, { width: 0, overflow: 'hidden' })
                return { el: revealEl, widthEm }
            })

            return { el, rollers, duration, step, revealData, originalText }
        })

        const ordered = applyStaggerOrder(elementData, staggerOrder)

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: group,
                start: triggerStart,
                once: true
            },
            onComplete() {
                elementData.forEach(({ el, originalText, step }) => {
                    cleanupElement(el, originalText)
                })
            }
        })

        ordered.forEach((data, orderIdx) => {
            const { rollers, duration, step, revealData } = data
            const offset = orderIdx * elementStagger

            revealData.forEach(({ el, widthEm }) => {
                tl.to(el, {
                    width: widthEm + 'em',
                    opacity: 1,
                    duration: defaults.revealDuration,
                    ease: defaults.revealEase
                }, offset)
            })

            rollers.forEach(({ roller, targetPos }, digitIdx) => {
                const reversedIdx = rollers.length - 1 - digitIdx
                tl.to(roller, {
                    y: -targetPos * step + 'em',
                    duration,
                    ease: defaults.ease,
                    force3D: true
                }, offset + reversedIdx * defaults.digitStagger)
            })
        })
    })

    // Programmatic update (optional add-on)
    return function updateOdometer(el, newText, options = {}) {
        const currentText = el.textContent.trim()
        if (currentText === newText) return

        const duration = options.duration || defaults.duration
        const ease = options.ease || defaults.ease
        const step = getLineHeightRatio(el)

        // Kill any running animation and clear its inline style locks
        const existing = activeTweens.get(el)
        if (existing) {
            existing.kill()
            gsap.set(el, { clearProps: 'width,overflow' })
        }

        // Measure current width before rebuilding (in em for responsive scaling)
        const fontSize = parseFloat(getComputedStyle(el).fontSize)
        const oldWidthEm = el.getBoundingClientRect().width / fontSize

        // Parse current text as start, new text as end
        const startSegments = parseSegments(currentText)
        const startDigitsStr = startSegments
            .filter(s => s.type === 'digit')
            .map(s => s.char)
            .join('')
        const startValue = parseInt(startDigitsStr, 10) || 0

        let segments = parseSegments(newText)
        segments = mapStartDigits(segments, startValue)
        segments = markHiddenSegments(segments, startValue)
        const { rollers, revealEls } = buildRollerDOM(el, segments, step, true)

        // Measure new natural width (in em)
        const newWidthEm = el.getBoundingClientRect().width / fontSize
        const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01

        // Lock to old width for smooth transition
        if (widthChanged) {
            gsap.set(el, { width: oldWidthEm + 'em', overflow: 'hidden' })
        }

        const tl = gsap.timeline({
            onComplete() {
                cleanupElement(el, newText)
                activeTweens.delete(el)
            }
        })
        activeTweens.set(el, tl)

        // Animate element width
        if (widthChanged) {
            tl.to(el, {
                width: newWidthEm + 'em',
                duration: defaults.revealDuration,
                ease: defaults.revealEase
            }, 0)
        }

        // Fade in hidden statics
        revealEls.forEach(revealEl => {
            if (revealEl.getAttribute('data-odometer-part') === 'static') {
                tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0)
            }
        })

        // Roll digits
        rollers.forEach(({ roller, targetPos }, digitIdx) => {
            const reversedIdx = rollers.length - 1 - digitIdx
            tl.to(roller, {
                y: -targetPos * step + 'em',
                duration,
                ease,
                force3D: true
            }, reversedIdx * defaults.digitStagger)
        })
    }

    // Helpers
    function getLineHeightRatio(el) {
        const cs = getComputedStyle(el)
        const lh = cs.lineHeight
        if (lh === 'normal') return 1.2
        return parseFloat(lh) / parseFloat(cs.fontSize)
    }

    function parseSegments(text) {
        return [...text].map(char => ({
            type: /\d/.test(char) ? 'digit' : 'static',
            char
        }))
    }

    function mapStartDigits(segments, startValue) {
        const digitSlots = segments.filter(s => s.type === 'digit')
        const padded = String(Math.floor(Math.abs(startValue)))
            .padStart(digitSlots.length, '0')
            .slice(-digitSlots.length)
        let di = 0
        return segments.map(s =>
            s.type === 'digit'
                ? { ...s, startDigit: parseInt(padded[di++], 10) }
                : s
        )
    }

    function markHiddenSegments(segments, startValue) {
        const totalDigits = segments.filter(s => s.type === 'digit').length
        const absStart = Math.floor(Math.abs(startValue))
        const startDigitCount = absStart === 0 ? 1 : String(absStart).length
        const leadingZeros = Math.max(0, totalDigits - startDigitCount)
        if (leadingZeros === 0) return segments
        let digitsSeen = 0
        let firstDigitSeen = false
        let prevDigitHidden = false
        return segments.map(seg => {
            if (seg.type === 'digit') {
                firstDigitSeen = true
                const hidden = digitsSeen < leadingZeros
                prevDigitHidden = hidden
                digitsSeen++
                return { ...seg, hidden }
            }
            const hidden = firstDigitSeen && prevDigitHidden
            return { ...seg, hidden }
        })
    }

    function shouldGrow(el, hasExplicitStart, startValue, segments) {
        if (el.hasAttribute('data-odometer-grow')) {
            return el.getAttribute('data-odometer-grow') !== 'false'
        }
        if (!hasExplicitStart) return false
        const absStart = Math.floor(Math.abs(startValue))
        const startDigitCount = absStart === 0 ? 1 : String(absStart).length
        const endDigitCount = segments.filter(s => s.type === 'digit').length
        return startDigitCount < endDigitCount
    }

    function buildRollerDOM(el, segments, step, grow) {
        el.innerHTML = ''
        el.style.height = ''
        const rollers = []
        const revealEls = []
        const totalCells = 10 * defaults.digitCycles
        segments.forEach(seg => {
            if (seg.type === 'static') {
                const span = document.createElement('span')
                span.setAttribute('data-odometer-part', 'static')
                span.style.height = step + 'em'
                span.style.lineHeight = step
                span.textContent = seg.char
                el.appendChild(span)
                if (grow && seg.hidden) {
                    gsap.set(span, { opacity: 0 })
                    revealEls.push(span)
                }
                return
            }
            const mask = document.createElement('span')
            mask.setAttribute('data-odometer-part', 'mask')
            mask.style.height = step + 'em'
            mask.style.lineHeight = step
            const roller = document.createElement('span')
            roller.setAttribute('data-odometer-part', 'roller')
            roller.style.lineHeight = step

            const digits = []
            for (let d = 0; d < totalCells; d++) {
                digits.push(d % 10)
            }
            roller.textContent = digits.join('\n')
            mask.appendChild(roller)
            el.appendChild(mask)
            const startDigit = seg.startDigit || 0
            const isReveal = grow && seg.hidden
            gsap.set(roller, { y: isReveal ? step + 'em' : -startDigit * step + 'em' })
            const endDigit = parseInt(seg.char, 10)
            const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit
            rollers.push({ roller, targetPos })
            if (isReveal) revealEls.push(mask)
        })
        return { rollers, revealEls }
    }

    function cleanupElement(el, originalText) {
        el.style.overflow = ''
        el.style.height = ''

        // Remove rollers, set final digit, clear inline bloat (but preserve width)
        const digits = [...originalText].filter(c => /\d/.test(c))
        let di = 0

        el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
            const roller = mask.querySelector('[data-odometer-part="roller"]')
            if (roller) roller.remove()
            mask.textContent = digits[di++] || ''
            mask.style.opacity = ''
            mask.style.overflow = ''
        })

        el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
            stat.style.opacity = ''
        })
    }

    function recalcOnResize() {
        document.querySelectorAll('[data-odometer-element]').forEach(el => {
            // Force-complete any running programmatic animation
            const running = activeTweens.get(el)
            if (running) {
                running.progress(1)
                activeTweens.delete(el)
            }

            const hasRollers = el.querySelector('[data-odometer-part="roller"]')

            if (hasRollers) {
                // Pre-triggered: recalculate step-based inline styles
                const step = getLineHeightRatio(el)
                el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
                    mask.style.height = step + 'em'
                    mask.style.lineHeight = step
                })
                el.querySelectorAll('[data-odometer-part="roller"]').forEach(roller => {
                    roller.style.lineHeight = step
                })
                el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
                    stat.style.lineHeight = step
                })
            }
            // Completed elements: width is em-based, scales automatically, don't touch
        })
        ScrollTrigger.refresh()
    }

    let resizeTimer
    let lastWidth = window.innerWidth
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
            if (window.innerWidth === lastWidth) return
            lastWidth = window.innerWidth
            recalcOnResize()
        }, 250)
    })

    function applyStaggerOrder(items, order) {
        const arr = [...items]
        if (order === 'right') return arr.reverse()
        if (order === 'random') return shuffleArray(arr)
        return arr
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }
}

// Initialize Number Odometer
document.addEventListener("DOMContentLoaded", () => {
    initNumberOdometer();
})


document.addEventListener("DOMContentLoaded", function () {

    // Pad Zero
    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }

    // Update Pagination
    function updatePagination(swiperInstance) {
        const currentCountEl = document.querySelector('.technic_count.is-count');
        const totalCountEl = document.querySelector('.technic_count.is-total');

        if (currentCountEl) currentCountEl.textContent = padZero(swiperInstance.realIndex + 1);
        if (totalCountEl) totalCountEl.textContent = padZero(swiperInstance.slides.length);
    }

    // Init Technic Swiper
    function initTechnicSwiper() {
        const swiperElement = document.querySelector('.swiper.is-technic');
        if (!swiperElement) return;

        const swiper = new Swiper('.swiper.is-technic', {
            slidesPerView: 1,
            effect: 'fade',
            fadeEffect: { crossFade: true },
            slideClass: 'swiper-slides',
            navigation: {
                nextEl: '.technic_nav_button.is-next',
                prevEl: '.technic_nav_button.is-prev',
            },
            on: {
                init: function () { updatePagination(this); },
                slideChange: function () { updatePagination(this); }
            }
        });
    }

    // Init Button Hover Animation
    function initTextHoverAnimation(wrapperSelector, textSelector) {
        if (typeof SplitText === 'undefined' || typeof gsap === 'undefined') return;

        const wrappers = document.querySelectorAll(wrapperSelector);
        wrappers.forEach(wrapper => {
            const textEl = wrapper.querySelector(textSelector);
            if (!textEl) return;

            const textContainer = document.createElement('div');
            textContainer.style.position = 'relative';
            textContainer.style.overflow = 'hidden';
            textContainer.style.display = 'inline-flex';

            textEl.parentNode.insertBefore(textContainer, textEl);
            textContainer.appendChild(textEl);

            const cloneEl = textEl.cloneNode(true);
            cloneEl.style.position = 'absolute';
            cloneEl.style.top = '100%';
            cloneEl.style.left = '0';
            textContainer.appendChild(cloneEl);

            const splitOriginal = SplitText.create(textEl, { type: "chars" });
            const splitClone = SplitText.create(cloneEl, { type: "chars" });

            const tl = gsap.timeline({ paused: true });
            tl.to(splitOriginal.chars, {
                yPercent: -100,
                duration: 0.4,
                stagger: 0.02,
                ease: "power3.inOut"
            }, 0);

            tl.to(splitClone.chars, {
                yPercent: -100,
                duration: 0.4,
                stagger: 0.02,
                ease: "power3.inOut"
            }, 0);

            wrapper.addEventListener('mouseenter', () => tl.play());
            wrapper.addEventListener('mouseleave', () => tl.reverse());
        });
    }

    // Init Scroll Opacity Animation
    function initScrollOpacityAnimation() {
        if (typeof SplitText === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("GSAP, SplitText, or ScrollTrigger is missing.");
            return;
        }

        // Register ScrollTrigger just in case
        gsap.registerPlugin(ScrollTrigger, SplitText);

        const elements = document.querySelectorAll('[data-scroll-animation="opacity"]');

        elements.forEach(el => {
            // Split the text per word
            const splitText = SplitText.create(el, { type: "words" });

            // Initial inactive state
            gsap.set(splitText.words, { opacity: 0.2 });

            // Animate using keyframes to create the "Color Wave" leading edge effect
            gsap.to(splitText.words, {
                keyframes: [
                    // Step 1: Glow! Word lights up to 100% opacity with the brand color #B03420
                    { opacity: 1, color: "#B03420", duration: 0.3, ease: "power2.out" },
                    // Step 2: Cool down! Word fades back to the original CSS text color
                    { color: "", duration: 0.5, ease: "power2.inOut" }
                ],
                stagger: 0.05,
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",   // Start animation when element is 80% down the viewport
                    end: "bottom 50%",  // End when bottom of element hits middle of viewport
                    scrub: 0.5          // 0.5s smoothing effect on scrub
                }
            });
        });
    }

    // Init Akupunktur Section Animation (Pinned & Scrubbed)
    function initAkupunturSectionAnimation() {
        const section = document.querySelector('.studie_graphic_wrap.is-akupuntur');
        if (!section) return;

        if (typeof SplitText === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("GSAP, SplitText, or ScrollTrigger is missing.");
            return;
        }

        gsap.registerPlugin(ScrollTrigger, SplitText);

        const title = section.querySelector('.studie_akupuntur_title');
        const visualWrap = section.querySelector('.studie_akup_visual_wrap');

        if (!title || !visualWrap) return;

        // Split text
        const splitText = SplitText.create(title, { type: "words" });

        // Get the computed original text color dynamically (supports theme variables)
        const originalColor = window.getComputedStyle(title).color || "#0b0b0b";

        // Set initial states
        gsap.set(visualWrap, { autoAlpha: 0, xPercent: 10 });
        gsap.set(splitText.words, { opacity: 0 });

        // Create timeline with pinning and scrub
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "+=150%",
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                pinSpacing: true
            }
        });

        // Step 1: Slide and fade in visualWrap from the right
        tl.to(visualWrap, {
            autoAlpha: 1,
            xPercent: 0,
            duration: 1,
            ease: "power2.out"
        });

        // Step 2: Animate text words color wave (glow -> smooth decay to original color)
        tl.to(splitText.words, {
            keyframes: [
                { opacity: 1, color: "#B03420", duration: 0.3, ease: "power2.out" },
                { color: originalColor, duration: 1.2, ease: "power2.out" }
            ],
            stagger: 0.05,
            duration: 1.8
        }, "-=0.3"); // overlaps slightly with visual wrap animation for smoother flow
    }

    // Init Kinesiologie Section Animation (Pinned & Scrubbed)
    function initKinesiologieSectionAnimation() {
        const section = document.querySelector('.studie_graphic_wrap.is-kinesiologie');
        if (!section) return;

        if (typeof SplitText === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("GSAP, SplitText, or ScrollTrigger is missing.");
            return;
        }

        gsap.registerPlugin(ScrollTrigger, SplitText);

        const titles = section.querySelectorAll('.studie_kinesologie_text');
        const visualWrap = section.querySelector('.studie_graphic_visual_wrap');

        if (!titles.length || !visualWrap) return;

        // Split all paragraph elements and flatten words into one array
        const splitTexts = Array.from(titles).map(t => SplitText.create(t, { type: "words" }));
        const words = splitTexts.flatMap(s => s.words);

        // Get the computed original text color dynamically (supports theme variables)
        const originalColor = window.getComputedStyle(titles[0]).color || "#0b0b0b";

        // Set initial states (slide down starts above, so yPercent: -20)
        gsap.set(visualWrap, { autoAlpha: 0, yPercent: -20 });
        gsap.set(words, { opacity: 0 });

        // Create timeline with pinning and scrub
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "+=150%",
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                pinSpacing: true
            }
        });

        // Step 1: Animate text words color wave (glow -> smooth decay to original color)
        tl.to(words, {
            keyframes: [
                { opacity: 1, color: "#B03420", duration: 0.3, ease: "power2.out" },
                { color: originalColor, duration: 1.2, ease: "power2.out" }
            ],
            stagger: 0.05,
            duration: 1.8
        });

        // Step 2: Slide and fade in visualWrap from above (top to bottom)
        tl.to(visualWrap, {
            autoAlpha: 1,
            yPercent: 0,
            duration: 1.0,
            ease: "power2.out"
        }, "-=0.6"); // starts overlapping during the text decay phase for a smooth transition
    }



    // Init Handle Swiper
    function initHandleSwiper() {
        const swiperElement = document.querySelector('.swiper.is-handle');
        if (!swiperElement) return;

        const wrapper = swiperElement.querySelector('.swiper-wrapper');
        const slides = wrapper.querySelectorAll('.swiper-slides');

        // FIX LOOP WARNING: Gandakan slide otomatis jika kurang dari 10
        if (slides.length > 0 && slides.length < 10) {
            slides.forEach(slide => {
                const clone = slide.cloneNode(true);
                wrapper.appendChild(clone);
            });
        }

        const swiper = new Swiper('.swiper.is-handle', {
            slidesPerView: 'auto',
            spaceBetween: 20, // Gap mobile
            centeredSlides: true,
            loop: true,
            speed: 600,
            grabCursor: true,
            slideToClickedSlide: true,
            slideClass: 'swiper-slides',
            navigation: {
                nextEl: '.handle_nav.is-next',
                prevEl: '.handle_nav.is-prev',
            },
            breakpoints: {
                768: {
                    slidesPerView: 'auto',
                    spaceBetween: 40,
                },
                1024: {
                    slidesPerView: 'auto',
                    spaceBetween: 80, // 80px = 5rem
                }
            }
        });
    }

    // Init Tape Swiper
    function initTapeSwiper() {
        const swiperElement = document.querySelector('.swiper.is-tape');
        if (!swiperElement) return;

        const swiper = new Swiper('.swiper.is-tape', {
            slidesPerView: 1,
            effect: 'fade',
            fadeEffect: { crossFade: true },
            speed: 600,
            grabCursor: true,
            slideClass: 'swiper-slides',
            navigation: {
                nextEl: '.technic_nav_button.is-next', // Menggunakan class nav dari technic
                prevEl: '.technic_nav_button.is-prev',
            },
            on: {
                init: function () { updatePagination(this); },
                slideChange: function () { updatePagination(this); }
            }
        });
    }

    // Init Magnetic Effect
    function initMagneticEffect(selector) {
        if (typeof gsap === 'undefined') return;

        const magnets = document.querySelectorAll(selector);

        magnets.forEach(magnet => {
            // Cek apakah ini adalah elemen badge yang memiliki beberapa layer (lingkaran)
            const innerRing = magnet.querySelector('.xl-badge_inner-ring');
            const mainCircle = magnet.querySelector('.xl-badge_content');

            // Fallback untuk tombol biasa
            const target = innerRing ? null : (magnet.children.length > 0 ? magnet.children[0] : magnet);

            magnet.addEventListener('mousemove', (e) => {
                const rect = magnet.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const distX = e.clientX - centerX;
                const distY = e.clientY - centerY;

                if (innerRing && mainCircle) {
                    // LOGIKA PARALLAX BERLAPIS:
                    // Ring bergerak lebih sedikit, Circle bergerak lebih banyak.
                    // Batasi pergerakan maksimal (Clamp) agar tidak saling melewati garis.

                    const limitRing = 8;   // Maksimal gerak ring (dalam pixel)
                    const limitCircle = 16; // Maksimal gerak main circle (dalam pixel)

                    // Kalkulasi tarikan magnet
                    let ringX = distX * 0.1;
                    let ringY = distY * 0.1;

                    // Terapkan batasan (Clamp) agar tidak tembus garis outer
                    ringX = Math.max(-limitRing, Math.min(limitRing, ringX));
                    ringY = Math.max(-limitRing, Math.min(limitRing, ringY));

                    // Kalkulasi tarikan magnet untuk circle utama
                    let circleX = distX * 0.25;
                    let circleY = distY * 0.25;

                    // Terapkan batasan (Clamp) agar tidak tembus garis inner
                    circleX = Math.max(-limitCircle, Math.min(limitCircle, circleX));
                    circleY = Math.max(-limitCircle, Math.min(limitCircle, circleY));

                    // Eksekusi animasi berlapis
                    gsap.to(innerRing, { x: ringX, y: ringY, duration: 0.4, ease: "power2.out" });
                    gsap.to(mainCircle, { x: circleX, y: circleY, duration: 0.4, ease: "power2.out" });

                } else if (target) {
                    // Animasi untuk elemen magnetik biasa
                    gsap.to(target, {
                        x: distX * 0.3,
                        y: distY * 0.3,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            });

            magnet.addEventListener('mouseleave', () => {
                if (innerRing && mainCircle) {
                    // Kembalikan semua layer berlapis ke tengah
                    gsap.to([innerRing, mainCircle], {
                        x: 0,
                        y: 0,
                        duration: 0.7,
                        ease: "elastic.out(1, 0.3)"
                    });
                } else if (target) {
                    // Kembalikan elemen biasa ke tengah
                    gsap.to(target, {
                        x: 0,
                        y: 0,
                        duration: 0.7,
                        ease: "elastic.out(1, 0.3)"
                    });
                }
            });
        });
    }

    // Init Navbar Scroll Class (.is-scroll)
    function initNavbarScroll() {
        const nav = document.querySelector('.nav_component');
        if (!nav || typeof ScrollTrigger === 'undefined') return;

        let closeTimeout = null;

        const updateNavbarClass = (isFromObserver = false) => {
            const threshold = window.innerHeight * 0.02; // 2% of viewport height
            const currentScroll = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getScrollFunc(window)() : window.scrollY;

            // Check if Webflow's mobile menu is currently open (checking both button and menu container)
            const isNavOpen = document.querySelector('.w-nav-button')?.classList.contains('w--open') ||
                document.querySelector('.w-nav-menu')?.classList.contains('w--open');

            if (currentScroll > threshold || isNavOpen) {
                // Clear any pending close timeouts if menu is opened or page is scrolled down
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
                nav.classList.add('is-scroll');
            } else {
                // If closing from menu toggle, delay class removal to allow Webflow's transition to finish
                if (isFromObserver) {
                    if (!closeTimeout) {
                        closeTimeout = setTimeout(() => {
                            const latestScroll = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getScrollFunc(window)() : window.scrollY;
                            const latestNavOpen = document.querySelector('.w-nav-button')?.classList.contains('w--open') ||
                                document.querySelector('.w-nav-menu')?.classList.contains('w--open');

                            if (latestScroll <= threshold && !latestNavOpen) {
                                nav.classList.remove('is-scroll');
                            }
                            closeTimeout = null;
                        }, 400); // 400ms matches Webflow's default menu transition duration
                    }
                } else {
                    // If scrolling back to top, remove class immediately (unless menu close animation is in progress)
                    if (!closeTimeout) {
                        nav.classList.remove('is-scroll');
                    }
                }
            }
        };

        // 1. Trigger class update on scroll (immediate)
        ScrollTrigger.create({
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            onUpdate: () => updateNavbarClass(false)
        });

        // 2. Trigger class update when Mobile Menu opens/closes (using MutationObserver, with delay)
        const navButton = document.querySelector('.w-nav-button');
        const navMenu = document.querySelector('.w-nav-menu');
        const observer = new MutationObserver(() => updateNavbarClass(true));

        if (navButton) {
            observer.observe(navButton, { attributes: true, attributeFilter: ['class'] });
        }
        if (navMenu) {
            observer.observe(navMenu, { attributes: true, attributeFilter: ['class'] });
        }
    }

    // Init Kongress Click Animation (Toggle)
    function initKongressClick() {
        const headers = document.querySelectorAll('.kongress_header');
        headers.forEach(header => {
            // Find parent/container to support relative scoping (CMS lists/accordions)
            const container = header.closest('.kongress_item') || header.closest('.kongress_component') || document;
            const cardWrap = container.querySelector('.kongress_card_wrap') || document.querySelector('.kongress_card_wrap');
            if (!cardWrap) return;

            // Cache original bottom position from CSS
            if (cardWrap.dataset.originalBottom === undefined) {
                const computedBottom = window.getComputedStyle(cardWrap).bottom;
                cardWrap.dataset.originalBottom = computedBottom || "-100%";
            }

            header.addEventListener('click', () => {
                const currentCardWrap = container.querySelector('.kongress_card_wrap') || document.querySelector('.kongress_card_wrap');

                // Select elements with :has selector or fallback to all direct children
                let textElements = container.querySelectorAll('.kongress_body_row > :has(p, h1, h2, h3, h4, h5, h6)');
                if (textElements.length === 0) {
                    textElements = document.querySelectorAll('.kongress_body_row > :has(p, h1, h2, h3, h4, h5, h6)');
                }
                if (textElements.length === 0) {
                    textElements = container.querySelectorAll('.kongress_body_row > *');
                }

                const isOpen = currentCardWrap.classList.contains('is-open');

                if (isOpen) {
                    // CLOSE: Animate back to original bottom and fade out text elements
                    currentCardWrap.classList.remove('is-open');

                    gsap.to(currentCardWrap, {
                        bottom: currentCardWrap.dataset.originalBottom,
                        duration: 0.6,
                        ease: "power2.inOut"
                    });

                    if (textElements.length > 0) {
                        gsap.to(textElements, {
                            opacity: 0,
                            duration: 0.4,
                            ease: "power2.inOut",
                            stagger: 0.03
                        });
                    }
                } else {
                    // OPEN: Animate bottom to 0% and fade in text elements
                    currentCardWrap.classList.add('is-open');

                    gsap.to(currentCardWrap, {
                        bottom: "0%",
                        duration: 0.6,
                        ease: "power2.out"
                    });

                    if (textElements.length > 0) {
                        gsap.to(textElements, {
                            opacity: 1,
                            duration: 0.5,
                            ease: "power2.out",
                            stagger: 0.05
                        });
                    }
                }
            });
        });
    }

    // Init Quality Bar Scroll Animation (Individual Triggers)
    function initQualityBarAnimation() {
        const wrap = document.querySelector('.quality_col-2_bars_wrap');
        if (!wrap) return;

        const items = wrap.querySelectorAll('.quality_col-2_bar_wrap');
        if (!items.length) return;

        items.forEach((item) => {
            const bar = item.querySelector('.quality_col-2_bar');
            const text = item.querySelector('.quality_col-2_bar-text');
            if (!bar) return;

            // Force overflow hidden on bar to clip text during growth
            gsap.set(bar, { overflow: 'hidden' });
            // Prevent text from wrapping during width expansion
            if (text) {
                gsap.set(text, { whiteSpace: 'nowrap' });
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: item,    // Triggers animation independently per bar container
                    start: "top 90%", // Triggers when the item top is 90% from viewport top
                    once: true
                }
            });

            // Animate width from 0% to its original stylesheet value
            tl.from(bar, {
                width: "0%",
                duration: 1.7,
                ease: "power2.out"
            }, 0);

            // Fade in bar text slightly after the bar starts growing for a premium feel
            if (text) {
                tl.from(text, {
                    opacity: 0,
                    duration: 0.7,
                    ease: "power2.out"
                }, 0.5);
            }
        });
    }

    // Init Master
    function initMaster() {
        initTechnicSwiper();
        initHandleSwiper();
        initTapeSwiper();
        // Apply magnetic effect
        initMagneticEffect('.xl-badge_wrapper');
        // Apply animation to main buttons
        initTextHoverAnimation('.button_main_wrap', '.button_main_text');
        // Apply animation to footer links
        initTextHoverAnimation('.footer_group_item', '.footer_link_text');
        // Apply animation to navigation links
        initTextHoverAnimation('.nav_links_link', '.nav_links_text');
        initScrollOpacityAnimation();
        initAkupunturSectionAnimation();
        initKinesiologieSectionAnimation();
        initNavbarScroll();
        initKongressClick();
        initQualityBarAnimation();
    }

    initMaster();

    // Force ScrollTrigger refresh on window load to handle Webflow's dynamic layout shifts
    window.addEventListener("load", () => {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });
});



function initHighlightMarkerTextReveal() {
    const defaults = {
        direction: "right",
        theme: "pink",
        scrollStart: "top 90%",
        staggerStart: "start",
        stagger: 100,
        barDuration: 0.6,
        barEase: "power3.inOut",
    };

    const colorMap = {
        pink: "#B03420",
        white: "#FFFFFF",
    };

    const directionMap = {
        right: { prop: "scaleX", origin: "right center" },
        left: { prop: "scaleX", origin: "left center" },
        up: { prop: "scaleY", origin: "center top" },
        down: { prop: "scaleY", origin: "center bottom" },
    };

    function resolveColor(value) {
        if (colorMap[value]) return colorMap[value];
        if (value.startsWith("--")) {
            return getComputedStyle(document.body).getPropertyValue(value).trim() || value;
        }
        return value;
    }

    function createBar(color, origin) {
        const bar = document.createElement("div");
        bar.className = "highlight-marker-bar";
        Object.assign(bar.style, {
            backgroundColor: color,
            transformOrigin: origin,
        });
        return bar;
    }

    function cleanupElement(el) {
        if (!el._highlightMarkerReveal) return;
        el._highlightMarkerReveal.timeline?.kill();
        el._highlightMarkerReveal.scrollTrigger?.kill();
        el._highlightMarkerReveal.split?.revert();
        el.querySelectorAll(".highlight-marker-bar").forEach((bar) => bar.remove());
        delete el._highlightMarkerReveal;
    }

    let reduceMotion = false;

    gsap.matchMedia().add(
        { reduce: "(prefers-reduced-motion: reduce)" },
        (context) => {
            reduceMotion = context.conditions.reduce;
        }
    );

    // Reduced motion: no animation at all
    if (reduceMotion) {
        document.querySelectorAll("[data-highlight-marker-reveal]").forEach((el) => {
            gsap.set(el, { autoAlpha: 1 });
        });
        return;
    }

    // Cleanup previous instances
    document.querySelectorAll("[data-highlight-marker-reveal]").forEach(cleanupElement);

    const elements = document.querySelectorAll("[data-highlight-marker-reveal]");
    if (!elements.length) return;

    elements.forEach((el) => {
        if (el.getAttribute("data-highlight-marker-reveal") === "false") {
            gsap.set(el, { autoAlpha: 1 });
            return;
        }

        const direction = el.getAttribute("data-marker-direction") || defaults.direction;
        const theme = el.getAttribute("data-marker-theme") || defaults.theme;
        const scrollStart = el.getAttribute("data-marker-scroll-start") || defaults.scrollStart;
        const staggerStart = el.getAttribute("data-marker-stagger-start") || defaults.staggerStart;
        const staggerOffset = (parseFloat(el.getAttribute("data-marker-stagger")) || defaults.stagger) / 1000;

        const color = resolveColor(theme);
        const dirConfig = directionMap[direction] || directionMap.right;

        el._highlightMarkerReveal = {};

        const split = SplitText.create(el, {
            type: "lines",
            linesClass: "highlight-marker-line",
            autoSplit: true,
            onSplit(self) {
                const instance = el._highlightMarkerReveal;

                // Teardown previous build
                instance.timeline?.kill();
                instance.scrollTrigger?.kill();
                el.querySelectorAll(".highlight-marker-bar").forEach((bar) => bar.remove());

                // Build bars and timeline
                const lines = self.lines;
                const tl = gsap.timeline({ paused: true });

                lines.forEach((line, i) => {
                    gsap.set(line, { position: "relative", overflow: "hidden" });

                    const bar = createBar(color, dirConfig.origin);
                    line.appendChild(bar);

                    const staggerIndex = staggerStart === "end" ? lines.length - 1 - i : i;

                    tl.to(bar, {
                        [dirConfig.prop]: 0,
                        duration: defaults.barDuration,
                        ease: defaults.barEase,
                    }, staggerIndex * staggerOffset);
                });

                // Reveal parent — bars are covering the text
                gsap.set(el, { autoAlpha: 1 });

                // ScrollTrigger
                const st = ScrollTrigger.create({
                    trigger: el,
                    start: scrollStart,
                    once: true,
                    onEnter: () => tl.play(),
                });

                instance.timeline = tl;
                instance.scrollTrigger = st;
            },
        });

        el._highlightMarkerReveal.split = split;
    });
}

// Initialize Highlight Marker Text Reveal
document.addEventListener("DOMContentLoaded", () => {
    document.fonts.ready.then(() => {
        initHighlightMarkerTextReveal();
    });
});