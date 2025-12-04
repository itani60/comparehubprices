// Business Preview Manager - Loads business data and handles editing/posting

class BusinessPreviewManager {
    constructor() {
        this.businessData = null;
        this.editMode = false;
        this.originalData = null;
        this.hasEditedAfterApproval = false;
    }

    async init() {
        try {
            // Check if user is logged in
            if (!window.businessAWSAuthService) {
                this.showError('Please log in to view your business preview.');
                return;
            }

            // Get user info to retrieve businessId
            const userInfo = await window.businessAWSAuthService.getUserInfo();
            
            if (!userInfo.success || !userInfo.user) {
                this.showError('Please log in to view your business preview.');
                return;
            }

            const businessId = userInfo.user.businessId;
            
            if (!businessId) {
                this.showError('Business ID not found. Please update your business information.');
                return;
            }

            // Load business data (includes services/products)
            await this.loadServicesData();
            
            // Check approval status and update button states
            await this.checkApprovalStatus();
            
            // Render preview
            this.renderPreview();
        } catch (error) {
            console.error('Error initializing business preview:', error);
            this.showError('Failed to load business preview. Please try again.');
        }
    }

    async loadServicesData() {
        try {
            const BASE_URL = 'https://acc.comparehubprices.site';
            const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
            
            // Fetch products using new manage-products Lambda
            const response = await fetch(MANAGE_PRODUCTS_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Handle 401 gracefully
                if (response.status === 401) {
                    throw new Error('Please log in to view your business preview');
                }
                throw new Error('Failed to load business data');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load business data');
            }
            
            // Initialize business data
            if (!this.businessData) {
                this.businessData = {};
            }
            
            // Set business description and services
            this.businessData.businessDescription = data.businessDescription || '';
            this.businessData.ourServices = data.ourServices || '';
            this.businessData.moreInformation = data.moreInformation || '';
            this.businessData.serviceGalleries = {};
            
            // Store contact information, business hours, logo, and social media
            this.businessData.contactInfo = data.contactInfo || {};
            this.businessData.businessHours = data.businessHours || '';
            // Store logo - check businessLogoUrl first (actual field name in business-users table)
            this.businessData.logo = data.logo || data.businessLogoUrl || '';
            this.businessData.businessLogoUrl = data.logo || data.businessLogoUrl || '';
            this.businessData.socialMedia = data.socialMedia || {};
            // Store status and rejection reason
            this.businessData.status = data.status || 'DRAFT';
            this.businessData.rejectionReason = data.rejectionReason || null;
            
            // Map contactInfo to businessData for backward compatibility
            this.businessData.businessName = this.businessData.contactInfo.businessName || '';
            this.businessData.businessAddress = this.businessData.contactInfo.address || '';
            this.businessData.businessNumber = this.businessData.contactInfo.phone || '';
            this.businessData.businessEmail = this.businessData.contactInfo.email || '';
            this.businessData.email = this.businessData.contactInfo.email || '';
            
            // Convert products array to serviceGalleries object format
            // data.products is an array: [{ name, images, description }, ...]
            // serviceGalleries should be an object: { "Service Name": [{ image, title }, ...] }
            if (Array.isArray(data.products)) {
                data.products.forEach(product => {
                    if (product.name) {
                        // Normalize images array - handle both array and string cases
                        let images = [];
                        if (Array.isArray(product.images)) {
                            images = product.images.map(img => {
                                if (typeof img === 'string') {
                                    return { image: img, title: product.name };
                                }
                                return {
                                    image: img.image || img.url || '',
                                    title: img.title || product.name,
                                    price: img.price
                                };
                            }).filter(img => img.image); // Filter out empty images
                        }
                        
                        if (images.length > 0) {
                            this.businessData.serviceGalleries[product.name] = images;
                        }
                    }
                });
            }
            
            // Normalize serviceGalleries structure
            if (this.businessData.serviceGalleries && typeof this.businessData.serviceGalleries === 'object') {
                const normalized = {};
                Object.keys(this.businessData.serviceGalleries).forEach(serviceName => {
                    const images = this.businessData.serviceGalleries[serviceName];
                    normalized[serviceName] = this.normalizeImagesArray(images);
                });
                this.businessData.serviceGalleries = normalized;
            }
        } catch (error) {
            console.error('Error loading services data:', error);
            // Continue without services data - preview will still work with existing data
        }
    }

    renderPreview() {
        if (!this.businessData) {
            this.showError('No business data available.');
            return;
        }

        // Render hero section
        this.renderHero();
        
        // Render business description
        this.renderBusinessDescription();
        
        // Render our services
        this.renderOurServices();
        
        // Render more information
        this.renderMoreInformation();
        
        // Render services gallery
        this.renderServicesGallery();
        
        // Render social media buttons
        this.renderSocialMedia();
        
        // Render contact information
        this.renderContactInfo();
        
        // Render business hours
        this.renderBusinessHours();
    }

    renderHero() {
        const business = this.businessData;
        
        // Hero Image / Logo
        const heroImage = document.getElementById('businessHeroImage');
        if (heroImage) {
            heroImage.src = business.logo || business.businessLogoUrl || 'https://via.placeholder.com/300x200?text=Business+Logo';
            heroImage.alt = business.businessName || business.contactInfo?.businessName || 'Business Logo';
        }
        
        // Category Badge
        const categoryBadge = document.getElementById('businessCategoryBadge');
        if (categoryBadge) {
            const category = business.businessCategory || business.businessType || 'Business';
            categoryBadge.textContent = category;
            categoryBadge.style.display = category ? 'block' : 'none';
        }
        
        // Business Title
        const businessTitle = document.getElementById('businessTitle');
        if (businessTitle) {
            businessTitle.textContent = business.businessName || 'Business Name';
        }
        
        // Business Subtitle
        const businessSubtitle = document.getElementById('businessSubtitle');
        if (businessSubtitle) {
            const description = business.businessDescription || business.description || '';
            businessSubtitle.textContent = description.length > 100 ? description.substring(0, 100) + '...' : description || 'No description available';
        }
        
        // Business Location
        const businessLocationText = document.getElementById('businessLocationText');
        if (businessLocationText) {
            businessLocationText.textContent = business.businessAddress || 'Address not provided';
        }
        
        // Business Phone
        const businessPhonePreview = document.getElementById('businessPhonePreview');
        if (businessPhonePreview) {
            if (business.businessNumber) {
                businessPhonePreview.innerHTML = `<i class="fas fa-phone"></i> <a href="tel:${business.businessNumber}">${business.businessNumber}</a>`;
            } else {
                businessPhonePreview.textContent = '';
            }
        }
    }

    renderBusinessDescription() {
        const descriptionEl = document.getElementById('businessDescription');
        if (!descriptionEl) return;

        const description = this.businessData.businessDescription || 
                          this.businessData.fullContent || 
                          this.businessData.description || 
                          'No description available. Click Edit to add a description.';
        
        descriptionEl.innerHTML = description || 'No description available. Click Edit to add a description.';
    }

    renderOurServices() {
        const section = document.getElementById('ourServicesSection');
        const content = document.getElementById('ourServicesContent');
        if (!section || !content) return;

        const ourServices = this.businessData.ourServices || '';
        
        if (ourServices && ourServices.trim()) {
            // Convert newlines to HTML line breaks and preserve bullet points
            const formattedServices = this.escapeHtml(ourServices)
                .replace(/\n/g, '<br>')
                .replace(/•/g, '•')
                .replace(/-/g, '-');
            
            content.innerHTML = `<div class="services-text">${formattedServices}</div>`;
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    }

    renderMoreInformation() {
        const section = document.getElementById('moreInformationSection');
        const content = document.getElementById('moreInformationContent');
        if (!section || !content) return;

        const moreInformation = this.businessData.moreInformation || '';
        
        if (moreInformation && moreInformation.trim()) {
            // Convert newlines to HTML line breaks and preserve bullet points
            const formattedInfo = this.escapeHtml(moreInformation)
                .replace(/\n/g, '<br>')
                .replace(/•/g, '•')
                .replace(/-/g, '-');
            
            content.innerHTML = `<div class="more-info-text">${formattedInfo}</div>`;
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    }

    normalizeImagesArray(images) {
        // Handle various data structures and ensure we always return an array
        if (!images) {
            return [];
        }
        
        if (Array.isArray(images)) {
            return images;
        }
        
        if (typeof images === 'string') {
            return [{ image: images }];
        }
        
        if (typeof images === 'object') {
            // If it's an object, try different strategies
            // Strategy 1: It might be an object with numeric keys (DynamoDB Map)
            const values = Object.values(images);
            if (values.length > 0 && (Array.isArray(values[0]) || typeof values[0] === 'object' || typeof values[0] === 'string')) {
                return values;
            }
            
            // Strategy 2: It might be a single image object
            if (images.image || images.url) {
                return [images];
            }
            
            // Strategy 3: It might be an object with array-like structure
            if (images.length !== undefined) {
                return Array.from(images);
            }
            
            // Strategy 4: Try to extract all values
            return Object.values(images).filter(v => v !== null && v !== undefined);
        }
        
        return [];
    }

    renderServicesGallery() {
        try {
            const servicesGrid = document.getElementById('servicesGrid');
            if (!servicesGrid) return;

            const serviceGalleries = this.businessData.serviceGalleries || {};
            const serviceNames = Object.keys(serviceGalleries);

            if (serviceNames.length === 0) {
                servicesGrid.innerHTML = '<p class="text-muted">No services added yet. Click Edit to add services.</p>';
                return;
            }

            let html = '';
            serviceNames.forEach(serviceName => {
                try {
                    const rawImages = serviceGalleries[serviceName];
                    
                    // Normalize images to always be an array
                    const images = this.normalizeImagesArray(rawImages);
                    
                    if (!Array.isArray(images) || images.length === 0) {
                        return; // Skip services with no images
                    }
                    
                    const isEditMode = this.editMode;
                    const displayImages = images;
                    
                    html += `
                        <div class="service-card" data-service-name="${serviceName.replace(/"/g, '&quot;')}">
                            <h4>${serviceName}</h4>
                            <div class="service-gallery ${isEditMode ? 'edit-mode' : ''}">
                                ${displayImages.map((img, index) => {
                                    try {
                                        const imageUrl = typeof img === 'string' ? img : (img.image || img.url || img);
                                        if (!imageUrl) return '';
                                        const escapedUrl = imageUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                                        const escapedName = serviceName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                                        
                                        if (isEditMode) {
                                            return `
                                                <div class="gallery-item" data-image-url="${escapedUrl}">
                                                    <img src="${imageUrl}" alt="${escapedName}" loading="lazy" onclick="openImageModal('${escapedUrl}', '${escapedName}')" style="cursor: pointer;">
                                                    <button type="button" class="btn-delete-image" onclick="previewManager.deleteImage('${escapedUrl}', '${escapedName}')" title="Delete image">
                                                        Delete
                                                    </button>
                                                </div>
                                            `;
                                        } else {
                                            // Get price if available
                                            const price = typeof img === 'object' && img.price !== undefined && img.price !== null ? img.price : null;
                                            const priceDisplay = price ? `<div class="gallery-item-price">R${parseFloat(price).toFixed(2)}</div>` : '';
                                            
                                            return `
                                                <div class="gallery-item">
                                                    <img src="${imageUrl}" alt="${escapedName}" loading="lazy" onclick="openImageModal('${escapedUrl}', '${escapedName}')" style="cursor: pointer;">
                                                    ${priceDisplay}
                                                </div>
                                            `;
                                        }
                                    } catch (err) {
                                        console.warn('Error rendering image:', err, img);
                                        return '';
                                    }
                                }).filter(html => html !== '').join('')}
                            </div>
                            ${!isEditMode && images.length > 6 ? `<p class="text-muted mt-2">+${images.length - 6} more images</p>` : ''}
                        </div>
                    `;
                } catch (err) {
                    console.error(`Error rendering service "${serviceName}":`, err);
                    // Continue with next service
                }
            });

            // Add Upload button in edit mode
            if (this.editMode) {
                html += `
                    <div class="service-card upload-card">
                        <button type="button" class="btn-upload-new" onclick="redirectToBusinessManagement()">
                            Upload New Images
                        </button>
                        <p class="text-muted mt-2"><small>Add more images to your gallery</small></p>
                    </div>
                `;
            }

            servicesGrid.innerHTML = html || '<p class="text-muted">No services with images found.</p>';
        } catch (error) {
            console.error('Error rendering services gallery:', error);
            const servicesGrid = document.getElementById('servicesGrid');
            if (servicesGrid) {
                servicesGrid.innerHTML = '<p class="text-danger">Error loading services. Please try again.</p>';
            }
        }
    }

    async deleteImage(imageUrl, imageName) {
        // Store the image URL and name for the confirmation
        this.pendingDeleteImageUrl = imageUrl;
        this.pendingDeleteImageName = imageName;
        
        // Show the delete confirmation modal
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteImageModal'));
        deleteModal.show();
    }

    async confirmDeleteImage() {
        const imageUrl = this.pendingDeleteImageUrl;
        const imageName = this.pendingDeleteImageName;
        
        if (!imageUrl) {
            return;
        }
        
        // Hide the modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteImageModal'));
        if (deleteModal) {
            deleteModal.hide();
        }
        
        // Disable the delete button and show loading state
        const confirmBtn = document.getElementById('confirmDeleteImageBtn');
        const originalText = confirmBtn ? confirmBtn.innerHTML : '';
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = 'Deleting...';
        }
        
        try {
            // Get current service galleries
            const serviceGalleries = this.businessData.serviceGalleries || {};
            const updatedServiceGalleries = {};
            
            // Remove the deleted image from service galleries
            Object.keys(serviceGalleries).forEach(serviceName => {
                const images = this.normalizeImagesArray(serviceGalleries[serviceName]);
                const remainingImages = images.filter(img => {
                    const imgUrl = typeof img === 'string' ? img : (img.image || img.url || img);
                    return imgUrl && imgUrl !== imageUrl;
                });
                
                if (remainingImages.length > 0) {
                    updatedServiceGalleries[serviceName] = remainingImages;
                }
            });
            
            // Get business description
            const servicesData = await window.businessAWSAuthService.getServices();
            const businessDescription = servicesData.businessDescription || '';
            
            // Send delete request to API
            const BASE_URL = 'https://acc.comparehubprices.site';
            const response = await fetch(`${BASE_URL}/business/business/manage-services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    businessDescription: businessDescription,
                    services: [], // Empty services array
                    updatedServiceGalleries: updatedServiceGalleries, // Send updated structure
                    deletedImages: [imageUrl] // Send single image to delete
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete image');
            }
            
            // Update local data
            this.businessData.serviceGalleries = updatedServiceGalleries;
            
            // Re-render gallery
            this.renderServicesGallery();
            
            // Clear pending delete
            this.pendingDeleteImageUrl = null;
            this.pendingDeleteImageName = null;
            
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image: ' + (error.message || 'Unknown error'));
        } finally {
            // Re-enable the delete button
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalText;
            }
            // Clear pending delete
            this.pendingDeleteImageUrl = null;
            this.pendingDeleteImageName = null;
        }
    }

    renderSocialMedia() {
        const socialButtons = document.getElementById('socialButtons');
        if (!socialButtons) return;

        const socialMedia = this.businessData.socialMedia || {};
        const socialLinks = [
            { key: 'facebook', icon: 'fab fa-facebook', label: 'Facebook', color: '#1877f2' },
            { key: 'instagram', icon: 'fab fa-instagram', label: 'Instagram', color: '#e4405f' },
            { key: 'twitter', icon: 'fab fa-x-twitter', label: 'Twitter', color: '#000000' },
            { key: 'linkedin', icon: 'fab fa-linkedin', label: 'LinkedIn', color: '#0077b5' },
            { key: 'tiktok', icon: 'fab fa-tiktok', label: 'TikTok', color: '#000000' },
            { key: 'whatsapp', icon: 'fab fa-whatsapp', label: 'WhatsApp', color: '#25d366' }
        ];

        let html = '';
        socialLinks.forEach(social => {
            const url = socialMedia[social.key];
            if (url && url.trim()) {
                // Ensure URL has protocol
                let finalUrl = url.trim();
                if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                    if (social.key === 'whatsapp') {
                        // WhatsApp links should be in format: https://wa.me/1234567890
                        const phoneNumber = finalUrl.replace(/[^0-9]/g, '');
                        finalUrl = `https://wa.me/${phoneNumber}`;
                    } else {
                        finalUrl = `https://${finalUrl}`;
                    }
                }
                html += `
                    <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="social-btn ${social.key}">
                        <i class="${social.icon}"></i>
                        <span>${social.label}</span>
                    </a>
                `;
            }
        });

        if (html === '') {
            html = '<p class="text-muted">No social media links added. Update your social media links in Business Account Settings.</p>';
        }

        socialButtons.innerHTML = html;
    }

    renderContactInfo() {
        const contactDetails = document.getElementById('contactDetails');
        if (!contactDetails) return;

        // Use contactInfo from API response, fallback to businessData fields for backward compatibility
        const contactInfo = this.businessData.contactInfo || {};
        const business = this.businessData;
        
        const businessName = contactInfo.businessName || business.businessName || '';
        const address = contactInfo.address || business.businessAddress || '';
        const phone = contactInfo.phone || business.businessNumber || '';
        const email = contactInfo.email || business.businessEmail || business.email || '';
        // Get logo from businessData - businessLogoUrl is the actual field name in business-users table
        const logo = business.businessLogoUrl || 
                     business.logo || 
                     business.businessLogo || 
                     business.logoUrl ||
                     business.profileImage ||
                     business.image ||
                     '';
        
        let html = '';

        // Display logo at the top if available
        if (logo) {
            html += `<div class="mb-3 text-center" style="padding-bottom: 1rem; border-bottom: 1px solid #dee2e6;">
                <img src="${this.escapeHtml(logo)}" alt="${this.escapeHtml(businessName || 'Business Logo')}" 
                     style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid #dee2e6; object-fit: cover; width: 100%; height: auto;" 
                     onerror="this.style.display='none'">
            </div>`;
        }

        if (businessName) {
            html += `<p><strong>Business Name:</strong> ${this.escapeHtml(businessName)}</p>`;
        }
        if (address) {
            html += `<p><strong>Address:</strong> ${this.escapeHtml(address)}</p>`;
        }
        if (phone) {
            html += `<p><strong>Phone:</strong> <a href="tel:${phone}">${this.escapeHtml(phone)}</a></p>`;
        }
        if (email) {
            html += `<p><strong>Email:</strong> <a href="mailto:${email}">${this.escapeHtml(email)}</a></p>`;
        }

        if (html === '' && !logo) {
            html = '<p class="text-muted">No contact information available. Update your contact details in Business Account Settings.</p>';
        }

        contactDetails.innerHTML = html;
    }

    renderBusinessHours() {
        const businessHours = document.getElementById('businessHours');
        if (!businessHours) return;

        // Use businessHours from API response
        const hours = this.businessData.businessHours || '';

        if (hours && hours.trim()) {
            businessHours.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${this.escapeHtml(hours)}</pre>`;
        } else {
            businessHours.innerHTML = '<p class="text-muted">Business hours not specified. Update your business hours in Business Account Settings.</p>';
        }
    }

    toggleEditMode() {
        // Open comprehensive edit modal instead of inline editing
        this.openEditModal();
    }

    async openEditModal() {
        try {
            // Fetch current data to populate the modal
            const BASE_URL = 'https://acc.comparehubprices.site';
            const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
            
            const response = await fetch(MANAGE_PRODUCTS_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load business data');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load business data');
            }

            // Populate modal with current data
            document.getElementById('editBusinessDescription').value = data.businessDescription || '';
            document.getElementById('editOurServices').value = data.ourServices || '';
            document.getElementById('editMoreInformation').value = data.moreInformation || '';
            
            // Clear existing products in modal
            const productsContainer = document.getElementById('editProductsContainer');
            productsContainer.innerHTML = '';
            
            // Store original product names to track deletions
            window.originalProductNames = [];
            if (data.products && Array.isArray(data.products)) {
                data.products.forEach((product, index) => {
                    if (product.name) {
                        window.originalProductNames.push(product.name.trim());
                    }
                    this.addProductToEditModal(product, index + 1);
                });
            }
            
            // If no products, add one empty product
            if (!data.products || data.products.length === 0) {
                this.addProductToEditModal(null, 1);
                window.originalProductNames = [];
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('editBusinessModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error opening edit modal:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast('Failed to load business data: ' + error.message, 'Error');
            } else {
                alert('Failed to load business data: ' + error.message);
            }
        }
    }

    addProductToEditModal(product = null, productNumber = null) {
        const container = document.getElementById('editProductsContainer');
        if (!container) return;
        
        // If productNumber is null, calculate it
        if (productNumber === null) {
            const existingProducts = container.querySelectorAll('.edit-product-item');
            productNumber = existingProducts.length + 1;
        }
        
        // Determine if this is an existing product or new
        const isExisting = product !== null;
        const productName = product?.name || '';
        const productDescription = product?.description || '';
        const productImages = Array.isArray(product?.images) ? product.images : [];
        
        // Create product HTML
        const productHtml = `
            <div class="edit-product-item mb-4 p-3 border rounded" data-product-index="${productNumber}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-primary mb-0">
                        ${isExisting ? `<i class="fas fa-box"></i> ` : ''}Product/Service ${productNumber}
                    </h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeProductFromEditModal(this)">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                
                <div class="row">
                    <div class="col-md-12 mb-3">
                        <label class="form-label">Product/Service Name *</label>
                        <input type="text" class="form-control edit-product-name" value="${this.escapeHtml(productName)}" required placeholder="e.g., Custom Birthday Cards">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Description <span class="text-muted">(optional)</span></label>
                    <textarea class="form-control edit-product-description" rows="2" placeholder="Describe what this service includes...">${this.escapeHtml(productDescription)}</textarea>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Gallery Images * (Up to 6 images)</label>
                    <div id="existingImages_${productNumber}" class="mb-3">
                        ${this.renderExistingImages(productImages, productNumber)}
                    </div>
                    <div class="row" id="newImages_${productNumber}">
                        ${this.renderNewImageInputs(productNumber, productImages.length)}
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', productHtml);
        
        // Setup image preview handlers for new inputs
        this.setupImagePreviewsForEditModal(productNumber);
    }

    renderExistingImages(images, productNumber) {
        if (!images || images.length === 0) {
            return '<p class="text-muted small">No existing images. Add new images below.</p>';
        }
        
        let html = '<div class="existing-images-grid mb-3"><p class="small fw-bold mb-2">Existing Images:</p>';
        
        images.forEach((img, index) => {
            const imgUrl = typeof img === 'string' ? img : (img.image || img.url || '');
            const imgPrice = typeof img === 'object' && img.price !== undefined ? img.price : '';
            
            if (imgUrl) {
                html += `
                    <div class="existing-image-item mb-2 p-2 border rounded d-flex align-items-center" data-image-url="${this.escapeHtml(imgUrl)}">
                        <img src="${this.escapeHtml(imgUrl)}" alt="Product image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                        <div class="flex-grow-1">
                            <div class="small">
                                <strong>Price:</strong> 
                                <input type="number" class="form-control form-control-sm d-inline-block" style="width: 100px;" 
                                       value="${imgPrice}" step="0.01" min="0" 
                                       onchange="updateImagePrice('${this.escapeHtml(imgUrl)}', this.value)">
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeExistingImage('${this.escapeHtml(imgUrl)}', ${productNumber})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    renderNewImageInputs(productNumber, existingImageCount) {
        let html = '';
        const slotsToShow = Math.max(2, 6 - existingImageCount); // Show at least 2 slots, up to 6 total
        
        for (let i = 1; i <= slotsToShow; i++) {
            html += `
                <div class="col-md-6 mb-2">
                    <div class="image-upload-container">
                        <input type="file" class="form-control edit-product-image-${productNumber}-${i}" accept="image/*">
                        <div class="form-text small">Image ${i} (JPG, PNG, GIF - Max 5MB)</div>
                        <input type="number" class="form-control mt-2 edit-product-price-${productNumber}-${i}" placeholder="Price (optional)" step="0.01" min="0">
                        <div class="image-preview-container-edit" style="display: none; margin-top: 10px;">
                            <img class="image-preview-edit" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
                            <button type="button" class="btn btn-sm btn-danger mt-2 remove-image-preview-btn" onclick="removeImagePreview(this)">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    setupImagePreviewsForEditModal(productNumber) {
        // Setup preview for all image inputs for this product
        for (let i = 1; i <= 6; i++) {
            const input = document.querySelector(`.edit-product-image-${productNumber}-${i}`);
            if (input) {
                input.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        // Validate file size
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
                            const container = input.closest('.image-upload-container');
                            let previewContainer = container.querySelector('.image-preview-container-edit');
                            if (!previewContainer) {
                                previewContainer = document.createElement('div');
                                previewContainer.className = 'image-preview-container-edit';
                                previewContainer.style.cssText = 'display: block; margin-top: 10px;';
                                container.appendChild(previewContainer);
                            }
                            
                            const img = previewContainer.querySelector('.image-preview-edit') || document.createElement('img');
                            img.className = 'image-preview-edit';
                            img.style.cssText = 'max-width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 10px;';
                            img.src = e.target.result;
                            
                            if (!previewContainer.querySelector('.image-preview-edit')) {
                                previewContainer.insertBefore(img, previewContainer.firstChild);
                            } else {
                                previewContainer.querySelector('.image-preview-edit').src = e.target.result;
                            }
                            
                            // Add remove button if not exists
                            if (!previewContainer.querySelector('.remove-image-preview-btn')) {
                                const removeBtn = document.createElement('button');
                                removeBtn.type = 'button';
                                removeBtn.className = 'btn btn-sm btn-danger remove-image-preview-btn';
                                removeBtn.textContent = 'Remove';
                                removeBtn.onclick = () => {
                                    input.value = '';
                                    previewContainer.style.display = 'none';
                                };
                                previewContainer.appendChild(removeBtn);
                            }
                            
                            previewContainer.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    editSection(sectionName) {
        if (sectionName === 'about') {
            const descriptionEl = document.getElementById('businessDescription');
            if (descriptionEl) {
                descriptionEl.contentEditable = 'true';
                // Show save button, hide edit button
                const aboutSection = descriptionEl.closest('.business-overview');
                const editBtn = aboutSection.querySelector('.btn-edit-inline');
                const saveBtn = aboutSection.querySelector('.btn-save-inline');
                if (editBtn) editBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'block';
            }
        } else if (sectionName === 'services') {
            // Services editing is handled by toggleEditMode
            // Just ensure edit mode is enabled
            if (!this.editMode) {
                this.toggleEditMode();
            }
            // Don't show save button for services - delete is immediate
            const servicesSection = document.getElementById('businessServices');
            const editBtn = servicesSection.querySelector('.btn-edit-inline');
            const saveBtn = servicesSection.querySelector('.btn-save-inline');
            if (editBtn) editBtn.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
        }
    }

    async postBusiness() {
        try {
            // Collect updated data
            const descriptionEl = document.getElementById('businessDescription');
            const hoursEl = document.getElementById('businessHours');
            
            const updatedData = {
                businessDescription: descriptionEl ? descriptionEl.innerHTML.trim() : '',
                businessHours: hoursEl ? hoursEl.textContent.trim() : ''
            };

            // Show loading state
            const postBtn = document.getElementById('postBtn');
            const originalText = postBtn.innerHTML;
            postBtn.disabled = true;
            postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

            const BASE_URL = 'https://acc.comparehubprices.site';
            const SUBMIT_APPROVAL_URL = `${BASE_URL}/business/business/submit-for-approval`;
            const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;

            // First, save any description changes using manage-products Lambda
            if (updatedData.businessDescription && this.businessData) {
                try {
                    // Fetch existing products from API to ensure correct structure
                    let existingProducts = [];
                    try {
                        const productsResponse = await fetch(MANAGE_PRODUCTS_URL, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                        });
                        if (productsResponse.ok) {
                            const productsData = await productsResponse.json();
                            if (productsData.success && Array.isArray(productsData.products)) {
                                existingProducts = productsData.products;
                            }
                        }
                    } catch (fetchError) {
                        console.warn('Could not fetch existing products, using serviceGalleries:', fetchError);
                        // Fallback to serviceGalleries if API fetch fails
                        if (this.businessData.serviceGalleries) {
                            Object.keys(this.businessData.serviceGalleries).forEach(serviceName => {
                                const images = this.businessData.serviceGalleries[serviceName];
                                if (Array.isArray(images) && images.length > 0) {
                                    existingProducts.push({
                                        name: serviceName,
                                        description: '',
                                        images: images
                                    });
                                }
                            });
                        }
                    }
                    
                    // Update description while preserving existing products
                    await fetch(MANAGE_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            businessDescription: updatedData.businessDescription,
                            ourServices: this.businessData.ourServices || '',
                            products: existingProducts // Preserve existing products (no new images to upload)
                        })
                    });
                } catch (error) {
                    console.warn('Could not update business description:', error);
                    // Continue even if update fails - submit for approval anyway
                }
            }

            // Submit business post for admin approval using new Lambda
            console.log('Submitting business for approval...');
            const response = await fetch(SUBMIT_APPROVAL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}) // Empty body - Lambda gets data from local-hub-info table
            });
            
            console.log('Submit response status:', response.status);
            
            // Handle 401 gracefully
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }

            const data = await response.json();
            console.log('Submit response data:', data);

            if (!response.ok || !data.success) {
                // Handle specific error cases
                if (data.error === 'NO_SESSION' || data.error === 'INVALID_SESSION' || data.error === 'SESSION_EXPIRED') {
                    throw new Error('Your session has expired. Please log in again.');
                }
                if (data.error === 'USER_INACTIVE') {
                    throw new Error('Your business account is not active. Please contact support.');
                }
                if (data.error === 'NO_PRODUCTS') {
                    throw new Error('Please add at least one product with images before posting.');
                }
                throw new Error(data.message || 'Failed to submit business for approval');
            }

            // Show success message using toast
            const successMessage = data.message || 'Business submitted for approval! Your post is pending admin review. Approval typically takes 2-24 hours, but may be faster if everything looks good.';
            if (typeof showSuccessToast === 'function') {
                showSuccessToast(successMessage, 'Post Submitted');
            } else {
                alert(successMessage);
            }
            
            // Disable both Post and Edit buttons after toast appears
            const editBtn = document.getElementById('editModeBtn');
            postBtn.disabled = true;
            postBtn.style.display = 'none';
            if (editBtn) {
                editBtn.disabled = true;
                editBtn.style.display = 'none';
            }
            
            // Show pending status badge
            const statusBadge = document.getElementById('statusBadge');
            const statusText = document.getElementById('statusText');
            if (statusBadge) {
                statusBadge.style.display = 'inline-flex';
                statusBadge.className = 'badge bg-warning text-dark';
            }
            if (statusText) {
                statusText.textContent = 'Pending';
            }
            
            // Reload data
            await this.init();
        } catch (error) {
            console.error('Error posting business:', error);
            
            // Show error message using toast
            const errorMessage = error.message || error.response?.message || 'Please try again.';
            if (typeof showErrorToast === 'function') {
                showErrorToast(`Error posting business: ${errorMessage}`, 'Post Failed');
            } else {
                alert(`Error posting business: ${errorMessage}`);
            }
            
            const postBtn = document.getElementById('postBtn');
            postBtn.disabled = false;
            postBtn.innerHTML = 'Post';
        }
    }

    async checkApprovalStatus() {
        try {
            const BASE_URL = 'https://acc.comparehubprices.site';
            const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
            
            const response = await fetch(MANAGE_PRODUCTS_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                // Status is in local-hub-info table: DRAFT, SUBMITTED, PUBLISHED, REJECTED
                const status = data.status || 'DRAFT';
                // Store status and rejection reason in businessData
                if (!this.businessData) {
                    this.businessData = {};
                }
                this.businessData.status = status;
                this.businessData.rejectionReason = data.rejectionReason || null;
                this.updateButtonStates(status);
            }
        } catch (error) {
            console.error('Error checking approval status:', error);
            // Default to DRAFT if check fails
            this.updateButtonStates('DRAFT');
        }
    }

    updateButtonStates(status) {
        const postBtn = document.getElementById('postBtn');
        const editBtn = document.getElementById('editModeBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const statusBadge = document.getElementById('statusBadge');
        const statusText = document.getElementById('statusText');
        
        // Hide status badge by default
        if (statusBadge) {
            statusBadge.style.display = 'none';
        }
        
        // Reset all buttons
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.style.display = 'inline-block';
        }
        if (editBtn) {
            editBtn.disabled = false;
            editBtn.style.display = 'inline-block';
        }
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }
        
        // Update based on status
        if (status === 'REJECTED' || status === 'rejected') {
            // Rejected - show Edit and Post buttons, show Rejected status, display rejection reason
            if (postBtn) {
                postBtn.style.display = 'inline-block';
                postBtn.disabled = false;
            }
            if (editBtn) {
                editBtn.style.display = 'inline-block';
                editBtn.disabled = false;
            }
            if (statusBadge && statusText) {
                statusBadge.style.display = 'inline-flex';
                statusBadge.className = 'badge bg-danger text-white';
                statusText.innerHTML = '<i class="fas fa-times-circle"></i> Rejected';
            }
            // Show rejection reason alert
            const rejectionAlert = document.getElementById('rejectionReasonAlert');
            const rejectionReasonText = document.getElementById('rejectionReasonText');
            if (rejectionAlert && rejectionReasonText) {
                const rejectionReason = this.businessData.rejectionReason || 'No reason provided.';
                rejectionReasonText.textContent = rejectionReason;
                rejectionAlert.style.display = 'block';
            }
        } else if (status === 'SUBMITTED' || status === 'pending') {
            // Pending approval - disable both buttons, show pending status
            if (postBtn) {
                postBtn.disabled = true;
                postBtn.style.display = 'none';
            }
            if (editBtn) {
                editBtn.disabled = true;
                editBtn.style.display = 'none';
            }
            if (statusBadge && statusText) {
                statusBadge.style.display = 'inline-flex';
                statusBadge.className = 'badge bg-warning text-dark';
                statusText.textContent = 'Pending';
            }
            // Hide rejection reason alert
            const rejectionAlert = document.getElementById('rejectionReasonAlert');
            if (rejectionAlert) {
                rejectionAlert.style.display = 'none';
            }
        } else if (status === 'PUBLISHED' || status === 'approved') {
            // Approved - show Edit button, hide Post button, show Approved status
            if (postBtn) {
                postBtn.style.display = 'none';
            }
            if (editBtn) {
                editBtn.style.display = 'inline-block';
                editBtn.disabled = false;
            }
            // Show Approved badge
            if (statusBadge && statusText) {
                statusBadge.style.display = 'inline-flex';
                statusBadge.className = 'badge bg-success text-white';
                statusText.innerHTML = '<i class="fas fa-check-circle"></i> Approved';
            }
            // Track if user has edited after approval
            if (this.hasEditedAfterApproval) {
                // After editing, show Post button and change status to show it needs resubmission
                if (postBtn) {
                    postBtn.style.display = 'inline-block';
                    postBtn.disabled = false;
                }
                if (statusBadge && statusText) {
                    statusBadge.style.display = 'inline-flex';
                    statusBadge.className = 'badge bg-info text-white';
                    statusText.innerHTML = '<i class="fas fa-edit"></i> Edited - Resubmit';
                }
            }
            // Hide rejection reason alert
            const rejectionAlert = document.getElementById('rejectionReasonAlert');
            if (rejectionAlert) {
                rejectionAlert.style.display = 'none';
            }
        } else {
            // DRAFT - show both buttons, hide status badge
            if (postBtn) {
                postBtn.style.display = 'inline-block';
                postBtn.disabled = false;
            }
            if (editBtn) {
                editBtn.style.display = 'inline-block';
                editBtn.disabled = false;
            }
            if (statusBadge) {
                statusBadge.style.display = 'none';
            }
            // Hide rejection reason alert
            const rejectionAlert = document.getElementById('rejectionReasonAlert');
            if (rejectionAlert) {
                rejectionAlert.style.display = 'none';
            }
        }
    }

    async deleteCatalogue() {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteCatalogueModal'));
        deleteModal.show();
    }

    async confirmDeleteCatalogue() {
        console.log('confirmDeleteCatalogue method called');
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteCatalogueModal'));
        if (deleteModal) {
            deleteModal.hide();
        }

        const confirmBtn = document.getElementById('confirmDeleteCatalogueBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }

        try {
            const deleteBtn = document.getElementById('deleteBtn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            }
            
            const BASE_URL = 'https://acc.comparehubprices.site';
            const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
            
            // Get current products to delete them all
            const getResponse = await fetch(MANAGE_PRODUCTS_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            let productsToDelete = [];
            if (getResponse.ok) {
                const data = await getResponse.json();
                if (data.success && Array.isArray(data.products)) {
                    productsToDelete = data.products.map(p => p.name);
                }
            }
            
            // Delete all catalogue data
            const response = await fetch(MANAGE_PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    businessDescription: '',
                    ourServices: '',
                    moreInformation: '',
                    products: [],
                    deletedProducts: productsToDelete
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete catalogue');
            }
            
            const result = await response.json();
            
            if (result.success) {
                if (typeof showSuccessToast === 'function') {
                    showSuccessToast('All catalogue data has been deleted successfully.', 'Deleted');
                } else {
                    alert('All catalogue data has been deleted successfully.');
                }
                
                // Reload data
                await this.init();
            } else {
                throw new Error(result.message || 'Failed to delete catalogue');
            }
        } catch (error) {
            console.error('Error deleting catalogue:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast(`Error deleting catalogue: ${error.message}`, 'Delete Failed');
            } else {
                alert(`Error deleting catalogue: ${error.message}`);
            }
        } finally {
            const deleteBtn = document.getElementById('deleteBtn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            }
            const confirmBtn = document.getElementById('confirmDeleteCatalogueBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Yes, Delete All';
            }
        }
    }

    showError(message) {
        const mainContent = document.querySelector('.business-main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4>Error</h4>
                    <p>${message}</p>
                    <a href="business_management.html" class="btn btn-primary">Go to Business Management</a>
                </div>
            `;
        }
    }
}

// Global functions for onclick handlers
let previewManager;

function toggleEditMode() {
    if (previewManager) {
        previewManager.toggleEditMode();
    }
}

function editSection(section) {
    // Focus on the section for editing
    const sectionMap = {
        'about': 'businessDescription',
        'hours': 'businessHours',
        'services': 'servicesGrid',
        'social': 'socialButtons',
        'contact': 'contactDetails'
    };

    const elementId = sectionMap[section];
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (element.contentEditable === 'true') {
                element.focus();
            }
        }
    }
}

async function postBusiness() {
    if (previewManager) {
        await previewManager.postBusiness();
    }
}

function deleteCatalogue() {
    console.log('deleteCatalogue function called');
    try {
        const modalElement = document.getElementById('deleteCatalogueModal');
        if (!modalElement) {
            console.error('Delete catalogue modal not found');
            alert('Delete confirmation modal not found. Please refresh the page.');
            return;
        }
        
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap is not loaded');
            alert('Bootstrap library not loaded. Please refresh the page.');
            return;
        }
        
        console.log('Opening delete catalogue modal');
        const deleteModal = new bootstrap.Modal(modalElement);
        deleteModal.show();
    } catch (error) {
        console.error('Error opening delete modal:', error);
        alert('Error opening delete confirmation: ' + error.message);
    }
}

window.deleteCatalogue = deleteCatalogue;

async function confirmDeleteCatalogue() {
    console.log('confirmDeleteCatalogue function called');
    try {
        const manager = window.previewManager || previewManager;
        if (manager) {
            await manager.confirmDeleteCatalogue();
        } else {
            console.error('previewManager not found');
            alert('Preview manager not initialized. Please refresh the page.');
        }
    } catch (error) {
        console.error('Error in confirmDeleteCatalogue:', error);
        alert('Error deleting catalogue: ' + error.message);
    }
}

window.confirmDeleteCatalogue = confirmDeleteCatalogue;

// Function to open image modal
function openImageModal(imageUrl, imageAlt) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    if (modal && modalImage) {
        modalImage.src = imageUrl;
        modalImage.alt = imageAlt || 'Service Image';
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

// Function to edit section
function editSection(sectionName) {
    if (previewManager) {
        previewManager.editSection(sectionName);
    }
}

// Function to save About section
async function saveAboutSection() {
    if (!previewManager) return;
    
    try {
        const descriptionEl = document.getElementById('businessDescription');
        if (!descriptionEl) return;
        
        const saveBtn = document.querySelector('.business-overview .btn-save-inline');
        const originalText = saveBtn ? saveBtn.innerHTML : '';
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = 'Saving...';
        }
        
        const businessDescription = descriptionEl.innerHTML.trim();
        
        // Save using manageServices API
        if (window.businessAWSAuthService) {
            // Get existing serviceGalleries to pass as updatedServiceGalleries
            // This tells the Lambda it's an update request, so it won't require new services
            const existingServiceGalleries = previewManager.businessData?.serviceGalleries || {};
            
            await window.businessAWSAuthService.manageServices(
                businessDescription, 
                [], // Empty services array since we're just updating description
                existingServiceGalleries, // Pass existing galleries to indicate update
                [] // No images to delete
            );
            alert('Business description saved successfully!');
            
            // Make non-editable and hide save button
            descriptionEl.contentEditable = 'false';
            const aboutSection = descriptionEl.closest('.business-overview');
            const editBtn = aboutSection.querySelector('.btn-edit-inline');
            if (editBtn) editBtn.style.display = 'block';
            if (saveBtn) {
                saveBtn.style.display = 'none';
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
            
            // Reload preview
            await previewManager.loadServicesData();
            previewManager.renderBusinessDescription();
        } else {
            throw new Error('Business auth service not available');
        }
    } catch (error) {
        console.error('Error saving about section:', error);
        alert('Failed to save business description: ' + (error.message || 'Unknown error'));
        const saveBtn = document.querySelector('.business-overview .btn-save-inline');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save';
        }
    }
}

// Function to redirect to business management and open upload modal
function redirectToBusinessManagement() {
    // Store a flag in sessionStorage to open modal on business_management.html
    sessionStorage.setItem('openUploadModal', 'true');
    window.location.href = 'business_management.html';
}

// Function to save Services section (not used anymore - delete is immediate)
async function saveServicesSection() {
    // Services are now deleted immediately, so this function redirects to upload
    redirectToBusinessManagement();
}

// Global function for delete confirmation (called from modal button)
function confirmDeleteImage() {
    if (previewManager) {
        previewManager.confirmDeleteImage();
    } else if (testPreviewManager) {
        testPreviewManager.confirmDeleteImage();
    }
}

// Global functions for edit modal
function addProductToEditModal() {
    if (previewManager) {
        previewManager.addProductToEditModal();
    }
}

function removeProductFromEditModal(button) {
    const productItem = button.closest('.edit-product-item');
    if (productItem) {
        const container = document.getElementById('editProductsContainer');
        const allProducts = container.querySelectorAll('.edit-product-item');
        
        if (allProducts.length <= 1) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('You must have at least one product/service', 'Warning');
            } else {
                alert('You must have at least one product/service');
            }
            return;
        }
        
        productItem.remove();
        
        // Renumber remaining products
        const remaining = container.querySelectorAll('.edit-product-item');
        remaining.forEach((item, index) => {
            const title = item.querySelector('h6');
            if (title) {
                title.innerHTML = `<i class="fas fa-box"></i> Product/Service ${index + 1}`;
            }
            item.setAttribute('data-product-index', index + 1);
        });
    }
}

function removeExistingImage(imageUrl, productNumber) {
    if (!confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
        return;
    }
    
    // Remove the image element
    const imageItem = document.querySelector(`[data-image-url="${imageUrl.replace(/"/g, '&quot;')}"]`);
    if (imageItem) {
        imageItem.remove();
    }
    
    // Store removed image URL for deletion
    if (!window.removedImages) {
        window.removedImages = [];
    }
    window.removedImages.push(imageUrl);
}

function updateImagePrice(imageUrl, newPrice) {
    // Store price update for this image
    if (!window.imagePriceUpdates) {
        window.imagePriceUpdates = {};
    }
    window.imagePriceUpdates[imageUrl] = parseFloat(newPrice) || 0;
}

function removeImagePreview(button) {
    const container = button.closest('.image-upload-container');
    const input = container.querySelector('input[type="file"]');
    const previewContainer = container.querySelector('.image-preview-container-edit');
    
    if (input) input.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
}

async function saveBusinessChanges() {
    if (!previewManager) {
        console.error('Preview manager not initialized');
        return;
    }
    
    try {
        const form = document.getElementById('editBusinessForm');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get business description and services
        const businessDescription = document.getElementById('editBusinessDescription').value.trim();
        const ourServices = document.getElementById('editOurServices').value.trim();
        const moreInformation = document.getElementById('editMoreInformation')?.value.trim() || '';
        
        if (!businessDescription) {
            alert('Business description is required');
            return;
        }
        
        // Collect products from modal
        const products = [];
        const productItems = document.querySelectorAll('.edit-product-item');
        
        for (const productItem of productItems) {
            const productName = productItem.querySelector('.edit-product-name')?.value?.trim();
            const productDescription = productItem.querySelector('.edit-product-description')?.value?.trim();
            
            if (!productName) continue; // Skip products without names
            
            const product = {
                name: productName,
                description: productDescription || ''
            };
            
            // Collect existing images (that weren't removed) with their updated prices
            const existingImageItems = productItem.querySelectorAll('.existing-image-item');
            const existingImages = [];
            existingImageItems.forEach(item => {
                const imgUrl = item.getAttribute('data-image-url');
                if (imgUrl && !(window.removedImages || []).includes(imgUrl)) {
                    const priceInput = item.querySelector('input[type="number"]');
                    const price = priceInput ? (parseFloat(priceInput.value) || 0) : null;
                    const imageObj = {
                        image: imgUrl
                    };
                    if (price && price > 0) {
                        imageObj.price = price;
                    }
                    existingImages.push(imageObj);
                }
            });
            
            // Process new images (up to 6 total)
            const productNumber = productItem.getAttribute('data-product-index');
            let newImageCount = 0;
            const maxNewImages = 6 - existingImages.length;
            
            for (let i = 1; i <= 6 && newImageCount < maxNewImages; i++) {
                const imageInput = productItem.querySelector(`.edit-product-image-${productNumber}-${i}`);
                const priceInput = productItem.querySelector(`.edit-product-price-${productNumber}-${i}`);
                
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
                        product[`image${newImageCount + 1}Base64`] = base64;
                        product[`image${newImageCount + 1}ContentType`] = file.type;
                        
                        if (priceInput && priceInput.value) {
                            product[`image${newImageCount + 1}Price`] = priceInput.value;
                        }
                        newImageCount++;
                    } catch (error) {
                        console.error(`Error processing image ${i}:`, error);
                        alert(`Error processing image ${i} for "${productName}"`);
                        return;
                    }
                }
            }
            
            // Store existing images in product for Lambda to merge
            // The Lambda will merge new images with existing ones from the database
            // We include existing images here so the Lambda knows to preserve them
            if (existingImages.length > 0) {
                // Store as a flag that this product has existing images to preserve
                product.hasExistingImages = true;
                product.existingImagesCount = existingImages.length;
            }
            
            // Only add product if it has at least one image (existing or new)
            if (newImageCount > 0 || existingImages.length > 0) {
                products.push(product);
            }
        }
        
        if (products.length === 0) {
            alert('Please add at least one product with at least one image');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveBusinessChangesBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const BASE_URL = 'https://acc.comparehubprices.site';
        const MANAGE_PRODUCTS_URL = `${BASE_URL}/business/business/manage-products`;
        
        // Collect deleted images
        const deletedImages = window.removedImages || [];
        
        // Track deleted products (products that existed before but are not in the current save)
        const deletedProducts = [];
        const currentProductNames = products.map(p => p.name.trim());
        const originalProductNames = window.originalProductNames || [];
        
        originalProductNames.forEach(originalName => {
            if (!currentProductNames.includes(originalName)) {
                deletedProducts.push(originalName);
            }
        });
        
        // Prepare request body
        const requestBody = {
            businessDescription: businessDescription,
            ourServices: ourServices,
            moreInformation: moreInformation,
            products: products
        };
        
        if (deletedImages.length > 0) {
            requestBody.deletedImages = deletedImages;
        }
        
        if (deletedProducts.length > 0) {
            requestBody.deletedProducts = deletedProducts;
        }
        
        // Save changes
        const response = await fetch(MANAGE_PRODUCTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody)
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
            throw new Error(data.message || 'Failed to save changes');
        }
        
        // Show success message
        if (typeof showSuccessToast === 'function') {
            showSuccessToast('Business information updated successfully!', 'Success');
        } else {
            alert('Business information updated successfully!');
        }
        
        // Mark that user has edited after approval
        if (previewManager) {
            previewManager.hasEditedAfterApproval = true;
            // Update button states to show Post button
            previewManager.updateButtonStates('PUBLISHED');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editBusinessModal'));
        if (modal) {
            modal.hide();
        }
        
        // Clear removed images and products tracking
        window.removedImages = [];
        window.imagePriceUpdates = {};
        window.originalProductNames = [];
        
        // Reload preview
        await previewManager.init();
        
    } catch (error) {
        console.error('Error saving business changes:', error);
        
        // Handle session expiration
        if (error.message && error.message.includes('session')) {
            alert('Your session has expired. Please log in again.');
            window.location.href = 'business-login.html';
            return;
        }
        
        if (typeof showErrorToast === 'function') {
            showErrorToast(error.message || 'Failed to save changes', 'Error');
        } else {
            alert('Error: ' + (error.message || 'Failed to save changes'));
        }
    } finally {
        const saveBtn = document.getElementById('saveBusinessChangesBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }
}

// Helper function to convert file to base64
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    previewManager = new BusinessPreviewManager();
    window.previewManager = previewManager;
    previewManager.init();
});

