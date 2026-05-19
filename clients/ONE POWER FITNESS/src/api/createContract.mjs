const API_URL = "https://magicline-proxy-coral.vercel.app/api";
const STORAGE_KEY = "magicline_product_data";

// ==========================================
// --- API & DATA HANDLING ---
// ==========================================

function getLocalData() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

async function fetchAndSaveToStorage() {
  console.log("Status: Storage empty. Fetching API...");

  try {
    const resp = await fetch(`${API_URL}/contracts/rate-bundle`);
    // const data = await resp.json();
    // sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // return data;

    const data = await resp.json();

    const filteredData = data.filter((product) =>
      ["ONE power FLEX", "ONE power YEAR"].includes(product.name)
    );

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));

    console.log("Data setelah filter:", filteredData);

    return filteredData;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getProduct() {
  let data = getLocalData() || (await fetchAndSaveToStorage());

  if (!data) {
    data = await fetchAndSaveToStorage();
  }

  if (data && data.length > 0) {
    data.sort((a, b) => {
      if (a.name === "ONE power YEAR") return -1;
      if (b.name === "ONE power YEAR") return 1;
      return 0;
    });

    renderProducts(data);
  }
}

// ==========================================
// --- RENDER PRODUCTS ---
// ==========================================

function renderProducts(products) {
  const container = document.querySelector(".membership_layout");
  const templateCard = document.querySelector(".membership_card");

  if (!container || !templateCard) return;

  container.innerHTML = "";

  products.forEach((product, index) => {
    const card = templateCard.cloneNode(true);
    card.dataset.raw = JSON.stringify(product);

    const updateText = (selector, text) => {
      const el = card.querySelector(`[data-product="${selector}"]`);
      if (el) el.textContent = text;
    };

    updateText("name", product.name);

    const listItems = product.description
      .split("\n")
      .filter((item) => item.trim() !== "");

    if (listItems.length > 0) {
      const durationList = [
        "Laufzeit: 12 Monate",
        "Monatlich flexibel kündbar – ab dem 1. Tag",
      ];

      if (durationList[index]) {
        updateText("duration", durationList[index]);
      }

      updateText("trial", listItems[listItems.length - 1]);

      const middleItems = listItems.slice(1, -1);
      const descEl = card.querySelector('[data-product="description"]');

      if (descEl && middleItems.length > 0) {
        descEl.innerHTML = `<ul>${middleItems
          .map((item) => `<li>${item}</li>`)
          .join("")}</ul>`;
      }
    }

    // Format Terms
    const term = product.terms?.[0];
    if (term) {
      updateText("termValue", term.termValue);

      const unitMap = { DAY: "Tage", MONTH: "Monate", YEAR: "Jahre" };
      const rawUnit = term.termUnit.toUpperCase();
      updateText("termUnit", unitMap[rawUnit] || rawUnit);

      const priceEl = card.querySelector(
        '[data-product="price"]:not(.text-color-grey)'
      );
      if (priceEl) priceEl.textContent = term.price.toFixed(2);

      if (term.paymentFrequencyValue > 0) {
        updateText(
          "per-day",
          (term.price / term.paymentFrequencyValue).toFixed(2)
        );
      }
    }

    container.appendChild(card);
  });
}

// ==========================================
// --- FORM LOGIC ---
// ==========================================

function stepForm() {
  let currentStep = 1;
  const totalSteps = 5;
  const formData = {};
  let isEmailValidating = false;
  let isBankValidating = false;

  let pricingState = {
    starterFee: 0,
    recurringPrice: 0,
    serviceFee: 12.9,
    ptAddonFee: 29.95,
  };

  const DOM = {
    steps: document.querySelectorAll("[portal-step]"),
    specSidebar: document.querySelector('[data-form="specification"]'),
    packetSidebar: document.querySelector('[data-form="packet-details"]'),
    bottomNav: document.querySelector('[data-form="button-wrap"]'),
    nextBtn: document
      .querySelector('[data-form="button-wrap"]')
      ?.querySelector('[data-form="next"]'),
    backBtn: document.querySelector('[data-form="back"]'),
    form: document.getElementById("wf-form-Portal"),
    ptCheckbox: document.querySelector('[data-form="personal-training"]'),
  };

  // --- CORE UI/UX UPDATES ---
  function toggleError(input, show, message = "") {
    const errorEl = input.nextElementSibling;
    if (errorEl && errorEl.getAttribute("data-input-form") === "error-msg") {
      errorEl.textContent = message;
      errorEl.style.display = show ? "block" : "none";
    }
  }

  function updatePricingUi() {
    const ptSidebarItem = document.querySelector(
      '[data-form="training-condition"]'
    );
    const sumElement = document.querySelector('[data-form="sum"]');
    const isPtSelected = DOM.ptCheckbox?.checked || false;

    if (ptSidebarItem) {
      ptSidebarItem.style.display = isPtSelected ? "grid" : "none";
    }

    const ptTermsItem = document
      .querySelector('[data-form="agree-terms-pt"]')
      ?.closest(".form_main_item");
    if (ptTermsItem) {
      ptTermsItem.style.display = isPtSelected ? "block" : "none";

      const ptTermsInput = ptTermsItem.querySelector('input[type="checkbox"]');
      if (ptTermsInput) {
        if (isPtSelected) {
          ptTermsInput.setAttribute("required", "required");
        } else {
          ptTermsInput.removeAttribute("required");
          ptTermsInput.checked = false;
        }
      }
    }

    let total =
      pricingState.starterFee +
      pricingState.recurringPrice +
      pricingState.serviceFee;
    if (isPtSelected) total += pricingState.ptAddonFee;

    if (sumElement) {
      sumElement.innerText = `${total.toFixed(2)}€`;
    }
  }

  function updateContractDates(bonusDays = 0) {
    const today = new Date();
    const futureDate = new Date();

    console.log("update date: " + bonusDays);

    futureDate.setDate(today.getDate() + bonusDays);

    const formatDate = (date) =>
      `${String(date.getDate()).padStart(2, "0")}.${String(
        date.getMonth() + 1
      ).padStart(2, "0")}.${date.getFullYear()}`;

    const currentStr = formatDate(today);
    const startStr = formatDate(futureDate);

    document
      .querySelectorAll('[data-form="current-date"]')
      .forEach((el) => (el.innerText = currentStr));
    document
      .querySelectorAll('[data-form="start-date"]')
      .forEach((el) => (el.innerText = startStr));

    formData["Trainingsstart"] = currentStr;
    formData["Vertragsbeginn"] = startStr;
  }

  function updateUI() {
    DOM.steps.forEach((step) => {
      step.style.display =
        parseInt(step.getAttribute("portal-step")) === currentStep
          ? "flex"
          : "none";
    });

    updateStepProgress(currentStep);

    if (currentStep === 1) {
      if (DOM.specSidebar) DOM.specSidebar.style.display = "flex";
      if (DOM.packetSidebar) DOM.packetSidebar.style.display = "none";
      if (DOM.bottomNav) DOM.bottomNav.style.display = "none";
    } else {
      if (DOM.specSidebar) DOM.specSidebar.style.display = "none";
      if (DOM.packetSidebar) DOM.packetSidebar.style.display = "flex";
      if (DOM.bottomNav) DOM.bottomNav.style.display = "flex";

      const currentStepEl = document.querySelector(
        `[portal-step="${currentStep}"]`
      );

      initConditionalInput(currentStepEl);

      currentStepEl.querySelectorAll("input, select").forEach((input) => {
        input.addEventListener("input", validateStep);
        input.addEventListener("change", validateStep);

        if (input.type === "email") {
          input.addEventListener("blur", handleEmailBlur);
        }
        if (input.type === "tel") {
          input.addEventListener("input", handleTelInput);
        }

        if (input.name === "IBAN") {
          input.addEventListener("blur", handleIbanBlur);
          input.addEventListener("input", (e) => {
            e.target.dataset.invalid = "true";
            validateStep();
          });
        }

        if (input.name === "Kontoinhaber") {
          input.addEventListener("blur", handleAccountHolderBlur);
          input.addEventListener("input", (e) => {
            e.target.dataset.invalid = "true";
            validateStep();
          });
        }
      });

      validateStep();
    }

    const nextBtnText = DOM.nextBtn?.querySelector("[data-np-autofill-submit]");

    if (nextBtnText) {
      if (currentStep === 2) {
        nextBtnText.innerText = "Weiter zu Kontaktdaten";
      } else if (currentStep === 4) {
        nextBtnText.innerText = "Weiter zur Überprüfung";
      } else if (currentStep === 5) {
        nextBtnText.innerText = "Mitgliedschaft abschließen";
      } else {
        nextBtnText.innerText = "Weiter zu Zahlungsdaten";
      }
    }

    initEditButtons();
    if (currentStep === 5) populateSummary();
  }

  // --- PRODUCT SELECTION ---
  function selectProduct(product, index = null) {
    const unitMapping = {
      DAY: "Tage",
      MONTH: "Monat",
      YEAR: "Jahr",
    };

    const term = product.terms[0];
    const bonusDays = term?.rateBonusPeriods?.[0]?.termValue || 0;
    const bonusUnit = term?.rateBonusPeriods?.[0]?.termUnit || "";

    console.log(bonusDays);

    console.log("product: " + term);
    console.log("bonus day: " + bonusDays);

    updateContractDates(bonusDays);

    if (index === 0) {
      term.paymentFrequencyValue = 12;
      term.paymentFrequencyUnit = "MONTH";
    } else if (index === 1) {
      term.paymentFrequencyValue = 28;
      term.paymentFrequencyUnit = "DAY";
    }

    const unit = term.paymentFrequencyUnit;
    let durationInDays = term.paymentFrequencyValue;
    const daysMultiplier = { MONTH: 30, YEAR: 365, WEEK: 7 };

    if (daysMultiplier[unit]) durationInDays *= daysMultiplier[unit];

    const starterFee =
      term.flatFees.find((f) => f.name === "Startgebühr" || f.isStarterPackage)
        ?.price || 0;
    const recurringPrice = term.price;
    const calculatedServiceFee = Math.max(
      0,
      (recurringPrice / durationInDays) * (durationInDays - 14)
    );

    pricingState.starterFee = starterFee;
    pricingState.recurringPrice = recurringPrice;
    pricingState.serviceFee = calculatedServiceFee;

    formData["rateBundleTermId"] = term.id;
    formData["Mitgliedschaft"] = product.name;
    formData["Mitgliedsbeitrag"] = `${recurringPrice.toFixed(2)}€`;
    formData["Startgebuehr"] = `${starterFee.toFixed(2)}€`;

    if (DOM.packetSidebar) {
      const updateText = (selector, text) => {
        const el = DOM.packetSidebar.querySelector(`[data-form="${selector}"]`);
        if (el) el.innerText = text;
      };

      updateText("membership", product.name);
      updateText("membership-fee", formData["Mitgliedsbeitrag"]);
      updateText("registration-fee", formData["Startgebuehr"]);
      updateText("restmonat", `${calculatedServiceFee.toFixed(2)}€`);
      updateText("contract-duration", bonusDays);

      const unitMap = { DAY: "Tage", MONTH: "Monate", YEAR: "Jahre" };
      updateText("contract-unit", unitMap[bonusUnit] || bonusUnit);

      const cancelUnitText =
        term.cancellationPeriodUnit === "WEEK" ? "Wochen" : "Monat";
      updateText(
        "cancellation-period",
        `${term.cancellationPeriod} ${cancelUnitText}`
      );

      updatePricingUi();
    }

    currentStep = 2;
    updateUI();
  }

  function initPortalLogic() {
    const savedProduct = sessionStorage.getItem("selected_product");
    if (savedProduct) {
      selectProduct(JSON.parse(savedProduct));
      sessionStorage.removeItem("selected_product");
      return;
    }

    document.querySelectorAll(".membership_card").forEach((card, index) => {
      card
        .querySelectorAll('[data-form="next"], [data-portal="choice"]')
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            selectProduct(JSON.parse(card.dataset.raw), index);
            window.scrollTo(0, 0);
          });
        });
    });
  }

  // --- VALIDATIONS & HELPERS ---
  async function validateStep() {
    if (currentStep === 1 || !DOM.nextBtn) return;

    const currentStepEl = document.querySelector(
      `[portal-step="${currentStep}"]`
    );
    if (!currentStepEl) return;

    let allFieldsValid = true;

    currentStepEl
      .querySelectorAll("input, select, textarea")
      .forEach((input) => {
        let isValid = true;

        if (input.hasAttribute("required")) {
          if (input.type === "checkbox") {
            isValid = input.checked;
          } else if (input.type === "radio") {
            isValid = !!currentStepEl.querySelector(
              `input[name="${input.name}"]:checked`
            );
          } else {
            isValid = input.value.trim() !== "";
          }
        }

        if (isValid && input.type === "email" && input.value) {
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        }
        if (isValid && input.type === "tel" && input.value) {
          isValid = /^\+?\d+$/.test(input.value);
        }
        if (input.dataset.invalid === "true") {
          isValid = false;
        }

        if (!isValid) allFieldsValid = false;
      });

    const isDisabled = !allFieldsValid || isEmailValidating || isBankValidating;
    DOM.nextBtn.disabled = isDisabled;
    DOM.nextBtn.style.opacity = isDisabled ? "0.5" : "1";
    DOM.nextBtn.style.pointerEvents = isDisabled ? "none" : "auto";
  }

  async function handleEmailBlur(e) {
    const input = e.target;
    const email = input.value.trim();

    if (email.includes("@")) {
      isEmailValidating = true;
      validateStep();
      toggleError(input, true, "Wird geprüft...");

      try {
        const res = await fetch(
          `https://dns.google/resolve?name=${email.split("@")[1]}&type=MX`
        );
        const data = await res.json();
        const valid = res.ok && data.Answer && data.Answer.length > 0;

        input.dataset.invalid = valid ? "false" : "true";
        toggleError(
          input,
          !valid,
          valid ? "" : "E-Mail-Domain nicht gefunden."
        );
      } catch (err) {
        toggleError(input, true, "Fehler bei Validierung.");
      } finally {
        isEmailValidating = false;
        validateStep();
      }
    }
  }

  // --- BANK VALIDATION ---
  async function handleIbanBlur(e) {
    const input = e.target;
    const iban = input.value.replace(/\s+/g, "");

    if (iban.length === 0) return;

    if (iban.length < 15) {
      input.dataset.invalid = "true";
      toggleError(
        input,
        true,
        "Die eingegebene IBAN ist zu kurz. Eine gültige IBAN hat mindestens 15 Zeichen."
      );
      validateStep();
      return;
    }

    isBankValidating = true;
    validateStep();
    toggleError(input, true, "IBAN wird geprüft...");

    try {
      const query = new URLSearchParams({ iban: iban }).toString();
      const resp = await fetch(`${API_URL}/validations/iban?${query}`, {
        method: "GET",
      });

      const responseData = await resp.json();

      let valid = true;
      let errorMessage = "";

      if (responseData.validIban !== true) {
        valid = false;
        errorMessage =
          "Die eingegebene IBAN ist ungültig. Bitte überprüfen Sie die Zahlenfolge.";
      } else if (responseData.bankName == null) {
        valid = false;
        errorMessage =
          "Zu dieser IBAN konnte keine Bank gefunden werden. Bitte überprüfen Sie Ihre Eingabe.";
      }

      input.dataset.invalid = valid ? "false" : "true";
      toggleError(input, !valid, errorMessage);
    } catch (err) {
      input.dataset.invalid = "true";
      toggleError(
        input,
        true,
        "Verbindungsfehler bei der IBAN-Prüfung. Bitte versuchen Sie es später noch einmal."
      );
    } finally {
      isBankValidating = false;
      validateStep();
    }
  }

  async function handleAccountHolderBlur(e) {
    const input = e.target;
    const name = input.value.trim();

    if (name.length === 0) return;

    if (name.length < 3) {
      input.dataset.invalid = "true";
      toggleError(input, true, "Der Name muss mindestens 3 Zeichen lang sein.");
      validateStep();
      return;
    }

    isBankValidating = true;
    validateStep();
    toggleError(input, true, "Wird geprüft...");

    try {
      const query = new URLSearchParams({ accountHolder: name }).toString();
      const resp = await fetch(
        `${API_URL}/validations/account-holder?${query}`,
        {
          method: "GET",
        }
      );

      const responseData = await resp.json();
      const valid = responseData.valid === true;

      input.dataset.invalid = valid ? "false" : "true";
      const errorMessage = valid
        ? ""
        : responseData.errorMessages?.[0] || "Ungültiger Kontoinhaber.";
      toggleError(input, !valid, errorMessage);
    } catch (err) {
      input.dataset.invalid = "true";
      toggleError(input, true, "Fehler bei der Überprüfung.");
    } finally {
      isBankValidating = false;
      validateStep();
    }
  }

  function handleTelInput(e) {
    e.target.value = e.target.value.replace(/[^\d+]/g, "");
    validateStep();
  }

  function captureCurrentStepData() {
    document
      .querySelector(`[portal-step="${currentStep}"]`)
      ?.querySelectorAll("input, select, textarea")
      .forEach((input) => {
        if (input.type === "radio") {
          if (input.checked) formData[input.name] = input.value;
        } else if (input.type === "checkbox") {
          formData[input.name] = input.checked ? "Ja" : "Nein";
        } else {
          formData[input.name] = input.value;
        }
      });
  }

  function initConditionalInput(container) {
    const condInput = container.querySelector('[data-form="input-condition"]');
    if (!condInput) return;

    const wrapper = condInput.parentElement;

    const update = () => {
      const isWeitere =
        container.querySelector('input[type="radio"]:checked')?.value ===
        "Sonstiges";
      wrapper.style.display = isWeitere ? "block" : "none";

      if (isWeitere) {
        condInput.setAttribute("required", "required");
      } else {
        condInput.removeAttribute("required");
        condInput.value = "";
        toggleError(condInput, false);
      }
      validateStep();
    };

    container
      .querySelectorAll('input[type="radio"]')
      .forEach((r) => r.addEventListener("change", update));
    update();
  }

  function initEditButtons() {
    document.querySelectorAll("[data-form-edit]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const targetStep = parseInt(btn.getAttribute("data-form-edit"));
        if (targetStep) {
          currentStep = targetStep;
          updateUI();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
    });
  }

  function populateSummary() {
    updatePricingUi();

    document.querySelectorAll(".portal_result_item").forEach((item) => {
      const title = item
        .querySelector(".portal_result_title")
        ?.innerText.trim();
      const descEl = item.querySelector(".portal_result_desc");
      if (title && formData[title]) descEl.innerText = formData[title];
    });

    const selectedSource = formData["Wie bist du auf uns aufmerksam geworden?"];
    const extraInfo = formData["Weitere"];
    const radioDisplay = document.querySelector('[data-form="radio-value"]');
    const additionalDisplay = document.querySelector(
      '[data-form="radio-input-value"]'
    );

    if (radioDisplay) radioDisplay.innerText = selectedSource || "";
    if (additionalDisplay) {
      if (selectedSource === "Weitere" && extraInfo?.trim()) {
        additionalDisplay.innerText = extraInfo;
        additionalDisplay.style.display = "block";
      } else {
        additionalDisplay.style.display = "none";
        additionalDisplay.innerText = "";
      }
    }

    const ageContainer = document.querySelector('[data-from="age-condition"]');
    if (ageContainer) {
      const formatISO = (str) =>
        str
          ? `${str.split(".")[2]}-${str.split(".")[1]}-${str.split(".")[0]}`
          : "";

      const birthDate = new Date(formatISO(formData["Geburtstag"]));
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const isMinor =
        age < 18 ||
        (age === 18 &&
          new Date() <
            new Date(
              new Date().getFullYear(),
              birthDate.getMonth(),
              birthDate.getDate()
            ));

      ageContainer.style.display = isMinor ? "grid" : "none";
      ageContainer
        .querySelectorAll("input")
        .forEach((input) =>
          isMinor
            ? input.setAttribute("required", "required")
            : input.removeAttribute("required")
        );
    }

    validateStep();
  }

  function updateStepProgress(step) {
    const svgEl = document.querySelector(".portal_head_step");
    const originalPath = document.getElementById("progress-ring");
    let progressCircle = document.getElementById("gsap-progress-circle");

    if (!progressCircle && svgEl) {
      if (originalPath) originalPath.style.display = "none";

      progressCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      progressCircle.setAttribute("id", "gsap-progress-circle");
      progressCircle.setAttribute("cx", "27");
      progressCircle.setAttribute("cy", "27");
      progressCircle.setAttribute("r", "24.3");
      progressCircle.setAttribute("fill", "none");
      progressCircle.setAttribute("stroke", "#008BD2");
      progressCircle.setAttribute("stroke-width", "5.4");
      progressCircle.setAttribute("stroke-linecap", "round");
      progressCircle.setAttribute("transform", "rotate(-90 27 27)");

      svgEl.appendChild(progressCircle);
    }

    if (progressCircle) {
      const circumference = 2 * Math.PI * 24.3;
      const totalSteps = 6;

      gsap.set(progressCircle, { strokeDasharray: circumference });

      const progress = Math.min(step / totalSteps, 1);

      gsap.to(progressCircle, {
        strokeDashoffset: circumference * (1 - progress),
        duration: 0.8,
        ease: "power2.out",
      });
    }

    const stepNumberDiv = document.querySelector(
      ".portal_from_progress div:first-child"
    );
    if (stepNumberDiv && stepNumberDiv.innerText !== step.toString()) {
      gsap.to(stepNumberDiv, {
        y: -10,
        opacity: 0,
        duration: 0.2,
        onComplete: () => (stepNumberDiv.innerText = step),
      });
      gsap.fromTo(
        stepNumberDiv,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)", delay: 0.2 }
      );
    }

    const heading = document.querySelector(".portal_heading");
    const desc = document.querySelector(".portal_desc");

    if (heading && heading.getAttribute(`text-step-${step}`)) {
      heading.innerText = heading.getAttribute(`text-step-${step}`);
    }
    if (desc && desc.getAttribute(`text-step-desc-${step}`)) {
      desc.innerText = desc.getAttribute(`text-step-desc-${step}`);
    }
  }

  // --- API SUBMIT ---
  async function submitContract() {
    const errorContainer = DOM.bottomNav?.querySelector(
      ".form_main_label_error"
    );
    if (errorContainer) {
      errorContainer.style.display = "none";
      errorContainer.innerText = "";
    }

    const formatISO = (str) =>
      str
        ? `${str.split(".")[2]}-${str.split(".")[1]}-${str.split(".")[0]}`
        : "";

    const payload = {
      studioId: 1210012010,
      contract: {
        rateBundleTermId: formData["rateBundleTermId"],
        startDate: formatISO(formData["Vertragsbeginn"]),
        preuseDate: formatISO(formData["Trainingsstart"]),
        contractSignature: {
          base64Svg:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==",
          textBlockId: 0,
        },
      },
      customer: {
        firstname: formData["Vorname"],
        lastname: formData["Nachname"],
        gender: formData["Geschlecht"] === "Männlich" ? "MALE" : "FEMALE",
        dateOfBirth: formatISO(formData["Geburtstag"]),
        email: formData["E-Mail-Adresse"],
        telephone_mobile: formData["Telefonnummer"],
        street: formData["Straße"],
        houseNumber: formData["Nr."],
        zipCode: formData["PLZ"],
        city: formData["Ort"],
        countryCode: "DE",
        paymentChoice: "DIRECT_DEBIT",
        bankAccount: {
          accountHolder: formData["Kontoinhaber"],
          iban: formData["IBAN"],
        },
        communicationPreferences: [
          { messageCategoryId: 1, activeCommunicationChannels: ["EMAIL"] },
        ],
      },
    };

    try {
      const resp = await fetch(`${API_URL}/contracts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await resp.json();

      if (resp.ok) {
        const ptCheckbox = document.querySelector(
          '[data-form="personal-training"]'
        );
        const isPTChecked = ptCheckbox?.checked ?? false;

        if (isPTChecked) {
          if (isPTChecked) {
            // 1. Cari form Personal Training
            const ptForm = document.getElementById(
              "wf-form-Personal-Training-2"
            );

            if (ptForm) {
              const nameInput = ptForm.querySelector('input[name="Name"]');
              const emailInput = ptForm.querySelector(
                'input[name="E-Mail Adresse"]'
              );
              const phoneInput = ptForm.querySelector(
                'input[name="Telefonnummer"]'
              );

              if (nameInput) {
                nameInput.value = `${formData["Vorname"] || ""} ${
                  formData["Nachname"] || ""
                }`.trim();
              }
              if (emailInput) {
                emailInput.value = formData["E-Mail-Adresse"] || "";
              }
              if (phoneInput) {
                phoneInput.value = formData["Telefonnummer"] || "";
              }

              let ptSubmitTrigger = document.createElement("input");
              ptSubmitTrigger.type = "submit";
              ptSubmitTrigger.style.display = "none";
              ptForm.appendChild(ptSubmitTrigger);
              ptSubmitTrigger.click();
              ptSubmitTrigger.remove();
            }
          }
        }

        let submitTrigger = document.createElement("input");
        submitTrigger.type = "submit";
        submitTrigger.style.display = "none";
        DOM.form.appendChild(submitTrigger);
        submitTrigger.click();
        submitTrigger.remove();
      } else {
        let errorMsg = result.errorCodes?.includes("INVALID_IBAN")
          ? "Die angegebene IBAN ist ungültig. Bitte prüfen."
          : `Fehler: ${
              result.message || "Die Buchung konnte nicht verarbeitet werden."
            }`;

        if (errorContainer) {
          errorContainer.innerText = errorMsg;
          errorContainer.style.display = "block";
        }
      }
    } catch (error) {
      console.error("Detail Error:", error);
      if (errorContainer) {
        errorContainer.innerText =
          "Netzwerkfehler: Verbindung zum Buchungssystem fehlgeschlagen.";
        errorContainer.style.display = "block";
      }
    } finally {
      if (DOM.nextBtn) {
        DOM.nextBtn.innerText = "Mitgliedschaft abschließen";
        DOM.nextBtn.disabled = false;
      }
    }
  }

  // --- EVENT LISTENERS ---
  DOM.ptCheckbox?.addEventListener("change", updatePricingUi);

  DOM.nextBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    captureCurrentStepData();

    if (currentStep < totalSteps) {
      currentStep++;
      updateUI();
    } else {
      DOM.nextBtn.disabled = true;
      DOM.nextBtn.innerText = "Wird verarbeitet...";
      await submitContract();
    }
    window.scrollTo(0, 0);
  });

  DOM.backBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentStep > 1) {
      currentStep--;
      updateUI();
    }
    window.scrollTo(0, 0);
  });

  // Init
  initPortalLogic();
  updateUI();
}

// ==========================================
// --- INITIALIZATION ---
// ==========================================

async function initFunction() {
  await getProduct();
  stepForm();
}

window.addEventListener("DOMContentLoaded", initFunction);

document.querySelector(".d_portal_link")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/vertragsuebernahme";
});

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("dialog-purpose");
  const openBtn = document.querySelector(
    'a[data-modal-element="dialog-purpose"]'
  );
  const closeBtn = dialog.querySelector('button[command="close"]');

  // Membuka Dialog
  openBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Mencegah link pindah halaman
    dialog.showModal();
  });

  // Menutup Dialog
  closeBtn.addEventListener("click", () => {
    dialog.close();
  });

  // Opsional: Menutup dialog jika bagian luar (backdrop) diklik
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });
});
