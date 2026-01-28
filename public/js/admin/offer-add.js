import api from "../adminApi.js";

// ===============================
// CONFIG
// ===============================
const MAX_PERCENT = 70;
const MAX_FLAT = 500;

// ===============================
// CONTEXT DETECTION
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const productIdFromUrl = urlParams.get("id");
const isProductContext = !!productIdFromUrl;

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
  } else {
    enableNormalMode();
  }

  form.addEventListener("submit", handleOfferSubmit);

  cancelBtn?.addEventListener("click", () => window.history.back());

  search?.addEventListener("input", debounce(handleProductSearch, 300));
}

// ===============================
// CONTEXT MODES
// ===============================
function enableProductContextMode() {
  const applicableOn = document.getElementById("applicableOn");
  const productContextMessage = document.getElementById("productContextMessage");
  const productSelectorContainer = document.getElementById("productSelectorContainer");
  const productDisplayContainer = document.getElementById("productDisplayContainer");
  const categorySelectorContainer = document.getElementById("categorySelectorContainer");
  const productIdInput = document.getElementById("productIdFromUrl");

  productContextMessage?.classList.remove("hidden");

  applicableOn.value = "product";
  applicableOn.disabled = true;
  applicableOn.classList.add("bg-gray-100", "cursor-not-allowed");

  productDisplayContainer?.classList.remove("hidden");
  productSelectorContainer?.classList.add("hidden");
  categorySelectorContainer?.classList.add("hidden");

  if (productIdInput) productIdInput.value = productIdFromUrl;

  loadProductDetails(productIdFromUrl);
}

function enableNormalMode() {
  const applicableOn = document.getElementById("applicableOn");
  const productContextMessage = document.getElementById("productContextMessage");

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

  if (applicableOn === "product") productBox?.classList.remove("hidden");
  if (applicableOn === "category") categoryBox?.classList.remove("hidden");
}

// ===============================
// FORM SUBMIT
// ===============================
async function handleOfferSubmit(e) {
  e.preventDefault();

  const data = getFormData();
  const error = validateOfferForm(data);

  if (error) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: error
    });
    return;
  }

  const payload = buildPayload(data);

  try {
    const res = await api.createOfferAxios(payload);

    if (res?.data?.success) {
      Swal.fire({
        icon: "success",
        title: "Offer Created",
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        location.href = "/admin/offers";
      });
    } else {
      throw new Error(res?.data?.message || "Create failed");
    }
  } catch (err) {
    console.error("Create offer error:", err);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: err.message || "Something went wrong"
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
    applicableOn: document.getElementById("applicableOn")?.value,
    startDate: document.getElementById("startDate")?.value,
    endDate: document.getElementById("endDate")?.value,
    minOrderValue: document.getElementById("minOrderValue")?.value.trim()
  };
}

// ===============================
// VALIDATION ENGINE
// ===============================
function validateOfferForm(data) {
  const discountVal = Number(data.offerValue);
  const minOrderVal = Number(data.minOrderValue);

  // Title
  if (!data.title || data.title.length < 3)
    return "Title must be at least 3 characters";

  // Description
  if (!data.desc || data.desc.length < 10)
    return "Description must be at least 10 characters";

  // Offer Type
  if (!data.offerType) return "Select offer type";

  // Numeric safety
  if (isNaN(discountVal)) return "Discount must be a valid number";
  if (isNaN(minOrderVal)) return "Minimum order must be a valid number";

  // Discount rules
  if (data.offerType === "percentage") {
    if (discountVal < 1 || discountVal > MAX_PERCENT)
      return `Percentage must be between 1 and ${MAX_PERCENT}`;
  }

  // Dates
  if (!data.startDate || !data.endDate)
    return "Start and End dates are required";

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) return "Start date cannot be in the past";
  if (end <= start) return "End date must be after start date";

  // Selection rules
  if (!isProductContext) {
    if (data.applicableOn === "product" && getSelectedProductIds().length === 0)
      return "Select at least one product";

    if (data.applicableOn === "category" && getSelectedCategoryIds().length === 0)
      return "Select at least one category";
  }

  return null;
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
    applicableOn: data.applicableOn,
    minOrderValue: Number(data.minOrderValue),
    startDate: data.startDate,
    endDate: data.endDate
  };

  if (isProductContext) {
    payload.applicableOn = "product";
    payload.productIds = [productIdFromUrl];
  } else {
    if (data.applicableOn === "product") {
      payload.productIds = getSelectedProductIds();
    }
    if (data.applicableOn === "category") {
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
    .map(el => el.getAttribute("data-product-id"))
    .filter(Boolean);
}

function getSelectedCategoryIds() {
  return [...document.querySelectorAll(".category-checkbox:checked")]
    .map(cb => cb.value);
}

// ===============================
// PRODUCT SEARCH
// ===============================
function handleProductSearch(e) {
  const term = e.target.value.trim().toLowerCase();
  const container = document.getElementById("productSearchResults");

  if (!container || term.length < 2) {
    container?.classList.add("hidden");
    return;
  }

  const ALL_PRODUCTS = window.ALL_PRODUCTS || [];

  const filtered = ALL_PRODUCTS.filter(p =>
    p.name?.toLowerCase().includes(term)
  ).slice(0, 8);

  container.innerHTML = filtered.length
    ? filtered.map(p => `
        <div class="product-result-item p-2 hover:bg-gray-100 cursor-pointer"
          data-product-id="${p._id}"
          data-product-name="${p.name}">
          ${p.name}
        </div>
      `).join("")
    : `<div class="p-2 text-gray-500 text-sm">No products found</div>`;

  container.classList.remove("hidden");

  document.querySelectorAll(".product-result-item").forEach(item => {
    item.onclick = () => {
      addSelectedProduct(item.dataset.productId, item.dataset.productName);
      container.classList.add("hidden");
      e.target.value = "";
    };
  });
}

function addSelectedProduct(id, name) {
  const container = document.getElementById("selectedProducts");

  if (
    document.querySelector(
      `.selected-product-item[data-product-id="${id}"]`
    )
  ) return;

  const div = document.createElement("div");
  div.className =
    "selected-product-item flex justify-between items-center bg-gray-50 p-2 rounded mb-2";
  div.dataset.productId = id;

  div.innerHTML = `
    <span class="text-sm">${name}</span>
    <button type="button" class="remove-product text-red-500">✕</button>
  `;

  div.querySelector(".remove-product").onclick = () => div.remove();
  container.appendChild(div);
}

// ===============================
// LOADERS
// ===============================
async function loadProductDetails(productId) {
  try {
    const product =
      (window.ALL_PRODUCTS || []).find(p => p._id === productId) ||
      (await (await fetch(`/api/products/${productId}`)).json());

    const box = document.getElementById("selectedProductDisplay");
    if (!box || !product) return;

    box.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-medium text-gray-900">${product.name}</p>
          <p class="text-sm text-gray-600">${product.sku || ""}</p>
        </div>
        <span class="text-gray-400 text-sm">Selected</span>
      </div>
    `;
  } catch (err) {
    console.error("Load product error:", err);
  }
}

function loadCategories() {
  const categories = window.ALL_CATEGORIES || [];
  const container = document.getElementById("categorySelector");

  if (!container) return;

  container.innerHTML = categories.length
    ? categories.map(cat => `
        <div class="flex items-center mb-2">
          <input type="checkbox"
            class="category-checkbox mr-2"
            value="${cat._id}"
            id="cat-${cat._id}">
          <label for="cat-${cat._id}" class="text-sm text-gray-700">
            ${cat.name}
          </label>
        </div>
      `).join("")
    : `<div class="text-gray-500 text-center p-2">No categories available</div>`;
}

// ===============================
// UTIL
// ===============================
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
