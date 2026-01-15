
class BadgeCounter {
    constructor() {
        this.wishlistCount = 0;
        this.priceAlertsCount = 0;
        this.notificationsCount = 0;
        this.chatUnreadCount = 5; // Hardcoded as requested
        this.isLoggedIn = false;
        this.authService = null;

        // API endpoints
        this.WISHLIST_API = 'https://hub.comparehubprices.co.za/wishlist/wishlist';
        this.PRICE_ALERTS_API = 'https://hub.comparehubprices.co.za/price-alerts/alerts';
        this.NOTIFICATIONS_API = 'https://hub.comparehubprices.co.za/notifications/notifications';
        // Separate chat endpoints for business and regular users
        this.CHAT_BUSINESS_CONVERSATIONS_API = 'https://hub.comparehubprices.co.za/chat-hub/chat/business/conversations';
        this.CHAT_USER_CONVERSATIONS_API = 'https://hub.comparehubprices.co.za/chat-hub/chat/user/conversations';

        // Track user type
        this.isBusinessUser = false;

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
                        this.isBusinessUser = true;
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
                this.isBusinessUser = false;
            } else {
                this.isLoggedIn = false;
                this.isBusinessUser = false;
            }
        } catch (error) {
            // Silently fail - don't log errors for unauthenticated users
            // Only log if it's an unexpected error (not a session error)
            if (error.message && !error.message.includes('Session expired') && !error.message.includes('Not authenticated')) {
                console.error('Error checking auth status:', error);
            }
            this.isLoggedIn = false;
            this.isBusinessUser = false;
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
            this.isBusinessUser = false;
            this.wishlistCount = 0;
            this.priceAlertsCount = 0;
            this.notificationsCount = 0;
            this.chatUnreadCount = 0;
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

        // Listen for chat updates
        document.addEventListener('chatUpdated', async () => {
            await this.fetchChatUnreadCount();
            this.updateChatBadges();
        });

        // Periodically check auth status (check more frequently to catch business logins)
        setInterval(async () => {
            const wasLoggedIn = this.isLoggedIn;
            const wasBusinessUser = this.isBusinessUser;
            await this.checkAuthStatus();

            // Refresh if login state changed or user type changed
            if (wasLoggedIn !== this.isLoggedIn || wasBusinessUser !== this.isBusinessUser) {
                if (this.isLoggedIn) {
                    await this.refreshAllCounts();
                } else {
                    this.wishlistCount = 0;
                    this.priceAlertsCount = 0;
                    this.notificationsCount = 0;
                    this.chatUnreadCount = 0;
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
            this.chatUnreadCount = 0;
            this.updateAllBadges();
            return;
        }

        // Fetch all counts in parallel
        await Promise.all([
            this.fetchWishlistCount(),
            this.fetchPriceAlertsCount(),
            this.fetchNotificationsCount(),
            this.fetchChatUnreadCount()
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
        // Only fetch if logged in
        if (!this.isLoggedIn) {
            this.priceAlertsCount = 0;
            return;
        }

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

            // Handle activeCount in response
            if (data.success && typeof data.activeCount === 'number') {
                this.priceAlertsCount = data.activeCount;
            }
            // Handle count in response
            else if (data.success && typeof data.count === 'number') {
                this.priceAlertsCount = data.count;
            }
            // Handle alerts array
            else if (data.success && data.alerts) {
                // Count only active alerts
                this.priceAlertsCount = data.alerts.filter(alert =>
                    alert.status === 'active' || alert.isActive === true
                ).length;
            } else {
                this.priceAlertsCount = 0;
            }
        } catch (error) {
            // Only log unexpected errors
            if (error.message && !error.message.includes('401') && !error.message.includes('404')) {
                console.error('Error fetching price alerts count:', error);
            }
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

            // Handle unreadCount in response
            if (data.success && typeof data.unreadCount === 'number') {
                this.notificationsCount = data.unreadCount;
            }
            // Handle notifications array - if unreadOnly=true, count all; otherwise filter
            else if (data.success && data.notifications) {
                // If API returns only unread (unreadOnly=true), count all
                // Otherwise filter by isUnread property
                this.notificationsCount = data.notifications.filter(n =>
                    n.isUnread === true || n.isUnread === undefined || n.read === false
                ).length;
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

    async fetchChatUnreadCount() {
        // Only fetch if logged in
        if (!this.isLoggedIn) {
            this.chatUnreadCount = 0;
            return;
        }

        try {
            // Use the correct endpoint based on user type
            const chatApiUrl = this.isBusinessUser
                ? this.CHAT_BUSINESS_CONVERSATIONS_API
                : this.CHAT_USER_CONVERSATIONS_API;

            const response = await fetch(chatApiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 404) {
                    this.chatUnreadCount = 0;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle regular user response (has businesses array)
            if (data.success && data.data && data.data.businesses) {
                this.chatUnreadCount = data.data.businesses.reduce((total, biz) => {
                    return total + (biz.unreadCount || 0);
                }, 0);
            }
            // Handle business user response (has users array)
            else if (data.success && data.data && data.data.users) {
                this.chatUnreadCount = data.data.users.reduce((total, user) => {
                    return total + (user.unreadCount || 0);
                }, 0);
            }
            // Handle direct conversations array response
            else if (data.success && data.conversations) {
                this.chatUnreadCount = data.conversations.reduce((total, conv) => {
                    return total + (conv.unreadCount || 0);
                }, 0);
            }
            // Handle totalUnread in response
            else if (data.success && typeof data.totalUnread === 'number') {
                this.chatUnreadCount = data.totalUnread;
            }
            else {
                this.chatUnreadCount = 0;
            }
        } catch (error) {
            // Only log unexpected errors (not 401/404 auth errors)
            if (error.message && !error.message.includes('401') && !error.message.includes('404')) {
                console.error('Error fetching chat unread count:', error);
            }
            this.chatUnreadCount = 0;
        }
    }

    updateAllBadges() {
        this.updateWishlistBadges();
        this.updatePriceAlertsBadges();
        this.updateNotificationsBadges();
        this.updateChatBadges();
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

        // Update sidebar card badge (Design 1: Classic Gradient Card)
        const sidebarCardBadge = document.getElementById('sidebarWishlistBadge');
        if (sidebarCardBadge) {
            sidebarCardBadge.textContent = count;
            sidebarCardBadge.style.display = count === 0 ? 'none' : 'flex';
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

        // Update sidebar card badge (Design 1: Classic Gradient Card)
        const sidebarCardBadge = document.getElementById('sidebarPriceAlertsBadge');
        if (sidebarCardBadge) {
            sidebarCardBadge.textContent = count;
            sidebarCardBadge.style.display = count === 0 ? 'none' : 'flex';
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

        // Update sidebar card badge (Design 1: Classic Gradient Card)
        const sidebarCardBadge = document.getElementById('sidebarNotificationsBadge');
        if (sidebarCardBadge) {
            sidebarCardBadge.textContent = count;
            sidebarCardBadge.style.display = count === 0 ? 'none' : 'flex';
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

    updateChatBadges() {
        const count = this.chatUnreadCount;

        // Update desktop badge
        const desktopBadge = document.getElementById('desktopChatUnreadCount');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }

        // Update desktop messages count badge
        const desktopMessagesBadge = document.getElementById('desktopMessagesCount');
        if (desktopMessagesBadge) {
            desktopMessagesBadge.textContent = count;
            desktopMessagesBadge.style.display = count === 0 ? 'none' : 'inline-flex';
        }

        // Update mobile sidebar badge (old design)
        const mobileMessagesBadge = document.getElementById('mobileMessagesBadge');
        if (mobileMessagesBadge) {
            mobileMessagesBadge.textContent = count;
            mobileMessagesBadge.style.display = count === 0 ? 'none' : 'flex';
        }

        // Update sidebar card badge (Design 1: Classic Gradient Card)
        const sidebarCardBadge = document.getElementById('sidebarMessagesBadge');
        if (sidebarCardBadge) {
            sidebarCardBadge.textContent = count;
            sidebarCardBadge.style.display = count === 0 ? 'none' : 'flex';
        }
    }

    // Get current counts
    getCounts() {
        return {
            wishlist: this.wishlistCount,
            priceAlerts: this.priceAlertsCount,
            notifications: this.notificationsCount,
            chatUnread: this.chatUnreadCount
        };
    }
}

// Initialize badge counter
let badgeCounter;

document.addEventListener('DOMContentLoaded', () => {
    badgeCounter = new BadgeCounter();
    window.badgeCounter = badgeCounter;

    // Make refresh function globally available
    window.refreshCountBadges = async function () {
        if (badgeCounter) {
            await badgeCounter.refresh();
        }
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BadgeCounter;
}
