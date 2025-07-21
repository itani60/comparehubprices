/**
 * Back to Top Button functionality for CompareHub
 * This file contains all back-to-top button-related JavaScript functionality
 */

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Make function available globally
window.scrollToTop = scrollToTop;

// Initialize back to top button
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.querySelector('.back-to-top');
    
    if (backToTopButton) {
        console.log('Back to top button found');
        
        // Show/hide back to top button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        
        // Initial check for scroll position
        if (window.pageYOffset <= 300) {
            backToTopButton.style.display = 'none';
        }
    } else {
        console.error('Back to top button not found in the DOM');
    }
});