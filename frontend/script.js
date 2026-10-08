// ================= CONFIG =================
const CART_KEY = "hhh_cart";
const PRODUCTS_KEY = "hhh_products_cache";
const WHATSAPP_NUMBER = "919021278856";

// Product catalog state
let allProducts = [];
let filteredProducts = [];

// 🔥 BACKEND (RENDER)
const API_BASE = "https://hhh-trader-backend.onrender.com";
const API_URL = `${API_BASE}/api/products/`;

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
  initRevealObserver();
  initCartUI();
  initProductControls();
  loadProducts();
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
// ================= PRODUCT CACHE =================
function saveProductsCache(products) {
  if (!Array.isArray(products)) return;

  localStorage.setItem(
    PRODUCTS_KEY,
    JSON.stringify(products)
  );
}

function getProductsCache() {
  try {
    const cached = JSON.parse(
      localStorage.getItem(PRODUCTS_KEY)
    );

    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

// ================= RENDER PRODUCTS =================
function renderProducts(products) {
  const grid = document.getElementById("masonry");

  if (!grid) return;

  grid.innerHTML = "";

  if (!Array.isArray(products) || products.length === 0) {
    renderEmptyState();
    return;
  }

  products.forEach(p => {
    const title = escapeHTML(p.title || "Untitled Product");
    const description = escapeHTML(
      p.description || "No description available"
    );
    const category = escapeHTML(
      p.category || "Uncategorized"
    );

    const image = p.image || "";

    grid.insertAdjacentHTML("beforeend", `
      <article
        class="card"
        data-id="${p.id}"
        data-title="${title}"
        data-price="${Number(p.price) || 0}"
        data-category="${category}"
      >

        <div class="card-media">
          <img
            src="${image}"
            alt="${title}"
            loading="lazy"
            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23eeeeee%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666666%22 font-size=%2224%22%3ENo Image%3C/text%3E%3C/svg%3E'"
          >
        </div>

        <div class="card-body">

          <span class="product-category">
            ${category}
          </span>

          <h3>${title}</h3>

          <p class="muted">
            ${description}
          </p>

          <div class="meta">

            <span class="price">
              ₹${Number(p.price) || 0}
            </span>

            <div class="actions-inline">

              <button
                class="btn tiny view"
                type="button"
              >
                View
              </button>

              <button
                class="btn tiny add"
                type="button"
              >
                Add
              </button>

            </div>

          </div>

          <button
            class="btn wa-product"
            type="button"
          >
            Send on WhatsApp
          </button>

        </div>
      </article>
    `);
  });

  bindProductEvents();
}

// ================= HTML SAFETY =================
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ================= EMPTY STATE =================
function renderEmptyState(message = "No products found.") {
  const grid = document.getElementById("masonry");

  if (!grid) return;

  grid.innerHTML = `
    <div class="catalog-state empty-state">
      <div class="state-icon">🛍️</div>
      <h3>${escapeHTML(message)}</h3>
      <p>
        Try another search or select a different category.
      </p>

      <button
        class="btn"
        type="button"
        onclick="clearProductFilters()"
      >
        Clear Filters
      </button>
    </div>
  `;
}


// ================= LOADING STATE =================
function renderLoadingState() {
  const grid = document.getElementById("masonry");

  if (!grid) return;

  grid.innerHTML = `
    <div class="catalog-state loading-state">
      <div class="loader"></div>
      <h3>Loading products...</h3>
      <p>Please wait.</p>
    </div>
  `;
}


// ================= ERROR STATE =================
function renderErrorState() {
  const grid = document.getElementById("masonry");

  if (!grid) return;

  grid.innerHTML = `
    <div class="catalog-state error-state">
      <div class="state-icon">⚠️</div>

      <h3>Unable to load products</h3>

      <p>
        Something went wrong while loading the products.
      </p>

      <button
        class="btn"
        type="button"
        onclick="loadProducts()"
      >
        Try Again
      </button>
    </div>
  `;
}

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  renderLoadingState();

  try {
    const res = await fetch(API_URL, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const products = await res.json();

    if (!Array.isArray(products)) {
      throw new Error("Invalid API response");
    }

    // API is the source of truth
    allProducts = products;

    // Initially show everything
    filteredProducts = [...allProducts];

    // Update cache, including empty response
    saveProductsCache(allProducts);

    populateCategories();
    updateProductCount();
    renderProducts(filteredProducts);

  } catch (err) {
    console.error("Product API error:", err);

    // Only use cache when API is unavailable
    const cached = getProductsCache();

    if (cached.length) {
      allProducts = cached;
      filteredProducts = [...cached];

      populateCategories();
      updateProductCount();
      renderProducts(filteredProducts);

      showCatalogNotice(
        "Showing saved products. Live server is unavailable."
      );

      return;
    }

    allProducts = [];
    filteredProducts = [];

    renderErrorState();
    updateProductCount();
  }
}

// ================= PRODUCT CONTROLS =================
function initProductControls() {

  const searchInput =
    document.getElementById("product-search");

  const categorySelect =
    document.getElementById("category-filter");

  const sortSelect =
    document.getElementById("sort-products");

  const clearButton =
    document.getElementById("clear-filters");


  if (searchInput) {
    searchInput.addEventListener(
      "input",
      applyProductFilters
    );
  }


  if (categorySelect) {
    categorySelect.addEventListener(
      "change",
      applyProductFilters
    );
  }


  if (sortSelect) {
    sortSelect.addEventListener(
      "change",
      applyProductFilters
    );
  }


  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearProductFilters
    );
  }
}


// ================= POPULATE CATEGORIES =================
function populateCategories() {

  const select =
    document.getElementById("category-filter");

  if (!select) return;

  const categories = [
    ...new Set(
      allProducts
        .map(product => product.category)
        .filter(Boolean)
        .map(category => String(category).trim())
    )
  ].sort();

  select.innerHTML = `
    <option value="">All Categories</option>
    ${categories.map(category => `
      <option value="${escapeHTML(category)}">
        ${escapeHTML(category)}
      </option>
    `).join("")}
  `;
}


// ================= APPLY FILTERS =================
function applyProductFilters() {

  const searchInput =
    document.getElementById("product-search");

  const categorySelect =
    document.getElementById("category-filter");

  const sortSelect =
    document.getElementById("sort-products");

  const searchTerm =
    searchInput?.value.trim().toLowerCase() || "";

  const selectedCategory =
    categorySelect?.value || "";

  const sortValue =
    sortSelect?.value || "latest";


  // SEARCH + CATEGORY
  filteredProducts = allProducts.filter(product => {

    const title =
      String(product.title || "").toLowerCase();

    const description =
      String(product.description || "").toLowerCase();

    const category =
      String(product.category || "");

    const matchesSearch =
      !searchTerm ||
      title.includes(searchTerm) ||
      description.includes(searchTerm) ||
      category.toLowerCase().includes(searchTerm);

    const matchesCategory =
      !selectedCategory ||
      category === selectedCategory;

    return matchesSearch && matchesCategory;
  });


  // SORT
  switch (sortValue) {

    case "price-low":
      filteredProducts.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
      break;

    case "price-high":
      filteredProducts.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
      break;

    case "name-az":
      filteredProducts.sort(
        (a, b) =>
          String(a.title || "").localeCompare(
            String(b.title || "")
          )
      );
      break;

    case "name-za":
      filteredProducts.sort(
        (a, b) =>
          String(b.title || "").localeCompare(
            String(a.title || "")
          )
      );
      break;

    case "latest":
    default:
      filteredProducts.sort(
        (a, b) => Number(b.id) - Number(a.id)
      );
      break;
  }


  updateProductCount();

  renderProducts(filteredProducts);
}


// ================= CLEAR FILTERS =================
function clearProductFilters() {

  const searchInput =
    document.getElementById("product-search");

  const categorySelect =
    document.getElementById("category-filter");

  const sortSelect =
    document.getElementById("sort-products");

  if (searchInput) {
    searchInput.value = "";
  }

  if (categorySelect) {
    categorySelect.value = "";
  }

  if (sortSelect) {
    sortSelect.value = "latest";
  }

  filteredProducts = [...allProducts];

  updateProductCount();
  renderProducts(filteredProducts);
}


// ================= PRODUCT COUNT =================
function updateProductCount() {

  const countElement =
    document.getElementById("product-count");

  if (!countElement) return;

  countElement.textContent =
    `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`;
}


// ================= CATALOG NOTICE =================
function showCatalogNotice(message) {

  const existing =
    document.querySelector(".catalog-notice");

  if (existing) {
    existing.remove();
  }

  const grid =
    document.getElementById("masonry");

  if (!grid) return;

  const notice = document.createElement("div");

  notice.className = "catalog-notice";

  notice.textContent = message;

  grid.parentElement?.insertBefore(notice, grid);

  setTimeout(() => {
    notice.remove();
  }, 5000);
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
function getCart() {
  try {
    const cart = JSON.parse(
      localStorage.getItem(CART_KEY)
    );

    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
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
function increaseQty(index) {
  const cart = getCart();

  if (!cart[index]) return;

  cart[index].qty++;

  saveCart(cart);
  renderCart();
}


function decreaseQty(index) {
  const cart = getCart();

  if (!cart[index]) return;

  cart[index].qty--;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
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


function clearCart(){
  if(!confirm("Are you sure you want to clear the cart?")) return;
  localStorage.removeItem("hhh_cart");
  renderCart();
}


// ✅ Close mobile nav on link click
function closemenu() {
  const nav = document.getElementById("mainnav");
  const burger = document.getElementById("hamburger");

  if (nav) nav.classList.remove("open");

  // aria update (optional)
  if (burger) burger.setAttribute("aria-expanded", "false");

  // body scroll back
  document.body.style.overflow = "";
}
