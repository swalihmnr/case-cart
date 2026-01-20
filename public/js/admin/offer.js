
import api from "../adminApi.js";
async function deleteOffer(offerId) {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This offer will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#7c3aed",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel"
  });

  // If user clicks Cancel
  if (!confirm.isConfirmed) return;

  try {
    const res = await api.deleteOfferAxios(offerId);
    console.log(res)
    if (res.data.success) {
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: res.data.message || "Offer deleted successfully",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        location.href = "/admin/offers";
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: res.data.message || "Something went wrong"
      });
    }
  } catch (err) {
    console.error("Delete failed:", err);

    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Could not delete the offer. Try again later."
    });
  }
}

window.deleteOffer=deleteOffer

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search-offers");
  let currentFilter =
    new URLSearchParams(window.location.search).get("filter") || "all";

  console.log("Initial filter:", currentFilter);

  // Update filter when clicking tabs
  document.querySelectorAll("#filter-tabs a").forEach(link => {
    link.addEventListener("click", () => {
      currentFilter = link.dataset.filter;
      console.log("Filter changed to:", currentFilter);
    });
  });

  if (!input) return;

  let timer;

  input.addEventListener("input", () => {
    console.log("Typing...");
    clearTimeout(timer);

    timer = setTimeout(() => {
      const search = input.value.trim();

      const url = `/admin/offers?page=1&search=${encodeURIComponent(search)}&filter=${currentFilter}`;
      console.log("Redirecting to:", url);

      window.location.href = url;
    }, 500);
  });
});
