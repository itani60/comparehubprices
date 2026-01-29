(() => {
  'use strict';

  const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
  const AUTH_API_URL = `${SUPABASE_URL}/functions/v1/Business_account_system`;
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

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
    // For business accounts, we might need a specific endpoint if standard auth.verifyOtp isn't sufficient,
    // but typically Supabase auth.verifyOtp works for all users in the auth schema.
    // However, if we need to call the business edge function for verification, we would do it here.
    // Assuming standard Supabase OTP verification for now as the registration creates a user in auth.users.

    // BUT, the standard-auth.js uses db.auth.verifyOtp. Since business-auth.js doesn't initialize a client directly
    // but relies on edge functions for login/register, we might need to use the edge function OR a direct client.
    // The previous standard-auth.js used window.supabase.createClient.
    // Let's use the edge function if possible, or fall back to a direct client call if we have the anon key.

    // Actually, looking at standard-auth.js, it imports getSupabaseClientIfAvailable.
    // Here we don't have that helper. We should probably use the anon key and rest api or use the supabase-js client if included.
    // The HTML includes <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>.

    if (window.supabase) {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type
      });
      if (error) throw error;
      return data;
    }

    throw new Error('Supabase client not available for OTP verification');
  }

  window.businessAuth = { login, register, verifyOtp, getUserInfo, checkExistingSession, logout };
  document.addEventListener('DOMContentLoaded', wireIfOptedIn);
})();
