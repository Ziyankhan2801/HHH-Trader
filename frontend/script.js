// ================= CONFIG =================
const CART_KEY = "hhh_cart";
const WHATSAPP_NUMBER = "919021278856";

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
  initRevealObserver();
  initCartUI();
  initProducts();
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

// ================= PRODUCTS =================
function initProducts(){
  document.querySelectorAll(".card").forEach(card=>{
    // ADD TO CART
    card.querySelector(".add")?.addEventListener("click",()=>{
      addToCart({
        id: card.dataset.id,
        title: card.dataset.title,
        price: Number(card.dataset.price),
        img: card.querySelector("img").src,
        qty: 1
      });
    });

    // IMAGE ZOOM
    card.querySelector(".view")?.addEventListener("click",()=>{
      openImage(card.querySelector("img").src);
    });

    // PRODUCT WHATSAPP
    card.querySelector(".wa-product")?.addEventListener("click",()=>{
      const msg = `Hello, I want ${card.dataset.title}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
    });
  });
}

// ================= IMAGE MODAL =================
function openImage(src){
  const modal = document.getElementById("img-modal");
  document.getElementById("img-zoom").src = src;
  modal.classList.add("show");
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

  toggle.addEventListener("click",()=>{
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow="hidden";
  });

  function closeCart(){
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow="";
  }

  close.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
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


function increaseQty(index){
  const cart = getCart();
  cart[index].qty++;
  saveCart(cart);
  renderCart();
}

function decreaseQty(index){
  const cart = getCart();
  cart[index].qty--;

  if(cart[index].qty <= 0){
    cart.splice(index,1);
  }

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


function clearCart(){
  if(!confirm("Clear all items from cart?")) return;
  localStorage.removeItem(CART_KEY);
  renderCart();
}



const burger = document.getElementById("hamburger");
const nav = document.getElementById("mainnav");

if(burger && nav){
  burger.onclick = ()=>{
    nav.classList.toggle("open");
    document.body.style.overflow = nav.classList.contains("open") ? "hidden" : "";
  };
}



// ================= API CONFIG =================
const API_BASE = "https://hhh-trader-backend.onrender.com";
const API_URL = `${API_BASE}/api/products/`;

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const grid = document.getElementById("masonry");
    grid.innerHTML = ""; // Clear the hardcoded static products

    data.forEach(p => {
      if (!p.is_active) return;

      grid.innerHTML += `
        <article class="card" 
          data-id="${p.id}" 
          data-title="${p.title}" 
          data-price="${p.price}">
          
          <div class="card-media">
            <img src="${p.image}" alt="${p.title}">
          </div>
          <div class="card-body">
            <h3>${p.title}</h3>
            <p class="muted">${p.description || ""}</p>
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
      `;
    });

    // VERY IMPORTANT: This makes the buttons work after loading from API
    bindProductEvents(); 

  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// ================= EVENTS =================
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
        `https://wa.me/919021278856?text=${encodeURIComponent(msg)}`
      );
    };
  });
}

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", ()=>{
  loadProducts();
  initCartUI();
  renderCart();
});





fetch(`${API_BASE}/api/products/`)
  .then(res => res.json())
  .then(data => {
    console.log(data);   // pehle sirf check
  })
  .catch(err => console.error(err));
