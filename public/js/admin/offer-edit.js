import api from "../adminApi.js";

document.addEventListener("DOMContentLoaded", () => {
  const applicableOn = document.getElementById("applicableOn");
  const productBox = document.getElementById("productSelectorContainer");
  const categoryBox = document.getElementById("categorySelectorContainer");
  const form = document.querySelector("form");

  const search = document.getElementById("productSearch");
  const results = document.getElementById("productSearchResults");
  const selectedBox = document.getElementById("selectedProducts");
  const offerStatus = document.getElementById("offerStatus");
  const offerTitle = document.getElementById("offerTitle");
  const offerDesc = document.getElementById("offerDesc");
  const offerType = document.getElementById("offerType");
  const offerValue = document.getElementById("offerValue");

  const specificItem = window.SPECIFIC_ITEM;
  const ALL_PRODUCTS = window.ALL_PRODUCTS || [];

  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => window.history.back());
  }

  // =====================
  // CONFIG
  // =====================
  const MAX_PERCENT = 70;

  // =====================
  // UI TOGGLE
  // =====================
  const maxDiscountWrapper = document.getElementById("maxDiscountWrapper");

  function refreshUI() {
    productBox.classList.add("hidden");
    categoryBox.classList.add("hidden");

    if (applicableOn.value === "product") {
      productBox.classList.remove("hidden");
    }

    if (applicableOn.value === "category") {
      categoryBox.classList.remove("hidden");
    }

    // Toggle max discount field visibility
    if (offerType.value === "percentage") {
      maxDiscountWrapper?.classList.remove("hidden");
    } else {
      maxDiscountWrapper?.classList.add("hidden");
    }
  }

  applicableOn.addEventListener("change", refreshUI);
  offerType.addEventListener("change", refreshUI);
  refreshUI();

  // =====================
  // HELPERS
  // =====================
  function normalizeId(id) {
    return String(id).trim();
  }

  function addProduct(id, name) {
    const cleanId = normalizeId(id);

    const exists = [...selectedBox.children].some(
      el => normalizeId(el.dataset.productId) === cleanId
    );

    if (exists) return;

    const div = document.createElement("div");
    div.className =
      "selected-product-item flex justify-between items-center bg-white p-2 rounded shadow-sm gap-2";

    div.dataset.productId = cleanId;

    div.innerHTML = `
      <span class="text-sm truncate flex-1">${name}</span>
      <button type="button" class="remove-product text-red-500 p-1">✕</button>
    `;

    selectedBox.appendChild(div);
  }

  // =====================
  // REMOVE PRODUCT
  // =====================
  selectedBox.addEventListener("click", e => {
    const btn = e.target.closest(".remove-product");
    if (!btn) return;
    btn.closest(".selected-product-item").remove();
  });

  // =====================
  // AUTO SELECT FROM CONTEXT
  // =====================
  if (specificItem?.type === "product") {
    applicableOn.value = "product";
    refreshUI();

    const product = ALL_PRODUCTS.find(
      p => normalizeId(p._id) === normalizeId(specificItem.data._id)
    );

    if (product) {
      addProduct(product._id, product.name);
    }
  }

  if (specificItem?.type === "category") {
    applicableOn.value = "category";
    refreshUI();

    const checkbox = document.querySelector(
      `.category-checkbox[value="${specificItem.data._id}"]`
    );

    if (checkbox) checkbox.checked = true;
  }

  // =====================
  // PRODUCT SEARCH
  // =====================
  search.addEventListener("input", e => {
    const term = e.target.value.toLowerCase();

    if (term.length < 2) {
      results.classList.add("hidden");
      return;
    }

    const filtered = ALL_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(term)
    ).slice(0, 8);

    results.innerHTML = filtered.length
      ? filtered.map(p => `
          <div class="product-result-item p-2 hover:bg-gray-100 cursor-pointer"
            data-id="${p._id}"
            data-name="${p.name}">
            ${p.name}
          </div>
        `).join("")
      : `<div class="p-2 text-gray-500 text-sm">No products found</div>`;

    results.classList.remove("hidden");

    document.querySelectorAll(".product-result-item").forEach(item => {
      item.onclick = () => {
        addProduct(item.dataset.id, item.dataset.name);
        results.classList.add("hidden");
        search.value = "";
      };
    });
  });

  // =====================
  // VALIDATION ENGINE
  // =====================
  function validate(payload) {
    // Title
    if (!payload.title || payload.title.length < 3) {
      return "Title must be at least 3 characters";
    }

    // Description
    if (!payload.description || payload.description.length < 10) {
      return "Description must be at least 10 characters";
    }

    // Offer Type
    if (!payload.offerType) {
      return "Select offer type";
    }

    // Discount Rules
    if (payload.offerType === "percentage") {
      if (payload.offerValue < 1 || payload.offerValue > MAX_PERCENT) {
        return `Percentage must be between 1 and ${MAX_PERCENT}`;
      }

      if (payload.maximumDiscount && (isNaN(payload.maximumDiscount) || payload.maximumDiscount < 0)) {
        return "Maximum discount must be a positive number";
      }
    }


    // Dates
    if (!payload.startDate || !payload.endDate) {
      return "Start and End dates are required";
    }

    if (new Date(payload.endDate) <= new Date(payload.startDate)) {
      return "End date must be after start date";
    }

    // Selection Rules
    if (payload.applicableOn === "product" && (!payload.productIds || payload.productIds.length === 0)) {
      return "Select at least one product";
    }

    if (payload.applicableOn === "category" && (!payload.categoryIds || payload.categoryIds.length === 0)) {
      return "Select at least one category";
    }

    return null;
  }

  // =====================
  // SUBMIT
  // =====================
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const offerIdInput = document.getElementById("offerId");
    const currentOfferId = offerIdInput?.value;

    if (!currentOfferId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Offer ID is missing. Please refresh the page.",
      });
      return;
    }

    const payload = {
      offerId: currentOfferId,
      title: offerTitle.value.trim(),
      description: offerDesc.value.trim(),
      offerType: offerType.value,
      offerValue: Number(offerValue.value),
      maximumDiscount: Number(document.getElementById("maximumDiscount")?.value) || 0,
      applicableOn: applicableOn.value,
      startDate: startDate.value,
      endDate: endDate.value,
      status: offerStatus.value
    };

    if (payload.applicableOn === "product") {
      payload.productIds = [...selectedBox.children].map(
        el => el.dataset.productId
      );
    }

    if (payload.applicableOn === "category") {
      payload.categoryIds = [
        ...document.querySelectorAll(".category-checkbox:checked")
      ].map(cb => cb.value);
    }

    // 🔥 VALIDATE BEFORE API CALL
    const error = validate(payload);
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: error
      });
      return;
    }

    try {
      const res = await api.offerEditAxios(payload);

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Offer Updated",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          location.href = "/admin/offers";
        });
      } else {
        const error = new Error(res?.data?.message || "Update failed");
        error.status = res?.status;
        throw error;
      }
    } catch (err) {
      console.error("Update failed:", err);

      const errorMessage = err.response?.data?.message || err.message || "Could not update the offer. Try again later.";
      const status = err.response?.status || err.status;

      Swal.fire({
        icon: "error",
        title: status === 409 ? "Offer Already Exists" : "Server Error",
        text: errorMessage
      });
    }
  });
});
