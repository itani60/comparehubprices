(() => {
  'use strict';

  const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
  const AUTH_API_URL = `${SUPABASE_URL}/functions/v1/Business_account_system`;
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';
  const CHAT_SESSION_STORAGE_KEY = 'chp_session_id';

  function getCookie(name) {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift() || '';
      return '';
    } catch {
      return '';
    }
  }

  function clearCookie(name) {
    const isSecure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${isSecure}`;
  }

  function getRedirect({ form, redirectTo }) {
    return (
      redirectTo ||
      form?.dataset?.successRedirect ||
      document.body?.dataset?.successRedirect ||
      'smartphones.html'
    );
  }

  function setCsrfCookie(token) {
    const maxAge = 12 * 60 * 60; // 12 hours
    const isSecure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `business_csrf_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}`;
  }

  function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.style.display = 'block';
      return;
    }

    const loginAlert = document.getElementById('loginAlert') || document.getElementById('login-alert');
    if (loginAlert) {
      loginAlert.textContent = message;
      loginAlert.className = 'login-alert show error';
      return;
    }

    window.alert(message);
  }

  function hideError() {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) errorAlert.style.display = 'none';
    const loginAlert = document.getElementById('loginAlert') || document.getElementById('login-alert');
    if (loginAlert) loginAlert.className = 'login-alert';
  }

  async function getUserInfo({ csrfToken } = {}) {
    const csrf = csrfToken || getCookie('business_csrf_token') || '';
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({ action: 'getUserInfo' }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: result?.error || 'Failed to fetch user info', status: response.status };
    }
    return result;
  }

  async function checkExistingSession({ redirectTo } = {}) {
    try {
      const info = await getUserInfo();
      if (info?.success) {
        const target = redirectTo || document.body?.dataset?.successRedirect || 'smartphones.html';
        window.location.href = target;
      }
    } catch {
      // ignore
    }
  }

  async function logout() {
    const csrf = getCookie('business_csrf_token') || '';
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({ action: 'logout' }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: result?.error || 'Logout failed', status: response.status };
    }

    clearCookie('business_csrf_token');
    try { localStorage.removeItem(CHAT_SESSION_STORAGE_KEY); } catch { }
    return result;
  }

  async function login({ email, password, redirectTo, form } = {}) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'login',
        email: String(email).trim(),
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || 'Login failed');
    }

    if (data?.success && data?.csrf_token) {
      setCsrfCookie(data.csrf_token);
      try {
        if (data.session_id) localStorage.setItem(CHAT_SESSION_STORAGE_KEY, String(data.session_id));
      } catch { }
      const target = getRedirect({ form, redirectTo });
      if (target) window.location.href = target;
      return data;
    }

    throw new Error('Invalid response from server');
  }

  function wireIfOptedIn() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const mode = form.dataset.authMode || document.body.dataset.authMode;
    if (mode !== 'business') return;

    const submitBtn =
      document.getElementById('submitBtn') ||
      document.getElementById('submit-btn') ||
      form.querySelector('button[type="submit"]');
    const spinner = document.getElementById('loadingSpinner');

    const successRedirect = getRedirect({ form });
    checkExistingSession({ redirectTo: successRedirect });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.style.display = 'inline-block';

      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;

      try {
        await login({ email, password, form });
      } catch (err) {
        const msg = err?.message || 'Login failed';
        if (msg.includes('Too many login attempts')) {
          showError('Too many failed login attempts. Please wait 15 minutes and try again.');
        } else {
          showError(msg);
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.style.display = 'none';
      }
    });
  }

  async function register(data) {
    const REGISTRATION_API_URL = `${SUPABASE_URL}/functions/v1/business-registration-auth`;

    // Validate required fields
    const required = ['email', 'password', 'firstName', 'lastName', 'businessName', 'businessNumber', 'streetAddress', 'suburb', 'city', 'province', 'postalCode', 'businessType'];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }

    const response = await fetch(REGISTRATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'signup',
        ...data
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Registration failed');
    }

    return result;
  }

  async function verifyOtp({ email, token, type = 'signup' }) {
    // For business accounts, verification is handled by the custom edge function
    const REGISTRATION_API_URL = `${SUPABASE_URL}/functions/v1/business-registration-auth`;

    if (!email || !token) {
      throw new Error('Email and verification code are required');
    }

    const response = await fetch(REGISTRATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'verifyOTP',
        email,
        otpCode: token
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Verification failed');
    }

    return result;
  }

  window.businessAuth = { login, register, verifyOtp, getUserInfo, checkExistingSession, logout };
  document.addEventListener('DOMContentLoaded', wireIfOptedIn);
})();
