/**
 * Cookie Banner functionality for CompareHub
 * This file contains all cookie banner-related JavaScript functionality
 */

// Cookie Banner Functions
function acceptCookies() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        cookieBanner.classList.remove('show');
        localStorage.setItem('cookiesAccepted', 'true');
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 400);
    }
}

function declineCookies() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        cookieBanner.classList.remove('show');
        localStorage.setItem('cookiesAccepted', 'false');
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 400);
    }
}

// Show cookie banner on page load if not already accepted/declined
function showCookieBanner() {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === null) {
        const cookieBanner = document.getElementById('cookieBanner');
        if (cookieBanner) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000); // Show after 1 second delay
        }
    }
}

// Make functions available globally
window.acceptCookies = acceptCookies;
window.declineCookies = declineCookies;
window.showCookieBanner = showCookieBanner;

// Initialize cookie banner
document.addEventListener('DOMContentLoaded', function() {
    showCookieBanner();
});