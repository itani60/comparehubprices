// Color data for all smartphone and tablet models
const PHONE_COLORS = {
    'iPhone 16 Pro': [
        { name: 'Black Titanium', hex: '#1a1a1a', productIdSuffix: 'black-titanium' },
        { name: 'White Titanium', hex: '#f5f5f0', productIdSuffix: 'white-titanium' },
        { name: 'Natural Titanium', hex: '#8b7355', productIdSuffix: 'natural-titanium' },
        { name: 'Desert Titanium', hex: '#d2b48c', productIdSuffix: 'desert-titanium' }
    ],
    'iPhone 16 Pro Max': [
        { name: 'Black Titanium', hex: '#1a1a1a', productIdSuffix: 'black-titanium' },
        { name: 'White Titanium', hex: '#f5f5f0', productIdSuffix: 'white-titanium' },
        { name: 'Natural Titanium', hex: '#8b7355', productIdSuffix: 'natural-titanium' },
        { name: 'Desert Titanium', hex: '#d2b48c', productIdSuffix: 'desert-titanium' }
    ],
    'iPhone 16': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Teal', hex: '#008080', productIdSuffix: 'teal' },
        { name: 'Ultramarine', hex: '#4169e1', productIdSuffix: 'ultramarine' }
    ],
    'iPhone 16 Plus': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Teal', hex: '#008080', productIdSuffix: 'teal' },
        { name: 'Ultramarine', hex: '#4169e1', productIdSuffix: 'ultramarine' }
    ],
    'iPhone 15': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Yellow', hex: '#ffd700', productIdSuffix: 'yellow' },
        { name: 'Green', hex: '#228b22', productIdSuffix: 'green' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'iPhone 15 Plus': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Yellow', hex: '#ffd700', productIdSuffix: 'yellow' },
        { name: 'Green', hex: '#228b22', productIdSuffix: 'green' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'Huawei Pura 80 Pro': [
        { name: 'Glazed Red', hex: '#dc143c', productIdSuffix: 'glazed-red' },
        { name: 'Glazed Black', hex: '#1a1a1a', productIdSuffix: 'glazed-black' }
    ],
    'Huawei Pura 80 Ultra': [
        { name: 'Golden Black', hex: '#2f2f2f', productIdSuffix: 'golden-black' },
        { name: 'Prestige Gold', hex: '#ffd700', productIdSuffix: 'prestige-gold' }
    ],
    'Huawei Nova 13i': [
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' },
        { name: 'Pearl White', hex: '#f8f8f8', productIdSuffix: 'pearl-white' }
    ],
    'Huawei Nova Y62 Blue': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' }
    ],
    'Huawei Nova 13': [
        { name: 'Loden Green', hex: '#556b2f', productIdSuffix: 'loden-green' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y62 Plus': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' }
    ],
    'Huawei Nova 13 Pro': [
        { name: 'Loden Green', hex: '#556b2f', productIdSuffix: 'loden-green' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y72s': [
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' },
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' }
    ],
    'Huawei Pura 70 Pro': [
        { name: 'Pearl White', hex: '#f8f8f8', productIdSuffix: 'pearl-white' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y73': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'Galaxy Z Fold7': [
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silver-shadow' },
        { name: 'Blue Shadow', hex: '#4169e1', productIdSuffix: 'blue-shadow' },
        { name: 'Jet Black', hex: '#0a0a0a', productIdSuffix: 'jet-black' }
    ],
    'Galaxy Z Flip7': [
        { name: 'Jet Black', hex: '#0a0a0a', productIdSuffix: 'jet-black' },
        { name: 'Blue Shadow', hex: '#4169e1', productIdSuffix: 'blue-shadow' }
    ],
    'Galaxy Z Flip7 FE': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' }
    ],
    'Galaxy S25 Ultra': [
        { name: 'Titanium Silverblue', hex: '#87ceeb', productIdSuffix: 'titanium-silverblue' },
        { name: 'Titanium Black', hex: '#1a1a1a', productIdSuffix: 'titanium-black' },
        { name: 'Titanium Gray', hex: '#808080', productIdSuffix: 'titanium-gray' },
        { name: 'Titanium Whitesilver', hex: '#f5f5f5', productIdSuffix: 'titanium-whitesilver' }
    ],
    'Galaxy S25+': [
        { name: 'Navy', hex: '#000080', productIdSuffix: 'navy' },
        { name: 'IcyBlue', hex: '#87ceeb', productIdSuffix: 'icyblue' },
        { name: 'Mint', hex: '#98fb98', productIdSuffix: 'mint' },
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silvershadow' }
    ],
    'Galaxy S25': [
        { name: 'Navy', hex: '#000080', productIdSuffix: 'navy' },
        { name: 'IcyBlue', hex: '#87ceeb', productIdSuffix: 'icyblue' },
        { name: 'Mint', hex: '#98fb98', productIdSuffix: 'mint' },
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silvershadow' }
    ],
    
    // Tablet Colors
    'iPad Pro 12.9-inch (6th generation)': [
        { name: 'Space Gray', hex: '#8e8e93', productIdSuffix: 'space-gray' },
        { name: 'Silver', hex: '#f2f2f7', productIdSuffix: 'silver' }
    ],
    'iPad Air (5th generation)': [
        { name: 'Space Gray', hex: '#8e8e93', productIdSuffix: 'space-gray' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Purple', hex: '#8a2be2', productIdSuffix: 'purple' },
        { name: 'Blue', hex: '#007aff', productIdSuffix: 'blue' },
        { name: 'Starlight', hex: '#f2f2f7', productIdSuffix: 'starlight' }
    ],
    'Galaxy Tab S9': [
        { name: 'Graphite', hex: '#36454f', productIdSuffix: 'graphite' },
        { name: 'Beige', hex: '#f5f5dc', productIdSuffix: 'beige' }
    ],
    'Surface Pro 9': [
        { name: 'Platinum', hex: '#e5e4e2', productIdSuffix: 'platinum' },
        { name: 'Graphite', hex: '#36454f', productIdSuffix: 'graphite' },
        { name: 'Sapphire', hex: '#0f52ba', productIdSuffix: 'sapphire' },
        { name: 'Forest', hex: '#228b22', productIdSuffix: 'forest' }
    ],
    'Huawei MatePad Pro 13.2': [
        { name: 'Space Gray', hex: '#8e8e93', productIdSuffix: 'space-gray' },
        { name: 'White', hex: '#ffffff', productIdSuffix: 'white' }
    ]
};

// Storage data for all smartphone models
const PHONE_STORAGE = {
    'iPhone 16 Pro': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 16 Pro Max': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Galaxy Z Fold7': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Galaxy Z Flip7': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'Galaxy Z Flip7 FE': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' }
    ],
    'Galaxy S25 Ultra': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Galaxy S25+': [
        { size: '256GB', suffix: '256gb' }
    ],
    'Galaxy S25': [
        { size: '256GB', suffix: '256gb' }
    ],
    'iPhone 16': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 16 Plus': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15 Plus': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 16e': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    // Alternative naming conventions that might be used in the database
    'iPhone15': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15 Pro': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 15 Pro Max': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    
    // Tablet Storage Options
    'iPad Pro 12.9-inch (6th generation)': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' },
        { size: '2TB', suffix: '2tb' }
    ],
    'iPad Air (5th generation)': [
        { size: '64GB', suffix: '64gb' },
        { size: '256GB', suffix: '256gb' }
    ],
    'Galaxy Tab S9': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' }
    ],
    'Surface Pro 9': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Huawei MatePad Pro 13.2': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ]
};

// Smartphone/Tablet Info Page - Main Class for Product Details Display
class SmartphoneInfo {
    constructor(category = 'smartphones') {
        // Detect if this is a tablet page
        const isTabletPage = window.location.pathname.includes('tablet-info.html');
        this.category = isTabletPage ? 'tablets' : category;
        this.productId = null;
        this.productData = null;
        this.currentImageIndex = 0;
        
        this.init();
    }

    init() {
        this.getProductIdFromURL();
        this.createMainContentHTML();
        this.attachEventListeners();
        
        if (this.productId) {
            this.loadProductData(this.category);
        } else {
            this.showError('Product ID not found in URL');
        }
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');
    }

    createMainContentHTML() {
        const mainContent = `
            <div class="smartphone-info-container">
                <!-- Loading State -->
                <div class="loading-container" id="loadingContainer">
                    <div class="loading-state">
                        <div class="modern-spinner">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            </div>
                                <h3>Loading ${this.category === 'tablets' ? 'Tablet' : 'Product'} Details</h3>
                                <p>Fetching the latest information...</p>
                    </div>
                </div>

                <!-- Error State -->
                <div class="error-container" id="errorContainer" style="display: none;">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-message" id="errorMessage">Something went wrong</div>
                    <button class="error-retry-btn" onclick="location.reload()">Try Again</button>
                </div>

                <!-- Product Content -->
                <div id="productContent" style="display: none;">
                    <!-- Product Header -->
                    <div class="product-header">
                        <div class="product-breadcrumb">
                            <nav aria-label="breadcrumb">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                                    <li class="breadcrumb-item"><a href="${this.category === 'tablets' ? 'tablets.html' : 'smartphones.html'}">${this.category === 'tablets' ? 'Tablets' : 'Smartphones'}</a></li>
                                    <li class="breadcrumb-item active" id="productBreadcrumb">Product Details</li>
                                </ol>
                            </nav>
                        </div>

                        <div class="product-main-info">
                            <!-- Product Image Section -->
                            <div class="product-image-section">
                                <img id="productMainImage" src="" alt="Product Image" class="product-main-image">
                            </div>

                            <!-- Product Details Section -->
                            <div class="product-details">
                                <h1 id="productTitle" class="product-title">Product Title</h1>
                                <p id="productBrand" class="product-brand">Brand</p>
                                
                                <!-- Storage Options -->
                                <div class="product-options">
                                    <div class="option-group">
                                        <h4>Storage</h4>
                                        <div class="option-buttons" id="storageOptions">
                                            <!-- Storage options will be populated here -->
                                        </div>
                                    </div>
                                    
                                    <div class="option-group">
                                        <h4>Color</h4>
                                        <div class="option-buttons" id="colorOptions">
                                            <!-- Color options will be populated here -->
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Key Specs -->
                                <div class="key-specs">
                                    <h4>Key Specs</h4>
                                    <div class="key-specs-grid" id="keySpecsGrid">
                                        <!-- Key specs will be populated here -->
                                    </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="product-actions">
                                    <button class="action-btn wishlist-btn" id="wishlistBtn">
                                        Add to Wishlist
                                    </button>
                                    <button class="action-btn compare-btn" id="compareBtn">
                                        Compare
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Price Comparison Section -->
                    <div class="price-comparison">
                        <h3>
                            <i class="fas fa-chart-line"></i>
                            Price Comparison
                        </h3>
                        <div class="price-list" id="priceList">
                            <!-- Price items will be populated here -->
                        </div>
                    </div>

                    <!-- Product Description -->
                    <div class="product-description">
                        <h3>
                            <i class="fas fa-info-circle"></i>
                            Description
                        </h3>
                        <div id="productDescription">
                            <!-- Description will be populated here -->
                        </div>
                    </div>

                    <!-- Product Specifications -->
                    <div class="product-specifications">
                        <h3>
                            <i class="fas fa-cogs"></i>
                            Specifications
                        </h3>
                        <div class="specs-list" id="specsList">
                            <!-- Specifications will be populated here -->
                        </div>
                    </div>

                    <!-- Price History Graph -->
                    <div class="price-history">
                        <div class="price-history-header">
                            <h3>
                                <i class="fas fa-chart-line"></i>
                                Price History
                            </h3>
                            <div class="time-filter-buttons">
                                <button class="time-filter-btn active" data-period="30">30 Days</button>
                                <button class="time-filter-btn" data-period="90">3 Months</button>
                                <button class="time-filter-btn" data-period="180">6 Months</button>
                                <button class="time-filter-btn" data-period="365">12 Months</button>
                            </div>
                        </div>
                        <div class="price-chart-container">
                            <div class="price-chart" id="priceChart">
                                <!-- Price history chart will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert content into main element
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = mainContent;
        }
    }

    attachEventListeners() {
        // Event listeners for other functionality
    }

    async loadProductData(category = 'smartphones') {
        try {
            this.showLoading();
            
            // Detect if this is a tablet page or smartphone page
            const isTabletPage = window.location.pathname.includes('tablet-info.html');
            const apiEndpoint = isTabletPage ? 'tablets' : 'smartphones';
            
            // Construct URL with category parameter
            const url = new URL(`https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/${apiEndpoint}`);
            url.searchParams.append('category', category);
            
            // Fetch all products from the API
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const products = await response.json();
            
            // Find the specific product by ID
            this.productData = products.find(product => product.product_id === this.productId);
            
            if (!this.productData) {
                throw new Error('Product not found');
            }
            
            await this.displayProductData();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading product data:', error);
            this.showError('Failed to load product data. Please try again.');
        }
    }

    async displayProductData() {
        if (!this.productData) return;

        // Update breadcrumb
        const productName = this.productData.model || this.productData.title || 'Product Details';
        document.getElementById('productBreadcrumb').textContent = productName;

        // Update product title and brand
        document.getElementById('productTitle').textContent = this.productData.model || this.productData.title || 'Unknown Product';
        document.getElementById('productBrand').textContent = this.productData.brand || 'Unknown Brand';

        // Update main image
        this.updateProductImages();

        // Update storage and color options
        await this.updateProductOptions();

        // Update key specs
        this.updateKeySpecs();


        // Update price comparison
        this.updatePriceComparison();

        // Update description
        this.updateProductDescription();

        // Update specifications
        this.updateProductSpecifications();

        // Update price history chart
        this.updatePriceHistoryChart();

        // Add event listeners for time filter buttons
        this.initializeTimeFilters();

        // Add event listeners for action buttons
        this.initializeActionButtons();

        // Show content
        document.getElementById('productContent').style.display = 'block';
    }

    updateProductImages() {
        const mainImage = document.getElementById('productMainImage');
        
        // Get all available images
        const images = this.getProductImages();
        
        if (images.length > 0) {
            // Set main image
            mainImage.src = images[0];
            mainImage.alt = this.productData.model || this.productData.title || 'Product Image';
        } else {
            // Use placeholder image
            mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image';
        }
    }

    getProductImages() {
        const images = [];
        
        // Check various possible image properties
        if (this.productData.imageUrl) images.push(this.productData.imageUrl);
        if (this.productData.image) images.push(this.productData.image);
        if (this.productData.img) images.push(this.productData.img);
        if (this.productData.images && Array.isArray(this.productData.images)) {
            images.push(...this.productData.images);
        }
        
        return images;
    }


    async updateProductOptions() {
        // Update storage options
        this.updateStorageOptions();
        
        // Update color options
        await this.updateColorOptions();
    }

    async updateStorageOptions() {
        const storageContainer = document.getElementById('storageOptions');
        
        if (!storageContainer || !this.productData) {
            return;
        }

        try {
            console.log('Initializing storage selection for product:', this.productData.product_id);
            
            // Fetch all products from API to find available storage variants
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const allProducts = await response.json();
            console.log('Fetched', allProducts.length, 'products from API for storage selection');

            // Find storage variants for the current product (same model and color)
            const currentModel = this.productData.model;
            const currentColor = this.productData.color;
            
            console.log('Looking for storage variants for:', { model: currentModel, color: currentColor });

            // Find all products with the same model and color
            const modelColorVariants = allProducts.filter(product => 
                product.model === currentModel && product.color === currentColor
            );

            console.log('Found', modelColorVariants.length, 'storage variants for this model and color');
            modelColorVariants.forEach(variant => {
                console.log('Variant:', variant.product_id, 'storage:', variant.product_id.match(/-(\d+)(?:gb|tb)/i)?.[0]);
            });

            // Get storage options from PHONE_STORAGE constant with flexible matching
            let allStorageOptions = PHONE_STORAGE[currentModel];
            
            // If exact match not found, try flexible matching
            if (!allStorageOptions) {
                console.log('Exact model match not found for:', currentModel);
                console.log('Available models in PHONE_STORAGE:', Object.keys(PHONE_STORAGE));
                
                // Try to find a partial match
                const matchingModel = Object.keys(PHONE_STORAGE).find(model => 
                    model.toLowerCase().includes(currentModel.toLowerCase()) || 
                    currentModel.toLowerCase().includes(model.toLowerCase())
                );
                
                if (matchingModel) {
                    console.log('Found flexible match:', matchingModel);
                    allStorageOptions = PHONE_STORAGE[matchingModel];
                } else {
                    console.log('No flexible match found, using default storage options');
                    allStorageOptions = [
                        { size: '256GB', suffix: '256gb' },
                        { size: '512GB', suffix: '512gb' },
                        { size: '1TB', suffix: '1tb' }
                    ];
                }
            }
            
            // Convert to the expected format if needed
            if (allStorageOptions && allStorageOptions[0] && allStorageOptions[0].size) {
                allStorageOptions = allStorageOptions.map(option => ({
                    value: option.size,
                    suffix: option.suffix
                }));
            }

            // Check availability for each storage option
            const storageOptions = allStorageOptions.map(option => {
                const isAvailable = modelColorVariants.some(variant => 
                    variant.product_id.toLowerCase().includes(option.suffix)
                );
                
                console.log(`Storage ${option.value}: ${isAvailable ? 'Available' : 'Not Available'}`);
                
                return {
                    value: option.value,
                    suffix: option.suffix,
                    available: isAvailable,
                    price: 0 // We'll get real prices from the API data
                };
            });

            storageContainer.innerHTML = '';
            
            storageOptions.forEach((option, index) => {
                const button = document.createElement('button');
                const isCurrentStorage = this.productData.product_id.toLowerCase().includes(option.suffix);
                
                button.className = `option-btn storage-btn ${isCurrentStorage ? 'active' : ''} ${!option.available ? 'disabled' : ''}`;
                button.textContent = option.value;
                button.dataset.storage = option.value;
                button.dataset.suffix = option.suffix;
                button.disabled = !option.available;
                
                // Style unavailable options
                if (!option.available) {
                    button.style.opacity = '0.4';
                    button.style.cursor = 'not-allowed';
                    button.style.textDecoration = 'line-through';
                    button.innerHTML = `${option.value} <span class="unavailable-indicator">(Unavailable)</span>`;
                } else {
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    button.style.textDecoration = 'none';
                }
                
                button.addEventListener('click', () => {
                    console.log('Storage button clicked:', option.value, 'Available:', option.available);
                    if (option.available) {
                        this.selectStorage(button);
                    } else {
                        this.showNotification(`${option.value} is currently unavailable`, 'warning');
                    }
                });
                storageContainer.appendChild(button);
            });

            console.log('Storage selection initialized with availability checking');

        } catch (error) {
            console.error('Error initializing storage selection:', error);
            // Fallback to showing all options as available
            this.updateStorageOptionsFallback();
        }
    }

    updateStorageOptionsFallback() {
        const storageContainer = document.getElementById('storageOptions');
        
        // Fallback: Get storage options from PHONE_STORAGE constant with flexible matching
        const currentModel = this.productData?.model || 'Galaxy S25 Ultra';
        let modelStorageOptions = PHONE_STORAGE[currentModel];
        
        // If exact match not found, try flexible matching
        if (!modelStorageOptions) {
            console.log('Fallback: Exact model match not found for:', currentModel);
            const matchingModel = Object.keys(PHONE_STORAGE).find(model => 
                model.toLowerCase().includes(currentModel.toLowerCase()) || 
                currentModel.toLowerCase().includes(model.toLowerCase())
            );
            
            if (matchingModel) {
                console.log('Fallback: Found flexible match:', matchingModel);
                modelStorageOptions = PHONE_STORAGE[matchingModel];
            } else {
                console.log('Fallback: No match found, using default storage options');
                modelStorageOptions = [
                    { size: '256GB', suffix: '256gb' },
                    { size: '512GB', suffix: '512gb' },
                    { size: '1TB', suffix: '1tb' }
                ];
            }
        }
        
        const storageOptions = modelStorageOptions.map(option => ({
            value: option.size,
            price: 0,
            available: true
        }));
        
        storageContainer.innerHTML = '';
        
        storageOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = `option-btn storage-btn ${index === 0 ? 'active' : ''} ${!option.available ? 'disabled' : ''}`;
            button.textContent = option.value;
            button.dataset.storage = option.value;
            button.dataset.price = option.price;
            button.disabled = !option.available;
            
            // Add availability indicator
            if (!option.available) {
                button.innerHTML = `${option.value} <span class="unavailable-indicator">(Unavailable)</span>`;
            }
            
            button.addEventListener('click', () => {
                console.log('Storage button clicked:', option.value, 'Available:', option.available);
                if (option.available) {
                    this.selectStorage(button);
                } else {
                    this.showNotification(`${option.value} is currently unavailable`, 'warning');
                }
            });
            storageContainer.appendChild(button);
        });
    }

    async updateColorOptions() {
        const colorContainer = document.getElementById('colorOptions');
        
        if (!colorContainer || !this.productData) {
            return;
        }

        try {
            console.log('Initializing color selection for product:', this.productData.product_id);
            
            // Fetch all products from API to find available color variants
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const allProducts = await response.json();
            console.log('Fetched', allProducts.length, 'products from API for color selection');

            // Determine current model
            let currentModel = this.productData.model;
            if (!currentModel) {
                // Fallback: try to determine model from product ID
                if (this.productData.product_id.includes('galaxy-s25-ultra')) {
                    currentModel = 'Galaxy S25 Ultra';
                } else if (this.productData.product_id.includes('galaxy-s25-plus')) {
                    currentModel = 'Galaxy S25+';
                } else if (this.productData.product_id.includes('galaxy-s25')) {
                    currentModel = 'Galaxy S25';
                } else if (this.productData.product_id.includes('galaxy-z-fold7')) {
                    currentModel = 'Galaxy Z Fold7';
                } else if (this.productData.product_id.includes('galaxy-z-flip7-fe')) {
                    currentModel = 'Galaxy Z Flip7 FE';
                } else if (this.productData.product_id.includes('galaxy-z-flip7')) {
                    currentModel = 'Galaxy Z Flip7';
                } else if (this.productData.product_id.includes('iphone-16-pro-max')) {
                    currentModel = 'iPhone 16 Pro Max';
                } else if (this.productData.product_id.includes('iphone-16-pro')) {
                    currentModel = 'iPhone 16 Pro';
                } else if (this.productData.product_id.includes('iphone-16-plus')) {
                    currentModel = 'iPhone 16 Plus';
                } else if (this.productData.product_id.includes('iphone-16')) {
                    currentModel = 'iPhone 16';
                } else if (this.productData.product_id.includes('iphone-15-plus')) {
                    currentModel = 'iPhone 15 Plus';
                } else if (this.productData.product_id.includes('iphone-15')) {
                    currentModel = 'iPhone 15';
                } else if (this.productData.product_id.includes('iphone-16e')) {
                    currentModel = 'iPhone 16e';
                }
            }

            console.log('Current model:', currentModel);

            // Find color variants for this model using flexible matching
            let colorVariants = [];
            
            if (currentModel) {
                // Strategy: Find ALL color variants for this model (any storage size)
                const allModelVariants = allProducts.filter(product => {
                    if (currentModel.startsWith('Galaxy')) {
                        // For Galaxy models, check if product ID contains the model string
                        if (currentModel === 'Galaxy Z Fold7') {
                            return product.product_id.includes('galaxy-z-fold7') && !product.product_id.includes('galaxy-z-flip7');
                        } else if (currentModel === 'Galaxy Z Flip7 FE') {
                            return product.product_id.includes('galaxy-z-flip7-fe');
                        } else if (currentModel === 'Galaxy Z Flip7') {
                            return product.product_id.includes('galaxy-z-flip7') && !product.product_id.includes('galaxy-z-flip7-fe');
                        } else if (currentModel === 'Galaxy S25 Ultra') {
                            return product.product_id.includes('galaxy-s25-ultra');
                        } else if (currentModel === 'Galaxy S25+') {
                            return product.product_id.includes('galaxy-s25-plus');
                        } else if (currentModel === 'Galaxy S25') {
                            return product.product_id.includes('galaxy-s25') &&
                                   !product.product_id.includes('galaxy-s25-plus') &&
                                   !product.product_id.includes('galaxy-s25-ultra');
                        }
                    } else {
                        // For iPhone models, use existing logic
                        const productParts = product.product_id.split('-');
                        const productBrand = productParts[0];
                        const productModel = productParts.slice(1, 3).join('-');

                        // Handle both "pro" and "pro-max" submodels for comparison
                        let productSubmodel = productParts[3];
                        if (productParts[4] && productParts[4].startsWith('max')) {
                            productSubmodel = `${productParts[3]}-${productParts[4]}`;
                        }

                        const currentParts = this.productData.product_id.split('-');
                        const currentBrand = currentParts[0];
                        const currentModelParts = currentParts.slice(1, 3).join('-');
                        let currentSubmodel = currentParts[3];
                        if (currentParts[4] && currentParts[4].startsWith('max')) {
                            currentSubmodel = `${currentParts[3]}-${currentParts[4]}`;
                        }

                        const isModelMatch = productBrand === currentBrand &&
                                            productModel === currentModelParts &&
                                            productSubmodel === currentSubmodel;

                        return isModelMatch;
                    }
                });

                // Group by color and pick one variant per color (preferably same storage size, or any available)
                const colorGroups = {};
                allModelVariants.forEach(product => {
                    if (!colorGroups[product.color]) {
                        colorGroups[product.color] = [];
                    }
                    colorGroups[product.color].push(product);
                });

                // For each color, select the best variant (prefer same storage size as current, otherwise any)
                const currentStorageMatch = this.productData.product_id.match(/-(\d+)(?:gb|tb)/i);
                const currentStorage = currentStorageMatch ? currentStorageMatch[1] + (this.productData.product_id.includes('tb') ? 'tb' : 'gb') : '';

                colorVariants = [];
                Object.keys(colorGroups).forEach(color => {
                    const variants = colorGroups[color];

                    // Try to find same storage size first
                    let selectedVariant = variants.find(v => v.product_id.toLowerCase().includes(currentStorage.toLowerCase()));

                    // If no same storage size, pick the first available
                    if (!selectedVariant) {
                        selectedVariant = variants[0];
                    }

                    // Don't include current product
                    if (selectedVariant.product_id !== this.productData.product_id) {
                        colorVariants.push(selectedVariant);
                    }
                });

                // Add current product back to the list so all colors are shown
                colorVariants.push(this.productData);
            }

            console.log('Found', colorVariants.length, 'color variants:', colorVariants.map(p => ({id: p.product_id, color: p.color})));

            if (colorVariants.length === 0) {
                console.log('No color variants found for this product - hiding color selection');
                colorContainer.style.display = 'none';
                return;
            }

            // Show color selection section
            colorContainer.style.display = 'block';

            // Clear existing buttons
            colorContainer.innerHTML = '';

            // Style the color buttons container for Amazon-style layout
            colorContainer.style.display = 'flex';
            colorContainer.style.flexWrap = 'wrap';
            colorContainer.style.justifyContent = 'flex-start';
            colorContainer.style.gap = '12px';
            colorContainer.style.marginTop = '12px';
            colorContainer.style.padding = '0';

            // Create color buttons for available variants
            colorVariants.forEach((variant) => {
                const button = document.createElement('button');
                button.className = 'color-btn';
                button.setAttribute('data-color', variant.color);
                button.setAttribute('data-product-id', variant.product_id);

                // Check if this is the current product's color
                const isSelected = this.productData.product_id === variant.product_id;
                if (isSelected) {
                    button.classList.add('active');
                }

                // Get color hex from IPHONE_COLORS or use default
                let colorHex = '#cccccc'; // default gray
                const colorData = this.findColorData(variant.color);
                if (colorData) {
                    colorHex = colorData.hex;
                }

                // Format color name with line break
                const formattedColorName = variant.color.replace(' Titanium', '<br>Titanium');

                button.innerHTML = `
                    <div class="color-indicator" style="background-color: ${colorHex};"></div>
                    <span class="color-name">${formattedColorName}</span>
                `;

                // Add active class if this is the selected color
                if (isSelected) {
                    button.classList.add('active');
                }

                // Apply Amazon-style button styling
                // Button styling is now handled by CSS classes

                // Hover effects are now handled by CSS

                // Add click event listener
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    // Add visual feedback
                    button.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);

                    this.selectColorFromAPI(variant.product_id, variant.color);
                });

                colorContainer.appendChild(button);
            });

            console.log('Color selection initialized with', colorVariants.length, 'variants');

        } catch (error) {
            console.error('Error initializing color selection:', error);
            colorContainer.style.display = 'none';
        }
    }

    selectStorage(button) {
        console.log('selectStorage called with button:', button);
        
        // Remove active class from all storage buttons
        document.querySelectorAll('.storage-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        button.classList.add('active');
        
        // Get the selected storage
        const selectedStorage = button.dataset.storage;
        
        console.log('Selected storage:', selectedStorage);
        
        // Load the real product data for the selected storage variant
        this.loadStorageVariantData(selectedStorage);
    }

    async loadStorageVariantData(selectedStorage) {
        try {
            // Show loading state
            this.showLoading();

            console.log('Loading storage variant data for:', selectedStorage);

            // Fetch all products from API
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const products = await response.json();
            console.log('API returned', products.length, 'products');

            // Find the storage variant by constructing the product ID
            const currentColor = this.productData.color || 'Titanium Silverblue';
            const colorSuffix = currentColor.toLowerCase().replace(/\s+/g, '-');
            const storageSuffix = selectedStorage.toLowerCase();
            
            // Construct the new product ID
            const newProductId = `samsung-galaxy-s25-ultra-${storageSuffix}-${colorSuffix}`;
            console.log('Looking for product ID:', newProductId);

            // Find the exact product match
            const newProduct = products.find(product => product.product_id === newProductId);

            if (!newProduct) {
                console.error('Storage variant not found in API:', newProductId);
                this.hideLoading();
                this.showNotification(`The ${selectedStorage} variant could not be found. Please refresh the page and try again.`, 'error');
                return;
            }

            // Update current product with the API data
            this.productData = newProduct;

            // Update the page URL without reloading
            const newUrl = `${window.location.pathname}?id=${newProductId}`;
            window.history.pushState({}, '', newUrl);

            // Redisplay all product information with real API data
            console.log('About to update all product information for storage...');
            try {
                await this.updateAllProductInformation(newProduct, currentColor);
                console.log('Product information updated successfully');
                console.log(`Successfully switched to ${selectedStorage} variant!`);
            } catch (updateError) {
                console.error('Error updating product information:', updateError);
                // Even if update fails, we should still hide loading and show the product content
                const productContent = document.getElementById('productContent');
                if (productContent) {
                    productContent.style.display = 'block';
                }
                this.showNotification(`Storage changed to ${selectedStorage}, but some details may not have updated. Please refresh the page if needed.`, 'warning');
            }

            // Always hide loading state
            this.hideLoading();

        } catch (error) {
            console.error('Error switching storage:', error);
            this.hideLoading();
            this.showNotification(`Failed to load ${selectedStorage} variant. Error: ${error.message}`, 'error');
        }
    }

    updateProductForStorage(storage, priceIncrease) {
        // Update the product title to show selected storage
        this.updateProductTitleForStorage(storage);
        
        // Update the displayed prices with storage price increase
        this.updatePriceDisplay(priceIncrease);
        
        // Update the specs to show the selected storage
        this.updateStorageInSpecs(storage);
    }

    updateProductTitleForStorage(storage) {
        // Update the product title to include the selected storage
        const productTitle = document.querySelector('.product-title h1');
        if (productTitle && this.productData) {
            const baseTitle = this.productData.model || 'Galaxy S25 Ultra';
            // Remove any existing storage info and add new one
            const titleWithoutStorage = baseTitle.replace(/\s*-\s*\d+GB$/, '');
            productTitle.textContent = `${titleWithoutStorage} - ${storage}`;
        }
    }

    updatePriceDisplay(priceIncrease) {
        // Update all price displays with the storage price increase
        const priceElements = document.querySelectorAll('.price, .current-price, .product-price .price');
        priceElements.forEach(element => {
            const currentPrice = this.getLowestPrice(this.productData);
            if (currentPrice > 0) {
                const newPrice = currentPrice + priceIncrease;
                const formattedPrice = newPrice.toLocaleString('en-ZA', { 
                    style: 'currency', 
                    currency: 'ZAR', 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                });
                element.textContent = formattedPrice;
            }
        });
    }

    updateStorageInSpecs(storage) {
        // Update the storage specification in the specs display
        const storageSpec = document.querySelector('[data-spec="Storage"] .spec-value');
        if (storageSpec) {
            storageSpec.textContent = storage;
        }
    }

    selectColor(button) {
        // Remove active class from all color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        button.classList.add('active');
        
        // Get the selected color
        const selectedColor = button.dataset.color;
        const colorName = button.dataset.colorName;
        
        // Load the real product data for the selected color variant
        this.loadColorVariantData(selectedColor, colorName);
    }

    async loadColorVariantData(color, colorName) {
        try {
            // Show loading state
            this.showLoading();
            
            // Create the product ID for the color variant
            const colorVariantId = this.createColorVariantId(color);
            
            // Fetch all products from the API (same as loadProductData)
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const allProducts = await response.json();
            
            // Debug: Log available product IDs
            console.log('Available product IDs:', allProducts.map(p => p.product_id || p.id));
            console.log('Looking for color variant ID:', colorVariantId);
            
            // Find the color variant product by ID
            const colorVariantData = allProducts.find(product => 
                (product.product_id || product.id) === colorVariantId
            );
            
            if (!colorVariantData) {
                console.error('Color variant not found. Available IDs:', allProducts.map(p => p.product_id || p.id));
                console.log('Falling back to current product data with color update');
                
                // Fallback: Use current product data but update color-specific information
                this.updateProductForColorFallback(color, colorName);
                this.hideLoading();
                return;
            }
            
            // Update the current product data with the color variant data
            this.productData = colorVariantData;
            
            // Update all product information with the new data
            await this.updateAllProductInformation(colorVariantData, colorName);
            
            // Hide loading state
            this.hideLoading();
            
            // Show success notification
            this.showNotification(`Color changed to: ${colorName}`, 'success');
            
        } catch (error) {
            console.error('Error loading color variant data:', error);
            this.hideLoading();
            this.showNotification('Failed to load color variant data', 'error');
        }
    }

    createColorVariantId(color) {
        // Map color options to actual product IDs from your database
        // These are the exact IDs that exist in your database
        switch (color) {
            case 'titanium-silverblue':
                return 'samsung-galaxy-s25-ultra-256gb-titanium-silverblue';
            case 'titanium-gray':
                // titanium-gray doesn't exist in your database, using silverblue as fallback
                return 'samsung-galaxy-s25-ultra-256gb-titanium-silverblue';
            case 'titanium-black':
                return 'samsung-galaxy-s25-ultra-512gb-titanium-black';
            case 'titanium-whitesilver':
                return 'samsung-galaxy-s25-ultra-512gb-titanium-whitesilver';
            default:
                return this.productId; // Fallback to current product ID
        }
    }

    getCurrentStorage() {
        // Get the currently selected storage
        const activeStorageBtn = document.querySelector('.storage-btn.active');
        return activeStorageBtn ? activeStorageBtn.dataset.storage.toLowerCase() : '256gb';
    }

    async updateAllProductInformation(productData, colorName) {
        try {
            console.log('Updating product title...');
            try {
                this.updateProductTitleForColor(colorName);
                console.log('✓ Product title updated');
            } catch (error) {
                console.error('✗ Error updating product title:', error);
            }
            
            console.log('Updating product image...');
            try {
                this.updateProductImageForColor(productData.color || 'titanium-silverblue');
                console.log('✓ Product image updated');
            } catch (error) {
                console.error('✗ Error updating product image:', error);
            }
            
            console.log('Updating product description...');
            try {
                this.updateProductDescription(productData.description);
                console.log('✓ Product description updated');
            } catch (error) {
                console.error('✗ Error updating product description:', error);
            }
            
            console.log('Updating product prices...');
            try {
                this.updateProductPrices(productData.offers);
                console.log('✓ Product prices updated');
            } catch (error) {
                console.error('✗ Error updating product prices:', error);
            }
            
            console.log('Updating key specs...');
            try {
                this.updateKeySpecs(productData.specs);
                console.log('✓ Key specs updated');
            } catch (error) {
                console.error('✗ Error updating key specs:', error);
            }
            
            console.log('Updating all specifications...');
            try {
                this.updateAllSpecifications(productData.specs);
                console.log('✓ All specifications updated');
            } catch (error) {
                console.error('✗ Error updating all specifications:', error);
            }
            
            console.log('Updating product options...');
            try {
                await this.updateProductOptions();
                console.log('✓ Product options updated');
            } catch (error) {
                console.error('✗ Error updating product options:', error);
            }
            
            console.log('All product information updated successfully');
            
            // Show the product content
            const productContent = document.getElementById('productContent');
            if (productContent) {
                productContent.style.display = 'block';
                console.log('✓ Product content shown');
            }
        } catch (error) {
            console.error('Error in updateAllProductInformation:', error);
            throw error;
        }
    }

    updateProductDescription(description) {
        const descriptionElement = document.getElementById('productDescription');
        if (descriptionElement && description) {
            descriptionElement.textContent = description;
        }
    }

    updateProductPrices(offers) {
        if (!offers || offers.length === 0) return;
        
        // Update the main price display
        const lowestPrice = Math.min(...offers.map(offer => offer.price).filter(price => typeof price === 'number' && price > 0));
        const formattedPrice = lowestPrice.toLocaleString('en-ZA', { 
            style: 'currency', 
            currency: 'ZAR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
        
        // Update all price elements
        const priceElements = document.querySelectorAll('.price, .current-price, .product-price .price');
        priceElements.forEach(element => {
            element.textContent = formattedPrice;
        });
        
        // Update the price comparison section
        this.updatePriceComparison(offers);
    }

    updatePriceComparison(offers) {
        const priceComparisonContainer = document.querySelector('.price-comparison .price-list');
        if (!priceComparisonContainer || !offers) return;
        
        priceComparisonContainer.innerHTML = '';
        
        offers.forEach(offer => {
            const priceItem = this.createPriceItem(offer);
            priceComparisonContainer.appendChild(priceItem);
        });
    }

    updateKeySpecs(specs) {
        const keySpecsGrid = document.getElementById('keySpecsGrid');
        if (!keySpecsGrid || !specs) return;
        
        // Update key specifications with new data
        const keySpecs = [
            { label: 'Display', value: specs.Display?.Main?.Size || '6.9-inch' },
            { label: 'Camera', value: specs.Camera?.Rear_Main || '200MP' },
            { label: 'Storage', value: specs.Performance?.Storage || '256GB' },
            { label: 'RAM', value: specs.Performance?.Ram || '12GB' },
            { label: 'Battery', value: specs.Battery?.Capacity || '5000mAh' },
            { label: 'Processor', value: specs.Performance?.Processor || 'Octa-Core' }
        ];
        
        keySpecsGrid.innerHTML = '';
        
        keySpecs.forEach(spec => {
            const specElement = document.createElement('div');
            specElement.className = 'key-spec-item';
            specElement.innerHTML = `
                <div class="spec-label">${spec.label}</div>
                <div class="spec-value">${spec.value}</div>
            `;
            keySpecsGrid.appendChild(specElement);
        });
    }

    updateAllSpecifications(specs) {
        // Update all specification sections with the new data
        Object.keys(specs).forEach(category => {
            const categoryElement = document.querySelector(`[data-category="${category}"]`);
            if (categoryElement) {
                this.updateSpecificationCategory(categoryElement, specs[category]);
            }
        });
    }

    updateSpecificationCategory(categoryElement, categoryData) {
        const specsList = categoryElement.querySelector('.specs-list');
        if (!specsList) return;
        
        specsList.innerHTML = '';
        
        if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
            Object.keys(categoryData).forEach(specKey => {
                const specValue = categoryData[specKey];
                const specItem = document.createElement('div');
                specItem.className = 'spec-item';
                specItem.innerHTML = `
                    <span class="spec-name">${this.formatSpecName(specKey)}</span>
                    <span class="spec-value">${Array.isArray(specValue) ? specValue.join(', ') : specValue}</span>
                `;
                specsList.appendChild(specItem);
            });
        } else if (Array.isArray(categoryData)) {
            categoryData.forEach(item => {
                const specItem = document.createElement('div');
                specItem.className = 'spec-item';
                specItem.innerHTML = `
                    <span class="spec-name">${item}</span>
                `;
                specsList.appendChild(specItem);
            });
        }
    }

    formatSpecName(specName) {
        return specName.replace(/([A-Z])/g, ' $1')
                      .replace(/_/g, ' ')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
    }

    updateProductForColorFallback(color, colorName) {
        // Fallback method when color variant doesn't exist in database
        // Update only the visual elements and basic information
        
        // Update product title
        this.updateProductTitleForColor(colorName);
        
        // Update product image
        this.updateProductImageForColor(color);
        
        // Update product description to mention the color
        const descriptionElement = document.querySelector('.product-description p');
        if (descriptionElement && this.productData) {
            const baseDescription = this.productData.description || '';
            const colorDescription = baseDescription.replace(/in \w+ finish/i, `in ${colorName.replace(/<br>/g, ' ')} finish`);
            descriptionElement.textContent = colorDescription;
        }
        
        // Show notification
        this.showNotification(`Color changed to: ${colorName}`, 'success');
    }

    updateProductTitleForColor(colorName) {
        // Update the product title to include the selected color
        const productTitle = document.getElementById('productTitle');
        if (productTitle && this.productData) {
            const baseTitle = this.productData.model || 'Galaxy S25 Ultra';
            const cleanColorName = colorName.replace(/<br>/g, ' ');
            productTitle.textContent = `${baseTitle} - ${cleanColorName}`;
        }
    }

    updateProductImageForColor(color) {
        const mainImage = document.getElementById('productMainImage');
        if (!mainImage || !this.productData) return;
        
        // Create color-specific image URLs based on the actual database structure
        const baseImageUrl = this.productData.imageUrl || this.productData.image || '';
        let colorImageUrl = baseImageUrl;
        
        // For Samsung Galaxy S25 Ultra, use the actual color-specific image URLs from the database
        if (this.productData.model && this.productData.model.toLowerCase().includes('s25 ultra')) {
            switch (color) {
                case 'titanium-silverblue':
                    colorImageUrl = 'https://comparehub-smartphone-images.s3.af-south-1.amazonaws.com/phones/SAMSUNG/s25+ultra/za-galaxy-s25Titanium+Silverblue.png';
                    break;
                case 'titanium-gray':
                    colorImageUrl = 'https://comparehub-smartphone-images.s3.af-south-1.amazonaws.com/phones/SAMSUNG/s25+ultra/za-galaxy-s25Titanium+Gray.png';
                    break;
                case 'titanium-black':
                    colorImageUrl = 'https://comparehub-smartphone-images.s3.af-south-1.amazonaws.com/phones/SAMSUNG/s25+ultra/za-galaxy-s25Titanium+Black.png';
                    break;
                case 'titanium-whitesilver':
                    colorImageUrl = 'https://comparehub-smartphone-images.s3.af-south-1.amazonaws.com/phones/SAMSUNG/s25+ultra/za-galaxy-s25Titanium+Whitesilver.png';
                    break;
                default:
                    colorImageUrl = baseImageUrl;
            }
        }
        
        // Update the image with a smooth transition
        mainImage.style.opacity = '0.7';
        mainImage.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            mainImage.src = colorImageUrl;
            mainImage.alt = `${this.productData.model} - ${color}`;
            
            // Handle image load error - fallback to original image
            mainImage.onerror = () => {
                mainImage.src = baseImageUrl;
                mainImage.alt = this.productData.model;
            };
            
            // Restore opacity
            setTimeout(() => {
                mainImage.style.opacity = '1';
            }, 100);
        }, 150);
    }

    updatePriceWithOptions(priceIncrease) {
        // This method would update the displayed prices based on selected options
        // For now, we'll just show a notification
        if (priceIncrease > 0) {
            this.showNotification(`Price increased by R${priceIncrease.toLocaleString()}`, 'info');
        }
    }

    updateKeySpecs() {
        const keySpecsGrid = document.getElementById('keySpecsGrid');
        
        if (!this.productData.specs) {
            keySpecsGrid.innerHTML = '<p class="text-muted">No specifications available</p>';
            return;
        }

        const keySpecs = this.extractKeySpecs(this.productData.specs);
        keySpecsGrid.innerHTML = '';

        keySpecs.forEach(spec => {
            const specItem = document.createElement('div');
            specItem.className = 'key-spec-item';
            
            specItem.innerHTML = `
                <div class="key-spec-icon">
                    <i class="${spec.icon}"></i>
                </div>
                <div class="key-spec-content">
                    <div class="key-spec-label">${spec.label}</div>
                    <div class="key-spec-value">${spec.value}</div>
                </div>
            `;
            
            keySpecsGrid.appendChild(specItem);
        });
    }

    extractKeySpecs(specs) {
        const keySpecs = [];
        
        // Display specs
        if (specs.Display?.Main) {
            const display = specs.Display.Main;
            if (display.Size) {
                keySpecs.push({
                    label: 'Screen Size',
                    value: display.Size,
                    icon: this.category === 'tablets' ? 'fas fa-tablet-alt' : 'fas fa-mobile-alt'
                });
            }
            if (display.Resolution) {
                keySpecs.push({
                    label: 'Resolution',
                    value: display.Resolution,
                    icon: 'fas fa-tv'
                });
            }
        }
        
        // Performance specs
        if (specs.Performance) {
            if (specs.Performance.Ram) {
                keySpecs.push({
                    label: 'RAM',
                    value: specs.Performance.Ram,
                    icon: 'fas fa-memory'
                });
            }
            if (specs.Performance.Storage) {
                keySpecs.push({
                    label: 'Storage',
                    value: specs.Performance.Storage,
                    icon: 'fas fa-hdd'
                });
            }
        }
        
        // Camera specs
        if (specs.Camera?.Rear_Main) {
            keySpecs.push({
                label: 'Main Camera',
                value: specs.Camera.Rear_Main,
                icon: 'fas fa-camera'
            });
        }
        
        // Battery specs
        if (specs.Battery?.Capacity) {
            keySpecs.push({
                label: 'Battery',
                value: specs.Battery.Capacity,
                icon: 'fas fa-battery-full'
            });
        }
        
        // Operating System
        if (specs.Operating_System) {
            keySpecs.push({
                label: 'OS',
                value: specs.Operating_System,
                icon: 'fab fa-android'
            });
        }
        
        // Processor
        if (specs.Processor) {
            keySpecs.push({
                label: 'Processor',
                value: specs.Processor,
                icon: 'fas fa-microchip'
            });
        }
        
        return keySpecs.slice(0, 6); // Limit to 6 key specs
    }


    updatePriceComparison() {
        const priceList = document.getElementById('priceList');
        
        if (!this.productData.offers || this.productData.offers.length === 0) {
            priceList.innerHTML = '<p class="text-muted">No price information available</p>';
            return;
        }

        // Sort offers by price
        const sortedOffers = [...this.productData.offers].sort((a, b) => a.price - b.price);
        const lowestPrice = sortedOffers[0].price;

        priceList.innerHTML = '';
        
        sortedOffers.forEach((offer, index) => {
            const isBestPrice = offer.price === lowestPrice;
            const priceItem = this.createPriceItem(offer, isBestPrice);
            priceList.appendChild(priceItem);
        });
    }

    createPriceItem(offer, isBestPrice) {
        const priceItem = document.createElement('div');
        priceItem.className = `price-item ${isBestPrice ? 'best-price' : ''}`;
        
        const formattedPrice = this.formatPrice(offer.price);
        const originalPrice = offer.originalPrice && offer.originalPrice > 0 ? this.formatPrice(offer.originalPrice) : null;
        
        priceItem.innerHTML = `
            <div class="price-item-info">
                <img src="${offer.logoUrl || 'https://via.placeholder.com/40x40?text=Store'}" 
                     alt="${offer.retailer}" class="price-item-logo">
                <div class="price-item-details">
                    <h5>${offer.retailer}</h5>
                    <p>${offer.saleEnds ? `Sale ends: ${offer.saleEnds}` : 'In Stock'}</p>
                </div>
            </div>
            <div class="price-item-price">
                <p class="price">${formattedPrice}</p>
                ${originalPrice ? `<p class="original-price">${originalPrice}</p>` : ''}
            </div>
            <div class="price-item-actions">
                <a href="${offer.url}" target="_blank" class="btn-visit-store">
                    <i class="fas fa-external-link-alt"></i>
                    Visit Store
                </a>
            </div>
        `;
        
        return priceItem;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    updateProductDescription() {
        const descriptionContainer = document.getElementById('productDescription');
        
        if (this.productData.description) {
            descriptionContainer.innerHTML = `
                <p>${this.productData.description}</p>
            `;
        } else if (this.productData.features && Array.isArray(this.productData.features)) {
            descriptionContainer.innerHTML = `
                <p>Key features of the ${this.productData.model || this.productData.title}:</p>
                <ul>
                    ${this.productData.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            `;
        } else {
            descriptionContainer.innerHTML = `
                <p>No detailed description available for this product.</p>
            `;
        }
    }

    updateProductSpecifications() {
        const specsList = document.getElementById('specsList');
        
        if (!this.productData.specs) {
            specsList.innerHTML = '<p class="text-muted">No specifications available</p>';
            return;
        }

        specsList.innerHTML = '';
        
        // Group specifications by category
        const specCategories = this.groupSpecificationsByCategory(this.productData.specs);
        
        Object.entries(specCategories).forEach(([category, specs]) => {
            // Add category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'spec-category-header';
            categoryHeader.innerHTML = `
                <h4>${category}</h4>
            `;
            specsList.appendChild(categoryHeader);
            
            // Add specs for this category
            specs.forEach(spec => {
                const specElement = this.createSpecItem(spec);
                specsList.appendChild(specElement);
            });
        });
    }

    groupSpecificationsByCategory(specifications) {
        const categories = {};
        
        Object.entries(specifications).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Handle nested objects (like Display.Main, Camera.Rear_Main, etc.)
                Object.entries(value).forEach(([subKey, subValue]) => {
                    // Skip if subValue is also an object (avoid nested objects in display)
                    if (typeof subValue === 'object' && subValue !== null && !Array.isArray(subValue)) {
                        // Handle deeply nested objects by flattening them
                        Object.entries(subValue).forEach(([deepKey, deepValue]) => {
                            const category = this.getSpecCategory(key);
                            if (!categories[category]) {
                                categories[category] = [];
                            }
                            categories[category].push({ 
                                key: this.formatSpecKey(`${subKey} ${deepKey}`), 
                                value: deepValue,
                                originalKey: `${key}.${subKey}.${deepKey}`
                            });
                        });
                    } else {
                        const category = this.getSpecCategory(key);
                        if (!categories[category]) {
                            categories[category] = [];
                        }
                        categories[category].push({ 
                            key: this.formatSpecKey(subKey), 
                            value: subValue,
                            originalKey: `${key}.${subKey}`
                        });
                    }
                });
            } else if (Array.isArray(value)) {
                // Handle arrays (like Features, Sensors, etc.)
                const category = this.getSpecCategory(key);
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ 
                    key: this.formatSpecKey(key), 
                    value: value,
                    isArray: true
                });
            } else {
                // Handle simple values
                const category = this.getSpecCategory(key);
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ 
                    key: this.formatSpecKey(key), 
                    value: value 
                });
            }
        });
        
        return categories;
    }

    getSpecCategory(specKey) {
        const categoryMap = {
            // Display
            'Display': 'Display',
            'screen_size': 'Display',
            'resolution': 'Display',
            'display_type': 'Display',
            'refresh_rate': 'Display',
            'brightness': 'Display',
            
            // Performance
            'Performance': 'Performance',
            'processor': 'Performance',
            'ram': 'Performance',
            'storage': 'Performance',
            'os': 'Performance',
            'chipset': 'Performance',
            'Os': 'Performance',
            
            // Camera
            'Camera': 'Camera',
            'camera_main': 'Camera',
            'camera_front': 'Camera',
            'camera_features': 'Camera',
            'video_recording': 'Camera',
            
            // Battery (separate category)
            'Battery': 'Battery',
            'battery': 'Battery',
            'charging': 'Battery',
            
            // Connectivity (separate category)
            'Connectivity': 'Connectivity',
            'Network': 'Connectivity',
            'connectivity': 'Connectivity',
            'wifi': 'Connectivity',
            'bluetooth': 'Connectivity',
            
            // Design & Build
            'Dimensions': 'Design & Build',
            'Durability': 'Design & Build',
            'Security': 'Design & Build',
            'dimensions': 'Design & Build',
            'weight': 'Design & Build',
            'colors': 'Design & Build',
            'material': 'Design & Build',
            
            // Audio (separate category)
            'Audio': 'Audio',
            'audio': 'Audio',
            
            // Sensors (separate category)
            'Sensors': 'Sensors',
            'sensors': 'Sensors',
            
            // Additional Features
            'AdditionalFeatures': 'Additional Features'
        };
        
        return categoryMap[specKey] || 'General';
    }

    createSpecItem(spec) {
        if (spec.isArray && Array.isArray(spec.value)) {
            // Handle arrays as feature lists
            const specItem = document.createElement('div');
            specItem.className = 'spec-item spec-item-array';
            
            const label = document.createElement('div');
            label.className = 'spec-label-array';
            label.textContent = spec.key;
            
            const valueContainer = document.createElement('div');
            valueContainer.className = 'spec-value-array';
            
            const featureList = document.createElement('ul');
            featureList.className = 'feature-list';
            
            spec.value.forEach(feature => {
                const listItem = document.createElement('li');
                listItem.textContent = feature;
                featureList.appendChild(listItem);
            });
            
            valueContainer.appendChild(featureList);
            specItem.appendChild(label);
            specItem.appendChild(valueContainer);
            return specItem;
        } else {
            // Handle simple key-value pairs
            const specItem = document.createElement('div');
            specItem.className = 'spec-item';
            
            const label = document.createElement('span');
            label.className = 'spec-label';
            label.textContent = spec.key;
            
            const value = document.createElement('span');
            value.className = 'spec-value';
            value.textContent = this.formatSpecValue(spec.value);
            
            specItem.appendChild(label);
            specItem.appendChild(value);
            return specItem;
        }
    }

    formatSpecKey(key) {
        return key.replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())
                  .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space between camelCase
                  .replace(/^Main$/, 'Display')
                  .replace(/^Cover$/, 'Cover Screen')
                  .replace(/^Rear Main$/, 'Main Camera')
                  .replace(/^Rear Ultra Wide$/, 'Ultra Wide Camera')
                  .replace(/^Rear Telephoto$/, 'Telephoto Camera')
                  .replace(/^Front Camera$/, 'Front Camera')
                  .replace(/^Cover Camera$/, 'Cover Camera');
    }

    formatSpecLabel(key) {
        return this.formatSpecKey(key);
    }

    formatSpecValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        
        if (typeof value === 'object' && value !== null) {
            // This shouldn't happen with our new grouping logic, but just in case
            return 'Complex data - see details';
        }
        
        // Handle null, undefined, or empty values
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        
        return String(value);
    }

    updatePriceHistoryChart(period = 30) {
        const priceChart = document.getElementById('priceChart');
        
        if (!this.productData.offers || this.productData.offers.length === 0) {
            priceChart.innerHTML = '<p class="text-muted">No price history available</p>';
            return;
        }

        priceChart.innerHTML = '';
        
        // Generate mock price history data (in real app, this would come from API)
        const priceHistory = this.generatePriceHistory(period);
        
        // Create the price chart
        this.createPriceChart(priceHistory, period);
    }

    generatePriceHistory(period = 30) {
        // Mock price history data - in real app, this would come from your API
        const currentPrice = this.getLowestPrice(this.productData);
        const history = [];
        
        // Generate price history for the specified period
        for (let i = period - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Simulate price fluctuations with more variation for longer periods
            const basePrice = currentPrice;
            const variationRange = period > 90 ? 0.15 : 0.1; // ±15% for longer periods, ±10% for shorter
            const variation = (Math.random() - 0.5) * variationRange;
            const price = Math.round(basePrice * (1 + variation));
            
            // Format date based on period length
            let formattedDate;
            if (period <= 30) {
                formattedDate = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
            } else if (period <= 90) {
                formattedDate = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
            } else {
                formattedDate = date.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
            }
            
            history.push({
                date: date.toISOString().split('T')[0],
                price: price,
                formattedDate: formattedDate
            });
        }
        
        return history;
    }

    initializeTimeFilters() {
        const filterButtons = document.querySelectorAll('.time-filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Get the period and update chart
                const period = parseInt(e.target.dataset.period);
                this.updatePriceHistoryChart(period);
            });
        });
        
        // Add resize listener for mobile optimization
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const activeButton = document.querySelector('.time-filter-btn.active');
                if (activeButton) {
                    const period = parseInt(activeButton.dataset.period);
                    this.updatePriceHistoryChart(period);
                }
            }, 250);
        });
    }

    initializeActionButtons() {
        const wishlistBtn = document.getElementById('wishlistBtn');
        const compareBtn = document.getElementById('compareBtn');
        
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => this.addToWishlist());
        }
        
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.addToCompare());
        }
    }

    addToWishlist() {
        const wishlistBtn = document.getElementById('wishlistBtn');
        const isInWishlist = wishlistBtn.classList.contains('active');
        
        if (isInWishlist) {
            // Remove from wishlist
            wishlistBtn.classList.remove('active');
            wishlistBtn.textContent = 'Add to Wishlist';
            this.showNotification('Removed from wishlist', 'info');
        } else {
            // Add to wishlist
            wishlistBtn.classList.add('active');
            wishlistBtn.textContent = 'In Wishlist';
            this.showNotification('Added to wishlist', 'success');
        }
    }

    addToCompare() {
        const compareBtn = document.getElementById('compareBtn');
        
        // Get current product data
        const currentProduct = this.productData;
        
        if (currentProduct) {
            // Open compare modal with current product
            if (typeof window.openCompareModal === 'function') {
                window.openCompareModal(currentProduct);
            } else if (typeof openCompareModal === 'function') {
                openCompareModal(currentProduct);
            } else {
                console.error('Compare modal function not available');
                this.showNotification('Compare feature not available', 'error');
            }
        } else {
            this.showNotification('Product data not loaded', 'error');
        }
    }

    createPriceChart(priceHistory, period = 30) {
        const container = document.getElementById('priceChart');

        if (!priceHistory || priceHistory.length === 0) {
            container.innerHTML = '<p class="text-muted">No price history available</p>';
            return;
        }

        // Load Chart.js if not already loaded
        if (!window.Chart) {
            this.loadChartJs().then(() => {
                this.createPriceChart(priceHistory, period);
            });
            return;
        }

        // Destroy existing chart if it exists
        if (this.priceHistoryChart) {
            this.priceHistoryChart.destroy();
        }

        // Setup canvas
        container.innerHTML = '';
        const isMobile = window.innerWidth <= 768;
        const chartHeight = isMobile ? (window.innerWidth < 480 ? '200px' : '250px') : '300px';
        container.style.height = chartHeight;
        container.style.position = 'relative';
        const canvas = document.createElement('canvas');
        canvas.id = 'priceChartCanvas';
        container.appendChild(canvas);

        // Prepare data
        const maxPoints = isMobile ? (period <= 30 ? 24 : 18) : (period <= 30 ? 40 : 30);
        const step = Math.max(1, Math.floor(priceHistory.length / maxPoints));
        const data = priceHistory.filter((_, i) => i % step === 0);

        // Generate labels based on period
        const labels = data.map((d, i) => {
            if (period <= 30) {
                // For 30 days: use "Day N"
                const dayNum = Math.max(1, Math.round(i * (period / Math.max(1, data.length - 1))));
                return `Day ${dayNum}`;
            } else {
                // For 3, 6, 12 months: use formatted date (e.g., "Jan 15" or "Jan '25")
                return d.formattedDate || `Day ${i + 1}`;
            }
        });

        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const midPrice = (minPrice + maxPrice) / 2;

        // Create the chart
        const ctx = canvas.getContext('2d');
        
        this.priceHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.productData.model || 'Product'} Price History`,
                    data: prices,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: (context) => {
                        const dataValue = context.dataset.data[context.dataIndex];
                        return dataValue < midPrice ? '#2e7d32' : '#c62828';
                    },
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 10,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                return context.dataset.label + ': ' + this.formatPrice(context.parsed.y);
                            }
                        },
                        padding: window.innerWidth < 768 ? 8 : 12,
                        titleFont: {
                            size: window.innerWidth < 768 ? 12 : 14
                        },
                        bodyFont: {
                            size: window.innerWidth < 768 ? 11 : 13
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false,
                            display: window.innerWidth < 480 ? false : true
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: window.innerWidth < 768 ? 10 : 12,
                                weight: '500'
                            },
                            maxTicksLimit: window.innerWidth < 480 ? 5 : (window.innerWidth < 768 ? 7 : 10),
                            autoSkip: true,
                            padding: window.innerWidth < 480 ? 10 : 0,
                            autoSkipPadding: window.innerWidth < 480 ? 15 : 0
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false,
                            tickLength: window.innerWidth < 480 ? 5 : 10
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: window.innerWidth < 768 ? 10 : 12,
                                weight: '500'
                            },
                            callback: (value) => {
                                if (window.innerWidth < 480) {
                                    return 'R' + Math.round(value/1000) + 'k';
                                }
                                return this.formatPrice(value);
                            },
                            maxTicksLimit: window.innerWidth < 480 ? 4 : 6
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                elements: {
                    line: {
                        borderWidth: window.innerWidth < 480 ? 2 : 3
                    },
                    point: {
                        radius: window.innerWidth < 480 ? 4 : (window.innerWidth < 768 ? 5 : 6),
                        hoverRadius: window.innerWidth < 480 ? 6 : (window.innerWidth < 768 ? 7 : 8),
                        hoverBorderWidth: window.innerWidth < 480 ? 2 : 4
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']
            }
        });

        // Add price statistics
        this.addPriceStatistics(container, prices);
        
        // Add legend
        this.addChartLegend(container);

        // Redraw on resize (debounced)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.createPriceChart(priceHistory, period), 200);
        }, { passive: true });
    }

    loadChartJs() {
        if (window.Chart) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    addPriceStatistics(container, prices) {
        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);
        const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);

        // Remove existing stats container if it exists
        const existingStats = container.parentElement?.querySelector('.price-stats');
        if (existingStats) {
            existingStats.remove();
        }

        // Create new stats container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'price-stats';
        statsContainer.style.display = 'flex';
        statsContainer.style.justifyContent = 'space-between';
        statsContainer.style.alignItems = 'center';
        statsContainer.style.margin = '15px 0 0 0';
        statsContainer.style.textAlign = 'center';
        statsContainer.style.flexWrap = 'wrap';
        statsContainer.style.gap = '10px';
        statsContainer.style.width = '100%';
        
        if (window.innerWidth < 480) {
            statsContainer.style.flexDirection = 'column';
            statsContainer.style.gap = '8px';
        }
        container.parentElement.appendChild(statsContainer);

        const stats = [
            { label: 'Lowest', value: lowestPrice, color: '#2e7d32', bgColor: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
            { label: 'Average', value: averagePrice, color: '#1565c0', bgColor: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
            { label: 'Highest', value: highestPrice, color: '#c62828', bgColor: 'linear-gradient(135deg, #ffebee, #ffcdd2)' }
        ];

        stats.forEach(stat => {
            const statElement = document.createElement('div');
            statElement.className = 'price-stat';
            statElement.style.padding = window.innerWidth < 480 ? '12px 16px' : '12px 20px';
            statElement.style.background = stat.bgColor;
            statElement.style.borderRadius = '10px';
            statElement.style.flex = window.innerWidth < 480 ? '1 1 100%' : '1 1 30%';
            statElement.style.minWidth = window.innerWidth < 480 ? '100%' : '0';
            statElement.style.maxWidth = window.innerWidth < 480 ? '100%' : 'calc(33.333% - 10px)';
            statElement.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
            
            statElement.innerHTML = `
                <div style="font-size: ${window.innerWidth < 480 ? '13px' : '14px'}; color: ${stat.color}; margin-bottom: 5px; font-weight: 600;">${stat.label}</div>
                <div style="font-size: ${window.innerWidth < 480 ? '18px' : '20px'}; font-weight: 700; color: ${stat.color};">${window.innerWidth < 480 ? 'R' + Math.round(stat.value/1000) + 'k' : this.formatPrice(stat.value)}</div>
            `;
            
            statsContainer.appendChild(statElement);
        });
    }

    addChartLegend(container) {
        // Remove existing legend if it exists
        const existingLegend = container.querySelector('.chart-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        const legendContainer = document.createElement('div');
        legendContainer.className = 'chart-legend';
        legendContainer.style.position = 'absolute';
        
        if (window.innerWidth < 480) {
            legendContainer.style.top = '10px';
            legendContainer.style.right = '10px';
            legendContainer.style.display = 'flex';
            legendContainer.style.flexDirection = 'column';
            legendContainer.style.maxWidth = '80px';
        } else {
            legendContainer.style.top = '10px';
            legendContainer.style.right = '10px';
            legendContainer.style.display = 'flex';
            legendContainer.style.flexDirection = 'column';
        }
        
        legendContainer.style.gap = '5px';
        legendContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        legendContainer.style.padding = window.innerWidth < 480 ? '4px' : '8px';
        legendContainer.style.borderRadius = '5px';
        legendContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        legendContainer.style.fontSize = window.innerWidth < 480 ? '9px' : '12px';
        legendContainer.style.fontWeight = 'bold';
        legendContainer.style.zIndex = '5';
        
        const legendItems = [
            { color: '#2e7d32', label: 'Low Price' },
            { color: '#c62828', label: 'High Price' }
        ];
        
        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';
            legendItem.style.gap = '3px';
            
            legendItem.innerHTML = `
                <div style="width: ${window.innerWidth < 480 ? '8px' : '12px'}; height: ${window.innerWidth < 480 ? '8px' : '12px'}; border-radius: 50%; background-color: ${item.color};"></div>
                <span>${item.label}</span>
            `;
            
            legendContainer.appendChild(legendItem);
        });
        
        container.style.position = 'relative';
        container.appendChild(legendContainer);
    }

    getBarColor(price, minPrice, maxPrice) {
        const ratio = (price - minPrice) / (maxPrice - minPrice);
        
        if (ratio < 0.3) {
            return '#28a745'; // Green for low prices
        } else if (ratio < 0.7) {
            return '#ffc107'; // Yellow for medium prices
        } else {
            return '#dc3545'; // Red for high prices
        }
    }

    getPeriodLabel(period) {
        switch(period) {
            case 30: return '30-Day';
            case 90: return '3-Month';
            case 180: return '6-Month';
            case 365: return '12-Month';
            default: return '30-Day';
        }
    }


    showLoading() {
        document.getElementById('loadingContainer').style.display = 'flex';
        document.getElementById('errorContainer').style.display = 'none';
        document.getElementById('productContent').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingContainer').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('productContent').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getLowestPrice(product) {
        if (!product.offers || product.offers.length === 0) return 0;
        const prices = product.offers.map(offer => offer.price).filter(price => typeof price === 'number' && price > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
    }

    // Helper function to find color data from PHONE_COLORS
    findColorData(colorName) {
        for (const model in PHONE_COLORS) {
            const colorData = PHONE_COLORS[model].find(color => color.name === colorName);
            if (colorData) {
                return colorData;
            }
        }
        return null;
    }

    async selectColorFromAPI(newProductId, colorName) {
        console.log('=== selectColorFromAPI called ===');
        console.log('newProductId:', newProductId);
        console.log('colorName:', colorName);
        
        // Update selected button appearance immediately for responsive feedback
        const colorButtons = document.querySelectorAll('.color-btn');

        colorButtons.forEach(button => {
            const buttonProductId = button.getAttribute('data-product-id');

            if (buttonProductId === newProductId) {
                // Remove active class from all buttons first
                colorButtons.forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to the selected button
                button.classList.add('active');
                console.log('✓ Added active class to button:', button);
            }

            // Ensure all buttons remain visible
            button.style.display = 'flex';
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        });

        // If it's the same product, no need to do anything
        if (this.productData.product_id === newProductId) {
            console.log('Same product selected, no change needed');
            return;
        }

        try {
            // Show loading state
            this.showLoading();

            // Set a timeout to ensure loading is always hidden
            const loadingTimeout = setTimeout(() => {
                console.warn('Loading timeout reached, hiding loading state');
                this.hideLoading();
            }, 10000); // 10 second timeout

            console.log('Switching to product:', newProductId);
            console.log('Current product ID:', this.productData.product_id);

            // Fetch all products from API
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const products = await response.json();
            console.log('API returned', products.length, 'products');

            // Find the exact product match
            const newProduct = products.find(product => product.product_id === newProductId);

            if (!newProduct) {
                console.error('Product not found in API:', newProductId);
                this.hideLoading();
                this.showNotification(`The ${colorName} variant could not be found. Please refresh the page and try again.`, 'error');
                return;
            }

            // Update current product with the API data
            this.productData = newProduct;

            // Update the page URL without reloading
            const newUrl = `${window.location.pathname}?id=${newProductId}`;
            window.history.pushState({}, '', newUrl);

            // Redisplay all product information with real API data
            console.log('About to update all product information...');
            try {
                await this.updateAllProductInformation(newProduct, colorName);
                console.log('Product information updated successfully');
                console.log(`Successfully switched to ${colorName} variant!`);
            } catch (updateError) {
                console.error('Error updating product information:', updateError);
                // Even if update fails, we should still hide loading and show the product content
                const productContent = document.getElementById('productContent');
                if (productContent) {
                    productContent.style.display = 'block';
                }
                this.showNotification(`Color changed to ${colorName}, but some details may not have updated. Please refresh the page if needed.`, 'warning');
            }

            // Always hide loading state
            clearTimeout(loadingTimeout);
            this.hideLoading();

            // Update storage availability for the new color
            await this.updateStorageAvailabilityForColor(newProductId);

        } catch (error) {
            console.error('Error switching color:', error);
            clearTimeout(loadingTimeout);
            this.hideLoading();
            this.showNotification(`Failed to load ${colorName} variant. Error: ${error.message}`, 'error');
        }
    }

    async updateStorageAvailabilityForColor(selectedColorProductId) {
        try {
            console.log('Updating storage availability for color:', selectedColorProductId);
            
            // Fetch all products from API
            const url = new URL('https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/smartphones');
            url.searchParams.append('category', this.category);
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const allProducts = await response.json();

            // Extract color and model from the selected product
            const selectedProduct = allProducts.find(product => product.product_id === selectedColorProductId);
            if (!selectedProduct) {
                console.error('Selected product not found:', selectedColorProductId);
                return;
            }

            const selectedColor = selectedProduct.color;
            const selectedModel = selectedProduct.model;
            
            console.log('Selected color:', selectedColor, 'Model:', selectedModel);

            // Find all storage variants for this color and model
            const colorStorageVariants = allProducts.filter(product => 
                product.color === selectedColor && product.model === selectedModel
            );

            console.log('Found storage variants for', selectedColor, ':', colorStorageVariants.map(p => ({
                id: p.product_id, 
                storage: p.product_id.match(/-(\d+)(?:gb|tb)/i)?.[0]
            })));

            // Update storage buttons based on availability
            const storageButtons = document.querySelectorAll('.storage-btn');
            storageButtons.forEach(button => {
                const storageSuffix = button.dataset.suffix;
                const storageValue = button.dataset.storage;
                
                // Check if this storage variant exists for the selected color
                const storageVariantExists = colorStorageVariants.some(product => 
                    product.product_id.toLowerCase().includes(storageSuffix)
                );

                if (storageVariantExists) {
                    // Storage is available - show normally
                    button.classList.remove('disabled');
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    button.style.textDecoration = 'none';
                    button.innerHTML = storageValue; // Remove "(Unavailable)" text
                    console.log(`Storage ${storageValue} is AVAILABLE for ${selectedColor}`);
                } else {
                    // Storage is not available - grey out and disable
                    button.classList.add('disabled');
                    button.disabled = true;
                    button.style.opacity = '0.4';
                    button.style.cursor = 'not-allowed';
                    button.style.textDecoration = 'line-through';
                    button.innerHTML = `${storageValue} <span class="unavailable-indicator">(Unavailable)</span>`;
                    console.log(`Storage ${storageValue} is NOT AVAILABLE for ${selectedColor}`);
                }
            });

        } catch (error) {
            console.error('Error updating storage availability:', error);
        }
    }

    // Checkmark functionality is now handled by CSS classes

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get category from URL parameters or use default
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'smartphones';
    
    window.smartphoneInfo = new SmartphoneInfo(category);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartphoneInfo;
}
