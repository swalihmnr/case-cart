import adminApi from "../adminApi.js";

let currentCropper = null;
let currentFile = null;
let croppedImageBlob = null;

window.submitBrand = submitBrand;
window.closeCropModal = closeCropModal;
window.cropAndSave = cropAndSave;

document.addEventListener("DOMContentLoaded", () => {
  const brandIconInput = document.getElementById("brandIcon");
  if (brandIconInput) {
    brandIconInput.addEventListener("change", handleImageIconUpload);
  }
});

function handleImageIconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    alert("Invalid file type. Allowed: JPG, PNG, WEBP, GIF.");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB");
    event.target.value = "";
    return;
  }

  currentFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    openCropModal(e.target.result);
  };
  reader.readAsDataURL(file);
}

function openCropModal(imageSrc) {
  const modal = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");

  cropImage.src = imageSrc;
  cropImage.style.display = "block";

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (currentCropper) {
    currentCropper.destroy();
  }

  currentCropper = new Cropper(cropImage, {
    aspectRatio: 1, // square for brand icon
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.8,
    guides: true,
    center: true,
    cropBoxMovable: true,
    cropBoxResizable: true,
  });
}

function closeCropModal() {
  const modal = document.getElementById("cropModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (currentCropper) {
    currentCropper.destroy();
    currentCropper = null;
  }
}

function cropAndSave() {
  if (!currentCropper) return;

  const canvas = currentCropper.getCroppedCanvas({
    width: 400,
    height: 400,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  if (!canvas) {
    alert("Could not crop image");
    return;
  }

  canvas.toBlob(
    (blob) => {
      croppedImageBlob = blob;
      alert("Image cropped successfully!");
      closeCropModal();
    },
    "image/jpeg",
    0.9
  );
}

async function submitBrand(event) {
  let action = event.currentTarget.dataset.action;
  let mode = event.currentTarget.dataset.mode;
  let id = event.currentTarget.dataset.id;

  let brandName = document.getElementById("brandName").value.trim();
  let brandDescription = document.getElementById("brandDescription").value.trim();
  let errName = document.getElementById("nameErr");
  let errDes = document.getElementById("desErr");

  errName.innerText = "";
  errDes.innerText = "";
  let flag = true;

  if (!brandName) {
    errName.innerText = "Brand Name is required.";
    flag = false;
  } else if (brandName.length < 2 || brandName.length > 50) {
    errName.innerText = "Brand Name must be between 2 and 50 characters.";
    flag = false;
  } else if (!/^[A-Za-z0-9\s\-]+$/.test(brandName)) {
    errName.innerText = "Brand Name can only contain letters, numbers, spaces, and hyphens.";
    flag = false;
  }

  if (!brandDescription) {
    errDes.innerText = "Brand Description is required.";
    flag = false;
  } else if (brandDescription.length < 5 || brandDescription.length > 500) {
    errDes.innerText = "Brand Description must be between 5 and 500 characters.";
    flag = false;
  }

  if (flag) {
    let formData = new FormData();
    formData.append("action", action);
    formData.append("brandName", brandName);
    formData.append("brandDescription", brandDescription);

    if (croppedImageBlob) {
      formData.append("icon", croppedImageBlob, `cropped_${currentFile.name}`);
    } else {
      const brandIconInput = document.getElementById("brandIcon");
      if (brandIconInput && brandIconInput.files.length > 0) {
        formData.append("icon", brandIconInput.files[0]);
      }
    }

    const btn = event.currentTarget;
    try {
      if (btn) window.setLoading(btn, true);
      window.showGlobalLoading();

      let res;
      if (mode === "edit") {
        res = await adminApi.editBrandAxios(id, formData);
      } else {
        res = await adminApi.addBrandAxios(formData);
      }

      if (res.data.success) {
        if (btn) window.setLoading(btn, false);
        window.hideGlobalLoading();
        Swal.fire({
          icon: "success",
          title: mode === "edit" ? "Updated!" : "Brand Added!",
          text: res.data.message || "Operation successful",
          timer: 1800,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = res.data.redirectUrl;
        });
      } else {
        throw new Error(res.data.message || "Operation failed");
      }
    } catch (error) {
      if (btn) window.setLoading(btn, false);
      window.hideGlobalLoading();
      Swal.fire({
        icon: "warning",
        title: "Error!",
        text: error.response?.data?.message || error.message || "Something went wrong",
        timer: 1800,
        showConfirmButton: false,
      });
    }
  }
}
