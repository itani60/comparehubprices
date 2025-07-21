const API_BASE_URL = 'https://la81umkg80.execute-api.af-south-1.amazonaws.com';
const API_ENDPOINTS = {
    login: `${API_BASE_URL}/login`,
    register: `${API_BASE_URL}/register`,
    forgotPassword: `${API_BASE_URL}/forgot-password`,
    confirmRegistration: `${API_BASE_URL}/confirm-registration`,
    resetPasswordConfirm: `${API_BASE_URL}/reset-password-confirm`
};

function toggleModal(modalId, show) {
    console.log(`toggleModal called: ${modalId}, show: ${show}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
        console.log(`Modal ${modalId} active class: ${modal.classList.contains('active')}`);
        if (show) {
            document.body.style.overflow = 'hidden';
        } else if (!document.querySelector('.modal.active, .login-modal.active, .register-modal.active, .forgot-password-modal.active')) {
            document.body.style.overflow = '';
        }
    } else {
        console.log(`Modal ${modalId} not found!`);
    }
}

function showAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const alertClass = type === 'success' ? 'success' : 'error';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    if (message) {
        container.innerHTML = `<div class="register-modal-alert ${alertClass}"><i class="fas ${icon}"></i> <span>${message}</span></div>`;
        container.style.display = 'block';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    const buttonText = button.querySelector('span');
    const spinner = button.querySelector('.spinner, .login-modal-spinner, .register-modal-spinner, .forgot-password-modal-spinner');

    button.disabled = isLoading;
    if (spinner && buttonText) {
        buttonText.style.display = isLoading ? 'none' : 'block';
        spinner.style.display = isLoading ? 'block' : 'none';
    }
}

window.togglePassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(`${fieldId}-eye`);
    if (field && eyeIcon) {
        const isPassword = field.type === 'password';
        field.type = isPassword ? 'text' : 'password';
        eyeIcon.className = `fas ${isPassword ? 'fa-eye' : 'fa-eye-slash'}`;
    }
};

window.toggleRegisterPassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(`${fieldId}-eye`);
    if (field && eyeIcon) {
        const isPassword = field.type === 'password';
        field.type = isPassword ? 'text' : 'password';
        eyeIcon.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}`;
    }
};

window.closeForgotPasswordModal = function() {
    toggleModal('forgotPasswordModal', false);
};

window.showLoginModal = function() {
    toggleModal('loginModal', true);
};

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const sidebarLoginContainer = document.getElementById('sidebarLogin');

    function updateUserStatusUI() {
        if (!sidebarLoginContainer) return;

        const idToken = sessionStorage.getItem('idToken');

        if (idToken) {
            // --- User is LOGGED IN ---
            const userData = decodeJwt(idToken);
            if (userData) {
                const initials = (userData.given_name ? userData.given_name[0] : '') + (userData.family_name ? userData.family_name[0] : '');
                sidebarLoginContainer.innerHTML = `
                    <a href="profile.html" class="sidebar-profile-link">
                        <div class="sidebar-user-profile">
                            <div class="sidebar-avatar">${initials.toUpperCase()}</div>
                            <div class="sidebar-user-info">
                                <span class="sidebar-user-name">${userData.given_name} ${userData.family_name}</span>
                                <span class="sidebar-user-email">${userData.email}</span>
                            </div>
                        </div>
                    </a>
                    <button id="signOutBtn" class="sidebar-btn sidebar-signout-btn">Sign Out</button>
                `;

                document.getElementById('signOutBtn').addEventListener('click', () => {
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('idToken');
                    window.location.href = 'index.html';
                });
            }
        } else {
            // --- User is LOGGED OUT ---
            sidebarLoginContainer.innerHTML = `
                <button id="sidebarSignInBtn" class="sidebar-btn sidebar-signin-btn">Sign In / Register</button>
            `;
            document.getElementById('sidebarSignInBtn').addEventListener('click', () => {
                toggleModal('loginModal', true);
            });
        }
    }

    updateUserStatusUI();

    document.querySelectorAll('.login-modal, .register-modal, .forgot-password-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Only close if clicking directly on the modal backdrop (not on any child elements)
            if (e.target === modal) {
                toggleModal(modal.id, false);
            }
        });
        const closeButton = modal.querySelector('.login-modal-close, .register-modal-close, .forgot-password-modal-close, .wishlist-close-modal');
        if (closeButton) closeButton.addEventListener('click', () => toggleModal(modal.id, false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active, .login-modal.active, .register-modal.active, .forgot-password-modal.active');
            if (activeModal) toggleModal(activeModal.id, false);
        }
    });

    // --- Handle Login Modal ---
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        const loginForm = document.getElementById('loginModalForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginModalEmail').value;
            const password = document.getElementById('loginModalPassword').value;
            const loginBtn = document.getElementById('loginModalBtn');

            showAlert('loginAlertContainer', '');
            setButtonLoading(loginBtn, true);

            try {
                const response = await fetch(API_ENDPOINTS.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('accessToken', data.accessToken);
                    sessionStorage.setItem('idToken', data.idToken);
                    window.location.reload();
                } else {
                    showAlert('loginAlertContainer', data.message || 'An unknown error occurred.', 'error');
                    setButtonLoading(loginBtn, false);
                }
            } catch (error) {
                showAlert('loginAlertContainer', 'Could not connect to the server.', 'error');
                setButtonLoading(loginBtn, false);
            }
        });

        document.getElementById('loginModalForgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal('loginModal', false);
            toggleModal('forgotPasswordModal', true);
        });
        document.getElementById('loginModalRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal('loginModal', false);
            toggleModal('registerModal', true);
        });

        // Password toggle for login modal
        const loginPasswordToggle = document.getElementById('loginModalPasswordToggle');
        if (loginPasswordToggle) {
            loginPasswordToggle.addEventListener('click', () => {
                const passwordField = document.getElementById('loginModalPassword');
                const eyeIcon = loginPasswordToggle.querySelector('i');
                if (passwordField && eyeIcon) {
                    const isPassword = passwordField.type === 'password';
                    passwordField.type = isPassword ? 'text' : 'password';
                    eyeIcon.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}`;
                }
            });
        }
    }

    // --- Handle Forgot Password Modal ---
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    if (forgotPasswordModal) {
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotPasswordEmail').value;
            const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

            showAlert('forgotPasswordAlert', '');
            setButtonLoading(forgotPasswordBtn, true);

            try {
                const response = await fetch(API_ENDPOINTS.forgotPassword, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
                } else {
                    showAlert('forgotPasswordAlert', data.message || 'An unknown error occurred.', 'error');
                    setButtonLoading(forgotPasswordBtn, false);
                }
            } catch (error) {
                showAlert('forgotPasswordAlert', 'Could not connect to the server.', 'error');
                setButtonLoading(forgotPasswordBtn, false);
            }
        });
    }

    // --- Handle Register Modal ---
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        // Password strength validation
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', function() {
                const password = this.value;
                const lengthCheck = document.getElementById('register-length-check');
                const upperCheck = document.getElementById('register-upper-check');
                const numberCheck = document.getElementById('register-number-check');
                const specialCheck = document.getElementById('register-special-check');

                // Length check
                if (lengthCheck) {
                    const isValid = password.length >= 8;
                    lengthCheck.classList.toggle('valid', isValid);
                    lengthCheck.querySelector('i').className = `fas ${isValid ? 'fa-check' : 'fa-times'}`;
                }

                // Uppercase check
                if (upperCheck) {
                    const isValid = /[A-Z]/.test(password);
                    upperCheck.classList.toggle('valid', isValid);
                    upperCheck.querySelector('i').className = `fas ${isValid ? 'fa-check' : 'fa-times'}`;
                }

                // Number check
                if (numberCheck) {
                    const isValid = /[0-9]/.test(password);
                    numberCheck.classList.toggle('valid', isValid);
                    numberCheck.querySelector('i').className = `fas ${isValid ? 'fa-check' : 'fa-times'}`;
                }

                // Special character check
                if (specialCheck) {
                    const isValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                    specialCheck.classList.toggle('valid', isValid);
                    specialCheck.querySelector('i').className = `fas ${isValid ? 'fa-check' : 'fa-times'}`;
                }
            });
        }

        const registerForm = document.getElementById('registerModalForm');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const given_name = document.getElementById('registerFirstname').value;
            const family_name = document.getElementById('registerLastname').value;
            const password = document.getElementById('registerPassword').value;
            const registerBtn = document.getElementById('registerModalBtn');

            showAlert('registerAlertContainer', '');
            setButtonLoading(registerBtn, true);

            try {
                const response = await fetch(API_ENDPOINTS.register, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, given_name, family_name })
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = `confirm-registration.html?email=${encodeURIComponent(email)}`;
                } else {
                    showAlert('registerAlertContainer', data.message || 'An unknown error occurred.', 'error');
                    setButtonLoading(registerBtn, false);
                }
            } catch (error) {
                showAlert('registerAlertContainer', 'Could not connect to the server.', 'error');
                setButtonLoading(registerBtn, false);
            }
        });

        // Register modal navigation links
        const registerModalLoginLink = document.getElementById('registerModalLoginLink');
        if (registerModalLoginLink) {
            registerModalLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                toggleModal('registerModal', false);
                toggleModal('loginModal', true);
            });
        }
    }
});

/**
 * Session Management for CompareHub
 * This file contains functionality to handle user sessions and expiration
 */

// Function to handle user logout
function handleLogout() {
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Function to check session validity
function checkSessionValidity() {
    const accessToken = sessionStorage.getItem('accessToken');
    
    if (accessToken) {
        try {
            // This would be replaced with actual API call to validate session
            // For now, we'll just set up the infrastructure
            console.log('Session validation would happen here');
            
            // Example of how to handle an expired session:
            // if (isSessionExpired) {
            //     showNotification('Your session has expired. Please log in again.', 'error', 'Session Expired');
            //     setTimeout(handleLogout, 2000);
            // }
        } catch (error) {
            // Handle any errors during session validation
            if (typeof showNotification === 'function') {
                showNotification(error.message, 'error', 'Session Error');
                setTimeout(handleLogout, 2000);
            } else {
                console.error('Session error:', error);
                handleLogout();
            }
        }
    }
}

// Make functions available globally
window.handleLogout = handleLogout;
window.checkSessionValidity = checkSessionValidity;

// Initialize session management
document.addEventListener('DOMContentLoaded', function() {
    // Check session validity on page load
    checkSessionValidity();
    
    // Optionally, set up periodic session checks
    // setInterval(checkSessionValidity, 5 * 60 * 1000); // Check every 5 minutes
});