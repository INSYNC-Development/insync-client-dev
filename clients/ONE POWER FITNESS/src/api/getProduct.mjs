const API_URL = "https://magicline-proxy-coral.vercel.app/api";

async function fetchProducts() {
  try {
    const resp = await fetch(`${API_URL}/contracts/rate-bundle`);
    // const data = await resp.json();

    // console.log("Data dari API:", data);
    // return data;

    const data = await resp.json();

    const filteredData = data.filter((product) =>
      ["ONE power FLEX", "ONE power YEAR"].includes(product.name)
    );

    console.log("Data setelah filter:", filteredData);

    return filteredData;
  } catch (error) {
    console.error("Gagal mengambil data produk:", error);
    return [];
  }
}

function renderProducts(products) {
  const container = document.querySelector(
    ".membership_layout, .membership_card_list"
  );
  const templateCard = document.querySelector(".membership_card");

  if (!container || !templateCard) return;

  container.innerHTML = "";

  products.forEach((product, index) => {
    const card = templateCard.cloneNode(true);
    card.dataset.raw = JSON.stringify(product);

    const nameEl = card.querySelector('[data-product="name"]');
    if (nameEl) nameEl.textContent = product.name;

    const rawDescription = product.description;
    const listItems = rawDescription
      ? rawDescription.split("\n").filter((item) => item.trim() !== "")
      : [];

    if (listItems.length > 0) {
      const durationList = [
        "Laufzeit: 12 Monate",
        "Monatlich flexibel kündbar – ab dem 1. Tag",
      ];

      const durationEl = card.querySelector('[data-product="duration"]');
      const trialEl = card.querySelector('[data-product="trial"]');
      const descEl = card.querySelector('[data-product="description"]');

      if (durationEl && durationList[index]) {
        durationEl.textContent = durationList[index];
      }

      const trialText = listItems[listItems.length - 1];
      const middleItems = listItems.slice(1, -1);

      if (trialEl) trialEl.textContent = trialText;

      if (descEl && middleItems.length > 0) {
        descEl.innerHTML = `<ul>${middleItems
          .map((item) => `<li>${item}</li>`)
          .join("")}</ul>`;
      }
    }

    const term = product?.terms?.[0];
    if (term) {
      const valueEl = card.querySelector('[data-product="termValue"]');
      if (valueEl) valueEl.textContent = term.termValue;

      const typeEl = card.querySelector('[data-product="termUnit"]');
      if (typeEl) {
        const unitMap = { DAY: "Tage", MONTH: "Monate", YEAR: "Jahre" };
        typeEl.textContent =
          unitMap[term.termUnit.toUpperCase()] || term.termUnit;
      }

      const priceEl = card.querySelector(
        '[data-product="price"]:not(.text-color-grey)'
      );
      if (priceEl) priceEl.textContent = term.price.toFixed(2);

      const perDay = card.querySelector('[data-product="per-day"]');
      if (perDay && term.paymentFrequencyValue > 0) {
        perDay.textContent = (term.price / term.paymentFrequencyValue).toFixed(
          2
        );
      }
    }

    const choiceButtons = card.querySelectorAll('[data-portal="choice"]');
    choiceButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.setItem("selected_product", JSON.stringify(product));
        window.location.href = "/portal";
      });
    });

    container.appendChild(card);
  });
}

async function initProductDisplay() {
  let data = await fetchProducts();

  if (data && data.length > 0) {
    data.sort((a, b) => {
      console.log(a.name);
      console.log(b.name);
      if (a.name === "ONE power YEAR") return -1;
      if (b.name === "ONE power YEAR") return 1;
      return 0;
    });

    renderProducts(data);
  }
}

window.addEventListener("load", initProductDisplay);
