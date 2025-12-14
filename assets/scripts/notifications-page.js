
class NotificationsPageService {
    constructor() {
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za/notifications';
        this.GET_URL = `${this.API_BASE_URL}/notifications`;
        this.MARK_READ_URL = `${this.API_BASE_URL}/notifications/read`;
        this.DELETE_URL = `${this.API_BASE_URL}/notifications`;
    }

    async getAuthHeaders() {
        try {
            if (window.awsAuthService && typeof window.awsAuthService.getAuthHeaders === 'function') {
                return await window.awsAuthService.getAuthHeaders();
            }
            return {};
        } catch (error) {
            console.error('Error getting auth headers:', error);
            return {};
        }
    }

    async fetchNotifications() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(this.GET_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.notifications || data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(this.MARK_READ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({
                    notificationId: notificationId
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to mark notification as read: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.DELETE_URL}/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete notification: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    async deleteAllNotifications() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(this.DELETE_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete all notifications: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw error;
        }
    }

    formatNotificationTime(createdAt) {
        if (!createdAt) return 'Just now';
        
        try {
            const now = new Date();
            const notificationDate = new Date(createdAt);
            const diffMs = now - notificationDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
            if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
            if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
            
            return notificationDate.toLocaleDateString();
        } catch (error) {
            return 'Just now';
        }
    }

    mapApiNotificationToDisplay(apiNotification) {
        return {
            id: apiNotification.notificationId || apiNotification.id,
            title: apiNotification.title || 'Notification',
            message: apiNotification.message || apiNotification.body || '',
            type: apiNotification.type || 'general',
            time: this.formatNotificationTime(apiNotification.createdAt || apiNotification.timestamp),
            category: apiNotification.category || '',
            isUnread: apiNotification.isRead === false || apiNotification.read === false || apiNotification.isUnread === true,
            createdAt: apiNotification.createdAt || apiNotification.timestamp,
            productName: apiNotification.productName || apiNotification.product?.name,
            productId: apiNotification.productId || apiNotification.product?.id,
            productImage: apiNotification.productImage || apiNotification.product?.image,
            oldPrice: apiNotification.oldPrice || apiNotification.price?.old,
            newPrice: apiNotification.newPrice || apiNotification.price?.new,
            priceDrop: apiNotification.priceDrop || apiNotification.savings,
            retailer: apiNotification.retailer || apiNotification.store
        };
    }
}


const notificationsPageService = new NotificationsPageService();

window.notificationsPageService = notificationsPageService;

