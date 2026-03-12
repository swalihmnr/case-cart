window.showCancelModal = function () {
  document.getElementById("cancelModal")?.classList.remove("hidden");
};

window.closeCancelModal = function () {
  document.getElementById("cancelModal")?.classList.add("hidden");
  const reasonEl = document.getElementById("cancelReason");
  if (reasonEl) reasonEl.value = "";
};

window.submitCancellation = function () {
  const reason = document.getElementById("cancelReason")?.value || "";
  if (reason.trim()) {
    alert("Order cancellation request submitted successfully!");
    window.closeCancelModal();
    window.closeOrderDetails();
  } else {
    alert("Please provide a reason for cancellation");
  }
};

window.showOrderDetails = function (orderId) {
  document.getElementById("orderDetailsModal")?.classList.remove("hidden");
  const idEl = document.getElementById("orderIdDetail");
  if (idEl) idEl.textContent = `Order #ORD-2025-${orderId}`;
};

window.closeOrderDetails = function () {
  document.getElementById("orderDetailsModal")?.classList.add("hidden");
};

window.trackOrder = function (orderId) {
  alert(
    `Tracking information for Order #ORD-2025-${orderId}\n\nStatus: In Transit\nExpected Delivery: Dec 25, 2025`,
  );
};
