const API_BASE = "https://magicline-proxy-coral.vercel.app/api";

// ==========================================
// STATE & VARIABLES
// ==========================================
let isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
let activeContracts = [];
let loginBody = null;
let portalLayouts = {};
let activeContractId = null;

// ==========================================
// SESSION MANAGEMENT
// ==========================================
function getResponseLogin() {
  try {
    const storedContracts = sessionStorage.getItem("activeContracts");
    const storedBody = sessionStorage.getItem("loginBody");

    if (storedContracts) activeContracts = JSON.parse(storedContracts);
    if (storedBody) loginBody = JSON.parse(storedBody);

    if (isLoggedIn && loginBody) {
      console.log("=== SESSION DATA LOADED ===");
      fetchContractData(loginBody.id);
    }
  } catch (e) {
    console.error("Gagal membaca data sesi", e);
  }
}

// ==========================================
// API SERVICES
// ==========================================

async function getCancelationReasons() {
  try {
    const response = await fetch(
      `${API_BASE}/self-services/cancelation-reason`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error("Gagal mengambil alasan pembatalan.");
    return data;
  } catch (error) {
    console.error("Error Fetch Reasons:", error);
    return null;
  }
}

async function fetchContractData(customerId) {
  try {
    const response = await fetch(
      `${API_BASE}/self-services/cencelation-contract?customerId=${customerId}`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (response.ok && data) {
      activeContractId = data[0]?.contractId || data.contractId || data[0]?.id;
      console.log("ID Kontrak aktif:", activeContractId);
    }
  } catch (error) {
    console.error("Gagal mengambil data kontrak:", error);
  }
}

async function performLoginApi(memberId) {
  const query = new URLSearchParams({ customerNumber: memberId }).toString();
  const response = await fetch(`${API_BASE}/customers/get-customer?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.errorCodes?.[0] || "VALIDATION_FAILED");
  return data;
}

async function getCustomerPaymentData(customerId) {
  try {
    const response = await fetch(
      `${API_BASE}/self-services/payment-data?customerId=${customerId}`,
      { method: "GET" }
    );
    const data = await response.json();
    return response.ok ? data : null;
  } catch (error) {
    return null;
  }
}

async function performCancellationApi(customerId, payload) {
  const response = await fetch(
    `${API_BASE}/self-services/cencelation-contract?customerId=${customerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "CANCELLATION_FAILED");
  return data;
}

// ==========================================
// DYNAMIC UI: GENERATE RADIOS
// ==========================================
async function populateCancelationRadios() {
  const listContainer = document.querySelector(".d_portal_list");
  if (!listContainer) return;

  const reasons = await getCancelationReasons();
  if (!reasons || !Array.isArray(reasons)) return;

  listContainer.innerHTML = "";

  reasons.forEach((reason) => {
    const li = document.createElement("li");
    li.className = "d_portal_item";

    const reasonId = reason.cancelationReasonId || reason.id;
    const reasonName = reason.cancelationReasonName || reason.name;

    li.innerHTML = `
      <div data-wf--form-radio--variant="base" role="listitem" class="form_main_item">
        <label class="form_main_radio_label">
          <input type="radio" name="Kündigungsgrund" class="form_main_radio_input" value="${reasonId}" data-name="Cancellation Reason">
          <span class="form_main_radio_circle_wrap">
            <span class="form_main_radio_circle_inner"></span>
          </span>
          <span class="form_main_radio_text">${reasonName}</span>
        </label>
      </div>
    `;
    listContainer.appendChild(li);
  });

  const textareaLi = document.createElement("li");
  textareaLi.className = "d_portal_item";
  textareaLi.innerHTML = `
    <label id="extra-comment-area" class="form_main_label_wrap" style="display: none;">
      <span class="form_main_label_text">Schreibe Hier</span>
      <textarea name="Schreibe Hier" placeholder="Schreibe Hier" data-form="input-condition" class="form_main_field is-textarea"></textarea>
    </label>
  `;
  listContainer.appendChild(textareaLi);

  attachRadioListeners();
}

function attachRadioListeners() {
  const radios = document.querySelectorAll('input[name="Kündigungsgrund"]');
  const extraArea = document.getElementById("extra-comment-area");
  const otherInput = document.querySelector('[data-form="input-condition"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (extraArea) {
        // 3. Ubah pengecekan menggunakan ID dari API
        extraArea.style.display =
          e.target.value === "1210116460" ? "block" : "none";
      }

      updateRadioVisuals();
      checkValidation();
    });
  });

  if (otherInput) {
    otherInput.addEventListener("input", checkValidation);
  }

  checkValidation();
}

function updateRadioVisuals() {
  document.querySelectorAll(".form_main_item").forEach((item) => {
    const isChecked = item.querySelector("input").checked;
    if (isChecked) {
      item.classList.add("is-checked");
    } else {
      item.classList.remove("is-checked");
    }
  });
}

// ==========================================
// VIEW CONTROLLERS
// ==========================================
const showView = (viewName) => {
  Object.keys(portalLayouts).forEach((key) => {
    if (portalLayouts[key]) {
      portalLayouts[key].style.display = key === viewName ? "flex" : "none";
    }
  });
};

const setLoginError = (message) => {
  const errorSpan = document.querySelector("[data-login='error-massage']");
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = message ? "block" : "none";
  }
};

const checkValidation = () => {
  const form = document.querySelector('form[name="wf-form-Mitgliederportal"]');
  if (!form) return;

  const submitBtnWrapper = form.querySelector(
    '[data-form="button-cancellation"]'
  );
  const submitBtn = submitBtnWrapper.querySelector(".clickable_btn");
  const selected = form.querySelector('input[name="Kündigungsgrund"]:checked');
  const otherInput = form.querySelector('[data-form="input-condition"]');

  let isValid = !!selected;
  if (
    selected &&
    selected.value === "1210116460" &&
    otherInput.value.trim() === ""
  ) {
    isValid = false;
  }

  submitBtn.disabled = !isValid;
  submitBtnWrapper.style.opacity = isValid ? "1" : "0.5";
  submitBtnWrapper.style.pointerEvents = isValid ? "auto" : "none";
};

// ==========================================
// HANDLERS
// ==========================================
async function handleManualLogin() {
  const loginBtnWrap = document.querySelector(
    '[data-portal="login"] .button_main_wrap'
  );
  const btnText = loginBtnWrap
    ? loginBtnWrap.querySelector(".button_main_text")
    : null;
  const originalText = btnText ? btnText.textContent : "Login";

  const memberIdEl = document.querySelector('[data-login="memberId"]');
  const fnameEl = document.querySelector('[data-login="first-name"]');
  const lnameEl = document.querySelector('[data-login="last-name"]');
  const bdayEl = document.querySelector('[data-login="birthday"]');

  if (!memberIdEl || !fnameEl || !lnameEl || !bdayEl) return;

  const memberId = memberIdEl.value.trim();
  const fname = fnameEl.value.trim().toLowerCase();
  const lname = lnameEl.value.trim().toLowerCase();
  const bday = bdayEl.value;

  if (btnText) btnText.textContent = "Prüfe...";

  try {
    const responseData = await performLoginApi(memberId);
    const customerData = Array.isArray(responseData)
      ? responseData[0]
      : responseData;

    const apiFirstName = (
      customerData.firstname ||
      customerData.firstName ||
      ""
    ).toLowerCase();
    const apiLastName = (
      customerData.lastname ||
      customerData.lastName ||
      ""
    ).toLowerCase();
    const apiBday = (customerData.dateOfBirth || "").split("T")[0];

    if (apiFirstName !== fname || apiLastName !== lname || apiBday !== bday) {
      throw new Error("DATA_MISMATCH");
    }

    const paymentData = await getCustomerPaymentData(customerData.id);
    isLoggedIn = true;
    loginBody = { ...customerData, paymentInfo: paymentData };

    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("loginBody", JSON.stringify(loginBody));

    await fetchContractData(customerData.id);

    // fillHiddenInputs(customerData);
    showView("menu");
    setLoginError("");
  } catch (err) {
    setLoginError("Login fehlgeschlagen. Bitte Daten prüfen.");
  } finally {
    if (btnText) btnText.textContent = originalText;
  }
}

function initCancellationForm() {
  const form = document.querySelector('form[name="wf-form-Mitgliederportal"]');
  if (!form) return;

  // 1. Elemen UI
  const submitBtnWrapper = form.querySelector(
    '[data-form="button-cancellation"]'
  );
  const submitBtn = submitBtnWrapper.querySelector(".clickable_btn");
  const btnTextElement = submitBtnWrapper.querySelector(".button_main_text");
  const errorElement = form.querySelector('[data-form="cancelation-error"]');
  const otherInput = form.querySelector('[data-form="input-condition"]');
  const cancelBtn = form.querySelector('[data-form="button-cancel"]');

  // Sembunyikan error di awal
  if (errorElement) errorElement.style.display = "none";

  // 2. Fungsi Helper untuk Menampilkan Error
  const showError = (msg) => {
    if (errorElement) {
      errorElement.textContent = msg;
      errorElement.style.display = "block";
    } else {
      alert(msg);
    }
  };

  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showView("menu");

      form.reset();

      const extraArea = document.getElementById("extra-comment-area");
      if (extraArea) {
        extraArea.style.display = "none";
      }

      if (typeof updateRadioVisuals === "function") {
        updateRadioVisuals();
      }

      checkValidation();
    });
  }

  // 3. Event Listener Klik
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // Reset State
    if (errorElement) errorElement.style.display = "none";

    // Validasi Sesi & Kontrak
    if (!isLoggedIn || !loginBody || !activeContractId) {
      showError("Session ungültig. Bitte erneut einloggen.");
      return;
    }

    // Validasi Pilihan Radio
    const selectedRadio = form.querySelector(
      'input[name="Kündigungsgrund"]:checked'
    );
    if (!selectedRadio) {
      showError("Bitte wählen Sie den Stornierungsgrund.");
      return;
    }

    // Visual Loading
    const originalText = btnTextElement.textContent;
    btnTextElement.textContent = "Bitte warten...";
    submitBtn.disabled = true;

    try {
      // A. Isi Hidden Inputs dari loginBody sebelum kirim
      form.querySelector('input[name="First Name"]').value =
        loginBody.firstName || "";
      form.querySelector('input[name="Last Name"]').value =
        loginBody.lastName || "";
      form.querySelector('input[name="Member ID"]').value = activeContractId;
      form.querySelector('input[name="Date of Birth"]').value =
        loginBody.dateOfBirth || "";

      // B. Jalankan API Request
      const payload = {
        cancelationDate: new Date().toISOString().split("T")[0],
        cancelationReasonId:
          selectedRadio.value === "Weitere" ? 0 : Number(selectedRadio.value),
        contractId: Number(activeContractId),
      };

      await performCancellationApi(loginBody.id, payload);

      // C. Submit Form secara fisik (Trigger Webflow/Action)
      // Menggunakan requestSubmit agar event submit standar tetap terpancing
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    } catch (err) {
      // Tampilkan error dari response API
      showError(err.message || "Gagal mengirim permintaan.");

      // Kembalikan tombol ke kondisi normal
      btnTextElement.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ==========================================
// INITIALIZATION
// ==========================================
function initPortal() {
  const dialogElem = document.getElementById("dialog-portal");
  const closeBtn = document.querySelector('[command="close"]');
  const loginSubmitBtn = document.querySelector(
    '[data-portal="login"] .clickable_btn'
  );
  // const showBtns = document.querySelectorAll(
  //   ".hero_layout .button_main_wrap, [data-trigger='portal'], .nav_links_card, .main_hero_card_wrap"
  // );
  const showBtns = document.querySelectorAll(
    "[data-trigger='portal'], .nav_links_card, .main_hero_card_wrap"
  );

  if (!dialogElem) return;

  portalLayouts = {
    login: dialogElem.querySelector('[data-portal="login"]'),
    menu: dialogElem.querySelector('[data-portal="menu"]'),
    cancellation: dialogElem.querySelector('[data-portal="cancellation"]'),
  };

  getResponseLogin();
  showView("menu");
  populateCancelationRadios();
  initCancellationForm();

  if (loginSubmitBtn)
    loginSubmitBtn.addEventListener("click", handleManualLogin);
  if (closeBtn) closeBtn.addEventListener("click", () => dialogElem.close());

  showBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      showView("menu");
      dialogElem.showModal();
    })
  );

  const menuLinks = portalLayouts.menu.querySelectorAll(".d_portal_link");
  menuLinks.forEach((link, idx) => {
    link.addEventListener("click", (e) => {
      // if (!isLoggedIn && idx !== 0 && idx !== 2) {
      //   e.preventDefault();
      //   showView("login");
      if (idx === 1 && !isLoggedIn) {
        e.preventDefault();
        showView("login");
      } else if (link.dataset.portal === "trigger-cancellation") {
        e.preventDefault();
        showView("cancellation");
      }
    });
  });
}

function fillHiddenInputs(loginBody) {
  const form = document.querySelector('form[name="wf-form-Mitgliederportal"]');
  if (!form || !loginBody) return;

  const fields = {
    "First Name": loginBody.firstName,
    "Last Name": loginBody.lastName,
    "Member ID": loginBody.customerNumber,
    "Date of Birth": loginBody.dateOfBirth,
  };

  Object.keys(fields).forEach((name) => {
    const input = form.querySelector(`input[name="${name}"]`);
    if (input) {
      input.value = fields[name] ?? "";
    }
  });

  console.log("Versteckte Eingabefelder wurden ausgefüllt.");
}

document.addEventListener("DOMContentLoaded", initPortal);

window.addEventListener("beforeunload", function (e) {
  localStorage.clear();
});

const fourHoursInMs = 4 * 60 * 60 * 1000;

setTimeout(function () {
  localStorage.clear();

  window.location.reload();
}, fourHoursInMs);
