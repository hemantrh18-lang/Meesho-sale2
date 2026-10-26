(() => {
  "use strict";
  const PRODUCTS_KEY = "meeshoSaleDemoProductsV1";
  const CART_KEY = "meeshoSaleDemoCartV1";
  const defaultProducts = [
  {id:1,title:"Women's Printed Kurti",category:"Fashion",price:199,oldPrice:399,emoji:"👗",tag:"BESTSELLER",bg:"#fce7f3",image:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"},
  {id:2,title:"Beautiful Makeup Combo",category:"Beauty",price:149,oldPrice:299,emoji:"💄",tag:"TRENDING",bg:"#fce7f3",image:"https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80"},
  {id:3,title:"Women's Saree",category:"Fashion",price:299,oldPrice:599,emoji:"🥻",tag:"POPULAR",bg:"#fef3c7",image:"https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80"},
  {id:4,title:"Fashion Earrings",category:"Fashion",price:149,oldPrice:299,emoji:"💎",tag:"BESTSELLER",bg:"#f3e8ff",image:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"},
  {id:5,title:"Men's Casual T-Shirt",category:"Fashion",price:199,oldPrice:399,emoji:"👕",tag:"TRENDING",bg:"#dbeafe",image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80"},
  {id:6,title:"Kids Clothing Set",category:"Fashion",price:249,oldPrice:499,emoji:"🧒",tag:"POPULAR",bg:"#fef3c7",image:"https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=600&q=80"},
  {id:7,title:"Decorative Home Vase",category:"Home",price:199,oldPrice:349,emoji:"🏺",tag:"HOME PICK",bg:"#dcfce7",image:"https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=80"},
  {id:8,title:"Stylish Cushion Cover",category:"Home",price:149,oldPrice:299,emoji:"🛋️",tag:"DEAL",bg:"#fce7f3",image:"https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80"},
  {id:9,title:"Skincare Essentials",category:"Beauty",price:249,oldPrice:449,emoji:"🧴",tag:"BEAUTY PICK",bg:"#fce7f3",image:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80"},
  {id:10,title:"Women's Handbag",category:"Accessories",price:299,oldPrice:599,emoji:"👜",tag:"TRENDING",bg:"#ffedd5",image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"},
  {id:11,title:"Kitchen Storage Set",category:"Home",price:199,oldPrice:349,emoji:"🍱",tag:"DAILY USE",bg:"#dbeafe",image:"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"},
  {id:12,title:"Men's Casual Shoes",category:"Accessories",price:299,oldPrice:599,emoji:"👟",tag:"BESTSELLER",bg:"#e0e7ff",image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"}
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
        <div class="product-visual" style="--product-bg:${esc(p.bg || "#f6eaff")};position:relative;overflow:hidden">
          
<a
  href="product.html?id=${encodeURIComponent(p.id)}&amp;title=${encodeURIComponent(p.title)}&amp;price=${encodeURIComponent(p.price)}&amp;oldPrice=${encodeURIComponent(p.oldPrice || p.price * 2)}&amp;image=${encodeURIComponent(p.image || "")}&amp;category=${encodeURIComponent(p.category)}&amp;tag=${encodeURIComponent(p.tag || "SALE PICK")}"
  style="display:block;position:absolute;inset:0;z-index:1"
>
  <img
    src="${esc(p.image || "")}"
    alt="${esc(p.title)}"
    loading="lazy"
    style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"
    onerror="this.style.display='none'"
  >
</a>

          <span class="product-tag" style="position:relative;pointer-events:none">
  ${esc(p.tag || "SALE PICK")}
</span>
          <button class="heart-button" type="button" data-favourite="${p.id}" aria-label="Favourite" style="position:relative">♡</button>
        </div>
        <div class="product-info" style="padding:12px">
          
<h3 style="margin:0 0 8px;font-size:15px;color:#222">
  <a
    href="product.html?id=${encodeURIComponent(p.id)}&amp;title=${encodeURIComponent(p.title)}&amp;price=${encodeURIComponent(p.price)}&amp;oldPrice=${encodeURIComponent(p.oldPrice || p.price * 2)}&amp;image=${encodeURIComponent(p.image || "")}&amp;category=${encodeURIComponent(p.category)}&amp;tag=${encodeURIComponent(p.tag || "SALE PICK")}"
    style="color:inherit;text-decoration:none"
  >${esc(p.title)}</a>
</h3>

          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <strong style="font-size:18px;color:#222">${money(p.price)}</strong>
            <del style="font-size:13px;color:#888">${money(p.oldPrice || p.price * 2)}</del>
          </div>
          <button type="button" data-add="${p.id}" style="width:100%;padding:10px;background:#9f2089;color:white;border:0;border-radius:6px;font-weight:600">
            Add to Cart
          </button>
        </div>
      </article>
    `).join("");

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
    
products.unshift({
  id,
  title: String(data.get("title")).trim(),
  category: String(data.get("category")),
  price,
  oldPrice: price * 2,
  emoji: String(data.get("emoji") || "🛍️").trim(),
  image: String(data.get("image") || "").trim(),
  bg: "#f1e3ff",
  tag: "NEW ARRIVAL"
});

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
