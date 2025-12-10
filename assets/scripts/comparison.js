// Comparison Page Manager
// Handles product comparison functionality on the comparison page

// API Configuration - use existing if already declared
if (typeof API_CONFIG === 'undefined') {
    var API_CONFIG = {
        BASE_URL: 'https://hub.comparehubprices.co.za/data',
        LIST_PRODUCTS_ENDPOINT: '/products',
    };
}

class ComparisonPage {
    constructor() {
        this.compareProducts = [];
        this.maxProducts = 3;
        this.allProducts = [];
        this.category = null;
        this.init();
    }

    init() {
        // Load products from URL parameters if available
        this.loadProductsFromURL();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load products for search asynchronously
        this.loadProducts().catch(error => {
            console.error('Error loading products in init:', error);
        });
    }

    loadProductsFromURL() {
        // Check if products are passed via URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productIds = urlParams.get('products');
        
        if (productIds) {
            const ids = productIds.split(',').filter(id => id.trim());
            // Store IDs to load later when products are available
            this.pendingProductIds = ids;
            console.log('Products to load from URL:', ids);
        }
    }

    async loadProducts() {
        try {
            if (typeof API_CONFIG === 'undefined') {
                console.error('API_CONFIG not defined');
                return;
            }

            // Try to determine category from URL or default to smartphones
            this.category = this.getCategoryFromURL() || 'smartphones';
            
            // Check if this is a gaming console/laptop category - if so, load from both categories
            const isGamingConsoleOrLaptop = this.isGamingConsoleCategory(this.category) || 
                                             this.isGamingLaptopCategory(this.category);
            
            // Check if this is a laptop category - if so, load from all laptop categories
            const isLaptopCategory = this.isLaptopCategory(this.category);
            
            if (isGamingConsoleOrLaptop) {
                // Load products from both gaming-consoles and gaming-laptops categories
                const gamingCategories = ['gaming-consoles', 'gaming-laptops'];
                this.allProducts = [];
                
                for (const category of gamingCategories) {
                    try {
                        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${category}`;
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            console.warn(`Failed to fetch from ${category}:`, response.status);
                            continue;
                        }

                        const data = await response.json();
                        
                        // Parse response - handle different response structures
                        let productsData = data;
                        if (data.body) {
                            try {
                                productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                            } catch (e) {
                                productsData = data;
                            }
                        }

                        let categoryProducts = [];
                        if (Array.isArray(productsData)) {
                            categoryProducts = productsData;
                        } else if (productsData.products && Array.isArray(productsData.products)) {
                            categoryProducts = productsData.products;
                        } else if (productsData.data && Array.isArray(productsData.data)) {
                            categoryProducts = productsData.data;
                        }
                        
                        // Merge products from this category
                        this.allProducts = this.allProducts.concat(categoryProducts);
                    } catch (error) {
                        console.warn(`Error fetching from ${category}:`, error);
                        continue;
                    }
                }
                
                // Set category to 'gaming' for breadcrumb purposes
                this.category = 'gaming';
            } else if (this.isGamingMonitorCategory(this.category)) {
                // Load products from gaming-monitors category only
                const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=gaming-monitors`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Parse response - handle different response structures
                let productsData = data;
                if (data.body) {
                    try {
                        productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    } catch (e) {
                        productsData = data;
                    }
                }

                if (Array.isArray(productsData)) {
                    this.allProducts = productsData;
                } else if (productsData.products && Array.isArray(productsData.products)) {
                    this.allProducts = productsData.products;
                } else if (productsData.data && Array.isArray(productsData.data)) {
                    this.allProducts = productsData.data;
                } else {
                    this.allProducts = [];
                }
            } else if (isLaptopCategory) {
                // Load products from all laptop categories
                const laptopCategories = ['windows-laptops', 'chromebooks-laptops', 'macbooks-laptops'];
                this.allProducts = [];
                
                for (const category of laptopCategories) {
                    try {
                        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${category}`;
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            console.warn(`Failed to fetch from ${category}:`, response.status);
                            continue;
                        }

                        const data = await response.json();
                        
                        // Parse response - handle different response structures
                        let productsData = data;
                        if (data.body) {
                            try {
                                productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                            } catch (e) {
                                productsData = data;
                            }
                        }

                        let categoryProducts = [];
                        if (Array.isArray(productsData)) {
                            categoryProducts = productsData;
                        } else if (productsData.products && Array.isArray(productsData.products)) {
                            categoryProducts = productsData.products;
                        } else if (productsData.data && Array.isArray(productsData.data)) {
                            categoryProducts = productsData.data;
                        }
                        
                        // Merge products from this category
                        this.allProducts = this.allProducts.concat(categoryProducts);
                    } catch (error) {
                        console.warn(`Error fetching from ${category}:`, error);
                        continue;
                    }
                }
                
                // Set category to 'laptops' for breadcrumb purposes
                this.category = 'laptops';
            } else {
                // Load from single category (smartphones, tablets, etc.)
                const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${this.category}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Parse response - handle different response structures
                let productsData = data;
                if (data.body) {
                    try {
                        productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    } catch (e) {
                        productsData = data;
                    }
                }

                if (Array.isArray(productsData)) {
                    this.allProducts = productsData;
                } else if (productsData.products && Array.isArray(productsData.products)) {
                    this.allProducts = productsData.products;
                } else if (productsData.data && Array.isArray(productsData.data)) {
                    this.allProducts = productsData.data;
                } else {
                    this.allProducts = [];
                }
            }

            // Load products from URL if available
            if (this.pendingProductIds && this.pendingProductIds.length > 0) {
                console.log('Loading products from URL:', this.pendingProductIds);
                console.log('Available products count:', this.allProducts.length);
                
                // If products not found and we're dealing with laptops, try to fetch missing products
                const missingProductIds = [];
                
                this.pendingProductIds.forEach(productId => {
                    // Try to match product ID (handle both string and number comparisons)
                    const product = this.allProducts.find(p => {
                        const pId = p.product_id || p.id || p.productId;
                        // Compare as both string and number
                        return String(pId) === String(productId) || 
                               Number(pId) === Number(productId) ||
                               pId === productId;
                    });
                    
                    if (product) {
                        console.log('Found product:', product.model || product.title, 'ID:', product.product_id || product.id);
                        // Set category from first product if not already set
                        if (!this.category && product.category) {
                            this.category = product.category;
                            console.log('Category set from product:', this.category);
                        }
                        if (this.compareProducts.length < this.maxProducts) {
                            this.addProduct(product);
                        }
                    } else {
                        console.warn('Product not found for ID:', productId);
                        missingProductIds.push(productId);
                    }
                });
                
                // If there are missing products and we're on a laptop category, try to fetch them
                if (missingProductIds.length > 0 && this.isLaptopCategory(this.category)) {
                    await this.fetchMissingLaptopProducts(missingProductIds);
                }
                
                this.pendingProductIds = null;
            }

            // Try to determine category from products if not set
            if (!this.category && this.compareProducts.length > 0) {
                const firstProduct = this.compareProducts[0];
                if (firstProduct.category) {
                    this.category = firstProduct.category;
                }
            }
            
            // Also try to determine from allProducts if still not set
            if (!this.category && this.allProducts.length > 0) {
                const firstProduct = this.allProducts[0];
                if (firstProduct.category) {
                    this.category = firstProduct.category;
                }
            }

            // Update breadcrumb after loading products
            this.updateBreadcrumb();

            this.renderProducts();
        } catch (error) {
            console.error('Error loading products for comparison:', error);
            this.allProducts = [];
        }
    }

    getCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        // Normalize laptop categories
        if (category) {
            const lowerCategory = category.toLowerCase();
            if (lowerCategory === 'windows' || lowerCategory === 'windows-laptops') {
                return 'windows-laptops';
            } else if (lowerCategory === 'chromebooks' || lowerCategory === 'chromebooks-laptops') {
                return 'chromebooks-laptops';
            } else if (lowerCategory === 'macbooks' || lowerCategory === 'macbooks-laptops') {
                return 'macbooks-laptops';
            }
            // Normalize gaming categories
            else if (lowerCategory === 'consoles' || lowerCategory === 'gaming-consoles') {
                return 'gaming-consoles';
            } else if (lowerCategory === 'laptop-gaming' || lowerCategory === 'gaming-laptops') {
                return 'gaming-laptops';
            } else if (lowerCategory === 'gaming-monitors') {
                return 'gaming-monitors';
            }
        }
        
        return category;
    }

    isLaptopCategory(category) {
        if (!category) return false;
        const lowerCategory = category.toLowerCase();
        return lowerCategory.includes('windows') || 
               lowerCategory.includes('chromebook') || 
               lowerCategory.includes('macbook') ||
               lowerCategory === 'laptops';
    }

    isGamingConsoleCategory(category) {
        if (!category) return false;
        const lowerCategory = category.toLowerCase();
        return lowerCategory === 'gaming-consoles' || lowerCategory === 'consoles';
    }

    isGamingLaptopCategory(category) {
        if (!category) return false;
        const lowerCategory = category.toLowerCase();
        return lowerCategory === 'gaming-laptops' || lowerCategory === 'laptop-gaming';
    }

    isGamingMonitorCategory(category) {
        if (!category) return false;
        const lowerCategory = category.toLowerCase();
        return lowerCategory === 'gaming-monitors';
    }

    isGamingCategory(category) {
        return this.isGamingConsoleCategory(category) || 
               this.isGamingLaptopCategory(category) || 
               this.isGamingMonitorCategory(category);
    }

    async fetchMissingLaptopProducts(productIds) {
        // Try to fetch missing products from all laptop categories
        const laptopCategories = ['windows-laptops', 'chromebooks-laptops', 'macbooks-laptops'];
        
        for (const category of laptopCategories) {
            if (productIds.length === 0) break; // All products found
            
            try {
                const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${category}`;
                const response = await fetch(url);
                
                if (!response.ok) continue;

                const data = await response.json();
                
                // Parse response
                let productsData = data;
                if (data.body) {
                    try {
                        productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    } catch (e) {
                        productsData = data;
                    }
                }

                let categoryProducts = [];
                if (Array.isArray(productsData)) {
                    categoryProducts = productsData;
                } else if (productsData.products && Array.isArray(productsData.products)) {
                    categoryProducts = productsData.products;
                } else if (productsData.data && Array.isArray(productsData.data)) {
                    categoryProducts = productsData.data;
                }
                
                // Try to find missing products in this category
                const foundIndices = [];
                productIds.forEach((productId, index) => {
                    const product = categoryProducts.find(p => {
                        const pId = p.product_id || p.id || p.productId;
                        return String(pId) === String(productId) || 
                               Number(pId) === Number(productId) ||
                               pId === productId;
                    });
                    
                    if (product) {
                        console.log('Found missing product:', product.model || product.title);
                        // Add to allProducts if not already there
                        const exists = this.allProducts.some(p => {
                            const pId = p.product_id || p.id || p.productId;
                            return String(pId) === String(productId);
                        });
                        if (!exists) {
                            this.allProducts.push(product);
                        }
                        // Add to comparison if space available
                        if (this.compareProducts.length < this.maxProducts) {
                            this.addProduct(product);
                        }
                        // Mark for removal
                        foundIndices.push(index);
                    }
                });
                
                // Remove found products from the list (in reverse order to maintain indices)
                foundIndices.reverse().forEach(index => {
                    productIds.splice(index, 1);
                });
            } catch (error) {
                console.warn(`Error fetching missing products from ${category}:`, error);
                continue;
            }
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('productSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    this.hideSearchResults();
                    return;
                }

                searchTimeout = setTimeout(() => {
                    this.searchProducts(query);
                }, 300);
            });

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && 
                    !document.getElementById('productSearchResults')?.contains(e.target)) {
                    this.hideSearchResults();
                }
            });
        }
    }

    searchProducts(query) {
        const resultsContainer = document.getElementById('productSearchResults');
        if (!resultsContainer) return;

        const lowerQuery = query.toLowerCase();
        const results = this.allProducts.filter(product => {
            const model = (product.model || product.title || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            return model.includes(lowerQuery) || brand.includes(lowerQuery);
        }).slice(0, 10);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item"><p>No products found</p></div>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = results.map(product => {
            const imageUrl = product.imageUrl || product.image || product.img || 'https://via.placeholder.com/56?text=No+Image';
            const name = product.model || product.title || 'Unknown Product';
            const brand = product.brand || 'Unknown Brand';
            const price = this.getLowestPrice(product);
            const formattedPrice = price ? `R${price.toLocaleString('en-ZA')}` : 'Price not available';
            
            return `
                <div class="search-result-item" data-product-id="${product.product_id || product.id || product.productId}">
                    <img src="${imageUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/56?text=No+Image'">
                    <div style="flex: 1;">
                        <h6>${this.escapeHtml(name)}</h6>
                        <p>${this.escapeHtml(brand)} • ${formattedPrice}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.dataset.productId;
                // Try to match product ID (handle both string and number comparisons)
                const product = this.allProducts.find(p => {
                    const pId = p.product_id || p.id || p.productId;
                    // Compare as both string and number
                    return String(pId) === String(productId) || 
                           Number(pId) === Number(productId) ||
                           pId === productId;
                });
                if (product) {
                    this.addProduct(product);
                    const searchInput = document.getElementById('productSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    this.hideSearchResults();
                }
            });
        });

        resultsContainer.style.display = 'block';
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('productSearchResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    addProduct(product) {
        // Check if product is already added
        const productId = product.product_id || product.id || product.productId;
        if (this.compareProducts.some(p => 
            (p.product_id === productId) || 
            (p.id === productId) ||
            (p.productId === productId)
        )) {
            if (typeof showToast !== 'undefined') {
                showToast('Product is already in comparison', 'info');
            }
            return;
        }

        // Check if max products reached
        if (this.compareProducts.length >= this.maxProducts) {
            if (typeof showToast !== 'undefined') {
                showToast(`You can only compare up to ${this.maxProducts} products`, 'warning');
            }
            return;
        }

        // Validate gaming-monitors can only compare with other gaming-monitors
        const productCategory = product.category || '';
        const isGamingMonitor = this.isGamingMonitorCategory(productCategory);
        
        if (isGamingMonitor && this.compareProducts.length > 0) {
            // Check if all existing products are gaming-monitors
            const allAreMonitors = this.compareProducts.every(p => {
                const cat = p.category || '';
                return this.isGamingMonitorCategory(cat);
            });
            
            if (!allAreMonitors) {
                if (typeof showToast !== 'undefined') {
                    showToast('Gaming monitors can only be compared with other gaming monitors', 'warning');
                }
                return;
            }
        } else if (!isGamingMonitor && this.compareProducts.length > 0) {
            // Check if existing products include gaming-monitors
            const hasMonitors = this.compareProducts.some(p => {
                const cat = p.category || '';
                return this.isGamingMonitorCategory(cat);
            });
            
            if (hasMonitors) {
                if (typeof showToast !== 'undefined') {
                    showToast('Gaming monitors can only be compared with other gaming monitors', 'warning');
                }
                return;
            }
        }

        this.compareProducts.push(product);
        
        // Set category from product if not already set
        if (!this.category && product.category) {
            this.category = product.category;
        }
        
        // Update breadcrumb when product is added
        this.updateBreadcrumb();
        
        this.renderProducts();

        if (typeof showToast !== 'undefined') {
            showToast('Product added to comparison', 'success');
        }
    }

    removeProduct(productId) {
        this.compareProducts = this.compareProducts.filter(p => 
            (p.product_id !== productId) && 
            (p.id !== productId) &&
            (p.productId !== productId)
        );
        
        // Update breadcrumb when product is removed
        this.updateBreadcrumb();
        
        this.renderProducts();

        if (typeof showToast !== 'undefined') {
            showToast('Product removed from comparison', 'info');
        }
    }

    renderProducts() {
        const container = document.getElementById('comparisonProductsContainer');
        if (!container) {
            console.warn('comparisonProductsContainer not found');
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Render existing products
        this.compareProducts.forEach((product, index) => {
            try {
                const productCard = this.createProductCard(product, index);
                if (productCard) {
                    container.appendChild(productCard);
                }
            } catch (error) {
                console.error(`Error rendering product ${index}:`, error);
            }
        });

        // Add empty slots if less than max
        const emptySlots = this.maxProducts - this.compareProducts.length;
        for (let i = 0; i < emptySlots; i++) {
            try {
                const emptyCard = this.createEmptyCard();
                if (emptyCard) {
                    container.appendChild(emptyCard);
                }
            } catch (error) {
                console.error(`Error creating empty card ${i}:`, error);
            }
        }
    }

    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const productId = product.product_id || product.id || product.productId;
        const imageUrl = product.imageUrl || product.image || product.img || 'https://via.placeholder.com/200?text=No+Image';
        const name = product.model || product.title || 'Unknown Product';
        const brand = product.brand || 'Unknown Brand';
        const price = this.getLowestPrice(product);
        const formattedPrice = price ? `R${price.toLocaleString('en-ZA')}` : 'Price not available';

        // Get key specs
        const keySpecs = this.getKeySpecs(product);

        card.innerHTML = `
            <button class="remove-product-btn" data-product-id="${productId}" aria-label="Remove product">
                <i class="fas fa-times"></i>
            </button>
            <div class="product-image-wrapper">
                <img src="${imageUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            </div>
            <div class="product-brand">${this.escapeHtml(brand)}</div>
            <div class="product-name">${this.escapeHtml(name)}</div>
            <div class="product-price">${formattedPrice}</div>
            <button class="specs-toggle-btn" data-index="${index}">
                <span>View Specs</span>
                <i class="fas fa-chevron-down specs-chevron"></i>
            </button>
            <div class="specs-content" data-index="${index}">
                <h5>Specifications</h5>
                <div class="specs-list">
                    ${keySpecs.map(spec => `
                        <div class="spec-row">
                            <span class="spec-label">${this.escapeHtml(spec.label)}</span>
                            <span class="spec-value">${this.escapeHtml(spec.value)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="prices-toggle-btn" data-index="${index}">
                <span>View Prices</span>
                <i class="fas fa-chevron-down prices-chevron"></i>
            </button>
            <div class="prices-content" data-index="${index}">
                ${this.renderPrices(product)}
            </div>
        `;

        // Add event listeners
        const removeBtn = card.querySelector('.remove-product-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeProduct(productId);
            });
        }

        const specsBtn = card.querySelector('.specs-toggle-btn');
        const specsContent = card.querySelector('.specs-content');
        if (specsBtn && specsContent) {
            specsBtn.addEventListener('click', () => {
                specsContent.classList.toggle('active');
                const chevron = specsBtn.querySelector('.specs-chevron');
                if (chevron) {
                    chevron.style.transform = specsContent.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }

        const pricesBtn = card.querySelector('.prices-toggle-btn');
        const pricesContent = card.querySelector('.prices-content');
        if (pricesBtn && pricesContent) {
            pricesBtn.addEventListener('click', () => {
                pricesContent.classList.toggle('active');
                const chevron = pricesBtn.querySelector('.prices-chevron');
                if (chevron) {
                    chevron.style.transform = pricesContent.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }

        return card;
    }

    createEmptyCard() {
        const card = document.createElement('div');
        card.className = 'empty-card';
        card.innerHTML = `
            <div class="empty-card-icon">
                <i class="fas fa-plus"></i>
            </div>
            <p>Click to add product</p>
        `;
        
        // Add click handler to focus search input
        card.addEventListener('click', () => {
            const searchInput = document.getElementById('productSearchInput');
            if (searchInput) {
                searchInput.focus();
                // Scroll to search container if needed
                const searchContainer = document.querySelector('.product-search-container');
                if (searchContainer) {
                    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
        
        return card;
    }

    getKeySpecs(product) {
        const specs = [];
        if (product.specs) {
            // Check product type
            const isLaptop = this.isLaptopProduct(product);
            const isGamingLaptop = this.isGamingLaptopProduct(product);
            const isGamingConsole = this.isGamingConsoleProduct(product);
            const isGamingMonitor = this.isGamingMonitorProduct(product);
            
            if (isGamingMonitor) {
                // Gaming Monitor specifications
                if (product.specs.Display?.Size) {
                    specs.push({ label: 'Screen Size', value: product.specs.Display.Size });
                }
                if (product.specs.Display?.Resolution) {
                    specs.push({ label: 'Resolution', value: product.specs.Display.Resolution });
                }
                if (product.specs.Display?.['Refresh Rate']) {
                    specs.push({ label: 'Refresh Rate', value: product.specs.Display['Refresh Rate'] });
                }
                if (product.specs.Display?.Type) {
                    specs.push({ label: 'Panel Type', value: product.specs.Display.Type });
                }
            } else if (isGamingConsole) {
                // Gaming Console specifications
                if (product.specs.Platform) {
                    specs.push({ label: 'Platform', value: product.specs.Platform });
                }
                if (product.specs.Storage) {
                    specs.push({ label: 'Storage', value: product.specs.Storage });
                }
                if (product.specs.Resolution) {
                    specs.push({ label: 'Resolution', value: product.specs.Resolution });
                }
                if (product.specs.Connectivity) {
                    const connectivity = product.specs.Connectivity;
                    const connSpecs = [];
                    if (connectivity.Bluetooth) connSpecs.push(`Bluetooth ${connectivity.Bluetooth}`);
                    if (connectivity.Wifi) connSpecs.push(`Wi-Fi ${connectivity.Wifi}`);
                    if (connectivity.Ethernet) connSpecs.push('Ethernet');
                    if (connSpecs.length > 0) {
                        specs.push({ label: 'Connectivity', value: connSpecs.join(', ') });
                    }
                }
            } else if (isLaptop || isGamingLaptop) {
                // Laptop/Gaming Laptop specifications
                if (product.specs.Performance?.Processor || product.specs.Performance?.Model || product.specs.Processor) {
                    const processor = product.specs.Performance?.Processor || product.specs.Performance?.Model || product.specs.Processor || 'N/A';
                    specs.push({ label: 'Processor', value: processor });
                }
                if (product.specs.Performance?.Ram || product.specs.RAM) {
                    specs.push({ label: 'RAM', value: product.specs.Performance?.Ram || product.specs.RAM });
                }
                if (product.specs.Performance?.Storage || product.specs.Storage) {
                    specs.push({ label: 'Storage', value: product.specs.Performance?.Storage || product.specs.Storage });
                }
                if (product.specs.Display?.Main?.Size || product.specs.Display?.Size) {
                    const displaySize = product.specs.Display.Main?.Size || product.specs.Display.Size || 'N/A';
                    specs.push({ label: 'Display', value: displaySize });
                }
                if (product.specs.Performance?.Gpu || product.specs.Performance?.Graphics || product.specs.Graphics) {
                    const graphics = product.specs.Performance?.Gpu || product.specs.Performance?.Graphics || product.specs.Graphics || 'N/A';
                    specs.push({ label: 'Graphics', value: graphics });
                }
                if (product.specs.Os?.['Operating System'] || product.specs.Os?.Operating || product.specs.OS) {
                    const os = product.specs.Os?.['Operating System'] || product.specs.Os?.Operating || product.specs.OS || 'N/A';
                    specs.push({ label: 'OS', value: os });
                }
            } else {
                // Smartphone/Tablet specifications
                if (product.specs.Performance?.Ram) {
                    specs.push({ label: 'RAM', value: product.specs.Performance.Ram });
                }
                if (product.specs.Performance?.Storage) {
                    specs.push({ label: 'Storage', value: product.specs.Performance.Storage });
                }
                if (product.specs.Os?.['Operating System']) {
                    specs.push({ label: 'OS', value: product.specs.Os['Operating System'] });
                }
                if (product.specs.Display?.Size) {
                    specs.push({ label: 'Display', value: product.specs.Display.Size });
                }
                if (product.specs.Camera?.['Rear Camera']) {
                    specs.push({ label: 'Camera', value: product.specs.Camera['Rear Camera'] });
                }
                if (product.specs.Battery?.Capacity) {
                    specs.push({ label: 'Battery', value: product.specs.Battery.Capacity });
                }
            }
        }
        return specs.slice(0, 6);
    }

    isLaptopProduct(product) {
        if (!product.category) return false;
        const category = String(product.category).toLowerCase();
        return category.includes('laptop') || 
               category.includes('windows') || 
               category.includes('chromebook') || 
               category.includes('macbook');
    }

    isGamingLaptopProduct(product) {
        if (!product.category) return false;
        const category = String(product.category).toLowerCase();
        return category === 'gaming-laptops' || category === 'laptop-gaming';
    }

    isGamingConsoleProduct(product) {
        if (!product.category) return false;
        const category = String(product.category).toLowerCase();
        return category === 'gaming-consoles' || category === 'consoles' || category === 'gaming';
    }

    isGamingMonitorProduct(product) {
        if (!product.category) return false;
        const category = String(product.category).toLowerCase();
        return category === 'gaming-monitors';
    }

    renderPrices(product) {
        if (!product.offers || product.offers.length === 0) {
            return '<p style="color: #64748b; font-size: 13px;">No prices available</p>';
        }

        const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
        
        return `
            <div class="prices-list">
                ${sortedOffers.slice(0, 5).map(offer => {
                    const retailerName = offer.retailer || offer.retailerName || 'Unknown Retailer';
                    const price = offer.price;
                    const formattedPrice = `R${price.toLocaleString('en-ZA')}`;
                    const url = offer.url || '#';
                    
                    return `
                        <div class="price-row">
                            <span class="retailer-name">${this.escapeHtml(retailerName)}</span>
                            <span class="price-value">${formattedPrice}</span>
                            <a href="${url}" target="_blank" rel="noopener noreferrer" class="visit-store-link">
                                Visit Store
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getLowestPrice(product) {
        if (!product.offers || product.offers.length === 0) return null;
        const prices = product.offers
            .map(offer => offer.price)
            .filter(price => typeof price === 'number' && price > 0);
        return prices.length > 0 ? Math.min(...prices) : null;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateBreadcrumb() {
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        // Use stored reference if available, otherwise get from DOM
        let categoryBreadcrumbLink = this.categoryBreadcrumbLink || document.getElementById('categoryBreadcrumbLink');
        const comparisonBreadcrumb = document.getElementById('comparisonBreadcrumb');

        if (!categoryBreadcrumb || !categoryBreadcrumbLink || !comparisonBreadcrumb) {
            console.warn('Breadcrumb elements not found');
            return;
        }

        // Try to determine category from products if not set
        if (!this.category && this.compareProducts.length > 0) {
            const firstProduct = this.compareProducts[0];
            if (firstProduct.category) {
                this.category = firstProduct.category;
                console.log('Category determined from product:', this.category);
            }
        }
        
        // Also try to determine from allProducts if still not set
        if (!this.category && this.allProducts.length > 0) {
            const firstProduct = this.allProducts[0];
            if (firstProduct.category) {
                this.category = firstProduct.category;
                console.log('Category determined from allProducts:', this.category);
            }
        }

        // Determine category name and link
        let categoryName = 'Products';
        let categoryLink = 'index.html'; // Default to home instead of #
        
        console.log('updateBreadcrumb - Current category:', this.category);
        console.log('updateBreadcrumb - Compare products count:', this.compareProducts.length);
        
        if (this.category) {
            const lowerCategory = this.category.toLowerCase();
            switch (lowerCategory) {
                case 'smartphones':
                    categoryName = 'Smartphones';
                    categoryLink = 'smartphones.html?category=smartphones';
                    break;
                case 'tablets':
                    categoryName = 'Tablets';
                    categoryLink = 'tablets.html';
                    break;
                case 'laptops':
                case 'windows-laptops':
                    categoryName = 'Laptops';
                    categoryLink = 'laptops.html?category=windows';
                    break;
                case 'chromebooks-laptops':
                    categoryName = 'Laptops';
                    categoryLink = 'laptops.html?category=chromebooks';
                    break;
                case 'macbooks-laptops':
                    categoryName = 'Laptops';
                    categoryLink = 'laptops.html?category=macbooks';
                    break;
                case 'gaming':
                case 'gaming-consoles':
                case 'consoles':
                    categoryName = 'Gaming';
                    categoryLink = 'gaming.html?category=gaming-consoles';
                    break;
                case 'gaming-laptops':
                case 'laptop-gaming':
                    categoryName = 'Gaming';
                    categoryLink = 'gaming.html?category=gaming-laptops';
                    break;
                case 'gaming-monitors':
                    categoryName = 'Gaming';
                    categoryLink = 'gaming.html?category=gaming-monitors';
                    break;
                default:
                    categoryName = this.category.charAt(0).toUpperCase() + this.category.slice(1);
                    categoryLink = `${this.category}.html`;
            }
        }

        // Update category breadcrumb - ensure link is clickable
        // Remove all existing event listeners by cloning
        const parent = categoryBreadcrumbLink.parentNode;
        const newLink = document.createElement('a');
        newLink.id = 'categoryBreadcrumbLink';
        newLink.href = categoryLink;
        newLink.textContent = categoryName;
        newLink.style.pointerEvents = 'auto';
        newLink.style.cursor = 'pointer';
        newLink.style.textDecoration = 'none';
        newLink.style.color = '#000000';
        
        // Replace the old link with the new one
        parent.replaceChild(newLink, categoryBreadcrumbLink);
        
        // Store reference to the new link for future updates
        this.categoryBreadcrumbLink = newLink;
        
        // Verify the link was set correctly
        console.log('Breadcrumb updated:', categoryName, '->', categoryLink);
        console.log('Link element href:', newLink.href);
        console.log('Link clickable:', newLink.style.pointerEvents);

        // Update comparison breadcrumb based on number of products
        if (this.compareProducts.length > 0) {
            const productNames = this.compareProducts
                .map(p => p.model || p.title || 'Product')
                .slice(0, 2); // Show max 2 product names
            
            if (this.compareProducts.length === 1) {
                comparisonBreadcrumb.textContent = `Comparing: ${productNames[0]}`;
            } else if (this.compareProducts.length === 2) {
                comparisonBreadcrumb.textContent = `Comparing: ${productNames[0]} & ${productNames[1]}`;
            } else {
                comparisonBreadcrumb.textContent = `Comparing: ${productNames[0]}, ${productNames[1]} & ${this.compareProducts.length - 2} more`;
            }
        } else {
            comparisonBreadcrumb.textContent = 'Compare Products';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide page loading overlay if it exists
    const loadingOverlay = document.getElementById('pageLoadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
    }

    // Check if we're on the comparison page
    if (window.location.pathname.includes('comparison.html')) {
        // Initialize comparison page
        window.comparisonPage = new ComparisonPage();
    }
});

