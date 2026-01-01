// ================= CONFIG =================
const CART_KEY = "hhh_cart";
const PRODUCTS_KEY = "hhh_products_cache";
const WHATSAPP_NUMBER = "919021278856";

// 🔥 BACKEND (RENDER)
const API_BASE = "https://hhh-trader-backend.onrender.com";
const API_URL = `${API_BASE}/api/products/`;

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
  initRevealObserver();
  initCartUI();
  loadProducts();   // 🔥 cached + backend safe
  renderCart();
});

// ================= HERO REVEAL =================
function initRevealObserver(){
  const items = document.querySelectorAll(".reveal");
  if(!items.length) return;

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },{threshold:.2});

  items.forEach(el=>observer.observe(el));
}

// ================= PRODUCT CACHE =================
function saveProductsCache(products){
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProductsCache(){
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

// ================= RENDER PRODUCTS =================
function renderProducts(products){
  const grid = document.getElementById("masonry");
  if(!grid) return;

  grid.innerHTML = "";

  products.forEach(p => {
    grid.insertAdjacentHTML("beforeend", `
      <article class="card"
        data-id="${p.id}"
        data-title="${p.title}"
        data-price="${p.price}">

        <div class="card-media">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </div>

        <div class="card-body">
          <h3>${p.title}</h3>
          <p class="muted">${p.description || "No description available"}</p>

          <div class="meta">
            <span class="price">₹${p.price}</span>
            <div class="actions-inline">
              <button class="btn tiny view">View</button>
              <button class="btn tiny add">Add</button>
            </div>
          </div>

          <button class="btn wa-product">Send on WhatsApp</button>
        </div>
      </article>
    `);
  });

  bindProductEvents();
}

// ================= LOAD PRODUCTS (SAFE) =================
async function loadProducts() {

  // ✅ 1. pehle cached products dikhao
  const cached = getProductsCache();
  if (cached.length) {
    renderProducts(cached);
  }

  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("API down");

    const products = await res.json();

    // ✅ 2. backend success → update UI + cache
    renderProducts(products);
    saveProductsCache(products);

  } catch (err) {
    console.warn("⚠ Backend down — cached products visible");
    // ❌ kuch bhi clear nahi hoga
  }
}

// ================= PRODUCT EVENTS =================
function bindProductEvents(){
  document.querySelectorAll(".card").forEach(card=>{

    card.querySelector(".add").onclick = ()=>{
      addToCart({
        id: card.dataset.id,
        title: card.dataset.title,
        price: Number(card.dataset.price),
        img: card.querySelector("img").src,
        qty: 1
      });
    };

    card.querySelector(".view").onclick = ()=>{
      openImage(card.querySelector("img").src);
    };

    card.querySelector(".wa-product").onclick = ()=>{
      const msg = `Hello, I want ${card.dataset.title}`;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
      );
    };
  });
}

// ================= IMAGE MODAL =================
function openImage(src){
  document.getElementById("img-zoom").src = src;
  document.getElementById("img-modal").classList.add("show");
}

document.getElementById("img-close")?.addEventListener("click",()=>{
  document.getElementById("img-modal").classList.remove("show");
});

// ================= CART =================
function getCart(){
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item){
  const cart = getCart();
  const found = cart.find(i=>i.id===item.id);
  found ? found.qty++ : cart.push(item);
  saveCart(cart);
  renderCart();
}

function renderCart(){
  const cart = getCart();
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  const count = document.getElementById("cart-count");

  if(!box) return;

  let total = 0;
  box.innerHTML = "";

  cart.forEach((i, index)=>{
    total += i.price * i.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${i.img}">
        <div class="cart-info">
          <h4>${i.title}</h4>
          <span>₹${i.price}</span>

          <div class="qty-controls">
            <button onclick="decreaseQty(${index})">−</button>
            <span>${i.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>

          <button class="remove-item" onclick="removeItem(${index})">
            Remove
          </button>
        </div>
      </div>
    `;
  });

  totalBox.textContent = total;
  count.textContent = cart.reduce((s,i)=>s+i.qty,0);
}

// ================= CART SIDEBAR =================
function initCartUI(){
  const toggle = document.getElementById("cart-toggle");
  const sidebar = document.getElementById("cart-sidebar");
  const close = document.getElementById("cart-close");
  const overlay = document.getElementById("overlay");

  if(!toggle) return;

  toggle.onclick = ()=>{
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow="hidden";
  };

  function closeCart(){
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow="";
  }

  close.onclick = closeCart;
  overlay.onclick = closeCart;
}

// ================= CART HELPERS =================
function increaseQty(index){
  const cart = getCart();
  cart[index].qty++;
  saveCart(cart);
  renderCart();
}

function decreaseQty(index){
  const cart = getCart();
  cart[index].qty--;
  if(cart[index].qty <= 0) cart.splice(index,1);
  saveCart(cart);
  renderCart();
}

function removeItem(index){
  if(!confirm("Remove this item?")) return;
  const cart = getCart();
  cart.splice(index,1);
  saveCart(cart);
  renderCart();
}

// ================= ORDER WHATSAPP =================
function orderWhatsApp(){
  const cart = getCart();
  if(!cart.length) return alert("Cart empty");

  let msg = `🛍️ *HHH Traders*%0A%0A`;
  cart.forEach(i=>{
    msg += `• ${i.title} (${i.qty} × ₹${i.price})%0A`;
  });

  msg += `%0A*Total:* ₹${cart.reduce((s,i)=>s+i.qty*i.price,0)}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
}

// ================= MOBILE NAV =================
const burger = document.getElementById("hamburger");
const nav = document.getElementById("mainnav");

if(burger && nav){
  burger.onclick = ()=>{
    nav.classList.toggle("open");
    document.body.style.overflow =
      nav.classList.contains("open") ? "hidden" : "";
  };
}
