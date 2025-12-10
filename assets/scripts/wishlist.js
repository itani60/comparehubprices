// Wishlist Management System - Server-side only (no localStorage)
class WishlistManager {
    constructor() {
        this.wishlistItems = [];
        this.allSmartphones = [];
        this.isLoggedIn = false;
        this.authService = null;
        
        // API endpoints
        // Base URL: acc.comparehubprices.site/wishlist (custom domain path)
        // API Gateway routes: /wishlist (GET), /wishlist/add (POST), /wishlist/remove/{productId} (DELETE)
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za/wishlist';
        this.GET_URL = `${this.API_BASE_URL}/wishlist`;
        this.ADD_URL = `${this.API_BASE_URL}/wishlist/add`;
        
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        
        if (this.isLoggedIn) {
            await this.loadWishlist();
        } else {
            this.wishlistItems = [];
        }
        
        this.setupEventListeners();
        this.showLoadingState();
        await this.fetchSmartphonesData();
        this.displayWishlist();
        this.updateAllWishlistButtonStates();
        this.updateWishlistCount();
        this.setupAuthListeners();
    }
    
    async checkAuthStatus() {
        try {
            // Try business auth service first (for business pages)
            if (window.businessAWSAuthService) {
                try {
                    const userInfo = await window.businessAWSAuthService.getUserInfo();
                    if (userInfo.success && userInfo.user !== null) {
                        this.authService = window.businessAWSAuthService;
                        this.isLoggedIn = true;
                        return;
                    }
                } catch (error) {
                    // Business auth failed, try regular auth
                }
            }
            
            // Try regular user auth service
            if (window.awsAuthService) {
                this.authService = window.awsAuthService;
            } else if (window.AWSAuthService) {
                this.authService = new window.AWSAuthService();
            }
            
            if (this.authService) {
                const userInfo = await this.authService.getUserInfo();
                this.isLoggedIn = userInfo.success && userInfo.user !== null;
            } else {
                this.isLoggedIn = false;
            }
        } catch (error) {
            this.isLoggedIn = false;
        }
    }
    
    setupAuthListeners() {
        // Listen for regular user login/logout events
        document.addEventListener('userLoggedIn', async () => {
            await this.checkAuthStatus(); // Re-check to get the correct auth service
            if (this.isLoggedIn) {
                await this.loadWishlist();
                this.displayWishlist();
                this.updateAllWishlistButtonStates();
                this.updateWishlistCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('wishlistUpdated'));
            }
        });
        
        document.addEventListener('userLoggedOut', () => {
            this.isLoggedIn = false;
            this.authService = null;
            this.wishlistItems = [];
            this.displayWishlist();
            this.updateAllWishlistButtonStates();
            this.updateWishlistCount();
        });
        
        // Listen for business user login/logout events (if they exist)
        // Business users might use the same events or different ones
        // We'll also check periodically to catch any auth changes
        // Check more frequently to catch business user logins quickly
        
        setInterval(async () => {
            const wasLoggedIn = this.isLoggedIn;
            await this.checkAuthStatus();
            
            if (wasLoggedIn !== this.isLoggedIn) {
                if (this.isLoggedIn) {
                    await this.loadWishlist();
                } else {
                    this.wishlistItems = [];
                }
                this.displayWishlist();
                this.updateAllWishlistButtonStates();
                this.updateWishlistCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('wishlistUpdated'));
            }
        }, 5000); // Check every 5 seconds instead of 30 to catch business logins faster
    }
    
        async fetchSmartphonesData() {
            try {
            const url = 'https://hub.comparehubprices.co.za/data/products?category=smartphones';
            const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
            
            let productsData = data;
            if (data.body) {
                productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
            }
            
            const products = productsData.products || productsData.items || productsData;
            this.allSmartphones = this.extractSmartphones(products);
            } catch (error) {
                if (window.smartphonesPage && window.smartphonesPage.allSmartphones) {
                    this.allSmartphones = window.smartphonesPage.allSmartphones;
                } else {
                    this.allSmartphones = [];
                }
            }
        }

    extractSmartphones(data) {
        if (Array.isArray(data)) {
            return data;
        } else if (data.products && Array.isArray(data.products)) {
            return data.products;
        } else if (data.smartphones && Array.isArray(data.smartphones)) {
            return data.smartphones;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    }

    getLowestPrice(phone) {
        if (!phone.offers || phone.offers.length === 0) return 0;
        return Math.min(...phone.offers.map(offer => offer.price).filter(price => typeof price === 'number' && price > 0));
    }

    async loadWishlist() {
        if (!this.isLoggedIn) {
            this.wishlistItems = [];
            return;
        }
        
        try {
            const response = await fetch(this.GET_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success && Array.isArray(data.items)) {
                this.wishlistItems = data.items;
            } else {
                this.wishlistItems = [];
            }
        } catch (error) {
            this.wishlistItems = [];
        }
    }

    async addToWishlist(productData) {
        const productId = productData.id || productData.product_id;
        
        if (!productId) {
            return false;
        }
        
        const existingItem = this.wishlistItems.find(item => item.id === productId);
        
        if (existingItem) {
            this.showNotification('Item already in wishlist', 'info');
            return false;
        }

        if (!this.isLoggedIn) {
            this.showNotification('Please log in to add items to your wishlist', 'warning');
            return false;
        }

        const wishlistItem = {
            id: productId,
            name: productData.model || productData.title || productData.name,
            brand: productData.brand || 'Unknown Brand',
            price: this.getLowestPrice(productData),
            image: productData.image || productData.imageUrl || productData.img,
            category: productData.category || 'Unknown',
            dateAdded: new Date().toISOString(),
            url: productData.url || window.location.href,
            specs: productData.specs || {},
            offers: productData.offers || [],
            completeProductData: productData
        };

        try {
            const response = await fetch(this.ADD_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    productId: productId,
                    productData: productData
                })
            });
            
            const data = await response.json();
            if (!data.success && !data.alreadyExists) {
                throw new Error(data.message || 'Failed to add to wishlist');
            }
            
            this.wishlistItems.unshift(wishlistItem);
        this.updateWishlistCount();
        // Dispatch event for badge counter
        document.dispatchEvent(new CustomEvent('wishlistUpdated'));
        this.showNotification('Added to wishlist!', 'success');
        return true;
        } catch (error) {
            this.showNotification('Failed to add to wishlist. Please try again.', 'error');
            return false;
        }
    }

    async removeFromWishlist(productId) {
        if (!this.isLoggedIn) {
            this.showNotification('Please log in to manage your wishlist', 'warning');
            return false;
        }

        const index = this.wishlistItems.findIndex(item => item.id === productId);
        
        if (index === -1) {
            return false;
        }

        try {
            // DELETE /wishlist/wishlist/remove/{productId}
            const response = await fetch(`${this.API_BASE_URL}/wishlist/remove/${encodeURIComponent(productId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to remove from wishlist');
        }

        this.wishlistItems.splice(index, 1);
        this.updateWishlistCount();
        // Dispatch event for badge counter
        document.dispatchEvent(new CustomEvent('wishlistUpdated'));
        this.showNotification('Removed from wishlist', 'info');
        return true;
        } catch (error) {
            this.showNotification('Failed to remove from wishlist. Please try again.', 'error');
            return false;
        }
    }

    isInWishlist(productId) {
        return this.wishlistItems.some(item => item.id === productId);
    }

    async toggleWishlist(productData) {
        const productId = productData.id || productData.product_id;
        
        if (!productId) {
            return false;
        }
        
        if (this.isInWishlist(productId)) {
            await this.removeFromWishlist(productId);
            this.updateWishlistButtonState(productId, false);
        } else {
            await this.addToWishlist(productData);
            this.updateWishlistButtonState(productId, true);
        }
        
        return true;
    }

    displayWishlist() {
        const container = document.querySelector('.contact-content');
        if (!container) return;
        
        if (!window.location.pathname.includes('wishlist.html')) return;

        const loadingState = container.querySelector('.wishlist-loading');
        if (loadingState) {
            loadingState.remove();
        }

        const existingWishlist = container.querySelector('.wishlist-grid');
        if (existingWishlist) {
            existingWishlist.remove();
        }

        const emptyMessage = container.querySelector('.empty-wishlist');
        
        if (this.wishlistItems.length === 0) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            return;
        } else {
            if (emptyMessage) {
                emptyMessage.style.display = 'none';
            }
        }

        const wishlistGrid = document.createElement('div');
        wishlistGrid.className = 'wishlist-grid';
        
        this.wishlistItems.forEach(item => {
            const itemCardHtml = this.createWishlistItemCard(item);
            wishlistGrid.insertAdjacentHTML('beforeend', itemCardHtml);
        });

        const searchSection = container.querySelector('.search-sort-section');
        if (searchSection) {
            searchSection.insertAdjacentElement('afterend', wishlistGrid);
        }
    }

    createWishlistItemCard(item) {
        const latestProductData = this.allSmartphones.find(phone => (phone.product_id || phone.id) === item.id);
        const productData = latestProductData || item;
        
        const lowestPrice = this.getLowestPrice(productData);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        const imageUrl = productData.imageUrl || productData.image || productData.img || 'https://via.placeholder.com/150?text=No+Image';
        const productName = productData.model || productData.title || 'Unknown Smartphone';
        const brandName = productData.brand || 'Unknown Brand';

        const specs = [];
        if (productData.specs?.Performance?.Ram) specs.push(productData.specs.Performance.Ram);
        if (productData.specs?.Performance?.Storage) specs.push(productData.specs.Performance.Storage);
        if (productData.specs?.Os?.['Operating System']) specs.push(productData.specs.Os['Operating System']);

        const specsHtml = specs.length > 0 ? `<div class="product-specs"><span>${specs.join(' • ')}</span></div>` : '';
        const retailerCount = productData.offers?.length || 0;

        return `
            <div class="smartphone-card">
                <div class="card-image-container">
                    <img src="${imageUrl}" alt="${productName}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    <button class="price-alert-bell" data-product-id="${item.id}" title="Set Price Alert">
                        <i class="fas fa-bell"></i>
                    </button>
                </div>
                <div class="card-content">
                    <span class="brand-badge">${brandName}</span>
                    <h3 class="product-name">${productName}</h3>
                    ${specsHtml}
                    <div class="product-price">
                        <span class="current-price">${formattedPrice}</span>
                    </div>
                    <div class="retailer-info">
                        <span>${retailerCount} retailers</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-compare" data-product-id="${item.id}">View</button>
                    <button class="btn-remove" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
    }

    updateWishlistButtonState(productId, isInWishlist) {
        const buttons = document.querySelectorAll(`[data-product-id="${productId}"].btn-wishlist`);
        buttons.forEach(button => {
            if (isInWishlist) {
                button.innerHTML = 'Remove';
                button.classList.add('in-wishlist');
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-danger');
            } else {
                button.innerHTML = 'Add to Wishlist';
                button.classList.remove('in-wishlist');
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
            }
        });
    }

    updateAllWishlistButtonStates() {
        const allWishlistButtons = document.querySelectorAll('.btn-wishlist');
        allWishlistButtons.forEach(button => {
            const productId = button.getAttribute('data-product-id');
            if (productId) {
                const isInWishlist = this.isInWishlist(productId);
                this.updateWishlistButtonState(productId, isInWishlist);
            }
        });
    }

    updateWishlistCount() {
        const count = this.wishlistItems.length;
        
        const wishlistLinks = document.querySelectorAll('a[href*="wishlist"], a[href*="whishlist"]');
        wishlistLinks.forEach(link => {
            const badge = link.querySelector('.wishlist-count-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline' : 'none';
            }
        });

        const desktopBadge = document.getElementById('desktopWishlistCount');
        const mobileBadge = document.getElementById('mobileWishlistCount');
        const pageBadge = document.getElementById('pageWishlistCount');
        
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }
        
        if (mobileBadge) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = count === 0 ? 'none' : 'inline-flex';
    }

        if (pageBadge) {
            pageBadge.textContent = count;
            const displaySection = pageBadge.closest('.wishlist-count-display');
            
            if (count === 0) {
                if (displaySection) {
                    displaySection.style.display = 'none';
                }
            } else {
                pageBadge.style.display = 'inline-flex';
                if (displaySection) {
                    displaySection.style.display = 'flex';
                }
            }
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchWishlistInput');
        const searchDropdown = document.getElementById('searchWishlistDropdown');
        const searchDropdownMenu = document.getElementById('searchWishlistDropdownMenu');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterWishlist(e.target.value);
                this.showSearchSuggestions(e.target.value);
            });
            
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim()) {
                    this.showSearchSuggestions(searchInput.value);
                }
            });
        }

        // Search button functionality
        const searchButton = document.querySelector('.btn-search');
        if (searchButton && searchInput) {
            searchButton.addEventListener('click', () => {
                this.filterWishlist(searchInput.value);
                if (searchDropdownMenu) {
                    searchDropdownMenu.style.display = 'none';
                }
            });
        }

        // Close search dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (searchDropdown && !searchDropdown.contains(e.target)) {
                if (searchDropdownMenu) {
                    searchDropdownMenu.style.display = 'none';
                }
            }
        });

        // Sort dropdown functionality
        this.initSortDropdown();

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove') || e.target.closest('.btn-remove')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-remove') ? e.target : e.target.closest('.btn-remove');
                const productId = button.getAttribute('data-id');
                if (productId) {
                    this.removeFromWishlist(productId);
                    this.displayWishlist();
                    this.updateAllWishlistButtonStates();
                }
            }
            
            if (e.target.classList.contains('btn-compare') || e.target.closest('.btn-compare')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-compare') ? e.target : e.target.closest('.btn-compare');
                const productId = button.getAttribute('data-product-id');
                if (productId) {
                    window.location.href = `smartphones-info.html?id=${productId}`;
                }
            }
        });
    }

    filterWishlist(searchTerm) {
        const filteredItems = this.wishlistItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.displayFilteredWishlist(filteredItems);
    }

    displayFilteredWishlist(items) {
        const container = document.querySelector('.contact-content');
        if (!container) return;

        const existingGrid = container.querySelector('.wishlist-grid');
        if (existingGrid) {
            existingGrid.remove();
        }

        if (items.length === 0) {
            return;
        }

        const wishlistGrid = document.createElement('div');
        wishlistGrid.className = 'wishlist-grid';
        
        items.forEach(item => {
            const itemCardHtml = this.createWishlistItemCard(item);
            wishlistGrid.insertAdjacentHTML('beforeend', itemCardHtml);
        });

        const searchSection = container.querySelector('.search-sort-section');
        if (searchSection) {
            searchSection.insertAdjacentElement('afterend', wishlistGrid);
        }
    }

    initSortDropdown() {
        const sortDropdown = document.getElementById('sortWishlistDropdown');
        const sortDropdownBtn = document.getElementById('sortWishlistDropdownBtn');
        const sortDropdownMenu = document.getElementById('sortWishlistDropdownMenu');
        const sortDropdownText = document.getElementById('sortWishlistDropdownText');
        const sortSelect = document.getElementById('sortWishlistSelect');
        const sortItems = document.querySelectorAll('#sortWishlistDropdownMenu .custom-sort-dropdown-item');

        if (!sortDropdown || !sortDropdownBtn || !sortDropdownMenu || !sortSelect) {
            console.warn('Sort dropdown elements not found');
            return;
        }

        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sortDropdown.classList.contains('active');
            
            document.querySelectorAll('.custom-sort-dropdown').forEach(dd => {
                if (dd.id !== 'sortWishlistDropdown') {
                    dd.classList.remove('active');
                    const menu = dd.querySelector('.custom-sort-dropdown-menu');
                    if (menu) menu.style.display = 'none';
                }
            });

            if (isActive) {
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';
            } else {
                sortDropdown.classList.add('active');
                sortDropdownMenu.style.display = 'block';
            }
        });

        sortItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.dataset.value;
                const text = item.textContent;

                sortSelect.value = value;

                if (sortDropdownText) {
                    sortDropdownText.textContent = text;
                }

                sortItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';

                this.sortWishlist(value);
            });
        });

        document.addEventListener('click', (e) => {
            if (!sortDropdown.contains(e.target)) {
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';
            }
        });
    }

    showSearchSuggestions(searchTerm) {
        const searchDropdownMenu = document.getElementById('searchWishlistDropdownMenu');
        if (!searchDropdownMenu) return;

        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            searchDropdownMenu.style.display = 'none';
            return;
        }

        // Filter wishlist items based on search term for suggestions
        const suggestions = this.wishlistItems.filter(item => {
            const name = (item.name || '').toLowerCase();
            const brand = (item.brand || '').toLowerCase();
            
            return name.includes(term) || brand.includes(term);
        }).slice(0, 5); // Show max 5 suggestions

        if (suggestions.length === 0) {
            searchDropdownMenu.style.display = 'none';
            return;
        }

        // Build suggestions HTML
        searchDropdownMenu.innerHTML = suggestions.map(item => {
            const displayName = item.name || 'Unnamed Item';
            return `
                <div class="custom-search-dropdown-item" data-product-id="${item.productId || ''}">
                    <strong>${this.escapeHtml(displayName)}</strong>
                    ${item.brand ? `<span style="color: #6c757d; font-size: 0.85rem;"> - ${this.escapeHtml(item.brand)}</span>` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers to suggestions
        searchDropdownMenu.querySelectorAll('.custom-search-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.dataset.productId;
                const searchInput = document.getElementById('searchWishlistInput');
                if (searchInput) {
                    const wishlistItem = this.wishlistItems.find(i => i.productId === productId);
                    if (wishlistItem) {
                        searchInput.value = wishlistItem.name || '';
                        this.filterWishlist(searchInput.value);
                    }
                }
                searchDropdownMenu.style.display = 'none';
            });
        });

        searchDropdownMenu.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sortWishlist(sortBy) {
        let sortedItems = [...this.wishlistItems];

        switch (sortBy) {
            case 'date':
            case 'Date Added':
                sortedItems.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'price-low':
            case 'Price: Low to High':
                sortedItems.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
            case 'Price: High to Low':
                sortedItems.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
            case 'Name: A to Z':
                sortedItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
            case 'Name: Z to A':
                sortedItems.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        this.displayFilteredWishlist(sortedItems);
    }

    showLoadingState() {
        const container = document.querySelector('.contact-content');
        if (!container) return;
        
        if (!window.location.pathname.includes('wishlist.html')) return;

        const existingWishlist = container.querySelector('.wishlist-grid');
        const emptyMessage = container.querySelector('.empty-wishlist');
        
        if (existingWishlist) {
            existingWishlist.remove();
        }
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }

        const loadingHTML = `
            <div class="loading-state wishlist-loading">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading wishlist...</h4>
                <p>Please wait while we fetch your saved items</p>
            </div>
        `;

        const searchSection = container.querySelector('.search-sort-section');
        if (searchSection) {
            searchSection.insertAdjacentHTML('afterend', loadingHTML);
        } else {
            container.insertAdjacentHTML('beforeend', loadingHTML);
        }
    }

    showNotification(message, type = 'info') {
        // Use the new toast notification system
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else if (typeof showSuccessToast === 'function' && type === 'success') {
            showSuccessToast(message);
        } else if (typeof showErrorToast === 'function' && (type === 'error' || type === 'danger')) {
            showErrorToast(message);
        } else if (typeof showWarningToast === 'function' && type === 'warning') {
            showWarningToast(message);
        } else if (typeof showInfoToast === 'function' && type === 'info') {
            showInfoToast(message);
        } else {
            // Fallback to console if toast functions not available
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    async clearWishlist() {
        if (!this.isLoggedIn) {
            this.showNotification('Please log in to manage your wishlist', 'warning');
            return;
        }

        if (this.wishlistItems.length === 0) {
            this.showNotification('Wishlist is already empty', 'info');
            return;
        }
        
        this.showConfirmModal(
            'Are you sure you want to remove all items from your wishlist? This action cannot be undone.',
            async () => {
                const removePromises = this.wishlistItems.map(item => 
                    this.removeFromWishlist(item.id || item.productId)
                );
                
                try {
                    await Promise.all(removePromises);
                this.wishlistItems = [];
                this.displayWishlist();
                this.updateWishlistCount();
                this.showNotification('All items removed from wishlist', 'success');
                } catch (error) {
                    this.showNotification('Some items could not be removed. Please try again.', 'error');
                }
            }
        );
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        
        if (!modal || !messageElement || !confirmBtn) {
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }
        
        messageElement.textContent = message;
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
            onConfirm();
        });
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    getWishlistItems() {
        return this.wishlistItems;
    }

    getWishlistCount() {
        return this.wishlistItems.length;
    }
}

let wishlistManager;

document.addEventListener('DOMContentLoaded', () => {
    wishlistManager = new WishlistManager();
    window.wishlistManager = wishlistManager;
});

window.addToWishlist = async function(productData) {
    if (wishlistManager) {
        return await wishlistManager.addToWishlist(productData);
    }
    return false;
};

window.removeFromWishlist = async function(productId) {
    if (wishlistManager) {
        return await wishlistManager.removeFromWishlist(productId);
    }
    return false;
};

window.toggleWishlist = async function(productData) {
    if (wishlistManager) {
        return await wishlistManager.toggleWishlist(productData);
    }
    return false;
};

window.isInWishlist = function(productId) {
    if (wishlistManager) {
        return wishlistManager.isInWishlist(productId);
    }
    return false;
};

window.clearWishlist = function() {
    if (wishlistManager) {
        return wishlistManager.clearWishlist();
    }
    return false;
};

window.updateWishlistCount = function() {
    if (wishlistManager) {
        return wishlistManager.updateWishlistCount();
    }
};
