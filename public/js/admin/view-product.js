import adminApi from "../adminApi.js";
let  btnMode=null;

      // Global variables
        let cropper = null;
        const product=window.product;
        const productId=product._id.toString()
        const productsImages = window.productImages
       let productImages = productsImages.map((img, index) => ({
        _id:img._id,
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
            
            <!-- SET MAIN BUTTON -->
            <button onclick="setAsMain('${image.id}')" 
                class="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-100 transition" 
                title="Set as Main">
                <i class="fas fa-star"></i>
            </button>

            <!-- UPDATE BUTTON -->
            <button onclick="updateImage('${image._id}', this)" data-btnmode="edit"
                class="p-2 bg-white text-green-600 rounded-full hover:bg-green-100 transition" 
                
                title="Update Image">
                <i class="fas fa-edit"></i>
            </button>

            <!-- DELETE BUTTON -->
            <button onclick="deleteImage('${image._id}')" 
                class="p-2 bg-white text-red-600 rounded-full hover:bg-red-100 transition" 
                title="Delete Image">
                <i class="fas fa-trash"></i>
            </button>

        </div>
    </div>
`;

                container.appendChild(imageElement);
            });
        }

        // Set image as main
        async function setAsMain(imageId) {
                let res= await adminApi.setMainAxios(productId,imageId)
                if(res.data.success){
                    Swal.fire({
                    icon: "success",
                    title: " added as Main!",
                    text: res.data.message,
                    timer: 1800,
                    showConfirmButton: false,
                  }).then(()=>{
                      location.reload()
                  })
                   
                }else{
                     Swal.fire({
                     icon: "warning",
                     title: " Something went wrong",
                     text: res.data.message,
                     timer: 1800,
                     showConfirmButton: false,
                   })
                }
            };
            
            // Re-render images
            
           
        

        // Update image
        function updateImage(imageId,btn) {
            btnMode = btn.dataset.btnmode;
            currentImageId = imageId;
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
        function openImageUploader(btn) {
              btnMode = btn.dataset.btnmode;
              console.log(btn)
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
            let file;
            canvas.toBlob(async function(blob) {
                const ext=blob.type.split('/').pop();
                const fileName=`cropped-image.${ext}`;
                file =new File([blob],fileName,{type:blob.type})
                const newForm=new FormData();
                newForm.append('image',file)
                newForm.append('imageId',currentImageId)
                const produtId=product._id
                // Re-render images 
                if(btnMode==='edit'){
                    try {
                        let res= await adminApi.editImgProductAxios(newForm,produtId)
                        console.log(res.data)
                    if(res.data.success){
                        console.log('hlow ')
                        closeCropModal(); 
                        Swal.fire({
                            icon: "success",
                            title: " image updated!",
                            text: res.data.message,
                            timer: 1800,
                            showConfirmButton: false,
                        }).then(()=>{
                            document.getElementById('addImagesModal').classList.add('hidden');
                            location.reload()
                        })
                        
                    }
                    } catch (error) {
                        console.log(error)
                        Swal.fire({
                           icon: "warning",
                           title: " someting went wrong!",
                           text: error.response.message,
                           timer: 1800,
                           showConfirmButton: false,
                       })
                        
                    }

                    
                }
                if(btnMode==="add"){
                    try {
                       const res= await adminApi.uploadImgProductAxios(productId,newForm)
                       console.log(res)
                    if(res.data.success){
                        closeCropModal(); 
                        Swal.fire({
                            icon: "success",
                            title: " image added!",
                            text: res.data.message,
                            timer: 1800,
                            showConfirmButton: false,
                        }).then(()=>{
                            document.getElementById('addImagesModal').classList.add('hidden');
                            location.reload()
                        })
                        
                    } else{
                        Swal.fire({
                            icon: "warning",
                            title: " someting went wrong!",
                            text: res.data.message,
                            timer: 1800,
                            showConfirmButton: false,
                        })
                    }
                    } catch (error) {
                            Swal.fire({
                            icon: "warning",
                            title: " someting went wrong!",
                            text: error.response.data.message,
                            timer: 1800,
                            showConfirmButton: false,
                        }).then(()=>{
                            document.getElementById('addImagesModal').classList.add('hidden');
                            location.reload()
                        })
                        
                    }
                   
                        
                    
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
                            text: 'upload Image first',
                            timer: 1800,
                            showConfirmButton: false,
                        })
                return;
            }
        }

   async function deleteImage(id) {
    Swal.fire({
        title: "Are you sure?",
        text: "This image will be permanently deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then(async(result) => {

        if (!result.isConfirmed) return;

        try {
            let res = await adminApi.editImgDeleteAxios(id, productId);
          

            Swal.fire({
                icon: "success",
                title: "Image deleted!",
                text: res.data.message,
                timer: 1800,
                showConfirmButton: false
            }).then(() => location.reload());

        } catch (err) {

            Swal.fire({
                icon: "error",
                title: "Delete Failed!",
                text: err.response.data.message,
                timer: 1800,
                showConfirmButton: false
            });
        }
    });
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
                categoryEdit.value = categoryDisplay.textContent;
                descriptionEdit.value = descriptionDisplay.textContent;
                
                // Hide edit elements
                productNameEdit.classList.add('hidden');
                categoryEdit.classList.add('hidden');
                descriptionEdit.classList.add('hidden');
                
                // Show display elements
                productNameDisplay.classList.remove('hidden');
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
            saveBasicInfoBtn.addEventListener('click',  async() =>{
                // Update display values with edited values
                // Hide edit elements
                productNameEdit.classList.add('hidden');
                categoryEdit.classList.add('hidden');
                descriptionEdit.classList.add('hidden');
                
                // Show display elements
                productNameDisplay.classList.remove('hidden');

                categoryDisplay.classList.remove('hidden');
                descriptionDisplay.classList.remove('hidden');
                
                // Hide action buttons
                basicInfoActions.classList.add('hidden');
                
                // Remove edit mode styling
                basicInfoSection.classList.remove('edit-mode', 'p-4');
                
                // Show edit button
                editBasicInfoBtn.classList.remove('hidden');
                const data={
                    productName:productNameEdit.value,
                    category:categoryEdit.value,
                    description:descriptionEdit.value
                }
                const  res=await  adminApi.editProductBasicInfoAxios(data, productId)
                if(res.data.success){
                    Swal.fire({
                icon: "success",
                title: "product info updated!",
                text: res.data.message,
                timer: 1800,
                showConfirmButton: false
            }).then(()=>{

                location.reload()
            })
                }else{
                    Swal.fire({
                icon: "warning",
                title: "Something went wrong!",
                text: res.data.message,
                timer: 1800,
                showConfirmButton: false
            })
                }
            });
        }

        let currenctVariantId;
       async function editVariant(variantId) {
            document.getElementById('editVariantModal').classList.remove('hidden');
            const res=await adminApi.variantDetialsAxios(variantId)
            currenctVariantId=res.data.variant._id
            console.log(currenctVariantId)
            document.getElementById('editVariantModel').value = res.data.variant.deviceModel
            document.getElementById('editVariantStock').value = res.data.variant.stock
            document.getElementById('editVariantOriginalPrice').value = res.data.variant.orgPrice
            document.getElementById('editVariantSalePrice').value = res.data.variant.salePrice
        }
        
        
         async function saveVariantChanges() {
            const id=currenctVariantId

            const model = document.getElementById('editVariantModel').value;
            const stock = document.getElementById('editVariantStock').value;
            const originalPrice = document.getElementById('editVariantOriginalPrice').value;
            const salePrice = document.getElementById('editVariantSalePrice').value;

            
            const data={
                deviceModel:model,
                stock:stock,
                orgPrice:originalPrice,
                salePrice:salePrice
            }
            try {
                document.getElementById('editVariantModal').classList.add('hidden');
            const res=await adminApi.editVariantSaveAxios(id,data)
            if(res.data.success){
                Swal.fire({
                icon: "success",
                title: "veriant updeted successfully",
                text: res.data.message,
                timer: 1800,
                showConfirmButton: false
            }).then(()=>{
                location.reload()
            })
            }else{
                Swal.fire({
                icon: "warning",
                title: "something went wrong",
                text: res.data.message,
                timer: 1800,
                showConfirmButton: false
            })
            }
            } catch (error) {
                 Swal.fire({
                icon: "warning",
                title: "something went wrong",
                text: error.response.data.message,
                timer: 1800,
                showConfirmButton: false
            })
            }
            
        }

       async function toggleListUnlist(id){
        const res=await adminApi.toggleListUnlistAxios(id)
        if(res.data.success){
            location.reload()
        }
       }

        
        function closeModal() {
            document.getElementById('editVariantModal').classList.add('hidden');
            document.getElementById('addImagesModal').classList.add('hidden');
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
window.deleteImage=deleteImage;
window.toggleListUnlist=toggleListUnlist;