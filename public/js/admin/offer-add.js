import api from '../adminApi.js';

// ===============================
// CONFIG & PATTERNS
// ===============================
window.patterns = {
  title: /^.{3,}$/,
  description: /^.{10,}$/,
  percentage: /^(?:[1-9][0-9]?|90)$/,
  amount: /^[1-9]\d*$/
};

// ===============================
// CONTEXT DETECTION
// ===============================
window.urlParams = new URLSearchParams(window.location.search);
window.productIdFromUrl = window.urlParams.get('id');
window.isProductContext = !!window.productIdFromUrl;

// ===============================
// DOM READY
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  window.initOfferPage();
});

// ===============================
// INIT
// ===============================
window.initOfferPage = function () {
  const form = document.querySelector("form");
  const applicableOnSelect = document.getElementById('applicableOn');
  const cancelBtn = document.getElementById('cancelBtn');

  if (!form || !applicableOnSelect) return;

  // Context mode
  if (window.isProductContext) {
    window.enableProductContextMode();
  } else {
    window.enableNormalMode();
  }

  // Submit handler
  form.addEventListener("submit", window.handleOfferSubmit);

  // Cancel button
  cancelBtn?.addEventListener('click', () => {
    window.history.back();
  });

  // Search
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener(
      'input',
      window.debounce(window.handleProductSearch, 300)
    );
  }
};

// ===============================
// CONTEXT MODES
// ===============================
window.enableProductContextMode = function () {
  const applicableOnSelect = document.getElementById('applicableOn');
  const productContextMessage = document.getElementById('productContextMessage');
  const productSelectorContainer = document.getElementById('productSelectorContainer');
  const productDisplayContainer = document.getElementById('productDisplayContainer');
  const categorySelectorContainer = document.getElementById('categorySelectorContainer');
  const productIdInput = document.getElementById('productIdFromUrl');

  productContextMessage?.classList.remove('hidden');

  applicableOnSelect.value = 'product';
  applicableOnSelect.disabled = true;
  applicableOnSelect.classList.add('bg-gray-100', 'cursor-not-allowed');

  productDisplayContainer?.classList.remove('hidden');
  productSelectorContainer?.classList.add('hidden');
  categorySelectorContainer?.classList.add('hidden');

  if (productIdInput) {
    productIdInput.value = window.productIdFromUrl;
  }

  window.loadProductDetails(window.productIdFromUrl);
};

window.enableNormalMode = function () {
  const applicableOnSelect = document.getElementById('applicableOn');
  const productContextMessage = document.getElementById('productContextMessage');

  productContextMessage?.classList.add('hidden');

  applicableOnSelect.disabled = false;
  applicableOnSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');

  applicableOnSelect.addEventListener(
    'change',
    window.handleApplicableOnChange
  );

  window.handleApplicableOnChange();
  window.loadCategories();
};

// ===============================
// UI HANDLER
// ===============================
window.handleApplicableOnChange = function () {
  const applicableOn = document.getElementById('applicableOn')?.value;
  const productSelectorContainer = document.getElementById('productSelectorContainer');
  const categorySelectorContainer = document.getElementById('categorySelectorContainer');
  const productDisplayContainer = document.getElementById('productDisplayContainer');

  productSelectorContainer?.classList.add('hidden');
  categorySelectorContainer?.classList.add('hidden');
  productDisplayContainer?.classList.add('hidden');

  if (applicableOn === 'product') {
    productSelectorContainer?.classList.remove('hidden');
  } else if (applicableOn === 'category') {
    categorySelectorContainer?.classList.remove('hidden');
  }
};

// ===============================
// FORM SUBMIT
// ===============================
window.handleOfferSubmit = async function (e) {
  e.preventDefault();

  const formData = window.getFormData();
  const errors = window.validateOfferForm(formData);

  window.renderErrors(errors);
  if (!errors.valid) return;

  // ✅ BUILD PAYLOAD HERE
  const payload = window.buildPayload(formData);

  console.log("SENDING PAYLOAD:", payload); // Debug — remove later

  try {
    const res = await api.createOfferAxios(payload); // ✅ Send payload

    if (res?.data?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Offer Created',
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
      icon: 'error',
      title: 'Error',
      text: err.message || 'Something went wrong',
      timer: 1500,
      showConfirmButton: false
    });
  }
};

// ===============================
// DATA EXTRACTOR
// ===============================
window.getFormData = function () {
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
};

// ===============================
// VALIDATION ENGINE
// ===============================
window.validateOfferForm = function (data) {
  const errors = {
    offerTitleErr: "",
    offerDescErr: "",
    offerTypeErr: "",
    offerValueErr: "",
    applicableOnErr: "",
    startDateErr: "",
    endDateErr: "",
    minOrderValueErr: "",
    productSelectorErr: "",
    categorySelectorErr: "",
    valid: true
  };

  // Title
  if (!window.patterns.title.test(data.title)) {
    errors.offerTitleErr = "Title must be at least 3 characters";
    errors.valid = false;
  }

  // Description
  if (!window.patterns.description.test(data.desc)) {
    errors.offerDescErr = "Description must be at least 10 characters";
    errors.valid = false;
  }

  // Offer Type
  if (!data.offerType) {
    errors.offerTypeErr = "Select offer type";
    errors.valid = false;
  }

  // Offer Value
  if (data.offerType === "percentage") {
    if (!window.patterns.percentage.test(data.offerValue)) {
      errors.offerValueErr = "Percentage must be between 1–90";
      errors.valid = false;
    }
  } else if (data.offerType === "fixedamount") {
    if (!window.patterns.amount.test(data.offerValue)) {
      errors.offerValueErr = "Amount must be greater than 0";
      errors.valid = false;
    }
  }

  // Applicable On
  if (!data.applicableOn) {
    errors.applicableOnErr = "Select applicable type";
    errors.valid = false;
  }

  if (window.isProductContext && data.applicableOn !== "product") {
    errors.applicableOnErr = "This offer must apply to a product";
    errors.valid = false;
  }

  // Min Order
  if (data.minOrderValue === "" || Number(data.minOrderValue) < 0) {
    errors.minOrderValueErr = "Enter valid minimum order value";
    errors.valid = false;
  }

  // Dates
  if (!data.startDate) {
    errors.startDateErr = "Start date required";
    errors.valid = false;
  }

  if (!data.endDate) {
    errors.endDateErr = "End date required";
    errors.valid = false;
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      errors.endDateErr = "End date must be after start date";
      errors.valid = false;
    }
  }

  // Selection Validation
  if (!window.isProductContext) {
    if (data.applicableOn === "product") {
      if (window.getSelectedProductIds().length === 0) {
        errors.productSelectorErr = "Select at least one product";
        errors.valid = false;
      }
    }

    if (data.applicableOn === "category") {
      if (window.getSelectedCategoryIds().length === 0) {
        errors.categorySelectorErr = "Select at least one category";
        errors.valid = false;
      }
    }
  }

  // Build Payload
  errors.payload = window.buildPayload(data);

  return errors;
};

// ===============================
// PAYLOAD BUILDER
// ===============================
window.buildPayload = function (data) {
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

  if (window.isProductContext) {
    payload.applicableOn = "product";
    payload.productIds = [window.productIdFromUrl];
  } else {
    if (data.applicableOn === "product") {
      payload.productIds = window.getSelectedProductIds();
    }
    if (data.applicableOn === "category") {
      payload.categoryIds = window.getSelectedCategoryIds();
    }
  }

  return payload;
};

// ===============================
// ERROR RENDERER
// ===============================
window.renderErrors = function (errors) {
  Object.keys(errors).forEach(key => {
    if (key === "valid" || key === "payload") return;
    const el = document.getElementById(key);
    if (el) el.innerText = errors[key];
  });
};

// ===============================
// HELPERS
// ===============================
window.getSelectedProductIds = function () {
  return [...document.querySelectorAll('.selected-product-item')]
    .map(el => el.getAttribute('data-product-id'))
    .filter(Boolean);
};

window.getSelectedCategoryIds = function () {
  return [...document.querySelectorAll('.category-checkbox:checked')]
    .map(cb => cb.value);
};

// ===============================
// PRODUCT SEARCH (MODIFIED - NO API CALL)
// ===============================
window.handleProductSearch = function (e) {
  const term = e.target.value.trim().toLowerCase();
  const container = document.getElementById('productSearchResults');
  
  if (!container || term.length < 2) {
    container?.classList.add('hidden');
    return;
  }
  
  // Filter from pre-loaded products instead of API call
  const filteredProducts = (window.ALL_PRODUCTS || []).filter(product => {
    if (!product || !product._id) return false;
    
    const productName = product.name?.toLowerCase() || '';
    const productSku = product.sku?.toLowerCase() || '';
    return productName.includes(term) || productSku.includes(term);
  }).slice(0, 10); // Limit results for performance
  
  if (filteredProducts.length === 0) {
    container.innerHTML = '<div class="p-3 text-gray-500 text-center">No products found</div>';
  } else {
    container.innerHTML = filteredProducts.map(p => `
      <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 product-result-item"
        data-product-id="${p._id}"
        data-product-name="${p.name}">
        <p class="font-medium text-gray-900">${p.name}</p>
        <p class="text-sm text-gray-600">${p.sku || ''}</p>
      </div>
    `).join("");
  }
  
  container.classList.remove('hidden');
  
  // Add click handlers to results
  document.querySelectorAll('.product-result-item').forEach(item => {
    item.addEventListener('click', () => window.addSelectedProduct(item));
  });
};

window.addSelectedProduct = function (el) {
  const id = el.getAttribute('data-product-id');
  const name = el.getAttribute('data-product-name');

  // Check if already selected
  if (document.querySelector(`.selected-product-item[data-product-id="${id}"]`)) return;

  const container = document.getElementById('selectedProducts');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'selected-product-item flex items-center justify-between bg-gray-50 p-2 rounded mb-2';
  div.setAttribute('data-product-id', id);

  div.innerHTML = `
    <span class="text-sm text-gray-900">${name}</span>
    <button type="button" class="remove-product text-red-500 hover:text-red-700">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add remove handler
  div.querySelector('.remove-product').addEventListener('click', () => {
    div.remove();
  });

  container.appendChild(div);

  // Clear search and hide results
  document.getElementById('productSearch').value = '';
  document.getElementById('productSearchResults').classList.add('hidden');
};

// ===============================
// API LOADERS (UPDATED - uses pre-loaded data for categories too)
// ===============================
window.loadProductDetails = async function (productId) {
  try {
    // Try to find product in pre-loaded data first
    const preloadedProduct = (window.ALL_PRODUCTS || []).find(p => p._id === productId);
    
    if (preloadedProduct) {
      const box = document.getElementById('selectedProductDisplay');
      if (!box) return;

      box.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium text-gray-900">${preloadedProduct.name}</p>
            <p class="text-sm text-gray-600">${preloadedProduct.sku || ''}</p>
          </div>
          <span class="text-gray-400 text-sm">Selected</span>
        </div>
      `;
    } else {
      // Fallback to API if not in pre-loaded data
      const res = await fetch(`/api/products/${productId}`);
      const product = await res.json();

      const box = document.getElementById('selectedProductDisplay');
      if (!box) return;

      box.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium text-gray-900">${product.name}</p>
            <p class="text-sm text-gray-600">${product.sku || ''}</p>
          </div>
          <span class="text-gray-400 text-sm">Selected</span>
        </div>
      `;
    }
  } catch (err) {
    console.error("Load product error:", err);
  }
};

window.loadCategories = function () {
  // Use pre-loaded categories from EJS
  const categories = window.ALL_CATEGORIES || [];
  
  const container = document.getElementById('categorySelector');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center p-2">No categories available</div>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="flex items-center mb-2">
      <input type="checkbox"
        class="category-checkbox mr-2"
        value="${cat._id}"
        id="cat-${cat._id}"
      >
      <label for="cat-${cat._id}" class="text-sm text-gray-700">${cat.name}</label>
    </div>
  `).join("");
};

// ===============================
// UTIL
// ===============================
window.debounce = function (fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};