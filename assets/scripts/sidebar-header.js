

let isHeaderCategoriesOpen = false;
let isSidebarOpen = false;


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
    
    filterByCategory(category);
    closeHeaderCategories();
}


function navigateToGamingCategory(category) {
    
    closeHeaderCategories();

    
    window.location.href = `gaming.html?category=${category}`;
}


function navigateToAudioCategory(category) {
    
    closeHeaderCategories();

    
    window.location.href = `audio.html?category=${category}`;
}

function navigateToWishlist() {
    
    try { closeHeaderCategories(); } catch (e) { }
    
    window.location.href = 'wishlist.html';
}


async function navigateToMessages() {
    
    try { closeHeaderCategories(); } catch (e) { }

    
    let isLoggedIn = false;
    let isBusinessUser = false;
    try {
        const info = await (window.standardAuth?.getUserInfo?.() || window.sidebarHeaderStandardGetUserInfo?.());
        if (info && info.success && (info.user || info.profile)) {
            isLoggedIn = true;
            isBusinessUser = false;
        }
    } catch (err) { }

    if (!isLoggedIn) {
        try {
            const bizInfo = await (window.businessAuth?.getUserInfo?.() || window.sidebarHeaderBusinessGetUserInfo?.());
            if (bizInfo && bizInfo.success && bizInfo.user) {
                isLoggedIn = true;
                isBusinessUser = true;
            }
        } catch (err) { }
    }

    
    if (!isLoggedIn) {
        showMessagesLoginNotification();
        return;
    }

    
    
    
    window.location.href = isBusinessUser ? 'business-chat-hub/' : 'chat-hub/';
}


function showMessagesLoginNotification() {
    
    if (typeof showToast === 'function') {
        showToast('Please login to access your messages', 'warning', 'Login Required');
        return;
    }

    if (typeof showWarningToast === 'function') {
        showWarningToast('Please login to access your messages', 'Login Required');
        return;
    }

    
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


document.addEventListener('keydown', function (e) {
    
    if (e.key === 'Escape') {
        if (isHeaderCategoriesOpen) {
            closeHeaderCategories();
        }
    }
});


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

                    
                    subItemEl.addEventListener('click', function (e) {
                        const href = this.getAttribute('href');
                        const currentCategory = this.getAttribute('data-category');

                        
                        if (currentCategory === 'gaming') {
                            e.preventDefault();
                            let category = '';

                            
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

                        
                        if (currentCategory === 'laptops-accessories') {
                            e.preventDefault();
                            let category = '';

                            
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

                        
                        if (currentCategory === 'smartphones-tablets') {
                            e.preventDefault();
                            console.log('Smartphones navigation clicked:', href);
                            window.location.href = href;
                        }

                        
                        if (currentCategory === 'televisions') {
                            e.preventDefault();
                            let type = '';

                            
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

                        
                        if (currentCategory === 'audio') {
                            e.preventDefault();
                            let category = '';

                            
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

    
    if (dropdownRoot) {
        dropdownRoot.addEventListener('mouseleave', () => {
            if (categoriesMenu) {
                categoriesMenu.classList.remove('show-col-2');
                categoriesMenu.classList.remove('show-col-3');
            }
        });
    }
}


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


window.sidebarHeaderBusinessGetUserInfo = async function sidebarHeaderBusinessGetUserInfo() {
    const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    const accessToken = getCookie('business_session_id') || '';
    const csrfToken = getCookie('business_csrf_token') || '';
    if (!accessToken || !csrfToken) return { success: false };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/Business_account_system`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-access-token': accessToken,
            'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'getUserInfo', session_id: accessToken })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: result?.error || 'Failed to fetch user info' };
    return result;
};


document.addEventListener('DOMContentLoaded', function () {
    console.log('Header and Sidebar functionality loaded');

    
    initializeCategoriesDropdown();

    
    (async () => {
        try {
            
            await new Promise(resolve => setTimeout(resolve, 100));

            const btn = document.getElementById('desktopLoginBtn');
            if (!btn) {
                console.warn('desktopLoginBtn not found');
                return;
            }

            
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
                        
                        given_name: u.businessName || '',
                        family_name: '',
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

            
            const loginLabel = document.getElementById('desktopLoginLabel');
            const loggedInBlock = document.getElementById('desktopLoggedInBlock');
            const userNameLabel = document.getElementById('desktopUserName');
            const userRoleLabel = document.getElementById('desktopUserRole'); 
            const avatarInitialsEl = document.getElementById('desktopUserAvatarInitials');

            console.log('Updating desktop header:', {
                hasLoginLabel: !!loginLabel,
                hasLoggedInBlock: !!loggedInBlock,
                initials: initials,
                isBusinessUser: isBusinessUser
            });

            
            if (loginLabel) {
                loginLabel.textContent = 'My Account';
                if (loggedInBlock) {
                    loginLabel.style.display = 'none';
                } else {
                    loginLabel.style.display = '';
                    loginLabel.style.visibility = 'visible';
                    loginLabel.style.opacity = '1';
                }
            }

            
            if (loggedInBlock) {
                loggedInBlock.style.display = 'block';
            }

            
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

            
            if (userNameLabel) {
                userNameLabel.textContent = fullName;
                userNameLabel.style.display = 'inline-block';
                userNameLabel.style.visibility = 'visible';
                console.log('Set user name:', fullName);
            }

            if (userRoleLabel) {
                const accountType = isBusinessUser ? 'BUSINESS ACCOUNT' : 'STANDARD ACCOUNT';
                userRoleLabel.textContent = accountType;
                userRoleLabel.style.display = 'block';
                userRoleLabel.style.visibility = 'visible';
            }

            
            if (avatarInitialsEl) {
                avatarInitialsEl.textContent = initials;
                avatarInitialsEl.style.display = 'flex';
                avatarInitialsEl.style.visibility = 'visible';
                console.log('Updated avatar initials for:', initials);
            } else {
                console.warn('avatarInitialsEl element not found (ID: desktopUserAvatarInitials)');
            }

            
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

            
            const customDropdown = container ? container.querySelector('.custom-dropdown-menu') : null;
            if (customDropdown) {
                const email = profile.email || '';
                const firstName = fullName || profile.email?.split('@')[0] || 'Account';
                const accountType = isBusinessUser ? 'Business Account' : 'Standard Account';

                
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

                
                const customSignOutBtn = document.getElementById('customHeaderSignOutBtn');
                if (customSignOutBtn) {
                    customSignOutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('Logout button clicked (custom dropdown)');
                        
                        if (window.standardAuth && typeof window.standardAuth.logout === 'function') {
                            console.log('Calling regular user logout');
                            try { await window.standardAuth.logout(); } catch (err) { console.error('Regular logout error:', err); }
                        }
                        
                        if (window.businessAuth && typeof window.businessAuth.logout === 'function') {
                            console.log('Calling business user logout');
                            try { await window.businessAuth.logout(); } catch (err) { console.error('Business logout error:', err); }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        window.location.reload();
                    });
                }
            }

            
            const signOutBtn = document.getElementById('headerSignOutBtn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('Logout button clicked');
                    
                    if (window.standardAuth && typeof window.standardAuth.logout === 'function') {
                        console.log('Calling regular user logout');
                        try { await window.standardAuth.logout(); } catch (err) { console.error('Regular logout error:', err); }
                    }
                    
                    if (window.businessAuth && typeof window.businessAuth.logout === 'function') {
                        console.log('Calling business user logout');
                        try { await window.businessAuth.logout(); } catch (err) { console.error('Business logout error:', err); }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    window.location.reload();
                });
            }
        } catch (e) {
            console.error('Avatar init failed:', e);
            console.error('Error stack:', e.stack);
            
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
    
    (function initLoginDropdown() {
        const container = document.getElementById('desktopLoginContainer');
        const btn = document.getElementById('desktopLoginBtn');
        if (container) {
            container.classList.remove('dropdown-open');
            const loginDropdown = container.querySelector('.login-dropdown');
            if (loginDropdown) loginDropdown.style.display = 'none';
            
        }
        if (btn) btn.setAttribute('aria-expanded', 'false');
    })();

    
    (function rememberReturnToBeforeLogin() {
        try {
            
            const container = document.getElementById('desktopLoginContainer');
            const loginLink = container ? container.querySelector('.login-dropdown .login-card-actions a[href$="login.html"]') : null;
            if (loginLink) {
                loginLink.addEventListener('click', function () {
                    try { sessionStorage.setItem('chp_return_to', window.location.href); } catch (_) { }
                });
            }

            
            const topLoginBtn = document.getElementById('desktopLoginBtn');
            if (topLoginBtn) {
                topLoginBtn.addEventListener('click', function (e) {
                    
                });
            }
        } catch (_) { }
    })();


    
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function (e) {
            e.preventDefault();
            toggleSidebar();
        });
    }

    
    
    const desktopLoginBtn = document.getElementById('desktopLoginBtn');
    if (desktopLoginBtn) {
        desktopLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleHeaderLoginDropdown();
        });
    }

    
    document.addEventListener('click', function (e) {
        const container = document.getElementById('desktopLoginContainer');
        if (!container) return;
        if (!container.contains(e.target)) {
            container.classList.remove('dropdown-open');
            const btn = document.getElementById('desktopLoginBtn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    });

    
    const desktopWishlistLink = document.getElementById('desktopWishlistLink');
    if (desktopWishlistLink) {
        desktopWishlistLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToWishlist();
        });
    }

    
    const desktopMessagesLink = document.getElementById('desktopMessagesLink');
    if (desktopMessagesLink) {
        desktopMessagesLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToMessages();
        });
    }

    
    const mobileMessagesLink = document.getElementById('mobileMessagesLink');
    if (mobileMessagesLink) {
        mobileMessagesLink.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (typeof toggleSidebar === 'function') {
                const sidebar = document.getElementById('mobileSidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
            navigateToMessages();
        });
    }
    
    

    
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
            }, 80); 
        };

        
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

                
                if (!categoriesMenu.classList.contains('show-col-2')) return false;

                
                if (lastMoves.length < 2) return false;
                const a = lastMoves[0];
                const b = lastMoves[lastMoves.length - 1];
                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const headingRight = dx > 12;
                const smallVerticalChange = Math.abs(dy) < 60;

                
                const yInCorridor = b.y > (r2.top - 24) && b.y < (r2.bottom + 24);

                
                const betweenPanels = b.x > (r2.right - 16) && b.x < (r3.left + 24);

                return (headingRight && smallVerticalChange && yInCorridor) || betweenPanels;
            } catch {
                return false;
            }
        }

        
        const closeWithIntent = (baseDelay = 120) => {
            clearTimeout(openTimer);
            openTimer = null;
            clearTimeout(closeTimer);

            const delay = isAimingToThird() ? 260 : baseDelay;

            closeTimer = setTimeout(() => {
                dropdownRoot.classList.remove('hover-open');
                
                categoriesMenu.classList.remove('show-col-2', 'show-col-3');
            }, delay);
        };

        
        dropdownRoot.addEventListener('mouseenter', openWithIntent);
        dropdownRoot.addEventListener('mouseleave', () => closeWithIntent(150));

        
        const subCol = document.getElementById('subcategories-column');
        const subSubCol = document.getElementById('sub-subcategories-column');
        [categoriesMenu, subCol, subSubCol].forEach(el => {
            if (el) {
                el.addEventListener('mouseenter', openWithIntent);
                el.addEventListener('mouseleave', () => closeWithIntent(180));
            }
        });

        
        dropdownRoot.addEventListener('focusin', () => {
            clearTimeout(closeTimer);
            dropdownRoot.classList.add('hover-open');
        });
        dropdownRoot.addEventListener('focusout', (e) => {
            
            if (!dropdownRoot.contains(e.relatedTarget)) {
                closeWithIntent();
            }
        });
    }
});



let isDropdownOpen = false;


function setupLogoNavigation() {
    
    const desktopLogos = document.querySelectorAll('.logo, .logo-img');
    desktopLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        
        logo.style.cursor = 'pointer';
    });

    
    const mobileLogos = document.querySelectorAll('.mobile-logo, .mobile-logo-img');
    mobileLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        
        logo.style.cursor = 'pointer';
    });

    
    const sidebarLogos = document.querySelectorAll('.sidebar-logo-img');
    sidebarLogos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToHome();
        });

        
        logo.style.cursor = 'pointer';
    });
}

function navigateToHome() {
    
    const currentPage = window.location.pathname;
    const isHomePage = currentPage === '/' ||
        currentPage === '/index.html' ||
        currentPage.endsWith('/index.html') ||
        currentPage === '' ||
        currentPage.endsWith('/');

    if (isHomePage) {
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        
        window.location.href = 'index.html';
    }
}


document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    
    setupEventListeners();
    
    setupLogoNavigation();
}

function setupEventListeners() {
    
    document.addEventListener('click', function (e) {
        const dropdown = document.querySelector('.dropdown');

        if (dropdown && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
}



function showNewArrivals() {
    
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showNotifications() {
    
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showLocalBusiness() {
    
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}

function showMyAccount() {
    
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }
}


function simulateLogin() {
    const myAccountLink = document.querySelector('a[href="#my-account"]');
    if (myAccountLink) {
        
        myAccountLink.classList.add('logged-in');
        myAccountLink.textContent = 'John Doe';
        myAccountLink.onclick = function () {
            showLoggedInAccount();
            return false;
        };

        
        showNotification('Successfully logged in as John Doe!', 'success');
    }
}


function simulateLogout() {
    const myAccountLink = document.querySelector('a[href="#my-account"]');
    if (myAccountLink) {
        
        myAccountLink.classList.remove('logged-in');
        myAccountLink.textContent = 'My Account';
        myAccountLink.onclick = function () {
            showMyAccount();
            return false;
        };

        
        showNotification('Successfully logged out!', 'info');
    }
}

function showLoggedInAccount() {
    
    if (window.searchFunctions) {
        window.searchFunctions.setSearchState('', 'all');
    }

    
    showNotification('Here are your personalized recommendations!', 'success');
}

function showNotification(message, type = 'info') {
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    
    document.body.appendChild(notification);

    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}




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









document.addEventListener('keydown', function (e) {
    
    if (e.key === 'Escape') {
        if (isDropdownOpen) {
            closeDropdown();
        }
    }
});


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        
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
