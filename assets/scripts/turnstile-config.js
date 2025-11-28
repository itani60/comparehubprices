/**
 * Cloudflare Turnstile Configuration
 * Managed mode with implicit rendering - intelligent challenge display
 * Privacy-focused alternative to reCAPTCHA
 * Following official Cloudflare documentation best practices
 */

window.TURNSTILE_CONFIG = {
    // Cloudflare Turnstile site key (managed widget)
    siteKey: '0x4AAAAAAB-RvPLJrfFD-Y96',

    // Widget behaviour
    mode: 'managed',
    theme: 'light',
    size: 'normal',
    appearance: 'always',
    refresh: 'auto',
    language: 'en',
    debug: false,

    // Optional action hints for analytics
    actions: {
        login: 'login',
        businessLogin: 'business_login',
        register: 'register',
        forgotPassword: 'forgot_password'
    }
};