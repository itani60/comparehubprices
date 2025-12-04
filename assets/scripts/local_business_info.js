// Local Business Info Page
// Fetches and displays single business details on local_business_info.html

const API_BASE_URL = 'https://acc.comparehubprices.site/business/business/public';
const REACTIONS_API_BASE_URL = 'https://acc.comparehubprices.site/business/business/reaction';
const REVIEW_HELPFUL_API_URL = 'https://acc.comparehubprices.site/business/business/review/helpful';
const REVIEW_REPORT_API_URL = 'https://acc.comparehubprices.site/business/business/review/report';

class BusinessInfoManager {
    constructor() {
        this.businessId = null;
        this.businessData = null;
        this.galleryData = {};
        this.reviewsData = [];
        this.reviewsStatistics = {};
        this.reactionsData = {}; // Store reactions for each service: { serviceName: { likesCount: number, userHasLiked: boolean } }
        this.helpfulVotes = {}; // Store which reviews user has marked as helpful: { reviewId: true }
        
        this.init();
    }

    async init() {
        // Get business ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.businessId = urlParams.get('id') || urlParams.get('businessId');
        
        if (!this.businessId) {
            this.showError('No business ID provided');
            return;
        }

        await this.loadBusiness();
    }

    async loadBusiness() {
        try {
            // Fetch from API
            const response = await fetch(`${API_BASE_URL}/${this.businessId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.business) {
                this.businessData = data.business;
                this.renderBusiness();
            } else {
                throw new Error(data.message || 'Business not found');
            }
        } catch (error) {
            console.error('Error loading business:', error);
            this.showError('Failed to load business information. Please try again.');
        }
    }

    renderBusiness() {
        if (!this.businessData) return;

        // Debug: Log business data structure
        console.log('Business Data:', this.businessData);
        console.log('Description:', this.businessData.businessDescription || this.businessData.description);
        console.log('More Information:', this.businessData.moreInformation);
        console.log('Our Services:', this.businessData.ourServices);

        this.renderHero();
        this.renderDescription();
        this.renderOurServices();
        this.renderMoreInformation();
        this.renderServicesAndGallery();
        this.renderMap();
        this.renderSocialButtons();
        
        // Initialize reviews data
        this.reviewsData = [];
        this.reviewsStatistics = {};
        
        // Load reviews from API
        this.loadReviews();
        
        // Load reactions from API
        this.loadReactions();
        
        // Set gallery data for modal
        if (this.businessData.serviceGalleries) {
            if (typeof setGalleryData === 'function') {
                setGalleryData(this.businessData.serviceGalleries);
            }
        }
    }

    renderHero() {
        const business = this.businessData;
        const logo = business.logo || business.businessLogoUrl || 'assets/logo .png';
        const name = business.businessName || business.name || 'Business';
        const description = business.businessDescription || business.description || '';
        const category = business.businessCategory || business.category || 'General';
        const address = business.businessAddress || business.address || '';
        // Rating will be loaded from API in loadReviews() and updated via updateHeroRating()

        // Hero image
        const heroImage = document.getElementById('businessHeroImage');
        if (heroImage) {
            heroImage.src = logo;
            heroImage.alt = name;
        }

        // Category badge
        const categoryBadge = document.getElementById('businessCategoryBadge');
        if (categoryBadge) {
            categoryBadge.textContent = category;
        }

        // Title
        const title = document.getElementById('businessTitle');
        if (title) {
            title.textContent = name;
        }

        // Breadcrumb business name
        const breadcrumbBusinessName = document.getElementById('breadcrumbBusinessName');
        if (breadcrumbBusinessName) {
            breadcrumbBusinessName.textContent = name;
        }

        // Subtitle
        const subtitle = document.getElementById('businessSubtitle');
        if (subtitle) {
            subtitle.textContent = description.substring(0, 100) + (description.length > 100 ? '...' : '');
        }

        // Rating - Will be updated when reviews load from API
        const ratingStars = document.getElementById('businessRatingStars');
        const ratingText = document.getElementById('businessRatingText');
        if (ratingStars) {
            // Use business data rating if available, otherwise show 0
            const businessRating = business.averageRating || 0;
            ratingStars.innerHTML = this.renderStarsHTML(businessRating);
        }
        if (ratingText) {
            const businessRating = business.averageRating || 0;
            const businessTotalRatings = business.totalRatings || 0;
            ratingText.textContent = businessRating > 0 
                ? `${businessRating.toFixed(1)} (${businessTotalRatings} ${businessTotalRatings === 1 ? 'review' : 'reviews'})`
                : '0.0 (0 reviews)';
        }

        // Location
        const locationText = document.getElementById('businessLocationText');
        if (locationText) {
            locationText.textContent = address || 'Address not available';
        }

        // Followers count
        const followersCountEl = document.getElementById('followersCount');
        if (followersCountEl) {
            const followersCount = business.followersCount || 0;
            followersCountEl.textContent = `${followersCount} ${followersCount === 1 ? 'follower' : 'followers'}`;
        }

        // Setup follow button
        this.setupFollowButton();
        
        // Load actual followers count if not available or is 0
        this.loadFollowersCount();
    }

    async loadFollowersCount() {
        if (!this.businessId) return;

        try {
            const response = await fetch(`https://acc.comparehubprices.site/business/business/followers/${this.businessId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.followers)) {
                    const followersCountEl = document.getElementById('followersCount');
                    if (followersCountEl) {
                        const count = data.followers.length;
                        followersCountEl.textContent = `${count} ${count === 1 ? 'follower' : 'followers'}`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading followers count:', error);
            // Silently fail - keep the count from business data
        }
    }

    async setupFollowButton() {
        const followBtn = document.getElementById('followBusinessBtn');
        if (!followBtn) return;

        // Set up click handler
        followBtn.addEventListener('click', () => {
            this.handleFollowToggle();
        });

        // Check initial follow status
        await this.checkInitialFollowStatus();
    }

    async checkInitialFollowStatus() {
        const followBtn = document.getElementById('followBusinessBtn');
        if (!followBtn || !this.businessId) return;

        try {
            // Get current user info - check both regular and business users
            let currentUser = null;
            let userId = null;
            
            // Try regular user first
            if (typeof window.awsAuthService !== 'undefined' && window.awsAuthService) {
                const userInfo = await window.awsAuthService.getUserInfo();
                if (userInfo.success && userInfo.user) {
                    currentUser = userInfo.user;
                    userId = currentUser.userId || currentUser.email;
                }
            }
            
            // Try business user if regular user not found
            if (!currentUser && typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
                try {
                    const businessUserInfoResult = await window.businessAWSAuthService.getUserInfo();
                    if (businessUserInfoResult && businessUserInfoResult.success && businessUserInfoResult.user) {
                        const businessUser = businessUserInfoResult.user;
                        currentUser = businessUser;
                        // Use the same logic as Lambda: userId || email (this is what's stored as followerId)
                        userId = businessUser.userId || businessUser.email;
                        
                        // Hide follow button if business user is viewing their own business
                        if (businessUser.businessId === this.businessId) {
                            if (followBtn) {
                                followBtn.style.display = 'none';
                            }
                            return;
                        }
                    }
                } catch (error) {
                    console.log('Business auth check failed:', error);
                }
            }

            // If user is not logged in, keep button as "Follow"
            if (!currentUser) {
                return;
            }

            // Get followers list to check if current user is following
            const response = await fetch(`https://acc.comparehubprices.site/business/business/followers/${this.businessId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.followers)) {
                    // Update followers count in hero section
                    const followersCountEl = document.getElementById('followersCount');
                    if (followersCountEl) {
                        const count = data.followers.length;
                        followersCountEl.textContent = `${count} ${count === 1 ? 'follower' : 'followers'}`;
                    }

                    // Check if current user is in followers list
                    // Use the same matching logic as regular users - followerId should match userId || email
                    // This is how the Lambda stores it: followerId = user.userId || user.email
                    const isFollowing = data.followers.some(follower => {
                        // Primary check: followerId matches userId (this is how Lambda stores it for both regular and business users)
                        if (follower.followerId === userId) return true;
                        // Secondary check: email matches
                        if (follower.followerEmail === currentUser.email) return true;
                        // Fallback: check by id field if it exists
                        if (follower.id === userId || follower.id === currentUser.email) return true;
                        return false;
                    });

                    // Always update button state - either set to "Following" or reset to "Follow"
                    const btnIcon = followBtn.querySelector('i');
                    const btnText = followBtn.querySelector('span');
                    
                    if (isFollowing) {
                        followBtn.classList.add('following');
                        if (btnIcon) btnIcon.className = 'fas fa-check';
                        if (btnText) btnText.textContent = 'Following';
                    } else {
                        // Explicitly reset to "Follow" state if not following
                        followBtn.classList.remove('following');
                        if (btnIcon) btnIcon.className = 'fas fa-plus';
                        if (btnText) btnText.textContent = 'Follow';
                    }
                }
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
            // Silently fail - button will default to "Follow"
        }
    }

    async handleFollowToggle() {
        const followBtn = document.getElementById('followBusinessBtn');
        if (!followBtn || !this.businessId) return;

        const isFollowing = followBtn.classList.contains('following');
        const isLoading = followBtn.disabled;

        if (isLoading) return;

        // Check if user is a business user trying to follow their own business
        try {
            if (typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
                const businessUserInfoResult = await window.businessAWSAuthService.getUserInfo();
                if (businessUserInfoResult && businessUserInfoResult.success && businessUserInfoResult.user) {
                    const businessUser = businessUserInfoResult.user;
                    if (businessUser.businessId === this.businessId) {
                        if (typeof showWarningToast === 'function') {
                            showWarningToast('You cannot follow your own business.', 'Warning');
                        } else if (typeof showToast === 'function') {
                            showToast('You cannot follow your own business.', 'warning');
                        } else {
                            alert('You cannot follow your own business.');
                        }
                        return;
                    }
                }
            }
        } catch (error) {
            // If business auth check fails, continue - might be a regular user
            console.log('Business auth check failed or user is not a business user:', error);
        }

        try {
            followBtn.disabled = true;
            const btnText = followBtn.querySelector('span');
            const btnIcon = followBtn.querySelector('i');
            
            if (isFollowing) {
                // Unfollow
                btnText.textContent = 'Unfollowing...';
                btnIcon.className = 'fas fa-spinner fa-spin';
                
                const response = await fetch('https://acc.comparehubprices.site/business/business/unfollow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        businessId: this.businessId
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Update button state to "Follow" immediately
                    followBtn.classList.remove('following');
                    if (btnIcon) btnIcon.className = 'fas fa-plus';
                    if (btnText) btnText.textContent = 'Follow';
                    followBtn.disabled = false;
                    
                    // Update followers count
                    this.updateFollowersCount(-1);
                    
                    // Re-check follow status after a delay to ensure UI is in sync
                    // Use a longer delay to ensure the database has updated
                    setTimeout(() => {
                        this.checkInitialFollowStatus();
                    }, 1000);
                } else {
                    // Handle specific error cases
                    if (data.error === 'CANNOT_FOLLOW_OWN_BUSINESS') {
                        if (typeof showWarningToast === 'function') {
                            showWarningToast('You cannot follow your own business.', 'Warning');
                        } else if (typeof showToast === 'function') {
                            showToast('You cannot follow your own business.', 'warning');
                        } else {
                            alert('You cannot follow your own business.');
                        }
                    } else {
                        throw new Error(data.message || 'Failed to unfollow');
                    }
                }
            } else {
                // Follow
                btnText.textContent = 'Following...';
                btnIcon.className = 'fas fa-spinner fa-spin';
                
                const response = await fetch('https://acc.comparehubprices.site/business/business/follow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        businessId: this.businessId
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Update button state to "Following" immediately
                    followBtn.classList.add('following');
                    if (btnIcon) btnIcon.className = 'fas fa-check';
                    if (btnText) btnText.textContent = 'Following';
                    followBtn.disabled = false;
                    
                    // Update followers count
                    this.updateFollowersCount(1);
                    
                    // Don't re-check immediately - the button state is already correct
                    // Only re-check if needed (e.g., on page refresh)
                } else {
                    // Handle specific error cases
                    if (data.error === 'CANNOT_FOLLOW_OWN_BUSINESS') {
                        if (typeof showWarningToast === 'function') {
                            showWarningToast('You cannot follow your own business.', 'Warning');
                        } else if (typeof showToast === 'function') {
                            showToast('You cannot follow your own business.', 'warning');
                        } else {
                            alert('You cannot follow your own business.');
                        }
                    } else if (data.error === 'NO_SESSION') {
                        if (typeof showWarningToast === 'function') {
                            showWarningToast('Please log in to follow this business.', 'Warning');
                        } else if (typeof showToast === 'function') {
                            showToast('Please log in to follow this business.', 'warning');
                        } else {
                            alert('Please log in to follow this business.');
                        }
                    } else {
                        throw new Error(data.message || 'Failed to follow');
                    }
                }
            }
        } catch (error) {
            console.error('Follow/Unfollow error:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast(error.message || 'An error occurred. Please try again.', 'Error');
            } else if (typeof showToast === 'function') {
                showToast(error.message || 'An error occurred. Please try again.', 'error');
            } else {
                alert(error.message || 'An error occurred. Please try again.');
            }
        } finally {
            followBtn.disabled = false;
        }
    }

    updateFollowersCount(change) {
        const followersCountEl = document.getElementById('followersCount');
        if (followersCountEl) {
            const currentText = followersCountEl.textContent;
            const match = currentText.match(/(\d+)/);
            if (match) {
                const currentCount = parseInt(match[1]);
                const newCount = Math.max(0, currentCount + change);
                followersCountEl.textContent = `${newCount} ${newCount === 1 ? 'follower' : 'followers'}`;
            }
        }
    }

    renderDescription() {
        const business = this.businessData;
        // Check multiple possible field names and nested structures
        const description = business.businessDescription || 
                           business.description || 
                           business.content ||
                           business.businessInfo?.businessDescription ||
                           business.businessInfo?.description ||
                           '';

        const descriptionEl = document.getElementById('businessDescription');
        if (!descriptionEl) {
            console.error('Description element not found!');
            return;
        }

        console.log('Rendering description:', description);
        console.log('Full business object keys:', Object.keys(business));

        let html = '';
        
        if (description && description.trim()) {
            // Split by paragraphs if it contains newlines
            const paragraphs = description.split('\n').filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    html += `<p>${this.escapeHtml(p.trim())}</p>`;
                });
            } else {
                // If no newlines, just display as single paragraph
                html += `<p>${this.escapeHtml(description.trim())}</p>`;
            }
        }

        if (!html) {
            html = '<p>No description available for this business.</p>';
        }

        descriptionEl.innerHTML = html;
    }

    renderOurServices() {
        const business = this.businessData;
        // Check multiple possible field names and nested structures
        const services = business.ourServices || 
                       business.businessInfo?.ourServices ||
                       '';
        const servicesSection = document.getElementById('ourServicesSection');
        const servicesList = document.getElementById('ourServicesList');
        
        console.log('Rendering Our Services:', services);
        console.log('Services Section Element:', servicesSection);
        console.log('Services List Element:', servicesList);
        
        if (!servicesSection || !servicesList) {
            console.error('Our Services section elements not found!');
            return;
        }
        
        if (!services || !services.trim()) {
            console.log('No services data, hiding section');
            servicesSection.style.display = 'none';
            servicesSection.setAttribute('hidden', 'true');
            return;
        }
        
        // Split by newlines and format as list
        const serviceLines = services.split(/\n/).filter(item => item.trim());
        
        console.log('Service lines:', serviceLines);
        
        if (serviceLines.length > 0) {
            let html = '<ul style="color: var(--text); line-height: 1.8; margin: 0; padding-left: 1.5rem;">';
            serviceLines.forEach(line => {
                // Remove bullet point if present, then trim
                const cleaned = line.trim().replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    html += `<li>${this.escapeHtml(cleaned)}</li>`;
                }
            });
            html += '</ul>';
            servicesList.innerHTML = html;
            
            // Show the section - use multiple methods to ensure it's visible
            servicesSection.style.display = 'block';
            servicesSection.removeAttribute('hidden');
            servicesSection.style.visibility = 'visible';
            
            console.log('Services HTML rendered:', html);
            console.log('Services section displayed');
        } else {
            console.log('No service lines after processing, hiding section');
            servicesSection.style.display = 'none';
            servicesSection.setAttribute('hidden', 'true');
        }
    }

    renderMoreInformation() {
        const business = this.businessData;
        // Check multiple possible field names and nested structures
        const moreInfo = business.moreInformation || 
                        business.businessInfo?.moreInformation ||
                        '';
        const moreInfoSection = document.getElementById('moreInformationSection');
        const moreInfoList = document.getElementById('moreInformationList');
        
        console.log('Rendering More Information:', moreInfo);
        console.log('More Info Section Element:', moreInfoSection);
        console.log('More Info List Element:', moreInfoList);
        
        if (!moreInfoSection || !moreInfoList) {
            console.error('More Information section elements not found!');
            return;
        }
        
        if (!moreInfo || !moreInfo.trim()) {
            console.log('No more information data, hiding section');
            moreInfoSection.style.display = 'none';
            moreInfoSection.setAttribute('hidden', 'true');
            return;
        }
        
        // Split by newlines and format as list
        const infoLines = moreInfo.trim().split(/\n/).filter(item => item.trim());
        
        console.log('Info lines:', infoLines);
        
        if (infoLines.length > 0) {
            let html = '<ul style="color: var(--text); line-height: 1.8; margin: 0; padding-left: 1.5rem;">';
            infoLines.forEach(line => {
                // Remove bullet point if present, then trim
                const cleaned = line.trim().replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    html += `<li>${this.escapeHtml(cleaned)}</li>`;
                }
            });
            html += '</ul>';
            moreInfoList.innerHTML = html;
            
            // Show the section - use multiple methods to ensure it's visible
            moreInfoSection.style.display = 'block';
            moreInfoSection.removeAttribute('hidden');
            moreInfoSection.style.visibility = 'visible';
            
            console.log('More Info HTML rendered:', html);
            console.log('More Info section displayed');
        } else {
            console.log('No info lines after processing, hiding section');
            moreInfoSection.style.display = 'none';
            moreInfoSection.setAttribute('hidden', 'true');
        }
    }

    renderServicesAndGallery() {
        const business = this.businessData;
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        if (!business.serviceGalleries || Object.keys(business.serviceGalleries).length === 0) {
            servicesGrid.innerHTML = '<p class="text-muted">No services or gallery items available.</p>';
            return;
        }

        let servicesHTML = '';
        this.galleryData = {};

        Object.keys(business.serviceGalleries).forEach(serviceName => {
            // Skip description keys (keys ending with "_description")
            if (serviceName.endsWith('_description')) {
                return;
            }
            
            const images = business.serviceGalleries[serviceName];
            
            // Get description for this service
            const descriptionKey = `${serviceName}_description`;
            const serviceDescription = business.serviceGalleries[descriptionKey] || '';
            
            // Ensure images is an array
            let imageArray = [];
            if (Array.isArray(images)) {
                imageArray = images;
            } else if (images && typeof images === 'object') {
                // If it's an object, try to convert to array
                if (images.images && Array.isArray(images.images)) {
                    imageArray = images.images;
                } else if (images.items && Array.isArray(images.items)) {
                    imageArray = images.items;
                } else {
                    // Try to get values if it's an object with numeric keys
                    imageArray = Object.values(images).filter(item => item !== null && item !== undefined);
                }
            } else if (typeof images === 'string') {
                // Single image as string
                imageArray = [images];
            }
            
            if (imageArray.length > 0) {
                // Store gallery data for modal
                this.galleryData[serviceName] = imageArray.map(img => {
                    if (typeof img === 'string') {
                        return img;
                    } else if (img && typeof img === 'object') {
                        return img.image || img.url || img.src || '';
                    }
                    return '';
                }).filter(url => url !== '');

                if (this.galleryData[serviceName].length === 0) {
                    return; // Skip if no valid images
                }

                // Show first 4 images, then "+X more" card
                const visibleImages = this.galleryData[serviceName].slice(0, 4);
                const remainingCount = this.galleryData[serviceName].length - 4;

                // Get reaction data for this service
                const reactionData = this.reactionsData[serviceName] || { likesCount: 0, userHasLiked: false };
                const isLiked = reactionData.userHasLiked || false;
                const likesCount = reactionData.likesCount || 0;
                
                // Escape service name for HTML display
                const escapedServiceName = this.escapeHtml(serviceName);
                // Escape for JavaScript string in onclick (escape quotes and backslashes)
                const jsEscapedServiceName = serviceName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                
                servicesHTML += `
                    <div class="service-card">
                        <div class="service-card-header">
                            <h4>${escapedServiceName}</h4>
                            <button class="reaction-btn ${isLiked ? 'liked' : ''}" 
                                    onclick="businessInfoManager.toggleReaction('${jsEscapedServiceName}')"
                                    data-service-name="${escapedServiceName}"
                                    aria-label="${isLiked ? 'Unlike' : 'Like'} this service">
                                <i class="fas fa-heart"></i>
                                <span class="reaction-count">${likesCount}</span>
                            </button>
                        </div>
                        ${serviceDescription ? `<p class="service-description">${this.escapeHtml(serviceDescription)}</p>` : ''}
                        <div class="service-gallery">
                            ${visibleImages.map((imageUrl, index) => {
                                return `
                                    <div class="gallery-item" onclick="openGalleryModal('${this.escapeHtml(serviceName)}', ${index})">
                                        <div class="gallery-item-image-wrapper">
                                            <img src="${imageUrl}" alt="${this.escapeHtml(serviceName)}" loading="lazy" onerror="this.src='assets/logo .png'">
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            ${remainingCount > 0 ? `
                                <div class="gallery-more" onclick="openGalleryModal('${this.escapeHtml(serviceName)}', 4)">
                                    <span>+${remainingCount} more</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });

        servicesGrid.innerHTML = servicesHTML || '<p class="text-muted">No services or gallery items available.</p>';
    }

    renderMap() {
        const business = this.businessData;
        const address = business.address || business.businessAddress || '';
        
        if (address && typeof renderBusinessMap === 'function') {
            renderBusinessMap(address);
        }
    }

    renderSocialButtons() {
        const business = this.businessData;
        const socialButtons = document.getElementById('socialButtons');
        if (!socialButtons) return;

        const social = business.socialMedia || {};
        const phone = business.phone || business.businessNumber || '';

        let buttonsHTML = '';

        // Phone
        if (phone) {
            buttonsHTML += `
                <a href="tel:${phone}" class="social-btn phone">
                    <i class="fas fa-phone"></i>
                    <span>Call Us</span>
                </a>
            `;
        }

        // WhatsApp
        if (social.whatsapp) {
            buttonsHTML += `
                <a href="${social.whatsapp}" target="_blank" class="social-btn whatsapp">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </a>
            `;
        }

        // Instagram
        if (social.instagram) {
            buttonsHTML += `
                <a href="${social.instagram}" target="_blank" class="social-btn instagram">
                    <i class="fab fa-instagram"></i>
                    <span>Instagram</span>
                </a>
            `;
        }

        // TikTok
        if (social.tiktok) {
            buttonsHTML += `
                <a href="${social.tiktok}" target="_blank" class="social-btn tiktok">
                    <i class="fab fa-tiktok"></i>
                    <span>TikTok</span>
                </a>
            `;
        }

        // Twitter/X
        if (social.twitter) {
            buttonsHTML += `
                <a href="${social.twitter}" target="_blank" class="social-btn twitter">
                    <i class="fa-brands fa-x-twitter"></i>
                    <span>Twitter</span>
                </a>
            `;
        }

        // Facebook
        if (social.facebook) {
            buttonsHTML += `
                <a href="${social.facebook}" target="_blank" class="social-btn facebook">
                    <i class="fab fa-facebook"></i>
                    <span>Facebook</span>
                </a>
            `;
        }

        socialButtons.innerHTML = buttonsHTML || '<p class="text-muted">No social media links available.</p>';
    }

    renderReviews() {
        const reviewsSummary = document.getElementById('reviewsSummary');
        const reviewsList = document.getElementById('reviewsList');
        
        const averageRating = this.getAverageRating();
        const totalRatings = this.getTotalRatings();
        const reviews = this.getReviews();

        // Render summary
        if (reviewsSummary) {
            const stats = this.getReviewStatistics();
            
            reviewsSummary.innerHTML = `
                <div class="rating-stats">
                    <div class="rating-score-large">${averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</div>
                    <div class="rating-stars large">
                        ${this.renderStarsHTML(averageRating)}
                    </div>
                    <div class="rating-count">${totalRatings} ${totalRatings === 1 ? 'review' : 'reviews'}</div>
                </div>
                <div class="rating-breakdown">
                    ${[5, 4, 3, 2, 1].map(star => {
                        const count = stats[star] || 0;
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                        return `
                            <div class="rating-bar">
                                <span class="star-label">${star} ${star === 1 ? 'star' : 'stars'}</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Render reviews list
        if (reviewsList) {
            if (reviews.length === 0) {
                reviewsList.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                        <h4>No reviews yet</h4>
                        <p class="text-muted">Be the first to review this business!</p>
                    </div>
                `;
            } else {
                reviewsList.innerHTML = reviews.map(review => this.renderReviewCard(review)).join('');
            }
        }
    }

    renderReviewCard(review) {
        const initials = this.getInitials(review.reviewerName || 'Anonymous');
        const date = this.formatReviewDate(review.date || review.timestamp);
        const isHelpful = this.helpfulVotes[review.id] || false;
        const helpfulCount = review.helpfulCount || 0;
        
        // Extract reviewerUserId from review.id (format: businessId#reviewerUserId)
        // Also check if review has userId field directly
        const reviewerUserId = review.userId || (review.id.includes('#') ? review.id.split('#')[1] : '');
        
        return `
            <div class="review-card ${review.isUserReview ? 'user-review' : ''}" data-review-id="${this.escapeHtml(review.id)}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div class="reviewer-details">
                            <h4>${this.escapeHtml(review.reviewerName || 'Anonymous')}</h4>
                            <div class="review-rating">
                                <div class="rating-stars">
                                    ${this.renderStarsHTML(review.rating)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="review-meta">
                        <div class="review-date">${date}</div>
                        ${review.isUserReview ? '<div class="your-review-badge">Your Review</div>' : ''}
                    </div>
                </div>
                <div class="review-content">
                    <p>${this.escapeHtml(review.comment || '')}</p>
                </div>
                ${!review.isUserReview ? `
                    <div class="review-actions">
                        <button class="helpful-btn ${isHelpful ? 'marked' : ''}" 
                                onclick="businessInfoManager.toggleReviewHelpful('${this.escapeHtml(review.id)}', '${this.escapeHtml(reviewerUserId)}')"
                                data-review-id="${this.escapeHtml(review.id)}">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="helpful-text">${isHelpful ? 'Helpful' : 'Helpful'}</span>
                            <span class="helpful-count">(${helpfulCount})</span>
                        </button>
                        <button class="report-btn" onclick="businessInfoManager.reportReview('${this.escapeHtml(review.id)}', '${this.escapeHtml(reviewerUserId)}')">
                            <i class="fas fa-flag"></i>
                            Report
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async loadReviews() {
        if (!this.businessId) return;

        try {
            const response = await fetch(`https://acc.comparehubprices.site/business/business/reviews/${this.businessId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.reviews)) {
                    this.reviewsData = data.reviews;
                    this.reviewsStatistics = data.statistics || {};
                    
                    // Check if current user has reviewed
                    await this.checkUserReview();
                    
                    // Check which reviews user has marked as helpful (optional - can be done on-demand)
                    // For now, we'll track it when user clicks helpful button
                    
                    // Render reviews
                    this.renderReviews();
                    
                    // Update hero rating display
                    this.updateHeroRating();
                }
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviewsData = [];
            this.renderReviews();
        }
    }

    async checkUserReview() {
        if (!this.reviewsData || this.reviewsData.length === 0) return;

        try {
            // Get current user info
            let currentUser = null;
            if (typeof window.awsAuthService !== 'undefined' && window.awsAuthService) {
                const userInfo = await window.awsAuthService.getUserInfo();
                if (userInfo.success && userInfo.user) {
                    currentUser = userInfo.user;
                }
            }

            if (currentUser) {
                const userId = currentUser.userId || currentUser.email;
                // Mark user's review
                this.reviewsData.forEach(review => {
                    if (review.reviewerEmail === currentUser.email || 
                        review.id.includes(userId) ||
                        review.id.includes(currentUser.email)) {
                        review.isUserReview = true;
                    }
                });
            }
        } catch (error) {
            console.error('Error checking user review:', error);
        }
    }

    updateHeroRating() {
        if (this.reviewsStatistics && this.reviewsStatistics.averageRating !== undefined) {
            const averageRating = this.reviewsStatistics.averageRating;
            const totalRatings = this.reviewsStatistics.totalReviews || 0;
            
            const ratingStars = document.getElementById('businessRatingStars');
            const ratingText = document.getElementById('businessRatingText');
            
            if (ratingStars) {
                ratingStars.innerHTML = this.renderStarsHTML(averageRating);
            }
            if (ratingText) {
                ratingText.textContent = averageRating > 0 
                    ? `${averageRating.toFixed(1)} (${totalRatings} ${totalRatings === 1 ? 'review' : 'reviews'})`
                    : '0.0 (0 reviews)';
            }
        }
    }

    getAverageRating() {
        if (this.reviewsStatistics && this.reviewsStatistics.averageRating !== undefined) {
            return this.reviewsStatistics.averageRating;
        }
        return 0;
    }

    getTotalRatings() {
        if (this.reviewsStatistics && this.reviewsStatistics.totalReviews !== undefined) {
            return this.reviewsStatistics.totalReviews;
        }
        return 0;
    }

    getReviews() {
        if (this.reviewsData && Array.isArray(this.reviewsData)) {
            return this.reviewsData.map(r => ({
                id: r.id || `${r.businessId}#${r.userId}`,
                reviewerName: r.reviewerName || 'Anonymous',
                rating: r.rating || 0,
                comment: r.comment || '',
                date: r.date || r.createdAt || new Date().toISOString(),
                helpfulCount: r.helpfulCount || 0,
                isUserReview: r.isUserReview || false
            }));
        }
        return [];
    }

    getReviewStatistics() {
        // Use statistics from API if available
        if (this.reviewsStatistics && this.reviewsStatistics.ratingBreakdown) {
            return this.reviewsStatistics.ratingBreakdown;
        }
        
        // Fallback: calculate from reviews
        const reviews = this.getReviews();
        const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        reviews.forEach(review => {
            const rating = Math.round(review.rating);
            if (rating >= 1 && rating <= 5) {
                stats[rating]++;
            }
        });
        
        return stats;
    }

    renderStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        return starsHTML;
    }

    getInitials(name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    formatReviewDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="container py-5">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
                    </div>
                </div>
            `;
        }
    }

    getCurrentBusinessId() {
        return this.businessId;
    }
}

// Gallery Modal Functions
let currentGallery = [];
let currentGalleryIndex = 0;
let currentServiceName = '';

function setGalleryData(serviceGalleries) {
    window.galleryData = {};
    if (serviceGalleries) {
        Object.keys(serviceGalleries).forEach(serviceName => {
            const images = serviceGalleries[serviceName];
            if (Array.isArray(images)) {
                window.galleryData[serviceName] = images.map(img => {
                    return typeof img === 'string' ? img : (img.image || img.url || '');
                });
            }
        });
    }
}

function openGalleryModal(serviceName, imageIndex = 0) {
    if (!window.galleryData || !window.galleryData[serviceName] || window.galleryData[serviceName].length === 0) return;
    
    currentGallery = window.galleryData[serviceName];
    currentGalleryIndex = imageIndex;
    currentServiceName = serviceName;
    
    const modal = document.getElementById('galleryModal');
    const modalTitle = document.getElementById('galleryModalTitle');
    
    if (modalTitle) {
        modalTitle.textContent = serviceName;
    }
    
    updateGalleryImage();
    
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

function updateGalleryImage() {
    if (!currentGallery || currentGalleryIndex === undefined) return;
    
    const modalImage = document.getElementById('galleryModalImage');
    const modalCounter = document.getElementById('galleryCounter');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    
    const currentImage = currentGallery[currentGalleryIndex];
    
    if (modalImage) {
        modalImage.classList.remove('loaded');
        modalImage.classList.add('loading');
        modalImage.src = '';
        modalImage.src = currentImage;
        modalImage.alt = `${currentServiceName} - Image ${currentGalleryIndex + 1}`;
        
        modalImage.onload = () => {
            modalImage.classList.remove('loading');
            modalImage.classList.add('loaded');
        };
    }
    
    if (modalCounter) {
        modalCounter.textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentGalleryIndex === 0;
        prevBtn.style.opacity = currentGalleryIndex === 0 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentGalleryIndex === currentGallery.length - 1;
        nextBtn.style.opacity = currentGalleryIndex === currentGallery.length - 1 ? '0.5' : '1';
    }
}

function previousGalleryImage() {
    if (currentGalleryIndex > 0) {
        currentGalleryIndex--;
        updateGalleryImage();
    }
}

function nextGalleryImage() {
    if (currentGalleryIndex < currentGallery.length - 1) {
        currentGalleryIndex++;
        updateGalleryImage();
    }
}

// Make functions globally accessible
window.openGalleryModal = openGalleryModal;
window.previousGalleryImage = previousGalleryImage;
window.nextGalleryImage = nextGalleryImage;
window.setGalleryData = setGalleryData;

// Render Business Map
function renderBusinessMap(address) {
    if (!address) return;
    
    const encodedAddress = encodeURIComponent(address);
    
    const mapIframe = `
        <iframe
            title="Business location map"
            width="100%"
            height="260"
            style="border:0; border-radius: 12px;"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=${encodedAddress}&output=embed">
        </iframe>
    `;
    
    const mainMap = document.getElementById('businessMapMain');
    if (mainMap) {
        mainMap.innerHTML = mapIframe;
    }
}

window.renderBusinessMap = renderBusinessMap;

// Rating Modal Functionality
let selectedRating = 0;

function openRatingModal() {
    selectedRating = 0;
    const modal = document.getElementById('ratingModal');
    if (modal) {
        // Update modal content with current business data
        updateRatingModalContent();
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        // Reset stars
        resetStars();
    }
}

function updateRatingModalContent() {
    if (!window.businessInfoManager || !window.businessInfoManager.businessData) return;
    
    const business = window.businessInfoManager.businessData;
    const businessId = window.businessInfoManager.businessId;
    
    // Use API data if available, otherwise use business data
    const averageRating = window.businessInfoManager.getAverageRating() || business.averageRating || 0;
    const totalRatings = window.businessInfoManager.getTotalRatings() || business.totalRatings || 0;
    
    // Update business name in modal
    const modalTitle = document.getElementById('ratingModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Rate ${business.businessName || business.name || 'This Business'}`;
    }
    
    // Update current rating display
    const ratingScore = document.getElementById('currentRatingScore');
    const ratingCount = document.getElementById('currentRatingCount');
    const ratingStars = document.getElementById('currentRatingStars');
    
    if (ratingScore) {
        ratingScore.textContent = averageRating > 0 ? averageRating.toFixed(1) : '0.0';
    }
    if (ratingCount) {
        ratingCount.textContent = `${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'}`;
    }
    if (ratingStars) {
        ratingStars.innerHTML = window.businessInfoManager.renderStarsHTML(averageRating);
    }
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }
    document.body.style.overflow = 'auto';
}

function selectRating(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('.interactive-star');
    const labels = document.querySelectorAll('.rating-label');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star interactive-star';
        } else {
            star.className = 'far fa-star interactive-star';
        }
    });
    
    labels.forEach(label => {
        label.classList.remove('active');
        if (parseInt(label.dataset.rating) === rating) {
            label.classList.add('active');
        }
    });
}

function resetStars() {
    const stars = document.querySelectorAll('.interactive-star');
    const labels = document.querySelectorAll('.rating-label');
    
    stars.forEach(star => {
        star.className = 'far fa-star interactive-star';
    });
    
    labels.forEach(label => {
        label.classList.remove('active');
    });
}

async function submitRating() {
    const reviewText = document.getElementById('ratingReview')?.value.trim() || '';
    
    if (selectedRating === 0) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Please select a rating before submitting.', 'Warning');
        } else if (typeof showToast === 'function') {
            showToast('Please select a rating before submitting.', 'warning');
        } else {
            alert('Please select a rating before submitting.');
        }
        return;
    }
    
    if (!window.businessInfoManager || !window.businessInfoManager.businessId) {
        if (typeof showErrorToast === 'function') {
            showErrorToast('Business information not available.', 'Error');
        } else if (typeof showToast === 'function') {
            showToast('Business information not available.', 'error');
        } else {
            alert('Business information not available.');
        }
        return;
    }
    
    const businessId = window.businessInfoManager.businessId;
    
    // Check if user is a business user trying to rate their own business
    try {
        if (typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
            const businessUserInfoResult = await window.businessAWSAuthService.getUserInfo();
            if (businessUserInfoResult && businessUserInfoResult.success && businessUserInfoResult.user) {
                const businessUser = businessUserInfoResult.user;
                if (businessUser.businessId === businessId) {
                    if (typeof showWarningToast === 'function') {
                        showWarningToast('You cannot rate your own business. Please rate other businesses instead.', 'Warning');
                    } else if (typeof showToast === 'function') {
                        showToast('You cannot rate your own business. Please rate other businesses instead.', 'warning');
                    } else {
                        alert('You cannot rate your own business. Please rate other businesses instead.');
                    }
                    return;
                }
            }
        }
    } catch (error) {
        // If business auth check fails, continue - might be a regular user
        console.log('Business auth check failed or user is not a business user:', error);
    }
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('.rating-actions .btn-primary');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
        
        const response = await fetch('https://acc.comparehubprices.site/business/business/rating/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                businessId: businessId,
                rating: selectedRating,
                comment: reviewText
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Show success toast notification
            if (typeof showSuccessToast === 'function') {
                showSuccessToast('Thank you! Your rating has been submitted.', 'Success');
            } else if (typeof showToast === 'function') {
                showToast('Thank you! Your rating has been submitted.', 'success');
            } else {
                alert('Thank you! Your rating has been submitted.');
            }
            
            // Close modal
            closeRatingModal();
            
            // Reset form
            const reviewTextarea = document.getElementById('ratingReview');
            if (reviewTextarea) {
                reviewTextarea.value = '';
            }
            selectedRating = 0;
            resetStars();
            
            // Reload reviews from API
            if (window.businessInfoManager) {
                await window.businessInfoManager.loadReviews();
                window.businessInfoManager.updateHeroRating();
            }
        } else {
            // Handle specific error cases
            if (data.error === 'CANNOT_RATE_OWN_BUSINESS') {
                if (typeof showWarningToast === 'function') {
                    showWarningToast('You cannot rate your own business. Please rate other businesses instead.', 'Warning');
                } else if (typeof showToast === 'function') {
                    showToast('You cannot rate your own business. Please rate other businesses instead.', 'warning');
                } else {
                    alert('You cannot rate your own business. Please rate other businesses instead.');
                }
            } else if (data.error === 'NO_SESSION') {
                if (typeof showWarningToast === 'function') {
                    showWarningToast('Please log in to submit a rating.', 'Warning');
                } else if (typeof showToast === 'function') {
                    showToast('Please log in to submit a rating.', 'warning');
                } else {
                    alert('Please log in to submit a rating.');
                }
            } else {
                throw new Error(data.message || 'Failed to submit rating');
            }
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        if (typeof showErrorToast === 'function') {
            showErrorToast(error.message || 'An error occurred while submitting your rating. Please try again.', 'Error');
        } else if (typeof showToast === 'function') {
            showToast(error.message || 'An error occurred while submitting your rating. Please try again.', 'error');
        } else {
            alert(error.message || 'An error occurred while submitting your rating. Please try again.');
        }
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('.rating-actions .btn-primary');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Rating';
        }
    }
}

function showRatingSuccess() {
    const successMsg = document.createElement('div');
    successMsg.className = 'rating-success-message show';
    successMsg.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Thank you! Your rating has been submitted.</span>
    `;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(successMsg)) {
                document.body.removeChild(successMsg);
            }
        }, 300);
    }, 3000);
}

// Add hover effects to rating labels
function addRatingLabelHoverEffects() {
    const stars = document.querySelectorAll('.interactive-star');
    const labels = document.querySelectorAll('.rating-label');
    
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            labels.forEach((label, labelIndex) => {
                if (labelIndex <= index) {
                    label.classList.add('hover');
                } else {
                    label.classList.remove('hover');
                }
            });
        });
    });
    
    const interactiveRating = document.querySelector('.interactive-rating');
    if (interactiveRating) {
        interactiveRating.addEventListener('mouseleave', () => {
            labels.forEach(label => label.classList.remove('hover'));
        });
    }
}

// Make functions globally accessible
window.openRatingModal = openRatingModal;
window.closeRatingModal = closeRatingModal;
window.selectRating = selectRating;
window.submitRating = submitRating;

// Review helper functions
function markReviewHelpful(reviewId) {
    // TODO: Implement helpful functionality
    console.log('Mark review helpful:', reviewId);
}

function reportReview(reviewId) {
    // TODO: Implement report functionality
    console.log('Report review:', reviewId);
}

window.markReviewHelpful = markReviewHelpful;
window.reportReview = reportReview;

// Review sorting and filtering
function sortReviews() {
    const sortSelect = document.getElementById('reviewSort');
    if (!sortSelect || !window.businessInfoManager) return;
    
    const sortBy = sortSelect.value;
    const reviews = window.businessInfoManager.getReviews();
    
    let sortedReviews = [...reviews];
    
    switch (sortBy) {
        case 'newest':
            sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'highest':
            sortedReviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'lowest':
            sortedReviews.sort((a, b) => a.rating - b.rating);
            break;
        case 'helpful':
            sortedReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
            break;
    }
    
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        reviewsList.innerHTML = sortedReviews.map(review => window.businessInfoManager.renderReviewCard(review)).join('');
    }
}

function filterReviews() {
    const filterSelect = document.getElementById('reviewFilter');
    if (!filterSelect || !window.businessInfoManager) return;
    
    const filterBy = filterSelect.value;
    const reviews = window.businessInfoManager.getReviews();
    
    let filteredReviews = reviews;
    
    if (filterBy !== 'all') {
        const rating = parseInt(filterBy);
        filteredReviews = reviews.filter(review => Math.round(review.rating) === rating);
    }
    
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        if (filteredReviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h4>No reviews found</h4>
                    <p class="text-muted">No reviews match the selected filter.</p>
                </div>
            `;
        } else {
            reviewsList.innerHTML = filteredReviews.map(review => window.businessInfoManager.renderReviewCard(review)).join('');
        }
    }
}

window.sortReviews = sortReviews;
window.filterReviews = filterReviews;

// Share business function
function shareBusiness() {
    if (!window.businessInfoManager || !window.businessInfoManager.businessId) {
        alert('Business information not available.');
        return;
    }
    
    const businessId = window.businessInfoManager.businessId;
    const businessName = window.businessInfoManager.businessData?.businessName || window.businessInfoManager.businessData?.name || 'Business';
    const url = `${window.location.origin}${window.location.pathname}?id=${businessId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Check out ${businessName} on CompareHubPrices`,
            text: `Check out ${businessName} on CompareHubPrices`,
            url: url
        }).catch(err => {
            console.log('Error sharing:', err);
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        } catch (err) {
            alert('Failed to copy link. Please copy manually: ' + text);
        }
        document.body.removeChild(textarea);
    });
}

window.shareBusiness = shareBusiness;

// Followers Modal Functions
async function openFollowersModal() {
    if (!window.businessInfoManager || !window.businessInfoManager.businessId) {
        alert('Business information not loaded');
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('followersModal'));
    modal.show();

    await loadFollowers();
}

async function loadFollowers() {
    if (!window.businessInfoManager || !window.businessInfoManager.businessId) {
        return;
    }

    const businessId = window.businessInfoManager.businessId;
    const loadingEl = document.getElementById('followersLoading');
    const errorEl = document.getElementById('followersError');
    const listEl = document.getElementById('followersList');
    const emptyEl = document.getElementById('followersEmpty');

    // Show loading, hide others
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    listEl.style.display = 'none';
    emptyEl.style.display = 'none';

    try {
        // Try the endpoint URL (matching the pattern used for follow/unfollow)
        const url = `https://acc.comparehubprices.site/business/business/followers/${businessId}`;
        console.log('Fetching followers from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Followers data:', data);

        if (data.success && Array.isArray(data.followers)) {
            loadingEl.style.display = 'none';

            // Update followers count in hero section
            const followersCountEl = document.getElementById('followersCount');
            if (followersCountEl) {
                const count = data.followers.length;
                followersCountEl.textContent = `${count} ${count === 1 ? 'follower' : 'followers'}`;
            }

            if (data.followers.length === 0) {
                emptyEl.style.display = 'block';
            } else {
                listEl.style.display = 'block';
                renderFollowersList(data.followers);
            }
        } else {
            throw new Error(data.message || 'Invalid response format');
        }
    } catch (error) {
        console.error('Error loading followers:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = `Failed to load followers: ${error.message || 'Please try again.'}`;
    }
}

function renderFollowersList(followers) {
    const listEl = document.getElementById('followersList');
    listEl.innerHTML = '';

    followers.forEach(follower => {
        const followerItem = document.createElement('div');
        followerItem.className = 'follower-item';
        
        // For business followers, use business name; for regular users, use their name
        const displayName = follower.followerName || follower.followerEmail || 'User';
        
        // Get initials for avatar
        const initials = getFollowerInitials(displayName);
        
        // Format date
        const followedDate = follower.followedAt ? new Date(follower.followedAt).toLocaleDateString() : '';

        // Add badge for business followers
        const businessBadge = follower.isBusinessFollower ? '<span class="badge bg-primary ms-2" style="font-size: 0.7rem;">Business</span>' : '';
        
        followerItem.innerHTML = `
            <div class="follower-avatar">
                <div class="avatar-circle">${initials}</div>
            </div>
            <div class="follower-info">
                <div class="follower-name">
                    ${escapeHtml(displayName)}
                    ${businessBadge}
                </div>
                ${followedDate ? `<div class="follower-date">Followed ${followedDate}</div>` : ''}
            </div>
        `;

        listEl.appendChild(followerItem);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFollowerInitials(name) {
    // Handle null, undefined, or non-string inputs
    if (!name) return 'U';
    
    // Convert to string if it's not already
    const nameStr = typeof name === 'string' ? name : String(name);
    
    // Handle empty string after conversion
    if (!nameStr || nameStr.trim() === '') return 'U';
    
    const parts = nameStr.trim().split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
}

// Reactions functionality
BusinessInfoManager.prototype.loadReactions = async function() {
    if (!this.businessId) return;
    
    try {
        const response = await fetch(`${REACTIONS_API_BASE_URL}s/${this.businessId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load reactions:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.reactions)) {
            // Process reactions data
            this.reactionsData = {};
            data.reactions.forEach(reaction => {
                const serviceName = reaction.reactionIdOriginal || reaction.reactionId?.replace(`${this.businessId}#`, '') || '';
                if (serviceName) {
                    this.reactionsData[serviceName] = {
                        likesCount: reaction.likesCount || 0,
                        userHasLiked: reaction.userHasLiked || false
                    };
                }
            });
            
            // Re-render services to update reaction buttons
            this.renderServicesAndGallery();
        }
    } catch (error) {
        console.error('Error loading reactions:', error);
    }
};

BusinessInfoManager.prototype.toggleReaction = async function(serviceName) {
    if (!this.businessId || !serviceName) return;
    
    const reactionData = this.reactionsData[serviceName] || { likesCount: 0, userHasLiked: false };
    const isLiked = reactionData.userHasLiked;
    
    // Optimistically update UI
    const button = document.querySelector(`.reaction-btn[data-service-name="${this.escapeHtml(serviceName)}"]`);
    if (button) {
        button.disabled = true;
        button.classList.add('loading');
    }
    
    try {
        const endpoint = isLiked ? 'unlike' : 'like';
        const response = await fetch(`${REACTIONS_API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                businessId: this.businessId,
                reactionId: serviceName
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Check if it's a session/auth error
            if (response.status === 401 || errorData.error === 'NO_SESSION' || errorData.error === 'SESSION_NOT_FOUND') {
                throw new Error('Session not found or invalid. Please log in.');
            }
            throw new Error(errorData.message || `Failed to ${isLiked ? 'unlike' : 'like'} service`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update reactions data
            if (isLiked) {
                // Unlike: decrement count
                this.reactionsData[serviceName] = {
                    likesCount: Math.max(0, (reactionData.likesCount || 1) - 1),
                    userHasLiked: false
                };
            } else {
                // Like: increment count
                this.reactionsData[serviceName] = {
                    likesCount: (reactionData.likesCount || 0) + 1,
                    userHasLiked: true
                };
            }
            
            // Update UI
            this.updateReactionButton(serviceName);
        } else {
            throw new Error(data.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        
        // Check if it's a session error
        const errorMessage = error.message || '';
        const isSessionError = errorMessage.includes('Session') || 
                              errorMessage.includes('session') || 
                              errorMessage.includes('not authenticated') ||
                              errorMessage.includes('NO_SESSION') ||
                              errorMessage.includes('SESSION_NOT_FOUND');
        
        if (isSessionError) {
            // Show toast for session error
            if (typeof showWarningToast === 'function') {
                showWarningToast('Please login to like', 'Warning');
            } else if (typeof showToast === 'function') {
                showToast('Please login to like', 'warning');
            } else {
                alert('Please login to like');
            }
        } else {
            // Show toast for other errors
            if (typeof showErrorToast === 'function') {
                showErrorToast(errorMessage || `Failed to ${isLiked ? 'unlike' : 'like'} service. Please try again.`, 'Error');
            } else if (typeof showToast === 'function') {
                showToast(errorMessage || `Failed to ${isLiked ? 'unlike' : 'like'} service. Please try again.`, 'error');
            } else {
                alert(errorMessage || `Failed to ${isLiked ? 'unlike' : 'like'} service. Please try again.`);
            }
        }
        
        // Revert optimistic update
        if (button) {
            button.disabled = false;
            button.classList.remove('loading');
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }
};

BusinessInfoManager.prototype.updateReactionButton = function(serviceName) {
    // Find button by matching the service name (need to escape for querySelector)
    const buttons = document.querySelectorAll('.reaction-btn[data-service-name]');
    let button = null;
    
    buttons.forEach(btn => {
        if (btn.getAttribute('data-service-name') === serviceName) {
            button = btn;
        }
    });
    
    if (!button) return;
    
    const reactionData = this.reactionsData[serviceName] || { likesCount: 0, userHasLiked: false };
    const isLiked = reactionData.userHasLiked;
    const likesCount = reactionData.likesCount || 0;
    
    // Update button state
    if (isLiked) {
        button.classList.add('liked');
        button.setAttribute('aria-label', 'Unlike this service');
    } else {
        button.classList.remove('liked');
        button.setAttribute('aria-label', 'Like this service');
    }
    
    // Update count
    const countEl = button.querySelector('.reaction-count');
    if (countEl) {
        countEl.textContent = likesCount;
    }
};

window.openFollowersModal = openFollowersModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.businessInfoManager = new BusinessInfoManager();
    addRatingLabelHoverEffects();
    
    // Keyboard navigation for gallery modal
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.addEventListener('shown.bs.modal', function() {
            document.addEventListener('keydown', handleGalleryKeyDown);
        });
        
        galleryModal.addEventListener('hidden.bs.modal', function() {
            document.removeEventListener('keydown', handleGalleryKeyDown);
        });
    }
});

function handleGalleryKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        previousGalleryImage();
    } else if (e.key === 'ArrowRight') {
        nextGalleryImage();
    } else if (e.key === 'Escape') {
        const modal = document.getElementById('galleryModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }
    }
}

// Review Helpful and Report Functions
BusinessInfoManager.prototype.toggleReviewHelpful = async function(reviewId, reviewerUserId) {
    if (!this.businessId || !reviewerUserId) {
        alert('Unable to mark review as helpful. Missing information.');
        return;
    }

    const button = document.querySelector(`.helpful-btn[data-review-id="${this.escapeHtml(reviewId)}"]`);
    if (!button) return;

    // Disable button during request
    button.disabled = true;
    button.classList.add('loading');

    try {
        const response = await fetch(REVIEW_HELPFUL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                businessId: this.businessId,
                reviewerUserId: reviewerUserId,
                reviewId: reviewId
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update helpful votes tracking
            this.helpfulVotes[reviewId] = data.isMarked;
            
            // Update review data
            const review = this.reviewsData.find(r => r.id === reviewId);
            if (review) {
                review.helpfulCount = data.helpfulCount || 0;
            }

            // Update button UI
            if (data.isMarked) {
                button.classList.add('marked');
            } else {
                button.classList.remove('marked');
            }

            // Update count display
            const countSpan = button.querySelector('.helpful-count');
            if (countSpan) {
                countSpan.textContent = `(${data.helpfulCount || 0})`;
            }

            // Show notification
            if (typeof showNotification === 'function') {
                showNotification(data.message || (data.isMarked ? 'Review marked as helpful' : 'Review unmarked'), 'success');
            }
        } else {
            throw new Error(data.message || 'Failed to update helpful status');
        }
    } catch (error) {
        console.error('Error toggling review helpful:', error);
        alert(error.message || 'Failed to update helpful status. Please try again.');
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
    }
};

BusinessInfoManager.prototype.reportReview = function(reviewId, reviewerUserId) {
    if (!this.businessId || !reviewerUserId) {
        alert('Unable to report review. Missing information.');
        return;
    }

    // Store review info for submission
    this.currentReportReviewId = reviewId;
    this.currentReportReviewerUserId = reviewerUserId;

    // Open report modal
    const modal = new bootstrap.Modal(document.getElementById('reportReviewModal'));
    
    // Reset form
    document.getElementById('reportDescription').value = '';
    const reasonInputs = document.querySelectorAll('#reportReviewModal input[name="reportReason"]');
    reasonInputs.forEach(input => {
        input.checked = false;
        const item = input.closest('.report-reason-compact');
        if (item) {
            item.classList.remove('checked');
        }
    });
    if (reasonInputs.length > 0) {
        reasonInputs[0].checked = true; // Default to spam
        const firstItem = reasonInputs[0].closest('.report-reason-compact');
        if (firstItem) {
            firstItem.classList.add('checked');
        }
    }
    
    // Use event delegation on the modal for radio button changes
    const modalElement = document.getElementById('reportReviewModal');
    if (!modalElement._reportRadioListenerAdded) {
        modalElement.addEventListener('change', function(e) {
            if (e.target.type === 'radio' && e.target.name === 'reportReason') {
                document.querySelectorAll('#reportReviewModal .report-reason-compact').forEach(item => {
                    item.classList.remove('checked');
                });
                if (e.target.checked) {
                    const parent = e.target.closest('.report-reason-compact');
                    if (parent) {
                        parent.classList.add('checked');
                    }
                }
            }
        });
        modalElement._reportRadioListenerAdded = true;
    }
    
    modal.show();
};

async function submitReportReview() {
    if (!window.businessInfoManager) return;

    const manager = window.businessInfoManager;
    const reviewId = manager.currentReportReviewId;
    const reviewerUserId = manager.currentReportReviewerUserId;

    if (!reviewId || !reviewerUserId || !manager.businessId) {
        alert('Missing information. Cannot submit report.');
        return;
    }

    // Get selected reason
    const selectedReason = document.querySelector('input[name="reportReason"]:checked');
    if (!selectedReason) {
        alert('Please select a reason for reporting this review.');
        return;
    }

    const reason = selectedReason.value;
    const description = document.getElementById('reportDescription').value.trim();

    // Disable submit button
    const submitBtn = document.querySelector('#reportReviewModal .btn-submit-compact');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        const response = await fetch(REVIEW_REPORT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                businessId: manager.businessId,
                reviewerUserId: reviewerUserId,
                reviewId: reviewId,
                reason: reason,
                description: description
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reportReviewModal'));
            if (modal) {
                modal.hide();
            }

            // Show success notification
            if (typeof showNotification === 'function') {
                showNotification(data.message || 'Review reported successfully. Our team will review it.', 'success');
            } else {
                alert(data.message || 'Review reported successfully. Our team will review it.');
            }

            // Clear stored values
            manager.currentReportReviewId = null;
            manager.currentReportReviewerUserId = null;
        } else {
            throw new Error(data.message || 'Failed to report review');
        }
    } catch (error) {
        console.error('Error reporting review:', error);
        alert(error.message || 'Failed to report review. Please try again.');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
        }
    }
}

function closeReportReviewModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportReviewModal'));
    if (modal) {
        modal.hide();
    }
    
    // Clear stored values
    if (window.businessInfoManager) {
        window.businessInfoManager.currentReportReviewId = null;
        window.businessInfoManager.currentReportReviewerUserId = null;
    }
}

window.submitReportReview = submitReportReview;
window.closeReportReviewModal = closeReportReviewModal;
