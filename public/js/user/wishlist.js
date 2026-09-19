import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

const remWishlist = async (id) => {
  showGlobalLoading();
  try {
    const res = await api.remWishlistAxios(id);
    if (res.data.success) {
      Toastify({
        text: "Removed from Wishlist",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #667eea, #764ba2)",
          borderRadius: "10px",
        },
      }).showToast();

      // Remove item from DOM
      const card = document.querySelector(`[data-wishlist-card="${id}"]`) ||
        document.querySelector(`button[onclick="remWishlist('${id}')"]`)?.closest(".bg-obsidian-light, .group");
      
      if (card) {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
          card.remove();

          // Check if wishlist is now empty
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

      // Update wishlist count in header
      if (res.data.wishlistCount !== undefined) {
        updateWishlistCount(res.data.wishlistCount);
      }
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
    Toastify({
      text: error.response?.data?.message || "Internal server error",
      duration: 3000,
      gravity: "bottom",
      position: "center",
      style: {
        background: "linear-gradient(to right, #ff416c, #ff4b2b)",
        borderRadius: "10px",
      },
    }).showToast();
    console.log(error.response);
  } finally {
    hideGlobalLoading();
  }
};

function updateWishlistCount(count) {
  const badge = document.getElementById("wishlist-count-badge");
  const desktopBadge = document.getElementById("wishlist-count-desktop");
  const mobileBadge = document.getElementById("wishlist-count-mobile");

  const badges = [badge, desktopBadge, mobileBadge].filter(Boolean);

  badges.forEach((b) => {
    if (count !== undefined) {
      b.textContent = count;
    }
    const finalCount = parseInt(b.textContent) || 0;
    if (finalCount > 0) {
      b.classList.remove("hidden");
    } else {
      b.classList.add("hidden");
    }
  });
}
window.remWishlist = remWishlist;
