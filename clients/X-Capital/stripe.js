// // Stripe Via JS
const cartState = {
    items: [],
    template: null
  };
  
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(num);
  };
  
  const calculateTotals = () => {
    const totalDisplay = document.querySelector('[data-cart-element="subtotal"]');
    const countDisplay = document.querySelector('.shop_cart_count');
    
    const totals = cartState.items.reduce((acc, item) => {
      acc.price += item.price * item.qty;
      acc.count += item.qty;
      return acc;
    }, { price: 0, count: 0 });
  
    if (totalDisplay) {
      totalDisplay.innerText = formatCurrency(totals.price).replace('€', '').trim();
    }
    if (countDisplay) {
      countDisplay.innerText = totals.count;
    }
  };
  
  const updateCartUI = () => {
    const container = document.querySelector('[data-cart="container"]');
    const cartWrap = document.querySelector('.shop_cart_list_wrap'); // Target utama toggle
    
    if (!container || !cartState.template) return;
  
    // LOGIKA TOGGLE VISIBILITY
    if (cartState.items.length === 0) {
      if (cartWrap) cartWrap.style.display = 'none';
      container.innerHTML = '';
      calculateTotals();
      return; // Stop eksekusi jika kosong
    } else {
      if (cartWrap) cartWrap.style.display = 'flex'; // Ubah ke 'flex' jika CSS aslinya flex
    }
  
    container.innerHTML = '';
  
    cartState.items.forEach((item, index) => {
      const node = cartState.template.cloneNode(true);
  
      const img = node.querySelector('[data-cart-element="image"]');
      const name = node.querySelector('[data-cart-element="name"]');
      const price = node.querySelector('[data-cart-element="price"]');
      const qtyText = node.querySelector('[data-cart-element="qty"]');
      const removeBtn = node.querySelector('[data-cart-element="remove"]');
      const plusBtn = node.querySelector('[data-cart-element="plus"]');
      const minBtn = node.querySelector('[data-cart-element="minus"]');
  
      if (img) {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.setAttribute('src', item.image);
      }
      if (name) name.innerText = item.name;
      if (price) price.innerText = item.price;
      if (qtyText) qtyText.innerText = item.qty;
  
      if (removeBtn) removeBtn.onclick = () => {
        cartState.items.splice(index, 1);
        updateCartUI();
      };
  
      if (plusBtn) plusBtn.onclick = () => {
        cartState.items[index].qty++;
        updateCartUI();
      };
  
      if (minBtn) minBtn.onclick = () => {
        if (cartState.items[index].qty > 1) {
          cartState.items[index].qty--;
        } else {
          cartState.items.splice(index, 1);
        }
        updateCartUI();
      };
  
      container.appendChild(node);
    });
  
    calculateTotals();
  };
  
  const addToCart = (wrapper) => {
    const stripeId = wrapper.querySelector('[data-stripe-id]')?.getAttribute('data-stripe-id') || 
                     wrapper.querySelector('[data-stripe-id]')?.innerText;
    const name = wrapper.querySelector('[data-name]')?.getAttribute('data-name') || 
                 wrapper.querySelector('[data-name]')?.innerText;
    const rawPrice = wrapper.querySelector('[data-price]')?.getAttribute('data-price') || 
                     wrapper.querySelector('[data-price]')?.innerText;
    
    const imgElement = wrapper.querySelector('[data-item="image"]');
    const image = imgElement ? imgElement.currentSrc || imgElement.getAttribute('src') : '';
    
    const qtyElem = wrapper.querySelector('[data-quantity="text"]');
    const qty = parseInt(qtyElem.innerText) || 0;
  
    if (qty <= 0 || !stripeId) return;
  
    const price = parseFloat(rawPrice.replace(/[^0-9,.]/g, '').replace(',', '.'));
  
    const existing = cartState.items.find(i => i.stripeId === stripeId);
    if (existing) {
      existing.qty += qty;
    } else {
      cartState.items.push({ stripeId, name, price, image, qty });
    }
  
    qtyElem.innerText = "0";
    updateCartUI();
  };
  
  const initMaster = () => {
    const firstItem = document.querySelector('.shop_cart_item');
    if (firstItem) {
      cartState.template = firstItem.cloneNode(true);
      firstItem.remove();
    }
  
    // Panggil sekali saat load untuk memastikan cart tersembunyi jika kosong
    updateCartUI();
  
    document.addEventListener('click', (e) => {
      const catalogPlus = e.target.closest('[data-quantity="plus-button"]');
      const catalogMin = e.target.closest('[data-quantity="min-button"]');
      const addBtn = e.target.closest('[data-action="add-to-cart"]');
      const checkoutBtn = e.target.closest('[data-action="checkout"]');
  
      if (catalogPlus || catalogMin) {
        const wrap = (catalogPlus || catalogMin).closest('.shop_item_wrap');
        const txt = wrap.querySelector('[data-quantity="text"]');
        let val = parseInt(txt.innerText) || 0;
        txt.innerText = catalogPlus ? val + 1 : (val > 0 ? val - 1 : 0);
        return;
      }
  
      if (addBtn) {
        e.preventDefault();
        addToCart(addBtn.closest('.shop_item_wrap'));
        return;
      }
  
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          
          if (cartState.items.length === 0) return alert("Warenkorb ist leer!");
  
          // Berikan loading state sederhana
          const btnText = checkoutBtn.querySelector('.button_main_text');
          const originalText = btnText.innerText;
          btnText.innerText = "Processing...";
  
          const payload = {
            items: cartState.items.map(item => ({
              stripeId: item.stripeId,
              quantity: item.qty
            }))
          };
  
          try {
            const response = await fetch('https://stripe.ridge-quince1079.workers.dev/', { // Ganti dengan URL Worker kamu
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
  
            const data = await response.json();
  
            if (data.url) {
              window.location.href = data.url; // Lempar user ke halaman bayar Stripe
            } else {
              throw new Error(data.error);
            }
          } catch (err) {
            console.error("Checkout failed:", err);
            alert("Error: " + err.message);
            btnText.innerText = originalText;
          }
        });
      }
    });
  };