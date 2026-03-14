import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

async function addToCart(productId, variantId) {
  showGlobalLoading();
  console.log(productId, variantId);
  try {
    const res = await api.addToCartAxios(productId, variantId);
    if (res.data.success) {
      // Update cart count in header
      updateCartCount(res.data.cartCount);

      // If we are on wishlist page, we might want to update wishlist count too
      // since adding to cart removes from wishlist in backend
      if (typeof updateWishlistCount === "function") {
        const wishlistCountEl = document.getElementById(
          "wishlist-count-desktop",
        );
        if (wishlistCountEl) {
          const currentCount = parseInt(wishlistCountEl.innerText) || 0;
          if (currentCount > 0) {
            updateWishlistCount(currentCount - 1);
          }
        }
      }

      // 2. Identify if we are on the wishlist page and remove the item from DOM
      // The backend removes it from wishlist automatically when added to cart
      const wishlistBtn = document.querySelector(
        `button[onclick*="addToCart('${productId}', '${variantId}')"]`,
      );
      const isWishlistPage = window.location.pathname.includes("/wishlist");

      if (isWishlistPage && wishlistBtn) {
        const card = wishlistBtn.closest(
          ".bg-white.rounded-lg.shadow-sm.overflow-hidden",
        );
        if (card) {
          card.classList.add("fade-out");
          setTimeout(() => {
            card.remove();

            // Update wishlist count in header (already covered by part 1 but being explicit)
            if (typeof updateWishlistCount === "function") {
              updateWishlistCount(-1);
            }

            // Check if wishlist is now empty
            const container = document.querySelector(
              ".grid.grid-cols-1.md-grid-cols-2.xl-grid-cols-3.gap-6",
            );
            if (container && container.children.length === 0) {
              container.innerHTML = `
                <div class="col-span-full py-12 text-center">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-heart-broken text-gray-400 text-2xl"></i>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                  <p class="text-gray-500 mt-1">Looks like you haven't added anything to your wishlist yet.</p>
                  <a href="/product" class="inline-block mt-4 text-purple-600 font-medium hover:text-purple-700">Explore Products →</a>
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
      if (priceEl) priceEl.innerText = `₹ ${res.data.totalAmountPerPrdct}`;

      // 2. Update summary UI
      const subtotalEl = document.getElementById("subtotal");
      const totalEl = document.getElementById("total");
      const discountEl = document.getElementById("totalDiscount");
      const shippingEl = document.getElementById("shipping");

      if (subtotalEl) subtotalEl.textContent = `₹ ${res.data.subtotal}`;
      if (totalEl) totalEl.textContent = `₹ ${res.data.finalAmount}`;
      if (discountEl) discountEl.textContent = res.data.totalDiscount;

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
      if (limitMsgEl) {
        if (res.data.maxType === "stock") {
          limitMsgEl.innerText = "Stock limit reached";
        } else if (res.data.maxType === "limit") {
          limitMsgEl.innerText = "Max 5 units allowed";
        } else {
          limitMsgEl.innerText = "";
        }
      }

      if (decBtn) decBtn.disabled = res.data.isMin;
      if (incBtn) incBtn.disabled = res.data.isMax;
    } else {
      Swal.fire({
        icon: "warning",
        title: "Cart",
        text: res.data.message,
        confirmButtonColor: "#667eea",
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
        confirmButtonColor: "#667eea",
      }).then((re) => {
        location.reload();
      });
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    showToast(error.response?.data?.message || "Failed to remove item", "error");
  } finally {
    hideGlobalLoading();
  }
}

let proceedToCheckOut = document.querySelector('.proceedToCheckOut');
if (proceedToCheckOut) {
  let span = document.createElement('span');
  span.classList.add('spinner')
  proceedToCheckOut.addEventListener('click', () => {
    proceedToCheckOut.appendChild(span)
  })
}

// MAKE ALL FUNCTIONS GLOBAL
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.applyPromo = applyPromo;
window.showToast = showToast;

// Initialize
