import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

async function addToCart(productId, variantId) {
  console.log(productId, variantId);

  let loaderTimer;
  try {
    loaderTimer = setTimeout(() => {
      showGlobalLoading();
    }, 300);
    const res = await api.addToCartAxios(productId, variantId);
    clearTimeout(loaderTimer); // cancel loader if API is fast
    if (res.data.success) {
      // Update cart count in header
      updateCartCount(res.data.cartCount);

      // If we are on wishlist page, update wishlist count and remove card
      const isWishlistPage = window.location.pathname.includes("/wishlist");
      if (isWishlistPage) {
        const wishlistBadge = document.getElementById("wishlist-count-badge");
        if (wishlistBadge) {
          const currentCount = parseInt(wishlistBadge.innerText) || 0;
          const newCount = Math.max(0, currentCount - 1);
          wishlistBadge.innerText = newCount;
          if (newCount === 0) wishlistBadge.classList.add("hidden");
        }

        const wishlistBtn = document.querySelector(
          `button[onclick*="addToCart('${productId}', '${variantId}')"]`,
        );
        const card = wishlistBtn?.closest("[data-wishlist-card], .bg-obsidian-light, .group");
        if (card) {
          card.style.transition = "all 0.3s ease";
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            card.remove();

            const container = document.querySelector(".grid.grid-cols-1");
            const remainingCards = container ? container.querySelectorAll("[data-wishlist-card]") : [];
            if (container && remainingCards.length === 0) {
              container.innerHTML = `
                <div class="col-span-full py-16 text-center">
                  <div class="w-16 h-16 border border-gold-light/10 bg-gold-light/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="far fa-heart text-gold-accent text-xl"></i>
                  </div>
                  <h3 class="font-display text-2xl font-light text-gold-light mb-2">Your wishlist is empty</h3>
                  <p class="text-gray-400 text-xs uppercase tracking-widest mb-8 max-w-sm mx-auto leading-relaxed">
                    Looks like you haven't added anything to your wishlist yet. Add items you love to keep track of them!
                  </p>
                  <a href="/product" class="inline-flex items-center gap-2 bg-gold-light text-obsidian hover:bg-gold-accent px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold transition duration-300 shadow-md">
                    Discover Products
                    <i class="fas fa-arrow-right text-[10px]"></i>
                  </a>
                </div>
              `;
            }
          }, 300);
        }
      }

      Toastify({
        text: "Item added to cart!",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #667eea, #764ba2)",
          borderRadius: "10px",
        },
      }).showToast();
    } else {
      Toastify({
        text: res.data.message || "Something went wrong",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          borderRadius: "10px",
        },
      }).showToast();
    }
  } catch (error) {
    console.log("hiiii");
    console.log(error.response);
  } finally {
    clearTimeout(loaderTimer);
    hideGlobalLoading();
  }
}

function updateCartCount(count) {
  const cartCountDesktop = document.getElementById("cart-count-desktop");
  const cartCountMobile = document.getElementById("cart-count-mobile");

  const updateElement = (el) => {
    if (el) {
      el.innerText = count;
      if (count > 0) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  };

  updateElement(cartCountDesktop);
  updateElement(cartCountMobile);
}

async function updateQuantity(btn, itemId, change) {
  showGlobalLoading();
  try {
    const res = await api.quantityUpdateAxios(itemId, change);
    if (res.data.success) {
      // 1. Update item-level UI
      const qtyEl = document.getElementById(`qty-${itemId}`);
      const priceEl = document.getElementById(`price-${itemId}`);
      const decBtn = document.getElementById(`dec-btn-${itemId}`);
      const incBtn = document.getElementById(`inc-btn-${itemId}`);

      if (qtyEl) qtyEl.innerText = res.data.quantity;
      if (priceEl) priceEl.innerText = `₹ ${Math.round(res.data.totalAmountPerPrdct)}`;

      // 2. Update summary UI
      const subtotalEl = document.getElementById("subtotal");
      const totalEl = document.getElementById("total");
      const discountEl = document.getElementById("totalDiscount");
      const shippingEl = document.getElementById("shipping");

      if (subtotalEl) subtotalEl.textContent = `₹ ${Math.round(res.data.subtotal)}`;
      if (totalEl) totalEl.textContent = `₹ ${Math.round(res.data.finalAmount)}`;
      if (discountEl) discountEl.textContent = Math.round(res.data.totalDiscount);

      if (shippingEl) {
        if (res.data.shipping === 0) {
          shippingEl.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Free`;
          shippingEl.className =
            "font-semibold text-green-600 flex items-center gap-1";
        } else {
          shippingEl.textContent = `₹ ${res.data.shipping}`;
          shippingEl.className = "font-semibold text-gray-900"; // Adjustment for paid shipping look
        }
      }

      // 3. Handle button disabled states and messages
      const limitMsgEl = document.getElementById(`limit-msg-${itemId}`);
      const limitTextEl = limitMsgEl?.querySelector('.limit-text');
      
      if (limitMsgEl && limitTextEl) {
        if (res.data.maxType === "stock") {
          limitTextEl.innerText = "Stock limit reached";
          limitMsgEl.classList.remove('hidden');
        } else if (res.data.maxType === "limit") {
          limitTextEl.innerText = "Max 5 units allowed";
          limitMsgEl.classList.remove('hidden');
        } else {
          limitMsgEl.classList.add('hidden');
        }
      }

      if (decBtn) decBtn.disabled = res.data.isMin;
      if (incBtn) incBtn.disabled = res.data.isMax;
    } else {
      Swal.fire({
        icon: "warning",
        title: "Cart",
        text: res.data.message,
        confirmButtonColor: "#C9A84C",
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    hideGlobalLoading();
  }
}

function removeItem(itemId) {
  const itemElement = document.getElementById(`cart-item-${itemId}`);
  itemElement.classList.add("removing");

  setTimeout(() => {
    itemElement.remove();
    delete cartItems[itemId];
    updateTotals();
    showToast("Item removed from cart");
  }, 300);
}

function applyPromo() {
  const promoCode = document.getElementById("promoCode").value.toUpperCase();

  if (promoCode === "FREESHIP50") {
    showToast("Promo code applied! Free shipping activated.");
    updateTotals();
  } else if (promoCode) {
    showToast("Invalid promo code. Please try again.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}
async function removeFromCart(productId, variantId) {
  showGlobalLoading();
  try {
    const res = await api.removeFromCartAxios(productId, variantId);
    if (res.data.success) {
      Swal.fire({
        icon: "warning",
        title: "Deleting",
        text: res.data.message,
        confirmButtonColor: "#C9A84C",
      }).then((re) => {
        location.reload();
      });
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    showToast(
      error.response?.data?.message || "Failed to remove item",
      "error",
    );
  } finally {
    hideGlobalLoading();
  }
}

let proceedToCheckOut = document.querySelector(".proceedToCheckOut");
if (proceedToCheckOut) {
  let span = document.createElement("span");
  span.classList.add("spinner");
  proceedToCheckOut.addEventListener("click", () => {
    proceedToCheckOut.appendChild(span);
  });
}

// MAKE ALL FUNCTIONS GLOBAL
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.applyPromo = applyPromo;
window.showToast = showToast;

// Initialize
