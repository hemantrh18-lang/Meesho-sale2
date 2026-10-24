(() => {
  "use strict";
  const PRODUCTS_KEY = "meeshoSaleDemoProductsV1";
  const CART_KEY = "meeshoSaleDemoCartV1";
  const defaultProducts = [
    {id:1,title:"Everyday Tote Bag",category:"Fashion",price:199,oldPrice:399,emoji:"👜",bg:"#f6dff1",tag:"BESTSELLER"},
    {id:2,title:"Minimal Ceramic Mug",category:"Home",price:149,oldPrice:249,emoji:"☕",bg:"#ffe7cf",tag:"SALE PICK"},
    {id:3,title:"Glow Care Set",category:"Beauty",price:249,oldPrice:499,emoji:"🧴",bg:"#ffe0e9",tag:"POPULAR"},
    {id:4,title:"Classic Sunglasses",category:"Accessories",price:299,oldPrice:599,emoji:"🕶️",bg:"#dce9ff",tag:"TRENDING"},
    {id:5,title:"Soft Cushion Cover",category:"Home",price:199,oldPrice:349,emoji:"🛋️",bg:"#e1f5e7",tag:"HOME FAVOURITE"},
    {id:6,title:"Daily Wear Earrings",category:"Fashion",price:149,oldPrice:299,emoji:"💎",bg:"#fff0c9",tag:"UNDER ₹149"},
    {id:7,title:"Pocket Perfume",category:"Beauty",price:249,oldPrice:449,emoji:"🌸",bg:"#f1e3ff",tag:"FRESH FIND"},
    {id:8,title:"Travel Organizer",category:"Accessories",price:299,oldPrice:499,emoji:"🎒",bg:"#d9f4f4",tag:"SMART PICK"}
  ];
  const $ = (id) => document.getElementById(id);
  const safeParse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  let products = safeParse(localStorage.getItem(PRODUCTS_KEY), null);
  if (!Array.isArray(products) || !products.length) products = defaultProducts.map(p => ({...p}));
  let cart = safeParse(localStorage.getItem(CART_KEY), {});
  let activeCategory = "All";
  let searchTerm = "";
  let toastTimer;
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const persist = () => { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); localStorage.setItem(CART_KEY, JSON.stringify(cart)); };
  const productById = id => products.find(p => String(p.id) === String(id));
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  function openOverlay(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
  function closeOverlay(id) {
    $(id).hidden = true;
    if (![...document.querySelectorAll(".overlay")].some(el => !el.hidden)) document.body.style.overflow = "";
  }
  function renderProducts() {
    const list = products.filter(p => (activeCategory === "All" || p.category === activeCategory) &&
      (p.title.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm)));
    $("resultCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
    $("emptyState").hidden = list.length !== 0;
    $("productGrid").innerHTML = list.map(p => `
      <article class="product-card">
        <div class="product-visual" style="--product-bg:${esc(p.bg || "#f6eaff")}">
          <span class="product-tag">${esc(p.tag || "SALE PICK")}</span>
          <button class="heart-button" type="button" data-favourite="${p.id}" aria-label="Favourite ${esc(p.title)}">♡</button>
          <span class="product-emoji" aria-hidden="true">${esc(p.emoji || "🛍️")}</span>
        </div>
        <div class="product-info">
          <span class="product-category">${esc(p.category)}</span>
          <h3>${esc(p.title)}</h3>
          <div class="price-row"><span class="price">${money(p.price)}</span><span class="old-price">${money(p.oldPrice || p.price * 2)}</span></div>
          <button class="add-button" type="button" data-add="${p.id}">＋ Add to cart</button>
        </div>
      </article>`).join("");
  }
  function renderCart() {
    const entries = Object.entries(cart).filter(([id, qty]) => productById(id) && qty > 0);
    const count = entries.reduce((sum, [,qty]) => sum + qty, 0);
    const total = entries.reduce((sum, [id,qty]) => sum + productById(id).price * qty, 0);
    $("cartCount").textContent = count;
    $("cartSubtotal").textContent = money(total);
    $("cartItems").innerHTML = entries.length ? entries.map(([id,qty]) => {
      const p = productById(id);
      return `<div class="cart-line"><div class="cart-thumb" style="background:${esc(p.bg || "#f5eaff")}">${esc(p.emoji || "🛍️")}</div><div><h3>${esc(p.title)}</h3><small>${money(p.price)} each</small><div class="qty-control"><button type="button" data-qty="${id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${qty}</span><button type="button" data-qty="${id}" data-delta="1" aria-label="Increase quantity">+</button></div></div><span class="line-price">${money(p.price * qty)}</span></div>`;
    }).join("") : `<div class="cart-empty"><span>🛍️</span><h3>Your bag is waiting</h3><p>Add something lovely from the sale.</p></div>`;
    $("checkoutOpen").disabled = !count;
    $("checkoutOpen").style.opacity = count ? "1" : ".5";
    $("adminCartCount").textContent = count;
  }
  function addToCart(id) {
    const p = productById(id); if (!p) return;
    cart[id] = (cart[id] || 0) + 1; persist(); renderCart(); toast(`${p.title} added to cart`);
  }
  document.addEventListener("click", event => {
    const add = event.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const qty = event.target.closest("[data-qty]");
    if (qty) {
      const id = qty.dataset.qty; cart[id] = (cart[id] || 0) + Number(qty.dataset.delta);
      if (cart[id] <= 0) delete cart[id];
      persist(); renderCart(); return;
    }
    const fav = event.target.closest("[data-favourite]");
    if (fav) { fav.classList.toggle("liked"); fav.textContent = fav.classList.contains("liked") ? "♥" : "♡"; return; }
    const close = event.target.closest("[data-close]");
    if (close) closeOverlay(close.dataset.close);
    if (event.target.classList.contains("overlay")) closeOverlay(event.target.id);
  });
  $("searchInput").addEventListener("input", e => { searchTerm = e.target.value.trim().toLowerCase(); renderProducts(); });
  $("searchClear").addEventListener("click", () => { $("searchInput").value = ""; searchTerm = ""; renderProducts(); $("searchInput").focus(); });
  $("categoryChips").addEventListener("click", e => {
    const chip = e.target.closest("[data-category]"); if (!chip) return;
    activeCategory = chip.dataset.category;
    document.querySelectorAll(".chip").forEach(el => el.classList.toggle("active", el === chip));
    renderProducts();
  });
  $("resetFilters").addEventListener("click", () => {
    activeCategory = "All"; searchTerm = ""; $("searchInput").value = "";
    document.querySelectorAll(".chip").forEach(el => el.classList.toggle("active", el.dataset.category === "All"));
    renderProducts();
  });
  $("cartOpen").addEventListener("click", () => { renderCart(); openOverlay("cartOverlay"); });
  $("checkoutOpen").addEventListener("click", () => {
    if (!Object.keys(cart).length) return;
    closeOverlay("cartOverlay"); $("checkoutResult").hidden = true; $("checkoutForm").hidden = false; $("checkoutForm").reset(); openOverlay("checkoutOverlay");
  });
  $("checkoutForm").addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const entries = Object.entries(cart).filter(([id,qty]) => productById(id) && qty > 0);
    const total = entries.reduce((sum,[id,qty]) => sum + productById(id).price * qty, 0);
    const orderLines = entries.map(([id,qty]) => `${productById(id).title} × ${qty}`).join(", ");
    $("checkoutResult").innerHTML = `<b>Order preview — not a real order</b><br>Name: ${esc(data.get("name"))}<br>Mobile: ${esc(data.get("phone"))}<br>Address: ${esc(data.get("address"))}<br>Items: ${esc(orderLines)}<br>Subtotal: <b>${money(total)}</b><br>Payment: ${esc(data.get("payment"))}<p class="fine-print">No payment was taken and no order was sent to a store. A real payment gateway and backend must be connected before launch.</p>`;
    $("checkoutResult").hidden = false;
    $("checkoutForm").hidden = true;
  });
  $("adminOpen").addEventListener("click", () => { $("adminTools").hidden = true; $("adminForm").hidden = false; $("adminForm").reset(); openOverlay("adminOverlay"); });
  $("adminForm").addEventListener("submit", e => {
    e.preventDefault();
    if (new FormData(e.currentTarget).get("pin") !== "2468") { toast("Incorrect demo PIN"); return; }
    e.currentTarget.hidden = true; $("adminTools").hidden = false;
    $("adminProductCount").textContent = products.length; renderCart();
  });
  $("addProductForm").addEventListener("submit", e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const id = Date.now();
    const price = Number(data.get("price"));
    products.unshift({id,title:String(data.get("title")).trim(),category:String(data.get("category")),price,oldPrice:price*2,emoji:String(data.get("emoji") || "🛍️").trim(),bg:"#f1e3ff",tag:"NEW ARRIVAL"});
    persist(); renderProducts(); $("adminProductCount").textContent = products.length; e.currentTarget.reset(); e.currentTarget.elements.emoji.value = "🛍️"; toast("Product added in this browser");
  });
  $("resetDemo").addEventListener("click", () => {
    products = defaultProducts.map(p => ({...p})); cart = {}; persist(); renderProducts(); renderCart(); $("adminProductCount").textContent = products.length; toast("Demo products restored");
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".overlay:not([hidden])").forEach(el => closeOverlay(el.id)); });
  // A 10-minute display countdown. It restarts on page refresh; it does not close a real sale.
  let remaining = 600;
  function updateTimer() {
    const min = String(Math.floor(remaining / 60)).padStart(2,"0");
    const sec = String(remaining % 60).padStart(2,"0");
    $("saleTimer").textContent = `${min}:${sec}`;
    if (remaining > 0) remaining--; else remaining = 600;
  }
  $("year").textContent = new Date().getFullYear();
  renderProducts(); renderCart(); updateTimer(); setInterval(updateTimer, 1000);
})();
