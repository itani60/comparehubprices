/**
 * CompareHub Analytics Tracker
 * Handles Page Views, Sessions, Unique Visitors, and Time on Page.
 */

(function () {
    // CONFIGURATION
    const ANALYTICS_API_URL = 'https://hub.comparehubprices.co.za/data/track-view';
    const HEARTBEAT_INTERVAL = 10000; // 10 seconds

    // --- Helpers ---
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getStorage(key, storageType = localStorage) {
        return storageType.getItem(key);
    }

    function setStorage(key, value, storageType = localStorage) {
        storageType.setItem(key, value);
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
        return "desktop";
    }

    // --- Identity Management ---
    let visitorId = getStorage('ch_visitor_id');
    if (!visitorId) {
        visitorId = generateUUID();
        setStorage('ch_visitor_id', visitorId, localStorage);
    }

    let sessionId = getStorage('ch_session_id', sessionStorage);
    if (!sessionId) {
        sessionId = generateUUID();
        setStorage('ch_session_id', sessionId, sessionStorage);
    }

    // --- Tracking Logic ---
    async function sendEvent(type, additionalData = {}) {
        // Skip tracking on local filesystem
        if (window.location.protocol === 'file:') return;

        const payload = {
            type: type, // 'view' or 'heartbeat'
            pageUrl: window.location.pathname,
            deviceType: getDeviceType(),
            visitorId: visitorId,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        try {
            await fetch(ANALYTICS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true, // Important for processing even if tab closes
                body: JSON.stringify(payload)
            });
        } catch (err) {
            // Silently fail to not disturb user
            // console.warn('Tracking failed', err);
        }
    }

    // 1. Track Page View on Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => sendEvent('view'));
    } else {
        sendEvent('view');
    }

    // 2. Track Time (Heartbeat)
    // Sends a pulse every 10s. Backend sums these up to calculate 'Time on Page'.
    let heartbeatInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            sendEvent('heartbeat', { duration: HEARTBEAT_INTERVAL / 1000 });
        }
    }, HEARTBEAT_INTERVAL);

    // Stop tracking if page is hidden to avoid calculating idle time
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearInterval(heartbeatInterval);
        } else {
            // Restart interval
            heartbeatInterval = setInterval(() => {
                sendEvent('heartbeat', { duration: HEARTBEAT_INTERVAL / 1000 });
            }, HEARTBEAT_INTERVAL);
        }
    });

})();
