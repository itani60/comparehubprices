
class BadgeCounter {
    constructor() {
        this.wishlistCount = 0;
        this.priceAlertsCount = 0;
        this.notificationsCount = 0;
        this.isLoggedIn = false;
        this.authService = null;
        
        // API endpoints
        this.WISHLIST_API = 'https://hub.comparehubprices.co.za/wishlist/wishlist';
        this.PRICE_ALERTS_API = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
        this.NOTIFICATIONS_API = 'https://hub.comparehubprices.co.za/notifications/notifications';
        
        this.init();
    }

    async init() {
        // Check authentication status
        await this.checkAuthStatus();
        
        // Load counts if logged in
        if (this.isLoggedIn) {
            await this.refreshAllCounts();
        } else {
            // Reset all counts to 0
            this.updateAllBadges();
        }
        
        // Setup auth listeners
        this.setupAuthListeners();
        
        // Periodically refresh counts (every 30 seconds)
        setInterval(async () => {
            if (this.isLoggedIn) {
                await this.refreshAllCounts();
            }
        }, 30000);
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
        // Listen for login events
        document.addEventListener('userLoggedIn', async () => {
            this.isLoggedIn = true;
            await this.refreshAllCounts();
        });
        
        // Listen for logout events
        document.addEventListener('userLoggedOut', () => {
            this.isLoggedIn = false;
            this.wishlistCount = 0;
            this.priceAlertsCount = 0;
            this.notificationsCount = 0;
            this.updateAllBadges();
        });
        
        // Listen for wishlist changes
        document.addEventListener('wishlistUpdated', async () => {
            await this.fetchWishlistCount();
            this.updateWishlistBadges();
        });
        
        // Listen for price alerts changes
        document.addEventListener('priceAlertsUpdated', async () => {
            await this.fetchPriceAlertsCount();
            this.updatePriceAlertsBadges();
        });
        
        // Listen for notifications changes
        document.addEventListener('notificationsUpdated', async () => {
            await this.fetchNotificationsCount();
            this.updateNotificationsBadges();
        });
        
        // Periodically check auth status (check more frequently to catch business logins)
        setInterval(async () => {
            const wasLoggedIn = this.isLoggedIn;
            await this.checkAuthStatus();
            
            if (wasLoggedIn !== this.isLoggedIn) {
                if (this.isLoggedIn) {
                    await this.refreshAllCounts();
                } else {
                    this.wishlistCount = 0;
                    this.priceAlertsCount = 0;
                    this.notificationsCount = 0;
                    this.updateAllBadges();
                }
            }
        }, 5000); // Check every 5 seconds instead of 30 to catch business logins faster
    }

    async refreshAllCounts() {
        if (!this.isLoggedIn) {
            this.wishlistCount = 0;
            this.priceAlertsCount = 0;
            this.notificationsCount = 0;
            this.updateAllBadges();
            return;
        }

        // Fetch all counts in parallel
        await Promise.all([
            this.fetchWishlistCount(),
            this.fetchPriceAlertsCount(),
            this.fetchNotificationsCount()
        ]);
        
        // Update all badges
        this.updateAllBadges();
    }

    async fetchWishlistCount() {
        try {
            const response = await fetch(this.WISHLIST_API, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 404) {
                    this.wishlistCount = 0;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && Array.isArray(data.items)) {
                this.wishlistCount = data.items.length;
            } else {
                this.wishlistCount = 0;
            }
        } catch (error) {
            console.error('Error fetching wishlist count:', error);
            this.wishlistCount = 0;
        }
    }

    async fetchPriceAlertsCount() {
        try {
            const response = await fetch(this.PRICE_ALERTS_API, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 404) {
                    this.priceAlertsCount = 0;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.alerts) {
                // Count only active alerts
                this.priceAlertsCount = data.alerts.filter(alert => alert.status === 'active').length;
            } else {
                this.priceAlertsCount = 0;
            }
        } catch (error) {
            console.error('Error fetching price alerts count:', error);
            this.priceAlertsCount = 0;
        }
    }

    async fetchNotificationsCount() {
        // Only fetch if logged in
        if (!this.isLoggedIn) {
            this.notificationsCount = 0;
            return;
        }
        
        try {
            // Fetch unread notifications only
            const response = await fetch(`${this.NOTIFICATIONS_API}?unreadOnly=true&limit=100`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 404) {
                    // Silently handle auth errors - don't log to console
                    this.notificationsCount = 0;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.notifications) {
                // Count unread notifications
                this.notificationsCount = data.notifications.filter(n => n.isUnread).length;
            } else {
                this.notificationsCount = 0;
            }
        } catch (error) {
            // Only log unexpected errors (not 401/404 auth errors)
            if (error.message && !error.message.includes('401') && !error.message.includes('404')) {
                console.error('Error fetching notifications count:', error);
            }
            this.notificationsCount = 0;
        }
    }

    updateAllBadges() {
        this.updateWishlistBadges();
        this.updatePriceAlertsBadges();
        this.updateNotificationsBadges();
    }

    updateWishlistBadges() {
        const count = this.wishlistCount;
        
        // Update desktop badge
        const desktopBadge = document.getElementById('desktopWishlistCount');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }
        
        // Update mobile badge (old ID for backward compatibility)
        const mobileBadge = document.getElementById('mobileWishlistCount');
        if (mobileBadge) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }
        
        // Update mobile sidebar badge (new ID used in mobile sidebar)
        const mobileSidebarBadge = document.getElementById('mobileWishlistBadge');
        if (mobileSidebarBadge) {
            mobileSidebarBadge.textContent = count;
            mobileSidebarBadge.style.display = count === 0 ? 'none' : 'flex';
        }
        
        // Update page badge
        const pageBadge = document.getElementById('pageWishlistCount');
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
        
        // Update account dashboard badge (my_account.html)
        const accountBadge = document.getElementById('accountWishlistCountText');
        if (accountBadge) {
            accountBadge.textContent = count;
        }
        
        // Update any generic wishlist count badges
        const wishlistLinks = document.querySelectorAll('a[href*="wishlist"], a[href*="whishlist"]');
        wishlistLinks.forEach(link => {
            const badge = link.querySelector('.wishlist-count-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline' : 'none';
            }
        });
    }

    updatePriceAlertsBadges() {
        const count = this.priceAlertsCount;
        
        // Update desktop badge
        const desktopBadge = document.getElementById('desktopPriceAlertsCount');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }
        
        // Update mobile sidebar badge
        const mobileSidebarBadge = document.getElementById('mobilePriceAlertsBadge');
        if (mobileSidebarBadge) {
            mobileSidebarBadge.textContent = count;
            mobileSidebarBadge.style.display = count === 0 ? 'none' : 'flex';
        }
        
        // Update page badge
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
        
        // Update account dashboard badge (my_account.html)
        const accountBadge = document.getElementById('accountPriceAlertsCountText');
        if (accountBadge) {
            accountBadge.textContent = count;
        }
    }

    updateNotificationsBadges() {
        const count = this.notificationsCount;
        
        // Update desktop badge
        const desktopBadge = document.getElementById('desktopNotificationCount');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }
        
        // Update mobile sidebar badge
        const mobileSidebarBadge = document.getElementById('mobileNotificationsBadge');
        if (mobileSidebarBadge) {
            mobileSidebarBadge.textContent = count;
            mobileSidebarBadge.style.display = count === 0 ? 'none' : 'flex';
        }
        
        // Update mobile notifications subtitle
        const mobileSubtitle = document.getElementById('mobileNotificationsSubtitle');
        if (mobileSubtitle) {
            if (count === 0) {
                mobileSubtitle.textContent = 'No unread';
            } else if (count === 1) {
                mobileSubtitle.textContent = '1 unread';
            } else {
                mobileSubtitle.textContent = `${count} unread`;
            }
        }
        
        // Update page badge
        const pageBadge = document.getElementById('pageNotificationCount');
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
        
        // Update account dashboard badge (my_account.html)
        const accountBadge = document.getElementById('accountNotificationsCountText');
        if (accountBadge) {
            accountBadge.textContent = count;
        }
    }

    // Public method to refresh counts (can be called from anywhere)
    async refresh() {
        await this.checkAuthStatus();
        await this.refreshAllCounts();
    }

    // Get current counts
    getCounts() {
        return {
            wishlist: this.wishlistCount,
            priceAlerts: this.priceAlertsCount,
            notifications: this.notificationsCount
        };
    }
}

// Initialize badge counter
let badgeCounter;

document.addEventListener('DOMContentLoaded', () => {
    badgeCounter = new BadgeCounter();
    window.badgeCounter = badgeCounter;
    
    // Make refresh function globally available
    window.refreshCountBadges = async function() {
        if (badgeCounter) {
            await badgeCounter.refresh();
        }
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BadgeCounter;
}
