import api from '../adminApi.js';

const url = new URL(window.location.href);

// Expose generate function
window.generateCouponCode = generateCouponCode;

// -------------------------------
// PATTERNS
// -------------------------------
const patterns = {
  title: /^.{3,}$/,
  description: /^.{10,}$/,
  couponCode: /^[A-Z0-9]{3,20}$/,
  amount: /^[1-9]\d*$/
};

// -------------------------------
// OPTIONAL URL MESSAGE
// -------------------------------
if (url.searchParams.get("created") === "true") {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: "Coupon created successfully!"
  });
}

// -------------------------------
// AUTO UPPERCASE COUPON CODE
// -------------------------------
document.getElementById("couponCode")?.addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

// -------------------------------
// FORM SUBMIT
// -------------------------------
document.querySelector("#couponForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = getFormData();

  // Error elements
  const titleErr = document.getElementById("couponTitleErr");
  const codeErr = document.getElementById("couponCodeErr");
  const descErr = document.getElementById("couponDescErr");
  const typeErr = document.getElementById("discountTypeErr");
  const valueErr = document.getElementById("discountValueErr");
  const minErr = document.getElementById("minOrderValueErr");
  const startErr = document.getElementById("startDateErr");
  const endErr = document.getElementById("endDateErr");

  // Clear errors
  titleErr.innerText = "";
  codeErr.innerText = "";
  descErr.innerText = "";
  typeErr.innerText = "";
  valueErr.innerText = "";
  minErr.innerText = "";
  startErr.innerText = "";
  endErr.innerText = "";

  let valid = true;

  // -----------------
  // VALIDATION
  // -----------------
  if (!patterns.title.test(data.title)) {
    titleErr.innerText = "Title must be at least 3 characters";
    valid = false;
  }

  if (!patterns.couponCode.test(data.couponCode)) {
    codeErr.innerText = "Code must be 3-20 uppercase letters/numbers";
    valid = false;
  }

  if (!patterns.description.test(data.desc)) {
    descErr.innerText = "Description must be at least 10 characters";
    valid = false;
  }

  if (!data.discountType) {
    typeErr.innerText = "Select discount type";
    valid = false;
  }

  // FIXED AMOUNT / PERCENTAGE VALIDATION
  if (!patterns.amount.test(data.discountValue)) {
    valueErr.innerText = "Amount must be greater than 0";
    valid = false;
  } else if (data.discountType === 'percentage' && Number(data.discountValue) > 70) {
    valueErr.innerText = "Percentage cannot exceed 70%";
    valid = false;
  }

  if (data.minOrderValue === "" || Number(data.minOrderValue) < 0) {
    minErr.innerText = "Enter valid minimum order value";
    valid = false;
  }

  if (!data.startDate) {
    startErr.innerText = "Start date required";
    valid = false;
  }

  if (!data.endDate) {
    endErr.innerText = "End date required";
    valid = false;
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      endErr.innerText = "End date must be after start date";
      valid = false;
    }
  }

  // -----------------
  // SUBMIT
  // -----------------
  if (valid) {
    const payload = {
      title: data.title,
      couponCode: data.couponCode,
      description: data.desc,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderValue: Number(data.minOrderValue),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status
    };

    console.log("SENDING PAYLOAD:", payload);

    try {
      let res = await api.createCouponAxios(payload);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Coupon Created",
          text: res.data.message
        }).then(() => {
          window.location.href = "/admin/coupen";
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Error",
          text: res.data.message
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error.response?.data?.message || "Something went wrong"
      });
    }
  }
});

// -------------------------------
// GENERATE COUPON CODE
// -------------------------------
function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  const input = document.getElementById("couponCode");
  if (input) input.value = code;
}

// -------------------------------
// GET FORM DATA
// -------------------------------
function getFormData() {
  return {
    title: document.getElementById("couponTitle")?.value.trim(),
    couponCode: document.getElementById("couponCode")?.value.trim(),
    desc: document.getElementById("couponDesc")?.value.trim(),
    discountType: document.getElementById("discountType")?.value,
    discountValue: document.getElementById("discountValue")?.value.trim(),
    minOrderValue: document.getElementById("minOrderValue")?.value.trim(),
    startDate: document.getElementById("startDate")?.value,
    endDate: document.getElementById("endDate")?.value,
    status: document.getElementById("couponStatus")?.value
  };
}
