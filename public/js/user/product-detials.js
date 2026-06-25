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

  // Update thumbnails active state
  document.querySelectorAll(".thumbnail-item").forEach((thumb) => {
    thumb.classList.remove("active");
  });

  if (element) {
    element.classList.add("active");
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

// Device selection
document.addEventListener("DOMContentLoaded", function () {
  const deviceBtns = document.querySelectorAll(".device-btn");
  deviceBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      deviceBtns.forEach((b) => {
        b.classList.remove("border-gold-accent", "bg-gold-light/10", "text-gold-light");
        b.classList.add("border-gold-light/20", "text-gray-400");
      });
      this.classList.add("border-gold-accent", "bg-gold-light/10", "text-gold-light");
      this.classList.remove("border-gold-light/20", "text-gray-400");
    });
  });

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
});

window.addEventListener("DOMContentLoaded", () => {
  const firstBtn = document.querySelector(".device-btn");
  if (firstBtn) {
    firstBtn.click();
  }
});

let productID = null;
let variantID = null;
const badge = document.getElementById("special-offer-badge");
const nameEl = document.getElementById("offer-name");
const discountEl = document.getElementById("offer-discount");

async function selectVariant(productId, variantId) {
  productID = productId;
  variantID = variantId;
  
  const resVariant = await api.getVariantDataAxios(productID, variantID);
  
  if (badge && nameEl && discountEl) {
    if (resVariant.data.disObject.isOffer) {
      badge.classList.remove("hidden");
      nameEl.innerText = resVariant.data.disObject.name;
      const type = resVariant.data.disObject.disType === "percentage" ? "%" : "₹";
      discountEl.innerText = `${resVariant.data.disObject.discountTypeValue}${type} OFF`;
    } else {
      badge.classList.add("hidden");
    }
  }
  
  await api.productDetialAxios(productID);

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

  // Update wishlist icon for selected variant
  updateWishlistIcon(variantID);
}

function updateWishlistIcon(vId) {
  const wishIcon = document.getElementById("wishlist-icon");
  if (!wishIcon || !window.wishlistItems) return;

  const isInWishlist = window.wishlistItems.some(
    (item) => item.variantId && item.variantId.toString() === vId.toString()
  );

  if (isInWishlist) {
    wishIcon.className = "w-6 h-6 text-red-500 transition-colors duration-200";
  } else {
    wishIcon.className = "w-6 h-6 text-gold-light transition-colors duration-200";
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
    if (typeof window.showToast === "function") {
      window.showToast("Network error adding to cart", "error");
    }
  }
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

async function buyNow() {
  window.location.href = `/checkout?type=buyNow&productId=${productID}&variantId=${variantID}`;
}

// Make all required functions global for HTML access
window.selectVariant = selectVariant;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.toggleWishlist = toggleWishlist;
window.handleImageHover = handleImageHover;
window.showZoomPreview = showZoomPreview;
window.hideZoomPreview = hideZoomPreview;
window.updateZoomPreview = updateZoomPreview;
window.changeMainImage = changeMainImage;
window.toggleMobileZoom = toggleMobileZoom;
