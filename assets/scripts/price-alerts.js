// Price Alerts Management System - Server-side only (no localStorage)
class PriceAlertsManager {
    constructor() {
        this.priceAlerts = [];
        this.isLoggedIn = false;
        this.authService = null;
        
        // API endpoints
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
        this.ADD_URL = `${this.API_BASE_URL}/add`;
        this.REMOVE_URL = `${this.API_BASE_URL}/remove`;
        this.GET_URL = `${this.API_BASE_URL}`;
        this.UPDATE_URL = `${this.API_BASE_URL}/update`;
        
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        
        if (this.isLoggedIn) {
            await this.loadPriceAlerts();
        } else {
            this.priceAlerts = [];
        }
        
        this.setupEventListeners();
        this.updatePriceAlertsCount();
        this.showLoadingState();
        
        // Small delay to show loading state
        setTimeout(() => {
            this.displayPriceAlerts();
        }, 500);
        
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
            // Silently fail - don't log errors for unauthenticated users
            // Only log if it's an unexpected error (not a session error)
            if (error.message && !error.message.includes('Session expired') && !error.message.includes('Not authenticated')) {
                console.error('Error checking auth status:', error);
            }
            this.isLoggedIn = false;
        }
    }
    
    setupAuthListeners() {
        document.addEventListener('userLoggedIn', async () => {
            this.isLoggedIn = true;
            await this.loadPriceAlerts();
            this.displayPriceAlerts();
            this.updatePriceAlertsCount();
            // Dispatch event for badge counter
            document.dispatchEvent(new CustomEvent('priceAlertsUpdated'));
        });
        
        document.addEventListener('userLoggedOut', () => {
            this.isLoggedIn = false;
            this.priceAlerts = [];
            this.displayPriceAlerts();
            this.updatePriceAlertsCount();
        });
        
        setInterval(async () => {
            const wasLoggedIn = this.isLoggedIn;
            await this.checkAuthStatus();
            
            if (wasLoggedIn !== this.isLoggedIn) {
                if (this.isLoggedIn) {
                    await this.loadPriceAlerts();
                } else {
                    this.priceAlerts = [];
                }
                this.displayPriceAlerts();
                this.updatePriceAlertsCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('priceAlertsUpdated'));
            }
        }, 5000); // Check every 5 seconds instead of 30 to catch business logins faster
    }

    async loadPriceAlerts() {
        if (!this.isLoggedIn) {
            this.priceAlerts = [];
            return;
        }
        
        try {
            const response = await fetch(this.GET_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 404) {
                    // Not authenticated
                    this.priceAlerts = [];
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.alerts) {
                this.priceAlerts = data.alerts.filter(alert => alert.status === 'active');
            } else {
                this.priceAlerts = [];
            }
        } catch (error) {
            console.error('Error loading price alerts:', error);
            this.priceAlerts = [];
        }
    }

    showLoadingState() {
        const container = document.getElementById('priceAlertsList');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create loading state HTML
        const loadingHTML = `
            <div class="loading-state price-alerts-loading">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading price alerts...</h4>
                <p>Please wait while we fetch your alerts</p>
            </div>
        `;

        container.innerHTML = loadingHTML;
    }

    displayPriceAlerts() {
        const container = document.getElementById('priceAlertsList');
        if (!container) return;

        // Remove loading state
        const loadingState = container.querySelector('.price-alerts-loading');
        if (loadingState) {
            loadingState.remove();
        }

        // Clear existing content
        container.innerHTML = '';

        // Get or create empty state element
        let emptyState = document.querySelector('.empty-wishlist');
        if (!emptyState) {
            // Create empty state dynamically if it doesn't exist
            emptyState = document.createElement('div');
            emptyState.className = 'empty-wishlist';
            emptyState.innerHTML = `
                <div class="empty-wishlist-content">
                    <div class="empty-wishlist-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3>No price alerts set</h3>
                    <p>Start setting price alerts on products to get notified when prices drop!</p>
                </div>
            `;
            // Insert after the priceAlertsList container
            container.parentNode.insertBefore(emptyState, container.nextSibling);
        }

        // Show empty state if no alerts
        if (this.priceAlerts.length === 0) {
            emptyState.style.display = 'block';
            // Hide remove all button
            const removeAllBtn = document.getElementById('removeAllAlertsBtn');
            if (removeAllBtn) {
                removeAllBtn.style.display = 'none';
            }
            return;
        }

        // Hide empty state when there are alerts
        emptyState.style.display = 'none';

        // Show remove all button
        const removeAllBtn = document.getElementById('removeAllAlertsBtn');
        if (removeAllBtn) {
            removeAllBtn.style.display = 'inline-flex';
        }

        // Create grid for price alert cards
        const alertsGrid = document.createElement('div');
        alertsGrid.className = 'price-alerts-grid';

        // Add each alert as a card
        this.priceAlerts.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            alertsGrid.insertAdjacentHTML('beforeend', alertCard);
        });

        container.appendChild(alertsGrid);
    }

    createAlertCard(alert) {
        const currentPrice = alert.currentPrice || 0;
        const targetPrice = alert.targetPrice || 0;
        const formattedCurrentPrice = currentPrice.toLocaleString('en-ZA', { 
            style: 'currency', 
            currency: 'ZAR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
        const formattedTargetPrice = targetPrice.toLocaleString('en-ZA', { 
            style: 'currency', 
            currency: 'ZAR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });

        // Calculate days since alert was created
        const daysSince = this.getDaysSinceCreated(alert.dateCreated);

        // Determine if target is reached
        const targetReached = currentPrice > 0 && currentPrice <= targetPrice;
        const statusClass = targetReached ? 'target-reached' : '';
        const statusBadge = targetReached 
            ? '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Target Reached!</span>'
            : `<span class="badge bg-warning text-dark" style="cursor:pointer" onclick="priceAlertsManager.showMonitoring('${alert.productId}')"><i class="fas fa-clock"></i> Monitoring</span>`;

        return `
            <div class="smartphone-card ${statusClass}" data-alert-id="${alert.productId}">
                <div class="card-image-container">
                    <img src="${alert.productImage || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                         alt="${alert.productName}" 
                         class="card-image"
                         loading="lazy">
                    ${statusBadge}
                </div>
                <div class="card-content">
                    <div class="product-brand">${alert.productBrand}</div>
                    <h3 class="product-name">${alert.productName}</h3>
                    
                    <div class="price-alert-info">
                        <div class="price-row">
                            <span class="price-label">Current Price:</span>
                            <span class="current-price">${formattedCurrentPrice}</span>
                        </div>
                        <div class="price-row">
                            <span class="price-label">Target Price:</span>
                            <span class="target-price">${formattedTargetPrice}</span>
                        </div>
                        ${alert.alertName ? `<div class="alert-name"><i class="fas fa-tag"></i> ${alert.alertName}</div>` : ''}
                        <div class="alert-meta">
                            <span><i class="fas fa-calendar"></i> ${daysSince}</span>
                            <span><i class="fas fa-envelope"></i> ${alert.emailAddress}</span>
                        </div>
                        <div class="notification-method">
                            <i class="fas fa-bell"></i> ${this.formatNotificationMethod(alert.notificationMethod)}
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn btn-success btn-compare"
                                onclick="window.location.href='smartphone_info.html?id=${alert.productId}'">
                            View
                        </button>
                        <button class="btn btn-danger btn-remove" 
                                data-product-id="${alert.productId}"
                                onclick="priceAlertsManager.removeAlert('${alert.productId}')">
                            Remove
                        </button>
                    </div>
                    <div class="card-actions card-actions-update">
                        <button class="btn btn-secondary btn-update" 
                                data-product-id="${alert.productId}"
                                onclick="priceAlertsManager.updateAlert('${alert.productId}')">
                            Update
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async showMonitoring(productId) {
        const alert = this.priceAlerts.find(a => a.productId === productId);
        if (!alert) {
            this.showNotification('Alert not found', 'error');
            return;
        }
        
        // Show loading modal content
        this.openMonitoringModal({ loading: true, productName: alert.productName });

        try {
            const apiUrl = 'https://acc.comparehubprices.site/data/products?category=smartphones';
            const resp = await fetch(apiUrl);
            const data = await resp.json();
            const products = Array.isArray(data) ? data : (data.products || data.smartphones || data.data || []);
            const product = products.find(p => (p.product_id || p.id) === productId);
            const offers = Array.isArray(product?.offers) ? product.offers.filter(o => typeof o.price === 'number') : [];
            this.openMonitoringModal({ productName: alert.productName, offers });
        } catch (e) {
            this.openMonitoringModal({ productName: alert.productName, offers: [], error: 'Failed to load retailer prices.' });
        }
    }

    openMonitoringModal({ loading = false, productName = '', offers = [], error = '' }) {
        let bodyHtml = '';
        if (loading) {
            bodyHtml = `
                <div class="loading-state" style="padding:20px; text-align:center;">
                    <div class="modern-spinner"><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div></div>
                    <h5>Checking retailer prices...</h5>
                </div>`;
        } else if (error) {
            bodyHtml = `<div class="alert alert-danger">${error}</div>`;
        } else if (!offers.length) {
            bodyHtml = `<div class="alert alert-info">No live offers found for this product yet.</div>`;
        } else {
            const rows = offers
                .sort((a, b) => a.price - b.price)
                .map(o => `<tr><td>${o.retailer || 'Retailer'}</td><td>${(o.price || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td><td>${o.availability || ''}</td></tr>`)
                .join('');
            bodyHtml = `
                <div class="table-responsive">
                    <table class="table table-striped align-middle">
                        <thead>
                            <tr><th>Retailer</th><th>Price</th><th>Status</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        }

        const modalEl = this.ensureMonitoringModal();
        modalEl.querySelector('.modal-title').textContent = `Monitoring: ${productName}`;
        modalEl.querySelector('.modal-body').innerHTML = bodyHtml;
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
    }

    ensureMonitoringModal() {
        let modal = document.getElementById('monitoringModal');
        if (modal) return modal;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="modal fade" id="monitoringModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Monitoring</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(wrapper.firstElementChild);
        return document.getElementById('monitoringModal');
    }

    formatNotificationMethod(method) {
        const methods = {
            'email': 'Email Only',
            'browser': 'Browser Only',
            'both': 'Email & Browser'
        };
        return methods[method] || method;
    }

    getDaysSinceCreated(dateCreated) {
        if (!dateCreated) return 'Unknown';
        
        const created = new Date(dateCreated);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Set today';
        } else if (diffDays === 1) {
            return 'Set 1 day ago';
        } else if (diffDays < 7) {
            return `Set ${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Set ${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `Set ${months} month${months > 1 ? 's' : ''} ago`;
        }
    }

    async refreshAlerts() {
        // Reload alerts from server
        await this.loadPriceAlerts();
        
        // Update count badge
        this.updatePriceAlertsCount();
        
        // Show loading state
        this.showLoadingState();
        
        // Small delay then display updated alerts
        setTimeout(() => {
            this.displayPriceAlerts();
        }, 300);
    }

    updateAlert(productId) {
        if (!this.isLoggedIn) {
            this.showNotification('Please login to update price alerts', 'error');
            return;
        }
        
        // Find the alert to update
        const alert = this.priceAlerts.find(alert => alert.productId === productId);
        
        if (!alert) {
            this.showNotification('Alert not found', 'error');
            return;
        }

        // Check if price alert modal is available
        if (!window.priceAlertModal) {
            this.showNotification('Price alert modal not available', 'error');
            return;
        }

        // Prepare product data for the modal
        const productData = {
            product_id: alert.productId,
            id: alert.productId,
            model: alert.productName,
            title: alert.productName,
            brand: alert.productBrand,
            imageUrl: alert.productImage,
            image: alert.productImage,
            img: alert.productImage,
            offers: alert.currentPrice > 0 ? [{ price: alert.currentPrice }] : []
        };

        // Store the existing alert data for pre-filling
        window.priceAlertModal.existingAlertData = {
            alertId: alert.alertId,
            targetPrice: alert.targetPrice,
            notificationMethod: alert.notificationMethod,
            alertName: alert.alertName,
            emailAddress: alert.emailAddress,
            priceIncreaseAlert: alert.priceIncreaseAlert || false
        };

        // Open the modal
        window.priceAlertModal.show(productData);
    }

    async removeAlert(productId) {
        if (!this.isLoggedIn) {
            this.showNotification('Please login to remove price alerts', 'error');
            return;
        }
        
        // Find the alert
        const alert = this.priceAlerts.find(alert => alert.productId === productId);
        if (!alert) {
            this.showNotification('Alert not found', 'error');
            return;
        }

        // Prepare request body - send alertId if available, otherwise send productId
        // The Lambda can handle either one
        const requestBody = {};
        if (alert.alertId) {
            requestBody.alertId = alert.alertId;
        } else if (alert.id) {
            requestBody.alertId = alert.id;
        }
        // Always include productId as fallback
        requestBody.productId = productId;

        // Remove price alert directly without confirmation
        try {
            const response = await fetch(this.REMOVE_URL, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove price alert');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from local array
                this.priceAlerts = this.priceAlerts.filter(a => a.productId !== productId);
                this.updatePriceAlertsCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('priceAlertsUpdated'));
                this.displayPriceAlerts();
            } else {
                throw new Error(data.message || 'Failed to remove price alert');
            }
        } catch (error) {
            console.error('Error removing price alert:', error);
            this.showNotification(error.message || 'Failed to remove price alert', 'error');
        }
    }

    async removeAllAlerts() {
        if (!this.isLoggedIn) {
            this.showNotification('Please login to remove price alerts', 'error');
            return;
        }
        
        if (this.priceAlerts.length === 0) {
            return;
        }

        // Remove all alerts directly without confirmation
        try {
            // Remove all alerts one by one
            const removePromises = this.priceAlerts.map(alert => {
                const requestBody = {};
                if (alert.alertId) {
                    requestBody.alertId = alert.alertId;
                } else if (alert.id) {
                    requestBody.alertId = alert.id;
                }
                requestBody.productId = alert.productId;
                return fetch(this.REMOVE_URL, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            });
            
            await Promise.all(removePromises);
            
            // Clear local array
            this.priceAlerts = [];
            this.updatePriceAlertsCount();
            // Dispatch event for badge counter
            document.dispatchEvent(new CustomEvent('priceAlertsUpdated'));
            this.displayPriceAlerts();
        } catch (error) {
            console.error('Error removing all price alerts:', error);
            this.showNotification('Failed to remove all price alerts', 'error');
        }
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('priceAlertsConfirmModal');
        const messageElement = document.getElementById('priceAlertsConfirmMessage');
        const confirmBtn = document.getElementById('priceAlertsConfirmBtn');
        if (!modal || !messageElement || !confirmBtn) {
            if (confirm(message)) onConfirm();
            return;
        }
        messageElement.textContent = message;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
            onConfirm();
        });
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    setupEventListeners() {
        // Remove all button
        const removeAllBtn = document.getElementById('removeAllAlertsBtn');
        if (removeAllBtn) {
            removeAllBtn.addEventListener('click', () => this.removeAllAlerts());
        }

        // Search functionality
        const searchInput = document.getElementById('searchAlertsInput');
        const searchDropdown = document.getElementById('searchAlertsDropdown');
        const searchDropdownMenu = document.getElementById('searchAlertsDropdownMenu');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
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
                this.handleSearch(searchInput.value);
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
    }

    handleSearch(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            // If search is empty, display all alerts
            this.displayPriceAlerts();
            return;
        }

        // Filter alerts based on search term
        const filteredAlerts = this.priceAlerts.filter(alert => {
            const productName = (alert.productName || '').toLowerCase();
            const productBrand = (alert.productBrand || '').toLowerCase();
            const alertName = (alert.alertName || '').toLowerCase();
            
            return productName.includes(term) || 
                   productBrand.includes(term) || 
                   alertName.includes(term);
        });

        this.displayFilteredAlerts(filteredAlerts);
    }

    handleSort(sortBy) {
        let sortedAlerts = [...this.priceAlerts];

        switch(sortBy) {
            case 'date':
                // Most recent first
                sortedAlerts.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
                break;
            case 'price-low':
                // Target price: Low to High
                sortedAlerts.sort((a, b) => a.targetPrice - b.targetPrice);
                break;
            case 'price-high':
                // Target price: High to Low
                sortedAlerts.sort((a, b) => b.targetPrice - a.targetPrice);
                break;
            case 'name-asc':
                // Name: A to Z
                sortedAlerts.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
                break;
            case 'name-desc':
                // Name: Z to A
                sortedAlerts.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
                break;
        }

        this.displayFilteredAlerts(sortedAlerts);
    }

    initSortDropdown() {
        const sortDropdown = document.getElementById('sortAlertsDropdown');
        const sortDropdownBtn = document.getElementById('sortAlertsDropdownBtn');
        const sortDropdownMenu = document.getElementById('sortAlertsDropdownMenu');
        const sortDropdownText = document.getElementById('sortAlertsDropdownText');
        const sortSelect = document.getElementById('sortAlertsSelect');
        const sortItems = document.querySelectorAll('#sortAlertsDropdownMenu .custom-sort-dropdown-item');

        if (!sortDropdown || !sortDropdownBtn || !sortDropdownMenu || !sortSelect) {
            console.warn('Sort dropdown elements not found');
            return;
        }

        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sortDropdown.classList.contains('active');
            
            document.querySelectorAll('.custom-sort-dropdown').forEach(dd => {
                if (dd.id !== 'sortAlertsDropdown') {
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

                this.handleSort(value);
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
        const searchDropdownMenu = document.getElementById('searchAlertsDropdownMenu');
        if (!searchDropdownMenu) return;

        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            searchDropdownMenu.style.display = 'none';
            return;
        }

        // Filter alerts based on search term for suggestions
        const suggestions = this.priceAlerts.filter(alert => {
            const productName = (alert.productName || '').toLowerCase();
            const productBrand = (alert.productBrand || '').toLowerCase();
            const alertName = (alert.alertName || '').toLowerCase();
            
            return productName.includes(term) || 
                   productBrand.includes(term) || 
                   alertName.includes(term);
        }).slice(0, 5); // Show max 5 suggestions

        if (suggestions.length === 0) {
            searchDropdownMenu.style.display = 'none';
            return;
        }

        // Build suggestions HTML
        searchDropdownMenu.innerHTML = suggestions.map(alert => {
            const displayName = alert.productName || alert.alertName || 'Unnamed Alert';
            return `
                <div class="custom-search-dropdown-item" data-alert-id="${alert.alertId || ''}">
                    <strong>${this.escapeHtml(displayName)}</strong>
                    ${alert.productBrand ? `<span style="color: #6c757d; font-size: 0.85rem;"> - ${this.escapeHtml(alert.productBrand)}</span>` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers to suggestions
        searchDropdownMenu.querySelectorAll('.custom-search-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const alertId = item.dataset.alertId;
                const searchInput = document.getElementById('searchAlertsInput');
                if (searchInput) {
                    const alert = this.priceAlerts.find(a => a.alertId === alertId);
                    if (alert) {
                        searchInput.value = alert.productName || alert.alertName || '';
                        this.handleSearch(searchInput.value);
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

    displayFilteredAlerts(alerts) {
        const container = document.getElementById('priceAlertsList');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get or create empty state element
        let emptyState = document.querySelector('.empty-wishlist');
        if (!emptyState) {
            // Create empty state dynamically if it doesn't exist
            emptyState = document.createElement('div');
            emptyState.className = 'empty-wishlist';
            emptyState.innerHTML = `
                <div class="empty-wishlist-content">
                    <div class="empty-wishlist-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3>No price alerts set</h3>
                    <p>Start setting price alerts on products to get notified when prices drop!</p>
                </div>
            `;
            // Insert after the priceAlertsList container
            container.parentNode.insertBefore(emptyState, container.nextSibling);
        }

        // Show empty state if no alerts (either no alerts at all, or filtered results are empty)
        if (alerts.length === 0) {
            emptyState.style.display = 'block';
            // Hide remove all button if no alerts at all
            if (this.priceAlerts.length === 0) {
                const removeAllBtn = document.getElementById('removeAllAlertsBtn');
                if (removeAllBtn) {
                    removeAllBtn.style.display = 'none';
                }
            }
            return;
        }

        // Hide empty state when there are filtered alerts
        emptyState.style.display = 'none';

        // Create grid for price alert cards
        const alertsGrid = document.createElement('div');
        alertsGrid.className = 'price-alerts-grid';

        // Add each alert as a card
        alerts.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            alertsGrid.insertAdjacentHTML('beforeend', alertCard);
        });

        container.appendChild(alertsGrid);
    }

    updatePriceAlertsCount() {
        const count = this.priceAlerts.length;
        
        // Update desktop header badge
        const desktopBadge = document.getElementById('desktopPriceAlertsCount');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            if (count === 0) {
                desktopBadge.style.display = 'none';
            } else {
                desktopBadge.style.display = 'inline-flex';
            }
        }
        
        // Update page hero badge
        const pageBadge = document.getElementById('pagePriceAlertsCount');
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

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize price alerts manager
let priceAlertsManager;

document.addEventListener('DOMContentLoaded', () => {
    priceAlertsManager = new PriceAlertsManager();
    
    // Make it globally available
    window.priceAlertsManager = priceAlertsManager;
});

