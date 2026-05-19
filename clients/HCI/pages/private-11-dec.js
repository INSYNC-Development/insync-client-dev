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

function formValidation() {
  const form = document.querySelector("[data-form-el='private-request']");
  const steps = Array.from(document.querySelectorAll(".request_form_item"));
  const stepCounterText = document.querySelector(
    ".request_desc span:nth-child(2)"
  );

  let currentStepIndex = 0;

  console.log(currentStepIndex);

  const initialActive = steps.findIndex(
    (step) => step.getAttribute("data-form") === "active"
  );
  currentStepIndex = initialActive !== -1 ? initialActive : 0;
  updateStepDisplay();

  form.addEventListener("click", function (e) {
    const nextBtn = e.target.closest('[data-form="next"]');
    const backBtn = e.target.closest('[data-form="back"]');

    if (nextBtn) {
      e.preventDefault();
      if (validateStep(currentStepIndex)) {
        if (currentStepIndex < steps.length - 1) {
          currentStepIndex++;
          console.log(currentStepIndex);
          updateStepDisplay();
        }
      }
    }

    if (backBtn) {
      e.preventDefault();
      if (currentStepIndex > 0) {
        currentStepIndex--;
        console.log(currentStepIndex);
        updateStepDisplay();
      }
    }
  });

  function updateStepDisplay() {
    steps.forEach((step, index) => {
      if (index === currentStepIndex) {
        step.setAttribute("data-form", "active");
      } else {
        step.setAttribute("data-form", "");
      }
    });

    if (stepCounterText) {
      stepCounterText.innerText = `0${currentStepIndex + 1}`;
    }
  }

  function validateStep(index) {
    const currentStep = steps[index];
    const inputs = currentStep.querySelectorAll("input, select, textarea");
    let isValid = true;

    inputs.forEach((input) => {
      const isRequired = input.hasAttribute("required");
      const errorMsg = input.nextElementSibling;
      let fieldValid = true;

      if (
        isRequired &&
        (input.type === "text" ||
          input.type === "email" ||
          input.type === "tel" ||
          input.tagName === "SELECT" ||
          input.tagName === "TEXTAREA")
      ) {
        if (!input.value.trim()) {
          fieldValid = false;
        }
      }

      if (input.type === "radio" && isRequired) {
        const name = input.name;
        const isChecked = currentStep.querySelector(
          `input[name="${name}"]:checked`
        );
        if (!isChecked) {
          fieldValid = false;
        }
      }

      if (input.type === "checkbox" && isRequired) {
        if (!input.checked) {
          fieldValid = false;
        }
      }

      if (!fieldValid) {
        isValid = false;
        // input.classList.add("error");
        if (errorMsg) {
          errorMsg.style.display = "block";
          if (errorMsg.innerText === "")
            errorMsg.innerText = "This field is required";
        }
      } else {
        // input.classList.remove("error");
        if (errorMsg) errorMsg.style.display = "none";
      }
    });

    return isValid;
  }
}

function initFunction() {
  stepAnimation();
  formValidation();
}

document.addEventListener("DOMContentLoaded", initFunction);
