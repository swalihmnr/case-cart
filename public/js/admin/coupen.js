import api from "../adminApi.js";
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search-coupon");

  if (!input) return;

  let timer;

  input.addEventListener("input", () => {
    console.log("Typing...");
    clearTimeout(timer);

    timer = setTimeout(() => {
      const search = input.value.trim();
      const url = `/admin/coupen?page=1&search=${encodeURIComponent(search)}`;
      console.log("Redirecting to:", url);

      window.location.href = url;
    }, 500);
  });
});

async function deleteCoupon(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "This coupon will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e3342f",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await api.deleteCouponAxios(id);

        if (res.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Coupon has been deleted.",
            timer: 1200,
            showConfirmButton: false,
          }).then(() => {
            window.location.reload();
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Delete failed",
        });
      }
    }
  });
}
window.deleteCoupon = deleteCoupon;
