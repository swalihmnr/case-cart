import api from "../adminApi.js";

const url = new URL(window.location.href);

// Expose generate function
window.generateCouponCode = generateCouponCode;

const form = document.getElementById("couponForm");
const couponId = form.dataset.couponId;

// -------------------------------
// PATTERNS
// -------------------------------
const patterns = {
  title: /^.{3,}$/,
  description: /^.{10,}$/,
  couponCode: /^[A-Z0-9]{3,20}$/,
  amount: /^[1-9]\d*$/,
};

// -------------------------------
// OPTIONAL URL MESSAGE
// -------------------------------
if (url.searchParams.get("created") === "true") {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: "Coupon created successfully!",
  });
}

// -------------------------------
// AUTO UPPERCASE COUPON CODE
// -------------------------------
document.getElementById("couponCode")?.addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

// -------------------------------
// TOGGLE MAXIMUM DISCOUNT FIELD
// -------------------------------
const maxDiscountWrapper = document.getElementById("maxDiscountWrapper");
document.getElementById("discountType")?.addEventListener("change", (e) => {
  if (e.target.value === "percentage") {
    maxDiscountWrapper.style.display = "block";
  } else {
    maxDiscountWrapper.style.display = "none";
    document.getElementById("maximumDiscount").value = "";
  }
});

// -------------------------------
// CLEAR ERRORS ON INPUT/CHANGE
// -------------------------------
const fieldsToClear = [
  { input: "couponTitle", error: "couponTitleErr" },
  { input: "couponCode", error: "couponCodeErr" },
  { input: "couponDesc", error: "couponDescErr" },
  { input: "discountType", error: "discountTypeErr", event: "change" },
  { input: "discountValue", error: "discountValueErr" },
  { input: "maximumDiscount", error: "maximumDiscountErr" },
  { input: "minOrderValue", error: "minOrderValueErr" },
  { input: "startDate", error: "startDateErr", event: "change" },
  { input: "endDate", error: "endDateErr", event: "change" },
];

fieldsToClear.forEach((field) => {
  const inputEl = document.getElementById(field.input);
  const errorEl = document.getElementById(field.error);
  if (inputEl && errorEl) {
    inputEl.addEventListener(field.event || "input", () => {
      errorEl.innerText = "";
    });
  }
});

// -------------------------------
// CANCEL BUTTON
// -------------------------------
document.getElementById("cancelBtn")?.addEventListener("click", () => {
  window.history.back();
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
  const maxDiscErr = document.getElementById("maximumDiscountErr");
  const minErr = document.getElementById("minOrderValueErr");
  const startErr = document.getElementById("startDateErr");
  const endErr = document.getElementById("endDateErr");

  // Clear errors
  titleErr.innerText = "";
  codeErr.innerText = "";
  descErr.innerText = "";
  typeErr.innerText = "";
  valueErr.innerText = "";
  if (maxDiscErr) maxDiscErr.innerText = "";
  minErr.innerText = "";
  startErr.innerText = "";
  endErr.innerText = "";

  let valid = true;

  // -----------------
  // VALIDATION
  // -----------------

  if (!data.title) {
    titleErr.innerText = "Coupon Title is required";
    valid = false;
  } else if (data.title.length < 3 || data.title.length > 50) {
    titleErr.innerText = "Title must be between 3 and 50 characters";
    valid = false;
  } else if (data.title.trim().length === 0) {
    titleErr.innerText = "Title cannot be only spaces";
    valid = false;
  }

  if (!data.couponCode) {
    codeErr.innerText = "Coupon Code is required";
    valid = false;
  } else if (!patterns.couponCode.test(data.couponCode)) {
    codeErr.innerText = "Code must be 3-20 uppercase letters/numbers";
    valid = false;
  }

  if (!data.desc) {
    descErr.innerText = "Description is required";
    valid = false;
  } else if (data.desc.length < 10 || data.desc.length > 500) {
    descErr.innerText = "Description must be between 10 and 500 characters";
    valid = false;
  } else if (data.desc.trim().length === 0) {
    descErr.innerText = "Description cannot be only spaces";
    valid = false;
  }

  if (!data.discountType) {
    typeErr.innerText = "Select discount type";
    valid = false;
  }

  // Fixed Amount / Percentage Validation
  if (!patterns.amount.test(data.discountValue)) {
    valueErr.innerText = "Amount must be greater than 0";
    valid = false;
  } else if (
    data.discountType === "percentage" &&
    Number(data.discountValue) > 70
  ) {
    valueErr.innerText = "Percentage cannot exceed 70%";
    valid = false;
  }

  if (data.minOrderValue === "" || Number(data.minOrderValue) < 0) {
    minErr.innerText = "Enter valid minimum order value";
    valid = false;
  } else if (
    data.discountType === "fixedamount" &&
    Number(data.discountValue) >= Number(data.minOrderValue)
  ) {
    valueErr.innerText =
      "Discount amount must be less than minimum order value";
    valid = false;
  }

  if (
    data.maximumDiscount !== "" &&
    !patterns.amount.test(data.maximumDiscount) &&
    Number(data.maximumDiscount) !== 0
  ) {
    if (maxDiscErr)
      maxDiscErr.innerText = "Max discount must be a positive number";
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
      couponId,
      title: data.title,
      couponCode: data.couponCode,
      description: data.desc,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      maximumDiscount: Number(data.maximumDiscount) || 0,
      minOrderValue: Number(data.minOrderValue),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    };

    console.log("SENDING PAYLOAD:", payload);

    try {
      let res = await api.editCouponAxios(payload);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Coupon Updated",
          text: res.data.message,
        }).then(() => {
          window.location.href = "/admin/coupen";
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Error",
          text: res.data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error.response?.data?.message || "Something went wrong",
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
    maximumDiscount: document.getElementById("maximumDiscount")?.value.trim(),
    minOrderValue: document.getElementById("minOrderValue")?.value.trim(),
    startDate: document.getElementById("startDate")?.value,
    endDate: document.getElementById("endDate")?.value,
    status: document.getElementById("couponStatus")?.value,
  };
}
