const API_BASE = "https://hhh-trader-backend.onrender.com";
const API_URL = `${API_BASE}/api/products/`;

const WHATSAPP_NUMBER = "919021278856";

const CART_KEY = "hhh_cart";


// ================= HTML SAFETY =================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ================= GET PRODUCT ID =================

function getProductId() {

  const params = new URLSearchParams(
    window.location.search
  );

  return params.get("id");

}


// ================= LOAD PRODUCT =================

async function loadProduct() {

  const container =
    document.getElementById("product-detail");

  const productId = getProductId();


  if (!productId) {

    renderProductError(
      "Product not found."
    );

    return;

  }


  try {

    const response = await fetch(
      API_URL,
      {
        cache: "no-store"
      }
    );


    if (!response.ok) {

      throw new Error(
        `API error: ${response.status}`
      );

    }


    const products =
      await response.json();


    if (!Array.isArray(products)) {

      throw new Error(
        "Invalid API response"
      );

    }


    const product =
      products.find(
        item => String(item.id) === String(productId)
      );


    if (!product) {

      renderProductError(
        "This product is no longer available."
      );

      return;

    }


    renderProduct(product);

  } catch (error) {

    console.error(
      "Product detail error:",
      error
    );


    renderProductError(
      "Unable to load this product."
    );

  }

}


// ================= RENDER PRODUCT =================

function renderProduct(product) {

  const container =
    document.getElementById("product-detail");


  const title =
    escapeHTML(
      product.title || "Untitled Product"
    );


  const description =
    escapeHTML(
      product.description ||
      "No description available."
    );


  const category =
    escapeHTML(
      product.category ||
      "Uncategorized"
    );


  const price =
    Number(product.price) || 0;


  const image =
    product.image || "assets/hero.jpg";


  document.title =
    `${product.title || "Product"} | HHH Traders`;


  container.innerHTML = `

    <div class="product-detail-grid">

      <div class="product-detail-image">

        <img
          src="${image}"
          alt="${title}"
          onerror="this.src='assets/hero.jpg'"
        >

      </div>


      <div class="product-detail-info">

        <span class="product-category">
          ${category}
        </span>


        <h1>
          ${title}
        </h1>


        <div class="product-detail-price">
          ₹${price}
        </div>


        <div class="product-detail-divider"></div>


        <p class="product-detail-description">
          ${description}
        </p>


        <div class="product-detail-actions">

          <button
            id="detail-add-cart"
            class="btn"
            type="button"
          >
            Add to Cart
          </button>


          <button
            id="detail-whatsapp"
            class="btn ghost"
            type="button"
          >
            Enquire on WhatsApp
          </button>

        </div>


        <a
          href="index.html#products"
          class="back-to-shop"
        >
          ← Back to Collection
        </a>

      </div>

    </div>

  `;


  document
    .getElementById("detail-add-cart")
    ?.addEventListener(
      "click",
      () => {

        addProductToCart(product);

      }
    );


  document
    .getElementById("detail-whatsapp")
    ?.addEventListener(
      "click",
      () => {

        const message =
          `Hello HHH Traders 👋\n\n` +
          `I am interested in:\n` +
          `${product.title}\n\n` +
          `Price: ₹${price}\n` +
          `Product ID: ${product.id}`;

        const url =
          `https://wa.me/${WHATSAPP_NUMBER}` +
          `?text=${encodeURIComponent(message)}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );

}


// ================= PRODUCT ERROR =================

function renderProductError(message) {

  const container =
    document.getElementById("product-detail");


  container.innerHTML = `

    <div class="catalog-state error-state">

      <div class="state-icon">
        ⚠️
      </div>

      <h3>
        ${escapeHTML(message)}
      </h3>

      <p>
        Please return to the collection.
      </p>

      <a
        href="index.html#products"
        class="btn"
      >
        Back to Collection
      </a>

    </div>

  `;

}


// ================= CART =================

function getCart() {

  try {

    const cart =
      JSON.parse(
        localStorage.getItem(CART_KEY)
      );

    return Array.isArray(cart)
      ? cart
      : [];

  } catch {

    return [];

  }

}


function saveCart(cart) {

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

}


// ================= ADD TO CART =================

function addProductToCart(product) {

  const cart = getCart();


  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    existing.qty += 1;

  } else {

    cart.push({

      id: product.id,

      title: product.title,

      price: Number(product.price) || 0,

      img: product.image || "",

      qty: 1

    });

  }


  saveCart(cart);

  renderCart();

  alert("Product added to cart 🛒");

}


// ================= RENDER CART =================

function renderCart() {

  const cart = getCart();

  const box =
    document.getElementById("cart-items");

  const totalBox =
    document.getElementById("cart-total");

  const count =
    document.getElementById("cart-count");


  if (!box) return;


  let total = 0;


  box.innerHTML = "";


  cart.forEach(
    (item, index) => {

      total +=
        Number(item.price) *
        Number(item.qty);


      box.innerHTML += `

        <div class="cart-item">

          <img
            src="${item.img || "assets/hero.jpg"}"
            alt="${escapeHTML(item.title)}"
          >

          <div class="cart-info">

            <h4>
              ${escapeHTML(item.title)}
            </h4>

            <span>
              ₹${Number(item.price)}
            </span>

            <div class="qty-controls">

              <button
                onclick="decreaseQty(${index})"
              >
                −
              </button>

              <span>
                ${item.qty}
              </span>

              <button
                onclick="increaseQty(${index})"
              >
                +
              </button>

            </div>

            <button
              class="remove-item"
              onclick="removeItem(${index})"
            >
              Remove
            </button>

          </div>

        </div>

      `;

    }
  );


  if (totalBox) {

    totalBox.textContent =
      total;

  }


  if (count) {

    count.textContent =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.qty),
        0
      );

  }

}


// ================= CART QUANTITY =================

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


function removeItem(index) {

  const cart = getCart();

  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart(cart);

  renderCart();

}


// ================= CART UI =================

function initCartUI() {

  const toggle =
    document.getElementById("cart-toggle");

  const sidebar =
    document.getElementById("cart-sidebar");

  const close =
    document.getElementById("cart-close");

  const overlay =
    document.getElementById("overlay");


  if (!toggle || !sidebar) return;


  toggle.addEventListener(
    "click",
    () => {

      sidebar.classList.add("open");

      overlay?.classList.add("show");

      document.body.style.overflow =
        "hidden";

    }
  );


  function closeCart() {

    sidebar.classList.remove("open");

    overlay?.classList.remove("show");

    document.body.style.overflow =
      "";

  }


  close?.addEventListener(
    "click",
    closeCart
  );


  overlay?.addEventListener(
    "click",
    closeCart
  );

}


// ================= WHATSAPP ORDER =================

function orderWhatsApp() {

  const cart = getCart();


  if (!cart.length) {

    alert("Cart is empty.");

    return;

  }


  let message =
    `🛍️ HHH Traders\n\n`;


  cart.forEach(item => {

    message +=
      `• ${item.title} ` +
      `(${item.qty} × ₹${item.price})\n`;

  });


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.qty) *
        Number(item.price),
      0
    );


  message +=
    `\nTotal: ₹${total}`;


  const url =
    `https://wa.me/${WHATSAPP_NUMBER}` +
    `?text=${encodeURIComponent(message)}`;


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


// ================= CLEAR CART =================

function clearCart() {

  if (
    !confirm(
      "Are you sure you want to clear the cart?"
    )
  ) {

    return;

  }


  localStorage.removeItem(
    CART_KEY
  );

  renderCart();

}


// ================= MOBILE NAV =================

function initMobileNav() {

  const burger =
    document.getElementById("hamburger");

  const nav =
    document.getElementById("mainnav");


  if (!burger || !nav) return;


  burger.addEventListener(
    "click",
    () => {

      const isOpen =
        nav.classList.toggle("open");

      burger.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    }
  );

}


// ================= INIT =================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProduct();

    initCartUI();

    initMobileNav();

    renderCart();

    const year =
      document.getElementById("year");

    if (year) {

      year.textContent =
        new Date().getFullYear();

    }

  }
);