
(function () {
    function safeParse(json, fallback) {
        try { return JSON.parse(json); } catch { return fallback; }
    }

    function getWishlistCount() {
        const raw = localStorage.getItem('comparehub_wishlist');
        const items = safeParse(raw || '[]', []);
        return Array.isArray(items) ? items.length : 0;
    }

    function getPriceAlertsCount() {
        const raw = localStorage.getItem('priceAlerts');
        const items = safeParse(raw || '[]', []);
        if (!Array.isArray(items)) return 0;
        return items.filter(a => !a.status || a.status === 'active').length;
    }

    function getUnreadNotificationsCount() {
        const stored = localStorage.getItem('notificationsUnreadCount');
        const asNum = stored !== null ? Number(stored) : NaN;
        return Number.isFinite(asNum) && asNum >= 0 ? asNum : 0;
    }

    function updateStatText(el, prefix, count, suffix) {
        if (!el) return;
        el.textContent = `${prefix}${count}${suffix}`;
    }

    function updateDashboardCounts() {
    
        const wishlistStat = document.querySelector('.dashboard-card .card-content h3 + p + .card-stats .stat-item i.fa-heart')?.parentElement;
      
        const alertsStat = document.querySelector('.dashboard-card .card-content h3 + p + .card-stats .stat-item i.fa-tag')?.parentElement;
      
        const notificationsStat = document.querySelector('.dashboard-card .card-content h3 + p + .card-stats .stat-item i.fa-bell')?.parentElement;

        const wishlistCount = getWishlistCount();
        const alertsCount = getPriceAlertsCount();
        const unreadCount = getUnreadNotificationsCount();

        if (wishlistStat) updateStatText(wishlistStat, '', wishlistCount, ' Saved Items');
        if (alertsStat) updateStatText(alertsStat, '', alertsCount, ' Active Alerts');
        if (notificationsStat) updateStatText(notificationsStat, '', unreadCount, ' Unread');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateDashboardCounts);
    } else {
        updateDashboardCounts();
    }

 
    window.refreshMyAccountCounts = updateDashboardCounts;
})();













































































































