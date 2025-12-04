// Minimal AWS Auth client for testing: login → get session tokens → get user info

(function initAWSAuthService() {
  const LOGIN_URL = 'https://acc.comparehubprices.site/acc/auth/login';
  const GET_SESSION_URL = 'https://acc.comparehubprices.site/acc/auth/get-session';
  const USER_INFO_URL = 'https://acc.comparehubprices.site/acc/auth/get-user-info';
  const UPDATE_USER_URL = 'https://acc.comparehubprices.site/acc/auth/update-user-info';
  const UPDATE_PASSWORD_URL = 'https://acc.comparehubprices.site/acc/auth/update-password';
  const DELETE_ACCOUNT_URL = 'https://acc.comparehubprices.site/acc/auth/delete-account';
  const FORGOT_PASSWORD_URL = 'https://acc.comparehubprices.site/acc/auth/forgot-password';
  const RESET_PASSWORD_URL = 'https://acc.comparehubprices.site/acc/auth/reset-password';
  const REGISTER_URL = 'https://acc.comparehubprices.site/acc/auth/register';
  const VERIFY_EMAIL_URL = 'https://acc.comparehubprices.site/acc/auth/verify-email';
  const LOGOUT_URL = 'https://acc.comparehubprices.site/acc/auth/logout';
  const GOOGLE_INIT_URL = 'https://acc.comparehubprices.site/acc/auth/google';
  const GOOGLE_CALLBACK_URL = 'https://acc.comparehubprices.site/acc/auth/google/callback';
  const GOOGLE_ONE_TAP_LOGIN_URL = 'https://acc.comparehubprices.site/acc/auth/google/callback';

  class AWSAuthService {
    constructor() {
      // In-memory only; do not persist sensitive data client-side
      this._profile = null;
      this._sessionId = null;
      this._idToken = null;
      this._accessToken = null;
    }

    async login(email, password, turnstileToken = null) {
      const body = { email, password };
      if (turnstileToken) {
        body.turnstileToken = turnstileToken;
      }
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Required for HttpOnly cookies
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        // Handle suspended account
        if (data?.error === 'ACCOUNT_SUSPENDED') {
          const error = new Error(data.message || 'Your account has been suspended.');
          error.status = res.status;
          error.error = 'ACCOUNT_SUSPENDED';
          error.suspended = true;
          error.suspensionReason = data.suspensionReason;
          throw error;
        }
        // Handle deleted account
        if (data?.error === 'ACCOUNT_DELETED') {
          const error = new Error(data.message || 'This account has been deleted and is no longer accessible.');
          error.status = res.status;
          error.error = 'ACCOUNT_DELETED';
          error.deleted = true;
          throw error;
        }
        const message = data?.message || `Login failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      // HttpOnly cookie is set by server - JavaScript CANNOT access it (secure!)
      // No sessionId in response body - it's only in the HttpOnly cookie
      this._sessionId = null; // Not accessible to JavaScript - secure!
      if (data.user) this._profile = data.user;
      return { success: true, user: data.user || null };
    }

    async getSessionTokens() { return { success: true }; }

    async getUserInfo() {
      const res = await fetch(USER_INFO_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      // Not authenticated (no cookie) → normal state when user hasn’t logged in
      if (res.status === 401 || data?.error === 'NO_SESSION') {
        return {
          success: false,
          status: res.status,
          error: data?.error || 'NO_SESSION',
          message: data?.message || 'Not authenticated',
          user: null,
        };
      }

      if (!res.ok || data?.success === false) {
        const errorDetails = {
          status: res.status,
          error: data?.error,
          message: data?.message,
          debug: data?.debug,
          response: data,
        };
        
        // Check if this is an expected session error (common when checking regular auth for business users)
        const isExpectedSessionError = data?.error === 'INVALID_SESSION' ||
                                      data?.error === 'SESSION_EXPIRED' ||
                                      data?.error === 'NO_SESSION' ||
                                      data?.error === 'SESSION_NOT_FOUND' ||
                                      data?.unauthenticated === true ||
                                      (data?.message && (
                                        data.message.includes('Session expired') ||
                                        data.message.includes('Session not found') ||
                                        data.message.includes('Not authenticated')
                                      ));
        
        // Only log unexpected errors to console
        if (!isExpectedSessionError) {
          console.error('getUserInfo error:', errorDetails);
          if (data?.debug) {
            console.error('Cookie debug details:', {
              cookieHeaderPresent: data.debug.cookieHeaderPresent,
              cookieHeaderLength: data.debug.cookieHeaderLength,
              parsedCookieKeys: data.debug.parsedCookieKeys,
              allHeaderKeys: data.debug.allHeaderKeys,
            });
          }
        }
        
        const error = new Error(data?.message || data?.error || `Get user info failed (HTTP ${res.status})`);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      if (data.user) this._profile = data.user;
      return { success: true, user: data.user };
    }

    clear() {
      this._profile = null;
      this._sessionId = null;
      this._idToken = null;
      this._accessToken = null;
      // no client storage
    }

    getIdToken() {
      return this._idToken || null;
    }

    setSessionId(sessionId) { this._sessionId = sessionId || null; }

    getSessionId() {
      return this._sessionId || null;
    }

    async logout() {
      // HttpOnly cookie is automatically sent by browser
      try {
        await fetch(LOGOUT_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Required for HttpOnly cookies
        });
      } catch (_) {
        // Network/logical failures shouldn't block client-side sign-out
      } finally {
        this.clear();
      }
      return { success: true };
    }

    async forgotPassword(email) {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Forgot password failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      return (data && typeof data === 'object') ? data : { success: true };
    }

    async resendForgotCode(email) {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Resend code failed (HTTP ${res.status})`;
        const error = new Error(message);
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      return (data && typeof data === 'object') ? data : { success: true };
    }

    async resetPassword(email, code, newPassword) {
      const payload = {
        email,
        code,
        verificationCode: code,
        otp: code,
        newPassword,
        new_password: newPassword
      };
      let res = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        // Fallback to PUT if API expects it
        res = await fetch(RESET_PASSWORD_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json().catch(() => ({}));
      }
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Reset password failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      return { success: true };
    }

    // Registration and email verification
    async registerUser(payload) {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Register failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      return data;
    }

    async verifyEmail(email, code) {
      const res = await fetch(VERIFY_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Verify email failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      // allow server to return sessionId directly
      if (data.sessionId) this._sessionId = data.sessionId;
      return data;
    }

    async resendVerification(email) {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Resend verification failed (HTTP ${res.status})`;
        const error = new Error(message);
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      return data;
    }

    async updateUserInfo(payload) {
      const res = await fetch(UPDATE_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.status === 401) {
        const errorMsg = data?.message || data?.error || 'Not authenticated';
        console.error('Authentication failed. Please login again.');
        console.error('Response:', data);
        throw new Error(errorMsg);
      }
      
      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Update user info failed (HTTP ${res.status})`;
        const error = new Error(message);
        // Include retryAfter for rate limiting (e.g., email change resend)
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      
      if (data.user) this._profile = data.user;
      return data;
    }

    async updatePassword(action, payload) {
      const res = await fetch(UPDATE_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...payload })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Password update failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      
      return data;
    }

    async resendPasswordOTP(email) {
      const res = await fetch(UPDATE_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'request_password_change',
          resend: true
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Resend OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        // Include retryAfter for rate limiting
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      
      return data;
    }

    async deleteAccount(action, payload) {
      const res = await fetch(DELETE_ACCOUNT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...payload })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Delete account failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      
      return data;
    }

    async resendDeleteOTP() {
      const res = await fetch(DELETE_ACCOUNT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'request_delete',
          resend: true
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Resend delete OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        // Include retryAfter for rate limiting
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      
      return data;
    }

    async loginWithGoogleCredential(credential) {
      const res = await fetch(GOOGLE_ONE_TAP_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Google One Tap login failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      if (data.user) this._profile = data.user;
      return data;
    }

    initGoogleSignIn() {
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      try {
        sessionStorage.setItem('oauth_state', state);
      } catch (e) {
        console.error('Failed to store OAuth state:', e);
      }
      window.location.href = `${GOOGLE_INIT_URL}?state=${encodeURIComponent(state)}`;
    }

    async handleGoogleCallback(code, state) {
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter. Please try again.');
      }
      
      try {
        sessionStorage.removeItem('oauth_state');
      } catch (e) {
        console.error('Failed to remove OAuth state:', e);
      }

      const res = await fetch(GOOGLE_CALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, state })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || data?.error || `Google sign-in failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      if (data.user) this._profile = data.user;
      return { success: true, user: data.user || null };
    }
  }

  // Expose singleton
  window.awsAuthService = window.awsAuthService || new AWSAuthService();
  window.AWSAuthService = AWSAuthService;
})();



