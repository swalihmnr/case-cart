import api from "../api.js";

const mainImage = document.getElementById("mainImageTag");
const zoomLens = document.getElementById("zoomLens");
const zoomPreviewContainer = document.getElementById("zoomPreviewContainer");
const zoomPreviewImage = document.getElementById("zoomPreviewImage");

let currentImage = mainImage ? mainImage.src : "";
let zoomLevel = 2.5;
let isZoomActive = false;

// Handle image hover for zoom
function handleImageHover(e) {
  if (window.innerWidth < 768 || !mainImage) return; // Disable on mobile

  const container = e.currentTarget;
  const rect = container.getBoundingClientRect();
  const imageRect = mainImage.getBoundingClientRect();

  // Calculate cursor position relative to image
  const x = e.clientX - imageRect.left;
  const y = e.clientY - imageRect.top;

  // Calculate lens size (25% of image size)
  const lensWidth = imageRect.width * 0.25;
  const lensHeight = imageRect.height * 0.25;

  // Calculate max positions
  const maxX = imageRect.width - lensWidth;
  const maxY = imageRect.height - lensHeight;

  // Constrain lens within image bounds
  const lensX = Math.max(0, Math.min(x - lensWidth / 2, maxX));
  const lensY = Math.max(0, Math.min(y - lensHeight / 2, maxY));

  // Show and position lens
  if (zoomLens) {
    zoomLens.style.display = "block";
    zoomLens.style.width = `${lensWidth}px`;
    zoomLens.style.height = `${lensHeight}px`;
    zoomLens.style.left = `${lensX}px`;
    zoomLens.style.top = `${lensY}px`;
  }

  // Update zoom preview
  updateZoomPreview(lensX, lensY, lensWidth, lensHeight);
}

// Show zoom preview box
function showZoomPreview() {
  if (window.innerWidth < 768 || !mainImage || !zoomPreviewContainer) return;

  isZoomActive = true;
  zoomPreviewContainer.style.display = "block";

  // Position zoom preview to the right of main image
  const mainImageRect = mainImage.getBoundingClientRect();
  const container = document.querySelector(".product-image-container");
  if (container) {
    const containerRect = container.getBoundingClientRect();
    zoomPreviewContainer.style.top = `${mainImageRect.top - containerRect.top}px`;
    zoomPreviewContainer.style.left = `${mainImageRect.right - containerRect.left + 20}px`;
  }
}

// Hide zoom preview
// Handle window resize
window.addEventListener("resize", function () {
  if (window.innerWidth < 768 && zoomPreviewContainer) {
    zoomPreviewContainer.style.display = "none";
  }
});

function hideZoomPreview() {
  isZoomActive = false;
  if (zoomLens) zoomLens.style.display = "none";
  if (zoomPreviewContainer) zoomPreviewContainer.style.display = "none";
}

// Update zoom preview content
function updateZoomPreview(x, y, lensWidth, lensHeight) {
  if (!mainImage || !mainImage.complete || !isZoomActive || !zoomPreviewImage) return;

  const naturalWidth = mainImage.naturalWidth;
  const naturalHeight = mainImage.naturalHeight;
  const displayWidth = mainImage.width;
  const displayHeight = mainImage.height;

  // Calculate scale factor
  const scaleX = naturalWidth / displayWidth;
  const scaleY = naturalHeight / displayHeight;

  // Calculate zoomed area
  const zoomedX = x * scaleX * zoomLevel;
  const zoomedY = y * scaleY * zoomLevel;

  // Set zoom preview background
  zoomPreviewImage.style.backgroundImage = `url('${currentImage}')`;
  zoomPreviewImage.style.backgroundSize = `${naturalWidth * zoomLevel}px ${naturalHeight * zoomLevel}px`;
  zoomPreviewImage.style.backgroundPosition = `-${zoomedX}px -${zoomedY}px`;
}

// Change main image
function changeMainImage(imageUrl, element) {
  if (!imageUrl) return;
  currentImage = imageUrl;
  if (mainImage) {
    mainImage.src = imageUrl;
    // Update zoom preview when image loads
    mainImage.onload = () => {
      if (isZoomActive) {
        updateZoomPreview(0, 0, mainImage.width * 0.25, mainImage.height * 0.25);
      }
    };
  }

  if (zoomPreviewImage) {
    zoomPreviewImage.style.backgroundImage = `url('${imageUrl}')`;
  }

  // Reset all thumbnails to unselected state
  document.querySelectorAll(".thumbnail-item").forEach((thumb) => {
    thumb.classList.remove("border-gold-accent", "bg-gold-light/5");
    thumb.classList.add("border-gold-light/10");
  });

  // Highlight the clicked thumbnail
  if (element) {
    element.classList.add("border-gold-accent", "bg-gold-light/5");
    element.classList.remove("border-gold-light/10");
  } else {
    // If element is null, highlight thumbnail matching current imageUrl
    const allThumbs = document.querySelectorAll(".thumbnail-item");
    allThumbs.forEach((thumb) => {
      const img = thumb.querySelector("img");
      if (img && (img.src === imageUrl || img.getAttribute("src") === imageUrl)) {
        thumb.classList.add("border-gold-accent", "bg-gold-light/5");
        thumb.classList.remove("border-gold-light/10");
      }
    });
  }
}

// Update gallery thumbnails and main image for selected variant
function updateGalleryImages(images) {
  if (!images || !Array.isArray(images) || images.length === 0) return;

  const mainImgObj = images.find((img) => img.isMain) || images[0];
  const newMainUrl = mainImgObj ? (mainImgObj.url || mainImgObj) : "";

  if (newMainUrl) {
    changeMainImage(newMainUrl, null);
  }

  const thumbContainer = document.getElementById("thumbnailContainer");
  if (thumbContainer) {
    thumbContainer.innerHTML = images
      .map((img, idx) => {
        const imgUrl = img.url || img;
        const isSelected =
          imgUrl === newMainUrl ||
          (!newMainUrl && img.isMain) ||
          (!images.some((i) => i.isMain) && idx === 0);
        const activeClasses = isSelected
          ? "border-gold-accent bg-gold-light/5"
          : "border-gold-light/10 hover:border-gold-light/40";
        return `
          <button onclick="changeMainImage('${imgUrl}', this)" 
                  class="thumbnail-item w-14 h-18 md:w-16 md:h-20 bg-obsidian-light border rounded flex-shrink-0 p-2 flex items-center justify-center transition-all duration-300 ${activeClasses}">
              <img src="${imgUrl}" alt="Thumbnail" class="w-full h-full object-contain">
          </button>
        `;
      })
      .join("");
  }
}


// Toggle mobile zoom
function toggleMobileZoom() {
  if (window.innerWidth >= 768 || !zoomPreviewContainer || !mainImage) return;

  if (zoomPreviewContainer.style.display === "block") {
    zoomPreviewContainer.style.display = "none";
  } else {
    zoomPreviewContainer.style.display = "block";
    zoomPreviewContainer.style.position = "fixed";
    zoomPreviewContainer.style.top = "50%";
    zoomPreviewContainer.style.left = "50%";
    zoomPreviewContainer.style.transform = "translate(-50%, -50%)";
    zoomPreviewContainer.style.zIndex = "1000";

    // Update zoom preview
    updateZoomPreview(0, 0, mainImage.width * 0.25, mainImage.height * 0.25);
  }
}

// Device selection — active state is managed inside selectVariant
// so no separate listener is needed here.
document.addEventListener("DOMContentLoaded", function () {
  // Close zoom preview when clicking outside on mobile
  document.addEventListener("click", function (e) {
    if (
      window.innerWidth < 768 &&
      zoomPreviewContainer &&
      !zoomPreviewContainer.contains(e.target) &&
      !e.target.closest(".main-image-wrapper")
    ) {
      zoomPreviewContainer.style.display = "none";
    }
  });

  // Trigger the first variant load without simulating a click
  const firstBtn = document.querySelector(".device-btn");
  if (firstBtn) {
    const pid = firstBtn.getAttribute("data-pid");
    const vid = firstBtn.getAttribute("data-vid");
    if (pid && vid) selectVariant(pid, vid, firstBtn);
  }
});

let productID = null;
let variantID = null;
const badge = document.getElementById("special-offer-badge");
const nameEl = document.getElementById("offer-name");
const discountEl = document.getElementById("offer-discount");

async function selectVariant(productId, variantId, clickedBtn) {
  productID = productId;
  variantID = variantId;

  // Update active state on the device buttons
  document.querySelectorAll(".device-btn").forEach((b) => {
    b.classList.remove("border-gold-accent", "bg-gold-light/10", "text-gold-light");
    b.classList.add("border-gold-light/10", "text-gray-400");
    b.classList.remove("hover:border-gold-light/40"); // keep clean
  });
  if (clickedBtn) {
    clickedBtn.classList.add("border-gold-accent", "bg-gold-light/10", "text-gold-light");
    clickedBtn.classList.remove("border-gold-light/10", "text-gray-400");
  }

  // Instant optimistic update from window.productVariants if available
  if (window.productVariants && Array.isArray(window.productVariants)) {
    const localVariant = window.productVariants.find(
      (v) => v._id && v._id.toString() === variantId.toString()
    );
    if (localVariant) {
      if (localVariant.images && localVariant.images.length > 0) {
        updateGalleryImages(localVariant.images);
      }
      if (localVariant.salePrice) {
        const salePriceField = document.getElementById("sale-span");
        if (salePriceField) salePriceField.innerText = `₹${localVariant.salePrice}`;
      }
      if (localVariant.orgPrice) {
        const orgPriceField = document.getElementById("org-span");
        if (orgPriceField) orgPriceField.innerText = `₹${localVariant.orgPrice}`;
      }
      if (localVariant.brandId && localVariant.brandId.name) {
        const brandBadge = document.getElementById("product-brand-badge");
        const brandName = document.getElementById("product-brand-name");
        const brandIcon = document.getElementById("product-brand-icon");
        if (brandBadge && brandName) {
          brandName.innerText = localVariant.brandId.name;
          if (localVariant.brandId.icon && brandIcon) {
            brandIcon.src = localVariant.brandId.icon;
            brandIcon.classList.remove("hidden");
            brandIcon.style.display = "";
          } else if (brandIcon) {
            brandIcon.classList.add("hidden");
          }
          brandBadge.classList.remove("hidden");
        }
      }
    }
  }

  const resVariant = await api.getVariantDataAxios(productID, variantID);
  if (!resVariant || !resVariant.data) return;

  // Sync images from backend response
  if (resVariant.data.images && resVariant.data.images.length > 0) {
    updateGalleryImages(resVariant.data.images);
  }

  if (badge && nameEl && discountEl) {
    if (resVariant.data.disObject && resVariant.data.disObject.isOffer) {
      badge.classList.remove("hidden");
      nameEl.innerText = resVariant.data.disObject.name;
      const type = resVariant.data.disObject.disType === "percentage" ? "%" : "₹";
      discountEl.innerText = `${resVariant.data.disObject.discountTypeValue}${type} OFF`;
    } else {
      badge.classList.add("hidden");
    }
  }

  const salePriceField = document.getElementById("sale-span");
  const orgPriceField = document.getElementById("org-span");

  if (salePriceField) salePriceField.innerText = `₹${resVariant.data.salePrice}`;
  if (orgPriceField) orgPriceField.innerText = `₹${resVariant.data.orgPrice}`;

  const stockCountEl = document.getElementById("stock-count");
  if (stockCountEl) {
    if (resVariant.data.stock <= 0) {
      stockCountEl.innerText = "Out of Stock";
      stockCountEl.className = "text-xs uppercase tracking-widest text-red-500 font-semibold mt-2";
    } else if (resVariant.data.stock <= 5) {
      stockCountEl.innerText = `Only ${resVariant.data.stock} left in stock!`;
      stockCountEl.className = "text-xs uppercase tracking-widest text-orange-500 font-semibold mt-2";
    } else {
      stockCountEl.innerText = "In Stock";
      stockCountEl.className = "text-xs uppercase tracking-widest text-green-500 font-semibold mt-2";
    }
  }

  // Update brand badge for selected variant
  const brandBadge = document.getElementById("product-brand-badge");
  const brandName = document.getElementById("product-brand-name");
  const brandIcon = document.getElementById("product-brand-icon");
  if (brandBadge && brandName) {
    if (resVariant.data.brand && resVariant.data.brand.name) {
      brandName.innerText = resVariant.data.brand.name;
      if (resVariant.data.brand.icon && brandIcon) {
        brandIcon.src = resVariant.data.brand.icon;
        brandIcon.classList.remove("hidden");
        brandIcon.style.display = "";
      } else if (brandIcon) {
        brandIcon.classList.add("hidden");
      }
      brandBadge.classList.remove("hidden");
    }
  }

  // Update wishlist icon for selected variant
  updateWishlistIcon(variantID);
}

function updateWishlistIcon(vId) {
  const wishIcon = document.getElementById("wishlist-icon");
  if (!wishIcon || !window.wishlistItems) return;

  const isInWishlist = window.wishlistItems.some((item) => {
    const itemVarId = item.variantId?._id ? item.variantId._id.toString() : item.variantId?.toString();
    const itemProdId = item.productId?._id ? item.productId._id.toString() : item.productId?.toString();
    return (itemVarId && vId && itemVarId === vId.toString()) || (itemProdId && productID && itemProdId === productID.toString());
  });

  if (isInWishlist) {
    wishIcon.className = "fas fa-heart text-red-500 text-lg transition-colors duration-200";
  } else {
    wishIcon.className = "far fa-heart text-gold-light text-lg transition-colors duration-200";
  }
}

async function toggleWishlist() {
  if (!productID || !variantID) return;

  try {
    const res = await api.toggleWishlistAxios(productID, variantID);
    if (res.data.success) {
      const action = res.data.action;

      if (action === "added") {
        window.wishlistItems.push({ variantId: variantID });
        if (typeof window.showToast === "function") {
          window.showToast("Added to Wishlist", "success");
        }
      } else {
        window.wishlistItems = window.wishlistItems.filter(
          (item) => item.variantId.toString() !== variantID.toString()
        );
        if (typeof window.showToast === "function") {
          window.showToast("Removed from Wishlist", "success");
        }
      }

      // Update icon
      updateWishlistIcon(variantID);

      // Update wishlist count in header
      if (res.data.wishlistCount !== undefined) {
        updateWishlistCountInHeader(res.data.wishlistCount);
      }
    }
  } catch (error) {
    console.log(error);
    const message = error.response?.data?.message || "Please login to add to wishlist";
    if (typeof window.showToast === "function") {
      window.showToast(message, "error");
    }
  }
}

function updateWishlistCountInHeader(count) {
  const badge = document.getElementById("wishlist-count-badge");
  if (badge) {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

async function addToCart() {
  try {
    if (!variantID) {
      const activeBtn = document.querySelector(".device-btn.border-gold-accent") || document.querySelector(".device-btn");
      if (activeBtn) {
        variantID = activeBtn.getAttribute("data-vid");
        productID = activeBtn.getAttribute("data-pid");
      }
    }

    if (!variantID) {
      if (typeof window.showToast === "function") {
        window.showToast("Please select a device model first", "error");
      }
      return;
    }

    const res = await api.addToCartAxios(productID, variantID);
    if (res.data.success) {
      // Update cart count in header
      updateCartCount(res.data.cartCount);
      
      if (typeof window.showToast === "function") {
        window.showToast("Item added to cart collection!", "success");
      }
      
      // Open sliding drawer
      if (typeof window.openCartDrawer === "function") {
        window.openCartDrawer();
      }
    } else {
      if (typeof window.showToast === "function") {
        window.showToast(res.data.message || "Failed to add to cart", "error");
      }
    }
  } catch (error) {
    console.log(error);
    const msg = error.response?.data?.message || "Network error adding to cart";
    if (typeof window.showToast === "function") {
      window.showToast(msg, "error");
    }
    if (error.response?.status === 401) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  }
}

function buyNow() {
  // Ensure variantID is populated
  if (!variantID) {
    const activeBtn = document.querySelector(".device-btn.border-gold-accent") || document.querySelector(".device-btn");
    if (activeBtn) {
      variantID = activeBtn.getAttribute("data-vid");
      productID = activeBtn.getAttribute("data-pid");
    }
  }

  if (!variantID) {
    if (typeof window.showToast === "function") {
      window.showToast("Please select a device model first", "error");
    } else if (typeof Toastify === "function") {
      Toastify({
        text: "Please select a device model first",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#EF4444",
      }).showToast();
    }
    return;
  }

  // Stock check
  const stockCountEl = document.getElementById("stock-count");
  if (stockCountEl && stockCountEl.innerText.toLowerCase().includes("out of stock")) {
    if (typeof window.showToast === "function") {
      window.showToast("Sorry, this item is currently out of stock", "error");
    } else if (typeof Toastify === "function") {
      Toastify({
        text: "Sorry, this item is currently out of stock",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#EF4444",
      }).showToast();
    }
    return;
  }

  // Check login
  if (!window.currentUserId) {
    if (typeof window.showToast === "function") {
      window.showToast("Please login to proceed with Buy Now", "error");
    } else if (typeof Toastify === "function") {
      Toastify({
        text: "Please login to proceed with Buy Now",
        duration: 2500,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#EF4444",
      }).showToast();
    }
    setTimeout(() => {
      window.location.href = "/login";
    }, 800);
    return;
  }

  // Direct checkout in buyNow mode
  window.location.href = `/checkout?type=buyNow&variantId=${variantID}`;
}

function updateCartCount(count) {
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

window.updateCartCount = updateCartCount;

// ==============================================
// PRODUCT RATINGS & REVIEWS LOGIC
// ==============================================
let selectedRatingValue = 0;
const ratingLabels = {
  1: "Poor (1/5)",
  2: "Fair (2/5)",
  3: "Good (3/5)",
  4: "Very Good (4/5)",
  5: "Exceptional (5/5)",
};

function setReviewRating(val) {
  selectedRatingValue = Number(val);
  const ratingInput = document.getElementById("reviewRatingInput");
  if (ratingInput) ratingInput.value = selectedRatingValue;

  const label = document.getElementById("rating-label");
  if (label) {
    label.textContent = ratingLabels[selectedRatingValue] || "Select Stars";
    label.className = "text-xs font-semibold text-gold-accent ml-2";
  }

  highlightStars("star-picker-btn", selectedRatingValue);
}

function previewRating(val) {
  highlightStars("star-picker-btn", val);
  const label = document.getElementById("rating-label");
  if (label) {
    label.textContent = ratingLabels[val] || "";
  }
}

function resetRatingPreview() {
  highlightStars("star-picker-btn", selectedRatingValue);
  const label = document.getElementById("rating-label");
  if (label) {
    label.textContent = selectedRatingValue > 0 ? ratingLabels[selectedRatingValue] : "Select Stars";
  }
}

function setEditReviewRating(val) {
  const ratingInput = document.getElementById("editReviewRatingInput");
  if (ratingInput) ratingInput.value = val;

  const label = document.getElementById("edit-rating-label");
  if (label) {
    label.textContent = ratingLabels[val] || "";
    label.className = "text-xs font-semibold text-gold-accent ml-2";
  }

  highlightStars("edit-star-picker-btn", val);
}

function highlightStars(btnClass, count) {
  const buttons = document.querySelectorAll(`.${btnClass}`);
  buttons.forEach((btn) => {
    const starVal = Number(btn.getAttribute("data-value"));
    if (starVal <= count) {
      btn.classList.remove("text-gray-400");
      btn.classList.add("text-gold-accent");
    } else {
      btn.classList.remove("text-gold-accent");
      btn.classList.add("text-gray-400");
    }
  });
}

async function submitCustomerReview(e) {
  e.preventDefault();
  const rating = Number(document.getElementById("reviewRatingInput")?.value || 0);
  const title = document.getElementById("reviewTitleInput")?.value || "";
  const comment = document.getElementById("reviewCommentInput")?.value || "";

  if (!rating || rating < 1 || rating > 5) {
    return Swal.fire({
      icon: "warning",
      title: "Rating Required",
      text: "Please select a star rating from 1 to 5.",
      confirmButtonColor: "#C9A84C",
    });
  }

  if (!comment.trim() || comment.trim().length < 5) {
    return Swal.fire({
      icon: "warning",
      title: "Review Details Required",
      text: "Please write at least 5 characters in your review comment.",
      confirmButtonColor: "#C9A84C",
    });
  }

  const submitBtn = document.getElementById("submitReviewBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...`;
  }

  try {
    const res = await api.createReviewAxios(window.productId, { rating, title, comment });
    if (res.data && res.data.success) {
      await Swal.fire({
        icon: "success",
        title: "Review Published!",
        text: res.data.message || "Thank you for your feedback.",
        confirmButtonColor: "#C9A84C",
      });
      window.location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Could not submit review",
        text: res.data?.message || "An error occurred.",
        confirmButtonColor: "#C9A84C",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to submit review. Please try again.",
      confirmButtonColor: "#C9A84C",
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Submit Verified Review`;
    }
  }
}

function openEditReviewModal() {
  const modal = document.getElementById("editReviewModal");
  if (!modal) return;

  const currentRating = Number(document.getElementById("editReviewRatingInput")?.value || 5);
  setEditReviewRating(currentRating);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeEditReviewModal() {
  const modal = document.getElementById("editReviewModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function submitEditCustomerReview(e) {
  e.preventDefault();
  const reviewId = document.getElementById("editReviewId")?.value;
  const rating = Number(document.getElementById("editReviewRatingInput")?.value || 5);
  const title = document.getElementById("editReviewTitleInput")?.value || "";
  const comment = document.getElementById("editReviewCommentInput")?.value || "";

  if (!reviewId) return;

  if (!rating || rating < 1 || rating > 5) {
    return Swal.fire("Warning", "Please select a valid rating", "warning");
  }

  if (!comment.trim() || comment.trim().length < 5) {
    return Swal.fire("Warning", "Review comment must be at least 5 characters long", "warning");
  }

  const saveBtn = document.getElementById("saveEditReviewBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Saving...`;
  }

  try {
    const res = await api.updateReviewAxios(reviewId, { rating, title, comment });
    if (res.data && res.data.success) {
      await Swal.fire({
        icon: "success",
        title: "Review Updated!",
        text: res.data.message || "Your review has been updated successfully.",
        confirmButtonColor: "#C9A84C",
      });
      closeEditReviewModal();
      window.location.reload();
    } else {
      Swal.fire("Error", res.data?.message || "Failed to update review", "error");
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "An unexpected error occurred", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = "Save Changes";
    }
  }
}

async function deleteMyReview(reviewId) {
  const result = await Swal.fire({
    title: "Delete your review?",
    text: "Are you sure you want to remove your review for this product?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#c9a84c",
    cancelButtonColor: "#161616",
    confirmButtonText: "Yes, delete review",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      const res = await api.deleteReviewAxios(reviewId);
      if (res.data && res.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Your review has been deleted.",
          confirmButtonColor: "#C9A84C",
        });
        window.location.reload();
      } else {
        Swal.fire("Error", res.data?.message || "Could not delete review", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete review", "error");
    }
  }
}

async function loadProductReviews(page = 1) {
  const container = document.getElementById("reviews-list-container");
  if (!container || !window.productId) return;

  const sort = document.getElementById("reviewSortSelect")?.value || "newest";

  try {
    const res = await api.getProductReviewsAxios(window.productId, page, sort);
    if (res.data && res.data.success) {
      const { reviews, totalCount, totalPages, currentPage, ratingSummary } = res.data.data;

      // Update Header Badges & Breakdown
      const countBadge = document.getElementById("reviews-feed-count-badge");
      if (countBadge) countBadge.textContent = totalCount;

      const summaryAvg = document.getElementById("summary-avg-rating");
      if (summaryAvg) summaryAvg.textContent = (ratingSummary.averageRating || 0).toFixed(1);

      const summaryTotal = document.getElementById("summary-total-reviews");
      if (summaryTotal) {
        summaryTotal.textContent = `Based on ${totalCount} ${totalCount === 1 ? "review" : "reviews"}`;
      }

      // Render Review Cards
      if (reviews.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 bg-obsidian border border-gold-light/5 rounded-lg">
            <div class="w-12 h-12 rounded-full bg-gold-light/5 flex items-center justify-center mx-auto mb-3 text-gold-accent">
              <i class="far fa-comment-dots text-xl"></i>
            </div>
            <h4 class="font-display text-lg text-gold-light">No reviews yet</h4>
            <p class="text-xs text-gray-500 mt-1">Be the first verified purchaser to review this product.</p>
          </div>
        `;
      } else {
        container.innerHTML = reviews
          .map((rev) => {
            const author = rev.user
              ? `${rev.user.firstName || ""} ${rev.user.lastName || ""}`.trim()
              : "Verified Customer";
            const avatar =
              rev.user && rev.user.profileImg
                ? rev.user.profileImg
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            const isMyReview =
              window.currentUserId &&
              rev.user &&
              (rev.user._id === window.currentUserId || rev.user === window.currentUserId);
            const dateStr = new Date(rev.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            let starsHtml = "";
            for (let s = 1; s <= 5; s++) {
              starsHtml += `<i class="fa${s <= rev.rating ? "s" : "r"} fa-star text-[10px]"></i>`;
            }

            return `
              <div class="bg-obsidian border border-gold-light/5 rounded-lg p-5 sm:p-6 space-y-3 transition-all hover:border-gold-light/20">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div class="flex items-center gap-3">
                    <img src="${avatar}" alt="${author}" class="w-9 h-9 rounded-full object-cover border border-gold-light/10 bg-obsidian-light" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-xs text-gold-light">${author}</span>
                        ${
                          rev.isVerifiedPurchase
                            ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <i class="fas fa-check-circle text-[8px]"></i> Verified Purchase
                               </span>`
                            : ""
                        }
                      </div>
                      <span class="text-[10px] text-gray-500">${dateStr}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="flex items-center text-gold-accent">
                      ${starsHtml}
                      <span class="ml-1.5 text-xs font-semibold text-gold-light">${rev.rating}.0</span>
                    </div>

                    ${
                      isMyReview
                        ? `<div class="flex items-center gap-2 ml-2 border-l border-gold-light/10 pl-3">
                             <button onclick="openEditReviewModal()" class="text-xs text-gold-light hover:text-gold-accent" title="Edit">
                               <i class="fas fa-edit"></i>
                             </button>
                             <button onclick="deleteMyReview('${rev._id}')" class="text-xs text-red-400 hover:text-red-300" title="Delete">
                               <i class="fas fa-trash"></i>
                             </button>
                           </div>`
                        : ""
                    }
                  </div>
                </div>

                ${rev.title ? `<h4 class="font-display text-base text-gold-light pt-1">${rev.title}</h4>` : ""}
                <p class="text-xs text-gray-400 leading-relaxed font-light">${rev.comment}</p>
              </div>
            `;
          })
          .join("");
      }

      // Render Pagination
      renderReviewsPagination(currentPage, totalPages);
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
    container.innerHTML = `
      <div class="text-center py-6 text-gray-500 text-xs">
        <p>Could not load reviews at this time.</p>
      </div>
    `;
  }
}

function renderReviewsPagination(currentPage, totalPages) {
  const container = document.getElementById("reviews-pagination-container");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<div class="flex items-center gap-2">`;
  if (currentPage > 1) {
    html += `
      <button onclick="loadProductReviews(${currentPage - 1})"
              class="w-8 h-8 rounded border border-gold-light/10 text-gold-light hover:border-gold-accent hover:text-gold-accent flex items-center justify-center text-xs transition">
        <i class="fas fa-chevron-left text-[10px]"></i>
      </button>
    `;
  }

  for (let p = 1; p <= totalPages; p++) {
    const active = p === currentPage;
    html += `
      <button onclick="loadProductReviews(${p})"
              class="w-8 h-8 rounded border text-xs font-semibold transition ${
                active
                  ? "bg-gold-light text-obsidian border-gold-light"
                  : "border-gold-light/10 text-gold-light hover:border-gold-accent hover:text-gold-accent"
              }">
        ${p}
      </button>
    `;
  }

  if (currentPage < totalPages) {
    html += `
      <button onclick="loadProductReviews(${currentPage + 1})"
              class="w-8 h-8 rounded border border-gold-light/10 text-gold-light hover:border-gold-accent hover:text-gold-accent flex items-center justify-center text-xs transition">
        <i class="fas fa-chevron-right text-[10px]"></i>
      </button>
    `;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// Initial load on page ready
document.addEventListener("DOMContentLoaded", () => {
  if (window.productId) {
    loadProductReviews(1);
  }
});

// Expose review functions to window
window.setReviewRating = setReviewRating;
window.previewRating = previewRating;
window.resetRatingPreview = resetRatingPreview;
window.setEditReviewRating = setEditReviewRating;
window.submitCustomerReview = submitCustomerReview;
window.openEditReviewModal = openEditReviewModal;
window.closeEditReviewModal = closeEditReviewModal;
window.submitEditCustomerReview = submitEditCustomerReview;
window.deleteMyReview = deleteMyReview;
window.loadProductReviews = loadProductReviews;

// Make all required existing functions global for HTML access
window.selectVariant = selectVariant;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.toggleWishlist = toggleWishlist;
window.handleImageHover = handleImageHover;
window.showZoomPreview = showZoomPreview;
window.hideZoomPreview = hideZoomPreview;
window.updateZoomPreview = updateZoomPreview;
window.changeMainImage = changeMainImage;
window.updateGalleryImages = updateGalleryImages;
window.toggleMobileZoom = toggleMobileZoom;

