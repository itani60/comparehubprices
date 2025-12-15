class SearchResultsPage {
    constructor() {
        this.searchQuery = '';
        this.allResults = [];
        this.filteredResults = [];
        this.currentPage = 1;
        this.hasMore = false;
        this.nextPageToken = null;
        this.productsPerPage = 12;

        this.selectedCategories = new Set();
        this.selectedBrands = new Set();
        this.selectedPriceRange = null;

        this.tempSelectedCategories = new Set();
        this.tempSelectedBrands = new Set();
        this.tempSelectedPriceRange = null;

        this.resultsContainer = document.querySelector('.search-results-content');
        this.sortSelect = document.getElementById('sortSelect');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.filterOptions = document.querySelectorAll('.filter-options');
        this.brandOptions = document.querySelectorAll('.brand-option');
        this.categoryOptions = document.querySelectorAll('.category-option');
        this.priceOptions = document.querySelectorAll('.price-option');

        this.init();
    }

    async init() {
        this.getSearchQueryFromURL();
        this.initSortDropdown();
        this.addEventListeners();
        if (this.searchQuery) {
            await this.performSearch();
        }
    }

    getSearchQueryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = urlParams.get('q') || '';
        
        if (this.searchQuery) {
            const searchQueryText = document.getElementById('searchQueryText');
            if (searchQueryText) {
                searchQueryText.innerHTML = `Search results for: <strong>"${this.escapeHtml(this.searchQuery)}"</strong>`;
            }
            const searchResultsTitle = document.getElementById('searchResultsTitle');
            if (searchResultsTitle) {
                searchResultsTitle.textContent = `Search Results for "${this.escapeHtml(this.searchQuery)}"`;
            }
        } else {
            const searchQueryText = document.getElementById('searchQueryText');
            if (searchQueryText) {
                searchQueryText.textContent = 'No search query provided';
            }
        }
    }

    async performSearch(pageToken = null) {
        if (!this.searchQuery) {
            this.showEmptyState();
            return;
        }

        this.showLoadingState();

        try {
            const url = new URL(`${SEARCH_API_CONFIG.BASE_URL}${SEARCH_API_CONFIG.SEARCH_ENDPOINT}`);
            url.searchParams.append('q', this.searchQuery);
            // Fetch more results initially to support client-side pagination
            url.searchParams.append('limit', '600');
            if (pageToken) {
                url.searchParams.append('pageToken', pageToken);
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let searchData = data;
            if (data.body) {
                searchData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
            }

            const products = searchData.products || searchData.items || [];
            const businesses = searchData.businesses || [];
            
            // Combine products and businesses
            const allItems = [...products, ...businesses];
            
            this.nextPageToken = searchData.nextPageToken || null;
            this.hasMore = !!this.nextPageToken;

            if (pageToken) {
                this.allResults = [...this.allResults, ...allItems];
            } else {
                this.allResults = allItems;
            }

            this.applyFiltersAndSort();
        } catch (error) {
            console.error('Error performing search:', error);
            this.showErrorState('Failed to load search results. Please try again later.');
        }
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

        sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sortDropdown.classList.contains('active');
            
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
            const isFilterElement = e.target.closest('.filter-options') || 
                                   e.target.closest('.filter-btn') ||
                                   e.target.closest('.filter-options-content') ||
                                   e.target.closest('.filter-actions');
            
            if (!sortDropdown.contains(e.target) && !isFilterElement) {
                sortDropdown.classList.remove('active');
                sortDropdownMenu.style.display = 'none';
            }

            if (e.target.classList.contains('btn-compare') || e.target.closest('.btn-compare')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.classList.contains('btn-compare') ? e.target : e.target.closest('.btn-compare');
                const productId = button.dataset.productId;
                if (productId) {
                    const card = button.closest('.search-result-card');
                    const category = card?.dataset.category || '';
                    const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                    const productCategory = product?.category || category;
                    const infoPage = this.getInfoPageUrl(productCategory, productId);
                    window.location.href = infoPage;
                }
            } else if (e.target.classList.contains('btn-wishlist') || e.target.closest('.btn-wishlist')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.classList.contains('btn-wishlist') ? e.target : e.target.closest('.btn-wishlist');
                const productId = button.dataset.productId;
                if (productId) {
                    const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                    if (product && window.wishlistManager) {
                        window.wishlistManager.toggleWishlist(product);
                        if (window.updateWishlistCount) {
                            window.updateWishlistCount();
                        }
                    }
                }
            } else if (e.target.classList.contains('price-alert-bell') || e.target.closest('.price-alert-bell')) {
                e.preventDefault();
                e.stopPropagation();
                const bell = e.target.classList.contains('price-alert-bell') ? e.target : e.target.closest('.price-alert-bell');
                const productId = bell.dataset.productId;
                if (productId) {
                    // Find the product in allResults
                    const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                    if (product && window.priceAlertModal) {
                        window.priceAlertModal.show(product);
                    } else if (productId && window.priceAlertModal) {
                        // Fallback: try to open with just productId if product not found
                        window.priceAlertModal.open(productId);
                    }
                }
            }
        });

        const currentValue = sortSelect.value || 'relevance';
        sortItems.forEach(item => {
            if (item.dataset.value === currentValue) {
                item.classList.add('active');
                if (sortDropdownText) {
                    sortDropdownText.textContent = item.textContent;
                }
            }
        });
    }

    addEventListeners() {
        if (!this.filterButtons || this.filterButtons.length === 0) {
            console.warn('Filter buttons not found');
            return;
        }

        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const filterType = e.currentTarget.dataset.filter;
                this.toggleFilterOptions(filterType);
            });
        });

        this.brandOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const brand = e.currentTarget.dataset.brand;
                this.toggleBrandFilter(brand);
            });
        });

        this.categoryOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = e.currentTarget.dataset.category;
                this.toggleCategoryFilter(category);
            });
        });

        this.priceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const priceRange = e.currentTarget.dataset.price;
                this.togglePriceRangeFilter(priceRange);
            });
        });

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
            } else if (e.target.classList.contains('btn-compare') || e.target.closest('.btn-compare')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.classList.contains('btn-compare') ? e.target : e.target.closest('.btn-compare');
                
                // Check if it's a business
                if (button.dataset.type === 'business' || button.dataset.businessId) {
                    const businessId = button.dataset.businessId;
                    if (businessId) {
                        window.location.href = `local_business_info.html?businessId=${businessId}`;
                    }
                } else {
                    const productId = button.dataset.productId;
                    if (productId) {
                        const card = button.closest('.search-result-card');
                        const category = card?.dataset.category || '';
                        const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                        const productCategory = product?.category || category;
                        const infoPage = this.getInfoPageUrl(productCategory, productId);
                        window.location.href = infoPage;
                    }
                }
            } else if (e.target.classList.contains('btn-wishlist') || e.target.closest('.btn-wishlist')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.classList.contains('btn-wishlist') ? e.target : e.target.closest('.btn-wishlist');
                const productId = button.dataset.productId;
                if (productId) {
                    const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                    if (product && window.wishlistManager) {
                        window.wishlistManager.toggleWishlist(product);
                        if (window.updateWishlistCount) {
                            window.updateWishlistCount();
                        }
                    }
                }
            } else if (e.target.classList.contains('price-alert-bell') || e.target.closest('.price-alert-bell')) {
                e.preventDefault();
                e.stopPropagation();
                const bell = e.target.classList.contains('price-alert-bell') ? e.target : e.target.closest('.price-alert-bell');
                const productId = bell.dataset.productId;
                if (productId) {
                    // Find the product in allResults
                    const product = this.allResults.find(p => (p.product_id || p.id) === productId);
                    if (product && window.priceAlertModal) {
                        window.priceAlertModal.show(product);
                    } else if (productId && window.priceAlertModal) {
                        // Fallback: try to open with just productId if product not found
                        window.priceAlertModal.open(productId);
                    }
                }
            }
        });
    }

    toggleBrandFilter(brand) {
        const brandOption = document.querySelector(`[data-brand="${brand}"]`);
        if (!brandOption) return;

        if (brand === 'all') {
            this.brandOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            brandOption.classList.add('active');
            this.tempSelectedBrands.clear();
        } else {
            const allOption = document.querySelector('[data-brand="all"]');
            if (allOption) allOption.classList.remove('active');
            
            if (this.tempSelectedBrands.has(brand)) {
                this.tempSelectedBrands.delete(brand);
            } else {
                this.tempSelectedBrands.add(brand);
            }
            brandOption.classList.toggle('active');
        }
    }

    toggleCategoryFilter(category) {
        const categoryOption = document.querySelector(`[data-category="${category}"]`);
        if (!categoryOption) return;

        if (category === 'all') {
            this.categoryOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            categoryOption.classList.add('active');
            this.tempSelectedCategories.clear();
        } else {
            const allOption = document.querySelector('[data-category="all"]');
            if (allOption) allOption.classList.remove('active');
            
            if (this.tempSelectedCategories.has(category)) {
                this.tempSelectedCategories.delete(category);
            } else {
                this.tempSelectedCategories.add(category);
            }
            categoryOption.classList.toggle('active');
        }
    }

    togglePriceRangeFilter(priceRange) {
        if (this.tempSelectedPriceRange === priceRange) {
            this.tempSelectedPriceRange = null;
        } else {
            this.tempSelectedPriceRange = priceRange;
        }
        
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

    toggleFilterOptions(filterType) {
        const targetOption = document.getElementById(`${filterType}Options`);
        if (!targetOption) {
            console.warn(`Filter options panel not found: ${filterType}Options`);
            return;
        }

        const isCurrentlyVisible = targetOption.style.display !== 'none' && 
                                   window.getComputedStyle(targetOption).display !== 'none';

        this.filterOptions.forEach(option => {
            option.style.display = 'none';
        });

        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });

        if (!isCurrentlyVisible) {
            targetOption.style.display = 'block';
            const clickedButton = document.querySelector(`[data-filter="${filterType}"]`);
            if (clickedButton) {
                clickedButton.classList.add('filter-active');
            }
        } else {
            targetOption.style.display = 'none';
        }
    }

    applyFilter(filterType) {
        if (filterType === 'category') {
            this.selectedCategories = new Set(this.tempSelectedCategories);
        } else if (filterType === 'brand') {
            this.selectedBrands = new Set(this.tempSelectedBrands);
        } else if (filterType === 'price') {
            this.selectedPriceRange = this.tempSelectedPriceRange;
        }

        const targetOption = document.getElementById(`${filterType}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        const filterButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterButton) {
            filterButton.classList.remove('filter-active');
        }
        
        this.updateFilterButtonStates();
        this.applyFiltersAndSort();
    }

    cancelFilter(filterType) {
        if (filterType === 'category') {
            this.tempSelectedCategories = new Set(this.selectedCategories);
            this.updateCategoryFilterUI();
        } else if (filterType === 'brand') {
            this.tempSelectedBrands = new Set(this.selectedBrands);
            this.updateBrandFilterUI();
        } else if (filterType === 'price') {
            this.tempSelectedPriceRange = this.selectedPriceRange;
            this.updatePriceFilterUI();
        }

        const targetOption = document.getElementById(`${filterType}Options`);
        if (targetOption) {
            targetOption.style.display = 'none';
        }
        
        const filterButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterButton) {
            filterButton.classList.remove('filter-active');
        }
    }

    clearFilter(filterType) {
        if (filterType === 'category') {
            this.tempSelectedCategories.clear();
            this.categoryOptions.forEach(option => {
                option.classList.remove('active');
            });
        } else if (filterType === 'brand') {
            this.tempSelectedBrands.clear();
            this.brandOptions.forEach(option => {
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
        this.selectedCategories.clear();
        this.selectedBrands.clear();
        this.selectedPriceRange = null;
        this.tempSelectedCategories.clear();
        this.tempSelectedBrands.clear();
        this.tempSelectedPriceRange = null;

        this.categoryOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.brandOptions.forEach(option => {
            option.classList.remove('active');
        });
        this.priceOptions.forEach(option => {
            option.classList.remove('active');
        });

        this.filterOptions.forEach(option => {
            option.style.display = 'none';
        });

        this.filterButtons.forEach(btn => {
            btn.classList.remove('filter-active');
        });

        const resetBtn = document.getElementById('resetAllFilters');
        if (resetBtn) {
            resetBtn.style.display = 'none';
        }

        if (this.sortSelect) {
            this.sortSelect.value = 'relevance';
        }
        const sortDropdownText = document.getElementById('sortDropdownText');
        if (sortDropdownText) {
            sortDropdownText.textContent = 'Relevance';
        }
        const sortItems = document.querySelectorAll('.custom-sort-dropdown-item');
        sortItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.value === 'relevance') {
                item.classList.add('active');
            }
        });

        this.applyFiltersAndSort();
    }

    updateCategoryFilterUI() {
        this.categoryOptions.forEach(opt => {
            opt.classList.remove('active');
            if (this.tempSelectedCategories.has(opt.dataset.category)) {
                opt.classList.add('active');
            }
        });
    }

    updateBrandFilterUI() {
        this.brandOptions.forEach(opt => {
            opt.classList.remove('active');
            if (this.tempSelectedBrands.has(opt.dataset.brand)) {
                opt.classList.add('active');
            }
        });
    }

    updatePriceFilterUI() {
        this.priceOptions.forEach(opt => {
            opt.classList.remove('active');
            if (this.tempSelectedPriceRange === opt.dataset.price) {
                opt.classList.add('active');
            }
        });
    }

    updateFilterButtonStates() {
        const resetBtn = document.getElementById('resetAllFilters');
        const hasActiveFilters = this.selectedCategories.size > 0 || 
                                 this.selectedBrands.size > 0 || 
                                 this.selectedPriceRange !== null;
        
        if (resetBtn) {
            resetBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
        }

        this.filterButtons.forEach(btn => {
            const filterType = btn.dataset.filter;
            if (filterType === 'category' && this.selectedCategories.size > 0) {
                btn.classList.add('filter-active');
            } else if (filterType === 'brand' && this.selectedBrands.size > 0) {
                btn.classList.add('filter-active');
            } else if (filterType === 'price' && this.selectedPriceRange !== null) {
                btn.classList.add('filter-active');
            }
        });
    }

    applyFiltersAndSort() {
        let tempResults = [...this.allResults];

        if (this.selectedCategories.size > 0 && !this.selectedCategories.has('all')) {
            tempResults = tempResults.filter(item => {
                // Handle businesses
                if (item.type === 'business' || item.searchCategory === 'business') {
                    return this.selectedCategories.has('business');
                }
                
                // Handle products
                const category = (item.category || '').toLowerCase();
                const searchCategory = (item.searchCategory || '').toLowerCase();
                return Array.from(this.selectedCategories).some(selectedCat => {
                    const normalizedSelected = selectedCat.toLowerCase().replace(/\s+/g, '-');
                    return category.includes(normalizedSelected) || 
                           searchCategory.includes(normalizedSelected) ||
                           normalizedSelected.includes(category) ||
                           normalizedSelected.includes(searchCategory);
                });
            });
        }

        if (this.selectedBrands.size > 0 && !this.selectedBrands.has('all')) {
            tempResults = tempResults.filter(item => {
                // Skip brand filtering for businesses
                if (item.type === 'business' || item.searchCategory === 'business') {
                    return true;
                }
                
                // Apply brand filter for products
                const brand = (item.brand || '').toLowerCase();
                return Array.from(this.selectedBrands).some(selectedBrand => 
                    brand.includes(selectedBrand.toLowerCase())
                );
            });
        }

        if (this.selectedPriceRange) {
            const [min, max] = this.selectedPriceRange.split('-').map(Number);
            tempResults = tempResults.filter(item => {
                // Skip price filtering for businesses
                if (item.type === 'business' || item.searchCategory === 'business') {
                    return true;
                }
                
                // Apply price filter for products
                const lowestPrice = this.getLowestPrice(item);
                if (max === 999999) {
                    return lowestPrice >= min;
                }
                return lowestPrice >= min && lowestPrice <= max;
            });
        }

        const sortBy = this.sortSelect ? this.sortSelect.value : 'relevance';
        tempResults.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.title || a.model || a.businessName || a.name || '').toLowerCase();
                const nameB = (b.title || b.model || b.businessName || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'price-low') {
                // Businesses don't have prices, so they should appear last
                if (a.type === 'business' || a.searchCategory === 'business') return 1;
                if (b.type === 'business' || b.searchCategory === 'business') return -1;
                return this.getLowestPrice(a) - this.getLowestPrice(b);
            } else if (sortBy === 'price-high') {
                // Businesses don't have prices, so they should appear last
                if (a.type === 'business' || a.searchCategory === 'business') return 1;
                if (b.type === 'business' || b.searchCategory === 'business') return -1;
                return this.getLowestPrice(b) - this.getLowestPrice(a);
            } else {
                return 0;
            }
        });

        this.filteredResults = tempResults;
        this.currentPage = 1;
        this.displayResults();
        this.updateResultsCount(tempResults.length);
    }

    updateResultsCount(count) {
        const resultsInfo = document.getElementById('filterResultsInfo');
        const resultsCount = document.getElementById('resultsCount');
        
        if (resultsInfo && resultsCount) {
            if (count !== this.allResults.length && count > 0) {
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

    displayResults() {
        if (!this.resultsContainer) {
            console.error('Results container not found');
            return;
        }

        if (this.filteredResults.length === 0) {
            this.showEmptyState();
            this.removeExistingPagination();
            return;
        }

        this.hideLoadingState();
        this.hideEmptyState();

        // Calculate pagination
        const totalPages = Math.ceil(this.filteredResults.length / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentPageResults = this.filteredResults.slice(startIndex, endIndex);

        this.resultsContainer.innerHTML = currentPageResults.map(product => this.createProductCard(product)).join('');

        // Add pagination controls
        this.addPaginationControls(totalPages, this.filteredResults.length);
    }

    createProductCard(item) {
        // Check if it's a business
        if (item.type === 'business' || item.searchCategory === 'business') {
            return this.createBusinessCard(item);
        }

        // Otherwise it's a product
        const product = item;
        const lowestPrice = this.getLowestPrice(product);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        const imageUrl = product.imageUrl || product.image || product.img || 'https://via.placeholder.com/150?text=No+Image';
        const category = product.category || '';
        
        // Extract product name - for smartphones use model first, for others use title/name
        const productName = product.model || product.title || product.name || 'Untitled Product';
        const brandName = product.brand || 'Unknown Brand';

        // Extract specs (matching smartphones.js structure)
        const specs = [];
        if (product.specs?.Performance?.Ram) specs.push(product.specs.Performance.Ram);
        if (product.specs?.Performance?.Storage) specs.push(product.specs.Performance.Storage);
        if (product.specs?.Os?.['Operating System']) specs.push(product.specs.Os['Operating System']);
        if (product.specs?.Display?.Size) specs.push(product.specs.Display.Size);
        if (product.specs?.Camera?.Main) specs.push(product.specs.Camera.Main);

        const specsHtml = specs.length > 0 ? `<div class="product-specs"><span>${specs.join(' • ')}</span></div>` : '';

        // Get retailer count
        const retailerCount = product.offers?.length || 0;
        
        const infoPage = this.getInfoPageUrl(category, product.product_id);

        return `
            <div class="search-result-card" data-product-id="${product.product_id}">
                <div class="card-image-container">
                    <img src="${imageUrl}" alt="${this.escapeHtml(productName)}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    <button class="price-alert-bell" data-product-id="${product.product_id}" title="Set Price Alert">
                        <i class="fas fa-bell"></i>
                    </button>
                </div>
                <div class="card-content">
                    <span class="brand-badge">${this.escapeHtml(brandName)}</span>
                    <h3 class="product-name">${this.escapeHtml(productName)}</h3>
                    ${specsHtml}
                    <div class="product-price">
                        <span class="current-price">${formattedPrice}</span>
                    </div>
                    <div class="retailer-info">
                        <span>${retailerCount} retailers</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-compare" data-product-id="${product.product_id}">View</button>
                    <button class="btn-wishlist" data-product-id="${product.product_id}">Add to Wishlist</button>
                </div>
            </div>
        `;
    }

    createBusinessCard(business) {
        const imageUrl = business.businessLogoUrl || business.logo || 'https://via.placeholder.com/150?text=Business';
        const businessName = business.businessName || business.name || 'Unknown Business';
        const businessCategory = business.businessCategory || business.category || 'Business';
        const businessAddress = business.businessAddress || business.address || '';
        const businessId = business.businessId || business.id;
        const description = (business.businessDescription || business.description || '').substring(0, 100);

        return `
            <div class="search-result-card search-result-business" data-business-id="${businessId}" data-type="business">
                <div class="card-image-container">
                    <img src="${imageUrl}" alt="${this.escapeHtml(businessName)}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=Business'">
                </div>
                <div class="card-content">
                    <span class="brand-badge">${this.escapeHtml(businessCategory)}</span>
                    <h3 class="product-name">${this.escapeHtml(businessName)}</h3>
                    ${description ? `<div class="product-specs"><span>${this.escapeHtml(description)}${description.length >= 100 ? '...' : ''}</span></div>` : ''}
                    ${businessAddress ? `<div class="retailer-info"><span>📍 ${this.escapeHtml(businessAddress)}</span></div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn-compare" data-business-id="${businessId}" data-type="business">View Business</button>
                </div>
            </div>
        `;
    }

    getInfoPageUrl(category, productId) {
        const normalizedCategory = (category || 'smartphones').toString().trim().toLowerCase();
        return `product-info.html?id=${encodeURIComponent(productId)}&category=${encodeURIComponent(normalizedCategory)}`;
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

        if (this.resultsContainer) {
            this.resultsContainer.insertAdjacentHTML('afterend', paginationHTML);
        } else {
            console.warn('Results container not found, cannot add pagination controls');
        }
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
                        onclick="searchResultsPage.goToPage(${i})">${i}</button>
            `);
        }

        return numbers.join('');
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredResults.length / this.productsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayResults();
        
        // Scroll to top of results
        if (this.resultsContainer) {
            this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    getTotalPages() {
        return Math.ceil(this.filteredResults.length / this.productsPerPage);
    }

    showLoadingState() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '<div class="loading-state"><div class="modern-spinner"><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div></div><p>Loading search results...</p></div>';
        }
    }

    hideLoadingState() {
    }

    showEmptyState() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No products found</h3><p>Try adjusting your search query or filters</p></div>';
        }
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    hideEmptyState() {
    }

    showErrorState(message) {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${this.escapeHtml(message)}</p></div>`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}

let searchResultsPage;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        searchResultsPage = new SearchResultsPage();
    });
} else {
    searchResultsPage = new SearchResultsPage();
}

