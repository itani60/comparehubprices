/**
 * CompareHub Analytics Tracker
 * Automatically tracks page views and sends data to the Analytics Service.
 */

(function () {
    // CONFIGURATION: Replace with your actual deployed API Endpoint URL
    // If using Lambda Function URL, paste it here.
    // If using API Gateway, paste the endpoint here.
    const ANALYTICS_API_URL = 'https://hub.comparehubprices.co.za/data/track-view';

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    }

    async function trackPageView() {
        // Skip tracking on local filesystem (optional, can be removed if testing locally)
        if (window.location.protocol === 'file:') {
            console.log('Analytics: Running on file protocol, tracking request might fail due to CORS or be skipped.');
            // return; // Uncomment to disable local file tracking
        }

        const data = {
            pageUrl: window.location.pathname,
            deviceType: getDeviceType()
        };

        try {
            console.log('Analytics: Tracking view...', data);

            // If the URL is still the placeholder, don't actually fetch to avoid 404s/Errors in console
            if (ANALYTICS_API_URL.includes('UPDATE_THIS')) {
                console.warn('Analytics: API URL not configured. Please update analytics-tracker.js');
                return;
            }

            const response = await fetch(ANALYTICS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error('Analytics: Failed to track view', response.statusText);
            } else {
                console.log('Analytics: View tracked successfully');
            }
        } catch (error) {
            console.error('Analytics: Error tracking view', error);
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
        trackPageView();
    }
})();
