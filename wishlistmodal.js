
let wishlistItems = [];


function loadWishlist() {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
        try {
            wishlistItems = JSON.parse(savedWishlist);
        } catch (e) {
            console.error('Error parsing wishlist data:', e);
            wishlistItems = [];
        }
    }
    return wishlistItems;
}


function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
}


function addToWishlist(item) {
   
    if (!wishlistItems.some(wishlistItem => wishlistItem.id === item.id)) {
        wishlistItems.push(item);
        saveWishlist();
        showNotification('Added to Wishlist', `${item.name} has been added to your wishlist.`, 'success');
        updateWishlistUI();
        return true;
    } else {
        showNotification('Already in Wishlist', `${item.name} is already in your wishlist.`, 'info');
        return false;
    }
}


function removeFromWishlist(itemId) {
    const index = wishlistItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
        const removedItem = wishlistItems[index];
        wishlistItems.splice(index, 1);
        saveWishlist();
        showNotification('Removed from Wishlist', `${removedItem.name} has been removed from your wishlist.`, 'success');
        updateWishlistUI();
        return true;
    }
    return false;
}


function clearWishlist() {
    if (wishlistItems.length === 0) return;
    
    wishlistItems = [];
    saveWishlist();
    showNotification('Wishlist Cleared', 'All items have been removed from your wishlist.', 'success');
    updateWishlistUI();
}


function updateWishlistUI() {
    
    const wishlistCount = document.querySelector('.wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = wishlistItems.length;
        wishlistCount.style.display = wishlistItems.length > 0 ? 'flex' : 'none';
    }
    
    
    updateWishlistModal();
}


function showNotification(title, message, type = 'success') {
    
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-message">
                <div class="notification-title">${title}</div>
                <div>${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-progress">
            <div class="notification-progress-bar"></div>
        </div>
    `;
    
    
    container.appendChild(notification);
    
  
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'fade-out 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    
    setTimeout(() => {
        notification.style.animation = 'fade-out 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


function showWishlistModal() {
    loadWishlist(); 
    updateWishlistModal(); 
    
    const modal = document.getElementById('wishlist-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; 
        
        
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
    } else {
        console.error('Wishlist modal element not found');
    }
}

function hideWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (modal) {
        modal.classList.remove('visible');
        
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = ''; 
        }, 300);
    }
}


function updateWishlistModal() {
    const wishlistItemsContainer = document.getElementById('wishlist-items');
    const emptyWishlistMessage = document.getElementById('modal-empty-wishlist');
    
    if (!wishlistItemsContainer || !emptyWishlistMessage) return;
    
    
    wishlistItemsContainer.innerHTML = '';
    
    if (wishlistItems.length === 0) {
        wishlistItemsContainer.style.display = 'none';
        emptyWishlistMessage.style.display = 'block';
    } else {
        wishlistItemsContainer.style.display = 'grid';
        emptyWishlistMessage.style.display = 'none';
        
        
        wishlistItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'wishlist-item';
            itemElement.innerHTML = `
                <div class="wishlist-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="wishlist-item-details">
                    <div class="wishlist-item-title">${item.name}</div>
                    <div class="wishlist-item-price">R${item.price ? item.price.toLocaleString() : '0'}</div>
                    <div class="wishlist-item-actions">
                        <a href="${item.url}" class="wishlist-view-btn">View Product</a>
                        <button class="wishlist-remove-btn" data-id="${item.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            wishlistItemsContainer.appendChild(itemElement);
            
            
            const removeBtn = itemElement.querySelector('.wishlist-remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    removeFromWishlist(itemId);
                });
            }
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    loadWishlist();
    
   
    updateWishlistUI();
    
    const wishlistLink = document.getElementById('wishlist-link');
    if (wishlistLink) {
        wishlistLink.addEventListener('click', function(e) {
            e.preventDefault();
            showWishlistModal();
        });
    }
    
    
    const addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', function() {
            
            const productJSON = localStorage.getItem('currentProduct');
            if (!productJSON) return;
            
            const product = JSON.parse(productJSON);
            
          
            const wishlistItem = {
                id: product.product_id || product.id,
                name: `${product.brand} ${product.model}`,
                price: product.offers && product.offers.length > 0 ? product.offers[0].price : 0,
                image: product.imageUrl,
                url: window.location.href
            };
            
            
            addToWishlist(wishlistItem);
        });
    }

    
    const closeModalBtn = document.getElementById('close-wishlist-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideWishlistModal);
    }

    
    const wishlistModal = document.getElementById('wishlist-modal');
    if (wishlistModal) {
        wishlistModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideWishlistModal();
            }
        });
    }

   
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            hideWishlistModal();
        });
    }
    
    
    const clearWishlistBtn = document.getElementById('clear-wishlist-btn');
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove all items from your wishlist?')) {
                clearWishlist();
            }
        });
    }
    
   
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            if (!productCard) return;
            
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
            const productPrice = productCard.querySelector('.product-price')?.getAttribute('data-price') || '0';
            const productImage = productCard.querySelector('.product-image img')?.src || '';
            const productUrl = productCard.querySelector('.product-title a')?.href || '#';
            
            const product = {
                id: productId,
                name: productName,
                price: parseFloat(productPrice),
                image: productImage,
                url: productUrl
            };
            
            if (this.classList.contains('in-wishlist')) {
                removeFromWishlist(productId);
                this.classList.remove('in-wishlist');
            } else {
                if (addToWishlist(product)) {
                    this.classList.add('in-wishlist');
                }
            }
        });
    });
});