

let isMobileSidebarOpen = false;
const SIDEBAR_MOBILE_SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
const SIDEBAR_MOBILE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

function sidebarMobileGetCookie(name) {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift() || '';
        return '';
    } catch {
        return '';
    }
}

function sidebarMobileClearCookie(name) {
    const isSecure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${isSecure}`;
}

window.sidebarMobileStandardGetUserInfo = async function sidebarMobileStandardGetUserInfo() {
    const accessToken = sidebarMobileGetCookie('standard_session_id') || '';
    const csrfToken = sidebarMobileGetCookie('standard_csrf_token') || '';
    if (!accessToken || !csrfToken) return { success: false };

    const response = await fetch(`${SIDEBAR_MOBILE_SUPABASE_URL}/functions/v1/standard_account_auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SIDEBAR_MOBILE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SIDEBAR_MOBILE_SUPABASE_ANON_KEY}`,
            'x-access-token': accessToken,
            'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'getUserInfo', session_id: accessToken })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: result?.error || 'Failed to fetch user info' };
    return result;
}

window.sidebarMobileBusinessGetUserInfo = async function sidebarMobileBusinessGetUserInfo() {
    const accessToken = sidebarMobileGetCookie('business_session_id') || '';
    const csrfToken = sidebarMobileGetCookie('business_csrf_token') || '';
    if (!accessToken || !csrfToken) return { success: false };

    const response = await fetch(`${SIDEBAR_MOBILE_SUPABASE_URL}/functions/v1/Business_account_system`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SIDEBAR_MOBILE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SIDEBAR_MOBILE_SUPABASE_ANON_KEY}`,
            'x-access-token': accessToken,
            'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'getUserInfo', session_id: accessToken })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: result?.error || 'Failed to fetch user info' };
    return result;
}

async function resolveSidebarMobileAuthUser() {
    let user = null;
    let isBusinessUser = false;

    try {
        const businessInfo = await (window.businessAuth?.getUserInfo?.() || window.sidebarMobileBusinessGetUserInfo?.());
        if (businessInfo && businessInfo.success && businessInfo.user) {
            user = businessInfo.user;
            isBusinessUser = true;
        }
    } catch (err) {
        if (!(err?.status === 401 || err?.status === undefined || err?.unauthenticated)) {
            console.debug('Error fetching business user info:', err?.message || err);
        }
    }

    if (!user) {
        try {
            const standardInfo = await (window.standardAuth?.getUserInfo?.() || window.sidebarMobileStandardGetUserInfo?.());
            if (standardInfo && standardInfo.success && standardInfo.user) {
                user = standardInfo.user;
                isBusinessUser = false;
            }
        } catch (err) {
            if (!(err?.status === 401 || err?.status === undefined || err?.unauthenticated)) {
                console.debug('Error fetching regular user info:', err?.message || err);
            }
        }
    }

    return { user, isBusinessUser };
}


window.toggleSidebar = function () {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    console.log('toggleSidebar called, current state:', isMobileSidebarOpen);

    if (!sidebar) {
        console.error('Mobile sidebar element not found!');
        return;
    }

    isMobileSidebarOpen = !isMobileSidebarOpen;

    if (isMobileSidebarOpen) {
        
        sidebar.classList.add('active');
        if (overlay) {
            overlay.classList.add('active');
        }
        
        document.body.style.overflow = 'hidden';
        
        if (window.updateMobileSidebarLoginState) {
            setTimeout(() => window.updateMobileSidebarLoginState(), 50);
        }
        console.log('Sidebar opened');
    } else {
        
        sidebar.classList.remove('active');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        document.body.style.overflow = '';
        console.log('Sidebar closed');
    }
}


document.addEventListener('click', function (e) {
    const sidebar = document.getElementById('mobileSidebar');
    const clickedInsideToggle = e.target.closest('.sidebar-toggle') !== null;
    const clickedInsideSidebar = sidebar && sidebar.contains(e.target);

    
    if (isMobileSidebarOpen && !clickedInsideSidebar && !clickedInsideToggle) {
        window.toggleSidebar();
    }
});


document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMobileSidebarOpen) {
        window.toggleSidebar();
    }
});


window.addEventListener('resize', function () {
    if (window.innerWidth > 1400 && isMobileSidebarOpen) {
        window.toggleSidebar();
    }
});


window.handleMobileSidebarLogin = function handleMobileSidebarLogin() {
    
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }

    
    setTimeout(() => {
        try { sessionStorage.setItem('chp_return_to', window.location.href); } catch (_) { }
        window.location.href = 'login.html';
    }, 300);
}


window.toggleLoginState = function toggleLoginState() {
    
    window.handleMobileSidebarLogin();
}


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


window.handleMobileLogout = async function handleMobileLogout() {
    try {
        console.log('Mobile logout called');
        
        if (isMobileSidebarOpen) {
            window.toggleSidebar();
        }

        const hasStandardSession = !!sidebarMobileGetCookie('standard_session_id');
        const hasBusinessSession = !!sidebarMobileGetCookie('business_session_id');

        
        if (hasStandardSession && window.standardAuth && typeof window.standardAuth.logout === 'function') {
            console.log('Calling regular user logout (mobile)');
            await window.standardAuth.logout();
        } else if (hasStandardSession) {
            sidebarMobileClearCookie('standard_session_id');
            sidebarMobileClearCookie('standard_csrf_token');
        }

        
        if (hasBusinessSession && window.businessAuth && typeof window.businessAuth.logout === 'function') {
            console.log('Calling business user logout (mobile)');
            await window.businessAuth.logout();
        } else if (hasBusinessSession) {
            console.warn('businessAuth not available or logout function missing (mobile)', {
                hasService: !!window.businessAuth,
                hasLogout: window.businessAuth && typeof window.businessAuth.logout
            });
            sidebarMobileClearCookie('business_session_id');
            sidebarMobileClearCookie('business_csrf_token');
        }

        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.reload();
    }
};


window.showLogoutConfirmation = function showLogoutConfirmation() {
    handleMobileLogout();
}


window.updateMobileSidebarLoginState = async function updateMobileSidebarLoginState() {
    try {
        const loggedInState = document.getElementById('loggedInState');
        const loggedOutState = document.getElementById('loggedOutState');

        if (!loggedInState || !loggedOutState) {
            
            return;
        }

        const { user, isBusinessUser } = await resolveSidebarMobileAuthUser();
        if (user) {
            console.log(
                `${isBusinessUser ? 'Business' : 'Regular'} user profile loaded successfully:`,
                user.email || 'no email'
            );
        }

        if (user) {
            
            const initials = getMobileSidebarInitials(user);
            const fullName = user.fullName ||
                `${(user.givenName || user.given_name || '')} ${(user.familyName || user.family_name || '')}`.trim() ||
                user.name ||
                '';
            const email = user.email || '';

            
            
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
                sidebarAccountType.textContent = isBusinessUser ? 'Business Account' : 'Standard Account';
            }

            
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

            
            loggedInState.style.display = 'block';
            loggedOutState.style.display = 'none';
        } else {
            
            loggedInState.style.display = 'none';
            loggedOutState.style.display = 'block';
        }
    } catch (error) {
        
        console.debug('Mobile sidebar auth check failed:', error);
        const loggedInState = document.getElementById('loggedInState');
        const loggedOutState = document.getElementById('loggedOutState');
        if (loggedInState) loggedInState.style.display = 'none';
        if (loggedOutState) loggedOutState.style.display = 'block';
    }
}


document.addEventListener('DOMContentLoaded', function () {
    
    
    setTimeout(async () => {
        await updateMobileSidebarLoginState();
    }, 100);

    
    const closeButton = document.getElementById('sidebarClose');
    if (closeButton) {
        closeButton.addEventListener('click', function () {
            if (isMobileSidebarOpen) {
                window.toggleSidebar();
            }
        });
    }

    
    const sidebarLinks = document.querySelectorAll('.sidebar-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            
            setTimeout(() => {
                if (isMobileSidebarOpen) {
                    window.toggleSidebar();
                }
            }, 100);
        });
    });

    
    const mobileLoginBtn = document.querySelector('#mobileSidebar a[href="login.html"]');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            handleMobileSidebarLogin();
        });
    }

    
    const mobileLoginLink = document.querySelector('.mobile-sidebar a[href="login.html"]');
    if (mobileLoginLink) {
        mobileLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            handleMobileSidebarLogin();
        });
    }

    
    const allMobileLoginLinks = document.querySelectorAll('#mobileSidebar a, .mobile-sidebar a');
    allMobileLoginLinks.forEach(link => {
        if (link.getAttribute('href') === 'login.html' || link.textContent.toLowerCase().includes('login')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                handleMobileSidebarLogin();
            });
        }
    });

    console.log('Mobile sidebar functionality initialized');
});


window.toggleSubmenu = function (element) {
    const item = element.parentElement;
    const isActive = item.classList.contains('active');

    
    document.querySelectorAll('.menu-items .item').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove('active');
        }
    });

    
    if (isActive) {
        item.classList.remove('active');
    } else {
        item.classList.add('active');
    }
}


function navigateToGamingCategory(category) {
    
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }

    
    setTimeout(() => {
        window.location.href = `gaming.html?category=${category}`;
    }, 300);
}


function navigateToAudioCategory(category) {
    
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }

    
    setTimeout(() => {
        window.location.href = `audio.html?category=${category}`;
    }, 300);
}


function navigateToSmartphonesCategory(category) {
    
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }

    
    setTimeout(() => {
        window.location.href = `smartphones.html?category=${category}`;
    }, 300);
}


function navigateToTabletsCategory(category) {
    
    if (isMobileSidebarOpen) {
        window.toggleSidebar();
    }

    
    setTimeout(() => {
        window.location.href = `tablets.html?category=${category}`;
    }, 300);
}


document.addEventListener('DOMContentLoaded', function () {
    
    const gamingLinks = document.querySelectorAll('#mobileSidebar a[href*="#consoles"], #mobileSidebar a[href*="#gaming-laptops"], #mobileSidebar a[href*="#gaming-monitors"], #mobileSidebar a[href*="#handled-gaming"], #mobileSidebar a[href*="#consoles-accessories"], #mobileSidebar a[href*="#pc-gaming-accessories"]');

    
    const smartphonesLinks = document.querySelectorAll('#mobileSidebar a[href*="#smartphones"], #mobileSidebar a[href*="#tablets"], #mobileSidebar a[href*="#accessories"]');

    
    const audioLinks = document.querySelectorAll('#mobileSidebar a[href*="#earbuds"], #mobileSidebar a[href*="#headphones"], #mobileSidebar a[href*="#speakers"], #mobileSidebar a[href*="#party-speakers"], #mobileSidebar a[href*="#soundbars"], #mobileSidebar a[href*="#hifi"]');

    
    const laptopLinks = document.querySelectorAll('#mobileSidebar a[href*="laptops.html"]');

    
    const televisionLinks = document.querySelectorAll('#mobileSidebar a[href*="television.html"]');

    gamingLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
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
        });
    });

    
    audioLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
            let category = '';

            
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

    
    smartphonesLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
            let category = '';

            
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

    
    laptopLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
            let category = 'macbooks'; 

            
            if (href.includes('category=windows')) {
                category = 'windows';
            } else if (href.includes('category=macbooks')) {
                category = 'macbooks';
            } else if (href.includes('category=chromebooks')) {
                category = 'chromebooks';
            }

            console.log('Laptop navigation clicked:', href, '-> category:', category);

            
            window.location.href = `laptops.html?category=${category}`;
        });
    });

    
    televisionLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
            let type = 'televisions'; 

            
            if (href.includes('type=televisions')) {
                type = 'televisions';
            } else if (href.includes('type=streaming-devices')) {
                type = 'streaming-devices';
            }

            console.log('Television navigation clicked:', href, '-> type:', type);

            
            window.location.href = `television.html?type=${type}`;
        });
    });

    
    const allGamingLinks = document.querySelectorAll('#mobileSidebar a, .mobile-sidebar a');
    allGamingLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const href = link.getAttribute('href');

        
        if (href && (href.includes('#consoles') || href.includes('#gaming-laptops') ||
            href.includes('#gaming-monitors') || href.includes('#handled-gaming') ||
            href.includes('#consoles-accessories') || href.includes('#pc-gaming-accessories') ||
            href.includes('#earbuds') || href.includes('#headphones') ||
            href.includes('#speakers') || href.includes('#party-speakers') ||
            href.includes('#soundbars') || href.includes('#hifi') ||
            href.includes('#smartphones') || href.includes('#tablets') || href.includes('#accessories') ||
            href.includes('laptops.html') || href.includes('television.html'))) {
            return; 
        }

        
        if (text.includes('windows laptop') || text.includes('windows laptops')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=windows';
            });
        } else if (text.includes('macbook') || text.includes('macbooks')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=macbooks';
            });
        } else if (text.includes('chromebook') || text.includes('chromebooks')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'laptops.html?category=chromebooks';
            });
        } else if (text.includes('consoles accessories')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToGamingCategory('consoles-accessories');
            });
        } else if (text.includes('gaming console') || (text.includes('console') && !text.includes('accessories'))) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToGamingCategory('consoles');
            });
        } else if (text.includes('gaming laptop')) {
            
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToGamingCategory('laptop-gaming');
            });
        } else if (text.includes('gaming monitor') || text.includes('monitor')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToGamingCategory('gaming-monitors');
            });
        } else if (text.includes('pc gaming accessories') || text.includes('pc gaming accessory')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToGamingCategory('pc-gaming-accessories');
            });
        } else if (text.includes('television') || text.includes('televisions')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'television.html?type=televisions';
            });
        } else if (text.includes('streaming device') || text.includes('streaming devices')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'television.html?type=streaming-devices';
            });
        } else if (text.includes('smartphone') || text.includes('smartphones')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToSmartphonesCategory('smartphones');
            });
        } else if (text.includes('tablet') || text.includes('tablets')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToTabletsCategory('tablets');
            });
        } else if (text.includes('mobile accessories') || text.includes('accessories')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToSmartphonesCategory('accessories');
            });
        } else if (text.includes('earbuds') || text.includes('earbud')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('earbuds');
            });
        } else if (text.includes('headphones') || text.includes('headphone')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('headphones');
            });
        } else if (text.includes('bluetooth speakers') || text.includes('bluetooth speaker')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('bluetooth-speakers');
            });
        } else if (text.includes('party speakers') || text.includes('party speaker')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('portable-speakers');
            });
        } else if (text.includes('soundbars') || text.includes('soundbar')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('soundbars');
            });
        } else if (text.includes('hifi') || text.includes('hi-fi') || text.includes('stereo')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToAudioCategory('hifi-systems');
            });
        }
    });
});


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


document.addEventListener('DOMContentLoaded', function () {
    const root = document.getElementById('mobileSidebar') || document.querySelector('.mobile-sidebar');
    if (!root) return;

    
    const qaWishlist = root.querySelector('.quick-access-item.new-arrivals');
    if (qaWishlist) {
        qaWishlist.addEventListener('click', function (e) {
            e.preventDefault();
            
            goToMobile('whishlist.html');
        });
    }

    
    const qaNotifications = root.querySelector('.quick-access-item.notifications');
    if (qaNotifications) {
        qaNotifications.addEventListener('click', function (e) {
            e.preventDefault();
            goToMobile('notifications');
        });
    }

    
    const qaLocal = root.querySelector('.quick-access-item.local-business');
    if (qaLocal) {
        qaLocal.addEventListener('click', function (e) {
            e.preventDefault();
            goToMobile('local_hub.html');
        });
    }

    
    
    const profileLinks = root.querySelectorAll('.quick-access-item.help, .my-profile-link');
    profileLinks.forEach(qaProfile => {
        qaProfile.addEventListener('click', async function (e) {
            e.preventDefault();

            const { isBusinessUser } = await resolveSidebarMobileAuthUser();

            
            const accountPage = isBusinessUser ? 'Business_account_manager.html' : 'my_account.html';
            goToMobile(accountPage);
        });
    });

    
    
    const messagesLinks = root.querySelectorAll('.quick-access-item.messages, #mobileMessagesLink');
    messagesLinks.forEach(messagesLink => {
        messagesLink.addEventListener('click', async function (e) {
            e.preventDefault();

            const { user, isBusinessUser } = await resolveSidebarMobileAuthUser();

            
            if (!user) {
                if (typeof showToast === 'function') {
                    showToast('Please login to access your messages', 'warning', 'Login Required');
                } else if (typeof showWarningToast === 'function') {
                    showWarningToast('Please login to access your messages', 'Login Required');
                } else {
                    alert('Please login to access your messages');
                }
                return;
            }

            
            
            
            const chatPage = isBusinessUser ? 'business-chat-hub/' : 'chat-hub/';
            goToMobile(chatPage);
        });
    });
});

function toggleCustomCategory(element) {
    const categoryItem = element.closest('.custom-category-item');
    const isActive = categoryItem.classList.contains('active');

    
    document.querySelectorAll('.custom-category-item').forEach(item => {
        if (item !== categoryItem) {
            item.classList.remove('active');
        }
    });

    
    if (isActive) {
        categoryItem.classList.remove('active');
    } else {
        categoryItem.classList.add('active');
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('categorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const categoryItems = document.querySelectorAll('.custom-category-item');

            categoryItems.forEach(item => {
                const title = item.querySelector('.custom-category-title').textContent.toLowerCase();
                const links = item.querySelectorAll('.custom-category-link');
                let hasMatch = title.includes(searchTerm);

                
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
