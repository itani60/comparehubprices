// Business Reviews Management
// Handles fetching reviews and replying to them

const API_BASE_URL = 'https://acc.comparehubprices.site';
// Use the reply-to-review endpoint for both GET (fetch reviews) and POST (reply to review)
const REVIEWS_MANAGEMENT_URL = `${API_BASE_URL}/business/business/reviews/reply`;

class ReviewsManagementManager {
    constructor() {
        this.businessId = null;
        this.businessOwnerName = null;
        this.reviews = [];
        this.init();
    }

    async init() {
        // Wait for business auth service to be available
        if (typeof window.businessAWSAuthService === 'undefined') {
            console.log('Waiting for businessAWSAuthService...');
            setTimeout(() => this.init(), 100);
            return;
        }

        try {
            console.log('Getting user info...');
            // Get business user info to get businessId
            const userInfo = await window.businessAWSAuthService.getUserInfo();
            console.log('User info:', userInfo);

            if (!userInfo.success || !userInfo.user) {
                console.error('User not authenticated:', userInfo);
                this.showError('Please log in to manage your reviews.');
                return;
            }

            this.businessId = userInfo.user.businessId;
            this.businessOwnerName = this.getOwnerName(userInfo.user);

            console.log('Business ID:', this.businessId);
            console.log('Business Owner Name:', this.businessOwnerName);

            if (!this.businessId) {
                console.error('Business ID is missing from user info:', userInfo.user);
                this.showError('Business ID not found. Please contact support.');
                return;
            }

            // Load reviews
            await this.loadReviews();
        } catch (error) {
            console.error('Error initializing reviews management:', error);
            console.error('Error stack:', error.stack);
            this.showError(`Failed to initialize: ${error.message}. Please check the console for details.`);
        }
    }

    getOwnerName(user) {
        if (user.givenName && user.familyName) {
            return `${user.givenName} ${user.familyName}`;
        }
        return user.givenName || user.displayName || user.businessName || 'Business Owner';
    }

    async loadReviews() {
        if (!this.businessId) {
            console.error('Business ID is missing');
            this.showError('Business ID not found. Please contact support.');
            return;
        }

        // Wait for DOM elements with retry mechanism
        let container, loadingState, emptyState;
        let retries = 0;
        const maxRetries = 50; // 5 seconds max wait (50 * 100ms)
        
        while (retries < maxRetries) {
            container = document.getElementById('reviewsContainer');
            loadingState = document.getElementById('loadingState');
            emptyState = document.getElementById('emptyState');
            
            // Also check if elements are actually in the DOM (not just created)
            if (container && loadingState && emptyState && 
                document.body.contains(container) && 
                document.body.contains(loadingState) && 
                document.body.contains(emptyState)) {
                console.log('All DOM elements found and in DOM tree');
                break; // All elements found
            }
            
            retries++;
            if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // If elements are missing, recreate them
        if (!loadingState && container) {
            console.log('Recreating loadingState element');
            loadingState = document.createElement('div');
            loadingState.id = 'loadingState';
            loadingState.className = 'text-center py-5';
            loadingState.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading reviews...</p>
            `;
            container.insertBefore(loadingState, container.firstChild);
        }
        
        if (!emptyState && container) {
            console.log('Recreating emptyState element');
            emptyState = document.createElement('div');
            emptyState.id = 'emptyState';
            emptyState.className = 'text-center py-5';
            emptyState.style.display = 'none';
            emptyState.innerHTML = `
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h4>No Reviews Yet</h4>
                <p class="text-muted">You don't have any reviews yet. Reviews will appear here once customers start rating your business.</p>
            `;
            container.appendChild(emptyState);
        }
        
        if (!container) {
            console.error('Container not found after retries');
            console.error('Document ready state:', document.readyState);
            console.error('All elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => ({ id: el.id, tag: el.tagName })));
            this.showError('Page elements not found. Please refresh the page.');
            return;
        }
        
        if (!loadingState || !emptyState) {
            console.error('Failed to create loadingState or emptyState elements');
            this.showError('Failed to initialize page elements. Please refresh the page.');
            return;
        }

        try {

            loadingState.style.display = 'block';
            emptyState.style.display = 'none';

            const url = REVIEWS_MANAGEMENT_URL;
            console.log('Fetching reviews from:', url);
            console.log('Business ID:', this.businessId);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success && Array.isArray(data.reviews)) {
                this.reviews = data.reviews;
                console.log('Loaded reviews:', this.reviews.length);
                this.updateStats();
                this.renderReviews();
            } else {
                console.warn('Unexpected response format:', data);
                this.reviews = [];
                this.updateStats();
                this.renderReviews();
            }

            if (loadingState) {
                loadingState.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                businessId: this.businessId,
                url: REVIEWS_MANAGEMENT_URL
            });
            const loadingState = document.getElementById('loadingState');
            if (loadingState) {
                loadingState.style.display = 'none';
            }
            this.showError(`Failed to load reviews: ${error.message}. Please check the console for details.`);
        }
    }

    updateStats() {
        const totalReviews = this.reviews.length;
        const repliedReviews = this.reviews.filter(r => r.businessResponse).length;
        const pendingReplies = totalReviews - repliedReviews;
        const responseRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 0;

        const totalReviewsEl = document.getElementById('totalReviews');
        const pendingRepliesEl = document.getElementById('pendingReplies');
        const repliedReviewsEl = document.getElementById('repliedReviews');
        const responseRateEl = document.getElementById('responseRate');

        if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
        if (pendingRepliesEl) pendingRepliesEl.textContent = pendingReplies;
        if (repliedReviewsEl) repliedReviewsEl.textContent = repliedReviews;
        if (responseRateEl) responseRateEl.textContent = `${responseRate}%`;
    }

    renderReviews() {
        const container = document.getElementById('reviewsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) {
            console.error('reviewsContainer not found');
            return;
        }

        if (this.reviews.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Sort reviews: pending replies first, then by date (newest first)
        const sortedReviews = [...this.reviews].sort((a, b) => {
            const aHasReply = !!a.businessResponse;
            const bHasReply = !!b.businessResponse;
            if (aHasReply !== bHasReply) {
                return aHasReply ? 1 : -1; // Pending replies first
            }
            const aDate = new Date(a.date || a.updatedAt || 0);
            const bDate = new Date(b.date || b.updatedAt || 0);
            return bDate - aDate; // Newest first
        });

        container.innerHTML = sortedReviews.map(review => this.renderReviewCard(review)).join('');

        // Attach event listeners
        this.attachEventListeners();
    }

    renderReviewCard(review) {
        const reviewerName = review.reviewerName || 'Anonymous';
        const initials = this.getInitials(reviewerName);
        const date = this.formatDate(review.date || review.updatedAt);
        const rating = review.rating || 0;
        const comment = review.comment || '';
        const hasReply = !!review.businessResponse;
        const businessResponse = review.businessResponse || '';
        const businessResponseOwner = review.businessResponseOwner || this.businessOwnerName;
        const businessResponseAt = review.businessResponseAt ? this.formatDate(review.businessResponseAt) : '';
        const reviewerUserId = review.userId || (review.id && review.id.includes('#') ? review.id.split('#')[1] : '');
        const needsAttention = rating <= 2 && !hasReply;

        const stars = this.renderStars(rating);
        const needsAttentionBadge = needsAttention ? `
            <span class="needs-attention-badge">
                <i class="fas fa-exclamation-circle"></i> Needs Response
            </span>
        ` : '';

        const replySection = hasReply ? `
            <div class="review-reply-section has-reply">
                <div class="business-reply">
                    <div class="business-reply-header">
                        <div class="business-reply-info">
                            <i class="fas fa-store business-icon"></i>
                            <div>
                                <strong class="business-owner-name">${this.escapeHtml(businessResponseOwner)}</strong>
                                <span class="business-label">Business Owner</span>
                            </div>
                        </div>
                        <div class="business-reply-date">${businessResponseAt}</div>
                    </div>
                    <div class="business-reply-content">
                        <p>${this.escapeHtml(businessResponse)}</p>
                    </div>
                    <div class="business-reply-actions">
                        <button class="btn btn-sm btn-outline-secondary btn-edit-reply" data-reviewer-user-id="${this.escapeHtml(reviewerUserId)}" data-review-id="${this.escapeHtml(review.id)}">
                            <i class="fas fa-edit"></i> Edit Reply
                        </button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="review-reply-section">
                <div class="reply-form-container">
                    <div class="reply-form-header ${needsAttention ? 'urgent' : ''}">
                        <i class="fas ${needsAttention ? 'fa-exclamation-triangle' : 'fa-reply'}"></i>
                        <span>${needsAttention ? 'This review needs your attention' : 'Reply to this review'}</span>
                    </div>
                    <textarea class="reply-textarea" data-reviewer-user-id="${this.escapeHtml(reviewerUserId)}" placeholder="${needsAttention ? 'Respond to address the customer\'s concern. A timely response can help resolve issues and show other customers that you care about their experience.' : 'Write your response here... This helps build trust with customers and shows you value their feedback.'}" rows="4" maxlength="2000"></textarea>
                    <div class="reply-actions">
                        <div class="char-counter">
                            <span class="char-count">0</span> / 2000 characters
                        </div>
                        <button class="btn btn-danger btn-reply" data-reviewer-user-id="${this.escapeHtml(reviewerUserId)}">
                            <i class="fas fa-paper-plane"></i> Post Reply
                        </button>
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="review-card-wrapper">
                <div class="review-card ${needsAttention ? 'needs-attention' : ''}">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar">${initials}</div>
                            <div class="reviewer-details">
                                <h4 class="reviewer-name">${this.escapeHtml(reviewerName)}</h4>
                                <div class="review-rating">
                                    <div class="rating-stars">
                                        ${stars}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="review-meta">
                            <div class="review-date">${date}</div>
                            ${needsAttentionBadge}
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${this.escapeHtml(comment)}</p>
                    </div>
                    ${replySection}
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star filled"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt filled"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown date';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachEventListeners() {
        // Character counter for textareas
        document.querySelectorAll('.reply-textarea').forEach(textarea => {
            const replyActions = textarea.closest('.reply-actions');
            if (!replyActions) return;
            
            const charCount = replyActions.querySelector('.char-count');
            if (!charCount) return;
            
            textarea.addEventListener('input', () => {
                const count = textarea.value.length;
                charCount.textContent = count;
                if (count > 2000) {
                    charCount.style.color = '#dc3545';
                } else {
                    charCount.style.color = '#495057';
                }
            });
        });

        // Reply buttons
        document.querySelectorAll('.btn-reply').forEach(button => {
            button.addEventListener('click', (e) => {
                const reviewerUserId = button.getAttribute('data-reviewer-user-id');
                const replyFormContainer = button.closest('.reply-form-container');
                if (!replyFormContainer) return;
                
                const textarea = replyFormContainer.querySelector('.reply-textarea');
                if (!textarea) return;
                
                const reply = textarea.value.trim();

                if (!reply) {
                    alert('Please enter a reply before submitting.');
                    return;
                }

                if (reply.length > 2000) {
                    alert('Reply must be 2000 characters or less.');
                    return;
                }

                this.submitReply(reviewerUserId, reply, button, textarea);
            });
        });

        // Edit reply buttons
        document.querySelectorAll('.btn-edit-reply').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const reviewerUserId = button.getAttribute('data-reviewer-user-id');
                const reviewId = button.getAttribute('data-review-id');
                const review = this.reviews.find(r => r.id === reviewId);
                
                if (review && review.businessResponse) {
                    // Convert reply section to edit form
                    this.showEditReplyForm(review, reviewerUserId, button);
                }
            });
        });
    }

    async submitReply(reviewerUserId, reply, button, textarea) {
        if (!reviewerUserId) {
            alert('Reviewer ID not found. Please refresh the page.');
            return;
        }

        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

        try {
            const response = await fetch(REVIEWS_MANAGEMENT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    reviewerUserId: reviewerUserId,
                    reply: reply
                })
            });

            const data = await response.json();

            if (data.success) {
                // Reload reviews to show the new reply
                await this.loadReviews();
                this.showSuccess('Reply posted successfully!');
            } else {
                throw new Error(data.message || 'Failed to post reply');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            alert('Failed to post reply. Please try again.');
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    showEditReplyForm(review, reviewerUserId, editButton) {
        // Find the business reply container
        const businessReply = editButton.closest('.business-reply');
        if (!businessReply) {
            console.error('Business reply container not found');
            return;
        }

        // Get the current reply text
        const currentReply = review.businessResponse || '';
        const businessReplyContent = businessReply.querySelector('.business-reply-content');
        
        // Replace the business reply with an edit form
        const editFormHtml = `
            <div class="reply-form-container">
                <div class="reply-form-header">
                    <i class="fas fa-edit"></i>
                    <span>Edit your reply</span>
                </div>
                <textarea class="reply-textarea edit-reply-textarea" rows="4" maxlength="2000">${this.escapeHtml(currentReply)}</textarea>
                <div class="reply-actions">
                    <div class="char-counter">
                        <span class="char-count">${currentReply.length}</span> / 2000 characters
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-cancel-edit">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="btn btn-danger btn-save-edit" data-reviewer-user-id="${this.escapeHtml(reviewerUserId)}">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Replace the business reply content with the edit form
        businessReplyContent.outerHTML = editFormHtml;

        // Attach event listeners for the edit form
        const editFormContainer = businessReply.querySelector('.reply-form-container');
        const editTextarea = editFormContainer.querySelector('.edit-reply-textarea');
        const charCount = editFormContainer.querySelector('.char-count');
        const saveButton = editFormContainer.querySelector('.btn-save-edit');
        const cancelButton = editFormContainer.querySelector('.btn-cancel-edit');

        // Character counter
        editTextarea.addEventListener('input', () => {
            const length = editTextarea.value.length;
            charCount.textContent = length;
            if (length > 2000) {
                charCount.style.color = '#dc3545';
            } else {
                charCount.style.color = '#495057';
            }
        });

        // Cancel button - restore original reply
        cancelButton.addEventListener('click', () => {
            // Reload reviews to restore original state
            this.loadReviews();
        });

        // Save button
        saveButton.addEventListener('click', async () => {
            const newReply = editTextarea.value.trim();
            
            if (!newReply) {
                alert('Reply cannot be empty.');
                return;
            }
            
            if (newReply.length > 2000) {
                alert('Reply must be 2000 characters or less.');
                return;
            }

            // Disable button and show loading state
            const originalText = saveButton.innerHTML;
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                await this.submitReply(reviewerUserId, newReply);
            } catch (error) {
                console.error('Error saving reply:', error);
                saveButton.disabled = false;
                saveButton.innerHTML = originalText;
            }
        });

        // Focus the textarea
        editTextarea.focus();
        // Move cursor to end
        editTextarea.setSelectionRange(editTextarea.value.length, editTextarea.value.length);
    }

    showSuccess(message) {
        // You can use toast notifications here
        console.log('Success:', message);
    }

    showError(message) {
        const container = document.getElementById('reviewsContainer');
        if (!container) {
            console.error('reviewsContainer not found:', message);
            return;
        }
        
        // Check if loadingState and emptyState exist, if not, recreate them
        let loadingState = document.getElementById('loadingState');
        let emptyState = document.getElementById('emptyState');
        
        if (!loadingState) {
            loadingState = document.createElement('div');
            loadingState.id = 'loadingState';
            loadingState.className = 'text-center py-5';
            loadingState.style.display = 'none';
            loadingState.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading reviews...</p>
            `;
            container.appendChild(loadingState);
        }
        
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.id = 'emptyState';
            emptyState.className = 'text-center py-5';
            emptyState.style.display = 'none';
            emptyState.innerHTML = `
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h4>No Reviews Yet</h4>
                <p class="text-muted">You don't have any reviews yet. Reviews will appear here once customers start rating your business.</p>
            `;
            container.appendChild(emptyState);
        }
        
        // Hide loading and empty states
        loadingState.style.display = 'none';
        emptyState.style.display = 'none';
        
        // Remove any existing error alerts
        const existingError = container.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}`;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// Initialize when DOM is ready
function initializeReviewsManagement() {
    // Check if required DOM elements exist
    const container = document.getElementById('reviewsContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!container || !loadingState || !emptyState) {
        console.log('DOM elements not ready yet, retrying...');
        console.log('Container:', container);
        console.log('LoadingState:', loadingState);
        console.log('EmptyState:', emptyState);
        console.log('Document ready state:', document.readyState);
        console.log('Body:', document.body);
        
        // Retry with exponential backoff, max 10 retries (1 second)
        let retryCount = 0;
        const maxRetries = 10;
        
        const retry = () => {
            retryCount++;
            if (retryCount < maxRetries) {
                setTimeout(initializeReviewsManagement, 100);
            } else {
                console.error('Failed to find DOM elements after', maxRetries, 'retries');
                console.error('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            }
        };
        
        retry();
        return;
    }
    
    // All required elements exist, initialize manager
    console.log('All DOM elements found, initializing ReviewsManagementManager');
    window.reviewsManagementManager = new ReviewsManagementManager();
}

// Wait for DOM and all resources to be ready
function startInitialization() {
    // Wait for both DOM and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit more for elements to be fully rendered
            setTimeout(initializeReviewsManagement, 100);
        });
    } else if (document.readyState === 'interactive') {
        // DOM is ready but resources might still be loading
        window.addEventListener('load', () => {
            setTimeout(initializeReviewsManagement, 100);
        });
        // Also try immediately in case load already fired
        setTimeout(initializeReviewsManagement, 100);
    } else {
        // DOM is complete, but wait a bit to ensure all elements are rendered
        setTimeout(initializeReviewsManagement, 100);
    }
}

startInitialization();

