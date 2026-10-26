
(() => {
  'use strict';

  const PRODUCT_KEY = 'msSaleProductsV3';
  const CART_KEY = 'msSaleCartV3';
  const ORDER_KEY = 'msSaleDemoOrdersV1';

  const $ = id => document.getElementById(id);

  const defaults = [
    [1, "Women's Printed Kurti", "Women", 199, 399, "BESTSELLER", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=650&q=80"],
    [2, "Makeup Combo", "Beauty", 149, 299, "TRENDING", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=650&q=80"],
    [3, "Festive Saree", "Women", 299, 599, "POPULAR", "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=650&q=80"],
    [4, "Fashion Earrings", "Accessories", 149, 299, "BESTSELLER", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=650&q=80"],
    [5, "Men's Casual T-Shirt", "Men", 199, 399, "TRENDING", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=650&q=80"],
    [6, "Kids Clothing Set", "Kids", 249, 499, "POPULAR", "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=650&q=80"],
    [7, "Decorative Home Vase", "Home", 199, 349, "HOME PICK", "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=650&q=80"],
    [8, "Cushion Cover", "Home", 149, 299, "DEAL", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=650&q=80"],
    [9, "Skincare Essentials", "Beauty", 249, 449, "BEAUTY PICK", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=650&q=80"],
    [10, "Women's Handbag", "Accessories", 299, 599, "TRENDING", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=650&q=80"],
    [11, "Kitchen Storage Set", "Kitchen", 199, 349, "DAILY USE", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=650&q=80"],
    [12, "Men's Casual Shoes", "Men", 299, 599, "BESTSELLER", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=650&q=80"]
  ].map(([id, title, category, price, oldPrice, tag, image]) => ({
    id, title, category, price, oldPrice, tag, image
  }));

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      notify('Browser storage unavailable');
    }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function money(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN');
  }

  let products = read(PRODUCT_KEY, null);
  if (!Array.isArray(products) || !products.length) {
    products = defaults.map(p => ({ ...p }));
    write(PRODUCT_KEY, products);
  }

  let cart = read(CART_KEY, {});
  if (!cart || typeof cart !== 'object' || Array.isArray(cart)) {
    cart = {};
  }

  let category = 'All';
  let query = '';
  let toastTimer;

  function notify(message) {
    const toast = $('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  function open(id) {
    if ($(id)) $(id).hidden = false;
  }

  function close(id) {
    if ($(id)) $(id).hidden = true;
  }

  function save() {
    write(PRODUCT_KEY, products);
    write(CART_KEY, cart);
  }

  function renderProducts() {
    let list = products.filter(p =>
      (category === 'All' || p.category === category) &&
      `${p.title} ${p.category}`.toLowerCase().includes(query)
    );

    if ($('sort')?.value === 'low') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if ($('sort')?.value === 'high') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if ($('resultCount')) {
      $('resultCount').textContent =
        `${list.length} product${list.length === 1 ? '' : 's'}`;
    }

    if ($('empty')) $('empty').hidden = list.length > 0;
    if (!$('products')) return;

    $('products').innerHTML = list.map(p => {
      const price = Number(p.price) || 0;
      const oldPrice = Number(p.oldPrice) || price * 2;
      const discount = oldPrice > 0
        ? Math.max(0, Math.round((1 - price / oldPrice) * 100))
        : 0;

      return `
        <article class="card">
          <div class="photo">
            <a href="product.html?id=${encodeURIComponent(p.id)}">
              <img src="${esc(p.image)}" alt="${esc(p.title)}"
                   loading="lazy"
                   onerror="this.style.display='none'">
            </a>
            <span class="tag">${esc(p.tag || 'SALE PICK')}</span>
            <button class="heart" data-fav="${esc(p.id)}"
                    type="button" aria-label="Favourite">♡</button>
          </div>
          <div class="info">
            <h3>
              <a href="product.html?id=${encodeURIComponent(p.id)}">
                ${esc(p.title)}
              </a>
            </h3>
            <div class="prices">
              <strong>${money(price)}</strong>
              <del>${money(oldPrice)}</del>
              <span class="discount">${discount}% off</span>
            </div>
            <button class="add" data-add="${esc(p.id)}" type="button">
              Add to Cart
            </button>
          </div>
        </article>`;
    }).join('');
  }

  function getCartProduct(key) {
    const id = String(key).split('__SIZE__')[0];
    return products.find(p => String(p.id) === id);
  }

  function renderCart() {
    const entries = Object.entries(cart).filter(([key, qty]) =>
      getCartProduct(key) && Number(qty) > 0
    );

    const count = entries.reduce(
      (sum, [, qty]) => sum + Number(qty), 0
    );

    const total = entries.reduce((sum, [key, qty]) => {
      const product = getCartProduct(key);
      return sum + (product ? Number(product.price) * Number(qty) : 0);
    }, 0);

    if ($('count')) $('count').textContent = count;
    if ($('subtotal')) $('subtotal').textContent = money(total);
    if ($('checkoutOpen')) $('checkoutOpen').disabled = count === 0;
    if ($('adminCount')) $('adminCount').textContent = products.length;
    if (!$('cartItems')) return;

    $('cartItems').innerHTML = entries.length
      ? entries.map(([key, qty]) => {
          const product = getCartProduct(key);
          const size = String(key).includes('__SIZE__')
            ? String(key).split('__SIZE__').slice(1).join('__SIZE__')
            : '';

          return `
            <div class="cartline">
              <img class="thumb" src="${esc(product.image)}" alt=""
                   onerror="this.style.display='none'">
              <div>
                <b>${esc(product.title)}</b>
                <p>${money(product.price)} each</p>
                ${size ? `<p>Size: ${esc(size)}</p>` : ''}
                <div class="qty">
                  <button type="button" data-qty="${esc(key)}"
                          data-delta="-1">−</button>
                  ${Number(qty)}
                  <button type="button" data-qty="${esc(key)}"
                          data-delta="1">+</button>
                </div>
              </div>
              <b>${money(Number(product.price) * Number(qty))}</b>
            </div>`;
        }).join('')
      : '<div class="empty"><h3>Your bag is waiting</h3><p>Add something lovely from the sale.</p></div>';
  }

  function setupPriceEditor() {
    if ($('adminEditForm') || !$('resetDemo')) return;

    $('resetDemo').insertAdjacentHTML('beforebegin', `
      <section id="priceEditor"
        style="margin-top:24px;padding-top:18px;border-top:1px solid #eee">
        <h3>Edit Existing Product</h3>
        <form id="adminEditForm">
          <label>Select product
            <select id="editProductId" required></select>
          </label>
          <label>New selling price (₹)
            <input id="editPrice" type="number" min="0.01"
                   step="0.01" required>
          </label>
          <label>Original / MRP price (₹)
            <input id="editOldPrice" type="number" min="0.01"
                   step="0.01" placeholder="Optional">
          </label>
          <button class="primary full" type="submit">
            Save Price Changes
          </button>
          <p id="priceEditStatus" role="status"></p>
        </form>
      </section>
    `);

    $('editProductId').addEventListener('change', fillPriceEditor);

    $('adminEditForm').addEventListener('submit', event => {
      event.preventDefault();

      const product = products.find(
        p => String(p.id) === $('editProductId').value
      );
      const price = Number($('editPrice').value);
      const oldInput = $('editOldPrice').value.trim();
      const oldPrice = oldInput ? Number(oldInput) : null;

      if (!product || !Number.isFinite(price) || price <= 0 ||
          (oldPrice !== null &&
           (!Number.isFinite(oldPrice) || oldPrice <= 0))) {
        notify('Enter valid prices');
        return;
      }

      product.price = price;
      if (oldPrice !== null) product.oldPrice = oldPrice;
      else if (Number(product.oldPrice) < price) product.oldPrice = price;

      save();
      renderProducts();
      renderCart();
      renderPriceEditorOptions();
      $('priceEditStatus').textContent =
        `${product.title}: price saved as ${money(price)}`;
      notify('Product price updated');
    });

    renderPriceEditorOptions();
  }

  function renderPriceEditorOptions() {
    const select = $('editProductId');
    if (!select) return;

    const previous = select.value;
    select.innerHTML = products.map(p => `
      <option value="${esc(p.id)}">
        ${esc(p.title)} — ${money(p.price)}
      </option>
    `).join('');

    if (products.some(p => String(p.id) === previous)) {
      select.value = previous;
    }
    fillPriceEditor();
  }

  function fillPriceEditor() {
    const select = $('editProductId');
    if (!select) return;

    const product = products.find(
      p => String(p.id) === select.value
    );
    if (!product) return;

    $('editPrice').value = product.price;
    $('editOldPrice').value = product.oldPrice ?? '';
  }

  function setupOrderHistory() {
    if (!$('resetDemo')) return;

    if (!$('orderHistory')) {
      $('resetDemo').insertAdjacentHTML('beforebegin', `
        <section id="orderHistory"
          style="margin-top:24px;padding-top:18px;border-top:1px solid #eee">
          <h3>Demo Order History</h3>
          <p>Orders saved in this browser only.</p>
          <button type="button" id="refreshOrderHistory">
            Refresh Orders
          </button>
          <div id="orderHistoryList" style="margin-top:12px"></div>
        </section>
      `);
    }

    function renderOrderHistory() {
      const stored = read(ORDER_KEY, []);
      const orders = Array.isArray(stored) ? stored.slice().reverse() : [];

      $('orderHistoryList').innerHTML = orders.length
        ? orders.map(order => `
            <article style="padding:12px;margin:12px 0;border:1px solid #ddd;border-radius:8px">
              <b>Order ID: ${esc(order.orderId)}</b>
              <p>Status: ${esc(order.status || 'Demo order')}</p>
              <p>Total: ${money(order.total)}</p>
              <ul>
                ${(Array.isArray(order.items) ? order.items : []).map(item => `
                  <li>${esc(item.title)} × ${Number(item.quantity) || 0}</li>
                `).join('')}
              </ul>
              <small>Demo record only — not a real customer order.</small>
            </article>
          `).join('')
        : '<p>No demo orders saved in this browser yet.</p>';
    }

    $('refreshOrderHistory').onclick = renderOrderHistory;
    renderOrderHistory();
  }

  // Search
  $('search')?.addEventListener('input', event => {
    query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  $('clear')?.addEventListener('click', () => {
    $('search').value = '';
    query = '';
    renderProducts();
  });

  // Categories
  $('categories')?.addEventListener('click', event => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;

    category = button.dataset.cat;
    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item === button);
    });
    renderProducts();
  });

  $('sort')?.addEventListener('change', renderProducts);

  $('reset')?.addEventListener('click', () => {
    category = 'All';
    query = '';
    $('search').value = '';
    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item.dataset.cat === 'All');
    });
    renderProducts();
  });

  // Cart actions and modal close
  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]');
    if (add) {
      const id = add.dataset.add;
      cart[id] = (Number(cart[id]) || 0) + 1;
      save();
      renderCart();
      notify('Added to cart');
      return;
    }

    const qty = event.target.closest('[data-qty]');
    if (qty) {
      const key = qty.dataset.qty;
      cart[key] = (Number(cart[key]) || 0) +
        Number(qty.dataset.delta);
      if (cart[key] <= 0) delete cart[key];
      save();
      renderCart();
      return;
    }

    const fav = event.target.closest('[data-fav]');
    if (fav) {
      fav.classList.toggle('liked');
      fav.textContent = fav.classList.contains('liked') ? '♥' : '♡';
      return;
    }

    const closeButton = event.target.closest('[data-close]');
    if (closeButton) close(closeButton.dataset.close);
    if (event.target.classList.contains('overlay')) close(event.target.id);
  });

  $('cartOpen')?.addEventListener('click', () => {
    renderCart();
    open('cartOverlay');
  });

  $('checkoutOpen')?.addEventListener('click', () => {
    if (Number($('count').textContent) === 0) return;
    close('cartOverlay');
    $('checkoutResult').hidden = true;
    open('checkoutOverlay');
  });

  // Demo checkout; no real payment or order submission.
  $('checkoutForm')?.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const address = String(data.get('address') || '').trim();

    if (!name || !/^[0-9]{10}$/.test(phone) || !address) {
      notify('Enter your name, valid 10-digit mobile and address');
      return;
    }

    const entries = Object.entries(cart).filter(([key, qty]) =>
      getCartProduct(key) && Number(qty) > 0
    );
    if (!entries.length) {
      notify('Your cart is empty');
      return;
    }

    const items = entries.map(([key, qty]) => {
      const product = getCartProduct(key);
      const size = String(key).includes('__SIZE__')
        ? String(key).split('__SIZE__').slice(1).join('__SIZE__')
        : '';
      return {
        productId: product.id,
        title: product.title,
        price: Number(product.price),
        quantity: Number(qty),
        size
      };
    });

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );
    const orderId = 'MS' + Date.now().toString().slice(-10);
    const previous = read(ORDER_KEY, []);
    const orders = Array.isArray(previous) ? previous : [];

    orders.push({
      orderId, name, phone, address, items, total,
      status: 'Demo order placed',
      createdAt: new Date().toISOString()
    });
    write(ORDER_KEY, orders);

    $('checkoutResult').hidden = false;
    $('checkoutResult').innerHTML = `
      <div class="notice" role="status">
        <h3>Demo Order Confirmed!</h3>
        <p>Order ID: <b>${esc(orderId)}</b></p>
        <p>Name: ${esc(name)}</p>
        <p>Mobile: ${esc(phone)}</p>
        <p>Address: ${esc(address)}</p>
        <p><b>Items</b></p>
        <ul>${items.map(item => `
          <li>${esc(item.title)} × ${item.quantity} — ${money(item.price * item.quantity)}</li>
        `).join('')}</ul>
        <p><b>Total: ${money(total)}</b></p>
        <p>Cash on Delivery unavailable. No payment was taken.</p>
        <p>This is a browser-only demo. The seller has not received this order.</p>
      </div>`;
    notify('Demo order created');
  });

  // Admin login
  $('adminOpen')?.addEventListener('click', () => {
    $('adminTools').hidden = true;
    $('adminForm').hidden = false;
    open('adminOverlay');
  });

  $('adminForm')?.addEventListener('submit', event => {
    event.preventDefault();

    if (String(new FormData(event.currentTarget).get('pin')) !== '2468') {
      notify('Incorrect demo PIN');
      return;
    }

    event.currentTarget.hidden = true;
    $('adminTools').hidden = false;
    $('adminCount').textContent = products.length;

    setupPriceEditor();
    setupOrderHistory();
    renderPriceEditorOptions();
  });

  // Add product
  $('addForm')?.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') || '').trim();
    const price = Number(data.get('price'));
    const image = String(data.get('image') || '').trim();

    if (!title || !Number.isFinite(price) || price <= 0) {
      notify('Enter a valid product name and price');
      return;
    }

    products.unshift({
      id: Date.now(),
      title,
      category: data.get('category'),
      price,
      oldPrice: price * 2,
      tag: 'NEW ARRIVAL',
      image
    });

    save();
    category = 'All';
    query = '';
    $('search').value = '';

    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item.dataset.cat === 'All');
    });

    renderProducts();
    renderCart();
    renderPriceEditorOptions();
    $('adminCount').textContent = products.length;
    event.currentTarget.reset();
    notify('Product added in this browser');
  });

  // Restore demo products
  $('resetDemo')?.addEventListener('click', () => {
    if (!confirm('Restore demo products and clear cart?')) return;

    products = defaults.map(p => ({ ...p }));
    cart = {};
    save();
    renderProducts();
    renderCart();
    renderPriceEditorOptions();
    $('adminCount').textContent = products.length;
    notify('Demo products restored');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.overlay:not([hidden])').forEach(overlay => {
        close(overlay.id);
      });
    }
  });

  if ($('year')) $('year').textContent = new Date().getFullYear();

  // IMPORTANT: initial render happens immediately.
  renderProducts();
  renderCart();
})();
