import api from "../adminApi.js";

// ===============================
// CONFIG
// ===============================
const MAX_PERCENT = 70;

// ===============================
// CONTEXT DETECTION
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const idFromUrl = urlParams.get("id");
const itemTypeFromUrl = urlParams.get("item"); // "Product" or "Category"
const isProductContext = idFromUrl && itemTypeFromUrl === "Product";
const isCategoryContext = idFromUrl && itemTypeFromUrl === "Category";

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initOfferPage();
});

// ===============================
// INIT
// ===============================
function initOfferPage() {
  const form = document.querySelector("form");
  const applicableOn = document.getElementById("applicableOn");
  const cancelBtn = document.getElementById("cancelBtn");
  const search = document.getElementById("productSearch");

  if (!form || !applicableOn) return;

  if (isProductContext) {
    enableProductContextMode();
  } else if (isCategoryContext) {
    enableCategoryContextMode();
  } else {
    enableNormalMode();
  }

  form.addEventListener("submit", handleOfferSubmit);

  cancelBtn?.addEventListener("click", () => window.history.back());

  search?.addEventListener("input", debounce(handleProductSearch, 300));

  // Clear errors dynamically on input/change
  const fields = [
    { id: "offerTitle", err: "offerTitleErr" },
    { id: "offerDesc", err: "offerDescErr" },
    { id: "offerType", err: "offerTypeErr", event: "change" },
    { id: "offerValue", err: "offerValueErr" },
    { id: "maximumDiscountValue", err: "maximumDiscountValueErr" },
    { id: "applicableOn", err: "applicableOnErr", event: "change" },
    { id: "startDate", err: "startDateErr", event: "change" },
    { id: "endDate", err: "endDateErr", event: "change" },
  ];

  fields.forEach((f) => {
    const el = document.getElementById(f.id);
    if (el) {
      el.addEventListener(f.event || "input", () => clearFieldError(f.err));
    }
  });

  // Initialize date inputs (only set min dates, not values)
  initDateInputs();
}

function initDateInputs() {
  const today = new Date().toISOString().split("T")[0];
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  // Only set minimum dates, not values
  if (startDateInput) {
    startDateInput.min = today;
  }

  if (endDateInput) {
    endDateInput.min = today;
  }
}

// ===============================
// CONTEXT MODES
// ===============================
function enableProductContextMode() {
  const applicableOn = document.getElementById("applicableOn");
  const productContextMessage = document.getElementById(
    "productContextMessage",
  );
  const productSelectorContainer = document.getElementById(
    "productSelectorContainer",
  );
  const productDisplayContainer = document.getElementById(
    "productDisplayContainer",
  );
  const categorySelectorContainer = document.getElementById(
    "categorySelectorContainer",
  );
  const productIdInput = document.getElementById("productIdFromUrl");

  productContextMessage?.classList.remove("hidden");
  if (productContextMessage) {
    productContextMessage.querySelector("p").textContent =
      "You are creating an offer for a specific product.";
  }

  applicableOn.value = "product";
  applicableOn.disabled = true;
  applicableOn.classList.add("bg-gray-100", "cursor-not-allowed");

  productDisplayContainer?.classList.remove("hidden");
  productSelectorContainer?.classList.add("hidden");
  categorySelectorContainer?.classList.add("hidden");

  if (productIdInput) productIdInput.value = idFromUrl;

  loadProductDetails(idFromUrl);
}

function enableCategoryContextMode() {
  const applicableOn = document.getElementById("applicableOn");
  const productContextMessage = document.getElementById(
    "productContextMessage",
  );

  if (productContextMessage) {
    productContextMessage.classList.remove("hidden");
    productContextMessage.querySelector("p").textContent =
      "You are creating an offer for a specific category.";
  }

  applicableOn.value = "category";
  applicableOn.disabled = true;
  applicableOn.classList.add("bg-gray-100", "cursor-not-allowed");

  applicableOn.addEventListener("change", handleApplicableOnChange);
  loadCategories();
  handleApplicableOnChange();

  setTimeout(() => {
    const checkbox = document.getElementById(`cat-${idFromUrl}`);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.onclick = () => false;
      checkbox.classList.add("cursor-not-allowed", "opacity-80");
      // If there's a parent label, make that not-allowed too
      if (checkbox.parentElement) {
        checkbox.parentElement.classList.add("cursor-not-allowed");
      }
    }
  }, 100);
}

function enableNormalMode() {
  const applicableOn = document.getElementById("applicableOn");
  const productContextMessage = document.getElementById(
    "productContextMessage",
  );

  productContextMessage?.classList.add("hidden");

  applicableOn.disabled = false;
  applicableOn.classList.remove("bg-gray-100", "cursor-not-allowed");

  applicableOn.addEventListener("change", handleApplicableOnChange);
  handleApplicableOnChange();
  loadCategories();
}

// ===============================
// UI HANDLER
// ===============================
function handleApplicableOnChange() {
  const applicableOn = document.getElementById("applicableOn")?.value;
  const productBox = document.getElementById("productSelectorContainer");
  const categoryBox = document.getElementById("categorySelectorContainer");
  const productDisplayBox = document.getElementById("productDisplayContainer");

  productBox?.classList.add("hidden");
  categoryBox?.classList.add("hidden");
  productDisplayBox?.classList.add("hidden");

  // Clear errors when changing selection
  clearFieldError("productSelectorErr");
  clearFieldError("categorySelectorErr");

  if (applicableOn === "product") {
    productBox?.classList.remove("hidden");
  } else if (applicableOn === "category") {
    categoryBox?.classList.remove("hidden");
  }
}

// ===============================
// FORM SUBMIT
// ===============================
async function handleOfferSubmit(e) {
  e.preventDefault();
  e.stopPropagation();

  clearAllErrors();

  const data = getFormData();
  const isValid = validateOfferForm(data);

  if (!isValid) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please fix the errors in the form before submitting.",
      confirmButtonColor: "#7c3aed",
    });
    return;
  }

  const payload = buildPayload(data);
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    if (submitBtn) window.setLoading(submitBtn, true);
    window.showGlobalLoading();

    const res = await api.createOfferAxios(payload);

    if (res?.data?.success) {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: "Offer Created",
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        location.href = "/admin/offers";
      });
    } else {
      throw new Error(res?.data?.message || "Create failed");
    }
  } catch (err) {
    console.error("Create offer error:", err);
    if (submitBtn) window.setLoading(submitBtn, false);
    window.hideGlobalLoading();

    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: err.message || "Something went wrong. Please try again.",
      confirmButtonColor: "#7c3aed",
    });
  }
}

// ===============================
// DATA EXTRACTOR
// ===============================
function getFormData() {
  return {
    title: document.getElementById("offerTitle")?.value.trim(),
    desc: document.getElementById("offerDesc")?.value.trim(),
    offerType: document.getElementById("offerType")?.value,
    offerValue: document.getElementById("offerValue")?.value.trim(),
    maximumDiscountValue: document
      .getElementById("maximumDiscountValue")
      ?.value.trim()
      ? document.getElementById("maximumDiscountValue").value.trim()
      : null,
    applicableOn: document.getElementById("applicableOn")?.value,
    startDate: document.getElementById("startDate")?.value,
    endDate: document.getElementById("endDate")?.value,
    status: document.getElementById("offerStatus")?.value,
  };
}

// ===============================
// VALIDATION ENGINE
// ===============================
function validateOfferForm(data) {
  let isValid = true;

  // Title Validation
  if (!data.title) {
    showError("offerTitleErr", "Title is required");
    isValid = false;
  } else if (data.title.length < 3) {
    showError("offerTitleErr", "Title must be at least 3 characters");
    isValid = false;
  }

  // Description Validation
  if (!data.desc) {
    showError("offerDescErr", "Description is required");
    isValid = false;
  } else if (data.desc.length < 10) {
    showError("offerDescErr", "Description must be at least 10 characters");
    isValid = false;
  }

  // Offer Type Validation
  if (!data.offerType) {
    showError("offerTypeErr", "Please select an offer type");
    isValid = false;
  }

  // Offer Value Validation
  const discountVal = parseFloat(data.offerValue);
  if (!data.offerValue) {
    showError("offerValueErr", "Offer value is required");
    isValid = false;
  } else if (isNaN(discountVal)) {
    showError("offerValueErr", "Offer value must be a valid number");
    isValid = false;
  } else if (data.offerType === "percentage") {
    if (discountVal <= 0 || discountVal > MAX_PERCENT) {
      showError(
        "offerValueErr",
        `Percentage must be between 1 and ${MAX_PERCENT}`,
      );
      isValid = false;
    }
  }

  // Maximum Discount Value Validation
  if (data.offerType === "percentage" && data.maximumDiscountValue) {
    const maxDiscountVal = parseFloat(data.maximumDiscountValue);
    if (isNaN(maxDiscountVal) || maxDiscountVal <= 0) {
      showError(
        "maximumDiscountValueErr",
        "Maximum discount must be a valid number > 0",
      );
      isValid = false;
    }
  }

  // Applicable On Validation
  if (!data.applicableOn) {
    showError("applicableOnErr", "Please select where the offer applies");
    isValid = false;
  } else {
    if (!isProductContext && !isCategoryContext) {
      if (data.applicableOn === "product") {
        const selectedProducts = getSelectedProductIds();
        if (selectedProducts.length === 0) {
          showError("productSelectorErr", "Please select at least one product");
          isValid = false;
        }
      } else if (data.applicableOn === "category") {
        const selectedCategories = getSelectedCategoryIds();
        if (selectedCategories.length === 0) {
          showError(
            "categorySelectorErr",
            "Please select at least one category",
          );
          isValid = false;
        }
      }
    }
  }

  // Start Date Validation
  if (!data.startDate) {
    showError("startDateErr", "Start date is required");
    isValid = false;
  } else {
    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      showError("startDateErr", "Start date cannot be in the past");
      isValid = false;
    }
  }

  // End Date Validation
  if (!data.endDate) {
    showError("endDateErr", "End date is required");
    isValid = false;
  } else if (data.startDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      showError("endDateErr", "End date must be after start date");
      isValid = false;
    }
  }

  return isValid;
}

// ===============================
// PAYLOAD BUILDER
// ===============================
function buildPayload(data) {
  const payload = {
    title: data.title,
    description: data.desc,
    offerType: data.offerType,
    offerValue: Number(data.offerValue),
    maximumDiscountValue:
      data.maximumDiscountValue !== null
        ? Number(data.maximumDiscountValue)
        : null,
    applicableOn: data.applicableOn,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status || "scheduled",
  };

  if (isProductContext) {
    payload.applicableOn = "product";
    payload.productIds = [idFromUrl];
  } else if (isCategoryContext) {
    payload.applicableOn = "category";
    payload.categoryIds = [idFromUrl];
  } else {
    if (data.applicableOn === "product") {
      payload.productIds = getSelectedProductIds();
    } else if (data.applicableOn === "category") {
      payload.categoryIds = getSelectedCategoryIds();
    }
  }

  return payload;
}

// ===============================
// HELPERS
// ===============================
function getSelectedProductIds() {
  return [...document.querySelectorAll(".selected-product-item")]
    .map((el) => el.getAttribute("data-product-id"))
    .filter(Boolean);
}

function getSelectedCategoryIds() {
  return [...document.querySelectorAll(".category-checkbox:checked")]
    .map((cb) => cb.value)
    .filter(Boolean);
}

// ===============================
// ERROR HANDLING FUNCTIONS
// ===============================
function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");

    // Add red border to the corresponding input
    const inputField = document.getElementById(fieldId.replace("Err", ""));
    if (inputField) {
      inputField.classList.add("border-red-500", "border-2");
      inputField.classList.remove("border-gray-300");
    }
  }
}

function clearFieldError(fieldId) {
  const errorElement = document.getElementById(fieldId);
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.add("hidden");

    // Remove red border from the corresponding input
    const inputField = document.getElementById(fieldId.replace("Err", ""));
    if (inputField) {
      inputField.classList.remove("border-red-500", "border-2");
      inputField.classList.add("border-gray-300");
    }
  }
}

function clearAllErrors() {
  // Clear all error messages
  document.querySelectorAll('[id$="Err"]').forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });

  // Remove all red borders
  document.querySelectorAll(".border-red-500").forEach((el) => {
    el.classList.remove("border-red-500", "border-2");
    el.classList.add("border-gray-300");
  });
}

// ===============================
// PRODUCT SEARCH
// ===============================
function handleProductSearch(e) {
  const term = e.target.value.trim().toLowerCase();
  const container = document.getElementById("productSearchResults");

  if (!container) return;

  if (term.length < 2) {
    container.classList.add("hidden");
    return;
  }

  const ALL_PRODUCTS = window.ALL_PRODUCTS || [];

  const filtered = ALL_PRODUCTS.filter((p) =>
    p.name?.toLowerCase().includes(term),
  ).slice(0, 8);

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="p-3 text-gray-500 text-sm">No products found</div>';
  } else {
    container.innerHTML = filtered
      .map(
        (p) => `
      <div class="product-result-item p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
        data-product-id="${p._id}"
        data-product-name="${p.name}">
        <div class="font-medium text-gray-900">${p.name}</div>
        <div class="text-xs text-gray-500">${p.sku || "No SKU"}</div>
      </div>
    `,
      )
      .join("");
  }

  container.classList.remove("hidden");

  // Add click handlers to result items
  document.querySelectorAll(".product-result-item").forEach((item) => {
    item.onclick = () => {
      addSelectedProduct(item.dataset.productId, item.dataset.productName);
      container.classList.add("hidden");
      e.target.value = "";
      clearFieldError("productSelectorErr");
    };
  });

  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener("click", function closeDropdown(event) {
      if (!container.contains(event.target) && event.target !== e.target) {
        container.classList.add("hidden");
        document.removeEventListener("click", closeDropdown);
      }
    });
  }, 100);
}

function addSelectedProduct(id, name) {
  const container = document.getElementById("selectedProducts");

  // Check if product already selected
  if (
    document.querySelector(`.selected-product-item[data-product-id="${id}"]`)
  ) {
    return;
  }

  const div = document.createElement("div");
  div.className =
    "selected-product-item flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2 border";
  div.dataset.productId = id;

  div.innerHTML = `
    <div>
      <span class="text-sm font-medium text-gray-900">${name}</span>
    </div>
    <button type="button" class="remove-product text-red-500 hover:text-red-700 text-lg font-bold" title="Remove">×</button>
  `;

  div.querySelector(".remove-product").onclick = (e) => {
    e.preventDefault();
    div.remove();
  };

  container.appendChild(div);
}

// ===============================
// LOADERS
// ===============================
async function loadProductDetails(productId) {
  try {
    const product = (window.ALL_PRODUCTS || []).find(
      (p) => p._id === productId,
    );

    // If not in ALL_PRODUCTS, fetch from API
    let productData = product;
    if (!productData) {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        productData = await response.json();
      }
    }

    const box = document.getElementById("selectedProductDisplay");
    if (!box || !productData) {
      box.innerHTML =
        '<div class="text-red-500 text-sm">Product not found</div>';
      return;
    }

    box.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-medium text-gray-900">${productData.name}</p>
          <p class="text-sm text-gray-600">SKU: ${productData.sku || "N/A"}</p>
          <p class="text-sm text-gray-600">Price: $${productData.price || "0.00"}</p>
        </div>
        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Selected</span>
      </div>
    `;
  } catch (err) {
    console.error("Load product error:", err);
    const box = document.getElementById("selectedProductDisplay");
    if (box) {
      box.innerHTML =
        '<div class="text-red-500 text-sm">Error loading product details</div>';
    }
  }
}

function loadCategories() {
  const categories = window.ALL_CATEGORIES || [];
  const container = document.getElementById("categorySelector");

  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML =
      '<div class="text-gray-500 text-center p-4 border rounded-lg">No categories available</div>';
    return;
  }

  container.innerHTML = categories
    .map(
      (cat) => `
    <div class="flex items-center mb-3 p-2 hover:bg-gray-50 rounded">
      <input type="checkbox"
        class="category-checkbox mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        value="${cat._id}"
        id="cat-${cat._id}"
        onchange="clearFieldError('categorySelectorErr')">
      <label for="cat-${cat._id}" class="text-sm text-gray-700 cursor-pointer flex-1">
        ${cat.name}
      </label>
    </div>
  `,
    )
    .join("");
}

// ===============================
// UTIL
// ===============================
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Make function globally available for inline event handlers
window.clearFieldError = clearFieldError;

function backButton() {
  window.location.href = "/admin/offers";
}
window.backButton = backButton;
