document.addEventListener("DOMContentLoaded", function () {
  // Pastikan GSAP dan ScrollTrigger sudah dimuat
  if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    initVisualAnimations();
    initMultiStepForm();
  } else {
    console.error("GSAP not found!");
  }
});

/**
 * ============================================================
 * PART 1: VISUAL ANIMATIONS (Sidebar/Progress Stepper)
 * ============================================================
 */
function initVisualAnimations() {
  const items = gsap.utils.toArray(".step_item");

  if (!items.length) return;

  const ctx = gsap.context(() => {
    items.forEach((item) => {
      const dot = item.querySelector(".step_dot");
      const progressWrap = item.querySelector(".step_progress_wrap");
      const progress = item.querySelector(".step_progress");
      const contents = item.querySelectorAll(".step_item_content > *");

      if (!dot || !progressWrap || !progress) return;

      const tl = gsap.timeline({ onComplete: () => tl.kill() });
      const tl2 = gsap.timeline();
      const tl3 = gsap.timeline();

      // Intro Animation
      tl.from(dot, { autoAlpha: 0, duration: 0.5, ease: "power2.out" })
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
          { height: "0%", duration: 0.5, ease: "power2.out" },
          "<+=0.3"
        );

      // Scroll Progress Animation
      tl2.to(progress, { height: "100%", ease: "none" });

      // Dot Active State
      tl3.to(dot, { background: "white" });

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

/**
 * ============================================================
 * PART 2: MULTI-STEP FORM LOGIC & VALIDATION
 * ============================================================
 */
function initMultiStepForm() {
  // --- Configuration ---
  const CONFIG = {
    stepsSelector: '[data-form^="step-"]',
    nextBtnSelector: '[data-form="next"]',
    backBtnSelector: '[data-form="back"]',
    submitBtnSelector: '[data-form="submit-btn"]',
    errorAttr: 'data-input-form="error-msg"',
    // optionalInputAttr: '[data-form="optional"]', // Selector input tambahan
    textareaMin: 50,
    textareaMax: 6000,
  };

  const steps = Array.from(document.querySelectorAll(CONFIG.stepsSelector));
  if (steps.length === 0) return;

  let currentStepIndex = 0;

  // 1. Initialize State (INI PENTING AGAR STEP TIDAK MUNCUL SEMUA)
  gsap.set(steps, { autoAlpha: 0, display: "none" });
  gsap.set(steps[0], { autoAlpha: 1, display: "block" });

  // 2. Setup Input Listeners
  setupInputListeners();
  setupRadioControl(); // <--- LOGIKA BARU DITAMBAHKAN DI SINI

  // 3. Navigation Buttons
  document.querySelectorAll(CONFIG.nextBtnSelector).forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Cek apakah tombol sedang di-disable oleh radio button
      if (btn.style.pointerEvents === "none") return;
      await handleNextStep(btn);
    });
  });

  document.querySelectorAll(CONFIG.backBtnSelector).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      changeStep(currentStepIndex - 1);
    });
  });

  // --- NEW: RADIO CONTROL LOGIC ---
  function setupRadioControl() {
    // 1. Validasi dulu (apakah radio button sudah dipilih?)
    // const isValid = await validateStep(steps[currentStepIndex], btnElement);
    // if (isValid) {
    //   const decisionRadio = steps[currentStepIndex].querySelector('input[name="final-decision-maker"]:checked');
    //   if (decisionRadio && decisionRadio.value === "No") {
    //     changeStep(4);
    //   } else {
    //     changeStep(currentStepIndex + 1);
    //   }
    // }
    // // KASUS 2: name="mandate-readiness"
    // const mandateRadios = document.querySelectorAll(
    //   'input[name="mandate-readiness"]'
    // );
    // const optionalInput = document.querySelector(CONFIG.optionalInputAttr);
    // // Inisialisasi: Sembunyikan jika defaultnya bukan Yes
    // if (optionalInput) {
    //   const isYes =
    //     document.querySelector('input[name="mandate-readiness"]:checked')
    //       ?.value === "Yes";
    //   if (!isYes)
    //     gsap.set(optionalInput.parentElement, {
    //       autoAlpha: 0,
    //       display: "none",
    //     });
    // }
    // mandateRadios.forEach((radio) => {
    //   radio.addEventListener("change", (e) => {
    //     if (!optionalInput) return;
    //     const inputField = optionalInput.querySelector("input, textarea");
    //     if (e.target.value === "Yes") {
    //       // Show
    //       gsap.fromTo(
    //         optionalInput,
    //         { autoAlpha: 0, display: "none" },
    //         { autoAlpha: 1, display: "block", duration: 0.3 }
    //       );
    //       if (inputField) inputField.required = true;
    //     } else {
    //       // Hide
    //       gsap.to(optionalInput, {
    //         autoAlpha: 0,
    //         duration: 0.3,
    //         onComplete: () => {
    //           gsap.set(optionalInput, { display: "none" });
    //           if (inputField) {
    //             inputField.value = ""; // Clear value
    //             inputField.required = false;
    //           }
    //         },
    //       });
    //     }
    // });
    // });
    // // KASUS 3: name="decision-intent"
    // const intentRadios = document.querySelectorAll(
    //   'input[name="decision-intent"]'
    // );
    // const submitBtn = document.querySelector(CONFIG.submitBtnSelector);
    // // Tentukan value yang membuat disable (sesuaikan text-nya)
    // const disableTriggerValue = "Certainty";
    // intentRadios.forEach((radio) => {
    //   radio.addEventListener("change", (e) => {
    //     if (!submitBtn) return;
    //     if (e.target.value === disableTriggerValue) {
    //       gsap.to(submitBtn, {
    //         opacity: 0.3,
    //         filter: "grayscale(100%)",
    //         duration: 0.3,
    //       });
    //       submitBtn.style.pointerEvents = "none";
    //     } else {
    //       gsap.to(submitBtn, {
    //         opacity: 1,
    //         filter: "grayscale(0%)",
    //         duration: 0.3,
    //       });
    //       submitBtn.style.pointerEvents = "auto";
    //     }
    //   });
    // });
  }

  // --- Core Functions ---

  async function handleNextStep(btnElement) {
    const originalText = btnElement.innerText;
    const isValid = await validateStep(steps[currentStepIndex], btnElement);

    if (isValid) {
      const decisionRadio = steps[currentStepIndex].querySelector(
        'input[name="final-decision-maker"]:checked'
      );

      if (decisionRadio && decisionRadio.value === "No") {
        changeStep(4);
      } else {
        changeStep(currentStepIndex + 1);
      }
    }
  }

  function changeStep(newIndex) {
    if (newIndex < 0 || newIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    const nextStep = steps[newIndex];

    gsap.to(currentStep, {
      autoAlpha: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(currentStep, { display: "none" });

        gsap.set(nextStep, { display: "grid" });
        gsap.fromTo(
          nextStep,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, clearProps: "y" }
        );
      },
    });

    currentStepIndex = newIndex;
  }

  // --- Validation Logic ---

  async function validateStep(stepContext, btnElement) {
    let isValid = true;
    const inputs = stepContext.querySelectorAll("input, select, textarea");

    for (const input of inputs) {
      // PENTING: Jangan validasi input hidden (misal optional input yang disembunyikan)
      if (input.type === "hidden" || input.offsetParent === null) continue;

      let errorMsg = findErrorElement(input);
      let fieldValid = true;

      // A. Required Check
      if (input.required) {
        if (input.type === "checkbox") {
          if (!input.checked) fieldValid = false;
        } else if (input.type === "radio") {
          // Radio validation (group)
          const groupName = input.name;
          const isChecked = stepContext.querySelector(
            `input[name="${groupName}"]:checked`
          );
          if (!isChecked) fieldValid = false;
        } else if (!input.value.trim()) {
          fieldValid = false;
        }

        if (!fieldValid) {
          showError(errorMsg, "This field is required.");
          isValid = false;
          continue;
        }
      }

      // B. Specific Type Checks
      if (input.type === "email" && input.value.trim()) {
        if (errorMsg && errorMsg.style.display === "block") {
          if (errorMsg.textContent.includes("Verifying")) {
            const btnTextEl = btnElement.querySelector('[data-button="text"]');
            const originalText = btnTextEl ? btnTextEl.innerText : "";
            if (btnTextEl) btnTextEl.innerText = "Checking...";

            await waitForVerification(errorMsg);

            if (btnTextEl) btnTextEl.innerText = originalText;
            if (errorMsg.style.display === "block") isValid = false;
          } else {
            isValid = false;
          }
        }
      }

      if (input.type === "tel" && input.value.trim()) {
        if (!/^\+?\d{7,15}$/.test(input.value.trim())) {
          showError(errorMsg, "Invalid phone number.");
          isValid = false;
        }
      }

      if (fieldValid && (!errorMsg || errorMsg.style.display === "none")) {
        // do nothing
      }
    }

    return isValid;
  }

  function setupInputListeners() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach((input) => {
      input.addEventListener("blur", async function () {
        const errorEl = findErrorElement(this);
        const email = this.value.trim();

        if (!email) {
          if (this.required) showError(errorEl, "This field is required.");
          return;
        }
        const emailParts = email.split("@");
        if (emailParts.length === 2 && emailParts[1].length > 0) {
          await validateDomain(emailParts[1], errorEl);
        } else {
          showError(errorEl, "Please enter a valid email address.");
        }
      });
      input.addEventListener("input", function () {
        hideError(findErrorElement(this));
      });
    });

    const telInputs = document.querySelectorAll('input[type="tel"]');
    telInputs.forEach((input) => {
      input.addEventListener("input", function (e) {
        const errorEl = findErrorElement(this);
        let sanitizedValue = this.value.replace(/[^\d+]/g, "");
        if (sanitizedValue.lastIndexOf("+") > 0) {
          sanitizedValue = "+" + sanitizedValue.replace(/\+/g, "");
        }
        this.value = sanitizedValue;
        hideError(errorEl);
      });
    });

    const requiredInputs = document.querySelectorAll("input, select, textarea");
    requiredInputs.forEach((input) => {
      input.addEventListener("input", function () {
        hideError(findErrorElement(this));
      });
      input.addEventListener("change", function () {
        hideError(findErrorElement(this));
      });
    });
  }

  // --- Helper Functions ---

  function findErrorElement(input) {
    let errorEl = input.nextElementSibling;
    if (errorEl && errorEl.matches(`[${CONFIG.errorAttr}]`)) return errorEl;
    if (input.parentElement) {
      errorEl = input.parentElement.nextElementSibling;
      if (errorEl && errorEl.matches(`[${CONFIG.errorAttr}]`)) return errorEl;
      if (input.parentElement.parentElement) {
        // Check grandfather for radio/checkbox groups
        errorEl = input.parentElement.parentElement.nextElementSibling;
        if (errorEl && errorEl.matches(`[${CONFIG.errorAttr}]`)) return errorEl;
      }
    }
    return null;
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
      gsap.fromTo(
        element,
        { x: -5 },
        { x: 0, duration: 0.1, repeat: 3, yoyo: true }
      );
    }
  }

  function hideError(element) {
    if (element) element.style.display = "none";
  }

  async function validateDomain(domain, errorElement) {
    if (!errorElement) return;
    try {
      showError(errorElement, "Verifying domain...");
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=MX`
      );
      const data = await response.json();
      if (response.ok && data.Answer && data.Answer.length > 0) {
        hideError(errorElement);
      } else {
        showError(errorElement, "Email domain does not exist or is invalid.");
      }
    } catch (error) {
      console.warn("DNS check failed, skipping strict check.");
      hideError(errorElement);
    }
  }

  function waitForVerification(element) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (
          !element.textContent.includes("Verifying") ||
          element.style.display === "none"
        ) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 200);
    });
  }
}
