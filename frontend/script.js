// ================= CONFIG =================
const CART_KEY = "hhh_cart";
const PRODUCTS_KEY = "hhh_products_cache";
const WHATSAPP_NUMBER = "919021278856";
const WISHLIST_KEY = "hhh_wishlist";

// Product catalog state
let allProducts = [];
let filteredProducts = [];
let searchDebounceTimer = null;

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

// ================= WISHLIST =================

function getWishlist() {
  try {
    const wishlist = JSON.parse(
      localStorage.getItem(WISHLIST_KEY)
    );

    return Array.isArray(wishlist) ? wishlist : [];
  } catch {
    return [];
  }
}

function saveWishlist(wishlist) {
  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist)
  );
}

function isWishlisted(productId) {
  return getWishlist().some(
    item => String(item.id) === String(productId)
  );
}

function toggleWishlist(product) {
  if (!product || product.id == null) return;

  const wishlist = getWishlist();

  const existingIndex = wishlist.findIndex(
    item => String(item.id) === String(product.id)
  );

  if (existingIndex !== -1) {
    wishlist.splice(existingIndex, 1);
  } else {
    wishlist.push({
      id: product.id,
      title: product.title || "Untitled Product",
      price: Number(product.price) || 0,
      image: product.image || "",
      category: product.category || ""
    });
  }

  saveWishlist(wishlist);
  updateWishlistButtons();

  // Wishlist count/page will be added in a later step.
}

function updateWishlistButtons() {
  document.querySelectorAll(".wishlist-toggle").forEach(button => {
    const saved = isWishlisted(button.dataset.id);

    button.classList.toggle("is-wishlisted", saved);
    button.textContent = saved ? "♥" : "♡";
    button.setAttribute(
      "aria-pressed",
      String(saved)
    );
    button.setAttribute(
      "aria-label",
      saved ? "Remove from wishlist" : "Add to wishlist"
    );
  });
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

  <button
    class="wishlist-toggle"
    type="button"
    data-id="${p.id}"
    aria-label="Add to wishlist"
    aria-pressed="false"
    title="Add to wishlist"
  >♡</button>
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
  updateWishlistButtons();
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
    searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);

  searchDebounceTimer = setTimeout(() => {
    applyProductFilters();
  }, 350);
});
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

let filterRequestId = 0;

async function applyProductFilters() {
  const searchInput = document.getElementById("product-search");
  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-products");

  const searchTerm =
    searchInput?.value.trim() || "";

  const selectedCategory =
    categorySelect?.value || "";

  const sortValue =
    sortSelect?.value || "latest";

  const requestId = ++filterRequestId;

  renderLoadingState();

  try {
    const params = new URLSearchParams();

    if (searchTerm) {
      params.set("search", searchTerm);
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    params.set("sort", sortValue);

    const url = `${API_URL}?${params.toString()}`;

    const res = await fetch(url, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const products = await res.json();

    if (!Array.isArray(products)) {
      throw new Error("Invalid API response");
    }

    // Ignore older request if user typed quickly
    if (requestId !== filterRequestId) {
      return;
    }

    filteredProducts = products;

    updateProductCount();

    renderProducts(filteredProducts);

  
  } catch (err) {
    console.error("Filter API error:", err);

    // Ignore older requests
    if (requestId !== filterRequestId) {
      return;
    }

    // Use loaded products if available
    if (allProducts.length > 0) {
      applyLocalFilters();
      return;
    }

    // Try cached products if the API is unavailable
    const cached = getProductsCache();

    if (cached.length > 0) {
      allProducts = cached;
      applyLocalFilters();

      showCatalogNotice(
        "Showing saved products. Live server is unavailable."
      );

      return;
    }

    // No products available and API failed
    filteredProducts = [];
    updateProductCount();
    renderErrorState();
  }
}

// ================= LOCAL FILTER FALLBACK =================

function applyLocalFilters() {
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

async function clearProductFilters() {

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

  await applyProductFilters();
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

    const wishlistButton = card.querySelector(".wishlist-toggle");

if (wishlistButton) {
  wishlistButton.addEventListener("click", () => {
    const product = allProducts.find(
      item => String(item.id) === String(card.dataset.id)
    );

    if (product) {
      toggleWishlist(product);
    }
  });
}

    card.querySelector(".add").onclick = ()=>{
      addToCart({
        id: card.dataset.id,
        title: card.dataset.title,
        price: Number(card.dataset.price),
        img: card.querySelector("img").src,
        qty: 1
      });
    };

    card.querySelector(".view").onclick = () => {
  const productId = card.dataset.id;

  if (!productId) return;

  window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
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
    const storedCart = JSON.parse(
      localStorage.getItem(CART_KEY)
    );

    if (!Array.isArray(storedCart)) {
      return [];
    }

    return storedCart
      .filter(item => {
        if (!item || typeof item !== "object") {
          return false;
        }

        if (
          item.id == null ||
          String(item.id).trim() === ""
        ) {
          return false;
        }

        const price = Number(item.price);
        const qty = Number(item.qty);

        return (
          item.price !== null &&
          item.price !== "" &&
          Number.isFinite(price) &&
          price >= 0 &&
          Number.isInteger(qty) &&
          qty > 0
        );
      })
      .map(item => ({
        id: item.id,
        title: String(item.title || "Untitled Product"),
        price: Number(item.price),
        img: typeof item.img === "string" ? item.img : "",
        qty: Number(item.qty)
      }));
  } catch (error) {
    console.error("Unable to read cart:", error);
    return [];
  }
}


function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}


function addToCart(item) {
  if (!item || typeof item !== "object") {
    alert("Invalid product. Please try again.");
    return;
  }

  if (
    item.id == null ||
    String(item.id).trim() === ""
  ) {
    alert("Product ID is missing.");
    return;
  }

  const price = Number(item.price);

  if (
    item.price === null ||
    item.price === "" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    alert("Invalid product price. Please try again.");
    return;
  }

  const requestedQty = Number(item.qty ?? 1);

  if (
    !Number.isInteger(requestedQty) ||
    requestedQty <= 0
  ) {
    alert("Invalid product quantity.");
    return;
  }

  const cart = getCart();

  const existingItem = cart.find(
    product => String(product.id) === String(item.id)
  );

  if (existingItem) {
    existingItem.qty += requestedQty;
  } else {
    cart.push({
      id: item.id,
      title: String(item.title || "Untitled Product"),
      price,
      img: typeof item.img === "string" ? item.img : "",
      qty: requestedQty
    });
  }

  try {
    saveCart(cart);
    renderCart();
  } catch (error) {
    console.error("Unable to save cart:", error);
    alert("Cart is not saved. Please try again.");
  }
}



function renderCart() {
  const cart = getCart();

  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  const count = document.getElementById("cart-count");

  if (!box) return;

  box.replaceChildren();

  let total = 0;
  let totalCount = 0;

  cart.forEach((item, index) => {
    const price = Number(item.price);
    const qty = Number(item.qty);

    // Defensive check: only render valid cart items.
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      return;
    }

    total += price * qty;
    totalCount += qty;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    const image = document.createElement("img");

    // Allow secure remote images or local relative image paths.
    const imageURL = typeof item.img === "string"
      ? item.img.trim()
      : "";

    if (
      imageURL.startsWith("https://") ||
      imageURL.startsWith("assets/") ||
      imageURL.startsWith("./assets/")
    ) {
      image.src = imageURL;
    } else {
      image.src = "assets/hero.jpg";
    }

    image.alt = String(item.title || "Product");
    image.loading = "lazy";

    image.addEventListener("error", () => {
      if (!image.dataset.fallbackApplied) {
        image.dataset.fallbackApplied = "true";
        image.src = "assets/hero.jpg";
      }
    });

    const info = document.createElement("div");
    info.className = "cart-info";

    const title = document.createElement("h4");
    title.textContent = String(item.title || "Untitled Product");

    const priceLabel = document.createElement("span");
    priceLabel.textContent = `₹${price}`;

    const quantityControls = document.createElement("div");
    quantityControls.className = "qty-controls";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "−";
    decreaseButton.setAttribute("aria-label", "Decrease quantity");

    decreaseButton.addEventListener("click", () => {
      decreaseQty(index);
    });

    const quantityLabel = document.createElement("span");
    quantityLabel.textContent = String(qty);

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", "Increase quantity");

    increaseButton.addEventListener("click", () => {
      increaseQty(index);
    });

    quantityControls.append(
      decreaseButton,
      quantityLabel,
      increaseButton
    );

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-item";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      removeItem(index);
    });

    info.append(
      title,
      priceLabel,
      quantityControls,
      removeButton
    );

    cartItem.append(image, info);
    box.appendChild(cartItem);
  });

  if (totalBox) {
    totalBox.textContent = String(total);
  }

  if (count) {
    count.textContent = String(totalCount);
  }
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

async function orderWhatsApp() {
  const cart = getCart();

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const button = document.querySelector(
    '#cart-sidebar .cart-footer button[onclick="orderWhatsApp()"]'
  );

  if (button && button.disabled) return;

  if (button) {
    button.disabled = true;
    button.textContent = "Verifying prices...";
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/cart/validate/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: Number(item.id),
            quantity: item.qty,
            price: item.price
          }))
        })
      }
    );

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("Invalid response from the server.");
    }

    if (!response.ok || result.valid !== true) {
      alert(
        result.error ||
        "We couldn't verify your cart. Please try again."
      );
      return;
    }

    if (!Array.isArray(result.items) || !Number.isFinite(result.total)) {
      alert("The server returned invalid cart details. Please try again.");
      return;
    }

    const verifiedItems = result.items;

    // Check that the server verified every cart item.
    if (verifiedItems.length !== cart.length) {
      alert("Cart verification was incomplete. Please try again.");
      return;
    }

    // Show current prices and require confirmation if any price changed.
    if (result.price_changed === true) {
      const changes = verifiedItems
        .filter(item => item.price_changed)
        .map(item =>
          `${item.title}: ₹${item.old_price} → ₹${item.price}`
        );

      const confirmed = window.confirm(
        "Some product prices have changed:\n\n" +
        changes.join("\n") +
        `\n\nUpdated cart total: ₹${result.total}` +
        "\n\nDo you want to continue with these prices?"
      );

      if (!confirmed) {
        alert("Checkout cancelled. Your cart has not been changed.");
        return;
      }
    }

    // Build the WhatsApp message using verified server prices.
    const lines = [
      "🛍️ HHH Traders",
      "",
      "Hello! I would like to enquire about these products:",
      ""
    ];

    verifiedItems.forEach(item => {
      lines.push(
        `• ${item.title} (${item.quantity} × ₹${item.price}) = ₹${item.subtotal}`
      );
    });

    lines.push(
      "",
      `Total: ₹${result.total}`,
      "",
      "Please confirm product availability and final order details."
    );

    const whatsappURL =
      `https://wa.me/${WHATSAPP_NUMBER}?text=` +
      encodeURIComponent(lines.join("\n"));

    window.open(whatsappURL, "_blank");

  } catch (error) {
    console.error("Cart verification failed:", error);

    alert(
      "Unable to verify current prices. Please check your internet connection and try again. No WhatsApp enquiry was opened."
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Order on WhatsApp";
    }
  }
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
