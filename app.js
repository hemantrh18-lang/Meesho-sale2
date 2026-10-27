(() => {
  "use strict";

  // Meesho Sale - current index.html compatible
  // Demo admin PIN only; production security ke liye enough nahi.
  const SUPABASE_URL = "https://uttemuesgazjillliimo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EJfp_-l9jErxOBI_ykUOZg_zZOfyk_7";

  const PRODUCT_KEY = "msSaleProductsV3";
  const CART_KEY = "msSaleCartV3";
  const ORDERS_KEY = "msSaleDemoOrdersV1";
  const PAYMENT_KEY = "msSalePaymentSettingsV1";
  const ADMIN_PIN = "2468";

  const defaults = [
    [1, "Women's Printed Kurti", "Women", 199, 399, "BESTSELLER", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=650&q=80", "Comfortable everyday printed kurti."],
    [2, "Makeup Combo", "Beauty", 149, 299, "TRENDING", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=650&q=80", "Everyday beauty essentials combo."],
    [3, "Casual Men's T-Shirt", "Men", 249, 499, "HOT DEAL", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=650&q=80", "Soft casual T-shirt for daily wear."],
    [4, "Minimal Home Organizer", "Home", 199, 399, "POPULAR", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=650&q=80", "Keep everyday essentials organized."],
    [5, "Women's Handbag", "Accessories", 299, 599, "NEW", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=650&q=80", "A versatile everyday handbag."],
    [6, "Floral Women's Dress", "Women", 249, 549, "TRENDING", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=650&q=80", "A lightweight floral outfit."],
    [7, "Skincare Essentials", "Beauty", 199, 449, "DEAL", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=650&q=80", "Simple skincare essentials."],
    [8, "Men's Casual Shirt", "Men", 299, 699, "BESTSELLER", "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=650&q=80", "Smart casual shirt for outings."],
    [9, "Decor Cushion Cover", "Home", 149, 299, "VALUE BUY", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=650&q=80", "Refresh your living room decor."],
    [10, "Fashion Earrings", "Accessories", 149, 349, "SALE", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=650&q=80", "Lightweight statement earrings."],
    [11, "Cotton Kurti Set", "Women", 299, 649, "SALE", "https://images.unsplash.com/photo-1583391733956-6c78276477e9?auto=format&fit=crop&w=650&q=80", "An easy-to-style kurti set."],
    [12, "Daily-use Water Bottle", "Home", 199, 399, "POPULAR", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=650&q=80", "Reusable bottle for everyday use."]
  ].map(p => ({
    id: p[0],
    title: p[1],
    category: p[2],
    price: p[3],
    oldPrice: p[4],
    tag: p[5],
    image: p[6],
    description: p[7],
    stock: 99,
    active: true
  }));

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Local storage error:", error);
    }
  };

  const money = value =>
    "₹" + Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);

  let productList = read(PRODUCT_KEY, defaults);

  if (!Array.isArray(productList) || !productList.length) {
    productList = defaults.map(p => ({ ...p }));
  }

  productList = productList.map(p => ({
    ...p,
    title: p.title ?? p.name ?? "Product",
    category: p.category ?? "Women",
    oldPrice: Number(p.oldPrice ?? p.old_price ?? p.original_price ?? 0),
    price: Number(p.price ?? 0),
    image: p.image ?? p.image_url ??
      "https://placehold.co/600x700/f7edf6/9f2089?text=Meesho+Sale",
    active: p.active !== false
  }));

  let cart = read(CART_KEY, []);
  if (!Array.isArray(cart)) cart = [];

  let orders = read(ORDERS_KEY, []);
  if (!Array.isArray(orders)) orders = [];

  let paymentSettings = read(PAYMENT_KEY, {
    upiId: "",
    merchantName: "Meesho Sale",
    qrImage: ""
  });

  let activeCategory = "All";
  let searchTerm = "";

  function toast(message) {
    const el = $("#toast");

    if (!el) {
      console.log(message);
      return;
    }

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2200);
  }

  function saveProducts() {
    write(PRODUCT_KEY, productList);
  }

  function saveCart() {
    write(CART_KEY, cart);
    updateCartCount();
  }

  function updateCartCount() {
    const count = cart.reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    );

    const mainCount = $("#count");
    if (mainCount) mainCount.textContent = String(count);

    const otherCount = $("#cartCount");
    if (otherCount) otherCount.textContent = String(count);
  }

  function visibleProducts() {
    let list = productList.filter(p => p.active !== false);

    if (activeCategory !== "All") {
      list = list.filter(
        p => String(p.category).toLowerCase() ===
             activeCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      list = list.filter(p =>
        `${p.title} ${p.category} ${p.description || ""}`
          .toLowerCase()
          .includes(searchTerm)
      );
    }

    const sort = $("#sort")?.value || "featured";

    if (["low", "price-low", "price-asc"].includes(sort)) {
      list.sort((a, b) => a.price - b.price);
    }

    if (["high", "price-high", "price-desc"].includes(sort)) {
      list.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }

  function renderProducts() {
    const grid = $("#products") || $("#productGrid");

    if (!grid) {
      console.error("Product grid nahi mila. index.html mein #products check karo.");
      return;
    }

    const list = visibleProducts();
    const empty = $("#empty");

    grid.innerHTML = list.map(p => `
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

          <p class="product-category">${escapeHtml(p.category)}</p>

          <div class="product-price">
            <span class="price-now">${money(p.price)}</span>
            <span class="price-old">${money(p.oldPrice)}</span>
            ${
              p.oldPrice > p.price
                ? `<span class="discount">${Math.round(
                    (1 - p.price / p.oldPrice) * 100
                  )}% off</span>`
                : ""
            }
          </div>

          <p class="product-description">
            ${escapeHtml(p.description || "")}
          </p>

          <div class="product-buttons">
            <button type="button" class="add-btn" data-add="${escapeHtml(p.id)}">
              Add to cart
            </button>
            <button type="button" class="buy-btn" data-buy="${escapeHtml(p.id)}">
              Buy now
            </button>
          </div>
        </div>
      </article>
    `).join("");

    if (empty) empty.hidden = list.length > 0;

    const resultCount = $("#resultCount");
    if (resultCount) {
      resultCount.textContent = `${list.length} products`;
    }

    const status = $("#statusMessage");
    if (status) {
      status.textContent = list.length
        ? `${list.length} products available`
        : "Product nahi mila.";
    }

    $$("img.product-image", grid).forEach(img => {
      img.onerror = () => {
        img.onerror = null;
        img.src = "https://placehold.co/600x700/f7edf6/9f2089?text=Product";
      };
    });
  }

  function addToCart(product, qty = 1) {
    const existing = cart.find(
      item => String(item.id) === String(product.id)
    );

    if (existing) {
      existing.qty = Number(existing.qty || 0) + qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.image,
        qty,
        size: "Free Size"
      });
    }

    saveCart();
    toast(`${product.title} cart mein add ho gaya`);
  }

  function cartTotal() {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0
    );
  }

  function changeQty(id, delta) {
    const item = cart.find(i => String(i.id) === String(id));
    if (!item) return;

    item.qty = Number(item.qty || 0) + delta;
    cart = cart.filter(i => i.qty > 0);

    saveCart();
    renderCart();
  }

  function showOverlay(id) {
    const el = $("#" + id);

    if (!el) {
      toast("Overlay nahi mila: " + id);
      return false;
    }

    el.hidden = false;
    el.classList.add("open", "active", "show");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");

    return true;
  }

  function hideOverlay(id) {
    const el = $("#" + id);
    if (!el) return;

    el.classList.remove("open", "active", "show");
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");

    const anyOpen = $$(".open").some(item =>
      ["cartOverlay", "checkoutOverlay", "adminOverlay"].includes(item.id)
    );

    if (!anyOpen) {
      document.body.classList.remove("overlay-open");
    }
  }

  function hideAllOverlays() {
    ["cartOverlay", "checkoutOverlay", "adminOverlay"].forEach(hideOverlay);
    document.body.classList.remove("overlay-open");
  }

  function renderCart() {
    const container = $("#cartItems");

    if (!container) {
      toast("Cart section nahi mila");
      return;
    }

    container.innerHTML = cart.length
      ? cart.map(item => `
          <div class="cart-line">
            <img
              src="${escapeHtml(item.image)}"
              alt="${escapeHtml(item.title)}">

            <div class="cart-line-info">
              <h4>${escapeHtml(item.title)}</h4>
              <p>${money(item.price)} each</p>

              <div class="qty-controls">
                <button type="button"
                  data-qty="${escapeHtml(item.id)}"
                  data-delta="-1">−</button>

                <span>${Number(item.qty)}</span>

                <button type="button"
                  data-qty="${escapeHtml(item.id)}"
                  data-delta="1">+</button>

                <button type="button"
                  data-remove="${escapeHtml(item.id)}"
                  class="danger-btn">Remove</button>
              </div>
            </div>

            <strong>${money(item.price * item.qty)}</strong>
          </div>
        `).join("")
      : `<p class="empty-state">Cart abhi khaali hai.</p>`;

    const subtotal = $("#subtotal");
    if (subtotal) subtotal.textContent = money(cartTotal());

    const checkout = $("#checkoutOpen");
    if (checkout) checkout.disabled = !cart.length;

    showOverlay("cartOverlay");
  }

  function buildUpiLink(total, orderRef) {
    if (!paymentSettings.upiId) return "";

    const params = new URLSearchParams({
      pa: paymentSettings.upiId,
      pn: paymentSettings.merchantName || "Meesho Sale",
      am: Number(total).toFixed(2),
      cu: "INR",
      tn: `Meesho Sale ${orderRef}`
    });

    return `upi://pay?${params.toString()}`;
  }

  function renderCheckoutPayment() {
    const host = $("#checkoutPayment");
    if (!host) return;

    const total = cartTotal();
    const upi = buildUpiLink(total, "checkout");

    host.innerHTML = `
      <p><strong>Order total: ${money(total)}</strong></p>

      <p class="muted">
        COD unavailable hai. Payment merchant app mein verify karni hogi.
      </p>

      ${
        paymentSettings.upiId
          ? `<p>UPI ID: <code>${escapeHtml(paymentSettings.upiId)}</code></p>`
          : `<p class="muted">Admin Panel mein business UPI ID set karein.</p>`
      }

      ${
        paymentSettings.qrImage
          ? `<img class="qr-preview"
                  src="${escapeHtml(paymentSettings.qrImage)}"
                  alt="Merchant QR"
                  style="max-width:220px;width:100%">`
          : ""
      }

      ${
        upi
          ? `<p><a class="primary-btn" href="${escapeHtml(upi)}">
               Pay exact ${money(total)} via UPI
             </a></p>`
          : ""
      }

      <p class="muted">
        Website payment ko automatically verify nahi karti.
      </p>
    `;
  }

  function openCheckout() {
    if (!cart.length) {
      toast("Pehle cart mein product add karein");
      return;
    }

    hideOverlay("cartOverlay");
    renderCheckoutPayment();
    showOverlay("checkoutOverlay");
  }

  function saveOrder(event) {
    event.preventDefault();

    if (!cart.length) {
      toast("Cart khaali hai");
      return;
    }

    const form = $("#checkoutForm");
    const name =
      form?.elements.namedItem("name")?.value?.trim() ||
      $("#customerName")?.value?.trim() || "";

    const phone =
      form?.elements.namedItem("phone")?.value?.trim() ||
      $("#customerPhone")?.value?.trim() || "";

    const address =
      form?.elements.namedItem("address")?.value?.trim() ||
      $("#customerAddress")?.value?.trim() || "";

    if (!name || !phone || !address) {
      toast("Name, phone aur address bharein");
      return;
    }

    const orderNo = "MS" + Date.now().toString().slice(-10);
    const total = cartTotal();

    const order = {
      id: orderNo,
      order_number: orderNo,
      customer_name: name,
      customer_phone: phone,
      delivery_address: address,
      name,
      phone,
      address,
      items: cart.map(i => ({
        id: i.id,
        name: i.title,
        price: i.price,
        quantity: i.qty
      })),
      total: Number(total.toFixed(2)),
      payment_status: "pending",
      order_status: "placed",
      createdAt: new Date().toISOString()
    };

    orders.unshift(order);
    write(ORDERS_KEY, orders);

    cart = [];
    saveCart();
    hideOverlay("checkoutOverlay");

    const result = $("#checkoutResult");

    if (result) {
      result.hidden = false;
      result.textContent =
        `Order ${orderNo} record ho gaya. Payment status: Pending verification. Merchant ko payment verify karni hogi.`;
    }

    toast(`Order ${orderNo} record ho gaya`);
  }

  // Admin Panel
  function openAdmin() {
    const pin = prompt("Demo admin PIN enter karein:");

    if (pin === null) return;

    if (pin !== ADMIN_PIN) {
      alert("PIN incorrect.");
      return;
    }

    showOverlay("adminOverlay");

    const tools = $("#adminTools");
    if (tools) {
      tools.hidden = false;
      tools.style.display = "block";
    }

    const pinForm = $("#adminForm");
    if (pinForm) pinForm.hidden = true;

    const count = $("#adminCount");
    if (count) count.textContent = String(productList.length);

    toast("Admin panel khul gaya");
  }

  function bindAdmin() {
    const adminForm = $("#adminForm");

    if (adminForm) {
      adminForm.addEventListener("submit", event => {
        event.preventDefault();

        const input = adminForm.querySelector(
          'input[type="password"], input[name="pin"], input'
        );

        if ((input?.value || "") !== ADMIN_PIN) {
          alert("PIN incorrect.");
          return;
        }

        const tools = $("#adminTools");
        if (tools) tools.hidden = false;

        adminForm.hidden = true;

        const count = $("#adminCount");
        if (count) count.textContent = String(productList.length);
      });
    }

    const addForm = $("#addForm");

    if (addForm) {
      addForm.addEventListener("submit", event => {
        event.preventDefault();

        const title = addForm.querySelector(
          '[name="title"], #productTitle, #title, input'
        );

        const price = addForm.querySelector(
          '[name="price"], #productPrice, #price, input[type="number"]'
        );

        const category = addForm.querySelector(
          '[name="category"], #productCategory, #category, select'
        );

        const image = addForm.querySelector(
          '[name="image"], #productImage, #image, input[type="url"]'
        );

        if (!title?.value.trim() || !price || Number(price.value) < 0) {
          toast("Product name aur valid price bharein");
          return;
        }

        productList.unshift({
          id: "local-" + Date.now(),
          title: title.value.trim(),
          category: category?.value || "Women",
          price: Number(price.value),
          oldPrice: Number(
            addForm.querySelector('[name="oldPrice"], #oldPrice')?.value || 0
          ),
          tag: "NEW",
          image: image?.value.trim() ||
            "https://placehold.co/600x700/f7edf6/9f2089?text=New+Product",
          description:
            addForm.querySelector('[name="description"], #description, textarea')?.value.trim() || "",
          stock: 99,
          active: true
        });

        saveProducts();
        renderProducts();

        const count = $("#adminCount");
        if (count) count.textContent = String(productList.length);

        addForm.reset();
        toast("Product is browser mein add ho gaya");
      });
    }

    const reset = $("#resetDemo");

    if (reset) {
      reset.addEventListener("click", () => {
        if (!confirm("Demo products restore karein? Current product changes replace honge.")) {
          return;
        }

        productList = defaults.map(p => ({ ...p }));
        saveProducts();
        renderProducts();

        const count = $("#adminCount");
        if (count) count.textContent = String(productList.length);

        toast("Demo products restore ho gaye");
      });
    }
  }

  async function loadSupabaseProducts() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=id,name,category,price,original_price,image_url,description,stock,active&active=eq.true&order=id.asc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error(`Supabase ${response.status}`);

      const rows = await response.json();

      if (Array.isArray(rows) && rows.length) {
        productList = rows.map(p => ({
          id: p.id,
          title: p.name || p.title || "Product",
          category: p.category || "Women",
          price: Number(p.price || 0),
          oldPrice: Number(p.original_price || p.oldPrice || 0),
          tag: p.tag || "SALE",
          image: p.image_url || p.image ||
            "https://placehold.co/600x700/f7edf6/9f2089?text=Product",
          description: p.description || "",
          stock: Number(p.stock || 99),
          active: p.active !== false
        }));

        saveProducts();
        renderProducts();
      }
    } catch (error) {
      console.warn(
        "Supabase products unavailable; using browser/demo products.",
        error
      );
    }
  }

  // Product grid click handling
  const grid = $("#products") || $("#productGrid");

  if (grid) {
    grid.addEventListener("click", event => {
      const add = event.target.closest("[data-add]");
      const buy = event.target.closest("[data-buy]");
      const detail = event.target.closest("[data-detail]");

      if (add) {
        const product = productList.find(
          p => String(p.id) === add.dataset.add
        );

        if (product) addToCart(product);
      } else if (buy) {
        const product = productList.find(
          p => String(p.id) === buy.dataset.buy
        );

        if (product) {
          addToCart(product);
          openCheckout();
        }
      } else if (detail) {
        const product = productList.find(
          p => String(p.id) === detail.dataset.detail
        );

        if (product) {
          alert(
            `${product.title}\n${money(product.price)}\n\n${product.description || ""}`
          );
        }
      }
    });
  }

  // Search and clear
  const search = $("#search") || $("#searchInput");

  if (search) {
    search.addEventListener("input", () => {
      searchTerm = search.value.trim().toLowerCase();
      renderProducts();
    });
  }

  const clear = $("#clear");

  if (clear) {
    clear.addEventListener("click", () => {
      if (search) search.value = "";
      searchTerm = "";
      renderProducts();
    });
  }

  const searchBtn = $("#searchBtn");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      searchTerm = (search?.value || "").trim().toLowerCase();
      renderProducts();
    });
  }

  // Sorting
  const sort = $("#sort") || $("#sortSelect");

  if (sort) {
    sort.addEventListener("change", renderProducts);
  }

  // Categories
  const categoryNav = $("#categories") || $("#categoryNav");

  if (categoryNav) {
    categoryNav.addEventListener("click", event => {
      const button = event.target.closest("[data-cat], [data-category]");
      if (!button) return;

      activeCategory = button.dataset.cat ||
        button.dataset.category || "All";

      $$("[data-cat], [data-category]", categoryNav).forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
    });
  }

  // Header buttons
  const cartButton = $("#cartOpen") || $("#cartButton");

  if (cartButton) {
    cartButton.addEventListener("click", renderCart);
  }

  const adminButton = $("#adminOpen");

  if (adminButton) {
    adminButton.addEventListener("click", openAdmin);
  }

  const shopNow = $("#shopNow");

  if (shopNow) {
    shopNow.addEventListener("click", () => {
      ($("#shop") || $("#productsSection"))?.scrollIntoView({
        behavior: "smooth"
      });
    });
  }

  const checkoutOpen = $("#checkoutOpen");

  if (checkoutOpen) {
    checkoutOpen.addEventListener("click", openCheckout);
  }

  const checkoutForm = $("#checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", saveOrder);
  }

  bindAdmin();

  // Quantity, remove, close and overlay clicks
  document.addEventListener("click", event => {
    const qty = event.target.closest("[data-qty]");
    const remove = event.target.closest("[data-remove]");

    if (qty) {
      changeQty(qty.dataset.qty, Number(qty.dataset.delta || 0));
    }

    if (remove) {
      cart = cart.filter(
        item => String(item.id) !== remove.dataset.remove
      );

      saveCart();
      renderCart();
    }

    const close = event.target.closest("[data-close]");

    if (close) {
      const targetId = close.dataset.close;

      if (targetId) hideOverlay(targetId);
      else hideAllOverlays();
    }

    const isBackdrop =
      event.target.classList?.contains("overlay") ||
      event.target.classList?.contains("overlay-backdrop");

    if (isBackdrop && event.target.id) {
      hideOverlay(event.target.id);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hideAllOverlays();
  });

  // Countdown index.html mein already hai.
  // Duplicate timer yahan intentionally nahi banaya.
  const year = $("#year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  renderProducts();
  updateCartCount();
  loadSupabaseProducts();
})();
