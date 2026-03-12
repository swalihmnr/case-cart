import adminApi from "../adminApi.js";

//search script
const filterSelect = document.getElementById("statusFilter");
const input = document.getElementById("orderSearch");
let timer;

if (input) {
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const filter = filterSelect ? filterSelect.value.trim() : "all";
      let search = input.value.trim();
      window.location.href = `/admin/order?page=1&search=${search}&filter=${filter}`;
    }, 500);
  });
}

if (filterSelect) {
  filterSelect.addEventListener("change", () => {
    const filter = filterSelect.value.trim();
    const search = input ? input.value.trim() : "";
    console.log(filter);
    window.location.href = `/admin/order?page=1&search=${search}&filter=${filter}`;
  });
}

window.updateOrderStatus = async function (
  orderId,
  orderItemId,
  newStatus,
  selectElement,
) {
  const previousValue = selectElement.getAttribute("data-prev-value") || "";

  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Change order status to "${newStatus}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, update",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) {
    if (previousValue) {
      selectElement.value = previousValue;
    } else {
      selectElement.selectedIndex = 0;
    }
    return;
  }

  try {
    if (selectElement) window.setLoading(selectElement, true);
    window.showGlobalLoading();

    const res = await adminApi.updateStatus(newStatus, orderId, orderItemId);
    console.log(res);

    if (res.data.success) {
      window.hideGlobalLoading();
      selectElement.setAttribute("data-prev-value", newStatus);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Order status updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => location.reload(), 1200);
    } else {
      if (selectElement) window.setLoading(selectElement, false);
      window.hideGlobalLoading();

      if (previousValue) {
        selectElement.value = previousValue;
      } else {
        selectElement.selectedIndex = 0;
      }
      Swal.fire("Error", res.data.message || "Update failed", "error");
    }
  } catch (error) {
    if (selectElement) window.setLoading(selectElement, false);
    window.hideGlobalLoading();

    if (previousValue) {
      selectElement.value = previousValue;
    } else {
      selectElement.selectedIndex = 0;
    }
    console.error(error.message);
    Swal.fire("Error", "Something went wrong", "error");
  }
};

window.approveReturn = async function (btn, orderId, itemId) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Change Requast status to approve?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes,approve",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    if (btn) window.setLoading(btn, true);
    window.showGlobalLoading();

    const res = await adminApi.reqApproveAxios(orderId, itemId);
    console.log(res);

    if (res.data.success) {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => location.reload(), 1200);
    } else {
      if (btn) window.setLoading(btn, false);
      window.hideGlobalLoading();
      Swal.fire("Error", res.data.message || "Update failed", "error");
    }
  } catch (error) {
    if (btn) window.setLoading(btn, false);
    window.hideGlobalLoading();
    console.error(error.message);
    Swal.fire("Error", "Something went wrong", "error");
  }
};

window.rejectReturn = async function (btn, orderId, itemId) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Change Requast status to Reject?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes,Reject",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    if (btn) window.setLoading(btn, true);
    window.showGlobalLoading();

    const res = await adminApi.reqRejectAxios(orderId, itemId);
    console.log(res);

    if (res.data.success) {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: "Rejected!",
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => location.reload(), 1200);
    } else {
      if (btn) window.setLoading(btn, false);
      window.hideGlobalLoading();
      Swal.fire("Error", res.data.message || "Update failed", "error");
    }
  } catch (error) {
    if (btn) window.setLoading(btn, false);
    window.hideGlobalLoading();
    console.error(error.message);
    Swal.fire("Error", "Something went wrong", "error");
  }
};
