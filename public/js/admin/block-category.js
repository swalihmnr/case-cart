import adminApi from "../adminApi.js";
document.querySelectorAll(".block-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const id = btn.dataset.id;
      const statusmode = btn.dataset.statusmode;
      const isBlocking = statusmode === "block";

      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to ${statusmode} this category?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isBlocking ? "#d33" : "#10B981",
        cancelButtonColor: "#3085d6",
        confirmButtonText: `Yes, ${statusmode}`,
      });

      if (confirmResult.isConfirmed) {
        window.setLoading(btn, true);
        const res = await adminApi.blockCategoryAxios(id);
        window.setLoading(btn, false);
        // Backend returns { success: "Message string", status: isActive boolean }
        // NEW PATTERN: res.data.status is isActive.
        // If isActive is true, it means it's UNBLOCKED.
        if (res.data.status !== undefined) {
          const isCategoryActive = res.data.status;

          // Update the UI dynamically
          const actionBtn = document.getElementById(`category-block-btn-${id}`);
          if (actionBtn) {
            actionBtn.dataset.statusmode = isCategoryActive ? "block" : "unblock";
            actionBtn.innerHTML = `
              <i class="fas ${isCategoryActive ? 'fa-ban' : 'fa-check'} mr-1"></i>
              ${isCategoryActive ? 'Block' : 'Unblock'}
            `;
          }

          Toastify({
            text: res.data.success || `Category ${isCategoryActive ? 'unblocked' : 'blocked'} successfully`,
            duration: 3000,
            gravity: "bottom",
            position: "center",
            style: {
              background: isCategoryActive ? "linear-gradient(to right, #667eea, #764ba2)" : "linear-gradient(to right, #ff416c, #ff4b2b)",
              borderRadius: "10px",
            }
          }).showToast();
        }
      }
    } catch (error) {
      window.setLoading(btn, false);
      console.error(error);
      Toastify({
        text: "An error occurred while updating category status",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          borderRadius: "10px",
        }
      }).showToast();
    }
  });
});
