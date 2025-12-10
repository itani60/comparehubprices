// Tablets Page Functionality
// API Configuration - matching admin-product-management.html
const API_CONFIG = {
    BASE_URL: 'https://hub.comparehubprices.co.za/data',
    LIST_PRODUCTS_ENDPOINT: '/products',
};

class TabletsPage {
    constructor(category = 'tablets') {
        this.category = category;
        this.allTablets = [];
        this.filteredTablets = [];
        this.tabletsContainer = document.querySelector('.tablets-content');
        this.sortSelect = document.getElementById('sortSelect');
        this.brandOptions = document.querySelectorAll('.brand-option');
        this.osOptions = document.querySelectorAll('.os-option');
        this.priceOptions = document.querySelectorAll('.price-option');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.filterOptions = document.querySelectorAll('.filter-options');
        
        this.selectedBrands = new Set();
        this.selectedOS = new Set();
        this.selectedPriceRange = null;
        
        // Temporary selections for Apply/Cancel functionality
        this.tempSelectedBrands = new Set();
        this.tempSelectedOS = new Set();
        this.tempSelectedPriceRange = null;
        
        // Pagination
        this.currentPage = 1;
        this.productsPerPage = 12;

        this.init(this.category);
    }

    async init(category = 'tablets') {
        await this.fetchTablets(category);
        this.addEventListeners();
        this.loadExistingAlerts();
    }

    async fetchTablets(category = 'tablets') {
        this.showLoadingState();
        try {
            // Construct URL with category parameter using new API endpoints
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${category}`;
            
            console.log('Fetching tablets from:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            console.log('API Response:', data);
            
            // Parse response - handle different response structures
            let productsData = data;
            if (data.body) {
                productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
            }
            
            // Extract products array from response
            const products = productsData.products || productsData.items || productsData;
            
            console.log('Extracted products:', products);
            
            this.allTablets = this.extractTablets(products);
            console.log('Processed tablets:', this.allTablets.length);
            this.displayTablets(this.allTablets);
        } catch (error) {
            console.error('Error fetching tablets:', error);
            this.showErrorState('Failed to load tablets. Please try again later.');
        }
    }

    extractTablets(data) {
        if (Array.isArray(data)) {
            return data;
        } else if (data.products && Array.isArray(data.products)) {
            return data.products;
        } else if (data.tablets && Array.isArray(data.tablets)) {
            return data.tablets;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    }

    addEventListeners() {
        // Custom Sort Dropdown functionality
        this.initSortDropdown();

        // Filter button toggles
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterType = e.currentTarget.dataset.filter;
                this.toggleFilterOptions(filterType);
            });
        });

        // Brand filter options
        this.brandOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const brand = e.currentTarget.dataset.brand;
                this.toggleBrandFilter(brand);
            });
        });

        // OS filter options
        this.osOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const os = e.currentTarget.dataset.os;
                this.toggleTempOSFilter(os);
            });
        });

        // Price range options
        this.priceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const priceRange = e.currentTarget.dataset.price;
                this.toggleTempPriceRangeFilter(priceRange);
            });
        });

        // Apply, Cancel, and Clear buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-apply')) {
                e.stopPropagation();
                const filterType = e.target.dataset.filter;
                this.applyFilter(filterType);
            } else if (e.target.classList.contains('btn-cancel')) {
                e.stopPropagation();
                const filterType = e.target.dataset.filter;
                this.cancelFilter(filterType);
            } else if (e.target.classList.contains('btn-clear')) {
                e.stopPropagation();
                const filterType = e.target.dataset.filter;
                this.clearFilter(filterType);
            } else if (e.target.classList.contains('filter-reset-btn')) {
                e.stopPropagation();
                this.clearAllFilters();
            } else if (e.target.classList.contains('page-nav')) {
                e.stopPropagation();
                const pageAction = e.target.dataset.page;
                if (pageAction === 'prev' && this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                } else if (pageAction === 'next' && this.currentPage < this.getTotalPages()) {
                    this.goToPage(this.currentPage + 1);
                }
            } else if (e.target.classList.contains('price-alert-bell') || e.target.closest('.price-alert-bell')) {
                e.preventDefault();
                e.stopPropagation();
                const bell = e.target.classList.contains('price-alert-bell') ? e.target : e.target.closest('.price-alert-bell');
                const productId = bell.dataset.productId;
                this.togglePriceAlert(productId, bell);
            } else if (e.target.classList.contains('btn-compare')) {
                e.preventDefault();
                e.stopPropagation();
                const productId = e.target.getAttribute('data-product-id');
                
                console.log('View button clicked for product:', productId);
                
                // Navigate to tablet-info.html with the product ID
                window.location.href = `tablet-info.html?id=${productId}`;
            } else if (e.target.classList.contains('btn-wishlist')) {
                e.preventDefault();
                e.stopPropagation();
                const productId = e.target.getAttribute('data-product-id');
                
                // Get product data
                const product = this.allTablets.find(tablet => (tablet.product_id || tablet.id) === productId);
                if (product && window.wishlistManager) {
                    window.wishlistManager.toggleWishlist(product);
                    // Update wishlist count badges
                    if (window.updateWishlistCount) {
                        window.updateWishlistCount();
                    }
                }
            }
        });
    }

    toggleFilterOptions(filterType) {
        // Get the target filter option panel
        const targetOption = document.getElementById(`${filterType}Options`);
        if (!targetOption) {
            console.warn(`Filter options panel not found: ${filterType}Options`);
            return;
        }

        // Check if the target is currently visible
        const isCurrentlyVisible = targetOption.style.display !== 'none' && 
                                   window.getComputedStyle(targetOption).display !== 'none';

        // Hide all filter options first
        this.filterOptions.forEach(option => {
            option.style.display = 'none';
        });

        // Remove active state from all filter buttons
        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });

        // Toggle the target filter option
        if (!isCurrentlyVisible) {
            targetOption.style.display = 'block';
            // Add active state to the clicked filter button
            const clickedButton = document.querySelector(`[data-filter="${filterType}"]`);
            if (clickedButton) {
                clickedButton.classList.add('filter-active');
            }
        } else {
            targetOption.style.display = 'none';
        }
    }

    toggleBrandFilter(brand) {
        if (this.tempSelectedBrands.has(brand)) {
            this.tempSelectedBrands.delete(brand);
        } else {
            this.tempSelectedBrands.add(brand);
        }
        
        // Update visual state
        const brandOption = document.querySelector(`[data-brand="${brand}"]`);
        if (brandOption) {
            brandOption.classList.toggle('active');
        }
    }

    toggleTempOSFilter(os) {
        if (this.tempSelectedOS.has(os)) {
            this.tempSelectedOS.delete(os);
        } else {
            this.tempSelectedOS.add(os);
        }
        
        // Update visual state
        const osOption = document.querySelector(`[data-os="${os}"]`);
        if (osOption) {
            osOption.classList.toggle('active');
        }
    }

    toggleTempPriceRangeFilter(priceRange) {
        // Only allow one price range selection at a time
        if (this.tempSelectedPriceRange === priceRange) {
            this.tempSelectedPriceRange = null;
        } else {
            this.tempSelectedPriceRange = priceRange;
        }
        
        // Update visual state - remove active from all, add to selected
        this.priceOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        if (this.tempSelectedPriceRange) {
            const selectedOption = document.querySelector(`[data-price="${this.tempSelectedPriceRange}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
        }
    }

    applyFilter(filterType) {
        // Commit temporary selections to actual selections
        if (filterType === 'brand') {
            this.selectedBrands = new Set(this.tempSelectedBrands);
        } else if (filterType === 'os') {
            this.selectedOS = new Set(this.tempSelectedOS);
        } else if (filterType === 'price') {
            this.selectedPriceRange = this.tempSelectedPriceRange;
        }

        // Hide filter options
        const targetOption = document.getElementById(`${filterType}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        // Remove active state from filter button
        const filterButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterButton) {
            filterButton.classList.remove('filter-active');
        }
        
        // Update filter button states
        this.updateFilterButtonStates();

        // Apply filters and sort (this will reset to page 1)
        this.applyFiltersAndSort();
    }

    cancelFilter(filterType) {
        // Revert temporary selections
        if (filterType === 'brand') {
            this.tempSelectedBrands = new Set(this.selectedBrands);
            // Update visual state
            this.brandOptions.forEach(option => {
                const brand = option.dataset.brand;
                if (this.tempSelectedBrands.has(brand)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else if (filterType === 'os') {
            this.tempSelectedOS = new Set(this.selectedOS);
            // Update visual state
            this.osOptions.forEach(option => {
                const os = option.dataset.os;
                if (this.tempSelectedOS.has(os)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else if (filterType === 'price') {
            this.tempSelectedPriceRange = this.selectedPriceRange;
            // Update visual state
            this.priceOptions.forEach(option => {
                option.classList.remove('active');
            });
            if (this.tempSelectedPriceRange) {
                const selectedOption = document.querySelector(`[data-price="${this.tempSelectedPriceRange}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('active');
                }
            }
        }

        // Hide filter options
        const targetOption = document.getElementById(`${filterType}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        // Remove active state from filter button
        const filterButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterButton) {
            filterButton.classList.remove('filter-active');
        }
    }

    clearFilter(filterType) {
        if (filterType === 'brand') {
            this.tempSelectedBrands.clear();
            this.brandOptions.forEach(option => {
                option.classList.remove('active');
            });
        } else if (filterType === 'os') {
            this.tempSelectedOS.clear();
            this.osOptions.forEach(option => {
                option.classList.remove('active');
            });
        } else if (filterType === 'price') {
            this.tempSelectedPriceRange = null;
            this.priceOptions.forEach(option => {
                option.classList.remove('active');
            });
        }
    }

    clearAllFilters() {
        // Clear all selections
        this.selectedBrands.clear();
        this.selectedOS.clear();
        this.selectedPriceRange = null;
        this.tempSelectedBrands.clear();
        this.tempSelectedOS.clear();
        this.tempSelectedPriceRange = null;

        // Update visual state
        this.brandOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.osOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.priceOptions.forEach(option => {
            option.classList.remove('active');
        });

        // Hide all filter options
        this.filterOptions.forEach(option => {
            option.style.display = 'none';
        });

        // Remove active state from all filter buttons
        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });

        // Hide reset button
        const resetBtn = document.getElementById('resetAllFilters');
        if (resetBtn) {
            resetBtn.style.display = 'none';
        }

        // Reset sort
        const sortSelect = document.getElementById('sortSelect');
        const sortDropdownText = document.getElementById('sortDropdownText');
        const sortItems = document.querySelectorAll('.custom-sort-dropdown-item');
        
        if (sortSelect) {
            sortSelect.value = 'relevance';
        }
        
        // Update dropdown text and active state
        if (sortDropdownText) {
            sortDropdownText.textContent = 'Relevance';
        }
        
        sortItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.value === 'relevance') {
                item.classList.add('active');
            }
        });

        // Apply filters and sort
        this.applyFiltersAndSort();
    }

    updateFilterButtonStates() {
        // Show/hide reset button based on active filters
        const resetBtn = document.getElementById('resetAllFilters');
        const hasActiveFilters = this.selectedBrands.size > 0 || this.selectedOS.size > 0 || this.selectedPriceRange !== null;
        
        if (resetBtn) {
            resetBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
        }

        // Update filter button active states
        this.filterButtons.forEach(btn => {
            const filterType = btn.dataset.filter;
            if (filterType === 'brand' && this.selectedBrands.size > 0) {
                btn.classList.add('filter-active');
            } else if (filterType === 'os' && this.selectedOS.size > 0) {
                btn.classList.add('filter-active');
            } else if (filterType === 'price' && this.selectedPriceRange !== null) {
                btn.classList.add('filter-active');
            }
        });
    }

    applyFiltersAndSort() {
        let tempTablets = [...this.allTablets];

        // Filter by Brand
        if (this.selectedBrands.size > 0) {
            tempTablets = tempTablets.filter(tablet => {
                const tabletBrand = (tablet.brand || tablet.manufacturer || '').toLowerCase();
                return Array.from(this.selectedBrands).some(brand => 
                    tabletBrand.includes(brand.toLowerCase())
                );
            });
        }

        // Filter by OS
        if (this.selectedOS.size > 0) {
            tempTablets = tempTablets.filter(tablet => {
                // Check in specs or description
                const osText = (
                    (tablet.specs?.Os?.['Operating System'] || '') +
                    ' ' +
                    (tablet.description || '') +
                    ' ' +
                    (tablet.model || '') +
                    ' ' +
                    (tablet.title || '')
                ).toLowerCase();
                
                return Array.from(this.selectedOS).some(os => {
                    if (os === 'harmony') {
                        return osText.toLowerCase().includes('harmony') || osText.toLowerCase().includes('harmonyos');
                    } else if (os === 'android') {
                        return osText.toLowerCase().includes('android');
                    } else if (os === 'ios') {
                        return osText.toLowerCase().includes('ios') || osText.toLowerCase().includes('ipados');
                    } else if (os === 'windows') {
                        return osText.toLowerCase().includes('windows');
                    }
                    return false;
                });
            });
        }

        // Filter by Price Range
        if (this.selectedPriceRange) {
            const [minPrice, maxPrice] = this.selectedPriceRange.split('-').map(Number);
            tempTablets = tempTablets.filter(tablet => {
                const tabletPrice = this.getLowestPrice(tablet);
                if (maxPrice === 5000) {
                    return tabletPrice < maxPrice; // Under R5,000
                } else if (minPrice === 30000) {
                    return tabletPrice >= minPrice; // R30,000+
                } else {
                    return tabletPrice >= minPrice && tabletPrice <= maxPrice;
                }
            });
        }

        // Sort
        const sortBy = this.sortSelect ? this.sortSelect.value : 'relevance';
        tempTablets.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.model || a.title || a.name || '').toLowerCase();
                const nameB = (b.model || b.title || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'price-low') {
                return this.getLowestPrice(a) - this.getLowestPrice(b);
            } else if (sortBy === 'price-high') {
                return this.getLowestPrice(b) - this.getLowestPrice(a);
            } else if (sortBy === 'relevance') {
                // Default relevance sorting (by brand, then by price)
                const brandA = (a.brand || a.manufacturer || '').toLowerCase();
                const brandB = (b.brand || b.manufacturer || '').toLowerCase();
                if (brandA !== brandB) {
                    return brandA.localeCompare(brandB);
                }
                return this.getLowestPrice(a) - this.getLowestPrice(b);
            }
            return 0;
        });

        this.filteredTablets = tempTablets;
        this.currentPage = 1; // Reset to first page when filters change
        this.displayTablets(this.filteredTablets);
        this.updateResultsCount(tempTablets.length);
        this.updateFilterButtonStates();
        
        return tempTablets;
    }

    updateResultsCount(count) {
        const resultsInfo = document.getElementById('filterResultsInfo');
        const resultsCount = document.getElementById('resultsCount');
        
        if (resultsInfo && resultsCount) {
            if (count !== this.allTablets.length && count > 0) {
                resultsCount.textContent = count;
                resultsInfo.style.display = 'block';
            } else {
                resultsInfo.style.display = 'none';
            }
        }
    }

    getLowestPrice(tablet) {
        if (!tablet.offers || tablet.offers.length === 0) {
            // Try alternative price fields
            if (tablet.price) return parseFloat(tablet.price) || 0;
            if (tablet.lowestPrice) return parseFloat(tablet.lowestPrice) || 0;
            return 0;
        }
        const prices = tablet.offers.map(offer => parseFloat(offer.price) || 0).filter(price => price > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
    }

    togglePriceAlert(productId, bellElement) {
        // Get the product data
        const product = this.allTablets.find(tablet => (tablet.product_id || tablet.id) === productId);
        
        if (!product) {
            console.error('Product not found for ID:', productId);
            return;
        }

        // Show the price alert modal using the global modal instance
        if (window.priceAlertModal) {
            window.priceAlertModal.show(product);
        } else {
            console.error('Price alert modal not initialized');
        }
    }

    savePriceAlert(productId, product) {
        // Save price alert to localStorage (you can modify this to send to server)
        const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
        const existingAlert = alerts.find(alert => alert.productId === productId);
        
        if (!existingAlert) {
            alerts.push({
                productId: productId,
                productName: product?.model || product?.title || product?.name || 'Unknown',
                currentPrice: this.getLowestPrice(product),
                dateAdded: new Date().toISOString()
            });
            localStorage.setItem('priceAlerts', JSON.stringify(alerts));
        }
    }

    removePriceAlert(productId) {
        // Remove price alert from localStorage
        const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
        const filteredAlerts = alerts.filter(alert => alert.productId !== productId);
        localStorage.setItem('priceAlerts', JSON.stringify(filteredAlerts));
    }

    async loadExistingAlerts() {
        // Load existing price alerts from server and update bell icons
        try {
            const API_BASE_URL = 'https://acc.comparehubprices.site/price-alerts/alerts';
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.alerts) {
                    data.alerts.forEach(alert => {
                        if (alert.status === 'active') {
                            this.updateBellIconState(alert.productId, true);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading existing alerts:', error);
        }
    }

    updateBellIconState(productId, isActive) {
        const bellElement = document.querySelector(`[data-product-id="${productId}"].price-alert-bell`);
        if (bellElement) {
            if (isActive) {
                bellElement.classList.add('active');
                bellElement.title = 'Price alert active - Click to remove';
            } else {
                bellElement.classList.remove('active');
                bellElement.title = 'Set Price Alert';
            }
        }
    }

    displayTablets(tablets) {
        if (!this.tabletsContainer) {
            console.error('Tablets container not found');
            return;
        }

        if (tablets.length === 0) {
            this.showNoResultsState();
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(tablets.length / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentPageTablets = tablets.slice(startIndex, endIndex);

        // Display current page products
        this.tabletsContainer.innerHTML = currentPageTablets.map(tablet => this.createTabletCard(tablet)).join('');

        // Add pagination controls
        this.addPaginationControls(totalPages, tablets.length);
        
        // Update bell icons for existing price alerts
        this.loadExistingAlerts();
    }

    addPaginationControls(totalPages, totalProducts) {
        // Remove any existing pagination first
        this.removeExistingPagination();

        if (totalPages <= 1) return;

        const paginationHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing ${(this.currentPage - 1) * this.productsPerPage + 1} to ${Math.min(this.currentPage * this.productsPerPage, totalProducts)} of ${totalProducts} products
                </div>
                <div class="pagination-controls">
                    <button class="page-nav" data-page="prev" aria-label="Previous page" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>
                    <div class="pagination-numbers">
                        ${this.generatePaginationNumbers(totalPages)}
                    </div>
                    <button class="page-nav" data-page="next" aria-label="Next page" ${this.currentPage === totalPages ? 'disabled' : ''}>»</button>
                </div>
            </div>
        `;

        this.tabletsContainer.insertAdjacentHTML('afterend', paginationHTML);
    }

    removeExistingPagination() {
        const existingPagination = document.querySelector('.pagination-container');
        if (existingPagination) {
            existingPagination.remove();
        }
    }

    generatePaginationNumbers(totalPages) {
        const numbers = [];
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            numbers.push(`
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="tabletsPage.goToPage(${i})">${i}</button>
            `);
        }

        return numbers.join('');
    }

    goToPage(page) {
        const filteredData = this.filteredTablets && this.filteredTablets.length > 0 
            ? this.filteredTablets 
            : this.allTablets;
        const totalPages = Math.ceil(filteredData.length / this.productsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayTablets(filteredData);
        
        // Scroll to top of products
        if (this.tabletsContainer) {
            this.tabletsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    getTotalPages() {
        const filteredData = this.filteredTablets && this.filteredTablets.length > 0 
            ? this.filteredTablets 
            : this.allTablets;
        return Math.ceil(filteredData.length / this.productsPerPage);
    }

    createTabletCard(tablet) {
        const lowestPrice = this.getLowestPrice(tablet);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        const imageUrl = tablet.imageUrl || tablet.image || tablet.img || 'https://via.placeholder.com/150?text=No+Image';
        const productName = tablet.model || tablet.title || tablet.name || 'Unknown Tablet';
        const brandName = tablet.brand || tablet.manufacturer || 'Unknown Brand';

        // Extract specs
        const specs = [];
        if (tablet.specs?.Performance?.Ram) specs.push(tablet.specs.Performance.Ram);
        if (tablet.specs?.Performance?.Storage) specs.push(tablet.specs.Performance.Storage);
        if (tablet.specs?.Os?.['Operating System']) specs.push(tablet.specs.Os['Operating System']);

        const specsHtml = specs.length > 0 ? `<div class="product-specs"><span>${specs.join(' • ')}</span></div>` : '';

        // Get retailer count
        const retailerCount = tablet.offers?.length || 0;

        return `
            <div class="tablet-card">
                <a href="tablet-info.html?id=${tablet.product_id || tablet.id}" class="card-link">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${productName}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        <button class="price-alert-bell" data-product-id="${tablet.product_id || tablet.id}" title="Set Price Alert">
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
                </a>
                <div class="card-actions">
                    <button class="btn-compare" data-product-id="${tablet.product_id || tablet.id}">View</button>
                    <button class="btn-wishlist" data-product-id="${tablet.product_id || tablet.id}">Add to Wishlist</button>
                </div>
            </div>
        `;
    }

    showLoadingState() {
        if (!this.tabletsContainer) return;
        this.tabletsContainer.innerHTML = `
            <div class="loading-state">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading tablets...</h4>
                <p>Please wait while we fetch the latest deals</p>
            </div>
        `;
    }

    showNoResultsState() {
        if (!this.tabletsContainer) return;
        this.tabletsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-tablet-alt fa-3x mb-3"></i>
                <h4>No tablets found</h4>
                <p>Try adjusting your filters or clearing them all.</p>
            </div>
        `;
    }

    showErrorState(message) {
        if (!this.tabletsContainer) return;
        this.tabletsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    viewProductDetails(productId) {
        // Navigate to tablet-info.html with the product ID
        window.location.href = `tablet-info.html?id=${productId}`;
    }

    initSortDropdown() {
        const sortDropdown = document.getElementById('sortDropdown');
        const sortDropdownBtn = document.getElementById('sortDropdownBtn');
        const sortDropdownMenu = document.getElementById('sortDropdownMenu');
        const sortDropdownText = document.getElementById('sortDropdownText');
        const sortSelect = document.getElementById('sortSelect');
        const sortItems = document.querySelectorAll('.custom-sort-dropdown-item');

        if (!sortDropdown || !sortDropdownBtn || !sortDropdownMenu || !sortSelect) {
            console.warn('Sort dropdown elements not found');
            return;
        }

        // Toggle dropdown on button click
        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sortDropdown.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll('.custom-sort-dropdown').forEach(dd => {
                if (dd.id !== 'sortDropdown') {
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

        // Handle item selection
        sortItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.dataset.value;
                const text = item.textContent;

                // Update hidden input
                sortSelect.value = value;

                // Update button text
                if (sortDropdownText) {
                    sortDropdownText.textContent = text;
                }

                // Update active state
                sortItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Close dropdown
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';

                // Apply filters and sort
                this.applyFiltersAndSort();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!sortDropdown.contains(e.target)) {
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';
            }
        });

        // Set initial active item
        const initialValue = sortSelect.value || 'relevance';
        sortItems.forEach(item => {
            if (item.dataset.value === initialValue) {
                item.classList.add('active');
                if (sortDropdownText) {
                    sortDropdownText.textContent = item.textContent;
                }
            }
        });
    }
}

// Initialize when DOM is loaded
let tabletsPage;
document.addEventListener('DOMContentLoaded', () => {
    // Get category from URL parameters or use default
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'tablets';
    
    tabletsPage = new TabletsPage(category);
});
