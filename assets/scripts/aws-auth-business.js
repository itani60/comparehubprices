// Business AWS Auth client: login → get session tokens → get user info

(function initBusinessAWSAuthService() {
  const BASE_URL = 'https://acc.comparehubprices.site';

  // API Endpoints - routes include /business/Business prefix (matching aws-auth.js pattern)
  const LOGIN_URL = `${BASE_URL}/business/business/login`;
  const REGISTER_URL = `${BASE_URL}/business/business/register`;
  const VERIFY_EMAIL_URL = `${BASE_URL}/business/business/verify-email`;
  const GET_SESSION_URL = `${BASE_URL}/business/business/session`;
  const USER_INFO_URL = `${BASE_URL}/business/business/user-info`;
  const FORGOT_PASSWORD_URL = `${BASE_URL}/business/business/forgot-password`;
  const RESET_PASSWORD_URL = `${BASE_URL}/business/business/reset-password`;
  const UPDATE_BUSINESS_INFO_URL = `${BASE_URL}/business/business/update-business-info`;
  const UPDATE_BUSINESS_PASSWORD_URL = `${BASE_URL}/business/business/update-business-password`;
  const MFA_REMOVE_URL = `${BASE_URL}/business/business/mfa/remove`;
  const MFA_SET_PRIMARY_URL = `${BASE_URL}/business/business/mfa/set-primary`;
  const EMAIL_MFA_LOGIN_SEND_URL = `${BASE_URL}/business/business/email-mfa/login-send`;
  const EMAIL_MFA_LOGIN_VERIFY_URL = `${BASE_URL}/business/business/email-mfa/login-verify`;
  const DELETE_ACCOUNT_URL = `${BASE_URL}/business/business/account/delete`;
  const LOGOUT_URL = `${BASE_URL}/business/business/logout`;

  class BusinessAWSAuthService {
    constructor() {
      // In-memory only; do not persist sensitive data client-side
      this._profile = null;
      this._sessionId = null;
      this._idToken = null;
      this._accessToken = null;
    }

    async login(email, password, turnstileToken = null, mfaCode = null, session = null) {
      const body = { email, password };
      if (turnstileToken) {
        body.turnstileToken = turnstileToken;
      }
      if (mfaCode && session) {
        body.mfaCode = mfaCode;
        body.session = session;
      }
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Required for HttpOnly cookies
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      
      // Check if MFA is required (this is a successful response indicating MFA is needed)
      // TOTP MFA returns session, Email MFA returns tokens
      if (data?.requiresMfa && (data?.session || data?.tokens)) {
        return {
          success: true,
          requiresMfa: true,
          message: data.message || 'Please enter the code from your authenticator app.',
          session: data.session || null,
          challengeName: data.challengeName,
          tokens: data.tokens || null, // For email MFA flow
          emailMfaEnabled: data.emailMfaEnabled || false,
          primaryMfa: data.primaryMfa || null
        };
      }
      
      if (!res.ok || !data?.success) {
        // Handle suspended account
        if (data?.error === 'ACCOUNT_SUSPENDED') {
          const error = new Error(data.message || 'Your account has been suspended.');
          error.status = res.status;
          error.error = 'ACCOUNT_SUSPENDED';
          error.suspended = true;
          error.suspensionReason = data.suspensionReason;
          error.requiresTurnstile = data?.requiresTurnstile || false;
          throw error;
        }
        // Handle deleted account
        if (data?.error === 'ACCOUNT_DELETED') {
          const error = new Error(data.message || 'This account has been deleted and is no longer accessible.');
          error.status = res.status;
          error.error = 'ACCOUNT_DELETED';
          error.deleted = true;
          error.requiresTurnstile = data?.requiresTurnstile || false;
          throw error;
        }
        const message = data?.message || `Business login failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        error.requiresTurnstile = data?.requiresTurnstile || false;
        throw error;
      }

      // HttpOnly cookie is set by server - JavaScript CANNOT access it (secure!)
      // No sessionId in response body - it's only in the HttpOnly cookie
      this._sessionId = null; // Not accessible to JavaScript - secure!
      if (data.user) this._profile = data.user;
      return { success: true, user: data.user || null };
    }

    async getSessionTokens() {
      const res = await fetch(GET_SESSION_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data?.success) {
        const message = data?.message || `Get session failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      
      return { success: true, tokens: data.tokens || null, user: data.user || null };
    }

    async getUserInfo() {
      const res = await fetch(USER_INFO_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      // Not authenticated (no cookie) → normal state when user hasn't logged in
      if (res.status === 401 || data?.error === 'NO_SESSION' || data?.unauthenticated) {
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
        console.error('Business getUserInfo error:', errorDetails);
        if (data?.debug) {
          console.error('Cookie debug details:', {
            cookieHeaderPresent: data.debug.cookieHeaderPresent,
            cookieHeaderLength: data.debug.cookieHeaderLength,
            parsedCookieKeys: data.debug.parsedCookieKeys,
            allHeaderKeys: data.debug.allHeaderKeys,
          });
        }
        const error = new Error(data?.message || data?.error || `Get business user info failed (HTTP ${res.status})`);
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

    setSessionId(sessionId) { 
      this._sessionId = sessionId || null; 
    }

    getSessionId() {
      return this._sessionId || null;
    }

    async forgotPassword(email, turnstileToken = null) {
      const body = { email };
      if (turnstileToken) {
        body.turnstileToken = turnstileToken;
      }
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Business forgot password failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      return (data && typeof data === 'object') ? data : { success: true };
    }

    async resendForgotPasswordOTP(email) {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const error = new Error(data?.message || `Resend forgot password OTP failed (HTTP ${res.status})`);
        if (data?.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }
      return (data && typeof data === 'object') ? data : { success: true };
    }

    async resetPassword(email, otp, newPassword) {
      const payload = {
        email,
        otp,
        code: otp,
        verificationCode: otp,
        newPassword,
        new_password: newPassword
      };
      const res = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || `Business reset password failed (HTTP ${res.status})`;
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
        const message = data?.message || `Business register failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      return data;
    }

    async verifyEmail(email, otp) {
      try {
        const res = await fetch(VERIFY_EMAIL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, code: otp })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          const message = data?.message || 'Verification failed. Please check your code and try again.';
          const error = new Error(message);
          error.status = res.status;
          error.response = data;
          // Don't expose URL in error - just throw with user-friendly message
          throw error;
        }
        // allow server to return sessionId directly
        if (data.sessionId) this._sessionId = data.sessionId;
        return data;
      } catch (error) {
        // If it's already our custom error, re-throw it
        if (error.message && error.status !== undefined) {
          throw error;
        }
        // For network/fetch errors, throw a generic message without exposing URL
        throw new Error('Verification failed. Please check your code and try again.');
      }
    }

    async resendVerification(email) {
      try {
        const res = await fetch(REGISTER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resend: true })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          const message = data?.message || 'Failed to resend verification code. Please try again.';
          const error = new Error(message);
          error.status = res.status;
          error.response = data;
          // Include retryAfter for rate limiting
          if (data?.retryAfter) {
            error.retryAfter = data.retryAfter;
          }
          // Don't expose URL in error - just throw with user-friendly message
          throw error;
        }
        return data;
      } catch (error) {
        // If it's already our custom error, re-throw it
        if (error.message && error.status !== undefined) {
          throw error;
        }
        // For network/fetch errors, throw a generic message without exposing URL
        throw new Error('Failed to resend verification code. Please try again.');
      }
    }

    async updateBusinessInfo(businessData) {
      const res = await fetch(UPDATE_BUSINESS_INFO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(businessData),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Update business info failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      if (data.user) this._profile = data.user;
      return { success: true, user: data.user };
    }


    async updatePassword(action, payload) {
      const body = {
        action,
        ...payload
      };
      const res = await fetch(UPDATE_BUSINESS_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Update password failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      return data;
    }

    async resendPasswordUpdateOTP() {
      const res = await fetch(UPDATE_BUSINESS_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resend: true }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Resend password update OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        if (data.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }

      return data;
    }

    async removeMFA(mfaType) {
      const res = await fetch(MFA_REMOVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfaType }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Remove MFA failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      return data;
    }

    async setPrimaryMFA(mfaType) {
      const res = await fetch(MFA_SET_PRIMARY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfaType }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Set primary MFA failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      return data;
    }

    async sendEmailMFALoginOTP(email, tokens, resend = false, session = null) {
      const body = { email };
      if (tokens) {
        body.tokens = tokens;
      }
      if (resend) {
        body.resend = true;
        if (session) {
          body.session = session;
        }
      }
      
      const res = await fetch(EMAIL_MFA_LOGIN_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Send email MFA login OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        error.retryAfter = data?.retryAfter;
        throw error;
      }

      return {
        success: true,
        requiresMfa: data.requiresMfa || true,
        message: data.message,
        session: data.session,
        challengeName: data.challengeName || 'EMAIL_MFA',
        expiresIn: data.expiresIn
      };
    }

    async verifyEmailMFALoginOTP(email, otp, session) {
      if (!email || !otp || !session) {
        throw new Error('Email, OTP, and session are required for email MFA verification.');
      }

      const res = await fetch(EMAIL_MFA_LOGIN_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, session }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Verify email MFA login OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        throw error;
      }

      // Return tokens for completing login
      return {
        success: true,
        tokens: data.tokens,
        emailMfaVerified: data.emailMfaVerified || true,
        message: data.message
      };
    }

    async deleteAccount(action, data = {}) {
      const body = { action, ...data };
      const res = await fetch(DELETE_ACCOUNT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok || responseData?.success === false) {
        const message = responseData?.message || `Delete account failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = responseData;
        throw error;
      }

      return responseData;
    }

    async resendDeleteAccountOTP() {
      const res = await fetch(DELETE_ACCOUNT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'request_delete',
          resend: true 
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        const message = data?.message || `Resend delete account OTP failed (HTTP ${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        error.response = data;
        if (data.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }

      return data;
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
  }

  // Expose singleton
  window.businessAWSAuthService = window.businessAWSAuthService || new BusinessAWSAuthService();
  window.BusinessAWSAuthService = BusinessAWSAuthService;
})();

