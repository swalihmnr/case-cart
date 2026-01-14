import api from "../api.js";

async function placeOrder() {
  // ----------------------------
  // ADDRESS HANDLING
  // ----------------------------
  const selectedSavedAddress = document.querySelector('input[name="savedAddress"]:checked');
  const manualForm = document.getElementById("form");
  let addressPayload = {};

  if (selectedSavedAddress) {
    // SAVED ADDRESS
    addressPayload = {
      type: "saved",
      addressId: selectedSavedAddress.value
    };
  } else {
    // MANUAL ADDRESS
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const line1 = document.getElementById("line1").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value;
    const pincode = document.getElementById("pincode").value.trim();

    if (!firstName || !lastName || !phone || !line1 || !city || !state || !pincode) {
      Swal.fire({
        icon: "warning",
        text: "Please fill all shipping details",
        confirmButtonColor: "#667eea"
      });
      return;
    }

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
  // PAYMENT METHOD
  // ----------------------------
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

  if (!paymentMethod) {
    Swal.fire({
      icon: "warning",
      text: "Please select a payment method",
      confirmButtonColor: "#667eea"
    });
    return;
  }

  // ----------------------------
  // COUPON (OPTIONAL)
  // ----------------------------
  const couponCode = document.getElementById("appliedCode")?.innerText || null;

  // ----------------------------
  // FINAL PAYLOAD
  // ----------------------------
  const payload = {
    address: addressPayload,
    paymentMethod,
    couponCode
  };

  const res = await api.confirmationAxios(payload);
  
  if (res.data.success) {
    if (res.data.orderId) {
      location.href = `/order/confirm/${res.data.orderId}`;
    }
  } else if (res.data.success === false && res.data.redirect === "/cart") {
    location.href = res.data.redirect;
  } else {
    Swal.fire({
      icon: "error",
      text: res.data.message,
      confirmButtonColor: "#667eea"
    });
  }
}

window.placeOrder = placeOrder;

// checkout-address.js
(function() {
    'use strict';

    let lastChecked = null;

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeAddressSelection();
        initializeDropdownToggle();
        initializeOutsideClick();
        loadDefaultAddress();
    });

    // Initialize address selection functionality
    function initializeAddressSelection() {
        const addressRadios = document.querySelectorAll('input[name="savedAddress"]');
        
        addressRadios.forEach(radio => {
            radio.addEventListener('click', function() {
                handleAddressSelection(this);
            });
        });
    }

    // Handle address selection/deselection
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

    // Initialize dropdown toggle
    function initializeDropdownToggle() {
        const dropdownBtn = document.getElementById('addressDropdownBtn');
        if (dropdownBtn) {
            dropdownBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = document.getElementById('addressDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('hidden');
                }
            });
        }
    }

    // Close dropdown when clicking outside
    function initializeOutsideClick() {
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('addressDropdown');
            const button = document.getElementById('addressDropdownBtn');
            
            if (dropdown && !dropdown.contains(e.target) && 
                button && !button.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Populate form with saved address data
    window.populateAddressForm = function(radioElement) {
        // Get address data from data attributes
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
        
        // Set state dropdown
        const stateSelect = document.getElementById('state');
        if (stateSelect) {
            stateSelect.value = addressData.state || '';
        }
        
        document.getElementById('pincode').value = addressData.pincode || '';
        
        // Set address type radio buttons
        const addressTypeRadios = document.getElementsByName('addressType');
        addressTypeRadios.forEach(radio => {
            radio.checked = (radio.value === addressData.addressType);
        });

        // Update button text and close dropdown
        updateAddressButtonText('✓ Address Selected');
        
        const dropdown = document.getElementById('addressDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    };

    // Update address button text
    function updateAddressButtonText(text) {
        const button = document.getElementById('addressDropdownBtn');
        if (button) {
            button.textContent = text;
        }
    }

    // Clear the address form
    window.clearAddressForm = function() {
        const form = document.getElementById('form');
        if (form) {
            form.reset();
        }
    };

    // Load default address on page load
    function loadDefaultAddress() {
        const defaultAddressRadio = document.querySelector('input[name="savedAddress"][checked]');
        if (defaultAddressRadio) {
            populateAddressForm(defaultAddressRadio);
            defaultAddressRadio.checked = true;
            lastChecked = defaultAddressRadio;
            updateAddressButtonText('✓ Address Selected');
        }
    }

})();