import api from "../api.js";
import {
  setLoading,
  showGlobalLoading,
  hideGlobalLoading,
} from "../ui-helpers.js";

// Global variables
let appliedCoupon = null;
let couponDiscount = 0;
let selectedCoupon = null;
let checkoutData = {};
let currentOrderId = null;
let razorpayInstance = null;

// Update address button text
function updateAddressButtonText(text) {
  const dropdownBtn = document.getElementById("addressDropdownBtn");
  if (dropdownBtn) {
    dropdownBtn.textContent = text;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Get data from window object
  checkoutData = window.checkoutData || {
    subtotal: 0,
    shipping: 0,
    finalAmount: 0,
    totalSavings: 0,
  };

  // Initialize all sections
  initCouponSection();
  initSavedAddresses();
  initFormValidation();
  checkUrlForCoupon();
  initPaymentSelection();
  initAddressSaving();

  // Check for failed payment in URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const paymentStatus = urlParams.get("payment_status");
  const paymentFailed = urlParams.get("payment_failed");
  const razorpayFailed = urlParams.get("razorpay_failed");

  if (orderId) {
    currentOrderId = orderId;

    // Show appropriate modal based on payment status
    if (
      paymentStatus === "failed" ||
      paymentFailed === "true" ||
      razorpayFailed === "true"
    ) {
      setTimeout(() => {
        showPaymentFailureModal(
          "Payment Failed",
          "Your payment was not successful. Would you like to try again?",
          orderId,
        );
      }, 500);
    }
  }
});

// Check for coupon in URL
async function checkUrlForCoupon() {
  const urlParams = new URLSearchParams(window.location.search);
  const couponCode = urlParams.get("code");

  if (couponCode) {
    try {
      const res = await api.verifyCouponAxios(couponCode);
      if (res.data.success) {
        const couponData = res.data.data;
        showSelectedCoupon(
          couponData.couponCode,
          couponData.title,
          couponData.description,
          couponData.discountValue,
          couponData.discountType,
          couponData.MinimumPurchaseValue,
          couponData.endDate,
          couponData._id,
          couponData.maximumDiscount,
        );
      }
    } catch (error) {
      console.log("Error loading coupon from URL:", error);
    }
  }
}

// Initialize coupon section
function initCouponSection() {
  const toggleBtn = document.getElementById("toggleCoupon");
  const couponForm = document.getElementById("couponForm");
  const chevron = document.getElementById("chevron");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      couponForm.classList.toggle("hidden");
      chevron.classList.toggle("rotate-180");
    });
  }

  const applyBtn = document.getElementById("applyBtn");
  const couponInput = document.getElementById("couponInput");

  if (applyBtn && couponInput) {
    applyBtn.addEventListener("click", async function () {
      const couponCode = couponInput.value.trim();
      if (!couponCode) {
        showToast("Please enter a coupon code", "warning");
        return;
      }
      await verifyAndApplyCoupon(couponCode);
    });

    couponInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        applyBtn.click();
      }
    });
  }
}

// Initialize saved addresses
function initSavedAddresses() {
  const addressRadios = document.querySelectorAll('input[name="savedAddress"]');
  const dropdownBtn = document.getElementById("addressDropdownBtn");
  const dropdown = document.getElementById("addressDropdown");
  let lastChecked = null;

  addressRadios.forEach((radio) => {
    radio.addEventListener("click", function () {
      handleAddressSelection(this);
    });
  });

  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });
  }

  document.addEventListener("click", function (e) {
    if (
      dropdown &&
      !dropdown.contains(e.target) &&
      dropdownBtn &&
      !dropdownBtn.contains(e.target)
    ) {
      dropdown.classList.add("hidden");
    }
  });

  function handleAddressSelection(radioElement) {
    if (radioElement === lastChecked) {
      radioElement.checked = false;
      lastChecked = null;
      updateAddressButtonText("Use saved address");
      clearAddressForm();
    } else {
      lastChecked = radioElement;
      populateAddressForm(radioElement);
    }
  }

  const defaultChecked = document.querySelector(
    'input[name="savedAddress"]:checked',
  );
  if (defaultChecked) {
    handleAddressSelection(defaultChecked);
  }
}

// Initialize address saving
function initAddressSaving() {
  const saveCheckbox = document.getElementById("saveAddressCheckbox");
  const addressTypeContainer = document.getElementById("addressTypeContainer");

  if (saveCheckbox && addressTypeContainer) {
    saveCheckbox.addEventListener("change", function () {
      if (this.checked) {
        addressTypeContainer.classList.remove("hidden");
      } else {
        addressTypeContainer.classList.add("hidden");
      }
    });
  }
}

// Initialize payment selection
function initPaymentSelection() {
  const paymentOptions = document.querySelectorAll(".payment-option");

  paymentOptions.forEach((option) => {
    option.addEventListener("click", function () {
      paymentOptions.forEach((opt) => {
        opt.classList.remove("border-purple-500", "bg-purple-50");
        opt.classList.add("border-gray-300");
      });

      this.classList.remove("border-gray-300");
      this.classList.add("border-purple-500", "bg-purple-50");

      const radioInput = this.querySelector('input[type="radio"]');
      if (radioInput) {
        radioInput.checked = true;
      }
    });
  });
}

// ============================================================
// FIELD VALIDATION RULES
// ============================================================
const fieldRules = {
  "first-name": {
    label: "First name",
    validate(val) {
      if (!val) return "First name is required";
      if (!/^[A-Za-z\s]{2,}$/.test(val))
        return "First name must contain only letters (min 2 characters)";
      return null;
    },
  },
  "last-name": {
    label: "Last name",
    validate(val) {
      if (!val) return "Last name is required";
      if (!/^[A-Za-z\s]{1,}$/.test(val))
        return "Last name must contain only letters";
      return null;
    },
  },
  phone: {
    label: "Phone number",
    validate(val) {
      if (!val) return "Phone number is required";
      if (!/^[6-9]\d{9}$/.test(val))
        return "Enter a valid 10-digit Indian mobile number";
      return null;
    },
  },
  line1: {
    label: "Street address",
    validate(val) {
      if (!val) return "Street address is required";
      if (val.length < 5)
        return "Street address is too short (min 5 characters)";
      return null;
    },
  },
  city: {
    label: "City",
    validate(val) {
      if (!val) return "City is required";
      if (!/^[A-Za-z\s]{2,}$/.test(val))
        return "City must contain only letters";
      return null;
    },
  },
  state: {
    label: "State",
    validate(val) {
      if (!val) return "Please select a state";
      return null;
    },
  },
  pincode: {
    label: "PIN code",
    validate(val) {
      if (!val) return "PIN code is required";
      if (!/^\d{6}$/.test(val)) return "PIN code must be exactly 6 digits";
      return null;
    },
  },
};

// Set field visual state (error / success / neutral)
function setFieldState(fieldId, state) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.remove(
    "border-red-400",
    "focus:ring-red-400",
    "border-green-400",
    "focus:ring-green-400",
    "border-gray-300",
  );
  if (state === "error") {
    el.classList.add("border-red-400", "focus:ring-red-400");
  } else if (state === "success") {
    el.classList.add("border-green-400", "focus:ring-green-400");
  } else {
    el.classList.add("border-gray-300");
  }
}

// Clear error
function clearError(fieldId) {
  const errorElement = document.getElementById(fieldId + "Error");
  if (errorElement) errorElement.textContent = "";
  setFieldState(fieldId, "neutral");
}

// Show error
function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + "Error");
  if (errorElement) errorElement.textContent = message;
  setFieldState(fieldId, "error");
}

// Show success state
function showSuccess(fieldId) {
  const errorElement = document.getElementById(fieldId + "Error");
  if (errorElement) errorElement.textContent = "";
  setFieldState(fieldId, "success");
}

// Validate a single field and update UI
function validateField(fieldId) {
  const rule = fieldRules[fieldId];
  if (!rule) return true;
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const val = el.value.trim();
  const error = rule.validate(val);
  if (error) {
    showError(fieldId, error);
    return false;
  } else {
    showSuccess(fieldId);
    return true;
  }
}

// Initialize form validation (real-time)
function initFormValidation() {
  const form = document.getElementById("shippingForm");
  if (!form) return;

  const saveAddressCheckbox = document.getElementById("saveAddressCheckbox");
  const addressTypeContainer = document.getElementById("addressTypeContainer");
  if (saveAddressCheckbox && addressTypeContainer) {
    saveAddressCheckbox.addEventListener("change", function () {
      addressTypeContainer.classList.toggle("hidden", !this.checked);
    });
  }

  // Attach real-time events to each validated field
  Object.keys(fieldRules).forEach((fieldId) => {
    const el = document.getElementById(fieldId);
    if (!el) return;

    // Clear saved-address selection when user manually edits any field
    el.addEventListener("input", function () {
      // Clear error while user is typing (not yet done, defer to blur)
      // But if field was in error state, re-validate on input for responsiveness
      if (el.classList.contains("border-red-400")) {
        validateField(fieldId);
      }
      // Deselect saved address
      const checkedAddress = document.querySelector(
        'input[name="savedAddress"]:checked',
      );
      if (checkedAddress) {
        checkedAddress.checked = false;
        const dropdownBtn = document.getElementById("addressDropdownBtn");
        if (dropdownBtn) dropdownBtn.textContent = "Use saved address";
      }
    });

    // Validate on blur (when user leaves field)
    el.addEventListener("blur", function () {
      // Only validate if the field has been touched (has a value or was focused)
      if (el.value.trim() !== "" || el === document.activeElement) {
        validateField(fieldId);
      }
    });

    // For select, validate on change immediately
    if (el.tagName === "SELECT") {
      el.addEventListener("change", () => validateField(fieldId));
    }

    // Phone: allow only digits
    if (fieldId === "phone" || fieldId === "pincode") {
      el.addEventListener("keypress", function (e) {
        if (
          !/[0-9]/.test(e.key) &&
          !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
            e.key,
          )
        ) {
          e.preventDefault();
        }
      });
    }
  });
}

// Validate address form (called on Place Order)
function validateAddressForm() {
  let isValid = true;
  // Validate all fields and collect result
  Object.keys(fieldRules).forEach((fieldId) => {
    const ok = validateField(fieldId);
    if (!ok) isValid = false;
  });
  // Scroll to first error
  if (!isValid) {
    const firstError = document.querySelector(".border-red-400");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      firstError.focus();
    }
  }
  return isValid;
}

// Verify and apply coupon
async function verifyAndApplyCoupon(couponCode) {
  try {
    showGlobalLoading();
    const res = await api.verifyCouponAxios(couponCode);
    hideGlobalLoading();

    if (res.data.success) {
      const couponData = res.data.data;

      const shipping = parseFloat(checkoutData.shipping) || 0;
      const finalAmount = parseFloat(checkoutData.finalAmount) || 0;
      const effectiveSubtotal = finalAmount - shipping;

      const orderButton = document.querySelector(
        'button[onclick="placeOrder()"]',
      );
      const errorElement = document.getElementById("selectedCouponError");

      let isValid = true;
      if (effectiveSubtotal < couponData.MinimumPurchaseValue) {
        isValid = false;
        const needed = (
          couponData.MinimumPurchaseValue - effectiveSubtotal
        ).toFixed(2);
        Swal.fire({
          icon: "warning",
          title: "Minimum Purchase Required",
          html: `This coupon requires a minimum purchase of <strong>₹${couponData.MinimumPurchaseValue}</strong>.<br>Add ₹${needed} more to your cart to use this coupon.`,
          confirmButtonText: "Got it",
          confirmButtonColor: "#7c3aed",
        });
        if (orderButton) {
          orderButton.disabled = true;
          orderButton.classList.add("opacity-50", "cursor-not-allowed");
        }
        if (errorElement) {
          errorElement.textContent = `⚠️ Minimum purchase of ₹${couponData.MinimumPurchaseValue} required.`;
          errorElement.classList.remove("hidden");
        }
      } else {
        if (orderButton) {
          orderButton.disabled = false;
          orderButton.classList.remove("opacity-50", "cursor-not-allowed");
        }
        if (errorElement) {
          errorElement.classList.add("hidden");
        }
        Swal.fire({
          icon: "success",
          title: "Coupon Applied!",
          text: `${couponData.couponCode} – ${couponData.discountType === "percentage" ? couponData.discountValue + "% OFF" : "₹" + couponData.discountValue + " OFF"} applied successfully`,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: false,
          position: "center",
          background: "#f0fdf4",
          color: "#15803d",
          iconColor: "#16a34a",
        });
      }

      document.getElementById("selectedCouponCode").textContent =
        couponData.couponCode;
      document.getElementById("selectedCouponDesc").textContent =
        couponData.description;
      document.getElementById("selectedCouponMin").textContent =
        couponData.MinimumPurchaseValue;
      document.getElementById("selectedCouponDate").textContent = new Date(
        couponData.endDate,
      ).toLocaleDateString();

      document.getElementById("selectedCouponBadge").textContent =
        couponData.discountType === "percentage"
          ? `${couponData.discountValue}% OFF`
          : `₹${couponData.discountValue} OFF`;

      const container = document.getElementById("selectedCouponDetails");
      container.dataset.couponId = couponData._id;
      container.classList.remove("hidden");

      if (isValid) {
        updateTotalWithCoupon(couponData);
      } else {
        // Remove discount from display, keep total as base amount
        selectedCoupon = couponData;
        couponDiscount = 0;
        updateTotalDisplay(0);
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Coupon",
        text: res.data.message || "This coupon code is not valid.",
        confirmButtonText: "Try Again",
        confirmButtonColor: "#7c3aed",
      });
    }
  } catch (error) {
    hideGlobalLoading();
    console.error("Coupon verification error:", error);
    showToast("Error verifying coupon", "error");
  }
}

// Update total with coupon
function updateTotalWithCoupon(couponData) {
  const shipping = parseFloat(checkoutData.shipping) || 0;
  const finalAmount = parseFloat(checkoutData.finalAmount) || 0;
  const effectiveSubtotal = finalAmount - shipping;

  const orderButton = document.querySelector('button[onclick="placeOrder()"]');
  const errorElement = document.getElementById("selectedCouponError");

  let isValid = true;
  if (effectiveSubtotal < couponData.MinimumPurchaseValue) {
    isValid = false;
    showToast(
      `Minimum purchase of ₹${couponData.MinimumPurchaseValue} required`,
      "warning",
    );
    if (orderButton) {
      orderButton.disabled = true;
      orderButton.classList.add("opacity-50", "cursor-not-allowed");
    }
    if (errorElement) {
      errorElement.textContent = `⚠️ Minimum purchase of ₹${couponData.MinimumPurchaseValue} required.`;
      errorElement.classList.remove("hidden");
    }

    // Remove discount visually
    selectedCoupon = couponData;
    couponDiscount = 0;
    updateTotalDisplay(0);
    return false;
  }

  if (orderButton) {
    orderButton.disabled = false;
    orderButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
  if (errorElement) {
    errorElement.classList.add("hidden");
  }

  let discount = 0;

  if (couponData.discountType === "percentage") {
    const discountVal = parseFloat(couponData.discountValue) || 0;
    discount = (effectiveSubtotal * discountVal) / 100;

    // Apply dynamic limit if present
    const maxDisc = parseFloat(couponData.maximumDiscount);
    if (maxDisc && maxDisc > 0) {
      discount = Math.min(discount, maxDisc);
    }
  } else {
    discount = parseFloat(couponData.discountValue) || 0;
  }

  if (discount > effectiveSubtotal) {
    discount = effectiveSubtotal;
  }

  selectedCoupon = couponData;
  couponDiscount = discount;
  updateTotalDisplay(discount);
  return true;
}

// Update total display
function updateTotalDisplay(discount) {
  const baseFinalAmount = parseFloat(checkoutData.finalAmount);
  const newTotal = baseFinalAmount - discount;

  const couponDiscountElement = document.getElementById("couponDiscount");
  const couponDiscountValueElement = document.getElementById(
    "couponDiscountValue",
  );

  if (couponDiscountElement) {
    couponDiscountElement.classList.remove("hidden");
  }

  if (couponDiscountValueElement) {
    couponDiscountValueElement.textContent = `-₹${discount.toFixed(2)}`;
  }

  const finalTotalElement = document.getElementById("finalTotal");
  if (finalTotalElement) {
    finalTotalElement.textContent = `₹${newTotal.toFixed(2)}`;
  }

  const savingsElement = document.createElement("p");
  savingsElement.className =
    "text-xs text-green-600 mt-2 font-medium flex items-center gap-1 coupon-savings-message";
  savingsElement.innerHTML = `
        <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
        </svg>
        You saved ₹${discount.toFixed(2)} with coupon!
    `;

  const existingSavings = document.querySelector(".coupon-savings-message");
  if (existingSavings) {
    existingSavings.remove();
  }

  let container = document.querySelector(".border-t.pt-4.mt-3");
  if (!container) {
    container = document.querySelector(
      ".space-y-2.sm\\:space-y-3.mb-4.sm\\:mb-6",
    );
  }
  if (!container) {
    container = document.querySelector(
      ".border-t.border-gray-300.pt-3.sm\\:pt-4.mt-2.sm\\:mt-3",
    );
  }

  if (container) {
    container.appendChild(savingsElement);
  }
}

// Remove selected coupon
function removeSelectedCoupon() {
  const container = document.getElementById("selectedCouponDetails");
  if (container) {
    container.classList.add("hidden");
    container.dataset.couponId = "";
  }

  selectedCoupon = null;
  couponDiscount = 0;

  const couponDiscountElement = document.getElementById("couponDiscount");
  if (couponDiscountElement) {
    couponDiscountElement.classList.add("hidden");
  }

  const errorElement = document.getElementById("selectedCouponError");
  if (errorElement) {
    errorElement.classList.add("hidden");
    errorElement.textContent = "";
  }

  const finalTotalElement = document.getElementById("finalTotal");
  const originalFinal = parseFloat(checkoutData.finalAmount);

  if (finalTotalElement) {
    finalTotalElement.textContent = `₹${originalFinal.toFixed(2)}`;
  }

  const existingSavings = document.querySelector(".coupon-savings-message");
  if (existingSavings) {
    existingSavings.remove();
  }

  const orderButton = document.querySelector('button[onclick="placeOrder()"]');
  if (orderButton) {
    orderButton.disabled = false;
    orderButton.classList.remove("opacity-50", "cursor-not-allowed");
  }

  showToast("Coupon removed", "info");
}

// Copy coupon code
function copyCouponCode() {
  const code = document.getElementById("selectedCouponCode")?.textContent;
  if (code) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        showToast("Coupon code copied!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }
}

// Copy coupon code inline
function copyCouponCodeInline(code) {
  event.stopPropagation();
  navigator.clipboard
    .writeText(code)
    .then(() => {
      showToast("Coupon code copied!", "success");
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
}

// Populate address form
function populateAddressForm(radioElement) {
  const addressData = {
    firstName: radioElement.getAttribute("data-first-name"),
    lastName: radioElement.getAttribute("data-last-name"),
    phone: radioElement.getAttribute("data-phone"),
    line1: radioElement.getAttribute("data-line1"),
    landmark: radioElement.getAttribute("data-landmark"),
    city: radioElement.getAttribute("data-city"),
    state: radioElement.getAttribute("data-state"),
    pincode: radioElement.getAttribute("data-pincode"),
  };

  document.getElementById("first-name").value = addressData.firstName || "";
  document.getElementById("last-name").value = addressData.lastName || "";
  document.getElementById("phone").value = addressData.phone || "";
  document.getElementById("line1").value = addressData.line1 || "";
  document.getElementById("landmark").value = addressData.landmark || "";
  document.getElementById("city").value = addressData.city || "";

  const stateSelect = document.getElementById("state");
  if (stateSelect) {
    stateSelect.value = addressData.state || "";
  }

  document.getElementById("pincode").value = addressData.pincode || "";

  // Hide save address option when using saved address
  const saveOption = document
    .getElementById("saveAddressCheckbox")
    ?.closest(".pt-2");
  if (saveOption) saveOption.classList.add("hidden");
  const addressTypeContainer = document.getElementById("addressTypeContainer");
  if (addressTypeContainer) addressTypeContainer.classList.add("hidden");
  const saveCheckbox = document.getElementById("saveAddressCheckbox");
  if (saveCheckbox) saveCheckbox.checked = false;

  updateAddressButtonText("✓ Address Selected");

  const dropdown = document.getElementById("addressDropdown");
  if (dropdown) {
    dropdown.classList.add("hidden");
  }
}

// Clear address form
function clearAddressForm() {
  const form = document.getElementById("shippingForm");
  if (form) form.reset();

  // Reset all field visual states
  Object.keys(fieldRules).forEach((fieldId) => clearError(fieldId));

  // Show save address option for manual entry
  const saveOption = document
    .getElementById("saveAddressCheckbox")
    ?.closest(".pt-2");
  if (saveOption) saveOption.classList.remove("hidden");
}

// Show selected coupon
window.showSelectedCoupon = function (
  code,
  title,
  description,
  discountValue,
  discountType,
  minPurchase,
  validTill,
  couponId,
  maxDiscount,
) {
  const shipping = parseFloat(checkoutData.shipping) || 0;
  const finalAmount = parseFloat(checkoutData.finalAmount) || 0;
  const effectiveSubtotal = finalAmount - shipping;

  const orderButton = document.querySelector('button[onclick="placeOrder()"]');
  const errorElement = document.getElementById("selectedCouponError");

  let isValid = true;
  if (effectiveSubtotal < parseFloat(minPurchase)) {
    isValid = false;
    const needed = (parseFloat(minPurchase) - effectiveSubtotal).toFixed(2);
    Swal.fire({
      icon: "warning",
      title: "Minimum Purchase Required",
      html: `This coupon requires a minimum purchase of <strong>₹${minPurchase}</strong>.<br>Add ₹${needed} more to your cart to use this coupon.`,
      confirmButtonText: "Got it",
      confirmButtonColor: "#7c3aed",
    });
    if (orderButton) {
      orderButton.disabled = true;
      orderButton.classList.add("opacity-50", "cursor-not-allowed");
    }
    if (errorElement) {
      errorElement.textContent = `⚠️ Minimum purchase of ₹${minPurchase} required.`;
      errorElement.classList.remove("hidden");
    }
  } else {
    if (orderButton) {
      orderButton.disabled = false;
      orderButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
    if (errorElement) {
      errorElement.classList.add("hidden");
    }
    const discountLabel =
      discountType === "percentage"
        ? `${discountValue}% OFF`
        : `₹${discountValue} OFF`;
    Swal.fire({
      icon: "success",
      title: "Coupon Applied!",
      text: `${code} – ${discountLabel} applied successfully`,
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: false,
      position: "center",
      background: "#f0fdf4",
      color: "#15803d",
      iconColor: "#16a34a",
    });
  }

  selectedCoupon = {
    _id: couponId,
    couponCode: code,
    title,
    description,
    discountType,
    discountValue: parseFloat(discountValue),
    maximumDiscount: parseFloat(maxDiscount) || 0,
    MinimumPurchaseValue: parseFloat(minPurchase),
    endDate: validTill,
  };

  const container = document.getElementById("selectedCouponDetails");
  if (container) {
    container.dataset.couponId = couponId;
    container.classList.remove("hidden");
  }

  const couponCodeElement = document.getElementById("selectedCouponCode");
  if (couponCodeElement) couponCodeElement.textContent = code;

  const couponDescElement = document.getElementById("selectedCouponDesc");
  if (couponDescElement) couponDescElement.textContent = description;

  const couponMinElement = document.getElementById("selectedCouponMin");
  if (couponMinElement) couponMinElement.textContent = minPurchase;

  const couponDateElement = document.getElementById("selectedCouponDate");
  if (couponDateElement)
    couponDateElement.textContent = new Date(validTill).toLocaleDateString(
      "en-IN",
    );

  const badgeText =
    discountType === "percentage"
      ? `${discountValue}% OFF`
      : `₹${discountValue} OFF`;

  const couponBadgeElement = document.getElementById("selectedCouponBadge");
  if (couponBadgeElement) couponBadgeElement.textContent = badgeText;

  if (isValid) {
    updateTotalWithCoupon(selectedCoupon);
  } else {
    // Remove discount visually
    couponDiscount = 0;
    updateTotalDisplay(0);
  }
};

// Handle coupon click
window.handleCouponClick = function (element) {
  const dataset = element.dataset;
  showSelectedCoupon(
    dataset.couponCode,
    dataset.title,
    dataset.description,
    dataset.discountValue,
    dataset.discountType,
    dataset.minPurchase,
    dataset.endDate,
    dataset.id,
    dataset.maxDiscount,
  );
};

// Build payload
function buildPayload() {
  const selectedSavedAddress = document.querySelector(
    'input[name="savedAddress"]:checked',
  );
  let addressPayload = {};

  if (selectedSavedAddress) {
    addressPayload = {
      type: "saved",
      addressId: selectedSavedAddress.value,
    };
  } else {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const line1 = document.getElementById("line1").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value;
    const pincode = document.getElementById("pincode").value.trim();

    addressPayload = {
      type: "manual",
      firstName,
      lastName,
      phone,
      streetAddress: line1,
      landMark: landmark,
      city,
      state,
      pinCode: pincode,
    };
  }

  const paymentMethod =
    document.querySelector('input[name="payment"]:checked')?.value || "cod";
  const container = document.getElementById("selectedCouponDetails");
  const couponId =
    container && !container.classList.contains("hidden")
      ? container.dataset.couponId || null
      : null;
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutType = urlParams.get("type");
  const productId = urlParams.get("productId");
  const variantId = urlParams.get("variantId");

  return {
    address: addressPayload,
    paymentMethod,
    couponCode: couponId,
    couponDiscount: couponDiscount,
    checkoutType,
    productId,
    variantId,
  };
}

// Place order
async function placeOrder() {
  const orderButton = document.querySelector('button[onclick="placeOrder()"]');
  setLoading(orderButton, true);

  try {
    const selectedSavedAddress = document.querySelector(
      'input[name="savedAddress"]:checked',
    );

    if (!selectedSavedAddress && !validateAddressForm()) {
      showToast("Please fill all required shipping details", "warning");
      setLoading(orderButton, false);
      return;
    }

    const paymentMethod = document.querySelector(
      'input[name="payment"]:checked',
    )?.value;

    if (!paymentMethod) {
      showToast("Please select a payment method", "warning");
      setLoading(orderButton, false);
      return;
    }

    const payload = buildPayload();

    // Check if the user wants to save the manual address
    if (payload.address.type === "manual") {
      const saveCheckbox = document.getElementById("saveAddressCheckbox");
      if (saveCheckbox && saveCheckbox.checked) {
        const addressType =
          document.querySelector('input[name="addressType"]:checked')?.value ||
          "Home";

        try {
          // Make a parallel request to save the address
          await api.addAddressAxios({
            firstName: payload.address.firstName,
            lastName: payload.address.lastName,
            phone: payload.address.phone,
            streetAddress: payload.address.streetAddress,
            landmark: payload.address.landMark,
            city: payload.address.city,
            state: payload.address.state,
            pincode: payload.address.pinCode,
            addressType: addressType,
            isDefault: false,
          });
        } catch (addrErr) {
          console.error("Failed to save address to profile:", addrErr);
          // Silently fail to not interrupt order placement, or you could show a toast:
          showToast(
            "Order proceeding but failed to save address to profile",
            "warning",
          );
        }
      }
    }

    showGlobalLoading();
    try {
      const res = await api.confirmationAxios(payload);

      if (res.data.success) {
        if (paymentMethod === "razorpay") {
          currentOrderId = res.data.orderId;
          const url = new URL(window.location);
          url.searchParams.set("orderId", currentOrderId);
          window.history.replaceState({}, "", url);
          await initiateRazorpayPayment(currentOrderId);
        } else {
          showToast("Order placed successfully!", "success");
          setTimeout(() => {
            window.location.href = `/order/confirm/${res.data.orderId}`;
          }, 1500);
        }
      } else {
        handleOrderFailure(res);
        if (orderButton) {
          setLoading(orderButton, false);
        }
      }
    } finally {
      hideGlobalLoading();
    }
  } catch (error) {
    console.error("Order placement error:", error);
    showToast(
      error.response?.data?.message || "An error occurred while placing order",
      "error",
    );
    if (orderButton) {
      setLoading(orderButton, false);
    }
    hideGlobalLoading();
  }
}

// Handle order failure
function handleOrderFailure(res) {
  if (res.data.redirect === "/cart") {
    showToast(res.data.message || "Redirecting to cart...", "warning");
    setTimeout(() => {
      window.location.href = res.data.redirect;
    }, 2000);
  } else {
    showToast(res.data.message || "Order failed", "error");
  }
}

// Initiate Razorpay payment
async function initiateRazorpayPayment(orderId) {
  try {
    const res = await api.createRazorpayOrderAxios(orderId);

    if (!res.data.success) {
      showToast("Failed to initiate payment", "error");
      const orderButton = document.querySelector(
        'button[onclick="placeOrder()"]',
      );
      if (orderButton) {
        orderButton.disabled = false;
        orderButton.innerHTML = "Place Order";
      }
      return;
    }

    const options = {
      key: res.data.key,
      amount: res.data.order.amount,
      currency: res.data.order.currency,
      name: "CaseCart",
      description: "Order Payment",
      image: "/img/logo.png",
      order_id: res.data.order.id,
      handler: async function (response) {
        // Payment successful - verify
        await verifyPayment(response, orderId);
      },
      prefill: {
        name: document.getElementById("first-name")?.value || "",
        email: "",
        contact: document.getElementById("phone")?.value || "",
      },
      theme: {
        color: "#9333ea",
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay modal dismissed by user");
          // Re-enable the order button
          const orderButton = document.querySelector(
            'button[onclick="placeOrder()"]',
          );
          if (orderButton) {
            orderButton.disabled = false;
            orderButton.innerHTML = "Place Order";
          }

          // Show failure modal immediately when modal is dismissed
          showPaymentFailureModal(
            "Payment Cancelled",
            "You have closed the payment window. Your order has been created but payment is pending.",
            orderId,
          );
        },
      },
    };

    razorpayInstance = new Razorpay(options);

    razorpayInstance.on("payment.failed", function (response) {
      const error = response.error;
      console.error("Razorpay payment failed:", error);

      // Re-enable the order button
      const orderButton = document.querySelector(
        'button[onclick="placeOrder()"]',
      );
      if (orderButton) {
        orderButton.disabled = false;
        orderButton.innerHTML = "Place Order";
      }

      // Show failure modal immediately when payment fails
      showPaymentFailureModal(
        "Payment Failed",
        `Reason: ${error.description || "Payment could not be processed"}`,
        orderId,
      );
    });

    // Open Razorpay modal
    razorpayInstance.open();
  } catch (error) {
    console.error("Razorpay initiation error:", error);
    showToast("Error initiating payment", "error");

    // Re-enable the order button
    const orderButton = document.querySelector(
      'button[onclick="placeOrder()"]',
    );
    if (orderButton) {
      orderButton.disabled = false;
      orderButton.innerHTML = "Place Order";
    }

    // Show failure modal for initiation error
    showPaymentFailureModal(
      "Payment Error",
      "Could not initiate payment. Please try again.",
      orderId,
    );
  }
}

// Verify payment - FIXED VERSION with proper redirect
// Verify payment - FIXED VERSION with better error handling
// Verify payment - COMPLETE FIXED VERSION
async function verifyPayment(paymentDetails, orderId) {
  console.log("Verifying payment with details:", paymentDetails);
  console.log("Order ID:", orderId);

  try {
    const data = {
      razorpay_payment_id: paymentDetails.razorpay_payment_id,
      razorpay_order_id: paymentDetails.razorpay_order_id,
      razorpay_signature: paymentDetails.razorpay_signature,
      orderId: orderId,
    };

    console.log("Sending verification data:", data);

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Verifying Payment",
        text: "Please wait while we verify your payment...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    let res;
    try {
      res = await api.verifyRazorpayPaymentAxios(data);
      console.log("Verification response:", res);
    } finally {
      // Close loading modal
      if (typeof Swal !== "undefined") {
        Swal.close();
      }
    }

    // Check for success in various response formats
    const isSuccess =
      res.data.success === true ||
      res.data.success === "true" ||
      res.data.status === "success" ||
      res.data.status === "completed" ||
      res.data.paymentStatus === "success" ||
      res.data.paymentStatus === "completed" ||
      (res.data.message &&
        (res.data.message.toLowerCase().includes("success") ||
          res.data.message.toLowerCase().includes("verified"))) ||
      (res.data.razorpay_payment_id && res.data.razorpay_order_id) ||
      res.data.orderId === orderId;

    if (isSuccess) {
      console.log("✅ Payment verification successful!");

      // Show success message
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "success",
          title: "Payment Successful!",
          text: "Your order has been placed successfully.",
          timer: 1500,
          showConfirmButton: false,
          didClose: () => {
            // Redirect after modal closes
            window.location.href = `/order/confirm/${orderId}`;
          },
        });
      } else {
        showToast("Payment successful!", "success");
        setTimeout(() => {
          window.location.href = `/order/confirm/${orderId}`;
        }, 1000);
      }
    } else {
      console.error("❌ Payment verification failed:", res.data);

      // Double-check if order exists by making a separate API call
      try {
        // Try to fetch order status as a backup check
        const orderCheck = await api.checkOrderStatusAxios(orderId);
        if (
          orderCheck.data.success &&
          (orderCheck.data.paymentStatus === "success" ||
            orderCheck.data.paymentStatus === "completed")
        ) {
          console.log("Order status check shows payment successful!");

          // Show success and redirect
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "success",
              title: "Payment Successful!",
              text: "Your order has been placed successfully.",
              timer: 1500,
              showConfirmButton: false,
              didClose: () => {
                window.location.href = `/order/confirm/${orderId}`;
              },
            });
          }
          return;
        }
      } catch (checkError) {
        console.log("Order status check failed:", checkError);
      }

      // Re-enable the order button
      const orderButton = document.querySelector(
        'button[onclick="placeOrder()"]',
      );
      if (orderButton) {
        orderButton.disabled = false;
        orderButton.innerHTML = "Place Order";
      }

      // Get error message from response
      const errorMsg =
        res.data.message ||
        res.data.error ||
        "Your payment could not be verified. Please check your order status.";

      showPaymentFailureModal("Payment Verification Failed", errorMsg, orderId);
    }
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    console.error("Error response:", error.response);
    console.error("Error data:", error.response?.data);

    // Close any open modals
    if (typeof Swal !== "undefined") {
      Swal.close();
    }

    // Check if we have a successful response despite error
    if (error.response?.data) {
      const data = error.response.data;
      console.log("Error response data:", data);

      // Check if the response indicates success in some way
      if (
        data.success === true ||
        data.status === "success" ||
        data.paymentStatus === "success" ||
        data.payment_status === "success" ||
        data.orderId === orderId
      ) {
        console.log("✅ Payment appears successful despite error!");

        // Show success message
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Payment Successful!",
            text: "Your order has been placed successfully.",
            timer: 1500,
            showConfirmButton: false,
            didClose: () => {
              window.location.href = `/order/confirm/${orderId}`;
            },
          });
        } else {
          setTimeout(() => {
            window.location.href = `/order/confirm/${orderId}`;
          }, 1000);
        }
        return;
      }

      // Check if we have order data
      if (data.orderId || data.order || data.order_id) {
        console.log("Order exists, redirecting...");
        setTimeout(() => {
          window.location.href = `/order/confirm/${orderId}`;
        }, 1500);
        return;
      }
    }

    // If we're here, the payment might have failed
    // But let's do one last check - maybe the order is still there
    try {
      const orderCheck = await api.checkOrderStatusAxios(orderId);
      if (orderCheck.data.success) {
        console.log("Order exists, redirecting to confirmation page");
        setTimeout(() => {
          window.location.href = `/order/confirm/${orderId}`;
        }, 1500);
        return;
      }
    } catch (finalCheckError) {
      console.log("Final order check failed:", finalCheckError);
    }

    // Re-enable the order button
    const orderButton = document.querySelector(
      'button[onclick="placeOrder()"]',
    );
    if (orderButton) {
      orderButton.disabled = false;
      orderButton.innerHTML = "Place Order";
    }

    let errorMessage = "Error verifying payment.";
    if (error.response) {
      errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "Server error occurred.";
    } else if (error.request) {
      errorMessage = "No response from server. Please check your connection.";
    } else {
      errorMessage = error.message || "Unknown error occurred.";
    }

    showPaymentFailureModal("Payment Error", errorMessage, orderId);
  }
}
// Function to retry payment directly without page reload
async function retryPayment(orderId) {
  console.log("Retrying payment for order:", orderId);

  // Show loading state
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "Processing",
      html: "Please wait while we prepare your payment...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  try {
    // Recreate Razorpay order
    const res = await api.createRazorpayOrderAxios(orderId);

    // Close loading modal if open
    if (typeof Swal !== "undefined") {
      Swal.close();
    }

    if (!res.data.success) {
      showPaymentFailureModal(
        "Payment Initiation Failed",
        "Could not initiate payment. Please try again.",
        orderId,
      );
      return;
    }

    // Get customer details from the existing form or from the response
    const customerName =
      document.getElementById("first-name")?.value ||
      document.getElementById("shipping-name")?.value ||
      "Customer";

    const customerPhone =
      document.getElementById("phone")?.value ||
      document.getElementById("shipping-phone")?.value ||
      "";

    const options = {
      key: res.data.key,
      amount: res.data.order.amount,
      currency: res.data.order.currency,
      name: "CaseCart",
      description: "Order Payment",
      image: "/img/logo.png",
      order_id: res.data.order.id,
      handler: async function (response) {
        // Show processing message
        if (typeof Swal !== "undefined") {
          Swal.fire({
            title: "Verifying Payment",
            text: "Please wait while we verify your payment...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
        }
        await verifyPayment(response, orderId);
      },
      prefill: {
        name: customerName,
        email: "",
        contact: customerPhone,
      },
      theme: {
        color: "#9333ea",
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay modal dismissed during retry");
          showPaymentFailureModal(
            "Payment Cancelled",
            "You have cancelled the payment. Would you like to try again?",
            orderId,
          );
        },
      },
    };

    const retryRazorpayInstance = new Razorpay(options);

    retryRazorpayInstance.on("payment.failed", function (response) {
      const error = response.error;
      console.error("Razorpay payment failed during retry:", error);

      showPaymentFailureModal(
        "Payment Failed",
        `Reason: ${error.description || "Payment could not be processed"}`,
        orderId,
      );
    });

    retryRazorpayInstance.open();
  } catch (error) {
    console.error("Error during payment retry:", error);

    // Close any open modals
    if (typeof Swal !== "undefined") {
      Swal.close();
    }

    // Show error message
    let errorMessage = "An error occurred while retrying payment.";

    if (error.response) {
      errorMessage = error.response.data?.message || "Server error occurred.";
    } else if (error.request) {
      errorMessage = "No response from server. Please check your connection.";
    }

    showPaymentFailureModal(
      "Payment Error",
      errorMessage + " Please try again.",
      orderId,
    );
  }
}

// Show stylish payment failure modal
function showPaymentFailureModal(title, message, orderId) {
  console.log("Showing payment failure modal", { title, message, orderId });

  if (orderId) {
    currentOrderId = orderId;
    // Explicitly mark the payment as failed in the backend
    api
      .markPaymentFailedAxios(orderId)
      .catch((err) => console.error("Error marking payment failed:", err));
  }

  if (typeof Swal === "undefined") {
    console.error("SweetAlert2 is not loaded!");
    const shouldRetry = confirm(
      `${title}\n\n${message}\n\nClick OK to retry payment, Cancel to view order`,
    );
    if (shouldRetry) {
      retryPayment(orderId);
    } else {
      window.location.href = `/order/details/${orderId}`;
    }
    return;
  }

  // Create a stylish modal with animations and icons
  Swal.fire({
    title: "",
    html: `
            <div class="text-center">
                <!-- Animated error icon -->
                <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
                    <svg class="h-14 w-14 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <!-- Title with gradient -->
                <h2 class="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-3">
                    ${title}
                </h2>
                
                <!-- Error message in styled box -->
                <div class="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6 text-left">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">${message}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Order ID badge -->
                <div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-purple-50 mb-6 border border-purple-200">
                    <svg class="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span class="text-sm font-bold text-purple-700">Order ID: #${orderId}</span>
                </div>
                
                <!-- Action buttons text -->
                <p class="text-sm text-gray-500 mb-4 font-medium">What would you like to do?</p>
            </div>
        `,
    icon: null,
    showCancelButton: true,
    confirmButtonColor: "#7e3af2",
    cancelButtonColor: "#6b7280",
    confirmButtonText: `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Payment Now
            </div>
        `,
    showDenyButton: true,
    denyButtonText: `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
            </div>
        `,
    cancelButtonText: `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Order
            </div>
        `,
    reverseButtons: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    focusConfirm: false,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
    customClass: {
      confirmButton:
        "px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium shadow-lg transform transition-all duration-200 hover:scale-105",
      denyButton:
        "px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 font-medium shadow-lg transform transition-all duration-200 hover:scale-105 ml-3",
      cancelButton:
        "px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-medium shadow-lg transform transition-all duration-200 hover:scale-105 ml-3",
      popup: "rounded-2xl shadow-2xl border border-gray-100",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // Call retryPayment function directly without page reload
      retryPayment(orderId);
    } else if (result.isDenied) {
      console.log("Payment cancelled, staying on checkout page");
      // Do nothing, modal closes automatically
    } else if (
      result.dismiss === Swal.DismissReason.cancel ||
      result.dismiss === Swal.DismissReason.backdrop
    ) {
      console.log("Viewing order details:", orderId);
      window.location.href = `/order`;
    }
  });
}

// Show toast notification
function showToast(message, type = "info") {
  if (typeof Swal === "undefined") {
    console.log(`Toast (${type}): ${message}`);
    return;
  }

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const iconMap = {
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  };

  toast.fire({
    icon: iconMap[type] || "info",
    title: message,
  });
}

// Export functions to window
window.placeOrder = placeOrder;
window.copyCouponCode = copyCouponCode;
window.copyCouponCodeInline = copyCouponCodeInline;
window.removeSelectedCoupon = removeSelectedCoupon;
window.showSelectedCoupon = showSelectedCoupon;
window.retryPayment = retryPayment;
