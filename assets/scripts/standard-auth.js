(() => {
  'use strict';

  const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';
  const AUTH_NOTICE_KEY = 'standard_auth_notice';

  function getCookie(name) {
    try {
      const cookieText = String(document.cookie || '');
      if (!cookieText) return '';
      const entries = cookieText.split(';');
      let matched = '';
      for (const entry of entries) {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex <= 0) continue;
        const key = entry.slice(0, separatorIndex).trim();
        if (key !== name) continue;
        const raw = entry.slice(separatorIndex + 1).trim();
        if (!raw) continue;
        try {
          matched = decodeURIComponent(raw).trim();
        } catch {
          matched = raw.trim();
        }
      }
      return matched;
    } catch {
      return '';
    }
  }

  function setCookie(name, value, { maxAgeSeconds } = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax'];
    if (typeof maxAgeSeconds === 'number') parts.push(`max-age=${maxAgeSeconds}`);
    if (location.protocol === 'https:') parts.push('Secure');
    document.cookie = parts.join('; ');
  }

  function clearCookie(name) {
    const isSecure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${isSecure}`;
  }

  function getRedirect({ form, redirectTo } = {}) {
    let queryRedirect = '';
    try {
      const params = new URLSearchParams(window.location.search);
      const raw =
        params.get('redirect') ||
        params.get('next') ||
        params.get('return') ||
        params.get('returnTo');
      if (raw) {
        const url = new URL(raw, window.location.href);
        if (url.origin === window.location.origin) {
          queryRedirect = `${url.pathname}${url.search}${url.hash}`;
        }
      }
    } catch {
      queryRedirect = '';
    }

    return (
      queryRedirect ||
      redirectTo ||
      form?.dataset?.successRedirect ||
      document.body?.dataset?.successRedirect ||
      'smartphones.html'
    );
  }

  function setButtonLoading(button, loading, loadingText) {
    if (!button) return;
    const textEl = button.querySelector('span') || button;
    if (loading) {
      button.dataset.originalText = textEl.textContent || '';
      button.disabled = true;
      if (loadingText) textEl.textContent = loadingText;
      button.classList.add('loading');
    } else {
      button.disabled = false;
      const original = button.dataset.originalText;
      if (typeof original === 'string') textEl.textContent = original;
      button.classList.remove('loading');
    }
  }

  async function readResponsePayload(response) {
    let text = '';
    try {
      text = await response.text();
    } catch {
      text = '';
    }

    if (!text) return { data: null, text: '' };
    try {
      return { data: JSON.parse(text), text };
    } catch {
      return { data: null, text };
    }
  }

  function logFetchFailure(label, response, payload) {
    const details = {
      status: response?.status,
      statusText: response?.statusText,
      body: payload?.data || payload?.text || null,
    };
    console.warn(`[standardAuth] ${label} failed`, details);
  }

  async function fetchWithDebug(label, url, init) {
    try {
      const response = await fetch(url, init);
      return { response, error: null };
    } catch (error) {
      console.warn(`[standardAuth] ${label} network error`, error);
      return { response: null, error };
    }
  }

  function showMessage(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    if (alertBox && alertMessage) {
      alertMessage.textContent = message;
      alertBox.className = 'alert show alert-' + type;
      const icon = alertBox.querySelector('i');
      if (icon) icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
      return;
    }

    const loginAlert = document.getElementById('loginAlert') || document.getElementById('login-alert');
    if (loginAlert) {
      loginAlert.textContent = message;
      loginAlert.className = `login-alert show ${type}`;
      return;
    }

    // Fallback
    window.alert(message);
  }

  function ensureToastStyles() {
    if (document.getElementById('auth-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-toast-styles';
    style.textContent = `
      .auth-toast-container{position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px}
      .auth-toast{min-width:240px;max-width:360px;padding:12px 14px;border-radius:12px;color:#fff;font-size:14px;box-shadow:0 10px 24px rgba(0,0,0,.18);opacity:0;transform:translateY(-6px);transition:opacity .2s ease,transform .2s ease}
      .auth-toast.show{opacity:1;transform:translateY(0)}
      .auth-toast-success{background:linear-gradient(135deg,#16a34a,#22c55e)}
      .auth-toast-error{background:linear-gradient(135deg,#dc2626,#ef4444)}
      .auth-toast-info{background:linear-gradient(135deg,#2563eb,#3b82f6)}
    `;
    document.head.appendChild(style);
  }

  function ensureToastContainer() {
    let container = document.getElementById('authToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'authToastContainer';
      container.className = 'auth-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'error') {
    ensureToastStyles();
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `auth-toast auth-toast-${type}`;
    toast.textContent = message;
    console.debug('[authToast] show', { message, type });
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    const timeout = window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 220);
    }, 4500);
    toast.addEventListener('click', () => {
      window.clearTimeout(timeout);
      toast.remove();
    });
  }

  function wireLoginAlertToasts() {}

  function setAuthNotice(message, { email, type } = {}) {
    const payload = {
      message: String(message || ''),
      type: type || 'error',
      email: email ? String(email) : '',
      ts: Date.now(),
    };
    try {
      sessionStorage.setItem(AUTH_NOTICE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  function consumeAuthNotice() {
    try {
      const raw = sessionStorage.getItem(AUTH_NOTICE_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(AUTH_NOTICE_KEY);
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function redirectToLoginWithNotice(message, { email, type } = {}) {
    setAuthNotice(message, { email, type });
    const loginUrl = new URL('login.html', window.location.href).href;
    window.location.href = loginUrl;
  }

  function hideMessage() {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) alertBox.classList.remove('show');
    const loginAlert = document.getElementById('loginAlert') || document.getElementById('login-alert');
    if (loginAlert) loginAlert.classList.remove('show', 'error', 'success');
  }

  let cachedSupabaseClient = null;
  function getSupabaseClientIfAvailable() {
    try {
      if (!window.supabase?.createClient) return null;
      if (cachedSupabaseClient) return cachedSupabaseClient;
      if (window.__chpSupabaseClient) {
        cachedSupabaseClient = window.__chpSupabaseClient;
        return cachedSupabaseClient;
      }
      cachedSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.__chpSupabaseClient = cachedSupabaseClient;
      return cachedSupabaseClient;
    } catch {
      return null;
    }
  }

  async function login({ email, password, rememberMe, redirectTo, form } = {}) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const normalizedEmail = String(email).trim();
    if (!normalizedEmail) {
      throw new Error('Email and password are required.');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'login',
        email: normalizedEmail,
        password,
      }),
    });

    const payload = await readResponsePayload(response);
    const result = payload.data || {};

    if (!response.ok) {
      const details = result?.details || payload.text || '';
      if (details) console.warn('[standardAuth] login error details:', details);
      throw new Error(result?.error || payload.text || 'Login failed');
    }

    const { session_id, user, csrf_token } = result || {};

    if (user && user.email_confirmed_at === null) {
      throw new Error('Please verify your email address before logging in.');
    }

    const maxAgeSeconds = 12 * 60 * 60; // 12 hours
    if (session_id) {
      setCookie('standard_session_id', session_id, { maxAgeSeconds });
    }

    if (csrf_token) {
      setCookie('standard_csrf_token', csrf_token, { maxAgeSeconds });
    }

    const target = getRedirect({ form, redirectTo });
    if (target) window.location.href = target;

    return result;
  }

  async function signInWithGoogle({ redirectTo, form } = {}) {
    const db = getSupabaseClientIfAvailable();
    if (!db?.auth?.signInWithOAuth) {
      throw new Error('Google sign-in is not available on this page.');
    }

    const target = getRedirect({ form, redirectTo });
    const onLoginPage =
      !!document.getElementById('loginForm') ||
      /\/login\.html?$/i.test(window.location.pathname || '');
    let redirectUrl = new URL(target, window.location.href).href;
    if (onLoginPage) {
      const loginUrl = new URL('login.html', window.location.href);
      if (target) loginUrl.searchParams.set('redirect', target);
      redirectUrl = loginUrl.href;
    }

    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  }

  async function getUserInfo({ sessionId, csrfToken } = {}) {
    let accessToken = sessionId || getCookie('standard_session_id') || '';
    let csrf = csrfToken || getCookie('standard_csrf_token') || '';

    if (!accessToken || !csrf) {
      const exchanged = await exchangeOAuthSession();
      if (exchanged?.success && exchanged.session_id && exchanged.csrf_token) {
        accessToken = exchanged.session_id;
        csrf = exchanged.csrf_token;
      } else {
        return { success: false, error: exchanged?.error || 'Missing session' };
      }
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'getUserInfo',
        session_id: accessToken,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: result?.error || 'Failed to fetch user info', status: response.status };
    }
    return result;
  }

  async function exchangeOAuthSession() {
    const db = getSupabaseClientIfAvailable();
    if (!db?.auth?.getSession) return null;

    const { data } = await db.auth.getSession();
    const accessToken = data?.session?.access_token || '';
    if (!accessToken) return null;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'google_login',
        access_token: accessToken,
      }),
    });

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      const message = result?.error || payload.text || 'Failed to exchange OAuth session';
      if (response.status === 409 || /already registered/i.test(message)) {
        try {
          await db.auth.signOut();
        } catch {
          // ignore signout errors
        }
        redirectToLoginWithNotice(message, { email: result?.email, type: 'error' });
      }
      if (result?.details || payload.text) {
        console.warn('[standardAuth] exchangeOAuthSession error details:', result?.details || payload.text);
      }
      return { success: false, error: message, status: response.status };
    }

    const { session_id, csrf_token } = result || {};
    const maxAgeSeconds = 12 * 60 * 60;
    if (session_id) setCookie('standard_session_id', session_id, { maxAgeSeconds });
    if (csrf_token) setCookie('standard_csrf_token', csrf_token, { maxAgeSeconds });

    return result;
  }

  async function updateProfile({ first_name, last_name, phone, province, city, suburb } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('updateProfile', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'update_profile',
        first_name,
        last_name,
        phone,
        province,
        city,
        suburb,
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('updateProfile', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to update profile', status: response.status };
    }
    return result;
  }

  async function requestPasswordChangeOtp() {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('requestPasswordChangeOtp', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'requestPasswordChangeOtp',
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('requestPasswordChangeOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to request password change', status: response.status };
    }
    return result;
  }

  async function changePasswordWithOtp({ oldPassword, newPassword, otpCode } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('changePasswordWithOtp', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'changePassword',
        oldPassword,
        newPassword,
        otpCode,
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('changePasswordWithOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to change password', status: response.status };
    }
    return result;
  }

  async function resendPasswordChangeOtp() {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('resendPasswordChangeOtp', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'resendPasswordChangeOtp',
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('resendPasswordChangeOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to resend code', status: response.status };
    }
    return result;
  }

  async function requestEmailChange({ newEmail, currentPassword } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('requestEmailChange', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'requestEmailChange',
        newEmail,
        currentPassword,
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('requestEmailChange', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to request email change', status: response.status };
    }
    return result;
  }

  async function verifyEmailChange({ newEmail, otpCode } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('verifyEmailChange', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'verifyEmailChange',
        newEmail,
        otpCode,
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('verifyEmailChange', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to verify email change', status: response.status };
    }
    return result;
  }

  async function resendEmailChangeOtp({ newEmail } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug('resendEmailChangeOtp', `${SUPABASE_URL}/functions/v1/standard_account_update_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-access-token': accessToken,
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'resendEmailChangeOtp',
        newEmail,
      }),
    });

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('resendEmailChangeOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to resend code', status: response.status };
    }
    return result;
  }

  async function requestDeleteAccountOtp({ currentPassword } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug(
      'requestDeleteAccountOtp',
      `${SUPABASE_URL}/functions/v1/standard_account_update_info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'x-access-token': accessToken,
          'x-csrf-token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'requestDeleteAccountOtp',
          currentPassword,
        }),
      }
    );

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('requestDeleteAccountOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to request delete code', status: response.status };
    }
    return result;
  }

  async function confirmDeleteAccount({ otpCode } = {}) {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug(
      'confirmDeleteAccount',
      `${SUPABASE_URL}/functions/v1/standard_account_update_info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'x-access-token': accessToken,
          'x-csrf-token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'confirmDeleteAccount',
          otpCode,
        }),
      }
    );

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('confirmDeleteAccount', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to delete account', status: response.status };
    }
    return result;
  }

  async function resendDeleteAccountOtp() {
    const accessToken = getCookie('standard_session_id') || '';
    const csrf = getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

    const { response, error } = await fetchWithDebug(
      'resendDeleteAccountOtp',
      `${SUPABASE_URL}/functions/v1/standard_account_update_info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'x-access-token': accessToken,
          'x-csrf-token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'resendDeleteAccountOtp',
        }),
      }
    );

    if (!response) {
      return { success: false, error: 'Network error or CORS blocked request.', details: error?.message };
    }

    const payload = await readResponsePayload(response);
    const result = payload.data || {};
    if (!response.ok) {
      logFetchFailure('resendDeleteAccountOtp', response, payload);
      return { success: false, error: result?.error || payload.text || 'Failed to resend delete code', status: response.status };
    }
    return result;
  }

  async function logout({ sessionId, csrfToken } = {}) {
    const accessToken = sessionId || getCookie('standard_session_id') || '';
    const csrf = csrfToken || getCookie('standard_csrf_token') || '';

    // Always clear client cookies, even if the server call fails.
    try {
      if (!accessToken || !csrf) return { success: false, error: 'Missing session or CSRF token' };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'x-access-token': accessToken,
          'x-csrf-token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'logout',
          session_id: accessToken,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { success: false, error: result?.error || 'Logout failed', status: response.status };
      }
      return result;
    } finally {
      clearCookie('standard_session_id');
      clearCookie('standard_csrf_token');
    }
  }

  async function checkExistingSession({ redirectTo } = {}) {
    try {
      const hasCookies = !!getCookie('standard_session_id') && !!getCookie('standard_csrf_token');
      if (hasCookies) {
        const info = await getUserInfo();
        if (info?.success) {
          const target = redirectTo || document.body?.dataset?.successRedirect || 'smartphones.html';
          window.location.href = target;
          return;
        }
        clearCookie('standard_session_id');
        clearCookie('standard_csrf_token');
      }
    } catch {
      clearCookie('standard_session_id');
      clearCookie('standard_csrf_token');
      // ignore
    }

    // Fallback for OAuth (Supabase Auth session).
    const db = getSupabaseClientIfAvailable();
    if (!db?.auth?.getSession) return;
    const { data } = await db.auth.getSession();
    if (data?.session) {
      const exchanged = await exchangeOAuthSession();
      if (exchanged?.success) {
        const target = redirectTo || document.body?.dataset?.successRedirect || 'smartphones.html';
        window.location.href = target;
      }
    }
  }

  function wireForgotPasswordIfPresent() {
    const db = getSupabaseClientIfAvailable();
    if (!db?.auth?.resetPasswordForEmail) return;

    const modal = document.getElementById('forgotPasswordModal');
    const form = document.getElementById('forgotPasswordForm');
    if (!modal || !form) return;

    window.openForgotPasswordModal = function openForgotPasswordModal(event) {
      event?.preventDefault?.();
      modal.classList.add('show');
      const emailEl = document.getElementById('email');
      const resetEmailEl = document.getElementById('resetEmail');
      if (resetEmailEl && emailEl) resetEmailEl.value = emailEl.value;
    };

    window.closeForgotPasswordModal = function closeForgotPasswordModal() {
      modal.classList.remove('show');
      form.reset();
      const modalAlertBox = document.getElementById('modalAlertBox');
      if (modalAlertBox) modalAlertBox.classList.remove('show');
    };

    modal.addEventListener('click', function (e) {
      if (e.target === modal && window.closeForgotPasswordModal) window.closeForgotPasswordModal();
    });

    function showModalAlert(message, type = 'error') {
      const modalAlertBox = document.getElementById('modalAlertBox');
      const modalAlertMessage = document.getElementById('modalAlertMessage');
      if (!modalAlertBox || !modalAlertMessage) return;
      modalAlertMessage.textContent = message;
      modalAlertBox.className = `alert show alert-${type}`;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const resetBtn = document.getElementById('resetBtn');
      const resetEmail = document.getElementById('resetEmail')?.value;
      if (!resetEmail) return;

      if (resetBtn) {
        resetBtn.classList.add('loading');
        resetBtn.disabled = true;
      }

      try {
        const { error } = await db.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/reset-password.html`,
        });
        if (error) throw error;
        showModalAlert('Password reset link sent! Check your email.', 'success');
      } catch (err) {
        showModalAlert(err?.message || 'Failed to send reset link.', 'error');
      } finally {
        if (resetBtn) {
          resetBtn.classList.remove('loading');
          resetBtn.disabled = false;
        }
      }
    });
  }

  function wireIfOptedIn() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const mode = form.dataset.authMode || document.body.dataset.authMode || 'standard';
    if (mode !== 'standard') return;

    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const rememberMeEl = document.getElementById('rememberMe');
    const button =
      document.getElementById('loginBtn') ||
      document.getElementById('submit-btn') ||
      form.querySelector('button[type="submit"]');

    const notice = consumeAuthNotice();
    if (notice?.message) {
      if (notice.email && emailEl) emailEl.value = notice.email;
      showMessage(notice.message, notice.type || 'error');
    }

    const successRedirect = getRedirect({ form });
    checkExistingSession({ redirectTo: successRedirect });
    wireForgotPasswordIfPresent();

    const db = getSupabaseClientIfAvailable();
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn && db?.auth?.signInWithOAuth) {
      googleBtn.addEventListener('click', async () => {
        const originalHtml = googleBtn.dataset.originalHtml || googleBtn.innerHTML;
        googleBtn.dataset.originalHtml = originalHtml;
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<div class="spinner"></div> Signing in with Google...';
        try {
          await signInWithGoogle({ redirectTo: successRedirect, form });
        } catch (err) {
          showMessage(err?.message || 'Failed to sign in with Google. Please try again.', 'error');
          googleBtn.disabled = false;
          googleBtn.innerHTML = originalHtml;
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessage();

      setButtonLoading(button, true, 'Signing in...');
      try {
        await login({
          email: emailEl?.value,
          password: passwordEl?.value,
          rememberMe: !!rememberMeEl?.checked,
          form,
        });
      } catch (err) {
        showMessage(err?.message || 'Login failed', 'error');
        setButtonLoading(button, false);
      }
    });

    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword && passwordEl) {
      togglePassword.addEventListener('click', function () {
        const type = passwordEl.type === 'password' ? 'text' : 'password';
        passwordEl.type = type;
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && emailEl) {
      emailEl.value = emailParam;
      showMessage('Please check your email to verify your account before logging in.', 'success');
    }

    const verified = urlParams.get('verified');
    if (verified === 'true') {
      showMessage('Email verified successfully! You can now log in.', 'success');
    }

  }

  async function register({ email, password, firstName, lastName, suburb, city, province }) {
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Please fill in all required fields.');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        suburb,
        city,
        province
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Registration failed');
    }

    return result;
  }

  async function verifyOtp({ email, token, type = 'signup' }) {
    const db = getSupabaseClientIfAvailable();
    if (!db) throw new Error('Supabase client not available');

    const { data, error } = await db.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) throw error;
    return data;
  }

  window.standardAuth = {
    login,
    logout,
    register,
    verifyOtp,
    checkExistingSession,
    getUserInfo,
    updateProfile,
    requestPasswordChangeOtp,
    changePasswordWithOtp,
    resendPasswordChangeOtp,
    requestEmailChange,
    verifyEmailChange,
    resendEmailChangeOtp,
    requestDeleteAccountOtp,
    confirmDeleteAccount,
    resendDeleteAccountOtp,
    signInWithGoogle,
  };

  document.addEventListener('DOMContentLoaded', wireIfOptedIn);
})();
