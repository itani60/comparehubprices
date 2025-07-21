/**
 * Content Padding Adjustment for CompareHub
 * This file contains functionality to adjust content padding based on header height
 */

// Function to adjust content padding based on header height
function adjustContentPadding() {
    const header = document.querySelector('.header');
    const mainContainer = document.querySelector('.main-container');
    
    if (header && mainContainer) {
        const headerHeight = header.offsetHeight;
        mainContainer.style.paddingTop = `${headerHeight}px`;
    }
}

// Make function available globally
window.adjustContentPadding = adjustContentPadding;

// Initialize content padding adjustment
document.addEventListener('DOMContentLoaded', function() {
    // Initial adjustment
    adjustContentPadding();
    
    // Adjust on window resize
    window.addEventListener('resize', adjustContentPadding);
    
    // Adjust on orientation change for mobile devices
    window.addEventListener('orientationchange', adjustContentPadding);
});