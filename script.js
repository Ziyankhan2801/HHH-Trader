// =====================================================
// HHH TRADERS - FINAL CLEAN & FIXED SCRIPT
// =====================================================

/* ================= KEYS ================= */

const ADMIN_KEY = "hhh_products";
const CART_KEY  = "hhh_cart_simple";

/* ================= PRODUCT CARD ================= */

function productCardHTML(p){
  return `
  <article class="card"
    data-id="${p.id}"
    data-title="${p.title}"
    data-price="${p.price}"
    data-cat="${p.cat || ''}">

    <div class="card-media">
      <img src="${p.img}" alt="${p.title}">
    </div>

    <div class="card-body">
      <h3>${p.title}</h3>
      <p class="muted">${p.desc || ""}</p>

      <div class="meta">
        <span class="price">₹${p.price}</span>
        <div class="actions-inline">
          <button class="btn tiny view">View</button>
          <button class="btn tiny add">Add</button>
        </div>
      </div>

      <button class="btn wa-product"
        data-phone="919021278856"
        data-img="${p.img}">
        Send on WhatsApp
      </button>
    </div>
  </article>`;
}

/* ================= INDEX: LOAD ADMIN PRODUCTS ================= */

function loadAdminProducts(){
  const grid = document.getElementById("masonry");
  if(!grid) return;

  // 🔥 STEP 1: pehle sirf ADMIN cards remove karo
  grid.querySelectorAll(".card").forEach(card=>{
    const id = card.dataset.id;
    if(id && !id.startsWith("p")) card.remove(); // manual p1,p2 safe
  });

  // 🔥 STEP 2: fresh data load
  const data = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];

  data.forEach(p=>{
    grid.insertAdjacentHTML("beforeend", productCardHTML(p));
  });

  initAddButtons();
  initViewButtons();
  initProductWAButtons();
}


/* ================= ADMIN SAVE ================= */

function adminSave(){
  const id    = document.getElementById("pid").value || Date.now();
  const title = document.getElementById("a-title").value.trim();
  const price = document.getElementById("a-price").value;
  const desc  = document.getElementById("a-desc").value;
  const cat   = document.getElementById("a-cat").value;
  const file  = document.getElementById("a-img").files[0];

  if(!title || !price){
    alert("Title & Price required");
    return;
  }

  const data = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
  const old  = data.find(p=>p.id==id);

  if(file){
    const r = new FileReader();
    r.onload = ()=> commit(r.result);
    r.readAsDataURL(file);
  } else {
    commit(old?.img || "");
  }

  function commit(img){
    const obj = { id, title, price, desc, cat, img };
    const i = data.findIndex(p=>p.id==id);
    i>-1 ? data[i]=obj : data.push(obj);

    localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
    adminReset();
    adminRender();
    alert("Product saved");
  }
}

/* ================= ADMIN LIST ================= */

function adminRender(){
  const box = document.getElementById("admin-list");
  if(!box) return;

  box.innerHTML = "";
  const data = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];

  data.forEach(p=>{
    box.innerHTML += `
      <div class="item">
        <img src="${p.img}">
        <h4>${p.title}</h4>
        <small>₹${p.price}</small>
        <div class="item-actions">
          <button onclick="adminEdit(${p.id})">Edit</button>
          <button class="del" onclick="adminDelete(${p.id})">Delete</button>
        </div>
      </div>`;
  });
}

/* ================= ADMIN EDIT ================= */

function adminEdit(id){
  const p = JSON.parse(localStorage.getItem(ADMIN_KEY)).find(x=>x.id==id);
  pid.value = p.id;
  document.getElementById("a-title").value = p.title;
  document.getElementById("a-price").value = p.price;
  document.getElementById("a-desc").value  = p.desc;
  document.getElementById("a-cat").value   = p.cat;
}

/* ================= ADMIN DELETE (FIXED) ================= */

function adminDelete(id){
  if(!confirm("Delete product?")) return;

  let data = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];

  // 🔥 FORCE STRING COMPARISON
  data = data.filter(p => String(p.id) !== String(id));

  localStorage.setItem(ADMIN_KEY, JSON.stringify(data));

  adminRender();
  refreshIndexProducts(); // index bhi update
}

/* ================= RESET ================= */

function adminReset(){
  pid.value="";
  document.getElementById("a-title").value="";
  document.getElementById("a-price").value="";
  document.getElementById("a-desc").value="";
  document.getElementById("a-cat").value="";
  document.getElementById("a-img").value="";
}

/* ================= INDEX REFRESH (MANUAL SAFE) ================= */

function refreshIndexProducts(){
  const grid = document.getElementById("masonry");
  if(!grid) return;

  // 🔥 sirf ADMIN products remove honge
  grid.querySelectorAll(".card").forEach(card=>{
    const id = card.dataset.id;
    if(id && !id.startsWith("p")) card.remove();
  });

  loadAdminProducts();
}

/* ================= CART ================= */

function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCartCount(); }

function addToCart(item){
  const c = getCart();
  const f = c.find(i=>i.id===item.id);
  f ? f.qty++ : c.push(item);
  saveCart(c);
}

function renderCartCount(){
  const el = document.getElementById("cart-count");
  if(el) el.textContent = getCart().reduce((s,i)=>s+i.qty,0);
}

/* ================= BUTTONS ================= */

function initAddButtons(){
  document.querySelectorAll(".card .add").forEach(btn=>{
    btn.onclick = ()=>{
      const c = btn.closest(".card");
      addToCart({
        id:c.dataset.id,
        title:c.dataset.title,
        price:Number(c.dataset.price),
        qty:1
      });
    };
  });
}

function initViewButtons(){
  document.querySelectorAll(".view").forEach(btn=>{
    btn.onclick = ()=>{
      const img = btn.closest(".card").querySelector("img").src;
      document.getElementById("img-zoom").src = img;
      document.getElementById("img-modal").classList.add("show");
    };
  });
}

function initProductWAButtons(){
  document.querySelectorAll(".wa-product").forEach(btn=>{
    btn.onclick = ()=>{
      const card = btn.closest(".card");
      const msg = `Hello! I'm interested in ${card.dataset.title}`;
      window.open(`https://wa.me/919021278856?text=${encodeURIComponent(msg)}`);
    };
  });
}

/* ================= AUTO LOAD ================= */

document.addEventListener("DOMContentLoaded", ()=>{
  adminRender();        // admin.html
  loadAdminProducts();  // index.html
  renderCartCount();
});


/* ================= HERO REVEAL FIX ================= */

function initRevealObserver(){
  const items = document.querySelectorAll(".reveal");
  if(!items.length) return;

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el=>observer.observe(el));
}


document.addEventListener("DOMContentLoaded", ()=>{
  adminRender();
  loadAdminProducts();
  renderCartCount();
  initRevealObserver(); // 👈 HERO WAPAS
});



/* ================= DELETE ALL ADMIN PRODUCTS ================= */

function deleteAllAdminProducts(){
  if(!confirm("⚠️ Are you sure?\nAll admin-added products will be deleted.\nManual products will stay.")) {
    return;
  }

  // 🔥 admin products clear
  localStorage.removeItem(ADMIN_KEY);

  // 🔥 admin list refresh
  adminRender();

  // 🔥 index page refresh (only admin cards removed)
  const grid = document.getElementById("masonry");
  if(grid){
    grid.querySelectorAll(".card").forEach(card=>{
      const id = card.dataset.id;
      if(id && !id.startsWith("p")) card.remove();
    });
  }

  alert("✅ All admin products deleted");
}






/* ================= CART SIDEBAR FIX ================= */

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cart-sidebar");
const cartClose = document.getElementById("cart-close");
const overlay = document.getElementById("overlay");

if (cartBtn && cartSidebar) {
  cartBtn.addEventListener("click", () => {
    cartSidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  });
}

function closeCart() {
  cartSidebar.classList.remove("open");
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

if (cartClose) cartClose.addEventListener("click", closeCart);
if (overlay) overlay.addEventListener("click", closeCart);





/* ========== CART SIDEBAR FINAL FIX ========== */

document.addEventListener("DOMContentLoaded", () => {

  const cartToggle = document.getElementById("cart-toggle");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartClose = document.getElementById("cart-close");
  const overlay = document.getElementById("overlay");

  if (!cartToggle || !cartSidebar) {
    console.error("❌ Cart elements not found");
    return;
  }

  // OPEN CART
  cartToggle.addEventListener("click", () => {
    cartSidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  // CLOSE CART
  function closeCart() {
    cartSidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  cartClose.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
});
