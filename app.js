
(() => {
  "use strict";

  const PRODUCT_KEY = "msSaleProductsV3";
  const CART_KEY = "msSaleCartV3";
  const ORDER_KEY = "msSaleDemoOrdersV1";
  const PAYMENT_KEY = "msSalePaymentSettingsV1";

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
  ].map(([id, title, category, price, oldPrice, tag, image]) =>
    ({ id, title, category, price, oldPrice, tag, image })
  );

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      toast("Browser storage unavailable. Changes may not save.");
      return false;
    }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  let productList = read(PRODUCT_KEY, defaults);
  if (!Array.isArray(productList)) productList = defaults;

  let cart = read(CART_KEY, []);
  if (!Array.isArray(cart)) cart = [];

  let orders = read(ORDER_KEY, []);
  if (!Array.isArray(orders)) orders = [];

  let payment = read(PAYMENT_KEY, {
    upiId: "",
    payeeName: "",
    qrUrl: ""
  });

  let activeCategory = "All";
  let searchText = "";
  let sortMode = "featured";

  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(
      () => el.classList.remove("show"),
      2600
    );
  }

  function saveCart() {
    write(CART_KEY, cart);
    renderCart();
    renderCheckoutPayment();
  }

  function getCartLines() {
    return cart.map(line => {
      const product = productList.find(p => p.id === line.id);

      return product
        ? {
            ...product,
            qty: Math.max(1, Number(line.qty) || 1),
            size: line.size || "Standard"
          }
        : null;
    }).filter(Boolean);
  }

  function cartTotal() {
    return getCartLines().reduce(
      (sum, p) => sum + Number(p.price) * p.qty,
      0
    );
  }

  function renderProducts() {
    const container = $("products");
    if (!container) return;

    let list = productList.filter(p => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;

      const term = searchText.toLowerCase();

      const matchesSearch = !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    if (sortMode === "low") {
      list.sort((a, b) => a.price - b.price);
    }

    if (sortMode === "high") {
      list.sort((a, b) => b.price - a.price);
    }

    container.innerHTML = list.map(p => `
      <article class="card" data-product="${Number(p.id)}">
        <div class="photo">
          <img src="${esc(p.image)}"
               alt="${esc(p.title)}"
               loading="lazy"
               onerror="this.style.display='none'">
          <span class="tag">${esc(p.tag || "DEAL")}</span>
        </div>

        <div class="info">
          <h3>${esc(p.title)}</h3>

          <div class="prices">
            <strong>${money(p.price)}</strong>
            ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}
          </div>

          <button class="add"
                  type="button"
                  data-add="${Number(p.id)}">
            Add to cart
          </button>
        </div>
      </article>
    `).join("");

    if ($("resultCount")) {
      $("resultCount").textContent =
        `${list.length} product${list.length === 1 ? "" : "s"}`;
    }

    if ($("empty")) {
      $("empty").hidden = list.length > 0;
    }
  }

  function renderCart() {
    const lines = getCartLines();
    const count = lines.reduce((sum, p) => sum + p.qty, 0);

    if ($("count")) $("count").textContent = count;
    if ($("subtotal")) $("subtotal").textContent = money(cartTotal());

    const target = $("cartItems");
    if (!target) return;

    if (!lines.length) {
      target.innerHTML =
        '<p class="muted">Your cart is empty. Add a product to get started.</p>';
      return;
    }

    target.innerHTML = lines.map(p => `
      <div class="cartline">
        <img class="thumb"
             src="${esc(p.image)}"
             alt="${esc(p.title)}">

        <div>
          <b>${esc(p.title)}</b>
          <div>${money(p.price)} each</div>
          <div>Size: ${esc(p.size)}</div>

          <div class="qty">
            <button type="button"
                    data-qty="${p.id}"
                    data-change="-1"
                    aria-label="Decrease quantity">−</button>

            <span>${p.qty}</span>

            <button type="button"
                    data-qty="${p.id}"
                    data-change="1"
                    aria-label="Increase quantity">+</button>

            <button type="button" data-remove="${p.id}">
              Remove
            </button>
          </div>
        </div>

        <b>${money(p.price * p.qty)}</b>
      </div>
    `).join("");
  }

  function openOverlay(id) {
    const el = $(id);
    if (el) el.hidden = false;
  }

  function closeOverlay(id) {
    const el = $(id);
    if (el) el.hidden = true;
  }

  function renderPaymentAdmin() {
    const tools = $("adminTools");
    if (!tools || $("paymentSettingsForm")) return;

    const section = document.createElement("section");
    section.className = "payment-admin";

    section.innerHTML = `
      <hr>
      <h3>UPI payment settings</h3>

      <p class="muted">
        Set the merchant UPI ID and optional backup QR image.
        When a UPI ID is set, checkout generates an amount-specific QR.
      </p>

      <form id="paymentSettingsForm">
        <label>
          Merchant UPI ID
          <input name="upiId"
                 value="${esc(payment.upiId)}"
                 placeholder="yourmerchant@upi"
                 autocomplete="off">
        </label>

        <label>
          Display name (optional)
          <input name="payeeName"
                 value="${esc(payment.payeeName)}"
                 placeholder="Store / merchant name"
                 autocomplete="off">
        </label>

        <label>
          Backup QR code image URL (optional)
          <input name="qrUrl"
                 type="url"
                 value="${esc(payment.qrUrl)}"
                 placeholder="https://.../your-qr.png">
        </label>

        <button class="primary full" type="submit">
          Save payment settings
        </button>
      </form>

      <p class="muted">
        These settings save only in this browser. Do not enter
        bank passwords, UPI PINs or OTPs here.
      </p>
    `;

    tools.appendChild(section);

    $("paymentSettingsForm").addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(event.currentTarget);

      const upiId = String(data.get("upiId") || "").trim();
      const payeeName = String(data.get("payeeName") || "").trim();
      const qrUrl = String(data.get("qrUrl") || "").trim();

      if (upiId && !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        toast("Please check the UPI ID format.");
        return;
      }

      if (qrUrl) {
        try {
          const url = new URL(qrUrl);

          if (url.protocol !== "https:" && url.protocol !== "http:") {
            toast("Use a valid HTTP or HTTPS QR image URL.");
            return;
          }
        } catch {
          toast("Please enter a valid QR image URL.");
          return;
        }
      }

      payment = { upiId, payeeName, qrUrl };

      write(PAYMENT_KEY, payment);

      toast("Payment settings saved in this browser.");
      renderCheckoutPayment();
    });
  }

  function renderCheckoutPayment() {
    const form = $("checkoutForm");
    if (!form) return;

    let area = $("upiPaymentArea");

    if (!area) {
      area = document.createElement("section");
      area.id = "upiPaymentArea";
      area.className = "upi-payment";

      const submit = form.querySelector('[type="submit"]');
      form.insertBefore(area, submit || null);
    }

    const upiId = String(payment.upiId || "").trim();
    const payee = String(payment.payeeName || "").trim();
    const backupQrUrl = String(payment.qrUrl || "").trim();

    const total = cartTotal();

    if (!upiId && !backupQrUrl) {
      area.innerHTML = `
        <h3>Online payment</h3>
        <p class="muted">
          The store has not configured its UPI ID or QR code yet.
        </p>
        <p><b>Cash on Delivery is unavailable.</b></p>
      `;
      return;
    }

    const upiLink = upiId
      ? `upi://pay?${new URLSearchParams({
          pa: upiId,
          pn: payee || "Meesho Sale",
          am: total.toFixed(2),
          cu: "INR",
          tn: "Meesho Sale order"
        }).toString()}`
      : "";

    const dynamicQrUrl = upiLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiLink)}`
      : "";

    const qrToShow = dynamicQrUrl || backupQrUrl;

    area.innerHTML = `
      <h3>Pay using UPI</h3>

      <p class="muted">
        Order amount: <strong>${money(total)}</strong>
      </p>

      <p class="muted">
        Scan this QR with a UPI app or open the UPI payment link.
        Confirm the amount in your UPI app before paying.
      </p>

      ${payee
        ? `<p>Store display name: <b>${esc(payee)}</b></p>`
        : ""}

      ${qrToShow ? `
        <div class="upi-qr-wrap">
          <img class="upi-qr"
               src="${esc(qrToShow)}"
               alt="UPI QR for ${esc(money(total))}"
               loading="lazy"
               onerror="
                 this.style.display='none';
                 this.parentElement.querySelector('.qr-error').hidden=false
               ">

          <p class="muted qr-error" hidden>
            QR could not be loaded. Check your connection or QR URL.
          </p>
        </div>
      ` : ""}

      ${upiId ? `
        <div class="upi-id-line">
          <span>
            <b>UPI ID:</b>
            <span id="merchantUpiText">${esc(upiId)}</span>
          </span>

          <button class="plain" type="button" id="copyUpiButton">
            Copy
          </button>
        </div>

        <a class="primary full upi-open" href="${esc(upiLink)}">
          Open UPI app · ${money(total)}
        </a>
      ` : ""}

      <p class="notice">
        This is a demo checkout. Payment is not automatically verified.
        Never enter your UPI PIN on this website.
      </p>

      <label class="payment-confirm-label">
        <input type="checkbox" id="paymentMadeCheck">
        I have made the payment (this checkbox is not payment verification).
      </label>

      <p class="muted">
        Payment status: <b>Pending manual verification</b>
      </p>

      <p><b>Cash on Delivery is unavailable.</b></p>
    `;

    const copyButton = $("copyUpiButton");

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(upiId);
          toast("UPI ID copied.");
        } catch {
          const temp = document.createElement("textarea");
          temp.value = upiId;
          document.body.appendChild(temp);
          temp.select();

          const ok = document.execCommand("copy");
          temp.remove();

          toast(ok ? "UPI ID copied." : "Please copy the UPI ID manually.");
        }
      });
    }
  }

  function renderAdminCount() {
    if ($("adminCount")) {
      $("adminCount").textContent = productList.length;
    }
  }

  // NEW: Customer orders section inside the admin panel.
  function renderAdminOrders() {
    const tools = $("adminTools");
    if (!tools) return;

    let section = $("adminOrdersSection");

    if (!section) {
      section = document.createElement("section");
      section.id = "adminOrdersSection";
      section.className = "admin-orders";
      section.style.marginTop = "24px";

      tools.appendChild(section);
    }

    // Reload saved demo orders from this browser.
    orders = read(ORDER_KEY, []);
    if (!Array.isArray(orders)) orders = [];

    if (!orders.length) {
      section.innerHTML = `
        <hr>
        <h3>Customer orders (0)</h3>
        <p class="muted">
          No saved demo orders were found in this browser.
          Complete a checkout test using this same browser and check again.
        </p>
      `;
      return;
    }

    section.innerHTML = `
      <hr>
      <h3>Customer orders (${orders.length})</h3>

      ${orders.slice().reverse().map(order => `
        <article class="admin-order-card"
                 style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:12px 0;overflow-wrap:anywhere">

          <p><b>Order ID:</b> ${esc(order.id)}</p>
          <p><b>Customer:</b> ${esc(order.name)}</p>
          <p><b>Phone:</b> ${esc(order.phone)}</p>
          <p><b>Address:</b> ${esc(order.address)}</p>

          <p><b>Products:</b></p>

          <ul>
            ${(Array.isArray(order.items) ? order.items : []).map(item => `
              <li>
                ${esc(item.title)}
                × ${Math.max(1, Number(item.qty) || 1)}
                — Size: ${esc(item.size || "Standard")}
                — ${money((Number(item.price) || 0) * (Number(item.qty) || 1))}
              </li>
            `).join("")}
          </ul>

          <p><b>Total:</b> ${money(order.total)}</p>

          <p>
            <b>Payment status:</b>
            ${esc(order.paymentStatus || "Pending manual verification")}
          </p>

          <p class="muted">
            Order date:
            ${esc(
              order.createdAt &&
              !Number.isNaN(Date.parse(order.createdAt))
                ? new Date(order.createdAt).toLocaleString()
                : "Not available"
            )}
          </p>
        </article>
      `).join("")}
    `;
  }

  // PRODUCT DETAILS MODAL
  function openProductDetails(id) {
    const p = productList.find(item => item.id === id);
    if (!p) return;

    let modal = $("productDetailsOverlay");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "productDetailsOverlay";
      modal.className = "overlay";
      modal.hidden = true;

      modal.innerHTML = `
        <section class="modal product-details-modal"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="productDetailTitle">

          <div class="panelhead">
            <div>
              <small>PRODUCT DETAILS</small>
              <h2 id="productDetailTitle">Product</h2>
            </div>

            <button type="button"
                    id="closeProductDetails"
                    aria-label="Close details">×</button>
          </div>

          <div id="productDetailContent"></div>
        </section>
      `;

      document.body.appendChild(modal);

      $("closeProductDetails").addEventListener("click", () => {
        modal.hidden = true;
      });

      modal.addEventListener("click", event => {
        if (event.target === modal) modal.hidden = true;
      });
    }

    const hasSizes = ["Women", "Men", "Kids"].includes(p.category);

    $("productDetailTitle").textContent = p.title;

    $("productDetailContent").innerHTML = `
      <img class="product-detail-image"
           src="${esc(p.image)}"
           alt="${esc(p.title)}"
           onerror="this.style.display='none'">

      <p class="product-detail-category">${esc(p.category)}</p>

      <div class="prices product-detail-prices">
        <strong>${money(p.price)}</strong>
        ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}
      </div>

      <p class="product-detail-description">
        ${esc(p.description || (
          p.category === "Women"
            ? "Discover this stylish pick for your everyday wardrobe and special occasions."
            : p.category === "Men"
            ? "A versatile everyday pick designed for your casual style."
            : p.category === "Kids"
            ? "A lovely everyday pick for your little one's wardrobe."
            : p.category === "Beauty"
            ? "Explore this beauty essential for your daily self-care routine."
            : p.category === "Home"
            ? "Add a lovely touch to your home with this everyday pick."
            : p.category === "Kitchen"
            ? "A practical everyday essential for your kitchen."
            : "A stylish everyday essential at a pocket-friendly price."
        ))}
      </p>

      ${hasSizes ? `
        <label class="product-size-label" for="productDetailSize">
          Select size
        </label>

        <select id="productDetailSize" class="product-detail-size">
          <option value="">Choose a size</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      ` : `
        <p class="muted">Size: Standard</p>
      `}

      <button class="primary full" type="button" id="detailAddToCart">
        Add to Cart · ${money(p.price)}
      </button>

      <p class="muted">Cash on Delivery unavailable.</p>
    `;

    $("detailAddToCart").addEventListener("click", () => {
      if (hasSizes && !$("productDetailSize").value) {
        toast("Please select a size first.");
        return;
      }

      const size = hasSizes
        ? $("productDetailSize").value
        : "Standard";

      const found = cart.find(line =>
        line.id === id &&
        (line.size || "Standard") === size
      );

      if (found) {
        found.qty += 1;
      } else {
        cart.push({ id, qty: 1, size });
      }

      saveCart();
      modal.hidden = true;
      toast("Product added to cart.");
    });

    modal.hidden = false;
  }

  // Product cards and Add to Cart
  $("products")?.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");

    if (addButton) {
      const id = Number(addButton.dataset.add);

      const found = cart.find(line =>
        line.id === id &&
        (line.size || "Standard") === "Standard"
      );

      if (found) {
        found.qty += 1;
      } else {
        cart.push({ id, qty: 1, size: "Standard" });
      }

      saveCart();
      toast("Added to cart.");
      return;
    }

    const card = event.target.closest("[data-product]");
    if (!card) return;

    openProductDetails(Number(card.dataset.product));
  });

  // Category filters
  $("categories")?.addEventListener("click", event => {
    const button = event.target.closest("[data-cat]");
    if (!button) return;

    activeCategory = button.dataset.cat;

    $("categories").querySelectorAll("[data-cat]").forEach(el => {
      el.classList.toggle("active", el === button);
    });

    renderProducts();
  });

  $("search")?.addEventListener("input", event => {
    searchText = event.target.value.trim();
    renderProducts();
  });

  $("clear")?.addEventListener("click", () => {
    if ($("search")) $("search").value = "";
    searchText = "";
    renderProducts();
  });

  $("sort")?.addEventListener("change", event => {
    sortMode = event.target.value;
    renderProducts();
  });

  $("reset")?.addEventListener("click", () => {
    activeCategory = "All";
    searchText = "";

    if ($("search")) $("search").value = "";

    $("categories")?.querySelectorAll("[data-cat]").forEach(el => {
      el.classList.toggle("active", el.dataset.cat === "All");
    });

    renderProducts();
  });

  // Cart quantity controls, including products with different sizes.
  $("cartItems")?.addEventListener("click", event => {
    const qtyButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");

    if (removeButton) {
      const id = Number(removeButton.dataset.remove);
      const size = removeButton.dataset.size || "Standard";

      cart = cart.filter(line =>
        !(line.id === id && (line.size || "Standard") === size)
      );

      saveCart();
      return;
    }

    if (qtyButton) {
      const id = Number(qtyButton.dataset.qty);
      const size = qtyButton.dataset.size || "Standard";

      const line = cart.find(item =>
        item.id === id && (item.size || "Standard") === size
      );

      if (!line) return;

      line.qty += Number(qtyButton.dataset.change);

      if (line.qty <= 0) {
        cart = cart.filter(item => item !== line);
      }

      saveCart();
    }
  });

  $("cartOpen")?.addEventListener("click", () => {
    openOverlay("cartOverlay");
  });

  $("adminOpen")?.addEventListener("click", () => {
    openOverlay("adminOverlay");
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      closeOverlay(button.dataset.close);
    });
  });

  document.querySelectorAll(".overlay").forEach(overlay => {
    overlay.addEventListener("click", event => {
      if (event.target === overlay) overlay.hidden = true;
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".overlay").forEach(el => {
        el.hidden = true;
      });
    }
  });

  $("checkoutOpen")?.addEventListener("click", () => {
    if (!getCartLines().length) {
      toast("Your cart is empty.");
      return;
    }

    closeOverlay("cartOverlay");

    if ($("checkoutResult")) $("checkoutResult").hidden = true;
    if ($("checkoutForm")) $("checkoutForm").hidden = false;

    renderCheckoutPayment();
    openOverlay("checkoutOverlay");
  });

  $("checkoutForm")?.addEventListener("submit", event => {
    event.preventDefault();

    if (!getCartLines().length) {
      toast("Your cart is empty.");
      return;
    }

    if (!payment.upiId && !payment.qrUrl) {
      toast("The store has not set up UPI payment yet.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const order = {
      id: "MS" + Date.now(),
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),

      items: getCartLines().map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        qty: p.qty,
        size: p.size || "Standard"
      })),

      total: cartTotal(),
      paymentStatus: "Pending manual verification",
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    write(ORDER_KEY, orders);

    const result = $("checkoutResult");

    if (result) {
      result.hidden = false;

      result.innerHTML = `
        <div class="notice">
          <b>Order preview saved.</b><br>
          Order ID: ${esc(order.id)}<br>
          Total: ${money(order.total)}<br>
          Payment status: <b>Pending manual verification</b><br>
          This demo does not verify payments or send a real delivery order.
        </div>

        <p>
          Complete the UPI payment using the amount-specific QR or UPI link.
          The store must verify the payment separately.
        </p>

        <button class="primary full"
                type="button"
                id="finishDemoOrder">
          Finish demo
        </button>
      `;

      $("finishDemoOrder")?.addEventListener("click", () => {
        cart = [];
        saveCart();

        closeOverlay("checkoutOverlay");
        if (result) result.hidden = true;

        event.currentTarget.reset();
        toast("Demo order finished.");
      });
    }

    $("checkoutForm").hidden = true;
  });

  // Admin PIN gate: demo only, not secure for a live store.
  $("adminForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    if (String(data.get("pin")) !== "2468") {
      toast("Incorrect demo PIN.");
      return;
    }

    $("adminTools").hidden = false;

    renderAdminCount();
    renderPaymentAdmin();
    renderAdminOrders();

    toast("Demo admin tools opened.");
  });

  $("addForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();

    if (!title) return;

    const id = productList.reduce(
      (max, p) => Math.max(max, Number(p.id) || 0),
      0
    ) + 1;

    productList.push({
      id,
      title,
      category: String(data.get("category") || "Women"),
      price: Number(data.get("price")) || 199,
      oldPrice: 0,
      tag: "NEW",
      image: String(data.get("image") || "")
    });

    write(PRODUCT_KEY, productList);

    event.currentTarget.reset();

    renderProducts();
    renderAdminCount();

    toast("Product added in this browser.");
  });

  $("resetDemo")?.addEventListener("click", () => {
    if (!confirm("Reset demo products to the original list?")) return;

    productList = defaults.map(p => ({ ...p }));

    write(PRODUCT_KEY, productList);

    renderProducts();
    renderAdminCount();

    toast("Demo products reset.");
  });

  if ($("year")) {
    $("year").textContent = new Date().getFullYear();
  }

  // Initial render
  renderProducts();
  renderCart();

  const checkoutNotice =
    document.querySelector("#checkoutOverlay .notice");

  if (checkoutNotice) {
    checkoutNotice.textContent =
      "UPI payment details are displayed below when configured. " +
      "Payments are not automatically verified and orders are demo-only.";
  }

  renderCheckoutPayment();
})();
