import adminApi from "../adminApi.js";
let btnMode = null;

// Global variables
let cropper = null;

function getProductData() {
  if (window.product && window.product._id) return window.product;
  const el = document.getElementById("product-data");
  if (el && el.textContent) {
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.error("Failed to parse product-data element", e);
    }
  }
  return {};
}

function getProductImagesData() {
  if (Array.isArray(window.productImages) && window.productImages.length > 0) {
    return window.productImages;
  }
  const el = document.getElementById("product-images-data");
  if (el && el.textContent) {
    try {
      const parsed = JSON.parse(el.textContent);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("Failed to parse product-images-data element", e);
    }
  }
  const prod = getProductData();
  if (Array.isArray(prod.productImages) && prod.productImages.length > 0) {
    return prod.productImages;
  }
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    return prod.images;
  }
  if (Array.isArray(prod.variants) && prod.variants.length > 0) {
    const vWithImgs = prod.variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
    if (vWithImgs) return vWithImgs.images;
  }
  return [];
}

function mapImages(imagesList) {
  return (imagesList || []).map((img, index) => {
    const src = typeof img === "string" ? img : (img.url || img.secure_url || img.path || img.src || "");
    const id = (img && img._id) ? img._id : (index + 1);
    return {
      _id: id,
      id: index + 1,
      src: src,
      isMain: Boolean(img && img.isMain),
    };
  });
}

let product = getProductData();
let productId = product._id ? product._id.toString() : "";
let productsImages = getProductImagesData();
let productImages = mapImages(productsImages);

let currentUploadedImage = null;
let currentImageId = null;

function init() {
  if (!productId || productImages.length === 0) {
    product = getProductData();
    productId = product._id ? product._id.toString() : "";
    productsImages = getProductImagesData();
    productImages = mapImages(productsImages);
  }
  renderProductImages();
  setupBasicInfoEdit();
}

// Initialize the page safely whether DOMContentLoaded has fired or not
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Render product images
function renderProductImages() {
  const container = document.getElementById("productImagesContainer");
  if (!container) return;

  if (!productImages || productImages.length === 0) {
    // If container already has rendered image elements from server, do not wipe it
    if (container.querySelectorAll(".image-container").length > 0) {
      return;
    }
    container.innerHTML = `
      <div class="col-span-full py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
          <i class="fas fa-images text-xl"></i>
        </div>
        <p class="text-sm font-semibold text-gray-700">No Product Images</p>
        <p class="text-xs text-gray-400 mt-1 mb-3">Upload at least 3 high-resolution images</p>
        <button onclick="openImageUploader(this)" data-btnmode="add"
          class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition shadow-sm">
          <i class="fas fa-plus mr-1.5"></i>Upload Images
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  productImages.forEach((image) => {
    const imageElement = document.createElement("div");
    imageElement.id = `image-${image.id}`;
    imageElement.className = `image-container group relative rounded-xl overflow-hidden border ${image.isMain ? "main-image" : "border-gray-200 hover:border-gray-300"} bg-gray-50 transition duration-200`;
    imageElement.innerHTML = `
      <div class="aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden">
        <img src="${image.src || '/img/placeholder.jpg'}" alt="Product image" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='/img/placeholder.jpg'">
      </div>
      ${image.isMain ? '<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Main</span>' : ""}
      <div class="image-overlay">
        <div class="flex items-center gap-1.5 p-2">
          <!-- SET MAIN BUTTON -->
          <button onclick="setAsMain('${image.id}')" 
            class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-yellow-500 flex items-center justify-center shadow hover:scale-110 transition" 
            title="Set as Main">
            <i class="fas fa-star text-xs"></i>
          </button>

          <!-- UPDATE BUTTON -->
          <button onclick="updateImage('${image._id}', this)" data-btnmode="edit"
            class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-blue-600 flex items-center justify-center shadow hover:scale-110 transition" 
            title="Crop & Replace">
            <i class="fas fa-crop-alt text-xs"></i>
          </button>

          <!-- DELETE BUTTON -->
          <button onclick="deleteImage('${image._id}')" 
            class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-red-600 flex items-center justify-center shadow hover:scale-110 transition" 
            title="Delete Image">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    `;

    container.appendChild(imageElement);
  });
}

// Set image as main
async function setAsMain(imageId) {
  try {
    window.showGlobalLoading();
    let res = await adminApi.setMainAxios(productId, imageId);
    if (res.data.success) {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: " added as Main!",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "warning",
        title: " Something went wrong",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    window.hideGlobalLoading();
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to set as main image",
    });
  }
}

// Re-render images

// Update image
function updateImage(imageId, btn) {
  btnMode = btn.dataset.btnmode;
  currentImageId = imageId;
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      // Store the uploaded image and open crop modal
      currentUploadedImage = e.target.result;
      openCropModal(currentUploadedImage, "Update Image");
    };
    reader.readAsDataURL(file);
  };

  // Trigger file selection
  fileInput.click();
}

// Open image uploader
function openImageUploader(btn) {
  btnMode = btn.dataset.btnmode;
  console.log(btn);
  document.getElementById("addImagesModal").classList.remove("hidden");
}

// Handle image upload for adding new images
function handleImagesUpload(event) {
  const files = event.target.files;
  if (files.length === 0) return;

  // For simplicity, we'll process the first image
  const file = files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    // Store the uploaded image and open crop modal
    currentUploadedImage = e.target.result;
    openCropModal(currentUploadedImage, "New Image");
  };
  reader.readAsDataURL(file);
}

// Open crop modal
function openCropModal(imageSrc, imageName = "Image") {
  document.getElementById("cropModal").classList.remove("hidden");
  document.getElementById("editingImageName").textContent = imageName;

  const image = document.getElementById("cropImage");
  image.src = imageSrc;
  // Initialize cropper
  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(image, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 0.8,
    responsive: true,
    guides: true,
  });
}

// Close crop modal
function closeCropModal() {
  document.getElementById("cropModal").classList.add("hidden");
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  // Clear the uploaded image
  currentUploadedImage = null;
  currentImageId = null;
}

// Update aspect ratio
function updateAspectRatio() {
  if (!cropper) return;

  const ratio = document.getElementById("aspectRatio").value;
  if (ratio === "0") {
    cropper.setAspectRatio(NaN);
  } else {
    cropper.setAspectRatio(eval(ratio));
  }
}

// Rotate image
function rotateImage(degrees) {
  if (cropper) {
    cropper.rotate(degrees);
  }
}

// Crop and save image
function cropAndSave() {
  if (!cropper) return;

  // Get cropped canvas
  const canvas = cropper.getCroppedCanvas();

  // Convert to blob
  let file;
  canvas.toBlob(async function (blob) {
    const ext = blob.type.split("/").pop();
    const fileName = `cropped-image.${ext}`;
    file = new File([blob], fileName, { type: blob.type });
    const newForm = new FormData();
    newForm.append("image", file);
    newForm.append("imageId", currentImageId);
    const produtId = productId || (product && product._id);

    const cropBtn = document.querySelector('button[onclick="cropAndSave()"]');
    if (cropBtn) window.setLoading(cropBtn, true);
    window.showGlobalLoading();

    // Re-render images
    if (btnMode === "edit") {
      try {
        let res = await adminApi.editImgProductAxios(newForm, produtId);
        console.log(res.data);
        if (res.data.success) {
          console.log("hlow ");
          closeCropModal();
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: " image updated!",
            text: res.data.message,
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            document.getElementById("addImagesModal").classList.add("hidden");
            location.reload();
          });
        } else {
          if (cropBtn) window.setLoading(cropBtn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "warning",
            title: " Something went wrong",
            text: res.data.message,
          });
        }
      } catch (error) {
        if (cropBtn) window.setLoading(cropBtn, false);
        window.hideGlobalLoading();
        console.log(error);
        Swal.fire({
          icon: "warning",
          title: " someting went wrong!",
          text: error.response?.data?.message || "Error updating image",
          timer: 1800,
          showConfirmButton: false,
        });
      }
    }
    if (btnMode === "add") {
      try {
        const res = await adminApi.uploadImgProductAxios(productId, newForm);
        console.log(res);
        if (res.data && res.data.success) {
          closeCropModal();
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: "Product Image Added!",
            text: res.data.message,
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            const addModal = document.getElementById("addImagesModal");
            if (addModal) addModal.classList.add("hidden");
            location.reload();
          });
        } else {
          if (cropBtn) window.setLoading(cropBtn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "warning",
            title: "Something went wrong!",
            text: res?.data?.message || "Failed to add image",
            timer: 1800,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        if (cropBtn) window.setLoading(cropBtn, false);
        window.hideGlobalLoading();
        Swal.fire({
          icon: "warning",
          title: "Something went wrong!",
          text: error.response?.data?.message || "Error uploading image",
          timer: 1800,
          showConfirmButton: false,
        }).then(() => {
          const addModal = document.getElementById("addImagesModal");
          if (addModal) addModal.classList.add("hidden");
          location.reload();
        });
      }
    }
    if (btnMode === "variant") {
      try {
        const res = await adminApi.uploadVariantImgAxios(currenctVariantId, newForm);
        console.log("Variant image upload response:", res);
        if (res && res.data && res.data.success) {
          closeCropModal();
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: "Variant Photo Uploaded!",
            text: res.data.message || "Image uploaded successfully",
            timer: 1600,
            showConfirmButton: false,
          }).then(() => {
            location.reload();
          });
        } else {
          if (cropBtn) window.setLoading(cropBtn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "warning",
            title: "Upload issue",
            text: res?.data?.message || "Failed to upload variant image",
          });
        }
      } catch (error) {
        if (cropBtn) window.setLoading(cropBtn, false);
        window.hideGlobalLoading();
        console.error("Variant image upload error:", error);
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: error.response?.data?.message || "Error uploading variant image",
        });
      }
      return;
    }
    if (btnMode === "variant-replace") {
      try {
        const res = await adminApi.replaceVariantImgAxios(currenctVariantId, newForm);
        console.log("Variant image replace response:", res);
        if (res && res.data && res.data.success) {
          closeCropModal();
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: "Variant Photo Updated!",
            text: res.data.message || "Image updated successfully",
            timer: 1600,
            showConfirmButton: false,
          }).then(() => {
            location.reload();
          });
        } else {
          if (cropBtn) window.setLoading(cropBtn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "warning",
            title: "Update issue",
            text: res?.data?.message || "Failed to replace variant image",
          });
        }
      } catch (error) {
        if (cropBtn) window.setLoading(cropBtn, false);
        window.hideGlobalLoading();
        console.error("Variant image replace error:", error);
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error.response?.data?.message || "Error replacing variant image",
        });
      }
      return;
    }
  });
}

// Save images (for adding new images)
function saveImages() {
  // This function is now handled by the crop flow
  // We keep it for compatibility with the HTML
  if (!currentUploadedImage) {
    Swal.fire({
      icon: "warning",
      title: " someting went wrong!",
      text: "upload Image first",
      timer: 1800,
      showConfirmButton: false,
    });
    return;
  }
}

async function deleteImage(id) {
  if (productImages.length <= 3) {
    Swal.fire({
      icon: "warning",
      title: "Minimum Requirement",
      text: "A minimum of 3 images is required for each product.",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  Swal.fire({
    title: "Are you sure?",
    text: "This image will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      window.showGlobalLoading();
      let res = await adminApi.editImgDeleteAxios(id, productId);

      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: "Image deleted!",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } catch (err) {
      window.hideGlobalLoading();
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: err.response?.data?.message || "Something went wrong",
        timer: 1800,
        showConfirmButton: false,
      });
    }
  });
}

// Setup basic information edit functionality
function setupBasicInfoEdit() {
  const editBasicInfoBtn = document.getElementById("editBasicInfoBtn");
  const cancelBasicInfoBtn = document.getElementById("cancelBasicInfoBtn");
  const saveBasicInfoBtn = document.getElementById("saveBasicInfoBtn");
  const basicInfoSection = document.getElementById("basicInfoSection");
  const basicInfoActions = document.getElementById("basicInfoActions");

  // Display elements
  const productNameDisplay = document.getElementById("productNameDisplay");

  const categoryDisplay = document.getElementById("categoryDisplay");
  const descriptionDisplay = document.getElementById("descriptionDisplay");

  // Edit elements
  const productNameEdit = document.getElementById("productNameEdit");

  const categoryEdit = document.getElementById("categoryEdit");
  const descriptionEdit = document.getElementById("descriptionEdit");

  // Edit button click handler
  editBasicInfoBtn.addEventListener("click", function () {
    // Initialize edit fields with current display values
    productNameEdit.value = productNameDisplay.textContent.trim();
    descriptionEdit.value = descriptionDisplay.textContent.trim();
    
    const currentCatId = categoryDisplay.getAttribute('data-category-id');
    if (currentCatId) {
      categoryEdit.value = currentCatId;
    }

    // Hide display elements
    productNameDisplay.classList.add("hidden");

    categoryDisplay.classList.add("hidden");
    descriptionDisplay.classList.add("hidden");

    // Show edit elements
    productNameEdit.classList.remove("hidden");

    categoryEdit.classList.remove("hidden");
    descriptionEdit.classList.remove("hidden");

    // Show action buttons
    basicInfoActions.classList.remove("hidden");

    // Add edit mode styling
    basicInfoSection.classList.add("edit-mode", "p-4");

    // Hide edit button
    editBasicInfoBtn.classList.add("hidden");
  });

  // Cancel button click handler
  cancelBasicInfoBtn.addEventListener("click", function () {
    // Reset values to original
    productNameEdit.value = productNameDisplay.textContent.trim();
    descriptionEdit.value = descriptionDisplay.textContent.trim();
    
    const originalCatId = categoryDisplay.getAttribute('data-category-id');
    if (originalCatId) {
      categoryEdit.value = originalCatId;
    }

    // Hide edit elements
    productNameEdit.classList.add("hidden");
    categoryEdit.classList.add("hidden");
    descriptionEdit.classList.add("hidden");

    // Show display elements
    productNameDisplay.classList.remove("hidden");
    categoryDisplay.classList.remove("hidden");
    descriptionDisplay.classList.remove("hidden");

    // Hide action buttons
    basicInfoActions.classList.add("hidden");

    // Remove edit mode styling
    basicInfoSection.classList.remove("edit-mode", "p-4");

    // Show edit button
    editBasicInfoBtn.classList.remove("hidden");
  });

  // Save button click handler
  saveBasicInfoBtn.addEventListener("click", async () => {
    // Update display values with edited values
    // Hide edit elements
    productNameEdit.classList.add("hidden");
    categoryEdit.classList.add("hidden");
    descriptionEdit.classList.add("hidden");

    // Show display elements
    productNameDisplay.classList.remove("hidden");

    categoryDisplay.classList.remove("hidden");
    descriptionDisplay.classList.remove("hidden");

    // Hide action buttons
    basicInfoActions.classList.add("hidden");

    // Remove edit mode styling
    basicInfoSection.classList.remove("edit-mode", "p-4");

    // Show edit button
    editBasicInfoBtn.classList.remove("hidden");

    const data = {
      productName: productNameEdit.value.trim(),
      category: categoryEdit.value,
      description: descriptionEdit.value.trim(),
    };

    if (
      !data.productName ||
      data.productName.length < 3 ||
      data.productName.length > 100
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Product Name must be between 3 and 100 characters.",
        timer: 2000,
        showConfirmButton: false,
      });
      // Re-show edit elements to allow user to fix
      cancelBasicInfoBtn.click();
      editBasicInfoBtn.click();
      return;
    }

    if (
      !data.description ||
      data.description.length < 10 ||
      data.description.length > 1000
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Product Description must be between 10 and 1000 characters.",
        timer: 2000,
        showConfirmButton: false,
      });
      // Re-show edit elements to allow user to fix
      cancelBasicInfoBtn.click();
      editBasicInfoBtn.click();
      return;
    }

    try {
      window.setLoading(saveBasicInfoBtn, true);
      window.showGlobalLoading();
      const res = await adminApi.editProductBasicInfoAxios(data, productId);
      if (res.data.success) {
        window.hideGlobalLoading();
        window.setLoading(saveBasicInfoBtn, false);
        Swal.fire({
          icon: "success",
          title: "product info updated!",
          text: res.data.message,
          timer: 1800,
          showConfirmButton: false,
        }).then(() => {
          location.reload();
        });
      } else {
        window.setLoading(saveBasicInfoBtn, false);
        window.hideGlobalLoading();
        Swal.fire({
          icon: "warning",
          title: "Something went wrong!",
          text: res.data.message,
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      window.setLoading(saveBasicInfoBtn, false);
      window.hideGlobalLoading();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update product info",
      });
    }
  });
}

let currenctVariantId;

function triggerVariantImageUpload(variantId) {
  if (variantId) {
    currenctVariantId = variantId;
  }
  if (!currenctVariantId) {
    Swal.fire({
      icon: "warning",
      title: "Select Variant",
      text: "Variant ID not found",
    });
    return;
  }
  btnMode = "variant";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      currentUploadedImage = evt.target.result;
      openCropModal(currentUploadedImage, "Variant Photo");
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
}

function renderVariantModalImages(variant) {
  const container = document.getElementById("editVariantImagesList");
  if (!container) return;

  const images = (variant && variant.images && Array.isArray(variant.images)) ? variant.images : [];
  if (images.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-4 px-3 text-center border border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center">
        <i class="fas fa-image text-gray-300 text-2xl mb-1"></i>
        <p class="text-xs text-gray-500 font-medium">No photos uploaded for this variant</p>
        <button type="button" onclick="triggerVariantImageUpload('${variant._id}')" class="mt-2 text-xs text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 cursor-pointer">
          <i class="fas fa-plus"></i> Upload First Photo
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = images.map((img, idx) => {
    const src = typeof img === "string" ? img : (img.url || img.secure_url || img.path || "");
    const imgId = img._id || idx;
    const isMain = Boolean(img.isMain);

    return `
      <div class="relative group rounded-xl overflow-hidden border ${isMain ? 'border-2 border-purple-600 ring-2 ring-purple-100' : 'border border-gray-200'} bg-white aspect-square flex items-center justify-center shadow-2xs">
        <img src="${src}" alt="Variant Image" class="w-full h-full object-cover" onerror="this.src='/img/placeholder.jpg'">
        ${isMain ? '<span class="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">Main</span>' : ''}
        
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-1.5 p-1">
          ${!isMain ? `
            <button type="button" onclick="setMainVariantImage('${variant._id}', '${imgId}')" title="Set as Main" class="w-7 h-7 rounded-full bg-white text-yellow-500 hover:scale-110 flex items-center justify-center shadow transition text-xs cursor-pointer">
              <i class="fas fa-star"></i>
            </button>
          ` : ''}
          <button type="button" onclick="deleteVariantImage('${variant._id}', '${imgId}')" title="Delete Photo" class="w-7 h-7 rounded-full bg-white text-red-600 hover:scale-110 flex items-center justify-center shadow transition text-xs cursor-pointer">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function setMainVariantImage(variantId, imageId) {
  try {
    window.showGlobalLoading();
    const res = await adminApi.setMainVariantImgAxios(variantId, imageId);
    window.hideGlobalLoading();
    if (res.data && res.data.success) {
      Swal.fire({
        icon: "success",
        title: "Main Photo Updated",
        text: res.data.message || "Main variant photo updated successfully",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Action Failed",
        text: res.data?.message || "Failed to update main variant photo",
      });
    }
  } catch (error) {
    window.hideGlobalLoading();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.response?.data?.message || "Error updating main variant photo",
    });
  }
}

async function deleteVariantImage(variantId, imageId) {
  const result = await Swal.fire({
    title: "Delete Variant Photo?",
    text: "This image will be permanently removed from this variant.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
  });

  if (!result.isConfirmed) return;

  try {
    window.showGlobalLoading();
    const res = await adminApi.deleteVariantImgAxios(variantId, imageId);
    window.hideGlobalLoading();
    if (res.data && res.data.success) {
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: res.data.message || "Variant photo deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Failed",
        text: res.data?.message || "Failed to delete variant photo",
      });
    }
  } catch (error) {
    window.hideGlobalLoading();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.response?.data?.message || "Error deleting variant photo",
    });
  }
}

async function editVariant(variantId) {
  document.getElementById("editVariantModal").classList.remove("hidden");
  currenctVariantId = variantId;

  try {
    const res = await adminApi.variantDetialsAxios(variantId);
    const variant = res.data.variant;
    if (!variant) return;
    currenctVariantId = variant._id;

    renderVariantModalImages(variant);

    document.getElementById("editVariantModel").value =
      variant.deviceModel || "";
    document.getElementById("editVariantStock").value = variant.stock ?? 0;
    document.getElementById("editVariantOriginalPrice").value =
      variant.orgPrice ?? 0;
    document.getElementById("editVariantSalePrice").value =
      variant.salePrice ?? 0;
  } catch (error) {
    console.error("Failed to load variant details:", error);
  }
}

async function saveVariantChanges() {
  const id = currenctVariantId;

  const model = document.getElementById("editVariantModel").value.trim();
  const stock = parseInt(document.getElementById("editVariantStock").value);
  const originalPrice = parseFloat(
    document.getElementById("editVariantOriginalPrice").value,
  );
  const salePrice = parseFloat(
    document.getElementById("editVariantSalePrice").value,
  );

  let isValid = true;
  let errorMessage = "";

  if (!model || model.length < 2 || model.length > 50) {
    errorMessage = "Variant Model must be between 2 and 50 characters.";
    isValid = false;
  } else if (!originalPrice || originalPrice <= 0) {
    errorMessage = "Original price must be greater than 0.";
    isValid = false;
  } else if (!salePrice || salePrice <= 0) {
    errorMessage = "Sale price must be greater than 0.";
    isValid = false;
  } else if (salePrice > originalPrice) {
    errorMessage = "Sale price cannot be greater than Original price.";
    isValid = false;
  } else if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    errorMessage = "Stock must be a whole number greater than or equal to 0.";
    isValid = false;
  }

  if (!isValid) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Input",
      text: errorMessage,
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  const data = {
    deviceModel: model,
    stock: stock,
    orgPrice: originalPrice,
    salePrice: salePrice,
  };
  try {
    const saveBtn = document.getElementById("saveVariantBtn");
    if (saveBtn) window.setLoading(saveBtn, true);
    window.showGlobalLoading();

    document.getElementById("editVariantModal").classList.add("hidden");
    const res = await adminApi.editVariantSaveAxios(id, data);
    if (res.data.success) {
      if (saveBtn) window.setLoading(saveBtn, false);
      window.hideGlobalLoading();
      Swal.fire({
        icon: "success",
        title: "Variant updated successfully",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      if (saveBtn) window.setLoading(saveBtn, false);
      window.hideGlobalLoading();
      document.getElementById("editVariantModal").classList.remove("hidden");
      Swal.fire({
        icon: "warning",
        title: "something went wrong",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    const saveBtn = document.getElementById("saveVariantBtn");
    if (saveBtn) window.setLoading(saveBtn, false);
    window.hideGlobalLoading();
    document.getElementById("editVariantModal").classList.remove("hidden");
    Swal.fire({
      icon: "warning",
      title: "something went wrong",
      text: error.response?.data?.message || "Error updating variant",
      timer: 1800,
      showConfirmButton: false,
    });
  }
}

async function toggleListUnlist(id, btn) {
  try {
    if (btn) window.setLoading(btn, true);
    const res = await adminApi.toggleListUnlistAxios(id);
    if (res.data.success) {
      if (btn) {
        window.setLoading(btn, false);
        const isListed = res.data.message.toLowerCase() === "listed";
        
        if (isListed) {
          btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Unlist';
          btn.className = "px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 text-xs font-semibold rounded-lg transition w-20 text-center";
        } else {
          btn.innerHTML = '<i class="fas fa-eye mr-1"></i>List';
          btn.className = "px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-semibold rounded-lg transition w-20 text-center";
        }
        
        Toastify({
          text: `Variant ${res.data.message}`,
          duration: 2000,
          gravity: "top",
          position: "right",
          backgroundColor: isListed ? "#10B981" : "#6B7280",
        }).showToast();
      }
    }
  } catch (err) {
    if (btn) window.setLoading(btn, false);
    console.error("Listing toggle error:", err);
    Swal.fire({
      icon: "error",
      title: "Action Failed",
      text: err.response?.data?.message || "Failed to update listing status",
    });
  }
}

function closeModal() {
  document.getElementById("editVariantModal").classList.add("hidden");
  document.getElementById("addImagesModal").classList.add("hidden");
  document.getElementById("addVariantModal").classList.add("hidden");
}

function openAddVariantModal() {
  document.getElementById("addVariantModal").classList.remove("hidden");
}

function closeAddVariantModal() {
  document.getElementById("addVariantModal").classList.add("hidden");
}

async function saveNewVariant() {
  const model = document.getElementById("addVariantModel").value.trim();
  const stock = parseInt(document.getElementById("addVariantStock").value);
  const originalPrice = parseFloat(
    document.getElementById("addVariantOriginalPrice").value,
  );
  const salePrice = parseFloat(
    document.getElementById("addVariantSalePrice").value,
  );

  let isValid = true;
  let errorMessage = "";

  if (!model || model.length < 2 || model.length > 50) {
    errorMessage = "Variant Model must be between 2 and 50 characters.";
    isValid = false;
  } else if (!originalPrice || originalPrice <= 0) {
    errorMessage = "Original price must be greater than 0.";
    isValid = false;
  } else if (!salePrice || salePrice <= 0) {
    errorMessage = "Sale price must be greater than 0.";
    isValid = false;
  } else if (salePrice > originalPrice) {
    errorMessage = "Sale price cannot be greater than Original price.";
    isValid = false;
  } else if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    errorMessage = "Stock must be a whole number greater than or equal to 0.";
    isValid = false;
  }

  if (!isValid) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Input",
      text: errorMessage,
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  const data = {
    deviceModel: model,
    stock: stock,
    orgPrice: originalPrice,
    salePrice: salePrice,
  };

  try {
    const saveBtn = document.getElementById("saveNewVariantBtn");
    if (saveBtn) window.setLoading(saveBtn, true);

    const res = await adminApi.addVariantAxios(productId, data);
    if (res.data.success) {
      if (saveBtn) window.setLoading(saveBtn, false);
      Swal.fire({
        icon: "success",
        title: "Variant added successfully",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      if (saveBtn) window.setLoading(saveBtn, false);
      Swal.fire({
        icon: "warning",
        title: "Something went wrong",
        text: res.data.message,
        timer: 1800,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    const saveBtn = document.getElementById("saveNewVariantBtn");
    if (saveBtn) window.setLoading(saveBtn, false);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.response?.data?.message || "Failed to add variant",
    });
  }
}

let activeContext = { type: "product", variantId: null, modelName: null };

function selectVariantRow(variantId) {
  if (!variantId) return;

  // 1. Remove highlight on all rows and hide badges
  document.querySelectorAll(".variant-table-row").forEach((row) => {
    row.classList.remove("bg-purple-50/80", "border-l-4", "border-purple-600", "shadow-xs");
    const indicator = row.querySelector(".selected-indicator");
    if (indicator) indicator.classList.add("hidden");
  });

  // 2. Highlight target row
  const targetRow = document.getElementById(`variant-row-${variantId}`);
  let modelName = "";
  if (targetRow) {
    targetRow.classList.add("bg-purple-50/80", "border-l-4", "border-purple-600", "shadow-xs");
    const indicator = targetRow.querySelector(".selected-indicator");
    if (indicator) indicator.classList.remove("hidden");
    modelName = targetRow.getAttribute("data-variant-model") || "Variant";
  }

  // 3. Find variant in product data
  const prod = getProductData();
  let variant = null;
  if (prod && Array.isArray(prod.variants)) {
    variant = prod.variants.find((v) => v._id && v._id.toString() === variantId.toString());
  }
  if (!variant && window.product && Array.isArray(window.product.variants)) {
    variant = window.product.variants.find((v) => v._id && v._id.toString() === variantId.toString());
  }

  modelName = variant?.deviceModel || modelName || "Variant";
  currenctVariantId = variantId;
  activeContext = {
    type: "variant",
    variantId: variantId,
    modelName: modelName,
    images: variant?.images || [],
  };

  // 4. Update Images card header
  const titleEl = document.getElementById("imagesCardTitle");
  if (titleEl) titleEl.textContent = `${modelName} Images`;

  const descEl = document.getElementById("imagesCardDesc");
  if (descEl) descEl.textContent = `Managing photos for ${modelName}`;

  const switchBtn = document.getElementById("switchProductBtn");
  if (switchBtn) {
    switchBtn.classList.remove("hidden");
    switchBtn.classList.add("inline-flex");
  }

  const addBtnText = document.getElementById("addImageCardBtnText");
  if (addBtnText) addBtnText.textContent = "Add Photo";

  const countHint = document.getElementById("imagesCountHint");
  if (countHint) {
    countHint.innerHTML = `<i class="fas fa-layer-group mr-1 text-purple-600"></i>Active Model: <strong>${modelName}</strong>`;
  }

  // 5. Render variant images in right panel
  renderVariantImagesInCard(variant?.images || [], variantId, modelName);

  // Background refresh to guarantee fresh state
  adminApi.variantDetialsAxios(variantId).then((res) => {
    if (res && res.data && res.data.variant) {
      const freshV = res.data.variant;
      activeContext.images = freshV.images || [];
      renderVariantImagesInCard(freshV.images || [], variantId, freshV.deviceModel || modelName);
    }
  }).catch((e) => console.error("Error fetching fresh variant photos:", e));
}

function renderVariantImagesInCard(imagesList, variantId, modelName) {
  const container = document.getElementById("productImagesContainer");
  if (!container) return;

  container.innerHTML = "";

  const images = Array.isArray(imagesList) ? imagesList : [];
  if (images.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
          <i class="fas fa-camera text-xl"></i>
        </div>
        <p class="text-sm font-semibold text-gray-700">No Photos for ${modelName || 'this variant'}</p>
        <p class="text-xs text-gray-400 mt-1 mb-3">Upload custom photo specifically for this device model</p>
        <button onclick="triggerVariantImageUpload('${variantId}')"
          class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition shadow-sm cursor-pointer">
          <i class="fas fa-plus mr-1.5"></i>Upload Photo
        </button>
      </div>
    `;
    return;
  }

  images.forEach((image, index) => {
    const src = typeof image === "string" ? image : (image.url || image.secure_url || image.path || "");
    const imgId = (image && image._id) ? image._id : (index + 1);
    const isMain = Boolean(image && image.isMain);

    const imageElement = document.createElement("div");
    imageElement.id = `variant-card-image-${imgId}`;
    imageElement.className = `image-container group relative rounded-xl overflow-hidden border ${isMain ? "main-image" : "border-gray-200 hover:border-gray-300"} bg-gray-50 transition duration-200`;
    imageElement.innerHTML = `
      <div class="aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden">
        <img src="${src || '/img/placeholder.jpg'}" alt="${modelName}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='/img/placeholder.jpg'">
      </div>
      ${isMain ? '<span class="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Main</span>' : ""}
      <div class="image-overlay">
        <div class="flex items-center gap-1.5 p-2">
          <!-- SET MAIN BUTTON -->
          ${!isMain ? `
            <button onclick="setMainVariantImage('${variantId}', '${imgId}')" 
              class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-yellow-500 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer" 
              title="Set as Main for ${modelName}">
              <i class="fas fa-star text-xs"></i>
            </button>
          ` : `
            <span class="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow text-xs" title="Current Main Image">
              <i class="fas fa-star text-xs"></i>
            </span>
          `}

          <!-- UPDATE / CROP BUTTON -->
          <button onclick="updateVariantImage('${variantId}', '${imgId}')"
            class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-blue-600 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer" 
            title="Crop & Replace">
            <i class="fas fa-crop-alt text-xs"></i>
          </button>

          <!-- DELETE BUTTON -->
          <button onclick="deleteVariantImage('${variantId}', '${imgId}')" 
            class="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-red-600 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer" 
            title="Delete Image">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    `;

    container.appendChild(imageElement);
  });
}

function updateVariantImage(variantId, imageId) {
  btnMode = "variant-replace";
  currenctVariantId = variantId;
  currentImageId = imageId;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      currentUploadedImage = evt.target.result;
      openCropModal(currentUploadedImage, "Update Variant Image");
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
}

function selectProductContext() {
  // 1. Remove highlight on all rows and hide badges
  document.querySelectorAll(".variant-table-row").forEach((row) => {
    row.classList.remove("bg-purple-50/80", "border-l-4", "border-purple-600", "shadow-xs");
    const indicator = row.querySelector(".selected-indicator");
    if (indicator) indicator.classList.add("hidden");
  });

  activeContext = { type: "product", variantId: null, modelName: null };

  // 2. Update Images card header
  const titleEl = document.getElementById("imagesCardTitle");
  if (titleEl) titleEl.textContent = "Product Images";

  const descEl = document.getElementById("imagesCardDesc");
  if (descEl) descEl.textContent = "General gallery photos";

  const switchBtn = document.getElementById("switchProductBtn");
  if (switchBtn) {
    switchBtn.classList.add("hidden");
    switchBtn.classList.remove("inline-flex");
  }

  const addBtnText = document.getElementById("addImageCardBtnText");
  if (addBtnText) addBtnText.textContent = "Add Images";

  const countHint = document.getElementById("imagesCountHint");
  if (countHint) {
    countHint.innerHTML = `<i class="fas fa-info-circle mr-1 text-purple-500"></i>Min 3, Max 5 images`;
  }

  // 3. Render general product images
  renderProductImages();
}

function handleCardAddImage() {
  if (activeContext.type === "variant" && activeContext.variantId) {
    triggerVariantImageUpload(activeContext.variantId);
  } else {
    const addBtn = document.getElementById("addImageCardBtn");
    openImageUploader(addBtn || { dataset: { btnmode: "add" } });
  }
}

// Make all functions global for HTML access
window.renderProductImages = renderProductImages;
window.setAsMain = setAsMain;
window.updateImage = updateImage;
window.openCropModal = openCropModal;
window.closeCropModal = closeCropModal;
window.updateAspectRatio = updateAspectRatio;
window.rotateImage = rotateImage;
window.cropAndSave = cropAndSave;
window.openImageUploader = openImageUploader;
window.handleImagesUpload = handleImagesUpload;
window.saveImages = saveImages;
window.setupBasicInfoEdit = setupBasicInfoEdit;
window.editVariant = editVariant;
window.saveVariantChanges = saveVariantChanges;
window.closeModal = closeModal;
window.deleteImage = deleteImage;
window.toggleListUnlist = toggleListUnlist;
window.openAddVariantModal = openAddVariantModal;
window.closeAddVariantModal = closeAddVariantModal;
window.saveNewVariant = saveNewVariant;
window.triggerVariantImageUpload = triggerVariantImageUpload;
window.renderVariantModalImages = renderVariantModalImages;
window.setMainVariantImage = setMainVariantImage;
window.deleteVariantImage = deleteVariantImage;
window.selectVariantRow = selectVariantRow;
window.selectProductContext = selectProductContext;
window.handleCardAddImage = handleCardAddImage;
window.updateVariantImage = updateVariantImage;
window.renderVariantImagesInCard = renderVariantImagesInCard;

