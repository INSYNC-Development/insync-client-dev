function getInformation() {
  const form = document.querySelector(".information_wrap");
  if (!form) return;

  const storedData = sessionStorage.getItem("loginBody");
  if (!storedData) return;

  try {
    const userData = JSON.parse(storedData);

    console.log(userData);

    const fields = {
      firstName: form.querySelector('[data-form="first-name"]'),
      lastName: form.querySelector('[data-form="last-name"]'),
      email: form.querySelector('[data-form="email"]'),
      phone: form.querySelector('[data-from="phone"]'),
      street: form.querySelector('[data-from="street"]'),
      houseNumber: form.querySelector('[data-from="house-number"]'),
      zipCode: form.querySelector('[data-form="zip-code"]'),
      city: form.querySelector('[data-from="city"]'),
      iban: form.querySelector('[data-form="iban"]'),
      bankOwner: form.querySelector('[data-form="bank-name"]'),
    };

    if (fields.firstName)
      fields.firstName.value = userData.firstname || userData.firstName || "";
    if (fields.lastName)
      fields.lastName.value = userData.lastname || userData.lastName || "";
    if (fields.email) fields.email.value = userData.email || "";
    if (fields.phone)
      fields.phone.value =
        userData.phonePrivate ||
        userData.phonePrivateMobile ||
        userData.phoneBusiness ||
        userData.phoneBusinessMobile ||
        "";

    if (fields.street)
      fields.street.value = userData.street || userData.streetName || "";
    if (fields.houseNumber)
      fields.houseNumber.value =
        userData.houseNumber || userData.streetNumber || "";
    if (fields.zipCode)
      fields.zipCode.value = userData.zipCode || userData.zip || "";
    if (fields.city) fields.city.value = userData.city || "";

    if (fields.iban) fields.iban.value = userData.paymentInfo.iban || "";
    if (fields.bankOwner)
      fields.bankOwner.value =
        userData.paymentInfo.bankOwner ||
        userData.paymentInfo.accountHolder ||
        userData.paymentInfo.bankAccountOwner ||
        "";
  } catch (error) {
    console.error("Gagal memproses dan menampilkan data user:", error);
  }
}

function initFunction() {
  getInformation();
}

document.addEventListener("DOMContentLoaded", initFunction);
