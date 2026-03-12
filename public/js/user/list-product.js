import api from "../api.js";

// ======================
// CLEAR FILTERS
// ======================
window.clearFilters = clearFilters;

function clearFilters() {
  const query = new URLSearchParams();

  query.set("page", 1);
  query.set("search", "");
  query.set("price", "all");
  query.set("sort", "");
  query.set("Categories", "");

  window.location.href = `/product?${query.toString()}`;
}

// ======================
// ELEMENTS
// ======================
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const priceRadios = document.querySelectorAll('input[name="price"]');
const categoryCheckboxes = document.querySelectorAll(".filter-checkbox");

let timer;

// ======================
// SEARCH INPUT (DEBOUNCE)
// ======================
search?.addEventListener("input", function () {
  clearTimeout(timer);

  const value = this.value.trim();

  timer = setTimeout(() => {
    if (value.length === 0) {
      clearFilters();
      return;
    }

    if (value.length < 2) return;

    applyFilters();
  }, 800); // wait 800ms after typing stops
});

// ======================
// PRICE FILTER
// ======================
priceRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    clearTimeout(timer);

    timer = setTimeout(applyFilters, 300);
  });
});

// ======================
// CATEGORY FILTER
// ======================
categoryCheckboxes.forEach((cb) => {
  cb.addEventListener("change", () => {
    clearTimeout(timer);

    timer = setTimeout(applyFilters, 300);
  });
});

// ======================
// SORT FILTER
// ======================
sort?.addEventListener("change", () => {
  clearTimeout(timer);

  timer = setTimeout(applyFilters, 200);
});

// ======================
// APPLY FILTER FUNCTION
// ======================
function applyFilters() {
  const selectedCategories = [
    ...document.querySelectorAll(".filter-checkbox:checked"),
  ].map((cb) => cb.value);

  const selectedPrice =
    document.querySelector('input[name="price"]:checked')?.value || "all";

  const query = new URLSearchParams();

  query.set("page", 1);
  query.set("search", search?.value.trim() || "");
  query.set("price", selectedPrice);
  query.set("sort", sort?.value || "");
  query.set("Categories", selectedCategories.join(","));

  window.location.href = `/product?${query.toString()}`;
}

// ======================
// ADD TO WISHLIST
// ======================
const addWishlist = async (productId, variantId) => {
  try {
    const res = await api.toggleWishlistAxios(productId, variantId);

    console.log(res);

    if (res.data.success) {
      const action = res.data.action; // 'added' or 'removed'
      const heartIcon = document.getElementById(
        `wish-icon-${productId}-${variantId}`,
      );

      if (action === "added") {
        Toastify({
          text: "Added to Wishlist",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "linear-gradient(to right, #667eea, #764ba2)",
            borderRadius: "10px",
          }
        }).showToast();

        if (heartIcon) {
          heartIcon.classList.remove("text-gray-400");
          heartIcon.classList.add("text-red-500");
        }
        if (res.data.wishlistCount !== undefined) {
          updateWishlistCount(res.data.wishlistCount);
        } else {
          updateWishlistCount(); // Fallback if count not provided
        }
      } else {
        Toastify({
          text: "Removed from Wishlist",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "linear-gradient(to right, #667eea, #764ba2)",
            borderRadius: "10px",
          }
        }).showToast();

        if (heartIcon) {
          heartIcon.classList.remove("text-red-500");
          heartIcon.classList.add("text-gray-400");
        }
        if (res.data.wishlistCount !== undefined) {
          updateWishlistCount(res.data.wishlistCount);
        } else {
          updateWishlistCount(); // Fallback if count not provided
        }
      }
    }
  } catch (error) {
    console.log(error.response);

    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 3000,
      gravity: "bottom",
      position: "center",
      style: {
        background: "linear-gradient(to right, #ff416c, #ff4b2b)",
        borderRadius: "10px",
      }
    }).showToast();
  }
};

function updateWishlistCount(count) {
  const desktopBadge = document.getElementById("wishlist-count-desktop");
  const mobileBadge = document.getElementById("wishlist-count-mobile");

  const badges = [desktopBadge, mobileBadge];

  badges.forEach((badge) => {
    if (badge) {
      if (count !== undefined) {
        badge.textContent = count;
      } else {
        // Fallback: manually increment/decrement based on current visibility if count not passed
        // This is primarily for backward compatibility if needed, but we prefer absolute counts.
        let currentCount = parseInt(badge.textContent) || 0;
        // This fallback part is tricky without knowing if we added or removed, 
        // Better to just fetch or expect absolute count.
      }

      const finalCount = parseInt(badge.textContent) || 0;
      if (finalCount > 0) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  });
}

window.addWishlist = addWishlist;
