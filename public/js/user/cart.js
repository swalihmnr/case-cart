import api from "../api.js";

async function addToCart(productId, variantId) {
  console.log(productId, variantId);
  try {
    const res = await api.addToCartAxios(productId, variantId);
    if (res.data.success) {
      Swal.fire({
        icon: "success",
        title: "added to cart",
        text: res.data.message,
        confirmButtonColor: "#667eea",
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire({
        icon: "warning",
        text: res.data.message,
        confirmButtonColor: "#667eea",
      });
    }
  } catch (error) {
    console.log("hiiii");
    console.log(error.response);
  }
}
async function updateQuantity(btn, itemId, change) {
  try {
    const res = await api.quantityUpdateAxios(itemId, change);
    if (res.data.success) {
      document.getElementById("subtotal").textContent = res.data.subtotal;
      document.getElementById("total").textContent = res.data.subtotal;
      const cartItem = btn.closest(".cart-item");
      window.location.reload();

      const qtyEl = cartItem.querySelector(".quantity-text");
      const priceEl = cartItem.querySelector(".price-field");
      qtyEl.innerText = res.data.quantity;
      priceEl.innerText = `₹ ${res.data.totalAmountPerPrdct}`;
    } else {
      Swal.fire({
        icon: "warning",
        title: "cart",
        text: res.data.message,
        confirmButtonColor: "#667eea",
      });
    }
  } catch (error) {
    console.log(error);
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
}

// MAKE ALL FUNCTIONS GLOBAL
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.applyPromo = applyPromo;
window.showToast = showToast;

// Initialize
