import api from "../api.js";

 const mainImage = document.getElementById('mainImageTag');
        const zoomLens = document.getElementById('zoomLens');
        const zoomPreviewContainer = document.getElementById('zoomPreviewContainer');
        const zoomPreviewImage = document.getElementById('zoomPreviewImage');
        
        let currentImage = mainImage.src;
        let zoomLevel = 2.5;
        let isZoomActive = false;

        // Handle image hover for zoom
        function handleImageHover(e) {
            if (window.innerWidth < 768) return; // Disable on mobile
            
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
            zoomLens.style.display = 'block';
            zoomLens.style.width = `${lensWidth}px`;
            zoomLens.style.height = `${lensHeight}px`;
            zoomLens.style.left = `${lensX}px`;
            zoomLens.style.top = `${lensY}px`;
            
            // Update zoom preview
            updateZoomPreview(lensX, lensY, lensWidth, lensHeight);
        }

        // Show zoom preview box
        function showZoomPreview() {
            if (window.innerWidth < 768) return;
            
            isZoomActive = true;
            zoomPreviewContainer.style.display = 'block';
            
            // Position zoom preview to the right of main image
            const mainImageRect = mainImage.getBoundingClientRect();
            const containerRect = document.querySelector('.product-image-container').getBoundingClientRect();
            
            zoomPreviewContainer.style.top = `${mainImageRect.top - containerRect.top}px`;
            zoomPreviewContainer.style.left = `${mainImageRect.right - containerRect.left + 20}px`;
        }

        // Hide zoom preview
        function hideZoomPreview() {
            isZoomActive = false;
            zoomLens.style.display = 'none';
            zoomPreviewContainer.style.display = 'none';
        }

        // Update zoom preview content
        function updateZoomPreview(x, y, lensWidth, lensHeight) {
            if (!mainImage.complete || !isZoomActive) return;
            
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
            mainImage.src = imageUrl;
            
            // Update thumbnails active state
            document.querySelectorAll('.thumbnail-item').forEach(thumb => {
                thumb.classList.remove('active');
            });
            
            element.classList.add('active');
            
            // Update zoom preview when image loads
            mainImage.onload = () => {
                if (isZoomActive) {
                    updateZoomPreview(0, 0, mainImage.width * 0.25, mainImage.height * 0.25);
                }
            };
        }

        // Toggle mobile zoom (for mobile devices)
        function toggleMobileZoom() {
            if (window.innerWidth >= 768) return;
            
            if (zoomPreviewContainer.style.display === 'block') {
                zoomPreviewContainer.style.display = 'none';
            } else {
                zoomPreviewContainer.style.display = 'block';
                zoomPreviewContainer.style.position = 'fixed';
                zoomPreviewContainer.style.top = '50%';
                zoomPreviewContainer.style.left = '50%';
                zoomPreviewContainer.style.transform = 'translate(-50%, -50%)';
                zoomPreviewContainer.style.zIndex = '1000';
                
                // Update zoom preview
                updateZoomPreview(0, 0, mainImage.width * 0.25, mainImage.height * 0.25);
            }
        }

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth < 768) {
                zoomPreviewContainer.style.display = 'none';
            }
        });

        // Existing functions
        function switchTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('text-purple-600');
                btn.classList.add('text-gray-600');
            });
            
            // Show selected tab content
            document.getElementById(tabId).classList.remove('hidden');
            
            // Add active class to clicked tab button
            event.target.classList.add('active');
            event.target.classList.add('text-purple-600');
            event.target.classList.remove('text-gray-600');
        }

        // Device selection
        document.addEventListener('DOMContentLoaded', function() {
            // Device button selection
            const deviceBtns = document.querySelectorAll('.device-btn');
            deviceBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    deviceBtns.forEach(b => {
                        b.classList.remove('border-purple-600', 'bg-purple-50', 'text-purple-600');
                        b.classList.add('border-gray-200', 'text-gray-700');
                    });
                    this.classList.add('border-purple-600', 'bg-purple-50', 'text-purple-600');
                    this.classList.remove('border-gray-200', 'text-gray-700');
                });
            });
        
            
            // Buy now button
            
            // Close zoom preview when clicking outside on mobile
            document.addEventListener('click', function(e) {
                if (window.innerWidth < 768 && 
                    !zoomPreviewContainer.contains(e.target) && 
                    !e.target.closest('.main-image-wrapper')) {
                    zoomPreviewContainer.style.display = 'none';
                }
            });
        });
        window.addEventListener('DOMContentLoaded', () => {
          const firstBtn = document.querySelector('.device-btn');
          if (firstBtn) {
            firstBtn.click(); 
          }
        });
        let productID=null
        let variantID=null
       async function selectVariant(productId,variantId){
           productID=productId;
           variantID=variantId;
           console.log(variantID,productID)
          const resVariant= await api.getVariantDataAxios(productID,variantID)
           await api.productDetialAxios(productID)
          
            const salePriceField=document.getElementById('sale-span')
            const orgPriceField=document.getElementById("org-span");
           
             salePriceField.innerText = `₹${resVariant.data.salePrice}`;
             orgPriceField.innerText = `₹${resVariant.data.orgPrice}`;
          }
        
        async function addToCart(){
            console.log(productID,variantID)
           const res=await api.addToCartAxios(productID,variantID)
           if(res.data.success){
             Swal.fire({
             icon: 'success',
             title: 'added',
             text: res.data.message,
             confirmButtonColor: '#667eea'
           }).then(()=>{
            location.reload()
           })
           }else{
             Swal.fire({
             icon: 'warning',
             text: res.data.message,
             confirmButtonColor: '#667eea'
           });
           }
        }

async function buyNow(){
    window.location.href=`/checkout?type=buyNow&productId=${productID}&variantId=${variantID}`
}
// Make all required functions global for HTML access
// Make all required functions global for HTML access
window.selectVariant=selectVariant;
window.addToCart=addToCart
window.buyNow=buyNow
window.handleImageHover = handleImageHover;
window.showZoomPreview = showZoomPreview;
window.hideZoomPreview = hideZoomPreview;
window.updateZoomPreview = updateZoomPreview;
window.changeMainImage = changeMainImage;
window.toggleMobileZoom = toggleMobileZoom;
window.switchTab = switchTab;
