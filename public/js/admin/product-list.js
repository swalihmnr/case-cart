import adminApi from "../adminApi.js";
document.querySelectorAll(".block-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const id = btn.dataset.id;
      const statusmode = btn.dataset.statusmode;
      const isBlocking = statusmode === "block";

      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to ${statusmode} this product?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isBlocking ? "#d33" : "#10B981",
        cancelButtonColor: "#3085d6",
        confirmButtonText: `Yes, ${statusmode}`,
      });

      if (confirmResult.isConfirmed) {
        window.setLoading(btn, true);
        const res = await adminApi.blockProductyAxios(id);
        window.setLoading(btn, false);
        // Backend returns { success: "Message string", status: boolean }
        if (res.data.status !== undefined) {
          const newBlockedStatus = res.data.status;

          // Update the UI dynamically
          const actionBtn = document.getElementById(`product-block-btn-${id}`);
          if (actionBtn) {
            actionBtn.dataset.statusmode = newBlockedStatus ? "unblock" : "block";
            actionBtn.innerHTML = `
              <i class="fas ${newBlockedStatus ? 'fa-check' : 'fa-ban'} mr-1"></i>
              ${newBlockedStatus ? 'unblock' : 'Block'}
            `;
          }

          Toastify({
            text: res.data.success || `Product ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`,
            duration: 3000,
            gravity: "bottom",
            position: "center",
            style: {
              background: newBlockedStatus ? "linear-gradient(to right, #ff416c, #ff4b2b)" : "linear-gradient(to right, #667eea, #764ba2)",
              borderRadius: "10px",
            }
          }).showToast();
        }
      }
    } catch (error) {
      window.setLoading(btn, false);
      console.error(error);
      Toastify({
        text: "An error occurred while updating product status",
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
