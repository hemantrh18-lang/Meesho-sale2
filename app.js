
(() => {
  'use strict';

  const KEY = 'msSaleProductsV3';
  const CART = 'msSaleCartV3';

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

  const $ = id => document.getElementById(id);

  const parse = (value, fallback) => {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const money = value =>
    '₹' + Number(value || 0).toLocaleString('en-IN');

  let products = parse(localStorage.getItem(KEY), null);

  if (!Array.isArray(products) || !products.length) {
    products = defaults.map(product => ({ ...product }));
    localStorage.setItem(KEY, JSON.stringify(products));
  }

  const SIZES = 'msSaleCartSizesV3';
const SIZE_MARK = '__SIZE__';

let cart = parse(localStorage.getItem(CART), {});

if (!cart || typeof cart !== 'object' || Array.isArray(cart)) {
  cart = {};
}

// Purane cart ko naye size-aware format mein migrate karo.
const oldSizes = parse(localStorage.getItem(SIZES), {});

if (oldSizes && typeof oldSizes === 'object' && !Array.isArray(oldSizes)) {
  Object.entries(oldSizes).forEach(([id, size]) => {
    const oldQty = Number(cart[id]) || 0;

    if (oldQty > 0 && size) {
      const newKey = `${id}${SIZE_MARK}${size}`;
      cart[newKey] = (Number(cart[newKey]) || 0) + oldQty;
      delete cart[id];
    }
  });

  localStorage.removeItem(SIZES);
  localStorage.setItem(CART, JSON.stringify(cart));
}

function getCartInfo(key) {
  const text = String(key);
  const position = text.lastIndexOf(SIZE_MARK);

  if (position === -1) {
    return { id: text, size: '' };
  }

  return {
    id: text.slice(0, position),
    size: text.slice(position + SIZE_MARK.length)
  };
}

  let category = 'All';
  let query = '';
  let toastTimer;

  function save() {
    localStorage.setItem(KEY, JSON.stringify(products));
    localStorage.setItem(CART, JSON.stringify(cart));
  }

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
      () => $('toast').classList.remove('show'),
      2200
    );
  }

  function open(id) {
    $(id).hidden = false;
  }

  function close(id) {
    $(id).hidden = true;
  }

  // PRODUCT LIST
  function render() {
    let list = products.filter(product =>
      (category === 'All' || product.category === category) &&
      (`${product.title} ${product.category}`)
        .toLowerCase()
        .includes(query)
    );

    if ($('sort').value === 'low') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if ($('sort').value === 'high') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    $('resultCount').textContent =
      list.length + ' product' + (list.length === 1 ? '' : 's');

    $('empty').hidden = list.length > 0;

    $('products').innerHTML = list.map(product => {
      const price = Number(product.price) || 0;
      const oldPrice = Number(product.oldPrice) || price * 2;
      const discount = oldPrice > 0
        ? Math.max(0, Math.round((1 - price / oldPrice) * 100))
        : 0;

      return `
        <article class="card">
          <div class="photo">
            <a href="product.html?id=${encodeURIComponent(product.id)}"
               aria-label="View ${esc(product.title)}">
              <img src="${esc(product.image || '')}"
                   alt="${esc(product.title)}"
                   loading="lazy"
                   onerror="this.style.display='none'">
            </a>

            <span class="tag">${esc(product.tag || 'SALE PICK')}</span>

            <button class="heart"
                    data-fav="${esc(product.id)}"
                    type="button"
                    aria-label="Favourite">♡</button>
          </div>

          <div class="info">
            <h3>
              <a href="product.html?id=${encodeURIComponent(product.id)}">
                ${esc(product.title)}
              </a>
            </h3>

            <div class="prices">
              <strong>${money(price)}</strong>
              <del>${money(oldPrice)}</del>
              <span class="discount">${discount}% off</span>
            </div>

            <button class="add"
                    data-add="${esc(product.id)}"
                    type="button">Add to Cart</button>
          </div>
        </article>
      `;
    }).join('');
  }

function renderCart() {
  const entries = Object.entries(cart).filter(([key, quantity]) => {
    const { id } = getCartInfo(key);

    return products.some(product => String(product.id) === id) &&
      Number(quantity) > 0;
  });

  const count = entries.reduce(
    (sum, [, quantity]) => sum + Number(quantity),
    0
  );

  const total = entries.reduce((sum, [key, quantity]) => {
    const { id } = getCartInfo(key);
    const product = products.find(p => String(p.id) === id);

    return sum + (product ? Number(product.price) * Number(quantity) : 0);
  }, 0);

  $('count').textContent = count;
  $('subtotal').textContent = money(total);

  $('cartItems').innerHTML = entries.length
    ? entries.map(([key, quantity]) => {
        const { id, size } = getCartInfo(key);
        const product = products.find(p => String(p.id) === id);

        if (!product) return '';

        return `
          <div class="cartline">
            <img class="thumb"
                 src="${esc(product.image || '')}"
                 alt=""
                 onerror="this.style.display='none'">

            <div>
              <b>${esc(product.title)}</b>
              <p>${money(product.price)} each</p>
              ${size
                ? `<p><b>Size:</b> ${esc(size)}</p>`
                : ''}

              <div class="qty">
                <button type="button"
                        data-qty="${esc(key)}"
                        data-delta="-1">−</button>

                ${Number(quantity)}

                <button type="button"
                        data-qty="${esc(key)}"
                        data-delta="1">+</button>
              </div>
            </div>

            <b>${money(Number(product.price) * Number(quantity))}</b>
          </div>
        `;
      }).join('')
    : `
      <div class="empty">
        <h3>Your bag is waiting</h3>
        <p>Add something lovely from the sale.</p>
      </div>
    `;

  $('checkoutOpen').disabled = !count;
  $('adminCount').textContent = products.length;
}

  // ADD PRICE EDITOR TO THE EXISTING ADMIN PANEL
  // No index.html changes are needed for this section.
  function setupPriceEditor() {
    if ($('adminEditForm')) return;

    const resetButton = $('resetDemo');

    if (!resetButton) return;

    resetButton.insertAdjacentHTML('beforebegin', `
      <section id="priceEditor"
               style="margin-top:24px;padding-top:18px;border-top:1px solid #eee">

        <h3>Edit Existing Product</h3>
        <p>Select a product and enter its new selling price.</p>

        <form id="adminEditForm">
          <label>
            Select product
            <select id="editProductId" name="productId" required>
            </select>
          </label>

          <label>
            New selling price (₹)
            <input
              id="editPrice"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter any price"
              required
            >
          </label>

          <label>
            Original / MRP price (₹)
            <input
              id="editOldPrice"
              name="oldPrice"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Optional"
            >
          </label>

          <button class="primary full" type="submit">
            Save Price Changes
          </button>
        </form>

        <p id="priceEditStatus"
           role="status"
           style="font-size:13px"></p>
      </section>
    `);

    $('editProductId').addEventListener('change', fillPriceEditor);

    $('adminEditForm').addEventListener('submit', event => {
      event.preventDefault();

      const productId = $('editProductId').value;
      const product = products.find(
        item => String(item.id) === productId
      );

      if (!product) {
        notify('Please select a product');
        return;
      }

      const newPrice = Number($('editPrice').value);
      const oldPriceInput = $('editOldPrice').value.trim();
      const newOldPrice = oldPriceInput === ''
        ? null
        : Number(oldPriceInput);

      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        notify('Enter a valid selling price');
        return;
      }

      if (
        newOldPrice !== null &&
        (!Number.isFinite(newOldPrice) || newOldPrice <= 0)
      ) {
        notify('Enter a valid MRP or leave it blank');
        return;
      }

      product.price = newPrice;

      if (newOldPrice !== null) {
        product.oldPrice = newOldPrice;
      } else if (Number(product.oldPrice) < newPrice) {
        product.oldPrice = newPrice;
      }

      save();
      render();
      renderCart();
      fillPriceEditor();

      $('priceEditStatus').textContent =
        `${product.title}: new price ${money(product.price)} saved.`;

      notify('Product price updated');
    });

    renderPriceEditorOptions();
  }

  function renderPriceEditorOptions() {
    const select = $('editProductId');
    if (!select) return;

    const previousValue = select.value;

    select.innerHTML = products.map(product => `
      <option value="${esc(product.id)}">
        ${esc(product.title)} — ${money(product.price)}
      </option>
    `).join('');

    if (products.some(p => String(p.id) === previousValue)) {
      select.value = previousValue;
    }

    fillPriceEditor();
  }

  function fillPriceEditor() {
    const select = $('editProductId');
    if (!select) return;

    const product = products.find(
      item => String(item.id) === select.value
    );

    if (!product) return;

    $('editPrice').value = product.price;
    $('editOldPrice').value = product.oldPrice ?? '';
  }

  // GENERAL CLICK HANDLERS
  document.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add]');

    if (addButton) {
      const id = addButton.dataset.add;

      cart[id] = (Number(cart[id]) || 0) + 1;

      save();
      renderCart();
      notify('Added to cart');
      return;
    }

    const quantityButton = event.target.closest('[data-qty]');

    if (quantityButton) {
      const id = quantityButton.dataset.qty;

      cart[id] = (Number(cart[id]) || 0) +
        Number(quantityButton.dataset.delta);

      if (cart[id] <= 0) delete cart[id];

      save();
      renderCart();
      return;
    }

    const favourite = event.target.closest('[data-fav]');

    if (favourite) {
      favourite.classList.toggle('liked');
      favourite.textContent =
        favourite.classList.contains('liked') ? '♥' : '♡';
      return;
    }

    const closeButton = event.target.closest('[data-close]');

    if (closeButton) {
      close(closeButton.dataset.close);
    }

    if (event.target.classList.contains('overlay')) {
      close(event.target.id);
    }
  });

  // SEARCH
  $('search').addEventListener('input', event => {
    query = event.target.value.trim().toLowerCase();
    render();
  });

  $('clear').addEventListener('click', () => {
    $('search').value = '';
    query = '';
    render();
  });

  // CATEGORIES
  $('categories').addEventListener('click', event => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;

    category = button.dataset.cat;

    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item === button);
    });

    render();
  });

  // SORTING
  $('sort').addEventListener('change', render);

  $('reset').addEventListener('click', () => {
    category = 'All';
    query = '';
    $('search').value = '';

    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item.dataset.cat === 'All');
    });

    render();
  });

  // CART OPEN
  $('cartOpen').addEventListener('click', () => {
    renderCart();
    open('cartOverlay');
  });

   // CHECKOUT: DEMO ORDER PLACEMENT
  $('checkoutOpen').addEventListener('click', () => {
    if (Number($('count').textContent) === 0) return;

    close('cartOverlay');
    $('checkoutResult').hidden = true;
    open('checkoutOverlay');
  });

  $('checkoutForm').addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const address = String(data.get('address') || '').trim();

    if (!name || !phone || !address) {
      notify('Please complete all delivery details');
      return;
    }

    const entries = Object.entries(cart)
      .filter(([key, qty]) => {
        const { id } = getCartInfo(key);
        return products.some(p => String(p.id) === id) &&
          Number(qty) > 0;
      });

    if (!entries.length) {
      notify('Your cart is empty');
      return;
    }

    const items = entries.map(([key, qty]) => {
      const { id, size } = getCartInfo(key);
      const product = products.find(
        p => String(p.id) === id
      );

      return {
        productId: product.id,
        title: product.title,
        price: Number(product.price),
        quantity: Number(qty),
        size: size || ''
      };
    });

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderId =
      'MS' + Date.now().toString().slice(-10);

    // Demo order history: saved only in this browser.
    const orderKey = 'msSaleDemoOrdersV1';
    const previousOrders = parse(
      localStorage.getItem(orderKey), []
    );

    const orders = Array.isArray(previousOrders)
      ? previousOrders : [];

    orders.push({
      orderId,
      items,
      total,
      status: 'Demo order placed',
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(orderKey, JSON.stringify(orders));

    $('checkoutResult').hidden = false;
    $('checkoutResult').innerHTML = `
      <div class="notice" role="status">
        <h3>Demo Order Confirmed!</h3>
        <p>Order ID: <b>${esc(orderId)}</b></p>
        <p>Name: ${esc(name)}</p>
        <p>Mobile: ${esc(phone)}</p>
        <p>Address: ${esc(address)}</p>
        <p><b>Items</b></p>
        <ul>
          ${items.map(item => `
            <li>
              ${esc(item.title)}
              ${item.size ? '(Size: ' + esc(item.size) + ')' : ''}
              × ${item.quantity} — ${money(item.price * item.quantity)}
            </li>
          `).join('')}
        </ul>
        <p><b>Total: ${money(total)}</b></p>
        <p>COD unavailable. No payment was taken.</p>
        <p>This is a browser-only demo. The seller has not received this order.</p>
      </div>
    `;

    notify('Demo order created');
  });
  // ADMIN LOGIN
  $('adminOpen').addEventListener('click', () => {
    $('adminTools').hidden = true;
    $('adminForm').hidden = false;
    open('adminOverlay');
  });

  $('adminForm').addEventListener('submit', event => {
    event.preventDefault();

    if (new FormData(event.currentTarget).get('pin') !== '2468') {
      notify('Incorrect demo PIN');
      return;
    }

    event.currentTarget.hidden = true;
    $('adminTools').hidden = false;

    $('adminCount').textContent = products.length;
    setupPriceEditor();
    renderPriceEditorOptions();
  });

  // ADD NEW PRODUCT WITH ANY VALID PRICE
  $('addForm').addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const price = Number(data.get('price'));
    const title = String(data.get('title') || '').trim();

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
      image: String(data.get('image') || '').trim()
    });

    save();

    category = 'All';

    document.querySelectorAll('[data-cat]').forEach(item => {
      item.classList.toggle('active', item.dataset.cat === 'All');
    });

    render();
    renderCart();
    renderPriceEditorOptions();

    $('adminCount').textContent = products.length;

    event.currentTarget.reset();
    notify('Product added in this browser');
  });

  // RESTORE DEMO PRODUCTS
  $('resetDemo').addEventListener('click', () => {
    if (!confirm('Restore demo products and clear cart?')) return;

    products = defaults.map(product => ({ ...product }));
    cart = {};

    save();
    render();
    renderCart();
    renderPriceEditorOptions();

    notify('Demo products restored');
  });

  // CLOSE PANELS WITH ESCAPE
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.overlay:not([hidden])')
        .forEach(overlay => close(overlay.id));
    }
  });

  $('year').textContent = new Date().getFullYear();

  setupPriceEditor();
  render();
  renderCart();
})();
