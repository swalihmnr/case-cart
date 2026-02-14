// /public/js/user/checkout.js
import api from "../api.js";

// Global variables
let appliedCoupon = null;
let couponDiscount = 0;
let selectedCoupon = null;
let checkoutData = {};

// Update address button text - MOVED TO GLOBAL SCOPE
function updateAddressButtonText(text) {
    const dropdownBtn = document.getElementById('addressDropdownBtn');
    if (dropdownBtn) {
        dropdownBtn.textContent = text;
    }
}
console.log('enter  to here')

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get data from window object
    checkoutData = window.checkoutData || {
        subtotal: 0,
        shipping: 0,
        finalAmount: 0,
        totalSavings: 0
    };

    // Initialize coupon functionality
    initCouponSection();
    
    // Initialize saved addresses dropdown
    initSavedAddresses();
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize coupon selection from URL parameter
    checkUrlForCoupon();
    
    // Initialize payment method selection
    initPaymentSelection();
});

// Check if there's a coupon code in URL
async function checkUrlForCoupon() {
    const urlParams = new URLSearchParams(window.location.search);
    const couponCode = urlParams.get('code');
    
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
                    couponData._id
                );
            }
        } catch (error) {
            console.log("Error loading coupon from URL:", error);
        }
    }
}

// Initialize coupon section
function initCouponSection() {
    const toggleBtn = document.getElementById('toggleCoupon');
    const couponForm = document.getElementById('couponForm');
    const chevron = document.getElementById('chevron');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            couponForm.classList.toggle('hidden');
            chevron.classList.toggle('rotate-180');
        });
    }

    // Apply coupon button
    const applyBtn = document.getElementById('applyBtn');
    const couponInput = document.getElementById('couponInput');
    
    if (applyBtn && couponInput) {
        applyBtn.addEventListener('click', async function() {
            const couponCode = couponInput.value.trim();
            
            if (!couponCode) {
                showToast('Please enter a coupon code', 'warning');
                return;
            }
            
            await verifyAndApplyCoupon(couponCode);
        });

        // Allow Enter key to apply coupon
        couponInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyBtn.click();
            }
        });
    }
}

// Initialize saved addresses functionality
function initSavedAddresses() {
    const addressRadios = document.querySelectorAll('input[name="savedAddress"]');
    const dropdownBtn = document.getElementById('addressDropdownBtn');
    const dropdown = document.getElementById('addressDropdown');
    let lastChecked = null;

    // Handle address radio button clicks
    addressRadios.forEach(radio => {
        radio.addEventListener('click', function() {
            handleAddressSelection(this);
        });
    });

    // Toggle dropdown
    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (dropdown && !dropdown.contains(e.target) && 
            dropdownBtn && !dropdownBtn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Function to handle address selection
    function handleAddressSelection(radioElement) {
        if (radioElement === lastChecked) {
            // Deselect address
            radioElement.checked = false;
            lastChecked = null;
            updateAddressButtonText('Use saved address');
            clearAddressForm();
        } else {
            // Select new address
            lastChecked = radioElement;
            populateAddressForm(radioElement);
        }
    }
}

// Initialize payment method selection
function initPaymentSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected style from all options
            paymentOptions.forEach(opt => {
                opt.classList.remove('border-purple-500', 'bg-purple-50');
                opt.classList.add('border-gray-300');
            });
            
            // Add selected style to clicked option
            this.classList.remove('border-gray-300');
            this.classList.add('border-purple-500', 'bg-purple-50');
            
            // Check the radio button
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
            }
        });
    });
}

// Initialize form validation
function initFormValidation() {
    const form = document.getElementById('shippingForm');
    if (!form) return;

    // Clear errors on input
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearError(this.id);
        });
    });
}

// Clear error message for a field
function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Show error for a field
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Validate manual address form
function validateAddressForm() {
    let isValid = true;

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const line1 = document.getElementById("line1").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value;
    const pincode = document.getElementById("pincode").value.trim();

    // Clear all errors
    ['first-name', 'last-name', 'phone', 'line1', 'city', 'state', 'pincode'].forEach(field => {
        clearError(field);
    });

    // Validate each field
    if (!firstName) {
        showError('first-name', 'First name is required');
        isValid = false;
    }

    if (!lastName) {
        showError('last-name', 'Last name is required');
        isValid = false;
    }

    if (!phone) {
        showError('phone', 'Phone number is required');
        isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
        showError('phone', 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    if (!line1) {
        showError('line1', 'Street address is required');
        isValid = false;
    }

    if (!city) {
        showError('city', 'City is required');
        isValid = false;
    }

    if (!state) {
        showError('state', 'Please select a state');
        isValid = false;
    }

    if (!pincode) {
        showError('pincode', 'PIN code is required');
        isValid = false;
    } else if (!/^\d{6}$/.test(pincode)) {
        showError('pincode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    return isValid;
}

// Verify and apply coupon
async function verifyAndApplyCoupon(couponCode) {
    try {
      console.log('before verify coupon api ')
        const res = await api.verifyCouponAxios(couponCode);
        
        if (res.data.success) {
            const couponData = res.data.data;
            
            showToast(res.data.message, 'success');
            
            // Fill coupon details
            document.getElementById("selectedCouponCode").textContent = couponData.couponCode;
            document.getElementById("selectedCouponDesc").textContent = couponData.description;
            document.getElementById("selectedCouponMin").textContent = couponData.MinimumPurchaseValue;
            document.getElementById("selectedCouponDate").textContent = 
                new Date(couponData.endDate).toLocaleDateString();
            
            document.getElementById("selectedCouponBadge").textContent = 
                couponData.discountType === "percentage" 
                    ? `${couponData.discountValue}% OFF` 
                    : `₹${couponData.discountValue} OFF`;
            
            // Set coupon ID
            const container = document.getElementById("selectedCouponDetails");
            container.dataset.couponId = couponData._id;
            
            // Show coupon box and update total
            container.classList.remove("hidden");
            updateTotalWithCoupon(couponData);
            
        } else {
            showToast(res.data.message || 'Invalid coupon code', 'error');
        }
        
    } catch (error) {
        console.error("Coupon verification error:", error);
        showToast('Error verifying coupon', 'error');
    }
}

// Update total with coupon discount
function updateTotalWithCoupon(couponData) {
   const subtotal = parseFloat(checkoutData.subtotal) - parseFloat(checkoutData.totalSavings);
console.log('first subtotal when add coupon ',subtotal)
    
    // Check minimum purchase
    if (subtotal < couponData.MinimumPurchaseValue) {
        showToast(`Minimum purchase of ₹${couponData.MinimumPurchaseValue} required`, 'warning');
        return false;
    }
    
    // Calculate discount
    let discount = 0; 
        discount = parseFloat(couponData.discountValue);
    
    // Prevent discount from exceeding subtotal
    if (discount > subtotal) {
        discount = subtotal;
    }
    
    // Store coupon data
    selectedCoupon = couponData;
    couponDiscount = discount;
    
    // Update UI
    updateTotalDisplay(discount);
    return true;
}

// Update total display - FIXED VERSION
function updateTotalDisplay(discount) {
    const shipping = parseFloat(checkoutData.shipping);
   const subtotal = parseFloat(checkoutData.subtotal) ;
   console.log(discount,'it is the discount')
   console.log(subtotal,'it is the subtotal')
   let savingAmount=(subtotal-checkoutData.finalAmount)
   console.log(savingAmount)
    const newTotal = (subtotal - savingAmount)-couponDiscount
    console.log(newTotal,'it is the new total')
    // Update coupon discount display
    const couponDiscountElement = document.getElementById('couponDiscount');
    const couponDiscountValueElement = document.getElementById('couponDiscountValue');
    
    if (couponDiscountElement) {
        couponDiscountElement.classList.remove('hidden');
    }
    
    if (couponDiscountValueElement) {
        couponDiscountValueElement.textContent = `-₹${discount.toFixed(2)}`;
    }
    
    // Update final total
    const finalTotalElement = document.getElementById('finalTotal');
    if (finalTotalElement) {
        finalTotalElement.textContent = `₹${newTotal.toFixed(2)}`;
    }
    
    // Show coupon savings message
    const savingsElement = document.createElement('p');
    savingsElement.className = 'text-xs text-green-600 mt-2 font-medium flex items-center gap-1 coupon-savings-message';
    savingsElement.innerHTML = `
        <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
        </svg>
        You saved ₹${discount.toFixed(2)} with coupon!
    `;
    
    // Remove existing coupon savings message if any
    const existingSavings = document.querySelector('.coupon-savings-message');
    if (existingSavings) {
        existingSavings.remove();
    }
    
    // Find container to append the message
    let container = document.querySelector('.border-t.pt-4.mt-3');
    if (!container) {
        container = document.querySelector('.space-y-2.sm\\:space-y-3.mb-4.sm\\:mb-6');
    }
    if (!container) {
        container = document.querySelector('.border-t.border-gray-300.pt-3.sm\\:pt-4.mt-2.sm\\:mt-3');
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
    
    // Reset total display
    const couponDiscountElement = document.getElementById('couponDiscount');
    if (couponDiscountElement) {
        couponDiscountElement.classList.add('hidden');
    }
    
    const finalTotalElement = document.getElementById('finalTotal');
    const saleSubtotal =
    parseFloat(checkoutData.subtotal) - parseFloat(checkoutData.totalSavings);

const resetTotal =
    saleSubtotal + parseFloat(checkoutData.shipping);
    console.log(resetTotal,'it is the reset total')
let totalSavings=(checkoutData.subtotal-checkoutData.finalAmount)
console.log(totalSavings,'it is hte total savings ')
if (finalTotalElement) {
    finalTotalElement.textContent = `₹${checkoutData.subtotal-totalSavings}`;
}
    
    
    // Remove coupon savings message
    const existingSavings = document.querySelector('.coupon-savings-message');
    if (existingSavings) {
        existingSavings.remove();
    }
    
    showToast('Coupon removed', 'info');
}

// Copy coupon code
function copyCouponCode() {
    const code = document.getElementById("selectedCouponCode")?.textContent;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Coupon code copied!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
}

// Copy coupon code inline
function copyCouponCodeInline(code) {
    event.stopPropagation(); // Prevent triggering parent click
    navigator.clipboard.writeText(code).then(() => {
        showToast('Coupon code copied!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Populate address form
function populateAddressForm(radioElement) {
    const addressData = {
        firstName: radioElement.getAttribute('data-first-name'),
        lastName: radioElement.getAttribute('data-last-name'),
        phone: radioElement.getAttribute('data-phone'),
        line1: radioElement.getAttribute('data-line1'),
        landmark: radioElement.getAttribute('data-landmark'),
        city: radioElement.getAttribute('data-city'),
        state: radioElement.getAttribute('data-state'),
        pincode: radioElement.getAttribute('data-pincode'),
        addressType: radioElement.getAttribute('data-address-type')
    };

    // Populate form fields
    document.getElementById('first-name').value = addressData.firstName || '';
    document.getElementById('last-name').value = addressData.lastName || '';
    document.getElementById('phone').value = addressData.phone || '';
    document.getElementById('line1').value = addressData.line1 || '';
    document.getElementById('landmark').value = addressData.landmark || '';
    document.getElementById('city').value = addressData.city || '';
    
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        stateSelect.value = addressData.state || '';
    }
    
    document.getElementById('pincode').value = addressData.pincode || '';
    
    // Update button text and close dropdown
    updateAddressButtonText('✓ Address Selected');
    
    const dropdown = document.getElementById('addressDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

// Clear address form
function clearAddressForm() {
    const form = document.getElementById('shippingForm');
    if (form) {
        form.reset();
    }
}

// Show selected coupon details
window.showSelectedCoupon = function(code, title, description, discountValue, discountType, minPurchase, validTill, couponId) {
    selectedCoupon = {
        _id: couponId,
        couponCode: code,
        title,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        MinimumPurchaseValue: parseFloat(minPurchase),
        endDate: validTill
    };

    const container = document.getElementById("selectedCouponDetails");
    if (container) {
        container.dataset.couponId = couponId;
        container.classList.remove('hidden');
    }

    const couponCodeElement = document.getElementById('selectedCouponCode');
    if (couponCodeElement) couponCodeElement.textContent = code;
    
    const couponDescElement = document.getElementById('selectedCouponDesc');
    if (couponDescElement) couponDescElement.textContent = description;
    
    const couponMinElement = document.getElementById('selectedCouponMin');
    if (couponMinElement) couponMinElement.textContent = minPurchase;
    
    const couponDateElement = document.getElementById('selectedCouponDate');
    if (couponDateElement) couponDateElement.textContent = new Date(validTill).toLocaleDateString('en-IN');

    const badgeText = discountType === 'percentage' 
        ? `${discountValue}% OFF` 
        : `₹${discountValue} OFF`;
    
    const couponBadgeElement = document.getElementById('selectedCouponBadge');
    if (couponBadgeElement) couponBadgeElement.textContent = badgeText;
    
    // Update total with coupon
    updateTotalWithCoupon(selectedCoupon);
}

// Place order function
async function placeOrder() {
    try {
        // ----------------------------
        // ADDRESS VALIDATION
        // ----------------------------
        const selectedSavedAddress = document.querySelector('input[name="savedAddress"]:checked');
        let addressPayload = {};

        if (selectedSavedAddress) {
            // Use saved address
            addressPayload = {
                type: "saved",
                addressId: selectedSavedAddress.value
            };
        } else {
            // Validate manual address
            if (!validateAddressForm()) {
                showToast('Please fill all required shipping details', 'warning');
                return;
            }

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
                pinCode: pincode
            };
        }
         // ----------------------------
        //  SHIPPING ADDRESS VALIDATION
        // ----------------------------

        if (!validateAddressForm()) {
          validateAddressForm()
          showToast('Please fill all required shipping details', 'warning');
          
            return;   
        }
        // ----------------------------
        // PAYMENT METHOD VALIDATION
        // ----------------------------
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

       if (!paymentMethod) {
        showToast('Please select a payment method', 'warning');
        return;
       }




        // ----------------------------
        // COUPON ID
        // ----------------------------
        const container = document.getElementById("selectedCouponDetails");
        const couponId = container ? container.dataset.couponId || null : null;

        // ----------------------------
        // FINAL PAYLOAD
        // ----------------------------
        const payload = {
            address: addressPayload,
            paymentMethod,
            couponCode: couponId
        };

        console.log('Sending payload:', payload);

        // Show loading state
        const orderButton = document.querySelector('button[onclick="placeOrder()"]');
        if (orderButton) {
            const originalText = orderButton.textContent;
            orderButton.textContent = 'Processing...';
            orderButton.disabled = true;
        }

        // Submit order
        console.log('before confirmation api')
        console.log(payload)
        const res = await api.confirmationAxios(payload);
        console.log('Response received:', res);

        if (res.data.success) {
            if (res.data.orderId) {
                // Redirect to confirmation page
                window.location.href = `/order/confirm/${res.data.orderId}`;
            } else {
                showToast('Order placed successfully!', 'success');
            }
        } else {
            // Handle errors
            if (res.data.redirect === "/cart") {
                showToast(res.data.message || 'Redirecting to cart...', 'warning');
                setTimeout(() => {
                    window.location.href = res.data.redirect;
                }, 2000);
            } else {
                showToast(res.data.message || 'Order failed', 'error');
            }
        }

    } catch (error) {
        console.error("Order placement error:", error);
        showToast('An error occurred while placing order', 'error');
    } finally {
        // Reset button state
        const orderButton = document.querySelector('button[onclick="placeOrder()"]');
        if (orderButton) {
            orderButton.textContent = 'Place Order';
            orderButton.disabled = false;
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Check if Swal is available
    if (typeof Swal === 'undefined') {
        console.log(`Toast (${type}): ${message}`);
        return;
    }

    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const iconMap = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    toast.fire({
        icon: iconMap[type] || 'info',
        title: message
    });
}

// Export functions to window
window.placeOrder = placeOrder;
window.copyCouponCode = copyCouponCode;
window.copyCouponCodeInline = copyCouponCodeInline;
window.removeSelectedCoupon = removeSelectedCoupon;
window.showSelectedCoupon = showSelectedCoupon; 