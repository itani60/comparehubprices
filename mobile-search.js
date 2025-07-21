/**
 * Mobile Search Modal functionality for CompareHub
 * This file contains all mobile search-related JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile search modal functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.querySelector('.search-button');
    const mobileSearchModal = document.getElementById('mobileSearchModal');
    const mobileSearchClose = document.getElementById('mobileSearchClose');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchForm = document.getElementById('mobileSearchForm');
    const mobileSearchQuery = document.getElementById('mobileSearchQuery');
    const mobileSuggestionsGrid = document.getElementById('mobileSuggestionsGrid');
    
    // Function to check if device is a mobile phone (not tablet)
    function isMobilePhone() {
        return window.innerWidth <= 768 &&
              (typeof window.orientation !== 'undefined' ||
               navigator.userAgent.indexOf('IEMobile') !== -1 ||
               /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
    
    // Function to open mobile search modal
    function openMobileSearchModal() {
        if (isMobilePhone()) {
            mobileSearchModal.classList.add('active');
            mobileSearchInput.focus();
            // Copy value from main search input if it exists
            if (searchInput && searchInput.value) {
                mobileSearchInput.value = searchInput.value;
                // Trigger input event to show suggestions
                const inputEvent = new Event('input', { bubbles: true });
                mobileSearchInput.dispatchEvent(inputEvent);
            }
        }
    }
    
    // Function to close mobile search modal
    function closeMobileSearchModal() {
        mobileSearchModal.classList.remove('active');
    }
    
    // Event listeners for opening modal
    if (searchInput) {
        searchInput.addEventListener('click', function(e) {
            if (isMobilePhone()) {
                e.preventDefault();
                e.stopPropagation();
                openMobileSearchModal();
            }
        }, { capture: true });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            if (isMobilePhone()) {
                e.preventDefault();
                e.stopPropagation();
                openMobileSearchModal();
            }
        }, { capture: true });
    }
    
    // Event listener for closing modal
    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', closeMobileSearchModal);
    }
    
    // Handle mobile search form submission
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = mobileSearchInput.value.trim();
            if (query) {
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        });
    }
    
    // Mobile search suggestions functionality
    if (mobileSearchInput) {
        const API_URL = 'https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/search';
        let debounceTimer;
        
        mobileSearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            mobileSearchQuery.textContent = query || 'results';
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async function() {
                if (query.length < 2) {
                    mobileSuggestionsGrid.innerHTML = '';
                    return;
                }
                
                try {
                    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}&limit=10`);
                    if (!response.ok) throw new Error('API request failed');
                    
                    const data = await response.json();
                    const suggestions = data.results || [];
                    
                    mobileSuggestionsGrid.innerHTML = '';
                    
                    if (suggestions.length === 0) {
                        mobileSuggestionsGrid.innerHTML = '<div class="mobile-no-suggestions">No suggestions found</div>';
                        return;
                    }
                    
                    suggestions.forEach(item => {
                        const isCategory = item.type === 'category';
                        const suggestionElement = document.createElement('div');
                        suggestionElement.className = `mobile-suggestion-item ${isCategory ? 'category' : 'product'}`;
                        
                        if (!isCategory) {
                            const productName = item.name || item.model || item.title || '';
                            suggestionElement.innerHTML = `
                                <a href="search-results.html?q=${encodeURIComponent(productName)}" class="mobile-suggestion-link">
                                    <div class="mobile-suggestion-img">
                                        <img src="${item.imageUrl || item.image || 'images/phones/Apple iPhone 16.webp'}" alt="${productName}">
                                    </div>
                                    <div class="mobile-suggestion-name">${productName}</div>
                                </a>
                            `;
                        } else {
                            suggestionElement.innerHTML = `
                                <a href="${(item.category || item.name).toLowerCase()}.html" class="mobile-suggestion-link">
                                    <div class="mobile-suggestion-icon">
                                        <i class="fas fa-folder"></i>
                                    </div>
                                    <div class="mobile-suggestion-name">${item.name || ''}</div>
                                </a>
                            `;
                        }
                        
                        mobileSuggestionsGrid.appendChild(suggestionElement);
                    });
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    mobileSuggestionsGrid.innerHTML = '<div class="mobile-no-suggestions">Error loading suggestions</div>';
                }
            }, 300); // Debounce delay
        });
    }
});