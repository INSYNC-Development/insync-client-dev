function stepAnimation() {
  const items = gsap.utils.toArray(".step_item");

  // let flickerEase =
  //   "rough({ template: circ.easeOut, strength: 4, points: 50, taper: 'out', randomize: true, clamp:  true})";

  if (!items.length) return;

  const ctx = gsap.context(() => {
    items.forEach((item) => {
      const dot = item.querySelector(".step_dot");
      const progressWrap = item.querySelector(".step_progress_wrap");
      const progress = item.querySelector(".step_progress");
      const contents = item.querySelectorAll(".step_item_content > *");

      const tl = gsap.timeline({
        onComplete: () => tl.kill(),
      });
      const tl2 = gsap.timeline();
      const tl3 = gsap.timeline();

      tl.from(dot, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
      })
        .from(
          contents,
          {
            autoAlpha: 0,
            duration: 1,
            stagger: { each: 0.05, from: "random" },
            ease: "power2.out",
          },
          "<"
        )
        .from(
          progressWrap,
          {
            height: "0%",
            duration: 0.5,
            ease: "power2.out",
          },
          "<+=0.3"
        );

      tl2.to(progress, {
        height: "100%",
        ease: "none",
      });

      tl3.to(dot, {
        background: "white",
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        animation: tl,
        once: true,
      });

      ScrollTrigger.create({
        trigger: item,
        start: "top center",
        end: "bottom center",
        scrub: true,
        animation: tl2,
      });

      ScrollTrigger.create({
        trigger: dot,
        start: "top 60%",
        end: "bottom 40%",
        scrub: true,
        animation: tl3,
      });
    });
  });

  return ctx;
}

function initFunction() {
  stepAnimation();
}

document.addEventListener("DOMContentLoaded", initFunction);

document.addEventListener("DOMContentLoaded", function () {
  /**
   * ============================================================
   * PART 1: EXISTING VALIDATION SCRIPTS (Preserved)
   * ============================================================
   */

  // 1. Email DNS Validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach((emailInput) => {
    const errorMsgElement = emailInput.nextElementSibling;
    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    )
      return;

    emailInput.addEventListener("blur", function () {
      const email = this.value.trim();
      const emailParts = email.split("@");
      if (emailParts.length === 2 && emailParts[1].length > 0) {
        validateDomain(emailParts[1], errorMsgElement);
      } else if (email.length > 0) {
        showError("Please enter a valid email address.", errorMsgElement);
      } else {
        hideError(errorMsgElement);
      }
    });
  });

  async function validateDomain(domain, errorElement) {
    try {
      showError("Verifying domain...", errorElement); // This text is used by the stepper to know we are waiting
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();
      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement);
      } else {
        showError(
          "The email domain appears to be invalid or non-existent.",
          errorElement
        );
      }
    } catch (error) {
      showError(
        "Validation failed. Please check your connection.",
        errorElement
      );
    }
  }

  // 2. Phone Formatting
  const telInputs = document.querySelectorAll('input[type="tel"]');
  telInputs.forEach((telInput) => {
    const errorMsgElement = telInput.nextElementSibling;
    if (
      !errorMsgElement ||
      errorMsgElement.getAttribute("data-input-form") !== "error-msg"
    )
      return;

    telInput.addEventListener("input", function (event) {
      const originalValue = this.value;
      let sanitizedValue = originalValue.replace(/[^\d+]/g, "");
      if (sanitizedValue.lastIndexOf("+") > 0)
        sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
      if (sanitizedValue.length > 0 && !/^[+\d]/.test(sanitizedValue))
        sanitizedValue = sanitizedValue.substring(1);
      if (originalValue !== sanitizedValue) this.value = sanitizedValue;

      if (originalValue.length > 0 && !/^\+?\d+$/.test(originalValue)) {
        showError("Only numbers and a leading + are allowed.", errorMsgElement);
      } else {
        hideError(errorMsgElement);
      }
    });
  });

  // Helper functions for existing scripts
  function showError(message, element) {
    element.textContent = message;
    element.style.display = "block";
  }
  function hideError(element) {
    element.style.display = "none";
  }

  /**
   * ============================================================
   * PART 2: NEW MULTISTEP FORM LOGIC (GSAP + Strict Validation)
   * ============================================================
   */

  // --- Configuration ---
  const CONFIG = {
    stepsSelector: '[data-form^="step-"]',
    nextBtnSelector: '[data-form="next"]',
    backBtnSelector: '[data-form="back"]',
    submitBtnSelector: '[data-form="submit-btn"]',
    errorAttr: '[data-input-form="error-msg"]',
    textareaMin: 300,
    textareaMax: 6000,
  };

  const steps = Array.from(document.querySelectorAll(CONFIG.stepsSelector));
  let currentStepIndex = 0;

  // --- Initialization ---
  function initMultiStep() {
    // Hide all steps except the first one using GSAP
    gsap.set(steps, { autoAlpha: 0, display: "none" });
    gsap.set(steps[0], { autoAlpha: 1, display: "block" });

    // Initialize inputs (Numbers & Textarea)
    setupCustomInputs();

    // Attach Click Listeners
    document.querySelectorAll(CONFIG.nextBtnSelector).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        handleNext(btn);
      });
    });

    document.querySelectorAll(CONFIG.backBtnSelector).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        changeStep(currentStepIndex - 1);
      });
    });

    const submitBtn = document.querySelector(CONFIG.submitBtnSelector);
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        // Prevent default submit initially to check validation
        // e.preventDefault();

        // Validate the final step
        validateStep(steps[currentStepIndex]).then((isValid) => {
          if (isValid) {
            // Anchor Scroll Immediately
            const section = document.querySelector("#private-request-section");
            if (section) section.scrollIntoView({ behavior: "smooth" });

            // Actually submit the form
            // const form = submitBtn.closest("form");
            // if (form) form.requestSubmit(submitBtn);
          }
        });
      });
    }
  }

  // --- Step Transition Logic (GSAP) ---
  function changeStep(newIndex) {
    if (newIndex < 0 || newIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    const nextStep = steps[newIndex];

    // Fade Out Current
    gsap.to(currentStep, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(currentStep, { display: "none", visibility: "hidden" });

        // Fade In Next
        gsap.set(nextStep, { display: "block", visibility: "visible" });
        gsap.fromTo(nextStep, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      },
    });

    currentStepIndex = newIndex;
  }

  // --- Validation Logic ---
  async function handleNext(btnElement) {
    // Check validation for current step
    const isValid = await validateStep(steps[currentStepIndex], btnElement);
    if (isValid) {
      changeStep(currentStepIndex + 1);
    }
  }

  // --- UPDATED VALIDATION LOGIC ---
  async function validateStep(stepContext, btnElement = null) {
    let isValid = true;
    const inputs = stepContext.querySelectorAll("input, select, textarea");

    for (const input of inputs) {
      // 1. Logic to find the correct error message element
      let errorMsg = input.nextElementSibling;
      let isErrorMsgElement =
        errorMsg && errorMsg.getAttribute("data-input-form") === "error-msg";

      // Look for parent sibling if not found (fixes Select/Dropdown wrappers)
      if (!isErrorMsgElement && input.parentElement) {
        const parentSibling = input.parentElement.nextElementSibling;
        if (
          parentSibling &&
          parentSibling.getAttribute("data-input-form") === "error-msg"
        ) {
          errorMsg = parentSibling;
          isErrorMsgElement = true;
        }
      }

      // 2. Check Required Fields
      if (input.required) {
        const isCheckbox = input.type === "checkbox";
        const isEmpty = isCheckbox ? !input.checked : input.value.trim() === "";

        if (isEmpty) {
          isValid = false;
          if (isErrorMsgElement) showError("This field is required.", errorMsg);
        } else {
          // Clear "Required" error if field is filled
          if (
            isErrorMsgElement &&
            errorMsg.textContent === "This field is required."
          ) {
            hideError(errorMsg);
          }
        }
      }

      // 3. Check Number Inputs
      if (input.type === "number") {
        if (input.value !== "" && Number(input.value) < 1) {
          isValid = false;
          if (isErrorMsgElement)
            showError("Number must be at least 1.", errorMsg);
        } else {
          // FIX: Clear number error if valid
          if (
            isErrorMsgElement &&
            errorMsg.textContent === "Number must be at least 1."
          ) {
            hideError(errorMsg);
          }
        }
      }

      // 4. Check Textarea
      if (input.tagName.toLowerCase() === "textarea") {
        const len = input.value.length;
        if (len < CONFIG.textareaMin || len > CONFIG.textareaMax) {
          isValid = false;
          if (isErrorMsgElement)
            showError(
              `Must be between ${CONFIG.textareaMin} and ${CONFIG.textareaMax} characters.`,
              errorMsg
            );
        } else {
          // FIX: Clear length error if valid so we can proceed
          if (
            isErrorMsgElement &&
            errorMsg.textContent.includes("Must be between")
          ) {
            hideError(errorMsg);
          }
        }
      }

      // 5. Check Existing/Async Error Messages (Blocks if error is visible)
      if (isErrorMsgElement && errorMsg.style.display === "block") {
        // Handle Async Email Waiting
        if (errorMsg.textContent.includes("Verifying")) {
          isValid = false;
          if (btnElement) {
            const textEl = btnElement.querySelector('[data-button="text"]');
            if (textEl) textEl.style.opacity = 0.5;

            await waitForVerification(errorMsg);

            if (textEl) textEl.style.opacity = 1;
            // Check if error persists after waiting
            if (errorMsg.style.display === "block") return false;
            else return true;
          }
        } else {
          // Standard error visible
          isValid = false;
        }
      }
    }

    return isValid;
  }

  // Helper to pause execution while email verifies
  function waitForVerification(element) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // If text no longer says "Verifying" or is hidden, we are done
        if (
          !element.textContent.includes("Verifying") ||
          element.style.display === "none"
        ) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 200); // Check every 200ms
    });
  }

  // --- Custom Input Setup (Constraints) ---
  function setupCustomInputs() {
    // 1. Number Inputs: Prevent non-numeric chars
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach((input) => {
      input.addEventListener("keydown", (e) => {
        // Allow: backspace, delete, tab, escape, enter
        if (
          [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Command+A
          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)
        ) {
          return;
        }
        // Ensure that it is a number and stop the keypress
        if (
          (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
          (e.keyCode < 96 || e.keyCode > 105)
        ) {
          e.preventDefault();
        }
      });
    });

    // 2. Textarea Character Counter
    const textareas = document.querySelectorAll("textarea");
    const wordCountDisplay = document.querySelector(
      '[data-form="textarea-word-count"]'
    );

    textareas.forEach((textarea) => {
      // Initialize
      updateCounter(textarea);

      textarea.addEventListener("input", () => {
        updateCounter(textarea);
      });
    });

    function updateCounter(el) {
      if (!wordCountDisplay) return;
      const currentLength = el.value.length;
      wordCountDisplay.textContent = `${currentLength} / ${CONFIG.textareaMax} Characters`;

      // Visual feedback for counter
      if (
        currentLength < CONFIG.textareaMin ||
        currentLength > CONFIG.textareaMax
      ) {
        wordCountDisplay.style.color =
          "var(--sys-color-status-danger, #DB1F1F)";
      } else {
        wordCountDisplay.style.color = ""; // Reset to default
      }
    }
  }

  // Run
  initMultiStep();
});
