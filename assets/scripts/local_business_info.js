const API_BASE_URL = 'https://hub.comparehubprices.co.za/business/business/public';
const REACTIONS_API_BASE_URL = 'https://hub.comparehubprices.co.za/business/business/reaction';
const REVIEW_HELPFUL_API_URL = 'https://hub.comparehubprices.co.za/business/business/review/helpful';
const REVIEW_REPORT_API_URL = 'https://hub.comparehubprices.co.za/business/business/review/report';

class DashboardBusinessElegant {
    constructor() {
        this.businessId = null;
        this.businessData = null;
        this.galleryData = {};
        this.reactionsData = {};
        this.reviewsData = [];
        this.reviewsStatistics = {};
        this.helpfulVotes = {};
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.businessId = urlParams.get('id') || urlParams.get('businessId');
        
        if (!this.businessId) {
            console.error('No business ID provided');
            return;
        }

        await this.loadBusiness();
        await this.setupButtons();
    }

    async loadBusiness() {
        try {
            const response = await fetch(`${API_BASE_URL}/${this.businessId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success && data.business) {
                this.businessData = data.business;
                this.renderDashboard();
                this.renderDescription();
                this.renderOurServices();
                this.renderMoreInformation();
                this.renderServicesAndGallery();
                this.renderMap();
                this.renderSocialButtons();
                await this.loadFollowersCount();
                await this.loadReviews();
                await this.loadReactions();
            }
        } catch (error) {
            console.error('Error loading business:', error);
        }
    }

    renderDashboard() {
        const business = this.businessData;
        
        // Logo
        const logoEl = document.getElementById('businessLogo');
        if (logoEl) {
            const logo = business.logo || business.businessLogoUrl;
            if (logo) {
                logoEl.innerHTML = `<img src="${logo}" alt="${business.businessName || 'Business'}">`;
            } else {
                const initials = (business.businessName || 'BR').substring(0, 2).toUpperCase();
                logoEl.textContent = initials;
            }
        }

        // Name
        const nameEl = document.getElementById('businessName');
        if (nameEl) {
            nameEl.textContent = business.businessName || business.name || 'Business Name';
        }

        // Location
        const locationEl = document.getElementById('businessLocation');
        if (locationEl) {
            locationEl.textContent = business.businessAddress || business.address || '123 Main St, City, Country';
        }

        // Followers (will be updated by loadFollowersCount)
        const followersEl = document.getElementById('followersCount');
        if (followersEl) {
            const count = business.followersCount || 0;
            followersEl.textContent = this.formatCount(count);
        }

        // Rating (will be updated by loadReviewsStats)
        const ratingEl = document.getElementById('ratingValue');
        if (ratingEl) {
            ratingEl.textContent = (business.averageRating || 0).toFixed(1);
        }

        // Reviews count (will be updated by loadReviewsStats)
        const reviewsEl = document.getElementById('reviewsCount');
        if (reviewsEl) {
            reviewsEl.textContent = business.totalRatings || 0;
        }
    }

    async loadFollowersCount() {
        if (!this.businessId) return;

        try {
            const response = await fetch(`https://hub.comparehubprices.co.za/business/business/followers/${this.businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.followers)) {
                    const followersEl = document.getElementById('followersCount');
                    if (followersEl) {
                        followersEl.textContent = this.formatCount(data.followers.length);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading followers:', error);
        }
    }

    async loadReviews() {
        if (!this.businessId) return;

        try {
            const response = await fetch(`https://hub.comparehubprices.co.za/business/business/reviews/${this.businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Handle reviews array
                if (Array.isArray(data.reviews)) {
                    this.reviewsData = data.reviews;
                } else {
                    this.reviewsData = [];
                }
                
                // Handle statistics
                if (data.statistics) {
                    this.reviewsStatistics = {
                        totalReviews: data.statistics.totalReviews || 0,
                        averageRating: data.statistics.averageRating || 0,
                        ratingBreakdown: data.statistics.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    };
                } else {
                    this.reviewsStatistics = {
                        totalReviews: 0,
                        averageRating: 0,
                        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    };
                }
                
                // Update dashboard stats
                const ratingEl = document.getElementById('ratingValue');
                if (ratingEl) {
                    ratingEl.textContent = (this.reviewsStatistics.averageRating || 0).toFixed(1);
                }

                const reviewsEl = document.getElementById('reviewsCount');
                if (reviewsEl) {
                    reviewsEl.textContent = this.reviewsStatistics.totalReviews || 0;
                }
                
                // Check if current user has reviewed
                await this.checkUserReview();
                
                // Render reviews
                this.renderReviews();
            } else {
                console.error('Failed to load reviews:', data.message || 'Unknown error');
                this.reviewsData = [];
                this.reviewsStatistics = {
                    totalReviews: 0,
                    averageRating: 0,
                    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                };
                this.renderReviews();
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviewsData = [];
            this.reviewsStatistics = {
                totalReviews: 0,
                averageRating: 0,
                ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            };
            this.renderReviews();
        }
    }

    async checkUserReview() {
        if (!this.reviewsData || this.reviewsData.length === 0) return;

        try {
            let currentUser = null;
            if (typeof window.awsAuthService !== 'undefined' && window.awsAuthService) {
                const userInfo = await window.awsAuthService.getUserInfo();
                if (userInfo.success && userInfo.user) {
                    currentUser = userInfo.user;
                }
            }
            
            if (!currentUser && typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
                const businessUserInfo = await window.businessAWSAuthService.getUserInfo();
                if (businessUserInfo && businessUserInfo.success && businessUserInfo.user) {
                    currentUser = businessUserInfo.user;
                }
            }

            if (currentUser) {
                const userId = currentUser.userId || currentUser.email;
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

    renderReviews() {
        const reviewsSummary = document.getElementById('reviewsSummaryNew');
        const reviewsList = document.getElementById('reviewsListNew');
        
        const averageRating = this.getAverageRating();
        const totalRatings = this.getTotalRatings();
        const reviews = this.getReviews();

        // Render summary
        if (reviewsSummary) {
            const stats = this.getReviewStatistics();
            
            reviewsSummary.innerHTML = `
                <div class="rating-stats-new">
                    <div class="rating-score-large-new">${averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</div>
                    <div class="rating-stars-large-new">
                        ${this.renderStarsHTML(averageRating)}
                    </div>
                    <div class="rating-count-new">${totalRatings} ${totalRatings === 1 ? 'review' : 'reviews'}</div>
                </div>
                <div class="rating-breakdown-new">
                    ${[5, 4, 3, 2, 1].map(star => {
                        const count = stats[star] || 0;
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                        return `
                            <div class="rating-bar-new">
                                <span class="star-label-new">${star} ${star === 1 ? 'star' : 'stars'}</span>
                                <div class="progress-bar-new">
                                    <div class="progress-fill-new" style="width: ${percentage}%"></div>
                                </div>
                                <span class="count-new">${count}</span>
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
        const reviewerUserId = review.userId || (review.id.includes('#') ? review.id.split('#')[1] : '');
        
        return `
            <div class="review-item-new ${review.isUserReview ? 'user-review-new' : ''}" data-review-id="${this.escapeHtml(review.id)}">
                <div class="review-header-new">
                    <div class="reviewer-info-new">
                        <div class="reviewer-avatar-new">${initials}</div>
                        <div class="reviewer-details-new">
                            <h4 class="review-author-new">${this.escapeHtml(review.reviewerName || 'Anonymous')}</h4>
                            <div class="review-rating-new">
                                ${this.renderStarsHTML(review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="review-meta-new">
                        <div class="review-date-new">${date}</div>
                        ${review.isUserReview ? '<div class="your-review-badge-new">Your Review</div>' : ''}
                    </div>
                </div>
                <div class="review-content-new">
                    <p>${this.escapeHtml(review.comment || '')}</p>
                </div>
                ${!review.isUserReview ? `
                    <div class="review-actions-new">
                        <button class="helpful-btn-new ${isHelpful ? 'marked' : ''}" 
                                onclick="window.dashboardBusinessElegant.toggleReviewHelpful('${this.escapeHtml(review.id)}', '${this.escapeHtml(reviewerUserId)}')"
                                data-review-id="${this.escapeHtml(review.id)}">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="helpful-text-new">Helpful</span>
                            <span class="helpful-count-new">(${helpfulCount})</span>
                        </button>
                        <button class="report-btn-new" onclick="window.dashboardBusinessElegant.reportReview('${this.escapeHtml(review.id)}', '${this.escapeHtml(reviewerUserId)}')">
                            <i class="fas fa-flag"></i>
                            Report
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
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
                isUserReview: r.isUserReview || false,
                userId: r.userId || (r.id && r.id.includes('#') ? r.id.split('#')[1] : '')
            }));
        }
        return [];
    }

    getReviewStatistics() {
        if (this.reviewsStatistics && this.reviewsStatistics.ratingBreakdown) {
            return this.reviewsStatistics.ratingBreakdown;
        }
        
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

    async toggleReviewHelpful(reviewId, reviewerUserId) {
        if (!this.businessId || !reviewerUserId) {
            alert('Unable to mark review as helpful. Missing information.');
            return;
        }

        const button = document.querySelector(`.helpful-btn-new[data-review-id="${this.escapeHtml(reviewId)}"]`);
        if (!button) return;

        button.disabled = true;
        button.classList.add('loading');

        try {
            const response = await fetch(REVIEW_HELPFUL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    businessId: this.businessId,
                    reviewerUserId: reviewerUserId,
                    reviewId: reviewId
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.helpfulVotes[reviewId] = data.isMarked;
                
                const review = this.reviewsData.find(r => r.id === reviewId);
                if (review) {
                    review.helpfulCount = data.helpfulCount || 0;
                }

                if (data.isMarked) {
                    button.classList.add('marked');
                } else {
                    button.classList.remove('marked');
                }

                const countSpan = button.querySelector('.helpful-count-new');
                if (countSpan) {
                    countSpan.textContent = `(${data.helpfulCount || 0})`;
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
    }

    reportReview(reviewId, reviewerUserId) {
        if (!this.businessId || !reviewerUserId) {
            alert('Unable to report review. Missing information.');
            return;
        }

        this.currentReportReviewId = reviewId;
        this.currentReportReviewerUserId = reviewerUserId;

        const modal = document.getElementById('reportReviewModalNew');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Reset form
            const descriptionEl = document.getElementById('reportDescriptionNew');
            if (descriptionEl) descriptionEl.value = '';
            
            const reasonInputs = document.querySelectorAll('#reportReviewModalNew input[name="reportReasonNew"]');
            reasonInputs.forEach(input => {
                input.checked = false;
            });
            if (reasonInputs.length > 0) {
                reasonInputs[0].checked = true;
            }
        }
    }

    async setupButtons() {
        // Follow button
        const followBtn = document.getElementById('followBusinessBtn');
        if (followBtn) {
            this.setupFollowButton(followBtn);
        }

        // Chat button
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            // Check if business user is viewing their own business
            await this.checkAndHideChatButton(chatBtn);
            
            chatBtn.addEventListener('click', () => {
                if (this.businessId) {
                    window.location.href = `regular_users_chat.html?businessId=${this.businessId}`;
                }
            });
        }

        // Rate button (in actions section)
        const rateBtn = document.getElementById('rateBtn');
        if (rateBtn) {
            // Check if business user is viewing their own business
            await this.checkAndHideRateButton(rateBtn);
            
            // Add click handler to open rating modal
            rateBtn.addEventListener('click', () => {
                if (typeof openRatingModalNew === 'function') {
                    openRatingModalNew();
                }
            });
        }

        // Rate This Business button (in action buttons card)
        const rateThisBusinessBtn = document.querySelector('.btn-rate-new');
        if (rateThisBusinessBtn) {
            // Check if business user is viewing their own business
            await this.checkAndHideRateButton(rateThisBusinessBtn);
        }

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareBusiness();
            });
        }

        // View Followers button
        const viewFollowersBtn = document.getElementById('viewFollowersBtn');
        if (viewFollowersBtn) {
            viewFollowersBtn.addEventListener('click', () => {
                this.openFollowersModal();
            });
        }
    }

    openFollowersModal() {
        const modalOverlay = document.getElementById('followersModalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.loadFollowers();
        }
    }

    closeFollowersModal() {
        const modalOverlay = document.getElementById('followersModalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async loadFollowers() {
        if (!this.businessId) return;

        const loadingEl = document.getElementById('followersLoading');
        const errorEl = document.getElementById('followersError');
        const listEl = document.getElementById('followersList');
        const emptyEl = document.getElementById('followersEmpty');

        // Show loading, hide others
        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (listEl) listEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';

        try {
            const response = await fetch(`https://hub.comparehubprices.co.za/business/business/followers/${this.businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.followers)) {
                if (loadingEl) loadingEl.style.display = 'none';

                // Update followers count in dashboard
                const followersCountEl = document.getElementById('followersCount');
                if (followersCountEl) {
                    followersCountEl.textContent = this.formatCount(data.followers.length);
                }

                if (data.followers.length === 0) {
                    if (emptyEl) emptyEl.style.display = 'block';
                } else {
                    if (listEl) {
                        listEl.style.display = 'block';
                        this.renderFollowersList(data.followers, listEl);
                    }
                }
            } else {
                throw new Error(data.message || 'Invalid response format');
            }
        } catch (error) {
            console.error('Error loading followers:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = `Failed to load followers: ${error.message || 'Please try again.'}`;
            }
        }
    }

    renderFollowersList(followers, listEl) {
        listEl.innerHTML = '';

        followers.forEach(follower => {
            const followerItem = document.createElement('div');
            followerItem.className = 'follower-item';
            
            const displayName = follower.followerName || follower.followerEmail || 'User';
            const initials = this.getFollowerInitials(displayName);
            const businessBadge = follower.isBusinessFollower ? '<span class="badge bg-primary ms-2" style="font-size: 0.7rem;">Business</span>' : '';
            
            followerItem.innerHTML = `
                <div class="follower-avatar">
                    <div class="avatar-circle">${initials}</div>
                </div>
                <div class="follower-info">
                    <div class="follower-name">
                        ${this.escapeHtml(displayName)}
                        ${businessBadge}
                    </div>
                </div>
            `;

            listEl.appendChild(followerItem);
        });
    }

    getFollowerInitials(name) {
        if (!name) return 'U';
        const nameStr = typeof name === 'string' ? name : String(name);
        if (!nameStr || nameStr.trim() === '') return 'U';
        const parts = nameStr.trim().split(' ').filter(part => part.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return nameStr.substring(0, 2).toUpperCase();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async setupFollowButton(btn) {
        if (!this.businessId) return;

        // Check initial follow status
        await this.checkFollowStatus(btn);

        // Set up click handler
        btn.addEventListener('click', () => {
            this.handleFollowToggle(btn);
        });
    }

    async checkAndHideChatButton(btn) {
        if (!btn || !this.businessId) return;

        try {
            // Check if user is a business user viewing their own business
            if (typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
                try {
                    const businessUserInfoResult = await window.businessAWSAuthService.getUserInfo();
                    if (businessUserInfoResult && businessUserInfoResult.success && businessUserInfoResult.user) {
                        const businessUser = businessUserInfoResult.user;
                        if (businessUser.businessId === this.businessId) {
                            // Hide chat button if business user is viewing their own business
                            if (btn) {
                                btn.style.display = 'none';
                            }
                            return;
                        }
                    }
                } catch (error) {
                    // If business auth check fails, continue - might be a regular user
                }
            }
        } catch (error) {
            // Silently fail - button will remain visible
        }
    }

    async checkAndHideRateButton(btn) {
        if (!btn || !this.businessId) return;

        try {
            // Check if user is a business user viewing their own business
            if (typeof window.businessAWSAuthService !== 'undefined' && window.businessAWSAuthService) {
                try {
                    const businessUserInfoResult = await window.businessAWSAuthService.getUserInfo();
                    if (businessUserInfoResult && businessUserInfoResult.success && businessUserInfoResult.user) {
                        const businessUser = businessUserInfoResult.user;
                        if (businessUser.businessId === this.businessId) {
                            // Hide rate button if business user is viewing their own business
                            if (btn) {
                                btn.style.display = 'none';
                            }
                            return;
                        }
                    }
                } catch (error) {
                    // If business auth check fails, continue - might be a regular user
                }
            }
        } catch (error) {
            // Silently fail - button will remain visible
        }
    }

    async checkFollowStatus(btn) {
        if (!btn || !this.businessId) return;

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
                            if (btn) {
                                btn.style.display = 'none';
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
            
            // Ensure we have a userId to check against
            if (!userId) {
                return;
            }

            // Get followers list to check if current user is following
            const response = await fetch(`https://hub.comparehubprices.co.za/business/business/followers/${this.businessId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch followers:', response.status, response.statusText);
                return;
            }

            const data = await response.json();
            
            if (!data.success) {
                console.error('Followers API returned error:', data.message || 'Unknown error');
                return;
            }

            if (Array.isArray(data.followers)) {
                // Update followers count in hero section
                const followersCountEl = document.getElementById('followersCount');
                if (followersCountEl) {
                    const count = data.followers.length;
                    followersCountEl.textContent = this.formatCount(count);
                }

                // Check if current user is in followers list
                // Lambda stores followerId as: user.userId || user.email
                // So we need to check if follower.followerId matches our computed userId
                // Also check email as fallback in case userId wasn't available when following
                const isFollowing = data.followers.some(follower => {
                    // Primary check: followerId matches exactly (this is how Lambda stores it)
                    if (follower.followerId === userId) return true;
                    
                    // Secondary check: if user has userId, check if followerId matches email
                    // (in case the follower was created when userId wasn't available)
                    if (currentUser.userId && follower.followerId === currentUser.email) return true;
                    
                    // Tertiary check: if user doesn't have userId, check if followerId matches email
                    // (this handles the case where userId is null/undefined)
                    if (!currentUser.userId && follower.followerId === currentUser.email) return true;
                    
                    // Fallback: check followerEmail matches (in case followerId format differs)
                    if (follower.followerEmail && follower.followerEmail === currentUser.email) return true;
                    
                    return false;
                });


                // Always update button state - either set to "Following" or reset to "Follow"
                const btnIcon = btn.querySelector('i');
                const btnText = btn.querySelector('span');
                
                if (isFollowing) {
                    btn.classList.add('following');
                    if (btnIcon) btnIcon.className = 'fas fa-check';
                    if (btnText) btnText.textContent = 'Following';
                } else {
                    // Explicitly reset to "Follow" state if not following
                    btn.classList.remove('following');
                    if (btnIcon) btnIcon.className = 'fas fa-plus';
                    if (btnText) btnText.textContent = 'Follow';
                }
            } else {
                console.error('Followers data is not an array:', data);
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
            // Silently fail - button will default to "Follow"
        }
    }

    async handleFollowToggle(btn) {
        if (!btn || !this.businessId) return;

        const isFollowing = btn.classList.contains('following');
        const isLoading = btn.disabled;

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
            btn.disabled = true;
            const btnText = btn.querySelector('span');
            const btnIcon = btn.querySelector('i');
            
            if (isFollowing) {
                // Unfollow
                if (btnText) btnText.textContent = 'Unfollowing...';
                if (btnIcon) btnIcon.className = 'fas fa-spinner fa-spin';
                
                const response = await fetch('https://hub.comparehubprices.co.za/business/business/unfollow', {
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
                    btn.classList.remove('following');
                    if (btnIcon) btnIcon.className = 'fas fa-plus';
                    if (btnText) btnText.textContent = 'Follow';
                    btn.disabled = false;
                    
                    // Update followers count
                    this.updateFollowersCount(-1);
                    
                    // Re-check follow status after a delay to ensure UI is in sync with database
                    setTimeout(() => {
                        this.checkFollowStatus(btn);
                    }, 500);
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
                    btn.disabled = false;
                }
            } else {
                // Follow
                if (btnText) btnText.textContent = 'Following...';
                if (btnIcon) btnIcon.className = 'fas fa-spinner fa-spin';
                
                const response = await fetch('https://hub.comparehubprices.co.za/business/business/follow', {
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
                    btn.classList.add('following');
                    if (btnIcon) btnIcon.className = 'fas fa-check';
                    if (btnText) btnText.textContent = 'Following';
                    btn.disabled = false;
                    
                    // Update followers count
                    this.updateFollowersCount(1);
                    
                    // Re-check follow status after a delay to ensure UI is in sync with database
                    setTimeout(() => {
                        this.checkFollowStatus(btn);
                    }, 500);
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
                    btn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error toggling follow status:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast(error.message || 'An error occurred. Please try again.', 'Error');
            } else if (typeof showToast === 'function') {
                showToast(error.message || 'An error occurred. Please try again.', 'error');
            } else {
                alert(error.message || 'An error occurred. Please try again.');
            }
            btn.disabled = false;
        }
    }

    updateFollowersCount(change) {
        const followersCountEl = document.getElementById('followersCount');
        if (followersCountEl) {
            const currentText = followersCountEl.textContent;
            // Try to extract number from formatted text (handles "1.2K", "1,234", etc.)
            const match = currentText.match(/([\d.]+)/);
            if (match) {
                let currentCount = parseFloat(match[1]);
                // Handle K suffix
                if (currentText.includes('K')) {
                    currentCount = currentCount * 1000;
                }
                const newCount = Math.max(0, Math.round(currentCount + change));
                followersCountEl.textContent = this.formatCount(newCount);
            } else {
                // Fallback: try to get count from API
                this.loadFollowersCount();
            }
        }
    }

    shareBusiness() {
        if (!this.businessId) return;
        
        const businessName = this.businessData?.businessName || this.businessData?.name || 'Business';
        const url = `${window.location.origin}${window.location.pathname}?id=${this.businessId}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Check out ${businessName} on CompareHubPrices`,
                text: `Check out ${businessName} on CompareHubPrices`,
                url: url
            }).catch(() => {
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        }).catch(() => {
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
                alert('Failed to copy link.');
            }
            document.body.removeChild(textarea);
        });
    }

    formatCount(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    renderDescription() {
        const business = this.businessData;
        const description = business.businessDescription || 
                           business.description || 
                           business.content ||
                           business.businessInfo?.businessDescription ||
                           business.businessInfo?.description ||
                           '';

        const descriptionEl = document.getElementById('businessDescriptionNew');
        if (!descriptionEl) return;

        let html = '';
        
        if (description && description.trim()) {
            const paragraphs = description.split('\n').filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    html += `<p>${this.escapeHtml(p.trim())}</p>`;
                });
            } else {
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
        const services = business.ourServices || 
                       business.businessInfo?.ourServices ||
                       '';
        const servicesSection = document.getElementById('ourServicesSectionNew');
        const servicesList = document.getElementById('ourServicesListNew');
        
        if (!servicesSection || !servicesList) return;
        
        if (!services || !services.trim()) {
            servicesSection.style.display = 'none';
            return;
        }
        
        const serviceLines = services.split(/\n/).filter(item => item.trim());
        
        if (serviceLines.length > 0) {
            let html = '';
            serviceLines.forEach(line => {
                const cleaned = line.trim().replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    html += `<div class="service-item-new">${this.escapeHtml(cleaned)}</div>`;
                }
            });
            servicesList.innerHTML = html;
            servicesSection.style.display = 'block';
        } else {
            servicesSection.style.display = 'none';
        }
    }

    renderMoreInformation() {
        const business = this.businessData;
        const moreInfo = business.moreInformation || 
                        business.businessInfo?.moreInformation ||
                        '';
        const moreInfoSection = document.getElementById('moreInformationSectionNew');
        const moreInfoList = document.getElementById('moreInformationListNew');
        
        if (!moreInfoSection || !moreInfoList) return;
        
        if (!moreInfo || !moreInfo.trim()) {
            moreInfoSection.style.display = 'none';
            return;
        }
        
        const infoLines = moreInfo.trim().split(/\n/).filter(item => item.trim());
        
        if (infoLines.length > 0) {
            let html = '';
            infoLines.forEach(line => {
                const cleaned = line.trim().replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    html += `<div class="more-info-item-new">${this.escapeHtml(cleaned)}</div>`;
                }
            });
            moreInfoList.innerHTML = html;
            moreInfoSection.style.display = 'block';
        } else {
            moreInfoSection.style.display = 'none';
        }
    }

    renderServicesAndGallery() {
        const business = this.businessData;
        const servicesGrid = document.getElementById('servicesGridNew');
        if (!servicesGrid) return;

        if (!business.serviceGalleries || Object.keys(business.serviceGalleries).length === 0) {
            servicesGrid.innerHTML = '<p class="text-muted">No services or gallery items available.</p>';
            return;
        }

        let servicesHTML = '';
        this.galleryData = {};

        Object.keys(business.serviceGalleries).forEach(serviceName => {
            if (serviceName.endsWith('_description')) return;
            
            const images = business.serviceGalleries[serviceName];
            const descriptionKey = `${serviceName}_description`;
            const serviceDescription = business.serviceGalleries[descriptionKey] || '';
            
            let imageArray = [];
            if (Array.isArray(images)) {
                imageArray = images;
            } else if (images && typeof images === 'object') {
                if (images.images && Array.isArray(images.images)) {
                    imageArray = images.images;
                } else if (images.items && Array.isArray(images.items)) {
                    imageArray = images.items;
                } else {
                    imageArray = Object.values(images).filter(item => item !== null && item !== undefined);
                }
            } else if (typeof images === 'string') {
                imageArray = [images];
            }
            
            if (imageArray.length > 0) {
                this.galleryData[serviceName] = imageArray.map(img => {
                    if (typeof img === 'string') {
                        return img;
                    } else if (img && typeof img === 'object') {
                        return img.image || img.url || img.src || '';
                    }
                    return '';
                }).filter(url => url !== '');

                if (this.galleryData[serviceName].length === 0) return;

                const visibleImages = this.galleryData[serviceName].slice(0, 4);
                const remainingCount = this.galleryData[serviceName].length - 4;
                const escapedServiceName = this.escapeHtml(serviceName);
                const jsEscapedServiceName = serviceName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                
                // Get reaction data for this service
                const reactionData = this.reactionsData[serviceName] || { likesCount: 0, userHasLiked: false };
                const isLiked = reactionData.userHasLiked || false;
                const likesCount = reactionData.likesCount || 0;
                
                servicesHTML += `
                    <div class="service-card-new">
                        <div class="service-card-header-new">
                            <h4>${escapedServiceName}</h4>
                            <button class="reaction-btn-new ${isLiked ? 'liked' : ''}" 
                                    onclick="window.dashboardBusinessElegant.toggleReaction('${jsEscapedServiceName}')"
                                    data-service-name="${escapedServiceName}"
                                    aria-label="${isLiked ? 'Unlike' : 'Like'} this service">
                                <i class="fas fa-heart"></i>
                                <span class="reaction-count-new">${likesCount}</span>
                            </button>
                        </div>
                        ${serviceDescription ? `<p class="service-description-new">${this.escapeHtml(serviceDescription)}</p>` : ''}
                        <div class="service-gallery-new">
                            ${visibleImages.map((imageUrl, index) => {
                                return `
                                    <div class="gallery-item-new" onclick="openGalleryModalNew('${jsEscapedServiceName}', ${index})">
                                        <div class="gallery-item-image-wrapper-new">
                                            <img src="${imageUrl}" alt="${escapedServiceName}" loading="lazy" onerror="this.src='assets/logo .png'">
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            ${remainingCount > 0 ? `
                                <div class="gallery-more-new" onclick="openGalleryModalNew('${jsEscapedServiceName}', 4)">
                                    <span>+${remainingCount} more</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });

        servicesGrid.innerHTML = servicesHTML || '<p class="text-muted">No services or gallery items available.</p>';
        
        // Set gallery data for modal
        setGalleryDataNew(this.galleryData);
    }

    async loadReactions() {
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
    }

    async toggleReaction(serviceName) {
        if (!this.businessId || !serviceName) return;
        
        const reactionData = this.reactionsData[serviceName] || { likesCount: 0, userHasLiked: false };
        const isLiked = reactionData.userHasLiked;
        
        // Optimistically update UI
        const button = document.querySelector(`.reaction-btn-new[data-service-name="${this.escapeHtml(serviceName)}"]`);
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
                if (response.status === 401 || errorData.error === 'NO_SESSION' || errorData.error === 'SESSION_NOT_FOUND') {
                    throw new Error('Session not found or invalid. Please log in.');
                }
                throw new Error(errorData.message || `Failed to ${isLiked ? 'unlike' : 'like'} service`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update reactions data
                if (isLiked) {
                    this.reactionsData[serviceName] = {
                        likesCount: Math.max(0, (reactionData.likesCount || 1) - 1),
                        userHasLiked: false
                    };
                } else {
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
            
            const errorMessage = error.message || '';
            const isSessionError = errorMessage.includes('Session') || 
                                  errorMessage.includes('session') || 
                                  errorMessage.includes('not authenticated') ||
                                  errorMessage.includes('NO_SESSION') ||
                                  errorMessage.includes('SESSION_NOT_FOUND');
            
            if (isSessionError) {
                if (typeof showWarningToast === 'function') {
                    showWarningToast('Please login to like', 'Warning');
                } else if (typeof showToast === 'function') {
                    showToast('Please login to like', 'warning');
                } else {
                    alert('Please login to like');
                }
            } else {
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
    }

    updateReactionButton(serviceName) {
        const buttons = document.querySelectorAll('.reaction-btn-new[data-service-name]');
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
        const countEl = button.querySelector('.reaction-count-new');
        if (countEl) {
            countEl.textContent = likesCount;
        }
    }

    async submitReportReviewNew() {
        const reviewId = this.currentReportReviewId;
        const reviewerUserId = this.currentReportReviewerUserId;

        if (!reviewId || !reviewerUserId || !this.businessId) {
            alert('Missing information. Cannot submit report.');
            return;
        }

        const selectedReason = document.querySelector('#reportReviewModalNew input[name="reportReasonNew"]:checked');
        if (!selectedReason) {
            alert('Please select a reason for reporting this review.');
            return;
        }

        const reason = selectedReason.value;
        const descriptionEl = document.getElementById('reportDescriptionNew');
        const description = descriptionEl ? descriptionEl.value.trim() : '';

        const submitBtn = document.querySelector('#reportReviewModalNew .btn-submit-new');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        try {
            const response = await fetch(REVIEW_REPORT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    businessId: this.businessId,
                    reviewerUserId: reviewerUserId,
                    reviewId: reviewId,
                    reason: reason,
                    description: description
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const modal = document.getElementById('reportReviewModalNew');
                if (modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }

                if (typeof showToast === 'function') {
                    showToast(data.message || 'Review reported successfully. Our team will review it.', 'success');
                } else {
                    alert(data.message || 'Review reported successfully. Our team will review it.');
                }

                this.currentReportReviewId = null;
                this.currentReportReviewerUserId = null;
            } else {
                throw new Error(data.message || 'Failed to report review');
            }
        } catch (error) {
            console.error('Error reporting review:', error);
            alert(error.message || 'Failed to report review. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        }
    }

    renderMap() {
        const business = this.businessData;
        const address = business.address || business.businessAddress || '';
        
        if (address && typeof renderBusinessMapNew === 'function') {
            renderBusinessMapNew(address);
        }
    }

    renderSocialButtons() {
        const business = this.businessData;
        const socialButtons = document.getElementById('socialButtonsNew');
        if (!socialButtons) return;

        const social = business.socialMedia || {};
        const phone = business.phone || business.businessNumber || '';

        let buttonsHTML = '';

        // Phone
        if (phone) {
            buttonsHTML += `
                <a href="tel:${phone}" class="social-btn-new phone">
                    <i class="fas fa-phone"></i>
                    <span>Call Us</span>
                </a>
            `;
        }

        // WhatsApp
        if (social.whatsapp) {
            buttonsHTML += `
                <a href="${social.whatsapp}" target="_blank" class="social-btn-new whatsapp">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </a>
            `;
        }

        // Instagram
        if (social.instagram) {
            buttonsHTML += `
                <a href="${social.instagram}" target="_blank" class="social-btn-new instagram">
                    <i class="fab fa-instagram"></i>
                    <span>Instagram</span>
                </a>
            `;
        }

        // TikTok
        if (social.tiktok) {
            buttonsHTML += `
                <a href="${social.tiktok}" target="_blank" class="social-btn-new tiktok">
                    <i class="fab fa-tiktok"></i>
                    <span>TikTok</span>
                </a>
            `;
        }

        // Twitter/X
        if (social.twitter) {
            buttonsHTML += `
                <a href="${social.twitter}" target="_blank" class="social-btn-new twitter">
                    <i class="fa-brands fa-x-twitter"></i>
                    <span>Twitter</span>
                </a>
            `;
        }

        // Facebook
        if (social.facebook) {
            buttonsHTML += `
                <a href="${social.facebook}" target="_blank" class="social-btn-new facebook">
                    <i class="fab fa-facebook"></i>
                    <span>Facebook</span>
                </a>
            `;
        }

        socialButtons.innerHTML = buttonsHTML || '<p class="text-muted">No social media links available.</p>';
    }
}

// Render Business Map function
function renderBusinessMapNew(address) {
    if (!address) return;
    
    const encodedAddress = encodeURIComponent(address);
    
    const mapIframe = `
        <iframe
            title="Business location map"
            width="100%"
            height="400"
            style="border:0; border-radius: 12px;"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=${encodedAddress}&output=embed">
        </iframe>
    `;
    
    const mainMap = document.getElementById('businessMapMainNew');
    if (mainMap) {
        mainMap.innerHTML = mapIframe;
    }
}

window.renderBusinessMapNew = renderBusinessMapNew;

// Gallery Modal Functions
let currentGalleryNew = [];
let currentGalleryIndexNew = 0;
let currentServiceNameNew = '';

function setGalleryDataNew(serviceGalleries) {
    window.galleryDataNew = {};
    if (serviceGalleries) {
        Object.keys(serviceGalleries).forEach(serviceName => {
            const images = serviceGalleries[serviceName];
            if (Array.isArray(images)) {
                window.galleryDataNew[serviceName] = images.map(img => {
                    return typeof img === 'string' ? img : (img.image || img.url || '');
                });
            }
        });
    }
}

function openGalleryModalNew(serviceName, imageIndex = 0) {
    if (!window.galleryDataNew || !window.galleryDataNew[serviceName] || window.galleryDataNew[serviceName].length === 0) return;
    
    currentGalleryNew = window.galleryDataNew[serviceName];
    currentGalleryIndexNew = imageIndex;
    currentServiceNameNew = serviceName;
    
    const modal = document.getElementById('galleryModalNew');
    
    updateGalleryImageNew();
    
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function updateGalleryImageNew() {
    if (!currentGalleryNew || currentGalleryIndexNew === undefined) return;
    
    const modalContent = document.getElementById('galleryModalContentNew');
    if (!modalContent) return;
    
    const currentImage = currentGalleryNew[currentGalleryIndexNew];
    const isFirst = currentGalleryIndexNew === 0;
    const isLast = currentGalleryIndexNew === currentGalleryNew.length - 1;
    
    modalContent.innerHTML = `
        <div class="gallery-image-wrapper-new">
            <img src="${currentImage}" alt="${currentServiceNameNew} - Image ${currentGalleryIndexNew + 1}" id="galleryCurrentImageNew" class="loading">
        </div>
        <button class="gallery-nav-btn-new prev" ${isFirst ? 'disabled' : ''} onclick="navigateGalleryNew('prev')" aria-label="Previous image">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="gallery-nav-btn-new next" ${isLast ? 'disabled' : ''} onclick="navigateGalleryNew('next')" aria-label="Next image">
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="gallery-counter-new">Image ${currentGalleryIndexNew + 1} of ${currentGalleryNew.length}</div>
    `;
    
    // Handle image loading
    const img = document.getElementById('galleryCurrentImageNew');
    if (img) {
        img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
        };
        img.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
        };
    }
}

function navigateGalleryNew(direction) {
    if (direction === 'next' && currentGalleryIndexNew < currentGalleryNew.length - 1) {
        currentGalleryIndexNew++;
        updateGalleryImageNew();
    } else if (direction === 'prev' && currentGalleryIndexNew > 0) {
        currentGalleryIndexNew--;
        updateGalleryImageNew();
    }
}

function closeGalleryModalNew() {
    const modal = document.getElementById('galleryModalNew');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Keyboard navigation for gallery
document.addEventListener('keydown', function(e) {
    const galleryModal = document.getElementById('galleryModalNew');
    if (galleryModal && galleryModal.classList.contains('show')) {
        if (e.key === 'ArrowLeft') {
            navigateGalleryNew('prev');
        } else if (e.key === 'ArrowRight') {
            navigateGalleryNew('next');
        } else if (e.key === 'Escape') {
            closeGalleryModalNew();
        }
    }
});

// Make gallery functions globally accessible
window.setGalleryDataNew = setGalleryDataNew;
window.openGalleryModalNew = openGalleryModalNew;
window.navigateGalleryNew = navigateGalleryNew;
window.closeGalleryModalNew = closeGalleryModalNew;

// Rating Modal Functions
let selectedRatingNew = 0;

function openRatingModalNew() {
    selectedRatingNew = 0;
    const modal = document.getElementById('ratingModalNew');
    if (modal) {
        updateRatingModalContentNew();
        resetRatingStarsNew();
        const reviewTextarea = document.getElementById('ratingReviewNew');
        if (reviewTextarea) reviewTextarea.value = '';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function updateRatingModalContentNew() {
    if (!window.dashboardBusinessElegant || !window.dashboardBusinessElegant.businessData) return;
    
    const business = window.dashboardBusinessElegant.businessData;
    const averageRating = window.dashboardBusinessElegant.getAverageRating() || business.averageRating || 0;
    const totalRatings = window.dashboardBusinessElegant.getTotalRatings() || business.totalRatings || 0;
    
    const ratingScore = document.getElementById('currentRatingScoreNew');
    const ratingCount = document.getElementById('currentRatingCountNew');
    const ratingStars = document.getElementById('currentRatingStarsNew');
    
    if (ratingScore) {
        ratingScore.textContent = averageRating > 0 ? averageRating.toFixed(1) : '0.0';
    }
    if (ratingCount) {
        ratingCount.textContent = `${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'}`;
    }
    if (ratingStars && window.dashboardBusinessElegant) {
        ratingStars.innerHTML = window.dashboardBusinessElegant.renderStarsHTML(averageRating);
    }
}

function closeRatingModalNew() {
    const modal = document.getElementById('ratingModalNew');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function selectRatingNew(rating) {
    selectedRatingNew = rating;
    const stars = document.querySelectorAll('.interactive-star-new');
    const labels = document.querySelectorAll('.rating-label-new');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });

    labels.forEach((label, index) => {
        if (index + 1 === rating) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });
}

function resetRatingStarsNew() {
    const stars = document.querySelectorAll('.interactive-star-new');
    const labels = document.querySelectorAll('.rating-label-new');
    
    stars.forEach(star => {
        star.classList.remove('fas', 'active');
        star.classList.add('far');
    });

    labels.forEach(label => {
        label.classList.remove('active');
    });
}

async function submitRatingNew() {
    const reviewText = document.getElementById('ratingReviewNew')?.value.trim() || '';
    
    if (selectedRatingNew === 0) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Please select a rating before submitting.', 'Warning');
        } else if (typeof showToast === 'function') {
            showToast('Please select a rating before submitting.', 'warning');
        } else {
            alert('Please select a rating before submitting.');
        }
        return;
    }
    
    if (!window.dashboardBusinessElegant || !window.dashboardBusinessElegant.businessId) {
        if (typeof showErrorToast === 'function') {
            showErrorToast('Business information not available.', 'Error');
        } else if (typeof showToast === 'function') {
            showToast('Business information not available.', 'error');
        } else {
            alert('Business information not available.');
        }
        return;
    }
    
    const businessId = window.dashboardBusinessElegant.businessId;
    
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
        console.log('Business auth check failed or user is not a business user:', error);
    }
    
    try {
        const submitBtn = document.querySelector('#ratingModalNew .btn-submit-new');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
        
        const response = await fetch('https://hub.comparehubprices.co.za/business/business/rating/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                businessId: businessId,
                rating: selectedRatingNew,
                comment: reviewText
            })
        });

        const data = await response.json();
        
        if (data.success) {
            if (typeof showSuccessToast === 'function') {
                showSuccessToast('Thank you! Your rating has been submitted.', 'Success');
            } else if (typeof showToast === 'function') {
                showToast('Thank you! Your rating has been submitted.', 'success');
            } else {
                alert('Thank you! Your rating has been submitted.');
            }
            
            closeRatingModalNew();
            
            const reviewTextarea = document.getElementById('ratingReviewNew');
            if (reviewTextarea) {
                reviewTextarea.value = '';
            }
            selectedRatingNew = 0;
            resetRatingStarsNew();
            
            // Reload reviews from API
            if (window.dashboardBusinessElegant) {
                await window.dashboardBusinessElegant.loadReviews();
                // Update dashboard stats
                const ratingEl = document.getElementById('ratingValue');
                if (ratingEl && window.dashboardBusinessElegant.reviewsStatistics.averageRating !== undefined) {
                    ratingEl.textContent = (window.dashboardBusinessElegant.reviewsStatistics.averageRating || 0).toFixed(1);
                }
                const reviewsEl = document.getElementById('reviewsCount');
                if (reviewsEl && window.dashboardBusinessElegant.reviewsStatistics.totalReviews !== undefined) {
                    reviewsEl.textContent = window.dashboardBusinessElegant.reviewsStatistics.totalReviews || 0;
                }
            }
        } else {
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
        const submitBtn = document.querySelector('#ratingModalNew .btn-submit-new');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Rating';
        }
    }
}

// Make rating functions globally accessible
window.openRatingModalNew = openRatingModalNew;
window.closeRatingModalNew = closeRatingModalNew;
window.selectRatingNew = selectRatingNew;
window.submitRatingNew = submitRatingNew;

// Review Sorting and Filtering Functions
function sortReviewsNew() {
    const sortInput = document.getElementById('reviewSortNew');
    if (!sortInput || !window.dashboardBusinessElegant) return;
    
    const sortBy = sortInput.value;
    const reviews = window.dashboardBusinessElegant.getReviews();
    
    if (!reviews || reviews.length === 0) return;
    
    let sortedReviews = [...reviews];
    
    switch (sortBy) {
        case 'newest':
            sortedReviews.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt || 0);
                const dateB = new Date(b.date || b.createdAt || 0);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            sortedReviews.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt || 0);
                const dateB = new Date(b.date || b.createdAt || 0);
                return dateA - dateB;
            });
            break;
        case 'highest':
            sortedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'lowest':
            sortedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            break;
        case 'helpful':
            sortedReviews.sort((a, b) => {
                const helpfulA = a.helpfulCount || a.helpfulVotes || 0;
                const helpfulB = b.helpfulCount || b.helpfulVotes || 0;
                return helpfulB - helpfulA;
            });
            break;
    }
    
    // Apply current filter if any
    const filterInput = document.getElementById('reviewFilterNew');
    if (filterInput) {
        const filterBy = filterInput.value;
        if (filterBy !== 'all') {
            const rating = parseInt(filterBy);
            sortedReviews = sortedReviews.filter(review => Math.round(review.rating || 0) === rating);
        }
    }
    
    // Re-render reviews
    const reviewsList = document.getElementById('reviewsListNew');
    if (reviewsList) {
        if (sortedReviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h4>No reviews found</h4>
                    <p class="text-muted">No reviews match the selected criteria.</p>
                </div>
            `;
        } else {
            reviewsList.innerHTML = sortedReviews.map(review => 
                window.dashboardBusinessElegant.renderReviewCard(review)
            ).join('');
        }
    }
}

function filterReviewsNew() {
    const filterInput = document.getElementById('reviewFilterNew');
    if (!filterInput || !window.dashboardBusinessElegant) return;
    
    const filterBy = filterInput.value;
    const reviews = window.dashboardBusinessElegant.getReviews();
    
    if (!reviews || reviews.length === 0) return;
    
    let filteredReviews = [...reviews];
    
    if (filterBy !== 'all') {
        const rating = parseInt(filterBy);
        filteredReviews = reviews.filter(review => Math.round(review.rating || 0) === rating);
    }
    
    // Apply current sort if any
    const sortInput = document.getElementById('reviewSortNew');
    if (sortInput) {
        const sortBy = sortInput.value;
        
        switch (sortBy) {
            case 'newest':
                filteredReviews.sort((a, b) => {
                    const dateA = new Date(a.date || a.createdAt || 0);
                    const dateB = new Date(b.date || b.createdAt || 0);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                filteredReviews.sort((a, b) => {
                    const dateA = new Date(a.date || a.createdAt || 0);
                    const dateB = new Date(b.date || b.createdAt || 0);
                    return dateA - dateB;
                });
                break;
            case 'highest':
                filteredReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'lowest':
                filteredReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
                break;
            case 'helpful':
                filteredReviews.sort((a, b) => {
                    const helpfulA = a.helpfulCount || a.helpfulVotes || 0;
                    const helpfulB = b.helpfulCount || b.helpfulVotes || 0;
                    return helpfulB - helpfulA;
                });
                break;
        }
    }
    
    // Re-render reviews
    const reviewsList = document.getElementById('reviewsListNew');
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
            reviewsList.innerHTML = filteredReviews.map(review => 
                window.dashboardBusinessElegant.renderReviewCard(review)
            ).join('');
        }
    }
}

// Make review sorting and filtering functions globally accessible
window.sortReviewsNew = sortReviewsNew;
window.filterReviewsNew = filterReviewsNew;

// Make submitReportReviewNew globally accessible
window.submitReportReviewNew = function() {
    if (window.dashboardBusinessElegant) {
        window.dashboardBusinessElegant.submitReportReviewNew();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardBusinessElegant = new DashboardBusinessElegant();
});

