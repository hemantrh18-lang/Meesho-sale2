(() => {
  "use strict";

  // Supabase connection
  const SUPABASE_URL = "https://uttemuesgazjillliimo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EJfp_-l9jErxOBI_ykUOZg_zZOfyk_7";

  const PRODUCT_KEY = "msSaleProductsV3";
  const CART_KEY = "msSaleCartV3";
  const ORDERS_KEY = "msSaleDemoOrdersV1";
  const PAYMENT_KEY = "msSalePaymentSettingsV1";
  const ADMIN_PIN = "2468"; // Demo only

  const defaults = [
    [1, "Women's Printed Kurti", "Women", 199, 399, "BESTSELLER",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=650&q=80",
      "Comfortable everyday printed kurti."],
    [2, "Makeup Combo", "Beauty", 149, 299, "TRENDING",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=650&q=80",
      "Everyday beauty essentials combo."],
    [3, "Casual Men's T-Shirt", "Men", 249, 499, "HOT DEAL",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=650&q=80",
      "Soft casual T-shirt for daily wear."],
    [4, "Minimal Home Organizer", "Home", 199, 399, "POPULAR",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=650&q=80",
      "Keep everyday essentials organized."],
    [5, "Women's Handbag", "Accessories", 299, 599, "NEW",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=650&q=80",
      "A versatile everyday handbag."],
    [6, "Floral Women's Dress", "Women", 249, 549, "TRENDING",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=650&q=80",
      "A lightweight floral outfit."],
    [7, "Skincare Essentials", "Beauty", 199, 449, "DEAL",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=650&q=80",
      "Simple skincare essentials."],
    [8, "Men's Casual Shirt", "Men", 299, 699, "BESTSELLER",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=650&q=80",
      "Smart casual shirt for outings."],
    [9, "Decor Cushion Cover", "Home", 149, 299, "VALUE BUY",
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=650&q=80",
      "Refresh your living room decor."],
    [10, "Fashion Earrings", "Accessories", 149, 349, "UNDER ₹149",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=650&q=80",
      "Lightweight statement earrings."],
    [11, "Cotton Kurti Set", "Women", 299, 649, "SALE",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e9?auto=format&fit=crop&w=650&q=80",
      "An easy-to-style kurti set."],
    [12, "Daily-use Water Bottle", "Home", 199, 399, "POPULAR",
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=650&q=80",
      "Reusable bottle for everyday use."]
  ].map(p => ({
    id: p[0],
    title: p[1],
    category: p[2],
    price: p[3],
    oldPrice: p[4],
    tag: p[5],
    image: p[6],
    description: p[7],
    stock: 99
  }));

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

  let productList = read(PRODUCT_KEY, defaults);
  if (!Array.isArray(productList) || !productList.length) {
    productList = defaults;
  }

  let cart = read(CART_KEY, []);
  let orders = read(ORDERS_KEY, []);

  let paymentSettings = read(PAYMENT_KEY, {
    upiId: "",
    merchantName: "Meesho Sale",
    qrImage: ""
  });

  let activeCategory = "All";
  let searchTerm = "";
  let selectedSize = "Free Size";
  let adminTab = "orders";

  // Supabase REST API
  async function supabaseRequest(table, options = {}) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}`,
      {
        method: options.method || "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: options.prefer || "return=representation"
        },
        body: options.body
          ? JSON.stringify(options.body)
          : undefined
      }
    );

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Supabase ${response.status}: ${body}`);
    }

    return body ? JSON.parse(body) : [];
  }

  function normalizeProduct(p) {
    return {
      id: p.id,
      title: p.title ?? p.name ?? "Product",
      category: p.category ?? "Women",
      price: Number(p.price ?? 0),
      oldPrice: Number(
        p.oldPrice ?? p.old_price ?? p.original_price ?? 0
      ),
      tag: p.tag ?? "SALE",
      image:
        p.image ??
        p.image_url ??
        "https://placehold.co/600x700/f7edf6/9f2089?text=Meesho+Sale",
      description:
        p.description ?? "Everyday product at a budget-friendly price.",
      stock: Number(p.stock ?? 99),
      active: p.active ?? true
    };
  }

  async function loadSupabaseProducts() {
    try {
      const rows = await supabaseRequest(
        "products?select=id,name,category,price,original_price,image_url,description,stock,active&active=eq.true&order=id.asc"
      );

      if (Array.isArray(rows) && rows.length) {
        productList = rows.map(normalizeProduct);
        write(PRODUCT_KEY, productList);

        const status = $("#statusMessage");
        if (status) {
          status.textContent = "Products Supabase se load ho rahe hain.";
        }

        renderProducts();
      } else {
        const status = $("#statusMessage");
        if (status) {
          status.textContent =
            "Supabase products table khaali hai; demo products dikh rahe hain.";
        }
      }
    } catch (error) {
      console.error("Supabase products error:", error);

      const status = $("#statusMessage");
      if (status) {
        status.textContent =
          "Demo products dikh rahe hain. Supabase table aur policies check karein.";
      }
    }
  }

  function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function imageFallback(img) {
    img.onerror = () => {
      img.onerror = null;
      img.src =
        "https://placehold.co/600x700/f7edf6/9f2089?text=Product";
    };
  }

  // Product filtering, search and sorting
  function visibleProducts() {
    let result = productList.filter(p => p.active !== false);

    if (activeCategory !== "All") {
      result = result.filter(
        p => p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      result = result.filter(p =>
        `${p.title} ${p.category} ${p.description}`
          .toLowerCase()
          .includes(searchTerm)
      );
    }

    const sort = $("#sortSelect")?.value || "featured";

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  function renderProducts() {
    const grid = $("#productGrid");
    if (!grid) return;

    const products = visibleProducts();

    grid.innerHTML = products.length
      ? products.map(p => `
        <article class="product-card">
          <div class="product-image-wrap" data-detail="${escapeHtml(p.id)}">
            <img
              class="product-image"
              src="${escapeHtml(p.image)}"
              alt="${escapeHtml(p.title)}"
              loading="lazy">
            <span class="product-tag">${escapeHtml(p.tag || "SALE")}</span>
          </div>

          <div class="product-info">
            <h3 class="product-title" data-detail="${escapeHtml(p.id)}">
              ${escapeHtml(p.title)}
            </h3>

            <div class="product-price">
              <span class="price-now">${money(p.price)}</span>
              <span class="price-old">${money(p.oldPrice)}</span>
              ${
                p.oldPrice > p.price
                  ? `<span class="discount">${
                      Math.round((1 - p.price / p.oldPrice) * 100)
                    }% off</span>`
                  : ""
              }
            </div>

            <div class="product-buttons">
              <button class="add-btn" data-add="${escapeHtml(p.id)}">
                Add to cart
              </button>
              <button class="buy-btn" data-buy="${escapeHtml(p.id)}">
                Buy now
              </button>
            </div>
          </div>
        </article>
      `).join("")
      : `<div class="empty-state">
           Is category mein product nahi mila. Dusra option try karein.
         </div>`;

    $$("img.product-image", grid).forEach(imageFallback);
  }

  // Shopping cart
  function saveCart() {
    write(CART_KEY, cart);
    updateCartCount();
  }

  function updateCartCount() {
    const count = $("#cartCount");
    if (count) {
      count.textContent = cart.reduce(
        (sum, item) => sum + item.qty,
        0
      );
    }
  }

  function addToCart(product, qty = 1, size = "Free Size") {
    const existing = cart.find(
      item =>
        String(item.id) === String(product.id) &&
        item.size === size
    );

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        qty,
        size
      });
    }

    saveCart();
  }

  function changeQty(id, size, delta) {
    const item = cart.find(
      i => String(i.id) === String(id) && i.size === size
    );

    if (!item) return;

    item.qty += delta;
    cart = cart.filter(i => i.qty > 0);

    saveCart();
    renderCart();
  }

  function cartTotal() {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * item.qty,
      0
    );
  }

  // Modal windows
  function openModal(title, content, wide = false) {
    $("#modalRoot").innerHTML = `
      <div class="modal-backdrop" data-backdrop>
        <section class="modal ${wide ? "wide" : ""}"
                 role="dialog" aria-modal="true">
          <header class="modal-head">
            <h2>${title}</h2>
            <button class="close-btn" data-close aria-label="Close">×</button>
          </header>
          <div class="modal-body">${content}</div>
        </section>
      </div>
    `;

    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#modalRoot").innerHTML = "";
    document.body.style.overflow = "";
  }

  // Product details and sizes
  function openProduct(id) {
    const product = productList.find(
      p => String(p.id) === String(id)
    );

    if (!product) return;

    selectedSize = "Free Size";

    const sizes = ["Free Size", "S", "M", "L", "XL", "XXL"];

    openModal(
      "Product details",
      `
        <div class="detail-layout">
          <img src="${escapeHtml(product.image)}"
               alt="${escapeHtml(product.title)}">

          <div>
            <p class="eyebrow">${escapeHtml(product.category)}</p>
            <h2>${escapeHtml(product.title)}</h2>

            <div class="product-price">
              <span class="price-now">${money(product.price)}</span>
              <span class="price-old">${money(product.oldPrice)}</span>
            </div>

            <p>${escapeHtml(product.description)}</p>

            <p class="muted">
              Size select karein, agar product par applicable ho.
            </p>

            <div class="size-row">
              ${sizes.map((size, index) => `
                <button class="size-chip ${index === 0 ? "selected" : ""}"
                        data-size="${size}">
                  ${size}
                </button>
              `).join("")}
            </div>

            <div class="field">
              <label>Quantity</label>
              <input id="detailQty" type="number"
                     min="1" max="20" value="1">
            </div>

            <div class="modal-actions">
              <button class="primary-btn" id="detailAdd">Add to cart</button>
              <button class="outline-btn" id="detailBuy">Buy now</button>
            </div>
          </div>
        </div>
      `,
      true
    );

    $$("[data-size]").forEach(button => {
      button.onclick = () => {
        selectedSize = button.dataset.size;

        $$("[data-size]").forEach(item => {
          item.classList.toggle("selected", item === button);
        });
      };
    });

    $("#detailAdd").onclick = () => {
      const qty = Math.max(
        1,
        Math.min(20, Number($("#detailQty").value) || 1)
      );

      addToCart(product, qty, selectedSize);
      closeModal();
    };

    $("#detailBuy").onclick = () => {
      const qty = Math.max(
        1,
        Math.min(20, Number($("#detailQty").value) || 1)
      );

      addToCart(product, qty, selectedSize);
      openCheckout();
    };

    imageFallback($(".detail-layout img"));
  }

  // Cart window
  function renderCart() {
    const lines = cart.length
      ? cart.map(item => `
        <div class="cart-line">
          <img src="${escapeHtml(item.image)}" alt="">

          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.size || "Free Size")} ·
               ${money(item.price)} each</p>

            <div class="qty-controls">
              <button data-qty="${escapeHtml(item.id)}"
                      data-size="${escapeHtml(item.size)}"
                      data-delta="-1">−</button>

              <span>${item.qty}</span>

              <button data-qty="${escapeHtml(item.id)}"
                      data-size="${escapeHtml(item.size)}"
                      data-delta="1">+</button>

              <button class="danger-btn"
                      data-remove="${escapeHtml(item.id)}"
                      data-size="${escapeHtml(item.size)}">
                Remove
              </button>
            </div>
          </div>

          <b>${money(item.price * item.qty)}</b>
        </div>
      `).join("")
      : `<div class="empty-state">Cart abhi khaali hai.</div>`;

    openModal(
      "Your cart",
      `
        ${lines}

        <div class="cart-total">
          <span>Total</span>
          <span>${money(cartTotal())}</span>
        </div>

        <p class="muted">
          Cash on Delivery (COD) unavailable hai.
          Checkout par UPI/QR payment details milengi.
        </p>

        <div class="modal-actions">
          <button class="primary-btn" id="checkoutBtn"
                  ${cart.length ? "" : "disabled"}>
            Proceed to checkout
          </button>
          <button class="outline-btn" data-close>
            Continue shopping
          </button>
        </div>
      `,
      true
    );

    $$("[data-qty]").forEach(button => {
      button.onclick = () => {
        changeQty(
          button.dataset.qty,
          button.dataset.size,
          Number(button.dataset.delta)
        );
      };
    });

    $$("[data-remove]").forEach(button => {
      button.onclick = () => {
        cart = cart.filter(
          item =>
            !(
              String(item.id) === button.dataset.remove &&
              item.size === button.dataset.size
            )
        );

        saveCart();
        renderCart();
      };
    });

    $("#checkoutBtn")?.addEventListener("click", openCheckout);
  }

  // UPI payment link with exact cart amount
  function buildUpiLink(total, orderRef) {
    if (!paymentSettings.upiId) return "";

    const params = new URLSearchParams({
      pa: paymentSettings.upiId,
      pn: paymentSettings.merchantName || "Meesho Sale",
      am: Number(total).toFixed(2),
      cu: "INR",
      tn: `Meesho Sale order ${orderRef}`
    });

    return `upi://pay?${params.toString()}`;
  }

  // Checkout and order submission
  function openCheckout() {
    if (!cart.length) return;

    const total = cartTotal();
    const upiLink = buildUpiLink(total, "checkout");

    const qr = paymentSettings.qrImage
      ? `<img class="qr-preview"
              src="${escapeHtml(paymentSettings.qrImage)}"
              alt="Merchant UPI QR">`
      : "";

    openModal(
      "Checkout",
      `
        <div class="warning-note">
          COD unavailable hai. Payment merchant app mein verify karna zaroori hai.
        </div>

        <div class="payment-card">
          <b>Order total: ${money(total)}</b>

          ${
            paymentSettings.upiId
              ? `<p class="muted">UPI ID:
                   <code>${escapeHtml(paymentSettings.upiId)}</code>
                 </p>`
              : `<p class="muted">
                   Admin panel mein business UPI ID add karein.
                 </p>`
          }

          ${qr}

          <div class="modal-actions">
            ${
              upiLink
                ? `<a class="primary-btn"
                      style="text-decoration:none"
                      href="${escapeHtml(upiLink)}">
                     Pay exact ${money(total)} via UPI
                   </a>`
                : ""
            }

            <button class="outline-btn" id="copyUpi">
              Copy UPI ID
            </button>
          </div>
        </div>

        <form id="checkoutForm">
          <div class="form-grid">
            <div class="field">
              <label for="customerName">Full name *</label>
              <input id="customerName" required maxlength="100">
            </div>

            <div class="field">
              <label for="customerPhone">Phone number *</label>
              <input id="customerPhone" type="tel"
                     inputmode="numeric"
                     pattern="[0-9 +()-]{10,18}"
                     required maxlength="18">
            </div>

            <div class="field full">
              <label for="customerAddress">Complete delivery address *</label>
              <textarea id="customerAddress" required maxlength="1000"></textarea>
            </div>

            <div class="field full">
              <label for="paymentRef">
                UPI transaction/reference ID (optional)
              </label>
              <input id="paymentRef" maxlength="120"
                     placeholder="Payment ke baad reference ID">
            </div>
          </div>

          <p class="muted">
            Website payment success ko automatically verify nahi karti.
          </p>

          <button class="primary-btn" type="submit">
            Place order · ${money(total)}
          </button>
        </form>
      `,
      true
    );

    $("#copyUpi").onclick = async () => {
      if (!paymentSettings.upiId) {
        alert("Admin panel mein UPI ID set nahi hai.");
        return;
      }

      try {
        await navigator.clipboard.writeText(paymentSettings.upiId);
        alert("UPI ID copied.");
      } catch {
        prompt("UPI ID copy karein:", paymentSettings.upiId);
      }
    };

    $("#checkoutForm").onsubmit = async event => {
      event.preventDefault();

      const name = $("#customerName").value.trim();
      const phone = $("#customerPhone").value.trim();
      const address = $("#customerAddress").value.trim();
      const reference = $("#paymentRef").value.trim();

      if (!name || !phone || !address) return;

      const orderNo = "MS" + Date.now().toString().slice(-10);

      const order = {
        order_number: orderNo,
        customer_name: name,
        customer_phone: phone,
        delivery_address: address,
        items: cart.map(item => ({
          id: item.id,
          name: item.title,
          price: item.price,
          quantity: item.qty,
          size: item.size
        })),
        total: Number(total.toFixed(2)),
        payment_status: "pending",
        order_status: "placed",
        payment_reference: reference || null
      };

      let savedToSupabase = false;

      try {
        await supabaseRequest("orders", {
          method: "POST",
          body: order,
          prefer: "return=representation"
        });

        savedToSupabase = true;
      } catch (error) {
        console.error("Supabase order save failed:", error);
      }

      const localOrder = {
        ...order,
        id: orderNo,
        name,
        phone,
        address,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        supabase: savedToSupabase
      };

      orders.unshift(localOrder);
      write(ORDERS_KEY, orders);

      cart = [];
      saveCart();

      openModal(
        "Order placed",
        `
          <div class="success-note">
            Order ${escapeHtml(orderNo)} record ho gaya.
            Payment status: Pending verification.
          </div>

          <p><b>Total:</b> ${money(total)}</p>

          <p class="muted">
            ${
              savedToSupabase
                ? "Order Supabase database mein save hua."
                : "Order sirf is browser mein save hua. Supabase policy aur schema check karein."
            }
            Payment merchant app mein verify karein.
          </p>

          <div class="modal-actions">
            <button class="primary-btn" id="doneBtn">Done</button>
          </div>
        `
      );

      $("#doneBtn").onclick = closeModal;
    };
  }

  // Demo admin panel
  function openAdmin() {
    const pin = prompt("Demo admin PIN enter karein:");

    if (pin !== ADMIN_PIN) {
      if (pin !== null) alert("PIN incorrect.");
      return;
    }

    adminTab = "orders";
    renderAdmin();
  }

  function renderAdmin() {
    let content = "";

    if (adminTab === "orders") {
      content = `
        <h3>Orders</h3>

        <p class="muted">
          Yeh demo panel browser ke local orders dikhata hai.
          Real admin security ke liye Supabase Auth zaroori hai.
        </p>

        ${
          orders.length
            ? orders.map(order => `
              <div class="order-card">
                <h4>
                  ${escapeHtml(order.order_number || order.id)}
                  · ${money(order.total)}
                </h4>

                <p>
                  ${escapeHtml(order.customer_name || order.name)}
                  · ${escapeHtml(order.customer_phone || order.phone)}
                </p>

                <p>
                  ${escapeHtml(order.delivery_address || order.address)}
                </p>

                <p class="muted">
                  Payment:
                  ${escapeHtml(order.payment_status || order.paymentStatus || "pending")}
                  · Order:
                  ${escapeHtml(order.order_status || "placed")}
                </p>

                <p class="muted">
                  ${escapeHtml(order.created_at || order.createdAt || "")}
                </p>

                <button class="outline-btn"
                        data-paid="${escapeHtml(order.order_number || order.id)}">
                  Mark paid (manual)
                </button>
              </div>
            `).join("")
            : `<p class="muted">
                 Is browser mein abhi koi local order nahi.
               </p>`
        }
      `;
    } else if (adminTab === "products") {
      content = `
        <h3>Manage products</h3>

        <form id="productForm">
          <div class="form-grid">
            <div class="field">
              <label>Product name *</label>
              <input id="pName" required>
            </div>

            <div class="field">
              <label>Category *</label>
              <select id="pCategory">
                <option>Women</option>
                <option>Men</option>
                <option>Beauty</option>
                <option>Home</option>
                <option>Accessories</option>
              </select>
            </div>

            <div class="field">
              <label>Sale price *</label>
              <input id="pPrice" type="number" min="0" required>
            </div>

            <div class="field">
              <label>Original price</label>
              <input id="pOldPrice" type="number" min="0" value="0">
            </div>

            <div class="field full">
              <label>Image URL</label>
              <input id="pImage" type="url" placeholder="https://...">
            </div>

            <div class="field full">
              <label>Description</label>
              <textarea id="pDescription"></textarea>
            </div>
          </div>

          <button class="primary-btn">
            Add product on this browser
          </button>
        </form>

        <p class="muted">
          Is form se product browser mein save hoga, Supabase database mein nahi.
        </p>

        <h4>Current products</h4>

        <div style="overflow:auto">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${
                productList.map(product => `
                  <tr>
                    <td>${escapeHtml(product.title)}</td>
                    <td>${escapeHtml(product.category)}</td>
                    <td>${money(product.price)}</td>
                    <td>
                      <button class="danger-btn"
                              data-delete-product="${escapeHtml(product.id)}">
                        Delete local
                      </button>
                    </td>
                  </tr>
                `).join("")
              }
            </tbody>
          </table>
        </div>
      `;
    } else {
      content = `
        <h3>Payment settings</h3>

        <p class="muted">
          Business UPI ID aur merchant QR image URL set karein.
        </p>

        <form id="paymentForm">
          <div class="field">
            <label>Business UPI ID</label>
            <input id="upiId"
                   value="${escapeHtml(paymentSettings.upiId)}"
                   placeholder="yourbusiness@upi">
          </div>

          <div class="field">
            <label>Merchant name</label>
            <input id="merchantName"
                   value="${escapeHtml(paymentSettings.merchantName || "Meesho Sale")}">
          </div>

          <div class="field">
            <label>QR image URL (optional)</label>
            <input id="qrImage"
                   type="url"
                   value="${escapeHtml(paymentSettings.qrImage)}"
                   placeholder="https://...">
          </div>

          <button class="primary-btn">Save payment settings</button>
        </form>

        <div class="warning-note">
          UPI PIN, bank password ya Supabase secret key website mein kabhi mat daalein.
        </div>
      `;
    }

    openModal(
      "Meesho Sale Admin",
      `
        <div class="admin-tabs">
          <button class="admin-tab ${adminTab === "orders" ? "active" : ""}"
                  data-tab="orders">Orders</button>

          <button class="admin-tab ${adminTab === "products" ? "active" : ""}"
                  data-tab="products">Products</button>

          <button class="admin-tab ${adminTab === "payment" ? "active" : ""}"
                  data-tab="payment">Payment settings</button>
        </div>

        ${content}
      `,
      true
    );

    $$("[data-tab]").forEach(button => {
      button.onclick = () => {
        adminTab = button.dataset.tab;
        renderAdmin();
      };
    });

    $$("[data-paid]").forEach(button => {
      button.onclick = () => {
        const order = orders.find(
          item =>
            String(item.order_number || item.id) === button.dataset.paid
        );

        if (order) {
          order.payment_status = "paid";
          order.paymentStatus = "paid";
          write(ORDERS_KEY, orders);
          renderAdmin();
        }
      };
    });

    $$("[data-delete-product]").forEach(button => {
      button.onclick = () => {
        if (!confirm("Is browser se product delete karein?")) return;

        productList = productList.filter(
          p => String(p.id) !== button.dataset.deleteProduct
        );

        write(PRODUCT_KEY, productList);
        renderProducts();
        renderAdmin();
      };
    });

    $("#productForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const product = {
        id: "local-" + Date.now(),
        title: $("#pName").value.trim(),
        category: $("#pCategory").value,
        price: Number($("#pPrice").value),
        oldPrice: Number($("#pOldPrice").value) || 0,
        tag: "NEW",
        image:
          $("#pImage").value.trim() ||
          "https://placehold.co/600x700/f7edf6/9f2089?text=New+Product",
        description: $("#pDescription").value.trim(),
        stock: 99
      };

      productList.unshift(product);
      write(PRODUCT_KEY, productList);

      renderProducts();
      renderAdmin();
    });

    $("#paymentForm")?.addEventListener("submit", event => {
      event.preventDefault();

      paymentSettings = {
        upiId: $("#upiId").value.trim(),
        merchantName:
          $("#merchantName").value.trim() || "Meesho Sale",
        qrImage: $("#qrImage").value.trim()
      };

      write(PAYMENT_KEY, paymentSettings);

      alert("Payment settings is browser mein save ho gayi.");
      renderAdmin();
    });
  }

  // Product buttons
  $("#productGrid").addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");
    const buyButton = event.target.closest("[data-buy]");
    const detailButton = event.target.closest("[data-detail]");

    if (addButton) {
      const product = productList.find(
        p => String(p.id) === addButton.dataset.add
      );

      if (product) {
        addToCart(product);
        addButton.textContent = "Added ✓";

        setTimeout(() => {
          if (addButton.isConnected) {
            addButton.textContent = "Add to cart";
          }
        }, 900);
      }
    } else if (buyButton) {
      const product = productList.find(
        p => String(p.id) === buyButton.dataset.buy
      );

      if (product) {
        addToCart(product);
        openCheckout();
      }
    } else if (detailButton) {
      openProduct(detailButton.dataset.detail);
    }
  });

  // Search
  $("#searchInput").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  $("#searchBtn").onclick = () => {
    searchTerm = $("#searchInput").value.trim().toLowerCase();
    renderProducts();
  };

  // Sorting
  $("#sortSelect").onchange = renderProducts;

  // Categories
  $("#categoryNav").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    activeCategory = button.dataset.category;

    $$("[data-category]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderProducts();
  });

  // Header buttons
  $("#cartButton").onclick = renderCart;
  $("#adminOpen").onclick = openAdmin;

  $("#shopNow").onclick = () => {
    $("#productsSection").scrollIntoView({
      behavior: "smooth"
    });
  };

  // Close modal
  $("#modalRoot").addEventListener("click", event => {
    if (
      event.target.matches("[data-close]") ||
      event.target.matches("[data-backdrop]")
    ) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  // Ten-minute countdown. Visual timer only.
  let saleSeconds = 600;

  function updateTimer() {
    const value =
      String(Math.floor(saleSeconds / 60)).padStart(2, "0") +
      ":" +
      String(saleSeconds % 60).padStart(2, "0");

    $("#saleTimer").textContent = value;
    $("#saleTimerLarge").textContent = value;

    saleSeconds = saleSeconds <= 0 ? 600 : saleSeconds - 1;
  }

  updateTimer();
  setInterval(updateTimer, 1000);

  // Start website
  renderProducts();
  updateCartCount();
  loadSupabaseProducts();
document.getElementById("adminOpen")?.addEventListener("click", () => {
  const pin = prompt("Demo admin PIN enter karein:");
  if (pin === "2468") {
    alert("Admin button ka click kaam kar raha hai. Ab panel integration fix karenge.");
  } else if (pin !== null) {
    alert("PIN incorrect.");
  }
});
})();
