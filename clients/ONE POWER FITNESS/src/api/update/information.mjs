const API_URL = "https://magicline-proxy-coral.vercel.app/api";
let customerId = null;
let userData = null;

let bankDetails = {
  bankCity: "",
  bankName: "",
  bankZip: "",
  bic: "",
  supportsSepaDirectDebit: false,
  validIban: false,
};

try {
  const localData = sessionStorage.getItem("loginBody");

  if (!localData) {
    window.location.href = "/";
  } else {
    userData = JSON.parse(localData);
    customerId = userData.id;
  }
} catch (e) {
  console.error("Login data error:", e);

  window.location.href = "/";
}

const initialStates = {};
let isBankValidating = false;

async function initializeBankDetails() {
  try {
    const ibanInput = document.querySelector('input[name="IBAN"]');

    if (!ibanInput || !ibanInput.value.trim()) {
      return;
    }

    const iban = ibanInput.value.replace(/\s+/g, "");

    if (iban.length < 15) return;

    console.log("Menyinkronkan detail bank menggunakan endpoint validasi...");

    const resp = await fetch(`${API_URL}/validations/iban?iban=${iban}`);
    const data = await resp.json();

    if (data.validIban) {
      // 4. Update Global State
      bankDetails.bankCity = data.bankCity || "";
      bankDetails.bankName = data.bankName || "";
      bankDetails.bankZip = data.bankZip || "";
      bankDetails.bic = data.bic || "";
      bankDetails.supportsSepaDirectDebit =
        data.supportsSepaDirectDebit || false;
      bankDetails.validIban = true;
    } else {
      console.warn("IBAN tidak valid menurut API.");
      bankDetails.validIban = false;
    }
  } catch (err) {
    console.error("Gagal sinkronisasi IBAN:", err);
  }
}

// 2. Fungsi UI
function toggleError(input, isError, message) {
  if (!input) return;
  let errorEl = input.parentElement.querySelector(".form_main_label_error");
  if (isError) {
    input.style.borderColor = "#d9534f";
    if (errorEl) {
      errorEl.innerText = message;
      errorEl.style.display = "block";
    }
  } else {
    input.style.borderColor = "";
    if (errorEl) errorEl.style.display = "none";
  }
}

function setBtnState(btn, state, text) {
  if (!btn) return;
  const textEl = btn.querySelector(".button_main_text") || btn;
  if (!btn.dataset.originalText) btn.dataset.originalText = textEl.innerText;

  if (state === "loading") {
    textEl.innerText = text;
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
  } else if (state === "disabled") {
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
    textEl.innerText = btn.dataset.originalText;
  } else {
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
    textEl.innerText = btn.dataset.originalText;
  }
}

// 3. Validasi & Capture State
function captureInitialState(wrapper) {
  const inputs = wrapper.querySelectorAll("input.form_main_field");
  inputs.forEach((input) => {
    const key = input.name;
    initialStates[key] = input.value.trim();
    input.addEventListener("input", () => evaluateButtonState(wrapper));
  });
  evaluateButtonState(wrapper);
}

function evaluateButtonState(wrapper) {
  const btn = wrapper.querySelector(
    '.button_main_wrap[data-wf--button-main--style="primary"]'
  );
  if (!btn || isBankValidating) return;

  const inputs = wrapper.querySelectorAll(
    "input.form_main_field:not([disabled])"
  );
  let hasChanges = false;
  let hasInvalid = false;

  inputs.forEach((input) => {
    if (input.dataset.invalid === "true") hasInvalid = true;
    if (input.value.trim() !== initialStates[input.name]) hasChanges = true;
  });

  setBtnState(btn, hasChanges && !hasInvalid ? "enabled" : "disabled");
}

// 4. API Logic
async function handleIbanBlur(e) {
  const input = e.target;
  const wrapper = input.closest(".information_wrap");
  const iban = input.value.replace(/\s+/g, "");

  if (iban.length < 15) return;

  isBankValidating = true;
  toggleError(input, true, "Prüfen...");

  try {
    const resp = await fetch(`${API_URL}/validations/iban?iban=${iban}`);
    const data = await resp.json();

    if (data.validIban) {
      // SIMPAN KE GLOBAL VARIABLE
      bankDetails.bankCity = data.bankCity || "";
      bankDetails.bankName = data.bankName || "";
      bankDetails.bankZip = data.bankZip || "";
      bankDetails.bic = data.bic || "";
      bankDetails.supportsSepaDirectDebit =
        data.supportsSepaDirectDebit || false;
      bankDetails.validIban = true;

      input.dataset.invalid = "false";
      toggleError(input, false, "");

      // Opsi: Jika Anda ingin mengisi otomatis field BIC jika ada di HTML
      const bicInput = wrapper.querySelector('input[name="BIC"]');
      if (bicInput && data.bic) bicInput.value = data.bic;
    } else {
      bankDetails.validIban = false;
      input.dataset.invalid = "true";
      toggleError(input, true, data.errorMessage || "Ungültige IBAN");
    }
  } catch (err) {
    console.error("IBAN Check Error:", err);
    input.dataset.invalid = "true";
  } finally {
    isBankValidating = false;
    evaluateButtonState(wrapper);
  }
}

async function handleAccountHolderBlur(e) {
  const input = e.target;
  const wrapper = input.closest(".information_wrap");
  const name = input.value.trim();

  // Jika kosong, biarkan sistem evaluateButtonState yang menangani (required check)
  if (name.length === 0) {
    return;
  }

  // Validasi karakter minimal lokal sebelum ke API
  if (name.length < 3) {
    input.dataset.invalid = "true";
    toggleError(input, true, "Der Name muss mindestens 3 Zeichen lang sein.");
    evaluateButtonState(wrapper);
    return;
  }

  isBankValidating = true;
  evaluateButtonState(wrapper);
  toggleError(input, true, "Wird geprüft...");

  try {
    const query = new URLSearchParams({ accountHolder: name }).toString();
    const resp = await fetch(`${API_URL}/validations/account-holder?${query}`, {
      method: "GET",
    });

    const data = await resp.json();
    const isValid = data.valid === true;

    input.dataset.invalid = isValid ? "false" : "true";

    const errorMessage = isValid
      ? ""
      : (data.errorMessages && data.errorMessages[0]) ||
        "Ungültiger Kontoinhaber.";

    toggleError(input, !isValid, errorMessage);
  } catch (err) {
    console.error("Account Holder Check Error:", err);
    input.dataset.invalid = "true";
    toggleError(input, true, "Fehler bei der Überprüfung.");
  } finally {
    isBankValidating = false;
    evaluateButtonState(wrapper);
  }
}

// 5. Execution
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector(".information_wrap");
  if (!wrap || !customerId) return;

  captureInitialState(wrap);
  initializeBankDetails();

  console.log(bankDetails);

  wrap
    .querySelector('input[name="IBAN"]')
    ?.addEventListener("blur", handleIbanBlur);

  wrap
    .querySelector('input[name="Kontoinhaber"]')
    ?.addEventListener("blur", handleAccountHolderBlur);

  const submitBtn = wrap.querySelector(
    '.button_main_wrap[data-wf--button-main--style="primary"]'
  );
  submitBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    setBtnState(submitBtn, "loading", "Speichern...");

    const getV = (name) => wrap.querySelector(`input[name="${name}"]`)?.value;

    // Persiapan Payload
    const payloadMaster = {
      firstName: userData.firstName,
      lastName: getV("Nachname"),
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      customerTitle: "NONE",
    };

    const payloadAddress = {
      street: getV("Straße"),
      houseNumber: getV("Nr."),
      zipCode: getV("PLZ"),
      city: getV("Ort"),
      countryCode: "DE",
      amendmentConfigurationStatus: "CHANGES_WITHOUT_VERIFICATION",
    };

    const payloadPayment = {
      accountHolder: getV("Kontoinhaber"),
      bankName: bankDetails.bankName,
      iban: getV("IBAN")?.replace(/\s+/g, ""),
      bic: bankDetails.bic,
    };

    const payloadContact = {
      email: getV("E-Mail-Adresse"),
      phonePrivateMobile: getV("Telefonnummer"),
    };

    try {
      // Jalankan semua update secara paralel
      await Promise.all([
        fetch(`${API_URL}/self-services/master-data?customerId=${customerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadMaster),
        }),
        fetch(
          `${API_URL}/self-services/updates/address-data?customerId=${customerId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadAddress),
          }
        ),
        fetch(
          `${API_URL}/self-services/payment-data?customerId=${customerId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadPayment),
          }
        ),
        fetch(
          `${API_URL}/self-services/updates/contact-data?customerId=${customerId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadContact),
          }
        ),
      ]);

      captureInitialState(wrap);
    } catch (err) {
      console.log(err);
    } finally {
      evaluateButtonState(wrap);
    }
  });
});
