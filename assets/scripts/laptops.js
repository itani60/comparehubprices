// Laptops Page Functionality
// API Configuration - matching admin-product-management.html
const API_CONFIG = {
    BASE_URL: 'https://hub.comparehubprices.co.za/data',
    LIST_PRODUCTS_ENDPOINT: '/products',
};

class LaptopsPage {
    constructor(category = 'laptops') {
        this.category = category;
        this.allLaptops = [];
        this.filteredLaptops = [];
        this.laptopsContainer = document.querySelector('.laptops-content');
        this.sortSelect = document.getElementById('sortSelect');
        this.brandOptions = document.querySelectorAll('.brand-option');
        this.processorOptions = [];
        this.priceOptions = document.querySelectorAll('.price-option');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.filterOptions = document.querySelectorAll('.filter-options');
        this.processorGrid = document.getElementById('processorGrid');
        
        this.selectedBrands = new Set();
        this.selectedProcessors = new Set();
        this.selectedScreenSizes = new Set();
        this.selectedPriceRange = null;
        
        // Temporary selections for Apply/Cancel functionality
        this.tempSelectedBrands = new Set();
        this.tempSelectedProcessors = new Set();
        this.tempSelectedScreenSizes = new Set();
        this.tempSelectedPriceRange = null;
        
        // Processor options by category
        this.processorOptionsByCategory = {
            windows: [
                'Intel Inside', 'Intel Celeron', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7',
                'Intel Core 5', 'Intel Core 7', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
                'AMD', 'AMD Athlon', 'AMD Ryzen', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'AMD Ryzen™ AI 7',
                'Qualcomm Snapdragon'
            ],
            chromebooks: [
                'Intel', 'Intel Inside', 'Intel Celeron', 'Intel Core i3', 'Intel Core i5',
                'AMD', 'AMD Athlon', 'AMD Ryzen', 'AMD Ryzen 3'
            ],
            macbooks: [
                'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'
            ],
            default: [
                'Intel Inside', 'Intel Celeron', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7',
                'Intel Core 5', 'Intel Core 7', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
                'AMD', 'AMD Athlon', 'AMD Ryzen', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'AMD Ryzen™ AI 7',
                'Qualcomm Snapdragon',
                'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'
            ]
        };
        
        // Pagination
        this.currentPage = 1;
        this.productsPerPage = 12;

        this.init(this.category);
    }

    async init(category = 'laptops') {
        await this.fetchLaptops(category);
        this.populateProcessorOptions();
        this.addEventListeners();
        this.loadExistingAlerts();
        
        // Check for category URL parameter and auto-apply processor filter
        this.applyCategoryFilter();
        
        // Ensure title is updated on initial load
        this.updateTitle();
    }
    
    populateProcessorOptions() {
        if (!this.processorGrid) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'default';
        
        let processors = [];
        if (category === 'windows') {
            processors = this.processorOptionsByCategory.windows;
        } else if (category === 'chromebooks') {
            processors = this.processorOptionsByCategory.chromebooks;
        } else if (category === 'macbooks') {
            processors = this.processorOptionsByCategory.macbooks;
        } else {
            processors = this.processorOptionsByCategory.default;
        }
        
        // Clear existing options
        this.processorGrid.innerHTML = '';
        
        // Add "All" button first
        const allButton = document.createElement('button');
        allButton.className = 'processor-option';
        allButton.dataset.processor = 'all';
        allButton.textContent = 'All';
        this.processorGrid.appendChild(allButton);
        
        // Create processor buttons
        processors.forEach(processor => {
            const button = document.createElement('button');
            button.className = 'processor-option';
            button.dataset.processor = processor.toLowerCase().replace(/™/g, '').replace(/\s+/g, '-');
            button.textContent = processor;
            this.processorGrid.appendChild(button);
        });
        
        // Update processor options NodeList
        this.processorOptions = document.querySelectorAll('.processor-option');
    }

    applyCategoryFilter() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        // Initialize filter button visibility based on category
        const brandFilterBtn = document.getElementById('brandFilterBtn');
        const screensizeFilterBtn = document.getElementById('screensizeFilterBtn');
        
        if (!category) {
            // No category: show brand filter, hide screen size filter
            if (brandFilterBtn) {
                brandFilterBtn.style.display = 'inline-flex';
            }
            if (screensizeFilterBtn) {
                screensizeFilterBtn.style.display = 'none';
            }
            return;
        }
        
        // Map category to processor filters and brand filters
        let processorFilters = [];
        let brandFilters = [];
        
        if (category === 'windows') {
            // Windows: All processors available, no brand restrictions
            processorFilters = [];
        } else if (category === 'chromebooks') {
            // For Chromebooks, only show these brands: dell, hp, acer, lenovo
            brandFilters = ['dell', 'hp', 'acer', 'lenovo'];
            // Chromebooks processors are already populated in populateProcessorOptions
        } else if (category === 'macbooks') {
            // MacBooks: Only Apple processors, no brand restrictions needed
            processorFilters = [];
            // Hide brand filter button for MacBooks (only one brand)
            const brandFilterBtn = document.getElementById('brandFilterBtn');
            if (brandFilterBtn) {
                brandFilterBtn.style.display = 'none';
            }
            // Show screen size filter button for MacBooks
            const screensizeFilterBtn = document.getElementById('screensizeFilterBtn');
            if (screensizeFilterBtn) {
                screensizeFilterBtn.style.display = 'inline-flex';
            }
        } else {
            // Show brand filter button for non-MacBooks
            const brandFilterBtn = document.getElementById('brandFilterBtn');
            if (brandFilterBtn) {
                brandFilterBtn.style.display = 'inline-flex';
            }
            // Hide screen size filter button for non-MacBooks
            const screensizeFilterBtn = document.getElementById('screensizeFilterBtn');
            if (screensizeFilterBtn) {
                screensizeFilterBtn.style.display = 'none';
            }
        }
        
        // Apply brand visibility for Chromebooks (but don't auto-select)
        if (brandFilters.length > 0) {
            // Hide all brand options first, but always show "All" button
            this.brandOptions.forEach(option => {
                const brand = option.dataset.brand;
                // Always show "All" button
                if (brand === 'all') {
                    option.style.display = 'block';
                } else if (brandFilters.includes(brand)) {
                    // Only show brands that are in the allowed list
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
            // Don't auto-select brands - let user choose
        } else {
            // Show all brand options for non-Chromebook categories
            this.brandOptions.forEach(option => {
                option.style.display = 'block';
            });
        }
        
        // Update title based on category (don't auto-apply filters)
        this.updateTitle();
    }

    getApiCategory(category) {
        // Convert URL category parameter to API category format
        if (category === 'windows') {
            return 'windows-laptops';
        } else if (category === 'chromebooks') {
            return 'chromebooks-laptops';
        } else if (category === 'macbooks') {
            return 'macbooks-laptops';
        }
        // Default to 'laptops' if no specific category
        return 'laptops';
    }

    async fetchLaptops(category = 'laptops') {
        this.showLoadingState();
        try {
            // Convert category to API format
            const apiCategory = this.getApiCategory(category);
            // Construct URL with category parameter using new API endpoints
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${apiCategory}`;
            
            console.log('Fetching laptops from:', url);
            console.log('Category parameter:', category);
            console.log('API Category format:', apiCategory);
            
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            console.log('API Response (raw):', data);
            console.log('API Response type:', typeof data);
            console.log('API Response keys:', Object.keys(data || {}));
            
            // Parse response - handle different response structures
            let productsData = data;
            if (data.body) {
                productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                console.log('Parsed body:', productsData);
            }
            
            // Extract products array from response
            const products = productsData.products || productsData.items || productsData;
            
            console.log('Extracted products:', products);
            console.log('Products type:', Array.isArray(products) ? 'Array' : typeof products);
            console.log('Products length:', Array.isArray(products) ? products.length : 'Not an array');
            
            if (Array.isArray(products) && products.length > 0) {
                console.log('First product sample:', products[0]);
                console.log('First product category field:', products[0].category);
            }
            
            this.allLaptops = this.extractLaptops(products);
            console.log('Processed laptops:', this.allLaptops.length);
            console.log('All laptops array:', this.allLaptops);
            
            if (this.allLaptops.length === 0) {
                console.warn('No laptops found! Check:');
                console.warn('1. API returned empty array');
                console.warn('2. Products have correct category field in database');
                console.warn('3. Category-index GSI is properly configured');
            }
            
            this.displayLaptops(this.allLaptops);
        } catch (error) {
            console.error('Error fetching laptops:', error);
            console.error('Error stack:', error.stack);
            this.showErrorState('Failed to load laptops. Please try again later.');
        }
    }

    extractLaptops(data) {
        if (Array.isArray(data)) {
            return data;
        } else if (data.products && Array.isArray(data.products)) {
            return data.products;
        } else if (data.laptops && Array.isArray(data.laptops)) {
            return data.laptops;
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

        // Processor filter options (dynamically added, so we use event delegation)
        if (this.processorGrid) {
            this.processorGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('processor-option')) {
                    e.stopPropagation();
                    const processor = e.target.dataset.processor;
                    this.toggleTempProcessorFilter(processor);
                }
            });
        }

        // Price range options
        this.priceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const priceRange = e.currentTarget.dataset.price;
                this.toggleTempPriceRangeFilter(priceRange);
            });
        });

        // Screen size filter options (event delegation for dynamically added elements)
        const screensizeGrid = document.getElementById('screensizeGrid');
        if (screensizeGrid) {
            screensizeGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('screensize-option')) {
                    e.stopPropagation();
                    const screensize = e.target.dataset.screensize;
                    this.toggleTempScreenSizeFilter(screensize);
                }
            });
        }

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
                
                // Navigate to laptop-info.html with the product ID
                window.location.href = `laptop-info.html?id=${productId}`;
            } else if (e.target.classList.contains('btn-wishlist')) {
                e.preventDefault();
                e.stopPropagation();
                const productId = e.target.getAttribute('data-product-id');
                
                // Get product data
                const product = this.allLaptops.find(laptop => (laptop.product_id || laptop.id) === productId);
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
        if (brand === 'all') {
            // If "All" is clicked, clear all selections
            this.tempSelectedBrands.clear();
            // Remove active class from all brand options
            this.brandOptions.forEach(option => {
                option.classList.remove('active');
            });
            // Add active class to "All" button
            const allOption = document.querySelector(`[data-brand="all"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            // If a specific brand is clicked, remove "All" if it was selected
            const allOption = document.querySelector(`[data-brand="all"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            // Toggle the specific brand
            if (this.tempSelectedBrands.has(brand)) {
                this.tempSelectedBrands.delete(brand);
            } else {
                this.tempSelectedBrands.add(brand);
            }
            
            const brandOption = document.querySelector(`[data-brand="${brand}"]`);
            if (brandOption) {
                brandOption.classList.toggle('active');
            }
        }
    }

    toggleTempProcessorFilter(processor) {
        if (processor === 'all') {
            // If "All" is clicked, clear all selections
            this.tempSelectedProcessors.clear();
            // Remove active class from all processor options
            this.processorOptions.forEach(option => {
                option.classList.remove('active');
            });
            // Add active class to "All" button
            const allOption = document.querySelector(`[data-processor="all"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            // If a specific processor is clicked, remove "All" if it was selected
            const allOption = document.querySelector(`[data-processor="all"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            // Toggle the specific processor
            if (this.tempSelectedProcessors.has(processor)) {
                this.tempSelectedProcessors.delete(processor);
            } else {
                this.tempSelectedProcessors.add(processor);
            }
            
            const processorOption = document.querySelector(`[data-processor="${processor}"]`);
            if (processorOption) {
                processorOption.classList.toggle('active');
            }
        }
    }

    toggleTempScreenSizeFilter(screensize) {
        if (screensize === 'all') {
            // If "All" is clicked, clear all selections
            this.tempSelectedScreenSizes.clear();
            // Remove active class from all screen size options
            const allScreensizeOptions = document.querySelectorAll('.screensize-option');
            allScreensizeOptions.forEach(option => {
                option.classList.remove('active');
            });
            // Add active class to "All" button
            const allOption = document.querySelector(`[data-screensize="all"]`);
            if (allOption) {
                allOption.classList.add('active');
            }
        } else {
            // If a specific size is clicked, remove "All" if it was selected
            const allOption = document.querySelector(`[data-screensize="all"]`);
            if (allOption && allOption.classList.contains('active')) {
                allOption.classList.remove('active');
            }
            
            // Toggle the specific size
            if (this.tempSelectedScreenSizes.has(screensize)) {
                this.tempSelectedScreenSizes.delete(screensize);
            } else {
                this.tempSelectedScreenSizes.add(screensize);
            }
            
            const screensizeOption = document.querySelector(`[data-screensize="${screensize}"]`);
            if (screensizeOption) {
                screensizeOption.classList.toggle('active');
            }
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
        } else if (filterType === 'processor') {
            this.selectedProcessors = new Set(this.tempSelectedProcessors);
        } else if (filterType === 'screensize') {
            this.selectedScreenSizes = new Set(this.tempSelectedScreenSizes);
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
            // If "all" is selected, ensure it's the only active option
            if (this.tempSelectedBrands.has('all')) {
                this.brandOptions.forEach(option => {
                    if (option.dataset.brand !== 'all') {
                        option.classList.remove('active');
                    }
                });
            }
        } else if (filterType === 'processor') {
            this.tempSelectedProcessors = new Set(this.selectedProcessors);
            // Update visual state
            this.processorOptions.forEach(option => {
                const processor = option.dataset.processor;
                if (this.tempSelectedProcessors.has(processor)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            // If "all" is selected, ensure it's the only active option
            if (this.tempSelectedProcessors.has('all')) {
                this.processorOptions.forEach(option => {
                    if (option.dataset.processor !== 'all') {
                        option.classList.remove('active');
                    }
                });
            }
        } else if (filterType === 'screensize') {
            this.tempSelectedScreenSizes = new Set(this.selectedScreenSizes);
            // Update visual state
            const screensizeOptions = document.querySelectorAll('.screensize-option');
            screensizeOptions.forEach(option => {
                const screensize = option.dataset.screensize;
                if (this.tempSelectedScreenSizes.has(screensize)) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            // If "all" is selected, ensure it's the only active option
            if (this.tempSelectedScreenSizes.has('all')) {
                screensizeOptions.forEach(option => {
                    if (option.dataset.screensize !== 'all') {
                        option.classList.remove('active');
                    }
                });
            }
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
        } else if (filterType === 'processor') {
            this.tempSelectedProcessors.clear();
            this.processorOptions.forEach(option => {
                option.classList.remove('active');
            });
        } else if (filterType === 'screensize') {
            this.tempSelectedScreenSizes.clear();
            const screensizeOptions = document.querySelectorAll('.screensize-option');
            screensizeOptions.forEach(option => {
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
        this.selectedProcessors.clear();
        this.selectedScreenSizes.clear();
        this.selectedPriceRange = null;
        this.tempSelectedBrands.clear();
        this.tempSelectedProcessors.clear();
        this.tempSelectedScreenSizes.clear();
        this.tempSelectedPriceRange = null;

        // Show all brand options (in case they were hidden for Chromebooks)
        this.brandOptions.forEach(option => {
            option.style.display = 'block';
            option.classList.remove('active');
        });
        this.processorOptions.forEach(option => {
            option.classList.remove('active');
        });
        const screensizeOptions = document.querySelectorAll('.screensize-option');
        screensizeOptions.forEach(option => {
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
        // Check if filters are active (excluding "all" option)
        const hasBrandFilter = this.selectedBrands.size > 0 && !this.selectedBrands.has('all');
        const hasProcessorFilter = this.selectedProcessors.size > 0 && !this.selectedProcessors.has('all');
        const hasScreenSizeFilter = this.selectedScreenSizes.size > 0 && !this.selectedScreenSizes.has('all');
        const hasActiveFilters = hasBrandFilter || hasProcessorFilter || hasScreenSizeFilter || this.selectedPriceRange !== null;
        
        if (resetBtn) {
            resetBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
        }

        // Update filter button active states
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

        // Update title based on category
        this.updateTitle();
    }

    updateTitle() {
        const titleElement = document.getElementById('laptopsTitle');
        if (!titleElement) return;

        // Check category from URL
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category === 'windows') {
            titleElement.textContent = 'Windows Laptops';
        } else if (category === 'macbooks') {
            titleElement.textContent = 'MacBook Laptops';
        } else if (category === 'chromebooks') {
            titleElement.textContent = 'Chromebooks';
        } else {
            titleElement.textContent = 'Top Laptop Deals';
        }
    }

    applyFiltersAndSort() {
        let tempLaptops = [...this.allLaptops];

        // Filter by Brand
        if (this.selectedBrands.size > 0 && !this.selectedBrands.has('all')) {
            tempLaptops = tempLaptops.filter(laptop => {
                const laptopBrand = (laptop.brand || laptop.manufacturer || '').toLowerCase();
                return Array.from(this.selectedBrands).some(brand => {
                    // Skip "all" option
                    if (brand === 'all') return false;
                    return laptopBrand.includes(brand.toLowerCase());
                });
            });
        }

        // Filter by Processor
        if (this.selectedProcessors.size > 0 && !this.selectedProcessors.has('all')) {
            tempLaptops = tempLaptops.filter(laptop => {
                // Check in specs, description, model, or title
                const processorText = (
                    (laptop.specs?.Performance?.Processor || '') +
                    ' ' +
                    (laptop.specs?.Processor || '') +
                    ' ' +
                    (laptop.description || '') +
                    ' ' +
                    (laptop.model || '') +
                    ' ' +
                    (laptop.title || '')
                ).toLowerCase();
                
                return Array.from(this.selectedProcessors).some(processor => {
                    // Skip "all" option
                    if (processor === 'all') return false;
                    // Normalize processor name for matching
                    const normalizedProcessor = processor.replace(/-/g, ' ').replace(/™/g, '').toLowerCase();
                    return processorText.includes(normalizedProcessor);
                });
            });
        }

        // Filter by Screen Size
        if (this.selectedScreenSizes.size > 0 && !this.selectedScreenSizes.has('all')) {
            tempLaptops = tempLaptops.filter(laptop => {
                // Check in specs, description, model, or title for screen size
                const screenSizeText = (
                    (laptop.specs?.Display?.Size || '') +
                    ' ' +
                    (laptop.specs?.Display?.['Screen Size'] || '') +
                    ' ' +
                    (laptop.specs?.['Screen Size'] || '') +
                    ' ' +
                    (laptop.description || '') +
                    ' ' +
                    (laptop.model || '') +
                    ' ' +
                    (laptop.title || '')
                ).toLowerCase();
                
                return Array.from(this.selectedScreenSizes).some(screensize => {
                    // Skip "all" option
                    if (screensize === 'all') return false;
                    // Normalize screen size for matching (e.g., "13.3-inch" -> "13.3")
                    const normalizedSize = screensize.replace(/-/g, ' ').toLowerCase();
                    // Match various formats: "13.3-inch", "13.3 inch", "13.3\"", etc.
                    return screenSizeText.includes(normalizedSize) || 
                           screenSizeText.includes(screensize.replace('-inch', '').toLowerCase());
                });
            });
        }

        // Filter by Price Range
        if (this.selectedPriceRange) {
            const [minPrice, maxPrice] = this.selectedPriceRange.split('-').map(Number);
            tempLaptops = tempLaptops.filter(laptop => {
                const laptopPrice = this.getLowestPrice(laptop);
                if (maxPrice === 5000) {
                    return laptopPrice < maxPrice; // Under R5,000
                } else if (minPrice === 50000) {
                    return laptopPrice >= minPrice; // Above R50,000
                } else {
                    return laptopPrice >= minPrice && laptopPrice <= maxPrice;
                }
            });
        }

        // Sort
        const sortBy = this.sortSelect ? this.sortSelect.value : 'relevance';
        tempLaptops.sort((a, b) => {
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

        this.filteredLaptops = tempLaptops;
        this.currentPage = 1; // Reset to first page when filters change
        this.displayLaptops(this.filteredLaptops);
        this.updateResultsCount(tempLaptops.length);
        this.updateFilterButtonStates();
        
        return tempLaptops;
    }

    updateResultsCount(count) {
        const resultsInfo = document.getElementById('filterResultsInfo');
        const resultsCount = document.getElementById('resultsCount');
        
        if (resultsInfo && resultsCount) {
            if (count !== this.allLaptops.length && count > 0) {
                resultsCount.textContent = count;
                resultsInfo.style.display = 'block';
            } else {
                resultsInfo.style.display = 'none';
            }
        }
    }

    getLowestPrice(laptop) {
        if (!laptop.offers || laptop.offers.length === 0) {
            // Try alternative price fields
            if (laptop.price) return parseFloat(laptop.price) || 0;
            if (laptop.lowestPrice) return parseFloat(laptop.lowestPrice) || 0;
            return 0;
        }
        const prices = laptop.offers.map(offer => parseFloat(offer.price) || 0).filter(price => price > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
    }

    togglePriceAlert(productId, bellElement) {
        // Get the product data
        const product = this.allLaptops.find(laptop => (laptop.product_id || laptop.id) === productId);
        
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
            const API_BASE_URL = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
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
            } else {
       
                if (response.status !== 401 && response.status !== 403) {
                    console.warn('Failed to load price alerts:', response.status);
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

    displayLaptops(laptops) {
        if (!this.laptopsContainer) {
            console.error('Laptops container not found');
            return;
        }

        if (laptops.length === 0) {
            this.showNoResultsState();
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(laptops.length / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const currentPageLaptops = laptops.slice(startIndex, endIndex);

        // Display current page products
        this.laptopsContainer.innerHTML = currentPageLaptops.map(laptop => this.createLaptopCard(laptop)).join('');

        // Add pagination controls
        this.addPaginationControls(totalPages, laptops.length);
        
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

        this.laptopsContainer.insertAdjacentHTML('afterend', paginationHTML);
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
                        onclick="laptopsPage.goToPage(${i})">${i}</button>
            `);
        }

        return numbers.join('');
    }

    goToPage(page) {
        const filteredData = this.filteredLaptops && this.filteredLaptops.length > 0 
            ? this.filteredLaptops 
            : this.allLaptops;
        const totalPages = Math.ceil(filteredData.length / this.productsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayLaptops(filteredData);
        
        // Scroll to top of products
        if (this.laptopsContainer) {
            this.laptopsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    getTotalPages() {
        const filteredData = this.filteredLaptops && this.filteredLaptops.length > 0 
            ? this.filteredLaptops 
            : this.allLaptops;
        return Math.ceil(filteredData.length / this.productsPerPage);
    }

    createLaptopCard(laptop) {
        const lowestPrice = this.getLowestPrice(laptop);
        const formattedPrice = lowestPrice ? lowestPrice.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Price not available';
        const imageUrl = laptop.imageUrl || laptop.image || laptop.img || 'https://via.placeholder.com/150?text=No+Image';
        const productName = laptop.model || laptop.title || laptop.name || 'Unknown Laptop';
        const brandName = laptop.brand || laptop.manufacturer || 'Unknown Brand';

        // Extract specs
        const specs = [];
        if (laptop.specs?.Performance?.Ram) specs.push(laptop.specs.Performance.Ram);
        if (laptop.specs?.Performance?.Storage) specs.push(laptop.specs.Performance.Storage);
        if (laptop.specs?.Os?.['Operating System']) specs.push(laptop.specs.Os['Operating System']);

        const specsHtml = specs.length > 0 ? `<div class="product-specs"><span>${specs.join(' • ')}</span></div>` : '';

        // Get retailer count
        const retailerCount = laptop.offers?.length || 0;

        return `
            <div class="laptop-card">
                <a href="laptop-info.html?id=${laptop.product_id || laptop.id}" class="card-link">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${productName}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        <button class="price-alert-bell" data-product-id="${laptop.product_id || laptop.id}" title="Set Price Alert">
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
                    <button class="btn-compare" data-product-id="${laptop.product_id || laptop.id}">View</button>
                    <button class="btn-wishlist" data-product-id="${laptop.product_id || laptop.id}">Add to Wishlist</button>
                </div>
            </div>
        `;
    }

    showLoadingState() {
        if (!this.laptopsContainer) return;
        this.laptopsContainer.innerHTML = `
            <div class="loading-state">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading laptops...</h4>
                <p>Please wait while we fetch the latest deals</p>
            </div>
        `;
    }

    showNoResultsState() {
        if (!this.laptopsContainer) return;
        this.laptopsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-laptop fa-3x mb-3"></i>
                <h4>No laptops found</h4>
                <p>Try adjusting your filters or clearing them all.</p>
            </div>
        `;
    }

    showErrorState(message) {
        if (!this.laptopsContainer) return;
        this.laptopsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    viewProductDetails(productId) {
        // Navigate to laptop-info.html with the product ID
        window.location.href = `laptop-info.html?id=${productId}`;
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
let laptopsPage;
document.addEventListener('DOMContentLoaded', () => {
    // Get category from URL parameters or use default
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'laptops';
    
    laptopsPage = new LaptopsPage(category);
});

