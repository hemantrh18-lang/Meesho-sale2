(()=>{'use strict';
const KEY='msSaleProductsV3', CART='msSaleCartV3';
const defaults=[
[1,"Women's Printed Kurti","Women",199,399,"BESTSELLER","https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=650&q=80"],
[2,"Makeup Combo","Beauty",149,299,"TRENDING","https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=650&q=80"],
[3,"Festive Saree","Women",299,599,"POPULAR","https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=650&q=80"],
[4,"Fashion Earrings","Accessories",149,299,"BESTSELLER","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=650&q=80"],
[5,"Men's Casual T-Shirt","Men",199,399,"TRENDING","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=650&q=80"],
[6,"Kids Clothing Set","Kids",249,499,"POPULAR","https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=650&q=80"],
[7,"Decorative Home Vase","Home",199,349,"HOME PICK","https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=650&q=80"],
[8,"Cushion Cover","Home",149,299,"DEAL","https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=650&q=80"],
[9,"Skincare Essentials","Beauty",249,449,"BEAUTY PICK","https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=650&q=80"],
[10,"Women's Handbag","Accessories",299,599,"TRENDING","https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=650&q=80"],
[11,"Kitchen Storage Set","Kitchen",199,349,"DAILY USE","https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=650&q=80"],
[12,"Men's Casual Shoes","Men",299,599,"BESTSELLER","https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=650&q=80"]
].map(([id,title,category,price,oldPrice,tag,image])=>({
id,title,category,price,oldPrice,tag,image
}));
const $=id=>document.getElementById(id);
const parse=(s,f)=>{
try{return JSON.parse(s)??f}catch{return f}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
'&':'&amp;','<':'&lt;','>':'&gt;',
'"':'&quot;',"'":'&#39;'
}[c]));
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
let products=parse(localStorage.getItem(KEY),null);
if(!Array.isArray(products)||!products.length){
products=defaults.map(p=>({...p}));
localStorage.setItem(KEY,JSON.stringify(products));
}
let cart=parse(localStorage.getItem(CART),{});
if(!cart||typeof cart!=='object'||Array.isArray(cart))cart={};
let category='All',query='',timer;
function save(){
localStorage.setItem(KEY,JSON.stringify(products));
localStorage.setItem(CART,JSON.stringify(cart));
}
function notify(message){
$('toast').textContent=message;
$('toast').classList.add('show');
clearTimeout(timer);
timer=setTimeout(()=>$('toast').classList.remove('show'),2200);
}
function open(id){$(id).hidden=false}
function close(id){$(id).hidden=true}
function render(){
let list=products.filter(p=>
(category==='All'||p.category===category)&&
(`${p.title} ${p.category}`.toLowerCase().includes(query))
);
if($('sort').value==='low')list.sort((a,b)=>a.price-b.price);
if($('sort').value==='high')list.sort((a,b)=>b.price-a.price);
$('resultCount').textContent=list.length+' product'+(list.length===1?'':'s');
$('empty').hidden=!!list.length;
$('products').innerHTML=list.map(p=>`
<article class="card">
<div class="photo">
<a href="product.html?id=${encodeURIComponent(p.id)}" aria-label="View ${esc(p.title)}">
<img src="${esc(p.image||'')}" alt="${esc(p.title)}" loading="lazy"
onerror="this.style.display='none'">
</a>
<span class="tag">${esc(p.tag||'SALE PICK')}</span>
<button class="heart" data-fav="${p.id}" aria-label="Favourite">♡</button>
</div>
<div class="info">
<h3><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.title)}</a></h3>
<div class="prices">
<strong>${money(p.price)}</strong>
<del>${money(p.oldPrice||p.price*2)}</del>
<span class="discount">${Math.max(0,Math.round((1-p.price/(p.oldPrice||p.price*2))*100))}% off</span>
</div>
<button class="add" data-add="${p.id}">Add to Cart</button>
</div>
</article>
`).join('');
}
function renderCart(){
let entries=Object.entries(cart).filter(([id,q])=>
products.some(p=>String(p.id)===id)&&Number(q)>0
);
let count=entries.reduce((s,[,q])=>s+Number(q),0);
let total=entries.reduce((s,[id,q])=>
s+products.find(p=>String(p.id)===id).price*Number(q),0
);
$('count').textContent=count;
$('subtotal').textContent=money(total);
$('cartItems').innerHTML=entries.length?entries.map(([id,q])=>{
let p=products.find(x=>String(x.id)===id);
return `
<div class="cartline">
<img class="thumb" src="${esc(p.image||'')}" alt=""
onerror="this.style.display='none'">
<div>
<b>${esc(p.title)}</b>
<p>${money(p.price)} each</p>
<div class="qty">
<button data-qty="${id}" data-delta="-1">−</button>
${q}
<button data-qty="${id}" data-delta="1">+</button>
</div>
</div>
<b>${money(p.price*Number(q))}</b>
</div>`;
}).join(''):`
<div class="empty">
<h3>Your bag is waiting</h3>
<p>Add something lovely from the sale.</p>
</div>`;
$('checkoutOpen').disabled=!count;
$('adminCount').textContent=products.length;
}
document.addEventListener('click',e=>{
let add=e.target.closest('[data-add]');
if(add){
let id=add.dataset.add;
cart[id]=(Number(cart[id])||0)+1;
save();
renderCart();
notify('Added to cart');
return;
}
let qty=e.target.closest('[data-qty]');
if(qty){
let id=qty.dataset.qty;
cart[id]=(Number(cart[id])||0)+Number(qty.dataset.delta);
if(cart[id]<=0)delete cart[id];
save();
renderCart();
return;
}
let fav=e.target.closest('[data-fav]');
if(fav){
fav.classList.toggle('liked');
fav.textContent=fav.classList.contains('liked')?'♥':'♡';
return;
}
let closeButton=e.target.closest('[data-close]');
if(closeButton)close(closeButton.dataset.close);
if(e.target.classList.contains('overlay'))close(e.target.id);
});
$('search').addEventListener('input',e=>{
query=e.target.value.trim().toLowerCase();
render();
});
$('clear').addEventListener('click',()=>{
$('search').value='';
query='';
render();
});
$('categories').addEventListener('click',e=>{
let b=e.target.closest('[data-cat]');
if(!b)return;
category=b.dataset.cat;
document.querySelectorAll('[data-cat]').forEach(x=>
x.classList.toggle('active',x===b)
);
render();
});
$('sort').addEventListener('change',render);
$('reset').addEventListener('click',()=>{
category='All';
query='';
$('search').value='';
document.querySelectorAll('[data-cat]').forEach(x=>
x.classList.toggle('active',x.dataset.cat==='All')
);
render();
});
$('cartOpen').addEventListener('click',()=>{
renderCart();
open('cartOverlay');
});
$('checkoutOpen').addEventListener('click',()=>{
if(!$('count').textContent||$('count').textContent==='0')return;
close('cartOverlay');
open('checkoutOverlay');
});
$('checkoutForm').addEventListener('submit',e=>{
e.preventDefault();
let d=new FormData(e.currentTarget);
let lines=Object.entries(cart).map(([id,q])=>{
let p=products.find(x=>String(x.id)===id);
return p&&q>0?`${p.title} × ${q}`:'';
}).filter(Boolean).join(', ');
$('checkoutResult').hidden=false;
$('checkoutResult').innerHTML=`
<div class="notice">
<b>Order preview — not a real order</b><br>
Name: ${esc(d.get('name'))}<br>
Mobile: ${esc(d.get('phone'))}<br>
Address: ${esc(d.get('address'))}<br>
Items: ${esc(lines)}<br>
Total: ${$('subtotal').textContent}<br><br>
Cash on Delivery is unavailable in this demo.
No order was submitted and no payment was taken.
</div>`;
});
$('adminOpen').addEventListener('click',()=>{
$('adminTools').hidden=true;
$('adminForm').hidden=false;
open('adminOverlay');
});
$('adminForm').addEventListener('submit',e=>{
e.preventDefault();
if(new FormData(e.currentTarget).get('pin')!=='2468'){
notify('Incorrect demo PIN');
return;
}
e.currentTarget.hidden=true;
$('adminTools').hidden=false;
$('adminCount').textContent=products.length;
});
$('addForm').addEventListener('submit',e=>{
e.preventDefault();
let d=new FormData(e.currentTarget);
let price=Number(d.get('price'));
let title=String(d.get('title')||'').trim();
if(!title||!Number.isFinite(price)||price<=0){
notify('Enter a valid product name and price');
return;
}
products.unshift({
id:Date.now(),
title,
category:d.get('category'),
price,
oldPrice:price*2,
tag:'NEW ARRIVAL',
image:String(d.get('image')||'').trim()
});
save();
category='All';
document.querySelectorAll('[data-cat]').forEach(x=>
x.classList.toggle('active',x.dataset.cat==='All')
);
render();
renderCart();
$('adminCount').textContent=products.length;
e.currentTarget.reset();
notify('Product added in this browser');
});
$('resetDemo').addEventListener('click',()=>{
if(!confirm('Restore demo products and clear cart?'))return;
products=defaults.map(p=>({...p}));
cart={};
save();
render();
renderCart();
notify('Demo products restored');
});
document.addEventListener('keydown',e=>{
if(e.key==='Escape'){
document.querySelectorAll('.overlay:not([hidden])').forEach(x=>close(x.id));
}
});
$('year').textContent=new Date().getFullYear();
render();
renderCart();
})();
