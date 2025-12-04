// Gaming Page Functionality
// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://acc.comparehubprices.site/data',
    LIST_PRODUCTS_ENDPOINT: '/products',
};

class GamingPage {
    constructor() {
        // Get category from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.category = urlParams.get('category') || 'consoles';
        
        // Map category names from URL to internal category names
        this.categoryMap = {
            'consoles': 'consoles',
            'gaming-consoles': 'consoles',
            'laptop-gaming': 'gaming-laptops',
            'gaming-laptops': 'gaming-laptops',
            'gaming-monitors': 'gaming-monitors',
            'monitors': 'gaming-monitors'
        };
        
        // Map to API category names
        this.apiCategoryMap = {
            'consoles': 'gaming-consoles',
            'gaming-laptops': 'gaming-laptops',
            'gaming-monitors': 'gaming-monitors'
        };
        
        // Normalize category
        this.normalizedCategory = this.categoryMap[this.category] || 'consoles';
        
        // Initialize all category managers
        this.consolesManager = null;
        this.laptopsManager = null;
        this.monitorsManager = null;
        
        this.init();
    }
    
    init() {
        // Show only the selected section
        this.showSelectedSection();
        
        // Initialize the appropriate category manager
        if (this.normalizedCategory === 'consoles') {
            this.consolesManager = new GamingCategoryManager('consoles', 'gaming-consoles');
        } else if (this.normalizedCategory === 'gaming-laptops') {
            this.laptopsManager = new GamingCategoryManager('gaming-laptops', 'gaming-laptops');
        } else if (this.normalizedCategory === 'gaming-monitors') {
            this.monitorsManager = new GamingCategoryManager('gaming-monitors', 'gaming-monitors');
        }
    }
    
    showSelectedSection() {
        // Hide all sections first
        const consolesSection = document.getElementById('consolesSection');
        const laptopsSection = document.getElementById('laptopsSection');
        const monitorsSection = document.getElementById('monitorsSection');
        
        if (consolesSection) consolesSection.style.display = 'none';
        if (laptopsSection) laptopsSection.style.display = 'none';
        if (monitorsSection) monitorsSection.style.display = 'none';
        
        // Show the selected section
        if (this.normalizedCategory === 'consoles' && consolesSection) {
            consolesSection.style.display = 'block';
        } else if (this.normalizedCategory === 'gaming-laptops' && laptopsSection) {
            laptopsSection.style.display = 'block';
        } else if (this.normalizedCategory === 'gaming-monitors' && monitorsSection) {
            monitorsSection.style.display = 'block';
        }
    }
}

class GamingCategoryManager {
    constructor(category, apiCategory) {
        this.category = category;
        this.apiCategory = apiCategory;
        
        // Map category to ID prefix
        this.categoryIdPrefix = {
            'consoles': 'consoles',
            'gaming-laptops': 'laptops',
            'gaming-monitors': 'monitors'
        };
        this.idPrefix = this.categoryIdPrefix[category] || category;
        this.allProducts = [];
        this.filteredProducts = [];
        this.productsContainer = document.querySelector(`.gaming-content[data-category="${category}"]`);
        this.sortSelect = document.getElementById(`${category}SortSelect`);
        
        // Get filter elements specific to this category
        this.brandOptions = document.querySelectorAll(`.brand-option[data-category="${category}"]`);
        this.processorOptions = document.querySelectorAll(`.processor-option[data-category="${category}"]`);
        this.screensizeOptions = document.querySelectorAll(`.screensize-option[data-category="${category}"]`);
        this.priceOptions = document.querySelectorAll(`.price-option[data-category="${category}"]`);
        this.filterButtons = document.querySelectorAll(`.filter-btn[data-category="${category}"]`);
        this.filterOptions = document.querySelectorAll(`.filter-options`);
        
        // Selected filters
        this.selectedBrands = new Set();
        this.selectedProcessors = new Set();
        this.selectedScreenSizes = new Set();
        this.selectedPriceRange = null;
        
        // Temporary selections for Apply/Cancel functionality
        this.tempSelectedBrands = new Set();
        this.tempSelectedProcessors = new Set();
        this.tempSelectedScreenSizes = new Set();
        this.tempSelectedPriceRange = null;
        
        // Pagination
        this.currentPage = 1;
        this.productsPerPage = 12;
        
        this.init();
    }
    
    async init() {
        await this.fetchProducts();
        this.addEventListeners();
        this.loadExistingAlerts();
    }
    
    async fetchProducts() {
        this.showLoadingState();
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${this.apiCategory}`;
            
            console.log(`Fetching ${this.category} from:`, url);
            
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
            
            this.allProducts = this.extractProducts(products);
            console.log(`Processed ${this.category}:`, this.allProducts.length);
            this.displayProducts(this.allProducts);
        } catch (error) {
            console.error(`Error fetching ${this.category}:`, error);
            this.showErrorState(`Failed to load ${this.category}. Please try again later.`);
        }
    }
    
    extractProducts(data) {
        if (Array.isArray(data)) {
            return data;
        } else if (data.products && Array.isArray(data.products)) {
            return data.products;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    }
    
    addEventListeners() {
        // Custom Sort Dropdown functionality
        this.initSortDropdown();
        
        // Filter button toggles (only for this category)
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
        
        // Processor filter options (for gaming laptops)
        this.processorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const processor = e.currentTarget.dataset.processor;
                this.toggleTempProcessorFilter(processor);
            });
        });
        
        // Screen size filter options (for gaming monitors)
        this.screensizeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const screensize = e.currentTarget.dataset.screensize;
                this.toggleTempScreenSizeFilter(screensize);
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
            const category = e.target.dataset.category || e.target.closest('[data-category]')?.dataset.category;
            if (category !== this.category) return;
            
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
            } else if (e.target.classList.contains('pagination-number')) {
                e.stopPropagation();
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    this.goToPage(page);
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
                // Navigate to gaming info page
                window.location.href = `gaming-info.html?id=${productId}&category=${this.apiCategory}`;
            } else if (e.target.classList.contains('btn-wishlist')) {
                e.preventDefault();
                e.stopPropagation();
                const productId = e.target.getAttribute('data-product-id');
                const product = this.allProducts.find(p => (p.product_id || p.id) === productId);
                if (product && window.wishlistManager) {
                    window.wishlistManager.toggleWishlist(product);
                    if (window.updateWishlistCount) {
                        window.updateWishlistCount();
                    }
                }
            }
        });
    }
    
    toggleFilterOptions(filterType) {
        const targetOption = document.getElementById(`${this.idPrefix}${filterType.charAt(0).toUpperCase() + filterType.slice(1)}Options`);
        if (!targetOption) {
            console.warn(`Filter options panel not found: ${this.idPrefix}${filterType.charAt(0).toUpperCase() + filterType.slice(1)}Options`);
            return;
        }
        
        const isCurrentlyVisible = targetOption.style.display !== 'none' && 
                                   window.getComputedStyle(targetOption).display !== 'none';
        
        // Hide all filter options for this category first
        const categoryFilterOptions = document.querySelectorAll(`.filter-options`);
        categoryFilterOptions.forEach(option => {
            if (option.closest(`[data-category="${this.category}"]`)) {
                option.style.display = 'none';
            }
        });
        
        // Remove active state from all filter buttons for this category
        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });
        
        // Toggle the target filter option
        if (!isCurrentlyVisible) {
            targetOption.style.display = 'block';
            const clickedButton = document.querySelector(`[data-filter="${filterType}"][data-category="${this.category}"]`);
            if (clickedButton) {
                clickedButton.classList.add('filter-active');
            }
        } else {
            targetOption.style.display = 'none';
        }
    }
    
    toggleBrandFilter(brand) {
        if (brand === 'all') {
            this.tempSelectedBrands.clear();
            this.brandOptions.forEach(option => {
                option.classList.remove('active');
            });
            const allOption = document.querySelector(`[data-brand="all"][data-category="${this.category}"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            const allOption = document.querySelector(`[data-brand="all"][data-category="${this.category}"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            if (this.tempSelectedBrands.has(brand)) {
                this.tempSelectedBrands.delete(brand);
            } else {
                this.tempSelectedBrands.add(brand);
            }
            
            const brandOption = document.querySelector(`[data-brand="${brand}"][data-category="${this.category}"]`);
            if (brandOption) {
                brandOption.classList.toggle('active');
            }
        }
    }
    
    toggleTempProcessorFilter(processor) {
        if (processor === 'all') {
            this.tempSelectedProcessors.clear();
            this.processorOptions.forEach(option => {
                option.classList.remove('active');
            });
            const allOption = document.querySelector(`[data-processor="all"][data-category="${this.category}"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            const allOption = document.querySelector(`[data-processor="all"][data-category="${this.category}"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            if (this.tempSelectedProcessors.has(processor)) {
                this.tempSelectedProcessors.delete(processor);
            } else {
                this.tempSelectedProcessors.add(processor);
            }
            
            const processorOption = document.querySelector(`[data-processor="${processor}"][data-category="${this.category}"]`);
            if (processorOption) {
                processorOption.classList.toggle('active');
            }
        }
    }
    
    toggleTempScreenSizeFilter(screensize) {
        if (screensize === 'all') {
            this.tempSelectedScreenSizes.clear();
            this.screensizeOptions.forEach(option => {
                option.classList.remove('active');
            });
            const allOption = document.querySelector(`[data-screensize="all"][data-category="${this.category}"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            const allOption = document.querySelector(`[data-screensize="all"][data-category="${this.category}"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            if (this.tempSelectedScreenSizes.has(screensize)) {
                this.tempSelectedScreenSizes.delete(screensize);
            } else {
                this.tempSelectedScreenSizes.add(screensize);
            }
            
            const screensizeOption = document.querySelector(`[data-screensize="${screensize}"][data-category="${this.category}"]`);
            if (screensizeOption) {
                screensizeOption.classList.toggle('active');
            }
        }
    }
    
    toggleTempPriceRangeFilter(priceRange) {
        if (this.tempSelectedPriceRange === priceRange) {
            this.tempSelectedPriceRange = null;
        } else {
            this.tempSelectedPriceRange = priceRange;
        }
        
        this.priceOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        if (this.tempSelectedPriceRange) {
            const selectedOption = document.querySelector(`[data-price="${this.tempSelectedPriceRange}"][data-category="${this.category}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
        }
    }
    
    applyFilter(filterType) {
        if (filterType === 'brand') {
            this.selectedBrands = new Set(this.tempSelectedBrands);
        } else if (filterType === 'processor') {
            this.selectedProcessors = new Set(this.tempSelectedProcessors);
        } else if (filterType === 'screensize') {
            this.selectedScreenSizes = new Set(this.tempSelectedScreenSizes);
        } else if (filterType === 'price') {
            this.selectedPriceRange = this.tempSelectedPriceRange;
        }
        
        const targetOption = document.getElementById(`${this.category}${filterType.charAt(0).toUpperCase() + filterType.slice(1)}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        const filterButton = document.querySelector(`[data-filter="${filterType}"][data-category="${this.category}"]`);
        if (filterButton) {
            filterButton.classList.remove('filter-active');
        }
        
        this.updateFilterButtonStates();
        this.applyFiltersAndSort();
    }
    
    cancelFilter(filterType) {
        if (filterType === 'brand') {
            this.tempSelectedBrands = new Set(this.selectedBrands);
            this.brandOptions.forEach(option => {
                const brand = option.dataset.brand;
                if (this.tempSelectedBrands.has(brand)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else if (filterType === 'processor') {
            this.tempSelectedProcessors = new Set(this.selectedProcessors);
            this.processorOptions.forEach(option => {
                const processor = option.dataset.processor;
                if (this.tempSelectedProcessors.has(processor)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else if (filterType === 'screensize') {
            this.tempSelectedScreenSizes = new Set(this.selectedScreenSizes);
            this.screensizeOptions.forEach(option => {
                const screensize = option.dataset.screensize;
                if (this.tempSelectedScreenSizes.has(screensize)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        } else if (filterType === 'price') {
            this.tempSelectedPriceRange = this.selectedPriceRange;
            this.priceOptions.forEach(option => {
                option.classList.remove('active');
            });
            if (this.tempSelectedPriceRange) {
                const selectedOption = document.querySelector(`[data-price="${this.tempSelectedPriceRange}"][data-category="${this.category}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('active');
                }
            }
        }
        
        const targetOption = document.getElementById(`${this.idPrefix}${filterType.charAt(0).toUpperCase() + filterType.slice(1)}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        const filterButton = document.querySelector(`[data-filter="${filterType}"][data-category="${this.category}"]`);
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
        } else if (filterType === 'processor') {
            this.tempSelectedProcessors.clear();
            this.processorOptions.forEach(option => {
                option.classList.remove('active');
            });
        } else if (filterType === 'screensize') {
            this.tempSelectedScreenSizes.clear();
            this.screensizeOptions.forEach(option => {
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
        this.selectedBrands.clear();
        this.selectedProcessors.clear();
        this.selectedScreenSizes.clear();
        this.selectedPriceRange = null;
        this.tempSelectedBrands.clear();
        this.tempSelectedProcessors.clear();
        this.tempSelectedScreenSizes.clear();
        this.tempSelectedPriceRange = null;
        
        this.brandOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.processorOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.screensizeOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.priceOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        const categoryFilterOptions = document.querySelectorAll(`.filter-options`);
        categoryFilterOptions.forEach(option => {
            if (option.closest(`[data-category="${this.category}"]`)) {
                option.style.display = 'none';
            }
        });
        
        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });
        
        const resetBtn = document.getElementById(`${this.category}ResetAllFilters`);
        if (resetBtn) {
            resetBtn.style.display = 'none';
        }
        
        const sortSelect = document.getElementById(`${this.idPrefix}SortSelect`);
        const sortDropdownText = document.getElementById(`${this.idPrefix}SortDropdownText`);
        const sortItems = document.querySelectorAll(`#${this.idPrefix}SortDropdown .custom-sort-dropdown-item`);
        
        if (sortSelect) {
            sortSelect.value = 'relevance';
        }
        
        if (sortDropdownText) {
            sortDropdownText.textContent = 'Relevance';
        }
        
        sortItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.value === 'relevance') {
                item.classList.add('active');
            }
        });
        
        this.applyFiltersAndSort();
    }
    
    updateFilterButtonStates() {
        const resetBtn = document.getElementById(`${this.idPrefix}ResetAllFilters`);
        const hasBrandFilter = this.selectedBrands.size > 0 && !this.selectedBrands.has('all');
        const hasProcessorFilter = this.selectedProcessors.size > 0 && !this.selectedProcessors.has('all');
        const hasScreenSizeFilter = this.selectedScreenSizes.size > 0 && !this.selectedScreenSizes.has('all');
        const hasActiveFilters = hasBrandFilter || hasProcessorFilter || hasScreenSizeFilter || this.selectedPriceRange !== null;
        
        if (resetBtn) {
            resetBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
        }
        
        this.filterButtons.forEach(btn => {
            const filterType = btn.dataset.filter;
            if (filterType === 'brand' && hasBrandFilter) {
                btn.classList.add('filter-active');
            } else if (filterType === 'processor' && hasProcessorFilter) {
                btn.classList.add('filter-active');
            } else if (filterType === 'screensize' && hasScreenSizeFilter) {
                btn.classList.add('filter-active');
            } else if (filterType === 'price' && this.selectedPriceRange !== null) {
                btn.classList.add('filter-active');
            }
        });
    }
    
    applyFiltersAndSort() {
        let tempProducts = [...this.allProducts];
        
        // Filter by Brand
        if (this.selectedBrands.size > 0 && !this.selectedBrands.has('all')) {
            tempProducts = tempProducts.filter(product => {
                const productBrand = (product.brand || product.manufacturer || '').toLowerCase();
                return Array.from(this.selectedBrands).some(brand => {
                    if (brand === 'all') return false;
                    return productBrand.includes(brand.toLowerCase());
                });
            });
        }
        
        // Filter by Processor (for gaming laptops)
        if (this.selectedProcessors.size > 0 && !this.selectedProcessors.has('all')) {
            tempProducts = tempProducts.filter(product => {
                const processorText = (
                    (product.specs?.Performance?.Processor || '') +
                    ' ' +
                    (product.specs?.Processor || '') +
                    ' ' +
                    (product.description || '') +
                    ' ' +
                    (product.model || '') +
                    ' ' +
                    (product.title || '')
                ).toLowerCase();
                
                return Array.from(this.selectedProcessors).some(processor => {
                    if (processor === 'all') return false;
                    const normalizedProcessor = processor.replace(/-/g, ' ').replace(/™/g, '').toLowerCase();
                    return processorText.includes(normalizedProcessor);
                });
            });
        }
        
        // Filter by Screen Size (for gaming monitors)
        if (this.selectedScreenSizes.size > 0 && !this.selectedScreenSizes.has('all')) {
            tempProducts = tempProducts.filter(product => {
                const screenSizeText = (
                    (product.specs?.Display?.Size || '') +
                    ' ' +
                    (product.specs?.Display?.['Screen Size'] || '') +
                    ' ' +
                    (product.specs?.['Screen Size'] || '') +
                    ' ' +
                    (product.description || '') +
                    ' ' +
                    (product.model || '') +
                    ' ' +
                    (product.title || '')
                ).toLowerCase();
                
                return Array.from(this.selectedScreenSizes).some(screensize => {
                    if (screensize === 'all') return false;
                    const normalizedSize = screensize.replace(/-/g, ' ').toLowerCase();
                    return screenSizeText.includes(normalizedSize) || 
                           screenSizeText.includes(screensize.replace('-inch', '').toLowerCase());
                });
            });
        }
        
        // Filter by Price Range
        if (this.selectedPriceRange) {
            const [minPrice, maxPrice] = this.selectedPriceRange.split('-').map(Number);
            tempProducts = tempProducts.filter(product => {
                const productPrice = this.getLowestPrice(product);
                if (maxPrice === 5000) {
                    return productPrice < maxPrice;
                } else if (minPrice === 50000) {
                    return productPrice >= minPrice;
                } else {
                    return productPrice >= minPrice && productPrice <= maxPrice;
                }
            });
        }
        
        // Sort
        const sortBy = this.sortSelect ? this.sortSelect.value : 'relevance';
        tempProducts.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.model || a.title || a.name || '').toLowerCase();
                const nameB = (b.model || b.title || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'price-low') {
                return this.getLowestPrice(a) - this.getLowestPrice(b);
            } else if (sortBy === 'price-high') {
                return this.getLowestPrice(b) - this.getLowestPrice(a);
            } else if (sortBy === 'relevance') {
                const brandA = (a.brand || a.manufacturer || '').toLowerCase();
                const brandB = (b.brand || b.manufacturer || '').toLowerCase();
                if (brandA !== brandB) {
                    return brandA.localeCompare(brandB);
                }
                return this.getLowestPrice(a) - this.getLowestPrice(b);
            }
            return 0;
        });
        
        this.filteredProducts = tempProducts;
        this.currentPage = 1;
        this.displayProducts(this.filteredProducts);
        this.updateResultsCount(tempProducts.length);
        this.updateFilterButtonStates();
        
        return tempProducts;
    }
    
    updateResultsCount(count) {
        const resultsInfo = document.getElementById(`${this.idPrefix}FilterResultsInfo`);
        const resultsCount = document.getElementById(`${this.idPrefix}ResultsCount`);
        
        if (resultsInfo && resultsCount) {
            if (count !== this.allProducts.length && count > 0) {
                resultsCount.textContent = count;
                resultsInfo.style.display = 'block';
            } else {
                resultsInfo.style.display = 'none';
            }
        }
    }
    
    getLowestPrice(product) {
        if (!product.offers || product.offers.length === 0) {
            if (product.price) return parseFloat(product.price) || 0;
            if (product.lowestPrice) return parseFloat(product.lowestPrice) || 0;
            return 0;
        }
        const prices = product.offers.map(offer => parseFloat(offer.price) || 0).filter(price => price > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
    }
    
    togglePriceAlert(productId, bellElement) {
        const product = this.allProducts.find(p => (p.product_id || p.id) === productId);
        
        if (!product) {
            console.error('Product not found for ID:', productId);
            return;
        }
        
        if (window.priceAlertModal) {
            window.priceAlertModal.show(product);
        } else {
            console.error('Price alert modal not initialized');
        }
    }
    
    async loadExistingAlerts() {
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
            if (error.name !== 'TypeError' || !error.message.includes('Failed to fetch')) {
                console.error('Error loading existing alerts:', error);
            }
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
    
    displayProducts(products) {
        if (!this.productsContainer) {
            console.error('Products container not found');
            return;
        }
        
        if (products.length === 0) {
            this.showNoResultsState();
            return;
        }
        
        const totalPages = Math.ceil(products.length / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentPageProducts = products.slice(startIndex, endIndex);
        
        this.productsContainer.innerHTML = currentPageProducts.map(product => this.createProductCard(product)).join('');
        
        this.addPaginationControls(totalPages, products.length);
        this.loadExistingAlerts();
    }
    
    addPaginationControls(totalPages, totalProducts) {
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
        
        this.productsContainer.insertAdjacentHTML('afterend', paginationHTML);
    }
    
    removeExistingPagination() {
        const existingPagination = this.productsContainer?.nextElementSibling;
        if (existingPagination && existingPagination.classList.contains('pagination-container')) {
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
        
        const managerRef = this;
        for (let i = startPage; i <= endPage; i++) {
            numbers.push(`
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `);
        }
        
        // Add click handlers after creating buttons
        setTimeout(() => {
            const paginationNumbers = this.productsContainer?.parentElement?.querySelectorAll('.pagination-number');
            if (paginationNumbers) {
                paginationNumbers.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const page = parseInt(btn.dataset.page);
                        managerRef.goToPage(page);
                    });
                });
            }
        }, 0);
        
        return numbers.join('');
    }
    
    goToPage(page) {
        const filteredData = this.filteredProducts && this.filteredProducts.length > 0 
            ? this.filteredProducts 
            : this.allProducts;
        const totalPages = Math.ceil(filteredData.length / this.productsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayProducts(filteredData);
        
        if (this.productsContainer) {
            this.productsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    getTotalPages() {
        const filteredData = this.filteredProducts && this.filteredProducts.length > 0 
            ? this.filteredProducts 
            : this.allProducts;
        return Math.ceil(filteredData.length / this.productsPerPage);
    }
    
    createProductCard(product) {
        const lowestPrice = this.getLowestPrice(product);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        const imageUrl = product.imageUrl || product.image || product.img || 'https://via.placeholder.com/150?text=No+Image';
        const productName = product.model || product.title || product.name || 'Unknown Product';
        const brandName = product.brand || product.manufacturer || 'Unknown Brand';
        
        const specs = [];
        if (product.specs?.Performance?.Ram) specs.push(product.specs.Performance.Ram);
        if (product.specs?.Performance?.Storage) specs.push(product.specs.Performance.Storage);
        if (product.specs?.Os?.['Operating System']) specs.push(product.specs.Os['Operating System']);
        
        const specsHtml = specs.length > 0 ? `<div class="product-specs"><span>${specs.join(' • ')}</span></div>` : '';
        
        const retailerCount = product.offers?.length || 0;
        
        return `
            <div class="gaming-card">
                <a href="gaming-info.html?id=${product.product_id || product.id}&category=${this.apiCategory}" class="card-link">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${productName}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        <button class="price-alert-bell" data-product-id="${product.product_id || product.id}" title="Set Price Alert">
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
                    <button class="btn-compare" data-product-id="${product.product_id || product.id}">View</button>
                    <button class="btn-wishlist" data-product-id="${product.product_id || product.id}">Add to Wishlist</button>
                </div>
            </div>
        `;
    }
    
    showLoadingState() {
        if (!this.productsContainer) return;
        this.productsContainer.innerHTML = `
            <div class="loading-state">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading ${this.category}...</h4>
                <p>Please wait while we fetch the latest deals</p>
            </div>
        `;
    }
    
    showNoResultsState() {
        if (!this.productsContainer) return;
        this.productsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-gamepad fa-3x mb-3"></i>
                <h4>No ${this.category} found</h4>
                <p>Try adjusting your filters or clearing them all.</p>
            </div>
        `;
    }
    
    showErrorState(message) {
        if (!this.productsContainer) return;
        this.productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
    
    initSortDropdown() {
        const sortDropdown = document.getElementById(`${this.idPrefix}SortDropdown`);
        const sortDropdownBtn = document.getElementById(`${this.idPrefix}SortDropdownBtn`);
        const sortDropdownMenu = document.getElementById(`${this.idPrefix}SortDropdownMenu`);
        const sortDropdownText = document.getElementById(`${this.idPrefix}SortDropdownText`);
        const sortSelect = document.getElementById(`${this.idPrefix}SortSelect`);
        const sortItems = document.querySelectorAll(`#${this.idPrefix}SortDropdown .custom-sort-dropdown-item`);
        
        if (!sortDropdown || !sortDropdownBtn || !sortDropdownMenu || !sortSelect) {
            console.warn('Sort dropdown elements not found');
            return;
        }
        
        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sortDropdown.classList.contains('active');
            
            document.querySelectorAll('.custom-sort-dropdown').forEach(dd => {
                if (dd.id !== `${this.idPrefix}SortDropdown`) {
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
                
                this.applyFiltersAndSort();
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!sortDropdown.contains(e.target)) {
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';
            }
        });
        
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
let gamingPage;
document.addEventListener('DOMContentLoaded', () => {
    gamingPage = new GamingPage();
});

