import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("signup-password");
  const eyeIcon = document.getElementById("eye-icon");

  eyeIcon.addEventListener("click", () => {
    toggleVisibility(passwordInput, eyeIcon);
  });

  const confirmPasswordInput = document.getElementById("confirm-password");
  const confirmEyeIcon = document.getElementById("confirm-eye-icon");

  confirmEyeIcon.addEventListener("click", () => {
    toggleVisibility(confirmPasswordInput, confirmEyeIcon);
  });

  function toggleVisibility(input, icon) {
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }

  // Clear errors on input
  const inputs = [
    { id: "first-name", err: "fnameErr" },
    { id: "last-name", err: "lnameErr" },
    { id: "phone", err: "numberErr" },
    { id: "email", err: "emailErr" },
    { id: "signup-password", err: "passwordErr" },
    { id: "confirm-password", err: "cpasswordErr" },
  ];

  inputs.forEach((input) => {
    document.getElementById(input.id).addEventListener("input", function() {
      document.getElementById(input.err).innerText = "";
    });
  });
});
document.querySelector("form").addEventListener("submit", async (event) => {
  event.preventDefault();

  let fname = document.getElementById("first-name").value.trim();
  let lname = document.getElementById("last-name").value.trim();
  let pnumber = document.getElementById("phone").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("signup-password").value.trim();
  let confirmPass = document.getElementById("confirm-password").value.trim();
  const referralCode = document.getElementById("referral-code").value;
  let Err_fname = document.getElementById("fnameErr");
  let Err_lname = document.getElementById("lnameErr");
  let Err_number = document.getElementById("numberErr");
  let Err_email = document.getElementById("emailErr");
  let Err_pass = document.getElementById("passwordErr");
  let Err_cPass = document.getElementById("cpasswordErr");

  // Regex Patterns
  const namePattern = /^[A-Za-z\s]{2,50}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const numberPattern = /^[0-9]{10}$/;

  // Clear all previous errors
  Err_fname.innerText = "";
  Err_lname.innerText = "";
  Err_number.innerText = "";
  Err_email.innerText = "";
  Err_pass.innerText = "";
  Err_cPass.innerText = "";

  let Err_flag = true;

  if (fname === "") {
    Err_fname.innerText = "First name is required";
    Err_flag = false;
  } else if (!namePattern.test(fname)) {
    Err_fname.innerText = "Name must be 2-50 characters (letters only)";
    Err_flag = false;
  }

  if (lname === "") {
    Err_lname.innerText = "Last name is required";
    Err_flag = false;
  } else if (!namePattern.test(lname)) {
    Err_lname.innerText = "Name must be 2-50 characters (letters only)";
    Err_flag = false;
  }

  if (pnumber === "") {
    Err_number.innerText = "Phone number is required";
    Err_flag = false;
  } else if (!numberPattern.test(pnumber)) {
    Err_number.innerText = "Phone number must be exactly 10 digits";
    Err_flag = false;
  }

  if (email === "") {
    Err_email.innerText = "Email is required";
    Err_flag = false;
  } else if (!emailPattern.test(email)) {
    Err_email.innerText = "Please enter a valid email address";
    Err_flag = false;
  }

  if (password === "") {
    Err_pass.innerText = "Password is required";
    Err_flag = false;
  } else if (!passwordPattern.test(password)) {
    Err_pass.innerText = "Must be 8+ chars with uppercase, lowercase, number, and special character";
    Err_flag = false;
  }

  if (confirmPass === "") {
    Err_cPass.innerText = "Please confirm your password";
    Err_flag = false;
  } else if (password !== confirmPass) {
    Err_cPass.innerText = "Passwords do not match";
    Err_flag = false;
  }
  if (Err_flag) {
    console.log("Submitting signup form...");
    const data = {
      firstname: fname,
      lastname: lname,
      number: pnumber,
      email,
      password,
      referralCode: referralCode || null,
    };
    sessionStorage.setItem("email", email);
    localStorage.removeItem("otpTimer");
    localStorage.removeItem("otpExpire");
    showGlobalLoading();
    try {
      let res = await api.userSignupAxios(data);
      if (res.data.success) {
        window.location.href = res.data.redirectUrl;
      } else {
        Swal.fire({
          icon: "warning",
          title: res.data.message,
          confirmButtonColor: "#f6ad55", // orange
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: "Something went wrong during signup",
      });
    } finally {
      hideGlobalLoading();
    }
  }
});
