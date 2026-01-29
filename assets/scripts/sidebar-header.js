// Sidebar and Header Functionality
// Global variables for header and sidebar
let isHeaderCategoriesOpen = false;
let isSidebarOpen = false;

// Categories subcategory data
const subcategories = {
    'smartphones-tablets': {
        title: 'Smartphones and Tablets',
        items: [
            { name: 'Smartphones', href: 'smartphones.html?category=smartphones' },
            { name: 'Tablets', href: 'tablets.html' },
            { name: 'Accessories', href: 'smartphones.html?category=accessories' }
        ]
    },
    'laptops-accessories': {
        title: 'Laptops and Accessories',
        items: [
            { name: 'Windows Laptops', href: 'laptops.html?category=windows' },
            { name: 'Chromebooks', href: 'laptops.html?category=chromebooks' },
            { name: 'MacBooks', href: 'laptops.html?category=macbooks' },
            { name: 'Accessories', href: '#laptop-accessories' }
        ]
    },
    'wearables': {
        title: 'Wearables Devices',
        items: [
            { name: 'Smartwatches', href: '#smartwatches' },
            { name: 'Fitness Trackers', href: '#fitness-trackers' }
        ]
    },
    'televisions': {
        title: 'Televisions & Streaming Devices',
        items: [
            { name: 'Televisions', href: 'television.html?type=televisions' },
            { name: 'Streaming Devices', href: 'television.html?type=streaming-devices' }
        ]
    },
    'audio': {
        title: 'Audio',
        items: [
            { name: 'Earbuds', href: '#earbuds' },
            { name: 'Headphones', href: '#headphones' },
            { name: 'Bluetooth Speakers', href: '#bluetooth-speakers' },
            { name: 'Party Speakers', href: '#party-speakers' },
            { name: 'Soundbars', href: '#soundbars' },
            { name: 'Hi-fi Systems', href: '#hifi-systems' }
        ]
    },
    'gaming': {
        title: 'Gaming',
        items: [
            { name: 'Consoles', href: '#consoles' },
            { name: 'Gaming Laptops', href: '#gaming-laptops' },
            { name: 'Gaming Monitors', href: '#gaming-monitors' },
            { name: 'Handled Gaming', href: '#handled-gaming' },
            { name: 'Consoles Accessories', href: '#consoles-accessories' },
            { name: 'PC Gaming Accessories', href: '#pc-gaming-accessories' }
        ]
    },
    'networking': {
        title: 'Wi-Fi & Networking',
        items: [
            { name: 'Routers', href: '#routers' },
            { name: 'WiFi Ups', href: '#wifi-ups' },
            { name: 'Extenders & Repeaters', href: '#extenders-repeaters' }
        ]
    },
    'appliances': {
        title: 'Appliances',
        items: [
            {
                name: 'Fridges & Freezers', href: '#fridges-freezers', subItems: [
                    { name: 'Fridges', href: '#fridges' },
                    { name: 'Freezers', href: '#freezers' }
                ]
            },
            { name: 'Microwaves, Ovens & Stoves', href: '#microwaves-ovens-stoves' },
            { name: 'Kettles, Coffee Machines', href: '#kettles-coffee-machines' },
            { name: 'Floorcare', href: '#floorcare' },
            { name: 'Food Preparation', href: '#food-preparation' },
            { name: 'Heaters & Electric Blankets', href: '#heaters-electric-blankets' },
            { name: 'Personal Care', href: '#personal-care' },
            { name: 'Cookers & Air Fryers', href: '#cookers-air-fryers' },
            { name: 'Toasters & Sandwich Makers', href: '#toasters-sandwich-makers' },
            { name: 'Dishwashers', href: '#dishwashers' },
            { name: 'Irons & Steamers', href: '#irons-steamers' },
            { name: 'Sewing Machine', href: '#sewing-machine' },
            { name: 'Humidifiers & Purifiers', href: '#humidifiers-purifiers' }
        ]
    }
};

// Header categories dropdown functionality
function toggleHeaderCategories() {
    const headerCategoriesDropdown = document.querySelector('.header-categories-dropdown');
    isHeaderCategoriesOpen = !isHeaderCategoriesOpen;

    if (isHeaderCategoriesOpen) {
        headerCategoriesDropdown.classList.add('active');
    } else {
        headerCategoriesDropdown.classList.remove('active');
    }
}

function selectHeaderCategory(category, categoryName) {
    // Filter by the selected category
    filterByCategory(category);
    closeHeaderCategories();
}

// Gaming navigation function
function navigateToGamingCategory(category) {
    // Close header categories if open
    closeHeaderCategories();

    // Navigate to gaming page with category parameter
    window.location.href = `gaming.html?category=${category}`;
}

// Audio navigation function
function navigateToAudioCategory(category) {
    // Close header categories if open
    closeHeaderCategories();

    // Navigate to audio page with category parameter
    window.location.href = `audio.html?category=${category}`;
}
// Wishlist navigation function
function navigateToWishlist() {
    // Close header categories if open (safe call)
    try { closeHeaderCategories(); } catch (e) { }
    // Navigate to wishlist page (current file name in project is 'whishlist.html')
    window.location.href = 'wishlist.html';
}

// Messages navigation function - routes to appropriate chat page based on user type
async function navigateToMessages() {
    // Close header categories if open (safe call)
    try { closeHeaderCategories(); } catch (e) { }

    // Standard or business users
    let isLoggedIn = false;
    try {
        const info = await (window.standardAuth?.getUserInfo?.() || window.sidebarHeaderStandardGetUserInfo?.());
        if (info && info.success && (info.user || info.profile)) isLoggedIn = true;
    } catch (err) { }

    if (!isLoggedIn) {
        try {
            const bizInfo = await (window.businessAuth?.getUserInfo?.() || window.sidebarHeaderBusinessGetUserInfo?.());
            if (bizInfo && bizInfo.success && bizInfo.user) isLoggedIn = true;
        } catch (err) { }
    }

    // If not logged in, show notification and don't navigate
    if (!isLoggedIn) {
        showMessagesLoginNotification();
        return;
    }

    window.location.href = 'chat-hub/';
}

// Show login notification for Messages
function showMessagesLoginNotification() {
    // Try to use existing toast function if available
    if (typeof showToast === 'function') {
        showToast('Please login to access your messages', 'warning', 'Login Required');
        return;
    }

    if (typeof showWarningToast === 'function') {
        showWarningToast('Please login to access your messages', 'Login Required');
        return;
    }

    // Fallback: Create a custom notification
    const existingNotification = document.getElementById('messagesLoginNotification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'messagesLoginNotification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
    `;

    notification.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 1.5rem;"></i>
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">Login Required</div>
            <div style="font-size: 0.9rem; opacity: 0.95;">Please login to access your messages</div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        ">&times;</button>
    `;

    // Add animation keyframes if not already present
    if (!document.getElementById('messagesNotificationStyles')) {
        const style = document.createElement('style');
        style.id = 'messagesNotificationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);


    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function closeHeaderCategories() {
    const headerCategoriesDropdown = document.querySelector('.header-categories-dropdown');
    if (headerCategoriesDropdown) {
        headerCategoriesDropdown.classList.remove('active');
        isHeaderCategoriesOpen = false;
    }
}


document.addEventListener('click', function (e) {
    const headerCategoriesDropdown = document.querySelector('.header-categories-dropdown');

    if (headerCategoriesDropdown && !headerCategoriesDropdown.contains(e.target)) {
        closeHeaderCategories();
    }
});

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    // Close dropdowns with Escape key
    if (e.key === 'Escape') {
        if (isHeaderCategoriesOpen) {
            closeHeaderCategories();
        }
    }
});

// Initialize categories dropdown functionality
function initializeCategoriesDropdown() {
    const categoryItems = document.querySelectorAll('.category-item');
    const subcategoryTitle = document.getElementById('subcategory-title');
    const subcategoryContent = document.getElementById('subcategory-content');
    const subSubcategoryTitle = document.getElementById('sub-subcategory-title');
    const subSubcategoryContent = document.getElementById('sub-subcategory-content');
    const dropdownRoot = document.querySelector('.categories-dropdown');
    const categoriesMenu = document.querySelector('.categories-menu');

    const resetThirdCol = () => {
        subSubcategoryTitle.textContent = 'Select a subcategory';
        subSubcategoryContent.innerHTML = '<p>Hover over a subcategory to see more options</p>';
        if (categoriesMenu) categoriesMenu.classList.remove('show-col-3');
    };

    const showSecondCol = () => {
        if (categoriesMenu) categoriesMenu.classList.add('show-col-2');
    };

    categoryItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            const category = this.getAttribute('data-category');
            const subcategoryData = subcategories[category];

            if (subcategoryData) {
                subcategoryTitle.textContent = subcategoryData.title;
                subcategoryContent.innerHTML = subcategoryData.items.map(item => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const chevronIcon = hasSubItems ? '<i class="fas fa-caret-right"></i>' : '';
                    return `<a href="${item.href}" class="subcategory-item" data-subcategory="${item.name}" data-category="${category}">${item.name} ${chevronIcon}</a>`;
                }).join('');

                // Wire second-level hover and click events
                const newSubcategoryItems = subcategoryContent.querySelectorAll('.subcategory-item');
                newSubcategoryItems.forEach(subItemEl => {
                    subItemEl.addEventListener('mouseenter', function () {
                        const subcategoryName = this.getAttribute('data-subcategory');
                        const currentCategory = this.getAttribute('data-category');

                        if (currentCategory && subcategories[currentCategory]) {
                            const subcategoryData = subcategories[currentCategory].items.find(i => i.name === subcategoryName);

                            if (subcategoryData && subcategoryData.subItems) {
                                subSubcategoryTitle.textContent = subcategoryData.name;
                                subSubcategoryContent.innerHTML = subcategoryData.subItems.map(subItem =>
                                    `<a href="${subItem.href}" class="sub-subcategory-item">${subItem.name}</a>`
                                ).join('');
                                if (categoriesMenu) categoriesMenu.classList.add('show-col-3');
                            } else {
                                subSubcategoryTitle.textContent = 'No further options';
                                subSubcategoryContent.innerHTML = '<p>No additional subcategories available.</p>';
                                if (categoriesMenu) categoriesMenu.classList.remove('show-col-3');
                            }
                        }
                    });

                    // Add click event for gaming categories
                    subItemEl.addEventListener('click', function (e) {
                        const href = this.getAttribute('href');
                        const currentCategory = this.getAttribute('data-category');

                        // Handle gaming category navigation
                        if (currentCategory === 'gaming') {
                            e.preventDefault();
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
                        }

                        // Handle laptop category navigation
                        if (currentCategory === 'laptops-accessories') {
                            e.preventDefault();
                            let category = '';

                            // Map href to category parameter
                            if (href.includes('category=windows')) {
                                category = 'windows';
                            } else if (href.includes('category=macbooks')) {
                                category = 'macbooks';
                            } else if (href.includes('category=chromebooks')) {
                                category = 'chromebooks';
                            }

                            if (category) {
                                console.log('Laptop navigation clicked:', href, '-> category:', category);
                                window.location.href = `laptops.html?category=${category}`;
                            }
                        }

                        // Handle smartphones-tablets category navigation
                        if (currentCategory === 'smartphones-tablets') {
                            e.preventDefault();
                            console.log('Smartphones navigation clicked:', href);
                            window.location.href = href;
                        }

                        // Handle television category navigation
                        if (currentCategory === 'televisions') {
                            e.preventDefault();
                            let type = '';

                            // Map href to type parameter
                            if (href.includes('type=televisions')) {
                                type = 'televisions';
                            } else if (href.includes('type=streaming-devices')) {
                                type = 'streaming-devices';
                            }

                            if (type) {
                                console.log('Television navigation clicked:', href, '-> type:', type);
                                window.location.href = `television.html?type=${type}`;
                            }
                        }

                        // Handle audio category navigation
                        if (currentCategory === 'audio') {
                            e.preventDefault();
                            let category = '';

                            // Map href to category parameter
                            if (href.includes('#earbuds')) {
                                category = 'earbuds';
                            } else if (href.includes('#headphones')) {
                                category = 'headphones';
                            } else if (href.includes('#bluetooth-speakers')) {
                                category = 'bluetooth-speakers';
                            } else if (href.includes('#party-speakers')) {
                                category = 'portable-speakers';
                            } else if (href.includes('#soundbars')) {
                                category = 'soundbars';
                            } else if (href.includes('#hifi-systems')) {
                                category = 'hifi-systems';
                            }

                            if (category) {
                                console.log('Audio navigation clicked:', href, '-> category:', category);
                                navigateToAudioCategory(category);
                            }
                        }
                    });
                });

                showSecondCol();
                resetThirdCol();
            } else {
                subcategoryTitle.textContent = 'No subcategories';
                subcategoryContent.innerHTML = '<p>No subcategories available for this category.</p>';
                showSecondCol();
                resetThirdCol();
            }
        });
    });

    // Direct delegation for third column updates as pointer moves across second column
    document.addEventListener('mouseover', function (e) {
        if (e.target.classList && e.target.classList.contains('subcategory-item')) {
            const subcategoryName = e.target.getAttribute('data-subcategory');
            const currentCategory =
                e.target.getAttribute('data-category') ||
                (e.target.closest('.categories-dropdown')?.querySelector('.category-item:hover')?.getAttribute('data-category'));

            if (currentCategory && subcategories[currentCategory]) {
                const subcategoryData = subcategories[currentCategory].items.find(item => item.name === subcategoryName);
                if (subcategoryData && subcategoryData.subItems) {
                    subSubcategoryTitle.textContent = subcategoryData.name;
                    subSubcategoryContent.innerHTML = subcategoryData.subItems.map(subItem =>
                        `<a href="${subItem.href}" class="sub-subcategory-item">${subItem.name}</a>`
                    ).join('');
                    if (categoriesMenu) categoriesMenu.classList.add('show-col-3');
                } else {
                    subSubcategoryTitle.textContent = 'No further options';
                    subSubcategoryContent.innerHTML = '<p>No additional subcategories available.</p>';
                    if (categoriesMenu) categoriesMenu.classList.remove('show-col-3');
                }
            }
        }

    });

    // Clear slide states when the dropdown closes
    if (dropdownRoot) {
        dropdownRoot.addEventListener('mouseleave', () => {
            if (categoriesMenu) {
                categoriesMenu.classList.remove('show-col-2');
                categoriesMenu.classList.remove('show-col-3');
            }
        });
    }
}

// Header login button functionality (open dropdown instead of navigating)
function toggleHeaderLoginDropdown() {
    try { closeHeaderCategories(); } catch (e) { }
    const container = document.getElementById('desktopLoginContainer');
    if (!container) {
        console.warn('desktopLoginContainer not found');
        return;
    }
    const isOpen = container.classList.toggle('dropdown-open');
    const btn = document.getElementById('desktopLoginBtn');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // Force show/hide custom dropdown as fallback
    const customDropdown = container.querySelector('.custom-login-dropdown');
    if (customDropdown) {
        if (isOpen) {
            customDropdown.style.display = 'block';
            customDropdown.style.opacity = '1';
            customDropdown.style.visibility = 'visible';
            customDropdown.style.pointerEvents = 'auto';
        } else {
            customDropdown.style.display = 'none';
            customDropdown.style.opacity = '0';
            customDropdown.style.visibility = 'hidden';
            customDropdown.style.pointerEvents = 'none';
        }
    }
}

// Derive initials from user profile or email
function getInitials(profile) {
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

// Standard user info (same flow as STANDARD USER TESTING/user-dashboard.html: getUserInfo)
window.sidebarHeaderStandardGetUserInfo = async function sidebarHeaderStandardGetUserInfo() {
    const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    const accessToken = getCookie('standard_session_id') || '';
    const csrfToken = getCookie('standard_csrf_token') || '';

    if (!accessToken || !csrfToken) return { success: false };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-access-token': accessToken,
            'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ action: 'getUserInfo', session_id: accessToken })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: result?.error || 'Failed to fetch user info' };
    return result;
};

// Business user info (Business_account_system: getUserInfo via HttpOnly session cookie + CSRF token)
window.sidebarHeaderBusinessGetUserInfo = async function sidebarHeaderBusinessGetUserInfo() {
    const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    const csrfToken = getCookie('business_csrf_token') || '';
    if (!csrfToken) return { success: false };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/Business_account_system`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'getUserInfo' })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: result?.error || 'Failed to fetch user info' };
    return result;
};

// Initialize header functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Header and Sidebar functionality loaded');

    // Initialize categories dropdown
    initializeCategoriesDropdown();

    // If logged in, show avatar initials on Login button (test page requirement)
    (async () => {
        try {
            // Wait a bit for DOM to be fully ready
            await new Promise(resolve => setTimeout(resolve, 100));

            const btn = document.getElementById('desktopLoginBtn');
            if (!btn) {
                console.warn('desktopLoginBtn not found');
                return;
            }

            // Standard users only: fetch profile via standard_account_auth getUserInfo (same as user-dashboard.html)
            let profile = null;
            let authService = null;
            let isBusinessUser = false;

            const info = await (window.standardAuth?.getUserInfo?.() || window.sidebarHeaderStandardGetUserInfo?.());
            if (info && info.success) {
                const p = info.profile || {};
                const u = info.user || {};
                profile = {
                    email: u.email || p.email || '',
                    given_name: p.first_name || p.given_name || '',
                    family_name: p.last_name || p.family_name || '',
                    avatar_url: p.avatar_url || ''
                };
                authService = window.standardAuth || null;
                isBusinessUser = false;
            }

            if (!profile) {
                const bizInfo = await (window.businessAuth?.getUserInfo?.() || window.sidebarHeaderBusinessGetUserInfo?.());
                if (bizInfo && bizInfo.success && bizInfo.user) {
                    const u = bizInfo.user || {};
                    profile = {
                        email: u.email || '',
                        given_name: u.businessName || u.firstName || '',
                        family_name: u.lastName || '',
                        avatar_url: u.businessLogo || ''
                    };
                    authService = window.businessAuth || null;
                    isBusinessUser = true;
                }
            }

            if (!profile) {
                console.debug('No profile available, user not logged in');
                return;
            }

            const initials = getInitials(profile);

            // Get elements by ID (more reliable than querySelector)
            const loginLabel = document.getElementById('desktopLoginLabel');
            const loggedInBlock = document.getElementById('desktopLoggedInBlock');
            const userNameLabel = document.getElementById('desktopUserName');
            const userRoleLabel = document.getElementById('desktopUserRole'); // New element for role
            const avatarInitialsEl = document.getElementById('desktopUserAvatarInitials');

            console.log('Updating desktop header:', {
                hasLoginLabel: !!loginLabel,
                hasLoggedInBlock: !!loggedInBlock,
                initials: initials,
                isBusinessUser: isBusinessUser
            });

            // Keep default "My Account" text visible (even when logged in)
            if (loginLabel) {
                loginLabel.textContent = 'My Account';
                loginLabel.style.setProperty('display', 'inline-block', 'important');
                loginLabel.style.setProperty('visibility', 'visible', 'important');
                loginLabel.style.setProperty('opacity', '1', 'important');
            }

            // Show Logged In Block
            if (loggedInBlock) {
                loggedInBlock.style.display = 'block';
            }

            // Normalize name pieces once (avoid "LastName LastName" duplication)
            const rawGivenName = (profile.givenName || profile.given_name || profile.firstName || profile.first_name) || '';
            const rawFamilyName = (profile.familyName || profile.family_name || profile.lastName || profile.last_name) || '';
            const normalizedGivenName = String(rawGivenName).trim().replace(/\s+/g, ' ');
            const normalizedFamilyName = String(rawFamilyName).trim().replace(/\s+/g, ' ');
            const emailNameFallback = profile.email ? String(profile.email).split('@')[0] : 'User';

            let fullName = emailNameFallback;
            if (normalizedGivenName && normalizedFamilyName) {
                const givenLower = normalizedGivenName.toLowerCase();
                const familyLower = normalizedFamilyName.toLowerCase();
                if (givenLower.includes(familyLower) || familyLower.includes(givenLower)) {
                    fullName = normalizedGivenName.length >= normalizedFamilyName.length ? normalizedGivenName : normalizedFamilyName;
                } else {
                    fullName = `${normalizedGivenName} ${normalizedFamilyName}`;
                }
            } else if (normalizedGivenName) {
                fullName = normalizedGivenName;
            } else if (normalizedFamilyName) {
                fullName = normalizedFamilyName;
            }

            // Set User Name (No "Hello")
            if (userNameLabel) {
                userNameLabel.textContent = fullName;
                console.log('Set user name:', fullName);
            }

            // Set User Role
            if (userRoleLabel) {
                const accountType = isBusinessUser ? 'Business Account' : 'Standard Account';
                userRoleLabel.textContent = accountType;
            }

            // Show avatar initials
            if (avatarInitialsEl) {
                avatarInitialsEl.textContent = initials;
                avatarInitialsEl.style.display = 'flex';
                avatarInitialsEl.style.visibility = 'visible';
                console.log('Updated avatar initials for:', initials);
            } else {
                console.warn('avatarInitialsEl element not found (ID: desktopUserAvatarInitials)');
            }

            // Swap dropdown content to logged-in menu (legacy dropdown)
            const container = document.getElementById('desktopLoginContainer');
            const dropdown = container ? container.querySelector('.login-dropdown .login-card-body') : null;
            if (dropdown) {
                const email = profile.email || '';
                const firstName = fullName || profile.email?.split('@')[0] || 'Account';
                const accountType = isBusinessUser ? 'Business Account' : 'Account';

                dropdown.innerHTML = `
                    <div class="d-flex align-items-center mb-2" style="gap: 10px;">
                        <span class="user-avatar">${initials}</span>
                        <div>
                            <div class="fw-bold">${firstName}</div>
                            <div class="text-muted" style="font-size: 0.85rem;">${email}</div>
                            ${isBusinessUser ? `<div class="text-muted" style="font-size: 0.75rem;">${accountType}</div>` : ''}
                        </div>
                    </div>
                    <div class="login-card-actions">
                        <a href="${isBusinessUser ? 'Business_account_manager.html' : 'my_account.html'}" class="btn btn-outline-secondary w-100">My Account</a>
                        <a href="wishlist.html" class="btn btn-outline-secondary w-100">Wishlist</a>
                        <a href="price-alerts.html" class="btn btn-outline-secondary w-100">Price Alerts</a>
                        <button class="btn btn-danger w-100" id="headerSignOutBtn">Sign Out</button>
                    </div>
                `;
            }

            // Update custom dropdown for logged-in state
            const customDropdown = container ? container.querySelector('.custom-dropdown-menu') : null;
            if (customDropdown) {
                const email = profile.email || '';
                const firstName = fullName || profile.email?.split('@')[0] || 'Account';
                const accountType = isBusinessUser ? 'Business Account' : 'Standard Account';

                // We are replacing the entire innerHTML of the custom-dropdown-menu
                customDropdown.innerHTML = `
                    <div class="dd-d2-header">
                        <div class="dd-d2-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">${initials}</div>
                        <div>
                            <div class="fw-bold text-dark">${firstName}</div>
                            <div class="small text-muted">${accountType}</div>
                            <div class="small text-muted" style="font-size: 0.7em;">${email}</div>
                        </div>
                    </div>
                    <div class="p-2">
                        <a href="${isBusinessUser ? 'Business_account_manager.html' : 'my_account.html'}" class="dd-item">
                            <i class="fas fa-user-circle"></i> <span>My Account</span>
                        </a>
                        <a href="wishlist.html" class="dd-item">
                            <i class="fas fa-heart"></i> <span>Wishlist</span>
                        </a>
                        <a href="price-alerts.html" class="dd-item">
                            <i class="fas fa-bell"></i> <span>Price Alerts</span>
                        </a>
                        <hr class="dropdown-divider my-2">
                        <a href="#" class="dd-item text-danger" id="customHeaderSignOutBtn">
                            <i class="fas fa-sign-out-alt"></i> <span>Sign Out</span>
                        </a>
                    </div>
                `;

                // Wire sign out button for custom dropdown
                const customSignOutBtn = document.getElementById('customHeaderSignOutBtn');
                if (customSignOutBtn) {
                    customSignOutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('Logout button clicked (custom dropdown)');
                        // Call logout API for regular users
                        if (window.awsAuthService && typeof window.awsAuthService.logout === 'function') {
                            console.log('Calling regular user logout');
                            try { await window.awsAuthService.logout(); } catch (err) { console.error('Regular logout error:', err); }
                        }
                        // Call logout API for business users
                        if (window.businessAWSAuthService && typeof window.businessAWSAuthService.logout === 'function') {
                            console.log('Calling business user logout');
                            try { await window.businessAWSAuthService.logout(); } catch (err) { console.error('Business logout error:', err); }
                        } else {
                            console.warn('businessAWSAuthService not available or logout function missing', {
                                hasService: !!window.businessAWSAuthService,
                                hasLogout: window.businessAWSAuthService && typeof window.businessAWSAuthService.logout
                            });
                        }
                        // Small delay to allow Network tab to capture the request
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // Stay on the same page; refresh to reflect logged-out UI
                        window.location.reload();
                    });
                }
            }

            // Wire sign out for legacy dropdown (if exists)
            const signOutBtn = document.getElementById('headerSignOutBtn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('Logout button clicked');
                    // Call logout API for regular users
                    if (window.awsAuthService && typeof window.awsAuthService.logout === 'function') {
                        console.log('Calling regular user logout');
                        try { await window.awsAuthService.logout(); } catch (err) { console.error('Regular logout error:', err); }
                    }
                    // Call logout API for business users
                    if (window.businessAWSAuthService && typeof window.businessAWSAuthService.logout === 'function') {
                        console.log('Calling business user logout');
                        try { await window.businessAWSAuthService.logout(); } catch (err) { console.error('Business logout error:', err); }
                    } else {
                        console.warn('businessAWSAuthService not available or logout function missing', {
                            hasService: !!window.businessAWSAuthService,
                            hasLogout: window.businessAWSAuthService && typeof window.businessAWSAuthService.logout
                        });
                    }
                    // Small delay to allow Network tab to capture the request
                    await new Promise(resolve => setTimeout(resolve, 100));
                    // Stay on the same page; refresh to reflect logged-out UI
                    window.location.reload();
                });
            }
        } catch (e) {
            console.error('Avatar init failed:', e);
            console.error('Error stack:', e.stack);
            // Try to update elements even if there was an error earlier
            try {
                const loginLabel = document.getElementById('desktopLoginLabel');
                const userNameLabel = document.getElementById('desktopUserName');
                const avatarInitials = document.getElementById('desktopAvatarInitials');

                if (loginLabel) {
                    loginLabel.textContent = 'My Account';
                    loginLabel.style.setProperty('display', 'inline-block', 'important');
                    loginLabel.style.setProperty('visibility', 'visible', 'important');
                    loginLabel.style.setProperty('opacity', '1', 'important');
                }
                if (userNameLabel) {
                    userNameLabel.style.display = 'inline-block';
                    userNameLabel.style.visibility = 'visible';
                }
                if (avatarInitials) {
                    avatarInitials.style.display = 'inline-flex';
                    avatarInitials.style.visibility = 'visible';
                }
            } catch (recoveryError) {
                console.error('Recovery attempt also failed:', recoveryError);
            }
        }
    })();
    // Ensure login dropdown starts closed
    (function initLoginDropdown() {
        const container = document.getElementById('desktopLoginContainer');
        const btn = document.getElementById('desktopLoginBtn');
        if (container) {
            container.classList.remove('dropdown-open');
            const loginDropdown = container.querySelector('.login-dropdown');
            if (loginDropdown) loginDropdown.style.display = 'none';
            // Don't set inline styles on custom dropdown - let CSS handle it via classes
        }
        if (btn) btn.setAttribute('aria-expanded', 'false');
    })();

    // Remember current page before navigating to login
    (function rememberReturnToBeforeLogin() {
        try {
            // Header dropdown login button inside container
            const container = document.getElementById('desktopLoginContainer');
            const loginLink = container ? container.querySelector('.login-dropdown .login-card-actions a[href$="login.html"]') : null;
            if (loginLink) {
                loginLink.addEventListener('click', function () {
                    try { sessionStorage.setItem('chp_return_to', window.location.href); } catch (_) { }
                });
            }

            // Also catch any top-level header login button navigation (if used elsewhere)
            const topLoginBtn = document.getElementById('desktopLoginBtn');
            if (topLoginBtn) {
                topLoginBtn.addEventListener('click', function (e) {
                    // This button toggles dropdown; do not navigate directly
                });
            }
        } catch (_) { }
    })();


    // Add click event listeners for sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function (e) {
            e.preventDefault();
            toggleSidebar();
        });
    }

    // Make the entire login button clickable to toggle dropdown
    // Users can click anywhere on the button (text or chevron) to open
    const desktopLoginBtn = document.getElementById('desktopLoginBtn');
    if (desktopLoginBtn) {
        desktopLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleHeaderLoginDropdown();
        });
    }

    // Close the login dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const container = document.getElementById('desktopLoginContainer');
        if (!container) return;
        if (!container.contains(e.target)) {
            container.classList.remove('dropdown-open');
            const btn = document.getElementById('desktopLoginBtn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    });

    // Add click event listener for desktop wishlist link
    const desktopWishlistLink = document.getElementById('desktopWishlistLink');
    if (desktopWishlistLink) {
        desktopWishlistLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToWishlist();
        });
    }

    // Add click event listener for desktop messages link (dynamic routing based on user type)
    const desktopMessagesLink = document.getElementById('desktopMessagesLink');
    if (desktopMessagesLink) {
        desktopMessagesLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToMessages();
        });
    }

    // Add click event listener for mobile messages link (dynamic routing based on user type)
    const mobileMessagesLink = document.getElementById('mobileMessagesLink');
    if (mobileMessagesLink) {
        mobileMessagesLink.addEventListener('click', function (e) {
            e.preventDefault();
            // Close sidebar if open
            if (typeof toggleSidebar === 'function') {
                const sidebar = document.getElementById('mobileSidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
            navigateToMessages();
        });
    }
    // Note: Removed auto-redirect binding for generic login links to allow
    // dropdown Login button inside the header to navigate normally.

    // Hover-intent for desktop flyout to prevent flicker on small gaps
    const dropdownRoot = document.querySelector('.categories-dropdown');
    const categoriesMenu = document.querySelector('.categories-menu');
    if (dropdownRoot && categoriesMenu) {
        let openTimer = null;
        let closeTimer = null;

        const openWithIntent = () => {
            clearTimeout(closeTimer);
            if (openTimer) return;
            openTimer = setTimeout(() => {
                dropdownRoot.classList.add('hover-open');
                openTimer = null;
            }, 80); // slight delay to stabilize hover
        };

        // Track recent mouse movement for lightweight menu-aim toward 3rd panel
        const lastMoves = [];
        const MAX_MOVES = 6;
        dropdownRoot.addEventListener('mousemove', (e) => {
            lastMoves.push({ x: e.clientX, y: e.clientY, t: Date.now() });
            if (lastMoves.length > MAX_MOVES) lastMoves.shift();
        });

        function isAimingToThird() {
            try {
                const subCol = document.getElementById('subcategories-column');
                const subSubCol = document.getElementById('sub-subcategories-column');
                if (!subCol || !subSubCol) return false;

                const r2 = subCol.getBoundingClientRect();
                const r3 = subSubCol.getBoundingClientRect();

                // Level-2 must be visible to consider aiming to level-3
                if (!categoriesMenu.classList.contains('show-col-2')) return false;

                // Need at least two points to compute heading
                if (lastMoves.length < 2) return false;
                const a = lastMoves[0];
                const b = lastMoves[lastMoves.length - 1];
                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const headingRight = dx > 12;
                const smallVerticalChange = Math.abs(dy) < 60;

                // Corridor around level-2 vertical range
                const yInCorridor = b.y > (r2.top - 24) && b.y < (r2.bottom + 24);

                // If between level-2 and level-3, keep open as user crosses the gap
                const betweenPanels = b.x > (r2.right - 16) && b.x < (r3.left + 24);

                return (headingRight && smallVerticalChange && yInCorridor) || betweenPanels;
            } catch {
                return false;
            }
        }

        // Smarter close with menu-aim (delay more if moving toward 3rd panel)
        const closeWithIntent = (baseDelay = 120) => {
            clearTimeout(openTimer);
            openTimer = null;
            clearTimeout(closeTimer);

            const delay = isAimingToThird() ? 260 : baseDelay;

            closeTimer = setTimeout(() => {
                dropdownRoot.classList.remove('hover-open');
                // also reset slide states to avoid ghost panels
                categoriesMenu.classList.remove('show-col-2', 'show-col-3');
            }, delay);
        };

        // Pointer-based
        dropdownRoot.addEventListener('mouseenter', openWithIntent);
        dropdownRoot.addEventListener('mouseleave', () => closeWithIntent(150));

        // Keep open when entering flyout panels (level 2 and 3)
        const subCol = document.getElementById('subcategories-column');
        const subSubCol = document.getElementById('sub-subcategories-column');
        [categoriesMenu, subCol, subSubCol].forEach(el => {
            if (el) {
                el.addEventListener('mouseenter', openWithIntent);
                el.addEventListener('mouseleave', () => closeWithIntent(180));
            }
        });

        // Keyboard focus support (optional but helps accessibility)
        dropdownRoot.addEventListener('focusin', () => {
            clearTimeout(closeTimer);
            dropdownRoot.classList.add('hover-open');
        });
        dropdownRoot.addEventListener('focusout', (e) => {
            // close only if focus moves completely outside the root
            if (!dropdownRoot.contains(e.relatedTarget)) {
                closeWithIntent();
            }
        });
    }
});


// Global variables
let isDropdownOpen = false;

// Logo Navigation functionality
function setupLogoNavigation() {
    // Handle desktop logo clicks
    const desktopLogos = document.querySelectorAll('.logo, .logo-img');
    desktopLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        // Make logo clickable with cursor pointer
        logo.style.cursor = 'pointer';
    });

    // Handle mobile logo clicks
    const mobileLogos = document.querySelectorAll('.mobile-logo, .mobile-logo-img');
    mobileLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        // Make logo clickable with cursor pointer
        logo.style.cursor = 'pointer';
    });

    // Handle sidebar logo clicks
    const sidebarLogos = document.querySelectorAll('.sidebar-logo-img');
    sidebarLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        // Make logo clickable with cursor pointer
        logo.style.cursor = 'pointer';
    });
}

function navigateToHome() {
    // Check if we're already on the home page
    const currentPage = window.location.pathname;
    const isHomePage = currentPage === '/' ||
        currentPage === '/index.html' ||
        currentPage.endsWith('/index.html') ||
        currentPage === '' ||
        currentPage.endsWith('/');

    if (isHomePage) {
        // If already on home page, scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // Navigate to home page
        window.location.href = 'index.html';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Add event listeners
    setupEventListeners();
    // Setup logo navigation
    setupLogoNavigation();
}

function setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        const dropdown = document.querySelector('.dropdown');

        if (dropdown && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
}


// Notification button functions
function showNewArrivals() {
    // Use search functions from search.js
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showNotifications() {
    // Use search functions from search.js
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showLocalBusiness() {
    // Use search functions from search.js
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showMyAccount() {
    // Use search functions from search.js
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

// Simulate login function for testing
function simulateLogin() {
    const myAccountLink = document.querySelector('a[href="#my-account"]');
    if (myAccountLink) {
        // Add logged-in class and change text
        myAccountLink.classList.add('logged-in');
        myAccountLink.textContent = 'John Doe';
        myAccountLink.onclick = function () {
            showLoggedInAccount();
            return false;
        };

        // Show notification
        showNotification('Successfully logged in as John Doe!', 'success');
    }
}

// Simulate logout function for testing
function simulateLogout() {
    const myAccountLink = document.querySelector('a[href="#my-account"]');
    if (myAccountLink) {
        // Remove logged-in class and restore original text
        myAccountLink.classList.remove('logged-in');
        myAccountLink.textContent = 'My Account';
        myAccountLink.onclick = function () {
            showMyAccount();
            return false;
        };

        // Show notification
        showNotification('Successfully logged out!', 'info');
    }
}

function showLoggedInAccount() {
    // Use search functions from search.js
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }

    // Show notification
    showNotification('Here are your personalized recommendations!', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}



// Dropdown functionality
function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown');
    isDropdownOpen = !isDropdownOpen;

    if (isDropdownOpen) {
        dropdown.classList.add('active');
    } else {
        dropdown.classList.remove('active');
    }
}

function closeDropdown() {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.remove('active');
    isDropdownOpen = false;
}

// Header categories dropdown functionality moved to sidebar-header.js

// Sidebar toggle functionality moved to sidebar-header.js




// Keyboard navigation
document.addEventListener('keydown', function (e) {
    // Close dropdowns with Escape key
    if (e.key === 'Escape') {
        if (isDropdownOpen) {
            closeDropdown();
        }
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        // Only proceed if href is not just '#' and is a valid selector
        if (href && href !== '#' && href.length > 1) {
            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (error) {
                console.warn('Invalid selector:', href, error);
            }
        }
    });
});
