// Notifications View Page
// Displays full notification details from URL parameters

class NotificationViewManager {
    constructor() {
        this.notificationData = null;
        this.init();
    }

    async init() {
        // Only run on notifications_view.html page
        if (!window.location.pathname.includes('notifications_view.html')) return;

        // Get notification data from URL parameters
        this.loadNotificationFromURL();
        
        // Check if it's a price alert by type or by message content
        const isPriceAlert = this.notificationData.type === 'price-alert' || 
                            this.notificationData.title.toLowerCase().includes('price drop') ||
                            this.notificationData.message.toLowerCase().includes('price dropped');
        
        // Check if it's a new product notification
        const isNewProduct = this.notificationData.type === 'new-product' || 
                            this.notificationData.title.toLowerCase().includes('new product') ||
                            this.notificationData.message.toLowerCase().includes('now available');
        
        if (isPriceAlert) {
            // Set type to price-alert if not already set
            if (this.notificationData.type !== 'price-alert') {
                this.notificationData.type = 'price-alert';
            }
            
            // Parse the message to extract product info
            const parsed = this.parsePriceDropMessage(this.notificationData.message);
            
            // Always set product name from parsed or use from URL
            this.notificationData.productName = parsed.productName || this.notificationData.productName || '';
            this.notificationData.retailer = parsed.retailer || this.notificationData.retailer || '';
            this.notificationData.priceDrop = parsed.priceDrop || this.notificationData.priceDrop || '';
            
            // For testing: Use hardcoded data based on product name
            // iPhone 15 Pro example
            if (this.notificationData.productName.toLowerCase().includes('iphone 15 pro')) {
                this.notificationData.productId = 'apple-iphone-15-pro-256gb-silver';
                this.notificationData.productImage = 'https://images.comparehubprices.site/products-data-images/smartphones/apple-iphone-16-plus-128gb-pink-1762975233760.png';
                this.notificationData.oldPrice = '24999';
                this.notificationData.newPrice = '22499';
                this.notificationData.priceDrop = '2500';
                this.notificationData.retailer = this.notificationData.retailer || 'Takealot';
            } else if (this.notificationData.productName) {
                // Default hardcoded data for other products
                this.notificationData.productImage = 'https://images.comparehubprices.site/products/placeholder.jpg';
                // Calculate prices from price drop if we have it
                if (this.notificationData.priceDrop && !this.notificationData.oldPrice && !this.notificationData.newPrice) {
                    // Use example prices
                    this.notificationData.newPrice = '20000';
                    this.notificationData.oldPrice = (parseFloat(this.notificationData.newPrice) + parseFloat(this.notificationData.priceDrop)).toString();
                }
            }
            
            // If still no product image but we have a product name, set a default
            if (!this.notificationData.productImage && this.notificationData.productName) {
                this.notificationData.productImage = 'https://images.comparehubprices.site/products/placeholder.jpg';
            }
        } else if (isNewProduct) {
            // Set type to new-product if not already set
            if (this.notificationData.type !== 'new-product') {
                this.notificationData.type = 'new-product';
            }
            
            // Parse the message to extract product name
            // Example: "Samsung Galaxy S24 Ultra now available for comparison"
            let productName = '';
            const productMatch = this.notificationData.message.match(/^([^n]+?)\s+now\s+available/i);
            if (productMatch) {
                productName = productMatch[1].trim();
            } else {
                // Try alternative pattern: everything before "now available"
                const altMatch = this.notificationData.message.match(/(.+?)\s+now\s+available/i);
                if (altMatch) {
                    productName = altMatch[1].trim();
                }
            }
            
            this.notificationData.productName = productName || this.notificationData.productName || '';
            
            // For testing: Use hardcoded data for Samsung Galaxy S24 Ultra
            if (this.notificationData.productName.toLowerCase().includes('samsung galaxy s24 ultra') || 
                this.notificationData.message.toLowerCase().includes('samsung galaxy s24 ultra')) {
                this.notificationData.productId = 'samsung-galaxy-s24-ultra';
                this.notificationData.productImage = 'https://images.comparehubprices.site/products-data-images/smartphones/samsung-galaxy-s24-ultra.jpg';
                this.notificationData.productName = 'Samsung Galaxy S24 Ultra';
                this.notificationData.newPrice = '24999';
                this.notificationData.retailer = 'Multiple Retailers';
            } else if (this.notificationData.productName) {
                // Default hardcoded data for other new products
                this.notificationData.productImage = 'https://images.comparehubprices.site/products/placeholder.jpg';
                this.notificationData.newPrice = '20000';
                this.notificationData.retailer = 'Multiple Retailers';
            }
            
            // If still no product image but we have a product name, set a default
            if (!this.notificationData.productImage && this.notificationData.productName) {
                this.notificationData.productImage = 'https://images.comparehubprices.site/products/placeholder.jpg';
                this.notificationData.newPrice = this.notificationData.newPrice || '20000';
                this.notificationData.retailer = this.notificationData.retailer || 'Multiple Retailers';
            }
            
            // Always set a product image for new products if we detected it's a new product
            if (isNewProduct && !this.notificationData.productImage) {
                this.notificationData.productImage = 'https://images.comparehubprices.site/products/placeholder.jpg';
                this.notificationData.newPrice = this.notificationData.newPrice || '20000';
                this.notificationData.retailer = this.notificationData.retailer || 'Multiple Retailers';
            }
        }
        
        // Display the notification
        this.displayNotification();
    }

    loadNotificationFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.notificationData = {
            title: decodeURIComponent(urlParams.get('title') || 'Notification'),
            message: decodeURIComponent(urlParams.get('message') || 'No message available'),
            time: decodeURIComponent(urlParams.get('time') || 'Just now'),
            type: decodeURIComponent(urlParams.get('type') || 'info'),
            productId: decodeURIComponent(urlParams.get('productId') || ''),
            productImage: decodeURIComponent(urlParams.get('productImage') || ''),
            productName: decodeURIComponent(urlParams.get('productName') || ''),
            oldPrice: decodeURIComponent(urlParams.get('oldPrice') || ''),
            newPrice: decodeURIComponent(urlParams.get('newPrice') || ''),
            priceDrop: decodeURIComponent(urlParams.get('priceDrop') || ''),
            retailer: decodeURIComponent(urlParams.get('retailer') || '')
        };
    }

    parsePriceDropMessage(message) {
        // Parse message like "iPhone 15 Pro price dropped by R2,500 at Takealot"
        const priceDropMatch = message.match(/price dropped by R([\d,]+)/i);
        const retailerMatch = message.match(/at\s+([A-Za-z\s]+)$/i);
        
        // Extract product name - everything before "price dropped"
        let productName = '';
        const productMatch = message.match(/^(.+?)\s+price\s+dropped/i);
        if (productMatch) {
            productName = productMatch[1].trim();
        }
        
        return {
            productName: productName,
            priceDrop: priceDropMatch ? priceDropMatch[1].replace(/,/g, '') : '',
            retailer: retailerMatch ? retailerMatch[1].trim() : ''
        };
    }

    async fetchProductData(productName) {
        if (!productName) return null;
        
        try {
            // Try to fetch from smartphones API
            const response = await fetch('https://acc.comparehubprices.site/data/products?category=smartphones');
            if (!response.ok) return null;
            
            const data = await response.json();
            const products = Array.isArray(data) ? data : (data.products || data.smartphones || []);
            
            // Find product by name (case-insensitive partial match)
            const product = products.find(p => {
                const productNameLower = productName.toLowerCase();
                const model = (p.model || '').toLowerCase();
                const title = (p.title || '').toLowerCase();
                return model.includes(productNameLower) || title.includes(productNameLower);
            });
            
            return product || null;
        } catch (error) {
            console.error('Error fetching product data:', error);
            return null;
        }
    }

    getNotificationIcon(type) {
        const iconMap = {
            'price-alert': 'fas fa-tag',
            'new-product': 'fas fa-plus',
            'deals': 'fas fa-gift',
            'system': 'fas fa-bell',
            'info': 'fas fa-info-circle'
        };
        return iconMap[type] || 'fas fa-bell';
    }

    getNotificationTypeLabel(type) {
        const labelMap = {
            'price-alert': 'Price Alert',
            'new-product': 'New Product',
            'deals': 'Deals & Offers',
            'system': 'System Update',
            'info': 'Information'
        };
        return labelMap[type] || 'Notification';
    }

    getNotificationColor(type) {
        const colorMap = {
            'price-alert': '#dc3545',
            'new-product': '#28a745',
            'deals': '#ffc107',
            'system': '#007bff',
            'info': '#17a2b8'
        };
        return colorMap[type] || '#6c757d';
    }

    displayNotification() {
        const main = document.querySelector('main.main');
        if (!main) return;

        if (!this.notificationData) {
            main.innerHTML = `
                <div class="notification-view-container">
                    <!-- Breadcrumb -->
                    <nav class="breadcrumb-nav" aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item">
                                <a href="index.html">Home</a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="my-account.html">My Account</a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="notifications">Notifications</a>
                            </li>
                            <li class="breadcrumb-item active" aria-current="page">
                                Notification Not Found
                            </li>
                        </ol>
                    </nav>
                    
                    <div class="notification-view-error">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2>Notification Not Found</h2>
                        <p>We couldn't find the notification you're looking for.</p>
                        <a href="notifications" class="btn-view-all">
                            <i class="fas fa-list"></i> View All Notifications
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        const iconClass = this.getNotificationIcon(this.notificationData.type);
        const typeLabel = this.getNotificationTypeLabel(this.notificationData.type);
        const color = this.getNotificationColor(this.notificationData.type);
        
        // Debug: Log notification data
        console.log('Notification data:', this.notificationData);
        console.log('Should show product card:', (this.notificationData.type === 'price-alert' || this.notificationData.type === 'new-product') && this.notificationData.productImage);
        console.log('Type:', this.notificationData.type, 'Product Image:', this.notificationData.productImage);
        
        // Set CSS variable for notification color
        document.documentElement.style.setProperty('--notification-color', color);
        document.documentElement.style.setProperty('--notification-color-light', this.lightenColor(color, 0.3));

        main.innerHTML = `
            <div class="notification-view-container">
                <div class="notification-view-card">
                    ${(this.notificationData.type === 'price-alert' || this.notificationData.type === 'new-product') && this.notificationData.productImage ? `
                    <div class="smartphone-card" style="max-width: 600px; margin: 0 auto;">
                        <div class="card-image-container">
                            <img src="${this.escapeHtml(this.notificationData.productImage)}" alt="${this.escapeHtml(this.notificationData.productName || this.notificationData.title)}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        </div>
                        <div class="card-content">
                            <span class="brand-badge">${this.escapeHtml(this.notificationData.retailer || 'Product')}</span>
                            <h3 class="product-name">${this.escapeHtml(this.notificationData.productName || this.notificationData.title)}</h3>
                            ${this.notificationData.type === 'price-alert' && this.notificationData.oldPrice && this.notificationData.newPrice ? `
                            <div class="product-price">
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                    <span style="font-size: 0.9rem; color: #6c757d; text-decoration: line-through;">R ${parseFloat(this.notificationData.oldPrice).toLocaleString('en-ZA')}</span>
                                    <span class="current-price">R ${parseFloat(this.notificationData.newPrice).toLocaleString('en-ZA')}</span>
                                </div>
                                ${this.notificationData.priceDrop ? `
                                <div style="background: #dc3545; color: white; padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600; display: inline-block;">
                                    <i class="fas fa-tag"></i> Save R ${parseFloat(this.notificationData.priceDrop).toLocaleString('en-ZA')}
                                </div>
                                ` : ''}
                            </div>
                            ` : this.notificationData.newPrice ? `
                            <div class="product-price">
                                <span class="current-price">R ${parseFloat(this.notificationData.newPrice).toLocaleString('en-ZA')}</span>
                            </div>
                            ` : ''}
                            ${this.notificationData.retailer ? `
                            <div class="retailer-info">
                                <span><i class="fas fa-store"></i> ${this.escapeHtml(this.notificationData.retailer)}</span>
                            </div>
                            ` : ''}
                        </div>
                        ${this.notificationData.productId ? `
                        <div class="card-actions">
                            <a href="smartphone-info.html?id=${this.escapeHtml(this.notificationData.productId)}" class="btn-compare" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
                                View
                            </a>
                            <button class="btn-wishlist" data-product-id="${this.escapeHtml(this.notificationData.productId)}">
                                Add to Wishlist
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    ${(this.notificationData.type !== 'price-alert' && this.notificationData.type !== 'new-product') || !this.notificationData.productImage ? `
                    <div class="notification-view-content">
                        <h1 class="notification-view-title">${this.escapeHtml(this.notificationData.title)}</h1>
                        <div class="notification-view-time">
                            <i class="fas fa-clock"></i>
                            <span>${this.escapeHtml(this.notificationData.time)}</span>
                        </div>
                        <div class="notification-view-message">
                            <p>${this.escapeHtml(this.notificationData.message)}</p>
                        </div>
                    </div>
                    ` : ''}

                    ${(this.notificationData.type === 'price-alert' || this.notificationData.type === 'new-product') && this.notificationData.productImage ? `
                    <div class="notification-view-back-button">
                        <a href="notifications" class="btn-back-to-notifications">
                            <i class="fas fa-arrow-left"></i>
                            Back to Notifications
                        </a>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    lightenColor(color, amount) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Lighten
        const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
        const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
        const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
        
        // Convert back to hex
        return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
    }
}

// Mark as read and go back function
function markAsReadAndGoBack() {
    // You can add logic here to mark the notification as read via API
    // For now, just navigate back
    window.location.href = 'notifications';
}

// Initialize notification view manager
let notificationViewManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationViewManager = new NotificationViewManager();
    window.notificationViewManager = notificationViewManager;
});

