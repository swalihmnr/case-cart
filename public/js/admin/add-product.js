import adminApi from "../adminApi.js";

const UPLOAD_CONFIG = {
  MIN_IMAGES: 3,
  MAX_IMAGES: 5,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
let devices = [];
let productImages = [];
let currentCropper = null;
let currentFile = null;
let currentFileIndex = 0;
let pendingFiles = [];

// Handle image upload and cropping
window.handleImagesUpload = handleImagesUpload;
window.closeCropModal = closeCropModal;
window.cropAndSave = cropAndSave;
window.renderImagePreviews = renderImagePreviews;
window.removeImage = removeImage;
window.setMainImage = setMainImage;
window.openDeviceModal = openDeviceModal;
window.closeDeviceModal = closeDeviceModal;
window.addDevice = addDevice;
window.removeDevice = removeDevice;
window.createProduct = createProduct;
window.cancelForm = cancelForm;

function handleImagesUpload(event) {
  const files = [...event.target.files];
  if (!files.length) return;

  // Check max image limit
  const totalImages = productImages.length + files.length;
  if (totalImages > UPLOAD_CONFIG.MAX_IMAGES) {
    alert(`You can upload only ${UPLOAD_CONFIG.MAX_IMAGES} images.
You already have ${productImages.length}, and selected ${files.length} more.`);
    event.target.value = "";
    return;
  }

  // Validate all files
  const isInvalid = files.some((file) => {
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      alert(`Invalid file type: ${file.name}. Allowed: JPG, PNG, WEBP, GIF.`);
      return true;
    }
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      alert(`File too large: ${file.name}. Max size: 5MB.`);
      return true;
    }
    return false;
  });

  if (isInvalid) {
    event.target.value = "";
    return;
  }

  // Ready to crop one by one
  pendingFiles = files;
  currentFileIndex = 0;
  processNextImage();
}

function processNextImage() {
  if (currentFileIndex >= pendingFiles.length) {
    document.getElementById("productImages").value = "";
    return;
  }

  currentFile = pendingFiles[currentFileIndex];

  // Validate file
  if (!currentFile.type.startsWith("image/")) {
    alert("Please select only image files");
    currentFileIndex++;
    processNextImage();
    return;
  }

  if (currentFile.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB");
    currentFileIndex++;
    processNextImage();
    return;
  }

  // Show crop modal
  const reader = new FileReader();
  reader.onload = (e) => {
    openCropModal(e.target.result);
  };
  reader.readAsDataURL(currentFile);
}

function openCropModal(imageSrc) {
  const modal = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");

  // Set image source
  cropImage.src = imageSrc;
  cropImage.style.display = "block";

  // Show modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Destroy previous cropper if exists
  if (currentCropper) {
    currentCropper.destroy();
  }

  // Initialize Cropper.js with basic options
  currentCropper = new Cropper(cropImage, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.8,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: true,
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

  // Reset processing
  pendingFiles = [];
  currentFileIndex = 0;
}

function cropAndSave() {
  if (!currentCropper) {
    alert("No image to crop");
    return;
  }

  try {
    const canvas = currentCropper.getCroppedCanvas({
      width: 800,
      height: 800,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!canvas) {
      throw new Error("Could not crop image");
    }

    canvas.toBlob(
      (blob) => {
        const croppedFile = new File([blob], `cropped_${currentFile.name}`, {
          type: "image/jpeg", // Force JPEG for consistency
          lastModified: Date.now(),
        });

        // Add to images array
        const imageData = {
          file: croppedFile,
          preview: URL.createObjectURL(blob),
          isMain: productImages.length === 0,
        };

        productImages.push(imageData);
        renderImagePreviews();

        // Process next image
        closeCropModal();
        currentFileIndex++;

        if (currentFileIndex < pendingFiles.length) {
          processNextImage();
        }
      },
      "image/jpeg",
      0.9,
    ); // Use JPEG with 90% quality
  } catch (error) {
    console.error("Cropping error:", error);
    alert("Error cropping image: " + error.message);
    closeCropModal();
  }
}

// Rest of your functions remain the same...
function renderImagePreviews() {
  const container = document.getElementById("imagesPreview");
  container.innerHTML = "";

  productImages.forEach((img, index) => {
    const div = document.createElement("div");
    div.className = "relative group";
    div.innerHTML = `
            <img src="${img.preview}" alt="Product ${index + 1}" 
                 class="w-full h-32 object-cover rounded-lg border-2 ${img.isMain ? "border-purple-500" : "border-gray-200"}">
            ${
              img.isMain
                ? `
                <span class="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    Main Image
                </span>
            `
                : ""
            }
            <button onclick="removeImage(${index})" 
                    class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            ${
              !img.isMain
                ? `
                <button onclick="setMainImage(${index})" 
                        class="absolute bottom-2 left-2 bg-white text-purple-600 text-xs px-2 py-1 rounded border border-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Set as Main
                </button>
            `
                : ""
            }
        `;
    container.appendChild(div);
  });
}

function removeImage(index) {
  URL.revokeObjectURL(productImages[index].preview);
  productImages.splice(index, 1);

  if (productImages.length > 0 && !productImages.some((img) => img.isMain)) {
    productImages[0].isMain = true;
  }

  renderImagePreviews();
}

function setMainImage(index) {
  productImages.forEach((img, i) => {
    img.isMain = i === index;
  });
  renderImagePreviews();
}

// Device Management functions remain the same...
function openDeviceModal() {
  document.getElementById("deviceModal").classList.remove("hidden");
  document.getElementById("deviceModal").classList.add("flex");
  clearDeviceForm();
}

function closeDeviceModal() {
  document.getElementById("deviceModal").classList.add("hidden");
  document.getElementById("deviceModal").classList.remove("flex");
  clearDeviceForm();
}

function clearDeviceForm() {
  document.getElementById("deviceName").value = "";
  document.getElementById("originalPrice").value = "";
  document.getElementById("salePrice").value = "";
  document.getElementById("stock").value = "";

  [
    "deviceNameError",
    "originalPriceError",
    "salePriceError",
    "stockError",
  ].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
}

function addDevice() {
  const deviceName = document.getElementById("deviceName").value.trim();
  const originalPrice = parseFloat(
    document.getElementById("originalPrice").value,
  );
  const salePrice = parseFloat(document.getElementById("salePrice").value);
  const stock = parseInt(document.getElementById("stock").value);

  let isValid = true;

  if (!deviceName) {
    document.getElementById("deviceNameError").innerText =
      "Device name is required.";
    document.getElementById("deviceNameError").classList.remove("hidden");
    isValid = false;
  } else if (deviceName.length < 2 || deviceName.length > 50) {
    document.getElementById("deviceNameError").innerText =
      "Device name must be 2 to 50 characters.";
    document.getElementById("deviceNameError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("deviceNameError").classList.add("hidden");
  }

  if (!originalPrice || originalPrice <= 0) {
    document.getElementById("originalPriceError").innerText =
      "Original price must be greater than 0.";
    document.getElementById("originalPriceError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("originalPriceError").classList.add("hidden");
  }

  if (!salePrice || salePrice <= 0) {
    document.getElementById("salePriceError").innerText =
      "Sale price must be greater than 0.";
    document.getElementById("salePriceError").classList.remove("hidden");
    isValid = false;
  } else if (salePrice >= originalPrice) {
    document.getElementById("salePriceError").innerText =
      "Sale price must be strictly less than Original price.";
    document.getElementById("salePriceError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("salePriceError").classList.add("hidden");
  }

  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    document.getElementById("stockError").innerText =
      "Stock must be a whole number greater than or equal to 0.";
    document.getElementById("stockError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("stockError").classList.add("hidden");
  }

  if (!isValid) return;

  const device = {
    id: Date.now(),
    name: deviceName,
    originalPrice,
    salePrice,
    stock,
    discount: Math.round(((originalPrice - salePrice) / originalPrice) * 100),
  };

  devices.push(device);
  renderDevices();
  closeDeviceModal();
}

function renderDevices() {
  const container = document.getElementById("devicesList");

  if (devices.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 text-sm py-8">No devices added yet</p>';
    return;
  }

  container.innerHTML = devices
    .map(
      (device) => `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium text-gray-900">${device.name}</h3>
                <button onclick="removeDevice(${device.id})" class="text-red-500 hover:text-red-700">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Original:</span>
                    <span class="line-through text-gray-500">₹
                            ${device.originalPrice.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Sale Price:</span>
                    <span class="font-semibold text-purple-600">₹
                            ${device.salePrice.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Discount:</span>
                    <span class="text-green-600">${device.discount}% OFF</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Stock:</span>
                    <span class="text-gray-900">${device.stock} units</span>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function removeDevice(id) {
  devices = devices.filter((d) => d.id !== id);
  renderDevices();
}

async function createProduct() {
  const productName = document.getElementById("productName").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const status = document.querySelector('input[name="status"]:checked').value;

  let isValid = true;

  if (!productName) {
    document.getElementById("productNameError").innerText =
      "Product name is required.";
    document.getElementById("productNameError").classList.remove("hidden");
    isValid = false;
  } else if (productName.length < 3 || productName.length > 100) {
    document.getElementById("productNameError").innerText =
      "Product name must be between 3 and 100 characters.";
    document.getElementById("productNameError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("productNameError").classList.add("hidden");
  }

  if (!description) {
    document.getElementById("descriptionError").innerText =
      "Description is required.";
    document.getElementById("descriptionError").classList.remove("hidden");
    isValid = false;
  } else if (description.length < 10 || description.length > 1000) {
    document.getElementById("descriptionError").innerText =
      "Description must be between 10 and 1000 characters.";
    document.getElementById("descriptionError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("descriptionError").classList.add("hidden");
  }

  if (!category) {
    document.getElementById("categoryError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("categoryError").classList.add("hidden");
  }

  if (devices.length === 0) {
    document.getElementById("devicesError").classList.remove("hidden");
    isValid = false;
  } else {
    document.getElementById("devicesError").classList.add("hidden");
  }

  if (!isValid) {
    return;
  }

  const formData = new FormData();
  formData.append("productName", productName);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("status", status);
  formData.append("devices", JSON.stringify(devices));

  productImages.forEach((img, index) => {
    formData.append(`images`, img.file);
    if (img.isMain) {
      formData.append("mainImageIndex", index);
    }
  });

  try {
    let res = await adminApi.addProductAxios(formData);

    if (res.data.success) {
      Swal.fire({
        title: "Product added!",
        text: res.data.message,
        icon: "success",
      }).then(() => {
        window.location.href = res.data.redirectUrl;
      });
    }
  } catch (err) {
    console.log("Error:", err);

    // Grab backend error message (409 duplicate)
    const msg = err.response?.data?.message || "Something went wrong";

    Swal.fire({
      title: "Error!",
      text: msg,
      icon: "error",
    });
  }
}

function cancelForm() {
  if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
    window.location.href = "/admin/product-list";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Product form initialized");
});
