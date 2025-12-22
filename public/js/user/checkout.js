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
    //  MANUAL ADDRESS
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
  // COUPON (
  // ----------------------------
  const couponCode = document.getElementById("appliedCode")?.innerText || null;

  // ----------------------------
  // TOTALS (FROM SERVER RENDER)
  // ----------------------------
  const subtotal = Number("<%= subtotal %>");
  const total = subtotal; // shipping free for now

  // ----------------------------
  // FINAL PAYLOAD
  // ----------------------------
  const payload = {
    address: addressPayload,
    paymentMethod,
    couponCode
  };
    const res=await api.confirmationAxios(payload);
    if(res.data.success){
        if(res.data.orderId){
            location.href=`/order/confirm/${res.data.orderId}`
        }
    }
  

  // ----------------------------
  // SEND TO BACKEND
  // ----------------------------

  
    
  
  
}
window.placeOrder=placeOrder
