import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

// User profile image
window.handleProfileUpload = handleProfileUpload;
window.closeCropModal = closeCropModal;

let cropper = null;
const cropModal = document.getElementById("cropModal");
const imageToCrop = document.getElementById("image-to-crop");
const cropButton = document.getElementById("crop-button");

async function handleProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validation: Type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    Swal.fire({
      icon: "error",
      title: "Invalid file type",
      text: "Please upload an image (JPG, PNG, GIF, or WebP)",
      confirmButtonColor: "#9333ea"
    });
    event.target.value = "";
    return;
  }

  // Validation: Size
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: "error",
      title: "File too large",
      text: "Profile picture must be less than 2MB",
      confirmButtonColor: "#9333ea"
    });
    event.target.value = "";
    return;
  }

  // Open Cropper Modal
  const reader = new FileReader();
  reader.onload = (e) => {
    imageToCrop.src = e.target.result;
    cropModal.classList.remove("hidden");
    
    if (cropper) {
      cropper.destroy();
    }
    
    cropper = new Cropper(imageToCrop, {
      aspectRatio: 1,
      viewMode: 2,
      guides: true,
      autoCropArea: 1,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true
    });
  };
  reader.readAsDataURL(file);
}

function closeCropModal() {
  cropModal.classList.add("hidden");
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  document.getElementById("profile-upload").value = "";
}

cropButton.addEventListener("click", async () => {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 400,
    height: 400
  });

  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "profile.jpg");

    try {
      closeCropModal();
      showGlobalLoading();
      
      let res = await api.userProfileImgUplaoderAxios(formData);
      
      if (res.data.success) {
        hideGlobalLoading();
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false
        });
        window.location.reload();
      } else {
        hideGlobalLoading();
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: res.data.message || "Failed to upload image",
          confirmButtonColor: "#9333ea"
        });
      }
    } catch (error) {
      hideGlobalLoading();
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong during upload",
        confirmButtonColor: "#9333ea"
      });
    }
  }, "image/jpeg", 0.9);
});

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
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) window.setLoading(submitBtn, true);

    const data = { firstName, lastName, email, number };
    try {
      let res = await api.userProfileAxios(data);

      if (res.data.success) {
        if (res.data.otpVerify) {
          window.location.href = res.data.redirect;
          return;
        }

        hideGlobalLoading();
        if (submitBtn) window.setLoading(submitBtn, false);
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
        hideGlobalLoading();
        if (submitBtn) window.setLoading(submitBtn, false);
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.message || "Failed to update profile",
          confirmButtonColor: "#9333ea",
        });
      }
    } catch (error) {
      console.error(error);
      hideGlobalLoading();
      if (submitBtn) window.setLoading(submitBtn, false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "An unexpected error occurred",
        confirmButtonColor: "#dc2626",
      });
    }
  }
});
