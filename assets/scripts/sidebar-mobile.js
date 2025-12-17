// Mobile and Tablet Sidebar Functionality
// Global variables for mobile sidebar
let isMobileSidebarOpen = false;

// Main toggle sidebar function
window.toggleSidebar = function() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    console.log('toggleSidebar called, current state:', isMobileSidebarOpen);

    if (!sidebar) {
        console.error('Mobile sidebar element not found!');
        return;
    }

    isMobileSidebarOpen = !isMobileSidebarOpen;

    if (isMobileSidebarOpen) {
        // Open sidebar
        sidebar.classList.add('active');
        if (overlay) {
            overlay.classList.add('active');
        }
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        // Update login state when sidebar opens (in case user logged in while sidebar was closed)
        if (window.updateMobileSidebarLoginState) {
            setTimeout(() => window.updateMobileSidebarLoginState(), 50);
        }
        console.log('Sidebar opened');
    } else {
        // Close sidebar
        sidebar.classList.remove('active');
        if (overlay) {
            overlay.classList.remove('active');
        }
        // Restore body scroll
        document.body.style.overflow = '';
        console.log('Sidebar closed');
    }
}

// Close sidebar when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('mobileSidebar');
    const clickedInsideToggle = e.target.closest('.sidebar-toggle') !== null;
    const clickedInsideSidebar = sidebar && sidebar.contains(e.target);

    // Close sidebar if clicking outside (not the sidebar nor any toggle) and it's open
    if (isMobileSidebarOpen && !clickedInsideSidebar && !clickedInsideToggle) {
        window.toggleSidebar();
    }
});

// Close sidebar on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isMobileSidebarOpen) {
        window.toggleSidebar();
    }
});

// Handle window resize - close sidebar on desktop
window.addEventListener('resize', function() {
    if (window.innerWidth > 1400 && isMobileSidebarOpen) {
        window.toggleSidebar();
    }
});

// Mobile sidebar login button functionality
window.handleMobileSidebarLogin = function handleMobileSidebarLogin() {
    // Close sidebar first
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }
    
    // Small delay to allow sidebar to close, then redirect
    setTimeout(() => {
        try { sessionStorage.setItem('chp_return_to', window.location.href); } catch(_) {}
        window.location.href = 'login.html';
    }, 300);
}

// Global toggle for mobile sidebar login button (used by inline onclick in HTML mobile sidebar)
window.toggleLoginState = function toggleLoginState() {
    // Delegate to the dedicated mobile sidebar login handler
    window.handleMobileSidebarLogin();
}

// Derive initials from user profile or email
function getMobileSidebarInitials(profile) {
    try {
        const given = (profile && (profile.givenName || profile.given_name)) || '';
        const family = (profile && (profile.familyName || profile.family_name)) || '';
        const email = (profile && profile.email) || '';

        let initials = '';
        if (given || family) {
            initials = (given.charAt(0) + (family.charAt(0) || '')).toUpperCase();
        } else if (email) {
            const namePart = email.split('@')[0] || '';
            const parts = namePart.split(/[._-]+/).filter(Boolean);
            if (parts.length >= 2) {
                initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            } else {
                initials = (namePart.slice(0, 2)).toUpperCase();
            }
        }
        return initials || 'U';
    } catch { return 'U'; }
}

// Handle mobile logout directly (no confirmation modal, same as desktop)
window.handleMobileLogout = async function handleMobileLogout() {
    try {
        console.log('Mobile logout called');
        // Close mobile sidebar first
        if (isMobileSidebarOpen) {
            window.toggleSidebar();
        }

        // Call logout API for regular users
        if (window.awsAuthService && typeof window.awsAuthService.logout === 'function') {
            console.log('Calling regular user logout (mobile)');
            await window.awsAuthService.logout();
        }

        // Call logout API for business users
        if (window.businessAWSAuthService && typeof window.businessAWSAuthService.logout === 'function') {
            console.log('Calling business user logout (mobile)');
            await window.businessAWSAuthService.logout();
        } else {
            console.warn('businessAWSAuthService not available or logout function missing (mobile)', {
                hasService: !!window.businessAWSAuthService,
                hasLogout: window.businessAWSAuthService && typeof window.businessAWSAuthService.logout
            });
        }

        // Small delay to allow Network tab to capture the request
        await new Promise(resolve => setTimeout(resolve, 100));
        // Reload page to reflect logged-out UI (same as desktop)
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        // Still reload to clear client state
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.reload();
    }
};

// For backward compatibility: showLogoutConfirmation now just logs out directly
window.showLogoutConfirmation = function showLogoutConfirmation() {
    handleMobileLogout();
}

// Update mobile sidebar login state (globally available)
window.updateMobileSidebarLoginState = async function updateMobileSidebarLoginState() {
    try {
        const loggedInState = document.getElementById('loggedInState');
        const loggedOutState = document.getElementById('loggedOutState');
        
        if (!loggedInState || !loggedOutState) {
            // Elements not found on this page, skip
            return;
        }

        // Wait for auth services to be available (scripts may load asynchronously)
        if (!window.awsAuthService && !window.businessAWSAuthService) {
            // Services not available - show logged out state
            loggedInState.style.display = 'none';
            loggedOutState.style.display = 'block';
            return;
        }

        // Try business user first, then regular user
        // Business users use businessAWSAuthService.getUserInfo() from aws-auth-business.js
        // Regular users use awsAuthService.getUserInfo() from aws-auth.js
        let user = null;
        let isBusinessUser = false;

        // Try business user first
        if (window.businessAWSAuthService) {
            try {
                const info = await window.businessAWSAuthService.getUserInfo();
                if (info && info.success && info.user) {
                    user = info.user;
                    isBusinessUser = true;
                    console.log('Business user profile loaded successfully:', user.email || 'no email');
                }
            } catch (err) {
                // User not logged in as business user - try regular user
                if (err.status === 401 || err.status === undefined || err.unauthenticated) {
                    console.debug('Business user not authenticated, checking regular user...');
                } else {
                    console.debug('Error fetching business user info:', err.message);
                }
            }
        }

        // If no business user, try regular user
        if (!user && window.awsAuthService) {
            try {
                const info = await window.awsAuthService.getUserInfo();
                if (info && info.success && info.user) {
                    user = info.user;
                    isBusinessUser = false;
                    console.log('Regular user profile loaded successfully:', user.email || 'no email');
                }
            } catch (err) {
                // User not logged in or error fetching
                if (err.status === 401 || err.status === undefined) {
                    console.debug('Regular user not authenticated');
                } else {
                    console.debug('Error fetching regular user info:', err.message);
                }
            }
        }

        if (user) {
            // User is logged in (either regular or business)
            const initials = getMobileSidebarInitials(user);
            const fullName = user.fullName || 
                            `${(user.givenName || user.given_name || '')} ${(user.familyName || user.family_name || '')}`.trim() ||
                            user.name ||
                            '';
            const email = user.email || '';

            // Update logged in state content - Support both old and new design
            // New Design 1: Classic Gradient Card
            const sidebarAvatar = document.getElementById('sidebarUserAvatar');
            const sidebarName = document.getElementById('sidebarUserName');
            const sidebarEmail = document.getElementById('sidebarUserEmail');
            const sidebarAccountType = document.getElementById('sidebarAccountType');

            if (sidebarAvatar) {
                sidebarAvatar.textContent = initials;
            }
            if (sidebarName && fullName) {
                sidebarName.textContent = fullName;
            }
            if (sidebarEmail && email) {
                sidebarEmail.textContent = email;
            }
            if (sidebarAccountType) {
                sidebarAccountType.textContent = isBusinessUser ? 'Business Account' : 'Regular Account';
            }

            // Fallback: Old design selectors
            const initialsEl = loggedInState.querySelector('.rounded-circle, [style*="80px"]');
            const nameEl = loggedInState.querySelector('h5:not(#sidebarUserName), .fw-bold');
            const emailEl = loggedInState.querySelector('p.text-muted');

            if (initialsEl && !sidebarAvatar) {
                initialsEl.textContent = initials;
            }
            if (nameEl && fullName && !sidebarName) {
                nameEl.textContent = fullName;
            }
            if (emailEl && email && !sidebarEmail) {
                emailEl.textContent = email;
            }

            // Show logged in state, hide logged out state
            loggedInState.style.display = 'block';
            loggedOutState.style.display = 'none';
        } else {
            // User is not logged in
            loggedInState.style.display = 'none';
            loggedOutState.style.display = 'block';
        }
    } catch (error) {
        // User not authenticated - show logged out state
        console.debug('Mobile sidebar auth check failed:', error);
        const loggedInState = document.getElementById('loggedInState');
        const loggedOutState = document.getElementById('loggedOutState');
        if (loggedInState) loggedInState.style.display = 'none';
        if (loggedOutState) loggedOutState.style.display = 'block';
    }
}

// Initialize mobile sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update login state on page load
    // Wait a bit for auth services to be available
    setTimeout(async () => {
        await updateMobileSidebarLoginState();
    }, 100);
    
    // Add event listener to close button
    const closeButton = document.getElementById('sidebarClose');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            if (isMobileSidebarOpen) {
                window.toggleSidebar();
            }
        });
    }
    
    // Add event listeners to sidebar links to close sidebar when clicked
    const sidebarLinks = document.querySelectorAll('.sidebar-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Small delay to allow the click action to complete
            setTimeout(() => {
                if (isMobileSidebarOpen) {
                    window.toggleSidebar();
                }
            }, 100);
        });
    });
    
    // Add click event listener for mobile sidebar login button
    const mobileLoginBtn = document.querySelector('#mobileSidebar a[href="login.html"]');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleMobileSidebarLogin();
        });
    }
    
    // Add click event listener for mobile sidebar login link (alternative selector)
    const mobileLoginLink = document.querySelector('.mobile-sidebar a[href="login.html"]');
    if (mobileLoginLink) {
        mobileLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleMobileSidebarLogin();
        });
    }
    
    // Add click event listener for any login link in mobile sidebar
    const allMobileLoginLinks = document.querySelectorAll('#mobileSidebar a, .mobile-sidebar a');
    allMobileLoginLinks.forEach(link => {
        if (link.getAttribute('href') === 'login.html' || link.textContent.toLowerCase().includes('login')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                handleMobileSidebarLogin();
            });
        }
    });
    
    console.log('Mobile sidebar functionality initialized');
});

// Toggle submenu function
window.toggleSubmenu = function(element) {
    const item = element.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close all other submenus
    document.querySelectorAll('.menu-items .item').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove('active');
        }
    });
    
    // Toggle current submenu
    if (isActive) {
        item.classList.remove('active');
    } else {
        item.classList.add('active');
    }
}

// Gaming navigation function
function navigateToGamingCategory(category) {
    // Close sidebar first
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }
    
    // Small delay to allow sidebar to close, then navigate
    setTimeout(() => {
        window.location.href = `gaming.html?category=${category}`;
    }, 300);
}

// Audio navigation function
function navigateToAudioCategory(category) {
    // Close sidebar first
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }
    
    // Small delay to allow sidebar to close, then navigate
    setTimeout(() => {
        window.location.href = `audio.html?category=${category}`;
    }, 300);
}

// Smartphones navigation function
function navigateToSmartphonesCategory(category) {
    // Close sidebar first
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }
    
    // Small delay to allow sidebar to close, then navigate
    setTimeout(() => {
        window.location.href = `smartphones.html?category=${category}`;
    }, 300);
}

// Tablets navigation function
function navigateToTabletsCategory(category) {
    // Close sidebar first
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }
    
    // Small delay to allow sidebar to close, then navigate
    setTimeout(() => {
        window.location.href = `tablets.html?category=${category}`;
    }, 300);
}

// Initialize gaming navigation
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for gaming category links
    const gamingLinks = document.querySelectorAll('#mobileSidebar a[href*="#consoles"], #mobileSidebar a[href*="#gaming-laptops"], #mobileSidebar a[href*="#gaming-monitors"], #mobileSidebar a[href*="#handled-gaming"], #mobileSidebar a[href*="#consoles-accessories"], #mobileSidebar a[href*="#pc-gaming-accessories"]');
    
    // Add event listeners for smartphones category links
    const smartphonesLinks = document.querySelectorAll('#mobileSidebar a[href*="#smartphones"], #mobileSidebar a[href*="#tablets"], #mobileSidebar a[href*="#accessories"]');
    
    // Add event listeners for audio category links
    const audioLinks = document.querySelectorAll('#mobileSidebar a[href*="#earbuds"], #mobileSidebar a[href*="#headphones"], #mobileSidebar a[href*="#speakers"], #mobileSidebar a[href*="#party-speakers"], #mobileSidebar a[href*="#soundbars"], #mobileSidebar a[href*="#hifi"]');
    
    // Add event listeners for laptop category links
    const laptopLinks = document.querySelectorAll('#mobileSidebar a[href*="laptops.html"]');
    
    // Add event listeners for television category links
    const televisionLinks = document.querySelectorAll('#mobileSidebar a[href*="television.html"]');
    
    gamingLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let category = '';
            
            // Map href to category parameter
            if (href.includes('#consoles')) {
                category = 'consoles';
            } else if (href.includes('#gaming-laptops')) {
                category = 'laptop-gaming';
            } else if (href.includes('#gaming-monitors')) {
                category = 'gaming-monitors';
            } else if (href.includes('#handled-gaming')) {
                category = 'handled-gaming';
            } else if (href.includes('#consoles-accessories')) {
                category = 'consoles-accessories';
            } else if (href.includes('#pc-gaming-accessories')) {
                category = 'pc-gaming-accessories';
            }
            
            if (category) {
                navigateToGamingCategory(category);
            }
        });
    });
    
    // Handle audio category links
    audioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let category = '';
            
            // Map href to category parameter
            if (href.includes('#earbuds')) {
                category = 'earbuds';
            } else if (href.includes('#headphones')) {
                category = 'headphones';
            } else if (href.includes('#speakers')) {
                category = 'bluetooth-speakers';
            } else if (href.includes('#party-speakers')) {
                category = 'portable-speakers';
            } else if (href.includes('#soundbars')) {
                category = 'soundbars';
            } else if (href.includes('#hifi')) {
                category = 'hifi-systems';
            }
            
            if (category) {
                navigateToAudioCategory(category);
            }
        });
    });
    
    // Handle smartphones category links
    smartphonesLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let category = '';
            
            // Map href to category parameter
            if (href.includes('#smartphones')) {
                category = 'smartphones';
                navigateToSmartphonesCategory(category);
            } else if (href.includes('#tablets')) {
                category = 'tablets';
                navigateToTabletsCategory(category);
            } else if (href.includes('#accessories')) {
                category = 'accessories';
                navigateToSmartphonesCategory(category);
            }
        });
    });
    
    // Handle laptop category links
    laptopLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let category = 'macbooks'; // default
            
            // Map href to category parameter
            if (href.includes('category=windows')) {
                category = 'windows';
            } else if (href.includes('category=macbooks')) {
                category = 'macbooks';
            } else if (href.includes('category=chromebooks')) {
                category = 'chromebooks';
            }
            
            console.log('Laptop navigation clicked:', href, '-> category:', category);
            
            // Navigate to laptops page with category parameter
            window.location.href = `laptops.html?category=${category}`;
        });
    });
    
    // Handle television category links
    televisionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let type = 'televisions'; // default
            
            // Map href to type parameter
            if (href.includes('type=televisions')) {
                type = 'televisions';
            } else if (href.includes('type=streaming-devices')) {
                type = 'streaming-devices';
            }
            
            console.log('Television navigation clicked:', href, '-> type:', type);
            
            // Navigate to television page with type parameter
            window.location.href = `television.html?type=${type}`;
        });
    });
    
    // Also handle any gaming-related links in the sidebar
    const allGamingLinks = document.querySelectorAll('#mobileSidebar a, .mobile-sidebar a');
    allGamingLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const href = link.getAttribute('href');
        
        // Skip links that already have href-based detection
        if (href && (href.includes('#consoles') || href.includes('#gaming-laptops') || 
                   href.includes('#gaming-monitors') || href.includes('#handled-gaming') || 
                   href.includes('#consoles-accessories') || href.includes('#pc-gaming-accessories') ||
                   href.includes('#earbuds') || href.includes('#headphones') || 
                   href.includes('#speakers') || href.includes('#party-speakers') || 
                   href.includes('#soundbars') || href.includes('#hifi') ||
                   href.includes('#smartphones') || href.includes('#tablets') || href.includes('#accessories') ||
                   href.includes('laptops.html') || href.includes('television.html'))) {
            return; // Skip this link as it's already handled by href-based detection
        }
        
        // Check laptop categories FIRST (before generic "laptop" check)
        if (text.includes('windows laptop') || text.includes('windows laptops')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=windows';
            });
        } else if (text.includes('macbook') || text.includes('macbooks')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=macbooks';
            });
        } else if (text.includes('chromebook') || text.includes('chromebooks')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=chromebooks';
            });
        } else if (text.includes('consoles accessories')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToGamingCategory('consoles-accessories');
            });
        } else if (text.includes('gaming console') || (text.includes('console') && !text.includes('accessories'))) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToGamingCategory('consoles');
            });
        } else if (text.includes('gaming laptop')) {
            // Only match "gaming laptop" specifically, not just any laptop
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToGamingCategory('laptop-gaming');
            });
        } else if (text.includes('gaming monitor') || text.includes('monitor')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToGamingCategory('gaming-monitors');
            });
        } else if (text.includes('pc gaming accessories') || text.includes('pc gaming accessory')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToGamingCategory('pc-gaming-accessories');
            });
        } else if (text.includes('television') || text.includes('televisions')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'television.html?type=televisions';
            });
        } else if (text.includes('streaming device') || text.includes('streaming devices')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'television.html?type=streaming-devices';
            });
        } else if (text.includes('smartphone') || text.includes('smartphones')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToSmartphonesCategory('smartphones');
            });
        } else if (text.includes('tablet') || text.includes('tablets')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToTabletsCategory('tablets');
            });
        } else if (text.includes('mobile accessories') || text.includes('accessories')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToSmartphonesCategory('accessories');
            });
        } else if (text.includes('earbuds') || text.includes('earbud')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('earbuds');
            });
        } else if (text.includes('headphones') || text.includes('headphone')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('headphones');
            });
        } else if (text.includes('bluetooth speakers') || text.includes('bluetooth speaker')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('bluetooth-speakers');
            });
        } else if (text.includes('party speakers') || text.includes('party speaker')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('portable-speakers');
            });
        } else if (text.includes('soundbars') || text.includes('soundbar')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('soundbars');
            });
        } else if (text.includes('hifi') || text.includes('hi-fi') || text.includes('stereo')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToAudioCategory('hifi-systems');
            });
        }
    });
});

// Quick Access navigation helpers for mobile sidebar
function goToMobile(path) {
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
        setTimeout(() => {
            window.location.href = path;
        }, 300);
    } else {
        window.location.href = path;
    }
}

// Wire Quick Access links in the mobile sidebar to close sidebar then navigate
document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('mobileSidebar') || document.querySelector('.mobile-sidebar');
    if (!root) return;

    // Wishlist (renamed from New Arrivals, class retained for styling)
    const qaWishlist = root.querySelector('.quick-access-item.new-arrivals');
    if (qaWishlist) {
        qaWishlist.addEventListener('click', function(e) {
            e.preventDefault();
            // Current project file name is 'whishlist.html'
            goToMobile('whishlist.html');
        });
    }

    // Notifications
    const qaNotifications = root.querySelector('.quick-access-item.notifications');
    if (qaNotifications) {
        qaNotifications.addEventListener('click', function(e) {
            e.preventDefault();
            goToMobile('notifications');
        });
    }

    // Local Business
    const qaLocal = root.querySelector('.quick-access-item.local-business');
    if (qaLocal) {
        qaLocal.addEventListener('click', function(e) {
            e.preventDefault();
            goToMobile('local_hub.html');
        });
    }

    // My Profile - redirect based on user type (business or regular)
    // Supports both old design (.quick-access-item.help) and new design (.my-profile-link)
    const profileLinks = root.querySelectorAll('.quick-access-item.help, .my-profile-link');
    profileLinks.forEach(qaProfile => {
        qaProfile.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Check if user is logged in and determine user type
            let isBusinessUser = false;
            let user = null;
            
            // Try business user first
            if (window.businessAWSAuthService) {
                try {
                    const info = await window.businessAWSAuthService.getUserInfo();
                    if (info && info.success && info.user) {
                        user = info.user;
                        isBusinessUser = true;
                    }
                } catch (err) {
                    // User not logged in as business user - try regular user
                }
            }
            
            // If no business user, try regular user
            if (!user && window.awsAuthService) {
                try {
                    const info = await window.awsAuthService.getUserInfo();
                    if (info && info.success && info.user) {
                        user = info.user;
                        isBusinessUser = false;
                    }
                } catch (err) {
                    // User not logged in
                }
            }
            
            // Redirect based on user type
            const accountPage = isBusinessUser ? 'Business_account_manager.html' : 'my_account.html';
            goToMobile(accountPage);
        });
    });
});
 // Custom Category Toggle Function
 function toggleCustomCategory(element) {
    const categoryItem = element.closest('.custom-category-item');
    const isActive = categoryItem.classList.contains('active');
    
    // Close all other categories
    document.querySelectorAll('.custom-category-item').forEach(item => {
        if (item !== categoryItem) {
            item.classList.remove('active');
        }
    });
    
    // Toggle current category
    if (isActive) {
        categoryItem.classList.remove('active');
    } else {
        categoryItem.classList.add('active');
    }
}

// Category search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('categorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const categoryItems = document.querySelectorAll('.custom-category-item');
            
            categoryItems.forEach(item => {
                const title = item.querySelector('.custom-category-title').textContent.toLowerCase();
                const links = item.querySelectorAll('.custom-category-link');
                let hasMatch = title.includes(searchTerm);
                
                // Check if any subcategory matches
                links.forEach(link => {
                    if (link.textContent.toLowerCase().includes(searchTerm)) {
                        hasMatch = true;
                    }
                });
                
                if (hasMatch || searchTerm === '') {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});