import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

// User profile image
window.handleProfileUpload = handleProfileUpload;
async function handleProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: "error",
      title: "File too large",
      text: "Profile picture must be less than 2MB",
      confirmButtonColor: "#9333ea"
    });
    return;
  }

  const newForm = new FormData();
  newForm.append("image", file);

  try {
    // Show loading state
    Swal.fire({
      title: "Uploading...",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false
    });

    let res = await api.userProfileImgUplaoderAxios(newForm);
    if (res.data.success) {
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false
      });
      window.location.reload();
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Upload Failed",
      text: error.response?.data?.message || "Something went wrong during upload",
      confirmButtonColor: "#9333ea"
    });
  }
}

document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const firstName = document.getElementById("f-name").value.trim();
  const lastName = document.getElementById("l-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const number = document.getElementById("number").value.trim();

  const firstnameErr = document.getElementById("f-err");
  const lastnameErr = document.getElementById("l-err");
  const emailErr = document.getElementById("emailErr");
  const numberErr = document.getElementById("numberErr");

  const namePattern = /^[A-Za-z\s]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const numberPattern = /^[0-9]{10}$/;

  let isValid = true;

  // Reset errors
  [firstnameErr, lastnameErr, emailErr, numberErr].forEach(err => err.textContent = "");

  if (!namePattern.test(firstName) || firstName.length < 2) {
    firstnameErr.textContent = "First name must be at least 2 characters (alphabets only)";
    isValid = false;
  }
  if (!namePattern.test(lastName) || lastName.length < 1) {
    lastnameErr.textContent = "Last name is required (alphabets only)";
    isValid = false;
  }
  if (!emailPattern.test(email)) {
    emailErr.textContent = "Please enter a valid email address";
    isValid = false;
  }
  if (!numberPattern.test(number)) {
    numberErr.textContent = "Please enter a valid 10-digit phone number";
    isValid = false;
  }

  if (isValid) {
    showGlobalLoading();
    const data = { firstName, lastName, email, number };
    try {
      let res = await api.userProfileAxios(data);

      if (res.data.success) {
        if (res.data.otpVerify) {
          window.location.href = res.data.redirect;
          return;
        }

        await Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });

        if (res.data.isChanged) {
          window.location.reload();
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.message || "Failed to update profile",
          confirmButtonColor: "#9333ea",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "An unexpected error occurred",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      hideGlobalLoading();
    }
  }
});
