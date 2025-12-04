// Notifications Page Management
// This handles the notifications list display on notifications.html

class NotificationsPageManager {
    constructor() {
        this.allNotifications = [];
        // API endpoints
        // Base URL: acc.comparehubprices.site/notifications (custom domain path)
        // API Gateway routes: /notifications (GET, POST, DELETE), /notifications/read (PUT)
        this.API_BASE_URL = 'https://acc.comparehubprices.site/notifications';
        this.GET_URL = `${this.API_BASE_URL}/notifications`;
        this.MARK_READ_URL = `${this.API_BASE_URL}/notifications/read`;
        this.DELETE_URL = `${this.API_BASE_URL}/notifications`;
        this.init();
    }

    async init() {
        // Only run on notifications page (with or without .html extension)
        if (!window.location.pathname.includes('notifications')) return;

        // Show loading state
        this.showLoadingState();
        
        // Fetch notifications from API
        await this.fetchNotifications();
        
        // Display notifications
        this.displayNotifications();
    }

    async fetchNotifications() {
        try {
            const response = await fetch(this.GET_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.notifications) {
                // Convert API format to internal format
                this.allNotifications = data.notifications.map((notif, index) => ({
                    id: notif.id || notif.notificationId || index,
                    notificationId: notif.notificationId,
                    title: notif.title,
                    message: notif.message,
                    time: notif.time,
                    type: notif.type,
                    isUnread: notif.isUnread,
                    timestamp: notif.timestamp || notif.dateCreated,
                    productId: notif.productId,
                    productName: notif.productName,
                    productImage: notif.productImage,
                    oldPrice: notif.oldPrice,
                    newPrice: notif.newPrice,
                    priceDrop: notif.priceDrop,
                    retailer: notif.retailer
                }));

                // Update unread count
                this.updateDesktopNotificationCount();
                this.updatePageNotificationCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('notificationsUpdated'));
            } else {
                console.error('Failed to fetch notifications:', data);
                this.allNotifications = [];
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            this.allNotifications = [];
            // Show error state
            this.showErrorState();
        }
    }

    showErrorState() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to load notifications</h3>
                <p>Please try refreshing the page.</p>
                <button onclick="location.reload()" class="btn-retry">Retry</button>
            </div>
        `;
    }

    loadNotifications() {
        // Get all notification items from the DOM BEFORE we clear them
        const container = document.getElementById('notificationsList');
        if (!container) return;
        
        const notificationItems = container.querySelectorAll('.notification-item');
        
        notificationItems.forEach((item, index) => {
            const titleElement = item.querySelector('.notification-content h4');
            const messageElement = item.querySelector('.notification-content p');
            const timeElement = item.querySelector('.notification-time');
            const iconElement = item.querySelector('.notification-icon i');
            
            const notification = {
                id: index,
                title: titleElement ? titleElement.textContent : '',
                message: messageElement ? messageElement.textContent : '',
                time: timeElement ? timeElement.textContent : '',
                type: this.getNotificationType(iconElement),
                isUnread: item.classList.contains('unread'),
                timestamp: this.parseTimestamp(timeElement ? timeElement.textContent : ''),
                element: item
            };
            
            this.allNotifications.push(notification);
        });
    }

    showLoadingState() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create loading state HTML
        const loadingHTML = `
            <div class="loading-state notifications-loading">
                <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h4>Loading notifications...</h4>
                <p>Please wait while we fetch your notifications</p>
            </div>
        `;

        container.innerHTML = loadingHTML;
    }

    getNotificationType(iconElement) {
        if (!iconElement) return 'info';
        
        const classList = iconElement.classList;
        if (classList.contains('fa-tag')) return 'price-alert';
        if (classList.contains('fa-plus')) return 'new-product';
        if (classList.contains('fa-gift')) return 'deals';
        if (classList.contains('fa-bell')) return 'system';
        return 'info';
    }

    parseTimestamp(timeText) {
        // Convert "X hours ago", "X days ago" to approximate timestamp
        const now = new Date();
        const text = timeText.toLowerCase();
        
        if (text.includes('hour')) {
            const hours = parseInt(text);
            return new Date(now - hours * 60 * 60 * 1000);
        } else if (text.includes('day')) {
            const days = parseInt(text);
            return new Date(now - days * 24 * 60 * 60 * 1000);
        } else if (text.includes('minute')) {
            const minutes = parseInt(text);
            return new Date(now - minutes * 60 * 1000);
        }
        
        return now;
    }

    displayNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        // Remove loading state
        const loadingState = container.querySelector('.notifications-loading');
        if (loadingState) {
            loadingState.remove();
        }

        // Clear existing content
        container.innerHTML = '';

        // Show empty state if no notifications
        if (this.allNotifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <div class="empty-notifications-content">
                        <div class="empty-notifications-icon">
                            <i class="fas fa-bell-slash"></i>
                        </div>
                        <h3>No notifications</h3>
                        <p>You're all caught up! Check back later for updates.</p>
                    </div>
                </div>
            `;
            
            // Hide remove all button
            const removeAllBtn = document.querySelector('.btn-remove-all');
            if (removeAllBtn) {
                removeAllBtn.style.display = 'none';
            }
            return;
        }

        // Show remove all button
        const removeAllBtn = document.querySelector('.btn-remove-all');
        if (removeAllBtn) {
            removeAllBtn.style.display = 'flex';
        }

        // Display all notifications with View button
        this.allNotifications.forEach(notification => {
            const notificationHTML = this.createNotificationHTML(notification);
            container.insertAdjacentHTML('beforeend', notificationHTML);
        });

        // Setup event listeners for mark as read buttons
        this.setupMarkAsReadListeners();
        
        // Setup event listeners for view buttons
        this.setupViewButtonListeners();

        // Update desktop notification badge count (unread only)
        this.updateDesktopNotificationCount();
        this.updatePageNotificationCount();
    }

    createNotificationHTML(notification) {
        const unreadClass = notification.isUnread ? 'unread' : '';
        const iconClass = this.getIconClass(notification.type);
        const notificationId = notification.notificationId || notification.id;
        
        return `
            <div class="notification-item ${unreadClass}" data-notification-id="${notificationId}">
                <div class="notification-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <h4>${this.escapeHtml(notification.title)}</h4>
                    <p>${this.escapeHtml(notification.message)}</p>
                    <span class="notification-time">${this.escapeHtml(notification.time)}</span>
                </div>
                <div class="notification-actions">
                    <button class="btn-view" title="View notification">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-mark-read" title="Mark as read">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getIconClass(type) {
        const iconMap = {
            'price-alert': 'fas fa-tag',
            'new-product': 'fas fa-plus',
            'deals': 'fas fa-gift',
            'system': 'fas fa-bell',
            'info': 'fas fa-info-circle'
        };
        return iconMap[type] || 'fas fa-bell';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupMarkAsReadListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-mark-read')) {
                e.preventDefault();
                e.stopPropagation();
                
                const notificationItem = e.target.closest('.notification-item');
                if (notificationItem) {
                    notificationItem.classList.remove('unread');
                    this.updateNotificationReadStatus(notificationItem);
                    this.updateDesktopNotificationCount();
                    this.updatePageNotificationCount();
                }
            }
        });
    }

    parsePriceDropMessage(message) {
        // Parse message like "iPhone 15 Pro price dropped by R2,500 at Takealot"
        const priceDropMatch = message.match(/price dropped by R([\d,]+)/i);
        const retailerMatch = message.match(/at\s+([A-Za-z\s]+)$/i);
        const productMatch = message.match(/^([^p]+?)\s+price/i);
        
        return {
            productName: productMatch ? productMatch[1].trim() : '',
            priceDrop: priceDropMatch ? priceDropMatch[1].replace(/,/g, '') : '',
            retailer: retailerMatch ? retailerMatch[1].trim() : ''
        };
    }

    setupViewButtonListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-view')) {
                e.preventDefault();
                e.stopPropagation();
                
                const notificationItem = e.target.closest('.notification-item');
                if (notificationItem) {
                    // Get notification ID from data attribute
                    const notificationId = notificationItem.getAttribute('data-notification-id');
                    const notification = this.allNotifications.find(n => 
                        (n.notificationId || String(n.id)) === notificationId
                    );
                    
                    if (!notification) return;
                    
                    const params = new URLSearchParams({
                        title: encodeURIComponent(notification.title),
                        message: encodeURIComponent(notification.message),
                        time: encodeURIComponent(notification.time),
                        type: encodeURIComponent(notification.type)
                    });
                    
                    // Add product data if available
                    if (notification.productName) {
                        params.append('productName', encodeURIComponent(notification.productName));
                    }
                    if (notification.productId) {
                        params.append('productId', encodeURIComponent(notification.productId));
                    }
                    if (notification.productImage) {
                        params.append('productImage', encodeURIComponent(notification.productImage));
                    }
                    if (notification.priceDrop) {
                        params.append('priceDrop', encodeURIComponent(notification.priceDrop));
                    }
                    if (notification.oldPrice) {
                        params.append('oldPrice', encodeURIComponent(notification.oldPrice));
                    }
                    if (notification.newPrice) {
                        params.append('newPrice', encodeURIComponent(notification.newPrice));
                    }
                    if (notification.retailer) {
                        params.append('retailer', encodeURIComponent(notification.retailer));
                    }
                    
                    window.location.href = `notifications_view.html?${params.toString()}`;
                }
            }
        });
    }

    async updateNotificationReadStatus(item) {
        // Find notification in array
        const notificationId = item.getAttribute('data-notification-id');
        const notification = this.allNotifications.find(n => 
            n.notificationId === notificationId || String(n.id) === notificationId
        );
        
        if (!notification) return;

        try {
            const response = await fetch(this.MARK_READ_URL, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationId: notification.notificationId || notification.id
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    notification.isUnread = false;
                    // Update UI
                    item.classList.remove('unread');
                    this.updateDesktopNotificationCount();
                    this.updatePageNotificationCount();
                    // Dispatch event for badge counter
                    document.dispatchEvent(new CustomEvent('notificationsUpdated'));
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    updateDesktopNotificationCount() {
        const badge = document.getElementById('desktopNotificationCount');
        if (!badge) return;
        
        const unreadCount = this.allNotifications.filter(n => n.isUnread).length;
        badge.textContent = unreadCount;
        
        // Trigger badge-counter.js to refresh all notification badges
        if (window.refreshCountBadges && typeof window.refreshCountBadges === 'function') {
            window.refreshCountBadges();
        }
        
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-flex';
        }
    }

    updatePageNotificationCount() {
        const pageBadge = document.getElementById('pageNotificationCount');
        if (!pageBadge) return;
        
        const unreadCount = this.allNotifications.filter(n => n.isUnread).length;
        pageBadge.textContent = unreadCount;
        const displaySection = pageBadge.closest('.wishlist-count-display');
        
        if (unreadCount === 0) {
            if (displaySection) displaySection.style.display = 'none';
        } else {
            pageBadge.style.display = 'inline-flex';
            if (displaySection) displaySection.style.display = 'flex';
        }
    }
}

// Initialize notifications page manager
let notificationsPageManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationsPageManager = new NotificationsPageManager();
    window.notificationsPageManager = notificationsPageManager;
});

// Remove all notifications function
async function removeAllNotifications() {
    if (!window.notificationsPageManager) {
        console.error('NotificationsPageManager not found');
        return;
    }

    try {
        const response = await fetch(window.notificationsPageManager.DELETE_URL, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deleteAll: true
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Clear notifications
                window.notificationsPageManager.allNotifications = [];
                
                // Update UI
                const notificationsList = document.getElementById('notificationsList');
                if (notificationsList) {
                    notificationsList.innerHTML = `
                        <div class="empty-notifications">
                            <div class="empty-notifications-content">
                                <div class="empty-notifications-icon">
                                    <i class="fas fa-bell-slash"></i>
                                </div>
                                <h3>All notifications removed</h3>
                                <p>You have successfully cleared all notifications.</p>
                            </div>
                        </div>
                    `;
                }
                
                // Hide the remove all button after clearing
                const removeAllBtn = document.querySelector('.btn-remove-all');
                if (removeAllBtn) {
                    removeAllBtn.style.display = 'none';
                }
                
                // Update notification count
                window.notificationsPageManager.updateDesktopNotificationCount();
                window.notificationsPageManager.updatePageNotificationCount();
                // Dispatch event for badge counter
                document.dispatchEvent(new CustomEvent('notificationsUpdated'));
            }
        } else {
            throw new Error('Failed to delete notifications');
        }
    } catch (error) {
        console.error('Error removing all notifications:', error);
        alert('Failed to remove notifications. Please try again.');
    }
}
