      // Global variables
        let cropper = null;
        const productsImages = window.productImages
        console.log(productsImages);
       let productImages = productsImages.map((img, index) => ({
        id: index + 1,
        src: img.url,
        isMain: img.isMain
        }));

        let currentUploadedImage = null;
        let currentImageId = null;

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            renderProductImages();
            setupBasicInfoEdit();
        });

        // Render product images
        function renderProductImages() {
            const container = document.getElementById('productImagesContainer');
            container.innerHTML = '';
            
            productImages.forEach(image => {
                const imageElement = document.createElement('div');
                imageElement.id = `image-${image.id}`;
                imageElement.className = `image-container rounded-lg ${image.isMain ? 'main-image' : 'border border-gray-200'}`;
                imageElement.innerHTML = `
                    <img src="${image.src}" alt="Product" class="w-full h-32 object-cover rounded-lg">
                    ${image.isMain ? '<span class="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Main</span>' : ''}
                    <div class="image-overlay">
                        <div class="flex flex-col space-y-2">
                            <button onclick="setAsMain(${image.id})" class="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-100 transition" title="Set as Main">
                                <i class="fas fa-star"></i>
                            </button>
                            <button onclick="updateImage(${image.id})" class="p-2 bg-white text-green-600 rounded-full hover:bg-green-100 transition" title="Update Image">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(imageElement);
            });
        }

        // Set image as main
        function setAsMain(imageId) {
            // Update data model
            productImages.forEach(image => {
                image.isMain = image.id === imageId;
            });
            
            // Re-render images
            renderProductImages();
            
            showNotification('Main image set successfully');
        }

        // Update image
        function updateImage(imageId) {
            currentImageId = imageId;
            
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store the uploaded image and open crop modal
                    currentUploadedImage = e.target.result;
                    openCropModal(currentUploadedImage, 'Update Image');
                };
                reader.readAsDataURL(file);
            };
            
            // Trigger file selection
            fileInput.click();
        }

        // Open image uploader
        function openImageUploader() {
            document.getElementById('addImagesModal').classList.remove('hidden');
        }

        // Handle image upload for adding new images
        function handleImagesUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;
            
            // For simplicity, we'll process the first image
            const file = files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                // Store the uploaded image and open crop modal
                currentUploadedImage = e.target.result;
                openCropModal(currentUploadedImage, 'New Image');
            };
            reader.readAsDataURL(file);
        }

        // Open crop modal
        function openCropModal(imageSrc, imageName = 'Image') {
            document.getElementById('cropModal').classList.remove('hidden');
            document.getElementById('editingImageName').textContent = imageName;
            
            const image = document.getElementById('cropImage');
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
                guides: true
            });
        }

        // Close crop modal
        function closeCropModal() {
            document.getElementById('cropModal').classList.add('hidden');
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
            
            const ratio = document.getElementById('aspectRatio').value;
            if (ratio === '0') {
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
            canvas.toBlob(function(blob) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (currentImageId) {
                        // Update existing image
                        const imageIndex = productImages.findIndex(img => img.id === currentImageId);
                        if (imageIndex !== -1) {
                            productImages[imageIndex].src = e.target.result;
                        }
                    } else {
                        // Add new image to our data model
                        const newId = Math.max(...productImages.map(img => img.id), 0) + 1;
                        const isMain = productImages.length === 0; // Set as main if it's the first image
                        
                        productImages.push({
                            id: newId,
                            src: e.target.result,
                            isMain: isMain
                        });
                    }
                    
                    // Re-render images
                    renderProductImages();
                    
                    // Close modals
                    closeCropModal();
                    document.getElementById('addImagesModal').classList.add('hidden');
                    
                    showNotification(currentImageId ? 'Image updated successfully' : 'Image cropped and added successfully');
                };
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.9);
        }

        // Save images (for adding new images)
        function saveImages() {
            // This function is now handled by the crop flow
            // We keep it for compatibility with the HTML
            if (!currentUploadedImage) {
                alert('Please upload an image first.');
                return;
            }
        }

        // Setup basic information edit functionality
        function setupBasicInfoEdit() {
            const editBasicInfoBtn = document.getElementById('editBasicInfoBtn');
            const cancelBasicInfoBtn = document.getElementById('cancelBasicInfoBtn');
            const saveBasicInfoBtn = document.getElementById('saveBasicInfoBtn');
            const basicInfoSection = document.getElementById('basicInfoSection');
            const basicInfoActions = document.getElementById('basicInfoActions');
            
            // Display elements
            const productNameDisplay = document.getElementById('productNameDisplay');
           
            const categoryDisplay = document.getElementById('categoryDisplay');
            const descriptionDisplay = document.getElementById('descriptionDisplay');
            
            // Edit elements
            const productNameEdit = document.getElementById('productNameEdit');
          
            const categoryEdit = document.getElementById('categoryEdit');
            const descriptionEdit = document.getElementById('descriptionEdit');
            
            // Edit button click handler
            editBasicInfoBtn.addEventListener('click', function() {
                // Hide display elements
                productNameDisplay.classList.add('hidden');
               
                categoryDisplay.classList.add('hidden');
                descriptionDisplay.classList.add('hidden');
                
                // Show edit elements
                productNameEdit.classList.remove('hidden');
              
                categoryEdit.classList.remove('hidden');
                descriptionEdit.classList.remove('hidden');
                
                // Show action buttons
                basicInfoActions.classList.remove('hidden');
                
                // Add edit mode styling
                basicInfoSection.classList.add('edit-mode', 'p-4');
                
                // Hide edit button
                editBasicInfoBtn.classList.add('hidden');
            });
            
            // Cancel button click handler
            cancelBasicInfoBtn.addEventListener('click', function() {
                // Reset values to original
                productNameEdit.value = productNameDisplay.textContent;
                brandEdit.value = brandDisplay.textContent;
                categoryEdit.value = categoryDisplay.textContent;
                descriptionEdit.value = descriptionDisplay.textContent;
                
                // Hide edit elements
                productNameEdit.classList.add('hidden');
                brandEdit.classList.add('hidden');
                categoryEdit.classList.add('hidden');
                descriptionEdit.classList.add('hidden');
                
                // Show display elements
                productNameDisplay.classList.remove('hidden');
                brandDisplay.classList.remove('hidden');
                categoryDisplay.classList.remove('hidden');
                descriptionDisplay.classList.remove('hidden');
                
                // Hide action buttons
                basicInfoActions.classList.add('hidden');
                
                // Remove edit mode styling
                basicInfoSection.classList.remove('edit-mode', 'p-4');
                
                // Show edit button
                editBasicInfoBtn.classList.remove('hidden');
            });
            
            // Save button click handler
            saveBasicInfoBtn.addEventListener('click', function() {
                // Update display values with edited values
                productNameDisplay.textContent = productNameEdit.value;
                brandDisplay.textContent = brandEdit.value;
                categoryDisplay.textContent = categoryEdit.value;
                descriptionDisplay.textContent = descriptionEdit.value;
                
                // Hide edit elements
                productNameEdit.classList.add('hidden');
                brandEdit.classList.add('hidden');
                categoryEdit.classList.add('hidden');
                descriptionEdit.classList.add('hidden');
                
                // Show display elements
                productNameDisplay.classList.remove('hidden');
                brandDisplay.classList.remove('hidden');
                categoryDisplay.classList.remove('hidden');
                descriptionDisplay.classList.remove('hidden');
                
                // Hide action buttons
                basicInfoActions.classList.add('hidden');
                
                // Remove edit mode styling
                basicInfoSection.classList.remove('edit-mode', 'p-4');
                
                // Show edit button
                editBasicInfoBtn.classList.remove('hidden');
                
                // Show success message
                showNotification('Basic information updated successfully!', 'success');
            });
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const bgColor = type === 'error' ? 'bg-red-600' : 
                           type === 'info' ? 'bg-blue-600' : 'bg-green-600';
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-0`;
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'info' ? 'fa-info-circle' : 'fa-check-circle'} mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Other existing functions (variant management, etc.)
        function toggleVariantStatus(variantId, currentStatus) {
            const newStatus = currentStatus === 'active' ? 'unlisted' : 'active';
            const statusElement = document.getElementById(`status-${variantId}`);
            const actionButton = document.getElementById(`action-${variantId}`);
            
            if (newStatus === 'unlisted') {
                statusElement.innerHTML = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unlisted</span>';
                actionButton.innerHTML = '<i class="fas fa-eye mr-1"></i>List';
                actionButton.className = 'px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition';
            } else {
                statusElement.innerHTML = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>';
                actionButton.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Unlist';
                actionButton.className = 'px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition';
            }
            
            showNotification(`Variant ${newStatus === 'unlisted' ? 'unlisted' : 'listed'} successfully`);
        }
        
        function bulkUnlistVariants() {
            const checkboxes = document.querySelectorAll('.variant-checkbox:checked');
            if (checkboxes.length === 0) {
                alert('Please select at least one variant to unlist.');
                return;
            }
            
            if (confirm(`Are you sure you want to unlist ${checkboxes.length} variant(s)?`)) {
                checkboxes.forEach(checkbox => {
                    const variantId = checkbox.value;
                    const currentStatus = checkbox.closest('tr').querySelector('[id^="status-"]').textContent.includes('Unlisted') ? 'unlisted' : 'active';
                    if (currentStatus === 'active') {
                        toggleVariantStatus(variantId, 'active');
                    }
                });
                showNotification(`${checkboxes.length} variant(s) unlisted successfully`);
            }
        }
        
        function toggleAllVariants() {
            const checkboxes = document.querySelectorAll('.variant-checkbox');
            const selectAll = document.getElementById('select-all-variants');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        }
        
        function editVariant(variantId) {
            const row = document.querySelector(`[data-variant-id="${variantId}"]`);
            const model = row.querySelector('.variant-model').textContent;
            const stock = row.querySelector('.variant-stock').textContent;
            const originalPrice = row.querySelector('.variant-original-price').textContent.replace('₹', '');
            const salePrice = row.querySelector('.variant-sale-price').textContent.replace('₹', '');
            
            document.getElementById('editVariantModal').classList.remove('hidden');
            document.getElementById('editVariantId').value = variantId;
            document.getElementById('editVariantModel').value = model;
            document.getElementById('editVariantStock').value = stock;
            document.getElementById('editVariantOriginalPrice').value = originalPrice;
            document.getElementById('editVariantSalePrice').value = salePrice;
        }
        
        function saveVariantChanges() {
            const variantId = document.getElementById('editVariantId').value;
            const model = document.getElementById('editVariantModel').value;
            const stock = document.getElementById('editVariantStock').value;
            const originalPrice = document.getElementById('editVariantOriginalPrice').value;
            const salePrice = document.getElementById('editVariantSalePrice').value;
            
            const row = document.querySelector(`[data-variant-id="${variantId}"]`);
            row.querySelector('.variant-model').textContent = model;
            row.querySelector('.variant-stock').textContent = stock;
            row.querySelector('.variant-original-price').textContent = `₹${originalPrice}`;
            row.querySelector('.variant-sale-price').textContent = `₹${salePrice}`;
            
            const statusElement = row.querySelector('[id^="status-"]');
            if (parseInt(stock) === 0) {
                statusElement.innerHTML = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>';
            } else if (parseInt(stock) < 20) {
                statusElement.innerHTML = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>';
            } else {
                statusElement.innerHTML = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>';
            }
            
            document.getElementById('editVariantModal').classList.add('hidden');
            showNotification('Variant updated successfully');
        }
        
        function closeModal() {
            document.getElementById('editVariantModal').classList.add('hidden');
            document.getElementById('addImagesModal').classList.add('hidden');
        }
        
        function goToProductList() {
            window.location.href = 'product-list.html';
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
window.showNotification = showNotification;
window.toggleVariantStatus = toggleVariantStatus;
window.bulkUnlistVariants = bulkUnlistVariants;
window.toggleAllVariants = toggleAllVariants;
window.editVariant = editVariant;
window.saveVariantChanges = saveVariantChanges;
window.closeModal = closeModal;
window.goToProductList = goToProductList;
