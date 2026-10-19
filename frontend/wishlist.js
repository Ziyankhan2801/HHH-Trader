
const WISHLIST_KEY = "hhh_wishlist";

const wishlistProducts = document.getElementById("wishlist-products");
const wishlistEmpty = document.getElementById("wishlist-empty");
const wishlistStatus = document.getElementById("wishlist-status");

function getWishlistItems() {
  try {
    const items = JSON.parse(localStorage.getItem(WISHLIST_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function escapeWishlistHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function formatWishlistPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function renderWishlist() {
  const items = getWishlistItems();

  wishlistProducts.innerHTML = "";
  wishlistStatus.textContent = "";
  wishlistEmpty.hidden = items.length !== 0;
  wishlistProducts.hidden = items.length === 0;

  if (items.length === 0) {
    return;
  }

  wishlistStatus.textContent =
    `${items.length} saved ${items.length === 1 ? "product" : "products"}`;

  wishlistProducts.innerHTML = items.map(item => {
    const id = escapeWishlistHTML(item.id);
    const title = escapeWishlistHTML(item.title || "Untitled Product");
    const category = escapeWishlistHTML(item.category || "Product");
    const image = escapeWishlistHTML(item.image || "");
    const price = formatWishlistPrice(item.price);

    const imageMarkup = image
      ? `<img src="${image}" alt="${title}" loading="lazy">`
      : `<div class="wishlist-image-placeholder">No image available</div>`;

    return `
      <article class="wishlist-card" data-id="${id}">
        <a
          class="wishlist-card-image"
          href="product.html?id=${encodeURIComponent(String(item.id))}"
          aria-label="View ${title}"
        >
          ${imageMarkup}
        </a>

        <div class="wishlist-card-info">
          <p class="wishlist-card-category">${category}</p>
          <h2>${title}</h2>
          <p class="wishlist-card-price">${price}</p>

          <div class="wishlist-card-actions">
            <a
              class="wishlist-view-button"
              href="product.html?id=${encodeURIComponent(String(item.id))}"
            >
              View Product
            </a>

            <button
              type="button"
              class="wishlist-remove-button"
              data-remove-id="${id}"
              aria-label="Remove ${title} from wishlist"
            >
              Remove
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

wishlistProducts.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-remove-id]");

  if (!removeButton) return;

  const productId = removeButton.dataset.removeId;

  const updatedWishlist = getWishlistItems().filter(
    item => String(item.id) !== String(productId)
  );

  try {
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(updatedWishlist)
    );

    renderWishlist();
  } catch (error) {
    console.error("Unable to update wishlist:", error);
    wishlistStatus.textContent =
      "Unable to update your wishlist. Please try again.";
  }
});

window.addEventListener("storage", event => {
  if (event.key === WISHLIST_KEY) {
    renderWishlist();
  }
});

renderWishlist();
