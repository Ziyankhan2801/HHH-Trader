const API_BASE = "https://hhh-trader-backend.onrender.com";
const API_URL = `${API_BASE}/api/products/`;

const WHATSAPP_NUMBER = "919021278856";

const CART_KEY = "hhh_cart";
const WISHLIST_KEY = "hhh_wishlist";
const RECENTLY_VIEWED_KEY = "hhh_recently_viewed";
const MAX_RECENTLY_VIEWED = 8;


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

function isProductWishlisted(productId) {
  return getWishlist().some(
    item => String(item.id) === String(productId)
  );
}

function updateDetailWishlistButton(product) {
  const button = document.querySelector(
    ".detail-wishlist-toggle"
  );

  if (!button || !product) return;

  const saved = isProductWishlisted(product.id);

  button.textContent = saved ? "♥ Wishlisted" : "♡ Add to Wishlist";
  button.classList.toggle("is-wishlisted", saved);
  button.setAttribute("aria-pressed", String(saved));
  button.setAttribute(
    "aria-label",
    saved ? "Remove from wishlist" : "Add to wishlist"
  );
}

function toggleDetailWishlist(product) {
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

  try {
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(wishlist)
    );

    updateDetailWishlistButton(product);
  } catch (error) {
    console.error("Unable to save wishlist:", error);
    alert("Wishlist save nahi ho payi. Please try again.");
  }
}


/* ================= RECENTLY VIEWED ================= */

function getRecentlyViewed() {
  try {
    const items = JSON.parse(
      localStorage.getItem(RECENTLY_VIEWED_KEY)
    );

    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveRecentlyViewed(product) {
  if (!product || product.id == null) return;

  const recentItems = getRecentlyViewed().filter(
    item => String(item.id) !== String(product.id)
  );

  recentItems.unshift({
    id: product.id,
    title: product.title || "Untitled Product",
    price: Number(product.price) || 0,
    image: product.image || "",
    category: product.category || ""
  });

  try {
    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(
        recentItems.slice(0, MAX_RECENTLY_VIEWED)
      )
    );
  } catch (error) {
    console.error("Unable to save recently viewed products:", error);
  }
}

function renderRecentlyViewed(currentProduct) {
  const section = document.getElementById(
    "recently-viewed-section"
  );

  const grid = document.getElementById(
    "recently-viewed-grid"
  );

  if (!section || !grid) return;

  const items = getRecentlyViewed().filter(
    item => String(item.id) !== String(currentProduct.id)
  );

  if (items.length === 0) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = items.map(item => {
    const id = encodeURIComponent(String(item.id));
    const title = escapeHTML(item.title || "Untitled Product");
    const image = escapeHTML(item.image || "assets/hero.jpg");
    const price = Number(item.price) || 0;

    return `
      <article class="related-product-card recently-viewed-card">
        <a
          class="related-product-image"
          href="product.html?id=${id}"
          aria-label="View ${title}"
        >
          <img
            src="${image}"
            alt="${title}"
            loading="lazy"
          >
        </a>

        <div class="related-product-info">
          <h3>
            <a href="product.html?id=${id}">${title}</a>
          </h3>

          <p>₹${price}</p>

          <a
            class="related-product-link"
            href="product.html?id=${id}"
          >
            View Product
          </a>
        </div>
      </article>
    `;
  }).join("");

  section.hidden = false;
}



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
    renderRelatedProducts(product, products);
    saveRecentlyViewed(product);
    renderRecentlyViewed(product);

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
  const container = document.getElementById("product-detail");
  if (!container) return;

  const title = escapeHTML(product.title || "Untitled Product");
  const description = escapeHTML(
    product.description || "No description available."
  );
  const category = escapeHTML(product.category || "Uncategorized");
  const price = Number(product.price) || 0;

  // Main image + additional gallery images
  const imageList = [
    product.image,
    ...(Array.isArray(product.gallery_images)
      ? product.gallery_images.map((item) =>
          typeof item === "string" ? item : item?.image
        )
      : [])
  ].filter((url) => typeof url === "string" && url.trim() !== "");

  // Remove duplicate image URLs
  const images = [...new Set(imageList)];

  if (!images.length) {
    images.push("assets/hero.jpg");
  }

  let currentImageIndex = 0;

  document.title = `${product.title || "Product"} | HHH Traders`;

  container.innerHTML = `
    <div class="product-detail-grid">

      <div class="product-gallery">
        <button type="button" class="gallery-main-button"
                id="gallery-open-zoom" aria-label="Zoom product image">
          <img
            id="gallery-main-image"
            src="${escapeHTML(images[0])}"
            alt="${title}"
          />
          <span class="gallery-zoom-hint">Click to zoom ⤢</span>
        </button>

        <div class="product-thumbnails" id="product-thumbnails">
          ${images.map((url, index) => `
            <button type="button"
              class="product-thumbnail ${index === 0 ? "active" : ""}"
              data-image-index="${index}"
              aria-label="Show image ${index + 1}">
              <img src="${escapeHTML(url)}" alt="${title} view ${index + 1}">
            </button>
          `).join("")}
        </div>
      </div>

      <div class="product-detail-info">
        <span class="product-category">${category}</span>
        <h1>${title}</h1>
        <div class="product-detail-price">₹${price}</div>
        <div class="product-detail-divider"></div>
        <p class="product-detail-description">${description}</p>

        <div class="product-detail-actions">
          <button id="detail-add-cart" class="btn" type="button">
            Add to Cart
          </button>
          <button id="detail-whatsapp" class="btn ghost" type="button">
            Enquire on WhatsApp
          </button>

          <button
  type="button"
  class="detail-wishlist-toggle"
  aria-label="Add to wishlist"
  aria-pressed="false"
>
  ♡ Add to Wishlist
</button>
        </div>

        <a href="index.html#products" class="back-to-shop">
          ← Back to Collection
        </a>
      </div>
    </div>

    <div class="gallery-lightbox" id="gallery-lightbox" hidden>
      <button type="button" class="gallery-close" id="gallery-close"
              aria-label="Close zoom">&times;</button>
      <button type="button" class="gallery-prev" id="gallery-prev"
              aria-label="Previous image">&#10094;</button>
      <img id="gallery-zoom-image" src="${escapeHTML(images[0])}" alt="${title}">
      <button type="button" class="gallery-next" id="gallery-next"
              aria-label="Next image">&#10095;</button>
      <div class="gallery-counter" id="gallery-counter">1 / ${images.length}</div>
    </div>
  `;

  const wishlistButton = container.querySelector(
  ".detail-wishlist-toggle"
);

if (wishlistButton) {
  wishlistButton.addEventListener("click", () => {
    toggleDetailWishlist(product);
  });
}

updateDetailWishlistButton(product);

  const mainImage = document.getElementById("gallery-main-image");
  const zoomImage = document.getElementById("gallery-zoom-image");
  const lightbox = document.getElementById("gallery-lightbox");
  const counter = document.getElementById("gallery-counter");

  function showImage(index) {
    currentImageIndex = (index + images.length) % images.length;
    const url = images[currentImageIndex];

    mainImage.src = url;
    zoomImage.src = url;
    counter.textContent = `${currentImageIndex + 1} / ${images.length}`;

    document.querySelectorAll(".product-thumbnail").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === currentImageIndex);
    });
  }

  document.querySelectorAll(".product-thumbnail").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      showImage(Number(thumb.dataset.imageIndex));
    });
  });

  document.getElementById("gallery-open-zoom").addEventListener("click", () => {
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  });

  function closeZoom() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  document.getElementById("gallery-close").addEventListener("click", closeZoom);
  document.getElementById("gallery-prev").addEventListener("click", () => {
    showImage(currentImageIndex - 1);
  });
  document.getElementById("gallery-next").addEventListener("click", () => {
    showImage(currentImageIndex + 1);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeZoom();
  });

  document.addEventListener("keydown", function galleryKeyHandler(event) {
    if (lightbox.hidden) return;

    if (event.key === "Escape") {
      closeZoom();
      document.removeEventListener("keydown", galleryKeyHandler);
    } else if (event.key === "ArrowLeft") {
      showImage(currentImageIndex - 1);
    } else if (event.key === "ArrowRight") {
      showImage(currentImageIndex + 1);
    }
  });

  mainImage.addEventListener("error", () => {
    if (!mainImage.dataset.fallbackApplied) {
      mainImage.dataset.fallbackApplied = "true";
      mainImage.src = "assets/hero.jpg";
    }
  });

  document.getElementById("detail-add-cart").addEventListener("click", () => {
    addProductToCart(product);
  });

  document.getElementById("detail-whatsapp").addEventListener("click", () => {
    const message =
      `Hello HHH Traders 👋\n\n` +
      `I am interested in:\n${product.title}\n\n` +
      `Price: ₹${price}\nProduct ID: ${product.id}`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  });
}

// ================= RELATED PRODUCTS =================

function renderRelatedProducts(currentProduct, allProducts) {
  const section = document.getElementById(
    "related-products-section"
  );

  const grid = document.getElementById(
    "related-products-grid"
  );

  if (!section || !grid) return;

  const currentCategory = String(
    currentProduct.category || ""
  ).trim().toLowerCase();

  if (!currentCategory || !Array.isArray(allProducts)) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  const relatedProducts = allProducts
    .filter(product =>
      String(product.id) !== String(currentProduct.id) &&
      String(product.category || "").trim().toLowerCase() ===
        currentCategory
    )
    .slice(0, 4);

  if (relatedProducts.length === 0) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = relatedProducts.map(product => {
    const id = encodeURIComponent(String(product.id));
    const title = escapeHTML(product.title || "Untitled Product");
    const price = Number(product.price) || 0;
    const image = escapeHTML(
      product.image || "assets/hero.jpg"
    );

    return `
      <article class="related-product-card">
        <a
          class="related-product-image"
          href="product.html?id=${id}"
          aria-label="View ${title}"
        >
          <img
            src="${image}"
            alt="${title}"
            loading="lazy"
          >
        </a>

        <div class="related-product-info">
          <h3>
            <a href="product.html?id=${id}">${title}</a>
          </h3>

          <p>₹${price}</p>

          <a
            class="related-product-link"
            href="product.html?id=${id}"
          >
            View Product
          </a>
        </div>
      </article>
    `;
  }).join("");

  section.hidden = false;
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