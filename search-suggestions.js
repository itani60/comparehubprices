

document.addEventListener('DOMContentLoaded', function() {
    
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const searchQueryDisplay = document.getElementById('searchQuery');
    
 
    const SEARCH_API_URL = 'https://xf9zlapr5e.execute-api.af-south-1.amazonaws.com/search';
    
    
    const MIN_SEARCH_LENGTH = 2;
    
    
    let debounceTimer;
    
    /**
     *
     * @param {string} query 
     * @returns {Promise} 
     */
    async function fetchSearchSuggestions(query) {
        try {
            const response = await fetch(`${SEARCH_API_URL}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Search API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            return { results: [] }; 
        }
    }
    
    /**
    
     * @param {Array} suggestions 
     */
    function displaySearchSuggestions(suggestions) {
       
        suggestionsGrid.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsGrid.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-content" onclick="selectSuggestion('${suggestion.name || suggestion.title}')">
                    ${suggestion.name || suggestion.title}
                </div>
            `;
            suggestionsGrid.appendChild(suggestionElement);
        });
    }
    
    /**
     * 
     */
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        
        searchQueryDisplay.textContent = query || 'results';
        
       
        clearTimeout(debounceTimer);
        
        if (query.length > MIN_SEARCH_LENGTH) {
          
            searchSuggestions.classList.add('active');
            
          
            suggestionsGrid.innerHTML = '<div class="loading-suggestions">Loading suggestions...</div>';
            
            
            debounceTimer = setTimeout(async () => {
                const data = await fetchSearchSuggestions(query);
                displaySearchSuggestions(data.results || []);
            }, 300);
        } else {
           
            searchSuggestions.classList.remove('active');
        }
    });
    
    /**
     * 
     */
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        
        if (query) {
            
            searchSuggestions.classList.remove('active');
            
            
            performSearch(query);
        }
    });
    
    /**
     *
     * @param {string} query 
     */
    function performSearch(query) {
       
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
    }
    
    /**
     * 
     * @param {string} suggestion 
     */
    window.selectSuggestion = function(suggestion) {
        searchInput.value = suggestion;
        searchSuggestions.classList.remove('active');
        performSearch(suggestion);
    };
    
    /**
     * 
     */
    document.addEventListener('click', function(e) {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchSuggestions.classList.remove('active');
        }
    });
    
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-suggestions {
            padding: 10px;
            text-align: center;
            color: #666;
        }
        
        .no-results {
            padding: 10px;
            text-align: center;
            color: #666;
        }
        
        .suggestion-item {
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        
        .suggestion-item:hover {
            background-color: #f0f0f0;
        }
    `;
    document.head.appendChild(style);
});