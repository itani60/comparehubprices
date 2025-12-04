/**
 * Business Management JavaScript
 * Handles product upload, viewing, and management using the new manage-business-products Lambda
 */

const BASE_URL = 'https://acc.comparehubprices.site';
const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
const DELETE_POST_URL = `${BASE_URL}/business/business/delete-post`;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first before loading data
    // Wait a bit for auth service to initialize
    setTimeout(async () => {
        try {
            // Check if auth service is available and user is logged in
            if (window.businessAWSAuthService) {
                const authCheck = await window.businessAWSAuthService.getUserInfo();
                if (authCheck.success) {
                    // User is authenticated, load product count
                    await loadProductCount();
                } else {
                    // User not authenticated, set default count (no API call = no 401 error)
                    const countElement = document.getElementById('productCount');
                    if (countElement) {
                        countElement.textContent = '0 product(s)';
                    }
                }
            } else {
                // Auth service not available yet, wait a bit more
                setTimeout(async () => {
                    if (window.businessAWSAuthService) {
                        const authCheck = await window.businessAWSAuthService.getUserInfo();
                        if (authCheck.success) {
                            await loadProductCount();
                        } else {
                            const countElement = document.getElementById('productCount');
                            if (countElement) {
                                countElement.textContent = '0 product(s)';
                            }
                        }
                    } else {
                        // Still not available, try loading anyway (will show 401 but that's ok)
                        await loadProductCount();
                    }
                }, 500);
            }
        } catch (error) {
            // Silently handle errors - user might not be logged in
            const countElement = document.getElementById('productCount');
            if (countElement) {
                countElement.textContent = '0 product(s)';
            }
        }
    }, 300);
    
    // Check if modal should be opened
    if (sessionStorage.getItem('openUploadModal') === 'true') {
        sessionStorage.removeItem('openUploadModal');
        setTimeout(() => {
            uploadProduct();
        }, 500);
    }
    
    // Setup image preview handlers
    setupImagePreviews();
});

/**
 * Setup image preview handlers for file inputs
 */
function setupImagePreviews() {
    // Setup for all existing products
    for (let productNum = 1; productNum <= 5; productNum++) {
        setupImagePreviewsForProduct(productNum);
    }
}

/**
 * Setup image preview handlers for a specific product
 */
function setupImagePreviewsForProduct(productNumber) {
    const productItem = document.querySelectorAll('.product-item')[productNumber - 1];
    if (!productItem) return;
    
    for (let i = 1; i <= 6; i++) {
        const input = productItem.querySelector(`.product-image-${i}`);
        if (input) {
            // Remove existing listeners by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Validate file size (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Image size exceeds 5MB limit. Please choose a smaller image.');
                        e.target.value = '';
                        return;
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        alert('Please select a valid image file.');
                        e.target.value = '';
                        return;
                    }
                    
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const container = newInput.closest('.image-upload-container');
                        if (container) {
                            let previewContainer = container.querySelector('.image-preview-container');
                            if (!previewContainer) {
                                previewContainer = document.createElement('div');
                                previewContainer.className = 'image-preview-container';
                                previewContainer.style.cssText = 'display: block; margin-top: 10px;';
                                container.appendChild(previewContainer);
                            }
                            
                            // Remove existing preview image if any
                            const existingImg = previewContainer.querySelector('.image-preview');
                            if (existingImg) {
                                existingImg.remove();
                            }
                            
                            const img = document.createElement('img');
                            img.className = 'image-preview';
                            img.style.cssText = 'max-width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 10px; display: block;';
                            img.src = e.target.result;
                            previewContainer.insertBefore(img, previewContainer.firstChild);
                            
                            // Add or update remove button
                            let removeBtn = previewContainer.querySelector('.remove-image-btn');
                            if (!removeBtn) {
                                removeBtn = document.createElement('button');
                                removeBtn.type = 'button';
                                removeBtn.className = 'btn btn-sm btn-danger remove-image-btn';
                                removeBtn.textContent = 'Remove';
                                removeBtn.onclick = () => {
                                    newInput.value = '';
                                    previewContainer.style.display = 'none';
                                };
                                previewContainer.appendChild(removeBtn);
                            }
                            
                            previewContainer.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
}

/**
 * Open upload product modal
 */
function uploadProduct() {
    const modal = new bootstrap.Modal(document.getElementById('uploadProductModal'));
    modal.show();
}

/**
 * View products
 */
async function viewProducts() {
    const modal = new bootstrap.Modal(document.getElementById('viewProductsModal'));
    modal.show();
    
    // Show loading
    document.getElementById('productsLoading').style.display = 'block';
    document.getElementById('productsError').style.display = 'none';
    document.getElementById('productsContent').style.display = 'none';
    document.getElementById('productsEmpty').style.display = 'none';
    
    try {
        // Check authentication first
        if (window.businessAWSAuthService) {
            const authCheck = await window.businessAWSAuthService.getUserInfo();
            if (!authCheck.success) {
                // User not authenticated
                document.getElementById('productsLoading').style.display = 'none';
                document.getElementById('productsError').style.display = 'block';
                document.getElementById('productsError').innerHTML = 
                    '<div class="alert alert-warning">Please log in to view your products. <a href="business-login.html">Click here to login</a></div>';
                return;
            }
        }
        
        const response = await fetch(MANAGE_PRODUCTS_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        // Handle 401 gracefully
        if (response.status === 401) {
            document.getElementById('productsLoading').style.display = 'none';
            document.getElementById('productsError').style.display = 'block';
            document.getElementById('productsError').innerHTML = 
                '<div class="alert alert-warning">Your session has expired. Please <a href="business-login.html">log in again</a>.</div>';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            // Handle auth-related errors gracefully
            if (data.error === 'NO_SESSION' || data.error === 'INVALID_SESSION' || data.error === 'SESSION_EXPIRED') {
                document.getElementById('productsLoading').style.display = 'none';
                document.getElementById('productsError').style.display = 'block';
                document.getElementById('productsError').innerHTML = 
                    '<div class="alert alert-warning">Your session has expired. Please <a href="business-login.html">log in again</a>.</div>';
                return;
            }
            throw new Error(data.message || 'Failed to load products');
        }
        
        // Hide loading
        document.getElementById('productsLoading').style.display = 'none';
        
        if (data.products && data.products.length > 0) {
            // Show products
            renderProducts(data.products);
            document.getElementById('productsContent').style.display = 'block';
        } else {
            // Show empty state
            document.getElementById('productsEmpty').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsLoading').style.display = 'none';
        document.getElementById('productsError').style.display = 'block';
        
        // Show user-friendly error message
        if (error.message && error.message.includes('session')) {
            document.getElementById('productsError').innerHTML = 
                '<div class="alert alert-warning">Your session has expired. Please <a href="business-login.html">log in again</a>.</div>';
        } else {
            document.getElementById('productsError').textContent = error.message || 'Failed to load products. Please try again.';
        }
    }
}

/**
 * Render products in the modal
 */
function renderProducts(products) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    productsList.innerHTML = products.map((product, index) => {
        // Handle images - could be array, string, or missing
        let images = [];
        if (Array.isArray(product.images)) {
            images = product.images;
        } else if (product.images && typeof product.images === 'string') {
            // If images is a string, it's likely a data issue - skip it
            images = [];
        }
        
        const imageHtml = images.slice(0, 3).map(img => {
            const imgUrl = typeof img === 'string' ? img : (img.image || img.url || '');
            if (!imgUrl) return '';
            return `<img src="${imgUrl}" alt="${product.name || 'Product'}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover; margin: 5px;">`;
        }).filter(html => html !== '').join('');
        
        return `
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${product.name || 'Unnamed Product'}</h5>
                        <p class="card-text">${product.description || 'No description'}</p>
                        <div class="mb-2">
                            ${imageHtml || '<p class="text-muted small">No images</p>'}
                            ${images.length > 3 ? `<span class="text-muted">+${images.length - 3} more</span>` : ''}
                        </div>
                        <p class="text-muted small">${images.length} image(s)</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Save service/products
 */
async function saveService() {
    const form = document.getElementById('uploadProductForm');
    if (!form) return;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get business description
    const businessDescription = document.getElementById('businessDescription').value.trim();
    if (!businessDescription) {
        alert('Business description is required');
        return;
    }
    
    // Get our services
    const ourServices = document.getElementById('ourServices').value.trim();
    
    // Get more information
    const moreInformation = document.getElementById('moreInformation')?.value.trim() || '';
    
    // Collect products from all visible product items only
    const products = [];
    const allProductItems = document.querySelectorAll('.product-item');
    const productItems = Array.from(allProductItems).filter(item => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none';
    });
    
    for (const productItem of productItems) {
        const productName = productItem.querySelector('.product-name')?.value?.trim();
        const productDescription = productItem.querySelector('.product-description')?.value?.trim();
        
        if (!productName) continue; // Skip products without names
        
        const product = {
            name: productName,
            description: productDescription || ''
        };
        
        // Process images (up to 6)
        for (let i = 1; i <= 6; i++) {
            const imageInput = productItem.querySelector(`.product-image-${i}`);
            const priceInput = productItem.querySelector(`.product-price-${i}`);
            
            if (imageInput && imageInput.files && imageInput.files[0]) {
                const file = imageInput.files[0];
                
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    alert(`Image ${i} for "${productName}" exceeds 5MB limit. Please choose a smaller image.`);
                    return;
                }
                
                // Convert to base64
                try {
                    const base64 = await fileToBase64(file);
                    product[`image${i}Base64`] = base64;
                    product[`image${i}ContentType`] = file.type;
                    
                    if (priceInput && priceInput.value) {
                        product[`image${i}Price`] = priceInput.value;
                    }
                } catch (error) {
                    console.error(`Error processing image ${i}:`, error);
                    alert(`Error processing image ${i} for "${productName}"`);
                    return;
                }
            }
        }
        
        // Only add product if it has at least one image
        if (product.image1Base64) {
            products.push(product);
        }
    }
    
    if (products.length === 0) {
        alert('Please add at least one product with at least one image');
        return;
    }
    
    // Check authentication first
    if (window.businessAWSAuthService) {
        const authCheck = await window.businessAWSAuthService.getUserInfo();
        if (!authCheck.success) {
            alert('Please log in to save products. Redirecting to login page...');
            window.location.href = 'business-login.html';
            return;
        }
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#uploadProductModal .btn-success');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const response = await fetch(MANAGE_PRODUCTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                businessDescription: businessDescription,
                ourServices: ourServices,
                moreInformation: moreInformation,
                products: products
            })
        });
        
        // Handle 401 gracefully
        if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.');
        }
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            // Handle auth-related errors
            if (data.error === 'NO_SESSION' || data.error === 'INVALID_SESSION' || data.error === 'SESSION_EXPIRED') {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(data.message || 'Failed to save products');
        }
        
        // Show success message
        if (typeof showSuccessToast === 'function') {
            showSuccessToast('Products saved successfully!', 'Success');
        } else {
            alert('Products saved successfully!');
        }
        
        // Close modal and reload
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadProductModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset form
        form.reset();
        document.querySelectorAll('.image-preview-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Reload product count
        loadProductCount();
        
    } catch (error) {
        console.error('Error saving products:', error);
        
        // Handle session expiration
        if (error.message && error.message.includes('session')) {
            alert('Your session has expired. Please log in again.');
            window.location.href = 'business-login.html';
            return;
        }
        
        if (typeof showErrorToast === 'function') {
            showErrorToast(error.message || 'Failed to save products', 'Error');
        } else {
            alert('Error: ' + (error.message || 'Failed to save products'));
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Load product count
 */
async function loadProductCount() {
    const countElement = document.getElementById('productCount');
    if (!countElement) return;
    
    try {
        const response = await fetch(MANAGE_PRODUCTS_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        // Handle 401 (not authenticated) gracefully - user might not be logged in
        if (response.status === 401) {
            countElement.textContent = '0 product(s)';
            // Don't log 401 errors - they're expected when user isn't logged in
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const count = data.count || (data.products ? data.products.length : 0);
            countElement.textContent = `${count} product(s)`;
        } else {
            // Only show error for non-auth errors
            if (data.error !== 'NO_SESSION' && data.error !== 'INVALID_SESSION' && data.error !== 'SESSION_EXPIRED') {
                countElement.textContent = 'Error loading count';
            } else {
                countElement.textContent = '0 product(s)';
            }
        }
    } catch (error) {
        // Silently handle network errors - don't spam console
        if (countElement) {
            countElement.textContent = '0 product(s)';
        }
    }
}

/**
 * Add another product - shows the next hidden product
 */
function addProduct() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const productItems = Array.from(container.querySelectorAll('.product-item'));
    // Find the first hidden product
    const hiddenProduct = productItems.find(item => item.style.display === 'none' || window.getComputedStyle(item).display === 'none');
    
    if (hiddenProduct) {
        // Show the hidden product
        hiddenProduct.style.display = 'block';
        
        // Setup image previews for this product
        const productNumber = productItems.indexOf(hiddenProduct) + 1;
        setupImagePreviewsForProduct(productNumber);
        
        // Scroll to the newly shown product
        hiddenProduct.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // All products are visible, show a message
        if (typeof showInfoToast === 'function') {
            showInfoToast('Maximum of 5 products allowed', 'Info');
        } else {
            alert('Maximum of 5 products allowed');
        }
    }
}

/**
 * Remove product - hides it instead of removing
 */
function removeProduct(productNumber) {
    const productItems = Array.from(document.querySelectorAll('.product-item'));
    const visibleProducts = productItems.filter(item => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none';
    });
    
    if (visibleProducts.length <= 1) {
        alert('You must have at least one product');
        return;
    }
    
    const productItem = productItems[productNumber - 1];
    if (productItem) {
        // Hide the product instead of removing it
        productItem.style.display = 'none';
        
        // Clear all inputs in this product
        productItem.querySelectorAll('input, textarea').forEach(input => {
            if (input.type === 'file') {
                input.value = '';
            } else {
                input.value = '';
            }
        });
        
        // Hide all image previews
        productItem.querySelectorAll('.image-preview-container').forEach(container => {
            container.style.display = 'none';
        });
    }
}

/**
 * View full catalogue
 */
function viewFullCatalogue() {
    window.location.href = 'business_catalogue.html';
}

/**
 * Show delete business post modal
 */
function deleteBusinessPost() {
    const modal = new bootstrap.Modal(document.getElementById('deleteBusinessPostModal'));
    modal.show();
}

/**
 * Confirm and delete business post
 */
async function confirmDeleteBusinessPost() {
    try {
        // Get business info to get businessId
        if (!window.businessAWSAuthService) {
            showToast('Authentication service not available', 'error');
            return;
        }

        const userInfo = await window.businessAWSAuthService.getUserInfo();
        if (!userInfo.success || !userInfo.user || !userInfo.user.businessId) {
            showToast('Unable to get business information', 'error');
            return;
        }

        const businessId = userInfo.user.businessId;

        // First, get the postId by querying the public post table using businessId
        const getPostResponse = await fetch(`${BASE_URL}/business/business/public/${businessId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!getPostResponse.ok) {
            const errorData = await getPostResponse.json().catch(() => ({}));
            showToast(errorData.message || 'Business post not found', 'error');
            return;
        }

        const postData = await getPostResponse.json();
        
        if (!postData.success || !postData.business || !postData.business.id) {
            showToast('Business post not found', 'error');
            return;
        }

        const postId = postData.business.id;

        // Delete the post
        let deleteResponse;
        try {
            deleteResponse = await fetch(DELETE_POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postId: postId, action: 'delete' })
            });
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            // Check if it's a CORS error
            if (fetchError.message && (fetchError.message.includes('CORS') || fetchError.message.includes('Failed to fetch'))) {
                showToast('CORS error: Please check API Gateway CORS configuration. DELETE method must be allowed.', 'error');
            } else {
                showToast('Network error: Failed to connect to server. Please check your connection.', 'error');
            }
            return;
        }

        // Handle non-JSON responses
        let result;
        try {
            result = await deleteResponse.json();
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            showToast(`Server error: Invalid response (Status: ${deleteResponse.status})`, 'error');
            return;
        }

        if (deleteResponse.ok && result.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteBusinessPostModal'));
            if (modal) {
                modal.hide();
            }
            
            showToast('Business post deleted successfully', 'success');
            
            // Optionally reload the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showToast(result.message || 'Failed to delete business post', 'error');
        }
    } catch (error) {
        console.error('Error deleting business post:', error);
        const errorMessage = error.message || 'An error occurred while deleting the post';
        showToast(errorMessage, 'error');
    }
}

