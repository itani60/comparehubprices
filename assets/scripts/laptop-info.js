// Laptop Info Page - Fetch and Display Product Details
// API Configuration - matching laptops.js (use existing if already declared)
if (typeof API_CONFIG === 'undefined') {
    var API_CONFIG = {
        BASE_URL: 'https://acc.comparehubprices.site/data',
        LIST_PRODUCTS_ENDPOINT: '/products',
        PRICE_HISTORY_ENDPOINT: '/products/price-history',
    };
}

class LaptopInfoPage {
    constructor() {
        this.productId = null;
        this.productData = null;
        this.priceHistoryChart = null;
        this.category = 'laptops';
        this.init();
    }

    async init() {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');

        if (!this.productId) {
            this.showErrorState('No product ID provided. Please select a product from the laptops page.');
            return;
        }

        // Determine category from product data or URL
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
            this.category = categoryParam;
        }

        // Fetch and display product data
        await this.fetchProductData();
    }

    async fetchProductData() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Determine which category to fetch from based on product data or try all
            const categories = ['windows-laptops', 'chromebooks-laptops', 'macbooks-laptops', 'laptops'];
            let productFound = false;

            for (const category of categories) {
                try {
                    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LIST_PRODUCTS_ENDPOINT}?category=${category}`;
                    console.log('Fetching products from:', url);

                    const response = await fetch(url);
                    if (!response.ok) {
                        continue; // Try next category
                    }

                    const data = await response.json();
                    console.log('Products API Response:', data);

                    // Parse response - handle different response structures
                    let productsData = data;
                    if (data.body) {
                        productsData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    }

                    // Extract products array from response
                    const products = productsData.products || productsData.items || productsData;
                    
                    if (!products || !Array.isArray(products) || products.length === 0) {
                        continue; // Try next category
                    }

                    // Find the specific product by ID (check all possible ID fields)
                    this.productData = products.find(product => 
                        (product.product_id === this.productId) || 
                        (product.id === this.productId) ||
                        (product.productId === this.productId)
                    );
                    
                    if (this.productData) {
                        this.category = category;
                        productFound = true;
                        break;
                    }
                } catch (error) {
                    console.warn(`Error fetching from category ${category}:`, error);
                    continue; // Try next category
                }
            }
            
            if (!productFound || !this.productData) {
                throw new Error(`Product with ID "${this.productId}" not found in any laptop category`);
            }
            
            console.log('Product Data:', this.productData);
            
            // Display product information
            this.displayProductInfo();
        } catch (error) {
            console.error('Error fetching product:', error);
            this.showErrorState(`Failed to load product details: ${error.message}`);
        }
    }

    showLoadingState() {
        // Show loading in the existing structure
        const title = document.getElementById('productTitle');
        const description = document.getElementById('productDescription');
        const priceList = document.getElementById('priceList');
        
        if (title) title.textContent = 'Loading...';
        if (description) description.innerHTML = '<p class="text-muted">Loading description...</p>';
        if (priceList) {
            priceList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading prices...</span>
                    </div>
                    <p>Loading price comparisons...</p>
                </div>
            `;
        }
    }

    displayProductInfo() {
        if (!this.productData) {
            this.showErrorState('Product data is not available.');
            return;
        }

        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Display product image
        this.displayProductImage();
        
        // Display product details
        this.displayProductDetails();
        
        // Display description
        this.displayDescription();
        
        // Display price comparison
        this.displayPriceComparison();
        
        // Display specifications
        this.displaySpecifications();
        
        // Display price history
        this.displayPriceHistory();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    updateBreadcrumb() {
        if (!this.productData) return;

        const productName = this.productData.model || this.productData.title || 'Product';
        const brand = this.productData.brand || '';
        const fullProductName = brand ? `${brand} ${productName}`.trim() : productName;
        
        const breadcrumb = document.getElementById('productBreadcrumb');
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        const categoryBreadcrumbLink = document.getElementById('categoryBreadcrumbLink');
        
        if (breadcrumb) {
            breadcrumb.textContent = fullProductName;
            breadcrumb.setAttribute('title', fullProductName);
        }

        // Update category breadcrumb based on laptop category
        if (categoryBreadcrumb && categoryBreadcrumbLink) {
            let categoryName = 'Laptops';
            let categoryLink = 'laptops.html';
            
            // Check URL parameter first (user's intent), then this.category, then productData.category
            const urlParams = new URLSearchParams(window.location.search);
            const urlCategory = urlParams.get('category');
            
            // Get the actual category - check multiple sources
            const detectedCategory = urlCategory || this.category || this.productData.category || '';
            
            // Normalize category string for comparison
            const categoryStr = String(detectedCategory).toLowerCase();
            
            // Check for Windows laptops
            if (categoryStr === 'windows' || categoryStr.includes('windows-laptops') || categoryStr.includes('windows')) {
                categoryName = 'Windows Laptops';
                categoryLink = 'laptops.html?category=windows';
            } 
            // Check for Chromebooks
            else if (categoryStr === 'chromebooks' || categoryStr.includes('chromebooks-laptops') || categoryStr.includes('chromebook')) {
                categoryName = 'Chromebooks';
                categoryLink = 'laptops.html?category=chromebooks';
            } 
            // Check for MacBooks
            else if (categoryStr === 'macbooks' || categoryStr.includes('macbooks-laptops') || categoryStr.includes('macbook')) {
                categoryName = 'MacBooks';
                categoryLink = 'laptops.html?category=macbooks';
            }
            
            // Set the breadcrumb link - ensure it's properly set
            categoryBreadcrumbLink.textContent = categoryName;
            categoryBreadcrumbLink.removeAttribute('href'); // Remove old href first
            categoryBreadcrumbLink.setAttribute('href', categoryLink);
            categoryBreadcrumbLink.href = categoryLink;
            
            // Ensure the link is clickable (remove any pointer-events or disabled states)
            categoryBreadcrumbLink.style.pointerEvents = 'auto';
            categoryBreadcrumbLink.style.cursor = 'pointer';
        }

        // Also update page title dynamically
        if (document.title) {
            document.title = `${fullProductName} - CompareHubPrices`;
        }
    }

    displayProductImage() {
        const mainImage = document.getElementById('productMainImage');
        const thumbnailsContainer = document.getElementById('productThumbnails');
        const badge = document.getElementById('productBadge');

        if (!mainImage) {
            console.warn('Product main image element not found');
            return;
        }

        // Set main image
        const imageUrl = this.productData.imageUrl || this.productData.image || this.productData.img || 'https://via.placeholder.com/400?text=No+Image';
        mainImage.src = imageUrl;
        mainImage.alt = this.productData.model || this.productData.title || 'Product Image';

        // Handle image error
        mainImage.onerror = function() {
            console.warn('Failed to load product image, using placeholder');
            this.src = 'https://via.placeholder.com/400?text=No+Image';
        };

        // Display badge if available
        if (badge) {
            if (this.productData.badge) {
                badge.textContent = this.productData.badge;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        // Create thumbnails (if multiple images available)
        if (thumbnailsContainer) {
            const images = this.productData.images || [imageUrl];
            thumbnailsContainer.innerHTML = '';

            if (images.length > 1) {
                images.forEach((img, index) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
                    thumbnail.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">`;
                    
                    thumbnail.addEventListener('click', () => {
                        mainImage.src = img;
                        // Update active thumbnail
                        document.querySelectorAll('.thumbnail-item').forEach(item => item.classList.remove('active'));
                        thumbnail.classList.add('active');
                    });
                    
                    thumbnailsContainer.appendChild(thumbnail);
                });
            }
        }
    }

    displayProductDetails() {
        const title = document.getElementById('productTitle');
        const brand = document.getElementById('productBrand');
        const keySpecs = document.getElementById('keySpecs');

        // Title and Brand
        if (title) {
            title.textContent = this.productData.model || this.productData.title || 'Unknown Product';
        }

        if (brand) {
            brand.textContent = this.productData.brand || 'Unknown Brand';
        }

        // Key Specifications
        if (keySpecs) {
            const specs = this.extractKeySpecs(this.productData.specs);
            keySpecs.innerHTML = specs.map(spec => `
                <div class="key-spec-item">
                    <div class="key-spec-label">${spec.label}</div>
                    <div class="key-spec-value">${spec.value}</div>
                </div>
            `).join('');
        }
    }

    extractKeySpecs(specs) {
        if (!specs) return [];

        const keySpecs = [];
        
        // Processor
        if (specs.Performance?.Processor) {
            keySpecs.push({ label: 'Processor', value: specs.Performance.Processor });
        } else if (specs.Performance?.['Processor Type']) {
            keySpecs.push({ label: 'Processor', value: specs.Performance['Processor Type'] });
        }
        
        // RAM
        if (specs.Performance?.Ram) {
            keySpecs.push({ label: 'RAM', value: specs.Performance.Ram });
        }
        
        // Storage
        if (specs.Performance?.Storage) {
            keySpecs.push({ label: 'Storage', value: specs.Performance.Storage });
        }
        
        // Operating System
        if (specs.Os?.['Operating System']) {
            keySpecs.push({ label: 'OS', value: specs.Os['Operating System'] });
        }
        
        // Display
        if (specs.Display?.Main?.Size) {
            keySpecs.push({ label: 'Display', value: specs.Display.Main.Size });
        } else if (specs.Display?.Size) {
            keySpecs.push({ label: 'Display', value: specs.Display.Size });
        }
        
        // Graphics
        if (specs.Performance?.Gpu) {
            keySpecs.push({ label: 'Graphics', value: specs.Performance.Gpu });
        }

        return keySpecs.slice(0, 6); // Limit to 6 key specs
    }

    displayDescription() {
        const descriptionContainer = document.getElementById('productDescription');
        if (!descriptionContainer) return;

        const description = this.productData.description || this.productData.desc || 'No description available.';
        
        // Format description (handle HTML or plain text)
        if (description.includes('<')) {
            descriptionContainer.innerHTML = description;
        } else {
            // Convert plain text to paragraphs
            const paragraphs = description.split('\n').filter(p => p.trim());
            descriptionContainer.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
        }
    }

    displayPriceComparison() {
        const priceList = document.getElementById('priceList');
        const retailerCount = document.getElementById('retailerCount');

        if (!priceList) return;

        if (!this.productData.offers || this.productData.offers.length === 0) {
            priceList.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p>No price information available at this time.</p>
                </div>
            `;
            if (retailerCount) {
                retailerCount.textContent = '(0 retailers)';
            }
            return;
        }

        // Sort offers by price (lowest first)
        const sortedOffers = [...this.productData.offers].sort((a, b) => a.price - b.price);

        // Update retailer count
        if (retailerCount) {
            retailerCount.textContent = `(${sortedOffers.length} ${sortedOffers.length === 1 ? 'retailer' : 'retailers'})`;
        }

        // Clear existing content
        priceList.innerHTML = '';

        // Create price comparison items
        sortedOffers.forEach((offer, index) => {
            const priceItem = this.createPriceItem(offer);
            priceList.appendChild(priceItem);
        });
    }

    createPriceItem(offer) {
        const priceItem = document.createElement('div');
        priceItem.className = 'price-item';
        
        // Format price
        const formattedPrice = this.formatPrice(offer.price);
        const originalPrice = offer.originalPrice && offer.originalPrice > offer.price ? this.formatPrice(offer.originalPrice) : null;
        
        // Handle retailer name - check both retailer and retailerName
        const retailerName = offer.retailer || offer.retailerName || 'Unknown Retailer';
        const retailerLogo = offer.logoUrl || offer.retailerLogo || 'https://via.placeholder.com/60?text=Store';
        
        priceItem.innerHTML = `
            <div class="price-item-info">
                <img src="${retailerLogo}" 
                     alt="${retailerName}" 
                     class="price-item-logo"
                     onerror="this.src='https://via.placeholder.com/60?text=Store'">
                <div class="price-item-details">
                    <h5>${this.escapeHtml(retailerName)}</h5>
                    <p>${offer.condition || 'New'} • ${offer.availability || offer.saleEnds ? `Sale ends: ${offer.saleEnds}` : 'In Stock'}</p>
                </div>
            </div>
            <div class="price-item-price">
                <div class="price">${formattedPrice}</div>
                ${originalPrice ? `<div class="original-price">${originalPrice}</div>` : ''}
            </div>
            <div class="price-item-actions">
                <a href="${offer.url || '#'}" 
                    class="btn-visit-store" 
                    target="_blank" 
                    rel="noopener noreferrer">
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

    displaySpecifications() {
        const specsTableBody = document.getElementById('specsTableBody');
        if (!specsTableBody) {
            console.warn('Specifications table body not found');
            return;
        }

        if (!this.productData.specs) {
            specsTableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">No specifications available</td>
                </tr>
            `;
            return;
        }

        const specs = this.flattenSpecs(this.productData.specs);
        
        if (!specs || specs.length === 0) {
            specsTableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">No specifications available</td>
                </tr>
            `;
            return;
        }

        specsTableBody.innerHTML = specs.map(spec => `
            <tr>
                <td>${this.escapeHtml(spec.label)}</td>
                <td>${this.escapeHtml(spec.value)}</td>
            </tr>
        `).join('');
    }

    flattenSpecs(specs, prefix = '') {
        const flattened = [];
        
        for (const key in specs) {
            const value = specs[key];
            const fullKey = prefix ? `${prefix} - ${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively flatten nested objects
                flattened.push(...this.flattenSpecs(value, fullKey));
            } else {
                // Add as a spec row
                flattened.push({
                    label: fullKey,
                    value: Array.isArray(value) ? value.join(', ') : String(value)
                });
            }
        }
        
        return flattened;
    }

    setupEventListeners() {
        // Wishlist button
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                if (window.wishlistManager) {
                    window.wishlistManager.toggleWishlist(this.productData);
                    this.updateWishlistButton();
                }
            });
        }

        // Price Alert button
        const priceAlertBtn = document.getElementById('priceAlertBtn');
        if (priceAlertBtn) {
            priceAlertBtn.addEventListener('click', () => {
                if (window.priceAlertModal) {
                    window.priceAlertModal.show(this.productData);
                }
            });
        }

        // Compare button - Navigate to comparison.html
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.productData) {
                    console.warn('No product data available for comparison');
                    if (typeof showErrorToast !== 'undefined') {
                        showErrorToast('Cannot compare product: No product data available.');
                    }
                    return;
                }
                
                // Get product ID
                const productId = this.productData.product_id || this.productData.id || this.productData.productId;
                if (!productId) {
                    console.error('Product ID not available for comparison.');
                    if (typeof showErrorToast !== 'undefined') {
                        showErrorToast('Cannot compare product: ID not found.');
                    }
                    return;
                }
                
                // Determine category for comparison
                let category = 'laptops';
                if (this.category === 'windows-laptops' || this.productData.category === 'windows-laptops') {
                    category = 'windows';
                } else if (this.category === 'chromebooks-laptops' || this.productData.category === 'chromebooks-laptops') {
                    category = 'chromebooks';
                } else if (this.category === 'macbooks-laptops' || this.productData.category === 'macbooks-laptops') {
                    category = 'macbooks';
                }
                
                // Navigate to comparison page with product ID
                window.location.href = `comparison.html?products=${productId}&category=${category}`;
            });
        } else {
            console.warn('Compare button not found in DOM');
        }

        // Initialize time filter buttons for price history
        this.initializeTimeFilters();
    }

    displayPriceHistory() {
        this.updatePriceHistoryChart(30);
    }

    async updatePriceHistoryChart(period = 30) {
        const priceChart = document.getElementById('priceHistoryChart');
        if (!priceChart) return;

        if (!this.productData.offers || this.productData.offers.length === 0) {
            priceChart.innerHTML = '<p class="text-muted">No price history available</p>';
            return;
        }

        priceChart.innerHTML = '<p class="text-muted">Loading price history...</p>';
        
        // Fetch real price history from Lambda API (with fallback to mock)
        const priceHistory = await this.generatePriceHistory(period);
        
        // Create the price chart
        this.createPriceChart(priceHistory, period);
    }

    /**
     * Fetch real price history from Lambda API
     * Falls back to mock data if API fails
     */
    async generatePriceHistory(period = 30) {
        if (!this.productId) {
            return this.generateMockPriceHistory(period);
        }

        try {
            // Calculate limit based on period (get more data for longer periods)
            const limit = Math.min(period * 2, 1000); // Up to 1000 records
            
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.PRICE_HISTORY_ENDPOINT}?product_id=${this.productId}&limit=${limit}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            let result = data;
            if (data.body) {
                result = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
            }
            
            const history = result.history || result.items || [];
            
            if (history.length === 0) {
                // No real history, fall back to mock
                return this.generateMockPriceHistory(period);
            }
            
            // Transform Lambda response to chart format
            return this.transformPriceHistoryForChart(history, period);
            
        } catch (error) {
            console.error('Error fetching price history:', error);
            // Fall back to mock data on error
            return this.generateMockPriceHistory(period);
        }
    }

    /**
     * Transform Lambda price history response to chart format
     */
    transformPriceHistoryForChart(history, period = 30) {
        // Sort by timestamp (oldest first for chronological chart)
        const sortedHistory = [...history].sort((a, b) => {
            const timeA = a.timestamp || new Date(a.createdAt || a.date).getTime();
            const timeB = b.timestamp || new Date(b.createdAt || b.date).getTime();
            return timeA - timeB;
        });
        
        // Calculate cutoff date based on period
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);
        
        // Filter by period and transform to chart format
        const chartData = [];
        let currentPrice = null;
        
        sortedHistory.forEach((item, index) => {
            const timestamp = item.timestamp || new Date(item.createdAt || item.date).getTime();
            const date = new Date(item.createdAt || item.date || timestamp);
            
            // Skip if outside period
            if (date < cutoffDate) {
                return;
            }
            
            // For first point, use oldPrice as starting point
            if (index === 0 && item.oldPrice) {
                chartData.push({
                    date: date.toISOString().split('T')[0],
                    price: item.oldPrice,
                    formattedDate: this.formatDateForChart(date, period),
                    timestamp: timestamp
                });
            }
            
            // Add the new price point
            chartData.push({
                date: date.toISOString().split('T')[0],
                price: item.newPrice,
                formattedDate: this.formatDateForChart(date, period),
                timestamp: timestamp,
                retailer: item.retailer,
                priceChange: item.priceChange || (item.newPrice - item.oldPrice),
                priceChangePercent: item.priceChangePercent
            });
            
            currentPrice = item.newPrice;
        });
        
        // If we have data, return it; otherwise fall back to mock
        if (chartData.length > 0) {
            return chartData;
        }
        
        return this.generateMockPriceHistory(period);
    }

    /**
     * Format date for chart labels based on period
     */
    formatDateForChart(date, period) {
        if (period <= 30) {
            return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        } else if (period <= 90) {
            return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
        }
    }

    /**
     * Generate mock price history as fallback
     */
    generateMockPriceHistory(period = 30) {
        const currentPrice = this.getLowestPrice();
        if (!currentPrice) return [];

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
            
            history.push({
                date: date.toISOString().split('T')[0],
                price: price,
                formattedDate: this.formatDateForChart(date, period)
            });
        }
        
        return history;
    }

    createPriceChart(priceHistory, period = 30) {
        const container = document.getElementById('priceHistoryChart');
        
        // Validate that priceHistory is an array
        if (!container || !priceHistory || !Array.isArray(priceHistory) || priceHistory.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-muted">No price history available</p>';
            }
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
                const dayNum = Math.max(1, Math.round(i * (period / Math.max(1, data.length - 1))));
                return `Day ${dayNum}`;
            } else {
                return d.formattedDate || `Day ${i + 1}`;
            }
        });

        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const midPrice = (minPrice + maxPrice) / 2;

        const ctx = canvas.getContext('2d');

        this.priceHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.productData.model || 'Product'} Price History`,
                    data: prices,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: (context) => {
                        const dataValue = context.dataset.data[context.dataIndex];
                        return dataValue < midPrice ? '#28a745' : '#dc3545';
                    },
                    pointRadius: 4,
                    pointHoverRadius: 6
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
                        callbacks: {
                            label: (context) => {
                                return `Price: R${context.parsed.y.toLocaleString('en-ZA')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => {
                                return `R${value.toLocaleString('en-ZA')}`;
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
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
    }

    updateWishlistButton() {
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (!wishlistBtn || !window.wishlistManager) return;

        const isInWishlist = window.wishlistManager.isInWishlist(this.productData);
        if (isInWishlist) {
            wishlistBtn.classList.add('active');
            wishlistBtn.textContent = 'Remove';
        } else {
            wishlistBtn.classList.remove('active');
            wishlistBtn.textContent = 'Add to Wishlist';
        }
    }

    getLowestPrice() {
        if (!this.productData.offers || this.productData.offers.length === 0) return null;
        const prices = this.productData.offers
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

    showErrorState(message) {
        // Show error in the existing structure
        const main = document.querySelector('.smartphones-info-main');
        if (main) {
            main.innerHTML = `
                <div class="error-state">
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h4>Error</h4>
                        <p>${this.escapeHtml(message)}</p>
                        <a href="laptops.html" class="btn btn-primary">Back to Laptops</a>
                    </div>
                </div>
            `;
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

    // Check if we're on the laptop-info.html page
    if (window.location.pathname.includes('laptop-info.html')) {
        // Initialize laptop info page
        window.laptopInfoPage = new LaptopInfoPage();
    }
});
