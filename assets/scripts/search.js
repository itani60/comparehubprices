const SEARCH_API_CONFIG = {
    BASE_URL: 'https://hub.comparehubprices.co.za/data',
    SEARCH_ENDPOINT: '/search',
};

async function searchProducts(query, category = null, limit = 20, lastKey = null) {
    if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
    }

    try {
        const params = new URLSearchParams({
            q: query.trim(),
            limit: Math.min(limit, 100).toString(),
        });

        if (category) {
            params.append('category', category);
        }

        if (lastKey) {
            params.append('lastKey', lastKey);
        }

        const response = await fetch(
            `${SEARCH_API_CONFIG.BASE_URL}${SEARCH_API_CONFIG.SEARCH_ENDPOINT}?${params.toString()}`
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Search failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Search products error:', error);
        throw error;
    }
}

function ensureSuggestionsContainer(isMobile = false) {
    const containerId = isMobile ? 'mobileHeaderSearchSuggestions' : 'headerSearchSuggestions';
    let container = document.getElementById(containerId);
    
    if (!container) {
        const searchInput = isMobile 
            ? document.getElementById('mobileHeaderSearchInput')
            : document.getElementById('headerSearchInput');
        
        if (!searchInput) return null;
        
        const searchWrapper = searchInput.closest('.search-wrapper') || 
                             searchInput.closest('.mobile-search') ||
                             searchInput.parentElement;
        
        if (!searchWrapper) return null;
        
        container = document.createElement('div');
        container.id = containerId;
        container.className = isMobile ? 'mobile-search-suggestions' : 'search-suggestions';
        
        const suggestionsContent = document.createElement('div');
        suggestionsContent.className = 'suggestions-content';
        container.appendChild(suggestionsContent);
        
        searchWrapper.appendChild(container);
    }
    
    return container;
}

async function performHeaderSearch() {
    const searchInput = document.getElementById('headerSearchInput');
    const mobileSearchInput = document.getElementById('mobileHeaderSearchInput');
    const query = (searchInput?.value || mobileSearchInput?.value || '').trim();
    const isMobile = !!mobileSearchInput?.value;

    if (!query || query.length < 2) {
        if (typeof showToast !== 'undefined') {
            showToast('Please enter at least 2 characters to search', 'info');
        }
        return;
    }

    try {
        const suggestionsContainer = ensureSuggestionsContainer(isMobile);
        
        if (suggestionsContainer) {
            const content = suggestionsContainer.querySelector('.suggestions-content') || suggestionsContainer;
            content.innerHTML = '<div class="search-loading">Searching...</div>';
            suggestionsContainer.style.display = 'block';
            suggestionsContainer.classList.add('show');
        }

        const results = await searchProducts(query, null, 10);

        displaySearchResults(results, suggestionsContainer);
    } catch (error) {
        console.error('Header search error:', error);
        const suggestionsContainer = ensureSuggestionsContainer(isMobile);
        
        if (suggestionsContainer) {
            const content = suggestionsContainer.querySelector('.suggestions-content') || suggestionsContainer;
            content.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
            suggestionsContainer.style.display = 'block';
            suggestionsContainer.classList.add('show');
        }
    }
}

async function performMobileHeaderSearch() {
    await performHeaderSearch();
}

function displaySearchResults(results, container) {
    if (!container) return;

    let suggestionsContent = container.querySelector('.suggestions-content');
    
    if (!suggestionsContent) {
        suggestionsContent = document.createElement('div');
        suggestionsContent.className = 'suggestions-content';
        container.appendChild(suggestionsContent);
    }

    let products = [];
    let businesses = [];
    let totalFound = null;
    
    if (results.products) {
        products = results.products;
        businesses = results.businesses || [];
        totalFound = results.totalFound || results.count || (products.length + businesses.length);
    } else if (results.items) {
        products = results.items;
        businesses = results.businesses || [];
        totalFound = results.totalFound || results.count || (products.length + businesses.length);
    } else if (Array.isArray(results)) {
        products = results.filter(item => item.type !== 'business');
        businesses = results.filter(item => item.type === 'business');
        totalFound = results.length;
    } else if (results.body) {
        const bodyData = typeof results.body === 'string' ? JSON.parse(results.body) : results.body;
        products = bodyData.products || bodyData.items || [];
        businesses = bodyData.businesses || [];
        totalFound = bodyData.totalFound || bodyData.count || (products.length + businesses.length);
    }

    if ((!products || products.length === 0) && (!businesses || businesses.length === 0)) {
        suggestionsContent.innerHTML = '<div class="search-no-results">No results found</div>';
        container.style.display = 'block';
        container.classList.add('show');
        return;
    }
    
    const searchInput = document.getElementById('headerSearchInput') || document.getElementById('mobileHeaderSearchInput');
    const query = searchInput?.value?.trim() || results.query || '';
    
    const productsHtml = products.map(product => {
        const imageUrl = product.imageUrl || product.image || 'https://via.placeholder.com/56?text=No+Image';
        const name = product.model || product.title || 'Unknown Product';
        const brand = product.brand || 'Unknown Brand';
        const price = getLowestPrice(product);
        const formattedPrice = price ? `R${price.toLocaleString('en-ZA')}` : 'Price not available';
        const productId = product.product_id || product.id || product.productId;
        const category = product.searchCategory || product.category || 'products';
        
        let infoPageUrl = 'smartphone_info.html';
        if (category.includes('tablet')) {
            infoPageUrl = 'tablet-info.html';
        } else if (category.includes('laptop')) {
            infoPageUrl = 'laptop-info.html';
        }
        
        return `
            <div class="search-suggestion-item" data-product-id="${productId}" data-category="${category}">
                <img src="${imageUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/56?text=No+Image'">
                <div class="suggestion-content">
                    <h6>${escapeHtml(name)}</h6>
                    <p>${escapeHtml(brand)} • ${formattedPrice}</p>
                </div>
            </div>
        `;
    }).join('');

    const businessesHtml = businesses.map(business => {
        // Try multiple possible logo field names, handling empty strings
        const getImageUrl = () => {
            const logo = business.businessLogoUrl || 
                        business.logo || 
                        business.logoUrl || 
                        business.businessLogo || 
                        business.imageUrl ||
                        business.image ||
                        '';
            // Return logo if it's a non-empty string, otherwise use placeholder
            return (logo && typeof logo === 'string' && logo.trim() !== '') 
                ? logo.trim() 
                : 'https://via.placeholder.com/56?text=Business';
        };
        
        const imageUrl = getImageUrl();
        const name = business.businessName || business.name || 'Unknown Business';
        const category = business.businessCategory || business.category || 'Business';
        const businessId = business.businessId || business.id;
        
        return `
            <div class="search-suggestion-item search-suggestion-business" data-business-id="${businessId}" data-type="business">
                <img src="${imageUrl}" alt="${escapeHtml(name)}" onerror="this.src='https://via.placeholder.com/56?text=Business'" loading="lazy">
                <div class="suggestion-content">
                    <h6>${escapeHtml(name)}</h6>
                    <p>${escapeHtml(category)} • Business</p>
                </div>
            </div>
        `;
    }).join('');

    // Format the total count for display
    const totalCountText = totalFound !== null ? ` (${totalFound.toLocaleString()})` : '';
    
    const viewAllLink = query ? `
        <div class="search-view-all">
            <a href="search-results.html?q=${encodeURIComponent(query)}" class="view-all-results-link">
                <span>View all results${totalCountText}</span>
                <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    ` : '';

    suggestionsContent.innerHTML = productsHtml + businessesHtml + viewAllLink;

    suggestionsContent.querySelectorAll('.search-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.type === 'business') {
                const businessId = item.dataset.businessId;
                window.location.href = `local_business_info.html?businessId=${businessId}`;
            } else {
                const productId = item.dataset.productId;
                const category = item.dataset.category;
                
                let infoPageUrl = 'smartphone_info.html';
                if (category.includes('tablet')) {
                    infoPageUrl = 'tablet-info.html';
                } else if (category.includes('laptop')) {
                    infoPageUrl = 'laptop-info.html';
                }
                
                window.location.href = `${infoPageUrl}?id=${productId}${category ? `&category=${category}` : ''}`;
            }
        });
    });

    container.style.display = 'block';
}

function getLowestPrice(product) {
    if (!product.offers || product.offers.length === 0) return null;
    const prices = product.offers
        .map(offer => offer.price)
        .filter(price => typeof price === 'number' && price > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initializeSearchInputs() {
    const searchInput = document.getElementById('headerSearchInput');
    const mobileSearchInput = document.getElementById('mobileHeaderSearchInput');
    
    let searchTimeout;
    
    const handleSearchInput = (input, isMobile = false) => {
        if (input) {
            const inputHandler = (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        performHeaderSearch();
                    }, 300);
                } else {
                    const desktopContainer = document.getElementById('headerSearchSuggestions');
                    const mobileContainer = document.getElementById('mobileHeaderSearchSuggestions');
                    if (desktopContainer) {
                        desktopContainer.style.display = 'none';
                        desktopContainer.classList.remove('show');
                    }
                    if (mobileContainer) {
                        mobileContainer.style.display = 'none';
                        mobileContainer.classList.remove('show');
                    }
                }
            };
            
            input.addEventListener('input', inputHandler);
        }
    };
    
    handleSearchInput(searchInput, false);
    handleSearchInput(mobileSearchInput, true);
}

if (typeof window !== 'undefined') {
    window.searchProducts = searchProducts;
    window.performHeaderSearch = performHeaderSearch;
    window.performMobileHeaderSearch = performMobileHeaderSearch;
    window.initializeSearchInputs = initializeSearchInputs;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSearchInputs();
    
    document.addEventListener('click', (e) => {
        const desktopContainer = document.getElementById('headerSearchSuggestions');
        const mobileContainer = document.getElementById('mobileHeaderSearchSuggestions');
        const searchWrapper = e.target.closest('.search-wrapper') || 
                             e.target.closest('.mobile-search') ||
                             e.target.closest('.header-search');
        
        const filterElements = e.target.closest('.filter-options') || 
                              e.target.closest('.filter-btn') ||
                              e.target.closest('.filter-options-content') ||
                              e.target.closest('.filter-actions') ||
                              e.target.closest('.custom-sort-dropdown');
        
        if (desktopContainer && !searchWrapper && !filterElements) {
            desktopContainer.style.display = 'none';
            desktopContainer.classList.remove('show');
        }
        if (mobileContainer && !searchWrapper && !filterElements) {
            mobileContainer.style.display = 'none';
            mobileContainer.classList.remove('show');
        }
    });
});
