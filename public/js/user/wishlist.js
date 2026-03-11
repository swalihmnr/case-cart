import api from "../api.js";

const remWishlist = async (id) => {
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
      const button = document.querySelector(
        `button[onclick="remWishlist('${id}')"]`,
      );
      if (button) {
        const card = button.closest(
          ".bg-white.rounded-lg.shadow-sm.overflow-hidden",
        );
        if (card) {
          card.classList.add("fade-out");
          setTimeout(() => {
            card.remove();

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

      // Update wishlist count in header
      if (res.data.wishlistCount !== undefined) {
        updateWishlistCount(res.data.wishlistCount);
      } else {
        updateWishlistCount();
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
window.remWishlist = remWishlist;
