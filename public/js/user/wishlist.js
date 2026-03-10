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
        }
      }).showToast();

      // Remove item from DOM
      const button = document.querySelector(`button[onclick="remWishlist('${id}')"]`);
      if (button) {
        const card = button.closest(".bg-white.rounded-lg.shadow-sm.overflow-hidden");
        if (card) {
          card.classList.add("fade-out");
          setTimeout(() => {
            card.remove();

            // Check if wishlist is now empty
            const container = document.querySelector(".grid.grid-cols-1.md-grid-cols-2.xl-grid-cols-3.gap-6");
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
      updateWishlistCount(-1);
    } else {
      Toastify({
        text: res.data.message || "Something went wrong",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          borderRadius: "10px",
        }
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
      }
    }).showToast();
    console.log(error.response);
  }
};

function updateWishlistCount(change) {
  const desktopBadge = document.getElementById("wishlist-count-desktop");
  const mobileBadge = document.getElementById("wishlist-count-mobile");
  const dropdownBadge = document.getElementById("wishlist-count-dropdown");

  const badges = [desktopBadge, mobileBadge, dropdownBadge];

  badges.forEach((badge) => {
    if (badge) {
      let currentCount = parseInt(badge.textContent) || 0;
      let newCount = currentCount + change;
      if (newCount < 0) newCount = 0;

      badge.textContent = newCount;

      if (newCount > 0) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  });
}
window.remWishlist = remWishlist;
