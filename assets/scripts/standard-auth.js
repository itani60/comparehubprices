(() => {
  'use strict';

  const SUPABASE_URL = 'https://gttsyowogmdzwqitaskr.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN5b3dvZ21kendxaXRhc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY2NzQsImV4cCI6MjA4NDQ1MjY3NH0.p3QDWmk2LgkGE082CJWkIthSeerYFhajHxiQFqklaZk';

  function getCookie(name) {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return '';
    } catch {
      return '';
    }
  }

  function setCookie(name, value, { maxAgeSeconds } = {}) {
    const parts = [`${name}=${value}`, 'path=/', 'SameSite=Lax'];
    if (typeof maxAgeSeconds === 'number') parts.push(`max-age=${maxAgeSeconds}`);
    if (location.protocol === 'https:') parts.push('Secure');
    document.cookie = parts.join('; ');
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

  function hideMessage() {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) alertBox.classList.remove('show');
    const loginAlert = document.getElementById('loginAlert') || document.getElementById('login-alert');
    if (loginAlert) loginAlert.classList.remove('show', 'error', 'success');
  }

  function getSupabaseClientIfAvailable() {
    try {
      if (!window.supabase?.createClient) return null;
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Login failed');
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
    const redirectUrl = new URL(target, window.location.href).href;

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
    const accessToken = sessionId || getCookie('standard_session_id') || '';
    const csrf = csrfToken || getCookie('standard_csrf_token') || '';

    if (!accessToken) return { success: false, error: 'Missing session' };
    if (!csrf) return { success: false, error: 'Missing CSRF token' };

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
      }
    } catch {
      // ignore
    }

    // Fallback for OAuth (Supabase Auth session).
    const db = getSupabaseClientIfAvailable();
    if (!db?.auth?.getSession) return;
    const { data } = await db.auth.getSession();
    if (data?.session) {
      const target = redirectTo || document.body?.dataset?.successRedirect || 'smartphones.html';
      window.location.href = target;
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

    const mode = form.dataset.authMode || document.body.dataset.authMode;
    if (mode !== 'standard') return;

    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const rememberMeEl = document.getElementById('rememberMe');
    const button =
      document.getElementById('loginBtn') ||
      document.getElementById('submit-btn') ||
      form.querySelector('button[type="submit"]');

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
          const redirectUrl = new URL(successRedirect, window.location.href).href;
          const { error } = await db.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              queryParams: { access_type: 'offline', prompt: 'consent' },
            },
          });
          if (error) throw error;
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

    const response = await fetch(`${SUPABASE_URL}/functions/v1/standard_account_registaration`, {
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

  window.standardAuth = { login, logout, register, verifyOtp, checkExistingSession, getUserInfo, signInWithGoogle };

  document.addEventListener('DOMContentLoaded', wireIfOptedIn);
})();
