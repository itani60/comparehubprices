// LocalHub Business Listing Page
// Fetches and displays businesses on local_hub.html

const API_BASE_URL = 'https://acc.comparehubprices.site/business/business/public';
const SEARCH_API_URL = 'https://acc.comparehubprices.site/business/search';

class LocalHubManager {
    constructor() {
        this.businesses = [];
        this.currentFilters = {
            search: '',
            category: 'all',
            province: 'all',
            location: 'all',
            sort: 'relevance'
        };
        this.isLoading = false;
        this.lastKey = null;
        this.hasMore = true;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        // Sync filters from hidden inputs on initialization
        this.syncFiltersFromInputs();
        await this.loadBusinesses();
    }

    syncFiltersFromInputs() {
        // Sync category filter
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            this.currentFilters.category = categorySelect.value || 'all';
        }

        // Sync province filter
        const provinceSelect = document.getElementById('provinceSelect');
        if (provinceSelect) {
            this.currentFilters.province = provinceSelect.value || 'all';
        }

        // Sync location filter
        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) {
            this.currentFilters.location = locationSelect.value || 'all';
        }

        // Sync sort filter
        const sortSelect = document.getElementById('sortBusinessSelect');
        if (sortSelect) {
            this.currentFilters.sort = sortSelect.value || 'relevance';
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('businessSearchInput');
        const searchBtn = document.getElementById('searchBusinessBtn');
        
        if (searchInput) {
            // Handle Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
            
            // Handle input for search suggestions
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        this.showSearchSuggestions(query);
                    }, 300);
                } else {
                    this.hideSearchSuggestions();
                }
            });
            
            // Handle focus
            searchInput.addEventListener('focus', () => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.showSearchSuggestions(query);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const searchBox = document.querySelector('.search-box');
            const suggestions = document.getElementById('businessSearchSuggestions');
            
            if (searchBox && suggestions && !searchBox.contains(e.target)) {
                this.hideSearchSuggestions();
            }
        });

        // Category filter - listen to hidden input changes
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                console.log('Category filter changed to:', e.target.value);
                this.loadBusinesses(true);
            });
        }

        // Province filter - listen to hidden input changes
        const provinceSelect = document.getElementById('provinceSelect');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', (e) => {
                this.currentFilters.province = e.target.value;
                console.log('Province filter changed to:', e.target.value);
                this.loadBusinesses(true);
            });
        }

        // Location filter - listen to hidden input changes
        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.currentFilters.location = e.target.value;
                console.log('Location filter changed to:', e.target.value);
                this.loadBusinesses(true);
            });
        }

        // Sort filter - listen to hidden input changes
        const sortSelect = document.getElementById('sortBusinessSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                console.log('Sort filter changed to:', e.target.value);
                this.sortBusinesses();
            });
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('businessSearchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.hideSearchSuggestions();
            this.loadBusinesses(true);
        }
    }
    
    async showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('businessSearchSuggestions');
        if (!suggestionsContainer) return;
        
        const suggestionsContent = suggestionsContainer.querySelector('.suggestions-content');
        if (!suggestionsContent) return;
        
        // Show loading state
        suggestionsContent.innerHTML = '<div class="search-loading">Searching...</div>';
        suggestionsContainer.style.display = 'block';
        suggestionsContainer.classList.add('show');
        
        try {
            const params = new URLSearchParams({
                q: query,
                limit: '8'
            });
            
            const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.businesses && data.businesses.length > 0) {
                this.displayBusinessSuggestions(data.businesses, query, data.totalFound || data.count || data.businesses.length);
            } else {
                suggestionsContent.innerHTML = '<div class="search-no-results">No businesses found</div>';
            }
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            suggestionsContent.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
        }
    }
    
    displayBusinessSuggestions(businesses, query, totalFound) {
        const suggestionsContainer = document.getElementById('businessSearchSuggestions');
        const suggestionsContent = suggestionsContainer?.querySelector('.suggestions-content');
        if (!suggestionsContent) return;
        
        const businessesHtml = businesses.map(business => {
            // Try multiple possible logo field names, handling empty strings
            const getImageUrl = () => {
                const logo = business.businessLogoUrl || 
                            business.logo || 
                            business.logoUrl || 
                            business.businessLogo || 
                            business.imageUrl ||
                            business.image ||
                            '';
                // Return logo if it's a non-empty string, otherwise use placeholder
                return (logo && typeof logo === 'string' && logo.trim() !== '') 
                    ? logo.trim() 
                    : 'https://via.placeholder.com/56?text=Business';
            };
            
            const imageUrl = getImageUrl();
            const businessName = business.businessName || business.name || 'Unknown Business';
            const businessCategory = business.businessCategory || business.category || 'Business';
            const businessId = business.businessId || business.id;
            
            return `
                <div class="search-suggestion-item" data-business-id="${businessId}" data-type="business">
                    <img src="${imageUrl}" alt="${this.escapeHtml(businessName)}" onerror="this.src='https://via.placeholder.com/56?text=Business'" loading="lazy">
                    <div class="suggestion-content">
                        <h6>${this.escapeHtml(businessName)}</h6>
                        <p>${this.escapeHtml(businessCategory)} • Business</p>
                    </div>
                </div>
            `;
        }).join('');
        
        const totalCountText = totalFound > businesses.length ? ` (${totalFound.toLocaleString()})` : '';
        const viewAllLink = `
            <div class="search-view-all">
                <a href="search-results.html?q=${encodeURIComponent(query)}" class="view-all-results-link">
                    <span>View all results${totalCountText}</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        suggestionsContent.innerHTML = businessesHtml + viewAllLink;
        
        // Add click handlers
        suggestionsContent.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const businessId = item.dataset.businessId;
                if (businessId) {
                    window.location.href = `local_business_info.html?businessId=${businessId}`;
                }
            });
        });
    }
    
    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('businessSearchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.classList.remove('show');
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadBusinesses(reset = false) {
        if (this.isLoading) return;
        
        if (reset) {
            this.businesses = [];
            this.lastKey = null;
            this.hasMore = true;
        }

        // If there's a search query, use the dedicated search API
        if (this.currentFilters.search && this.currentFilters.search.trim().length > 0) {
            return this.searchBusinesses(reset);
        }

        // Otherwise use the regular listing API
        if (!this.hasMore && !reset) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                limit: '50'
            });

            if (this.currentFilters.category && this.currentFilters.category !== 'all') {
                params.append('category', this.currentFilters.category);
            }
            if (this.currentFilters.province && this.currentFilters.province !== 'all') {
                params.append('province', this.currentFilters.province);
            }
            if (this.currentFilters.location && this.currentFilters.location !== 'all') {
                params.append('location', this.currentFilters.location);
            }
            if (this.lastKey && !reset) {
                params.append('lastKey', encodeURIComponent(JSON.stringify(this.lastKey)));
            }

            const response = await fetch(`${API_BASE_URL}/list?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.businesses) {
                if (reset) {
                    this.businesses = data.businesses;
                } else {
                    this.businesses = [...this.businesses, ...data.businesses];
                }
                
                this.lastKey = data.lastKey;
                this.hasMore = !!data.lastKey;

                this.renderBusinesses();
            } else {
                throw new Error(data.message || 'Failed to load businesses');
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            this.showError('Failed to load businesses. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async searchBusinesses(reset = false) {
        if (this.isLoading) return;
        
        if (reset) {
            this.businesses = [];
            this.lastKey = null;
            this.hasMore = false; // Search API doesn't support pagination yet
        }

        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                q: this.currentFilters.search.trim(),
                limit: '100'
            });

            if (this.currentFilters.category && this.currentFilters.category !== 'all') {
                params.append('category', this.currentFilters.category);
            }
            if (this.currentFilters.province && this.currentFilters.province !== 'all') {
                params.append('province', this.currentFilters.province);
            }

            const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.businesses) {
                this.businesses = data.businesses;
                this.hasMore = false; // Search results are returned all at once
                this.lastKey = null;

                // Apply sorting if needed
                if (this.currentFilters.sort !== 'relevance') {
                    this.sortBusinesses();
                } else {
                    this.renderBusinesses();
                }
            } else {
                throw new Error(data.message || 'Failed to search businesses');
            }
        } catch (error) {
            console.error('Error searching businesses:', error);
            this.showError('Failed to search businesses. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    sortBusinesses() {
        const sortBy = this.currentFilters.sort;
        
        switch (sortBy) {
            case 'relevance':
                // Keep original order
                break;
            case 'name-asc':
                this.businesses.sort((a, b) => {
                    const nameA = (a.businessName || a.name || '').toLowerCase();
                    const nameB = (b.businessName || b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name-desc':
                this.businesses.sort((a, b) => {
                    const nameA = (a.businessName || a.name || '').toLowerCase();
                    const nameB = (b.businessName || b.name || '').toLowerCase();
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'rating':
                this.businesses.sort((a, b) => {
                    const ratingA = this.getAverageRating(a.businessId || a.id) || 0;
                    const ratingB = this.getAverageRating(b.businessId || b.id) || 0;
                    return ratingB - ratingA;
                });
                break;
            case 'distance':
                // Distance sorting would require geolocation
                // For now, keep original order
                break;
        }

        this.renderBusinesses();
    }

    getAverageRating(businessId) {
        // Get rating from localStorage
        const ratings = JSON.parse(localStorage.getItem('businessRatings') || '{}');
        const businessRatings = ratings[businessId] || [];
        if (businessRatings.length === 0) return 0;
        
        const sum = businessRatings.reduce((acc, r) => acc + r.rating, 0);
        return sum / businessRatings.length;
    }

    renderBusinesses() {
        const grid = document.getElementById('businessGrid');
        if (!grid) return;

        if (this.businesses.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-store"></i>
                    <h3>No businesses found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.businesses.map(business => this.renderBusinessCard(business)).join('');
    }

    renderBusinessCard(business) {
        const businessId = business.businessId || business.id;
        const businessName = business.businessName || business.name || 'Business';
        const description = business.description || business.businessDescription || business.moreInformation || '';
        const category = business.businessCategory || business.category || 'General';
        const address = business.businessAddress || business.address || '';
        const phone = business.businessNumber || business.phone || '';
        const hours = business.businessHours || business.hours || '';
        // Get logo from multiple possible fields
        const logo = business.logo || 
                    business.businessLogoUrl || 
                    business.logoUrl || 
                    business.businessLogo || 
                    '';
        const averageRating = this.getAverageRating(businessId);
        const totalRatings = this.getTotalRatings(businessId);

        // Prioritize logo if available, otherwise use first service gallery image
        let coverImage = '';
        if (logo && logo.trim() !== '') {
            coverImage = logo.trim();
        } else if (business.serviceGalleries && Object.keys(business.serviceGalleries).length > 0) {
            // Get first service gallery image as fallback
            const firstService = Object.values(business.serviceGalleries)[0];
            if (firstService && firstService.length > 0) {
                const firstImage = firstService[0];
                coverImage = typeof firstImage === 'string' ? firstImage : (firstImage.image || firstImage.url || '');
            }
        }
        
        if (!coverImage) {
            coverImage = 'assets/logo .png';
        }

        // Format business hours for display (take first line or truncate)
        let displayHours = hours;
        if (hours && hours.includes('\n')) {
            displayHours = hours.split('\n')[0];
        }
        if (displayHours && displayHours.length > 40) {
            displayHours = displayHours.substring(0, 37) + '...';
        }

        // Ensure we have a valid image URL
        const imageUrl = coverImage || 'assets/logo .png';
        
        return `
            <div class="business-card">
                <div class="business-card-image">
                    <img src="${imageUrl}" alt="${businessName}" loading="lazy" onerror="this.onerror=null; this.src='assets/logo .png';">
                    <div class="business-category-badge">${this.escapeHtml(category)}</div>
                </div>
                <div class="business-card-body">
                    <h3 class="business-card-title">${this.escapeHtml(businessName)}</h3>
                    <p class="business-card-description">${this.escapeHtml(description.substring(0, 120))}${description.length > 120 ? '...' : ''}</p>
                    <div class="business-card-meta">
                        ${address ? `<div class="business-meta-item"><i class="fas fa-map-marker-alt"></i> <span>${this.escapeHtml(address)}</span></div>` : ''}
                        ${phone ? `<div class="business-meta-item"><i class="fas fa-phone"></i> <span>${this.escapeHtml(phone)}</span></div>` : ''}
                        ${displayHours ? `<div class="business-meta-item"><i class="fas fa-clock"></i> <span>${this.escapeHtml(displayHours)}</span></div>` : ''}
                        ${averageRating > 0 ? `
                            <div class="business-rating">
                                <div class="rating-stars">
                                    ${this.renderStarsHTML(averageRating)}
                                </div>
                                <span class="rating-text">${averageRating.toFixed(1)}</span>
                            </div>
                        ` : '<div class="business-rating"><span class="text-muted">No ratings yet</span></div>'}
                    </div>
                    <div class="business-card-actions">
                        <a href="local_business_info.html?id=${businessId}" class="btn btn-primary btn-view">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
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

    getTotalRatings(businessId) {
        const ratings = JSON.parse(localStorage.getItem('businessRatings') || '{}');
        const businessRatings = ratings[businessId] || [];
        return businessRatings.length;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const grid = document.getElementById('businessGrid');
        if (grid && this.businesses.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading businesses...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading is handled in renderBusinesses
    }

    showError(message) {
        const grid = document.getElementById('businessGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error</h3>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.localHubManager = new LocalHubManager();
});

