/**
 * Cloudflare Turnstile Manager for SPA
 * Handles widget rendering, token management, and lifecycle for single-page applications
 */

(function initTurnstileManager() {
  'use strict';

  const CONFIG = window.TURNSTILE_CONFIG || {};
  const DEFAULT_SITE_KEY = CONFIG.siteKey || '0x4AAAAAAB-RvPLJrfFD-Y96';
  const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cfTurnstileOnload';

  class TurnstileManager {
    constructor() {
      this.widgets = new Map();
      this.tokens = new Map();
      this.waiters = [];
      this.pendingRenders = [];
      this.turnstileReady = false;
      this.scriptRequested = false;
      this.loadError = null;

      // Bind methods
      this.render = this.render.bind(this);
      this.remove = this.remove.bind(this);
      this.reset = this.reset.bind(this);
      this.getToken = this.getToken.bind(this);
      this.handleScriptLoaded = this.handleScriptLoaded.bind(this);

      // Cloudflare will call this callback when the script is ready
      const globalCallbackName = '__cfTurnstileOnload';
      if (!window[globalCallbackName]) {
        window[globalCallbackName] = this.handleScriptLoaded;
      }
    }

    async loadScript() {
      if (this.turnstileReady) {
        return;
      }
      if (this.loadError) {
        throw this.loadError;
      }

      if (!this.scriptRequested) {
        this.scriptRequested = true;

        let script = document.querySelector('script[data-turnstile-script]');
        if (!script) {
          script = document.createElement('script');
          script.dataset.turnstileScript = 'true';
          document.head.appendChild(script);
        }

        // Cloudflare warns: remove async/defer when using turnstile.ready/onload
        script.removeAttribute('async');
        script.removeAttribute('defer');
        script.async = false;
        script.defer = false;

        script.onerror = (error) => {
          this.loadError = new Error('Unable to load Cloudflare Turnstile script. Please verify network connectivity.');
          // Silently fail - don't log errors to console
          // console.error(this.loadError, error);
          this.rejectWaiters(this.loadError);
        };

        // Reassign src every time to ensure reload when key changes
        script.src = SCRIPT_URL;
      }

      return this.waitUntilReady();
    }

    waitUntilReady() {
      if (this.turnstileReady) {
        return Promise.resolve();
      }
      if (this.loadError) {
        return Promise.reject(this.loadError);
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this.turnstileReady) {
            resolve();
            return;
          }
          const error = new Error('Turnstile API did not become ready in time. Please verify your site key and domain settings.');
          console.error(error);
          this.loadError = error;
          reject(error);
        }, 12000);

        this.waiters.push({
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          }
        });
      });
    }

    handleScriptLoaded() {
      if (!window.turnstile || typeof window.turnstile.ready !== 'function') {
        const error = new Error('Cloudflare Turnstile script loaded but the API is unavailable.');
        this.loadError = error;
        this.rejectWaiters(error);
        return;
      }

      window.turnstile.ready(() => {
        this.turnstileReady = true;
        this.resolveWaiters();
        if (this.pendingRenders.length) {
          const tasks = [...this.pendingRenders];
          this.pendingRenders.length = 0;
          tasks.forEach((task) => task());
        }
      });
    }

    resolveWaiters() {
      if (!this.waiters.length) {
        return;
      }
      const waiters = [...this.waiters];
      this.waiters.length = 0;
      waiters.forEach((waiter) => {
        try {
          waiter.resolve();
        } catch (err) {
          console.error(err);
        }
      });
    }

    rejectWaiters(error) {
      if (!this.waiters.length) {
        return;
      }
      const waiters = [...this.waiters];
      this.waiters.length = 0;
      waiters.forEach((waiter) => {
        try {
          waiter.reject(error);
        } catch (err) {
          console.error(err);
        }
      });
    }

    async render(container, config = {}) {
      try {
        await this.loadScript();
      } catch (error) {
        // Fail silently - allow login to proceed without Turnstile
        // console.error('Turnstile did not initialise correctly:', error);
        throw error;
      }

      if (!this.turnstileReady) {
        return new Promise((resolve, reject) => {
          const task = () => {
            try {
              resolve(this.performRender(container, config));
            } catch (error) {
              reject(error);
            }
          };
          this.pendingRenders.push(task);
        });
      }

      return this.performRender(container, config);
    }

    performRender(container, config) {
      const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      if (!containerEl) {
        throw new Error(`Turnstile container not found: ${container}`);
      }

      let containerId = containerEl.id;
      if (!containerId) {
        containerId = `turnstile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        containerEl.id = containerId;
      }

      if (this.widgets.has(containerId)) {
        this.remove(containerId);
      }

      const sitekey = config.sitekey || CONFIG.siteKey || DEFAULT_SITE_KEY;
      if (!sitekey) {
        throw new Error('Turnstile site key is not configured.');
      }

      const widgetConfig = {
        sitekey,
        theme: config.theme || CONFIG.theme || 'light',
        size: config.size || CONFIG.size || 'normal',
        appearance: config.appearance || CONFIG.appearance || 'always',
        action: config.action || undefined,
        cdata: config.cdata || undefined,
        callback: (token) => {
          this.tokens.set(containerId, token);
          if (typeof config.callback === 'function') {
            config.callback(token);
          }
        },
        'error-callback': (errorCode) => {
          this.tokens.delete(containerId);
          if (typeof config.errorCallback === 'function') {
            config.errorCallback(errorCode);
          } else {
            // Silently handle Turnstile errors
            // console.error('Turnstile error:', errorCode);
          }
        },
        'expired-callback': () => {
          this.tokens.delete(containerId);
          if (typeof config.expiredCallback === 'function') {
            config.expiredCallback();
          } else {
            console.warn('Turnstile token expired');
          }
        }
      };

      if (config.execute) {
        widgetConfig.execution = config.execute;
      }
      if (config.refresh) {
        widgetConfig.refresh = config.refresh;
      }

      try {
        const widgetId = window.turnstile.render(containerEl, widgetConfig);
        this.widgets.set(containerId, widgetId);
        return widgetId;
      } catch (error) {
        // Silently fail - Turnstile is optional
        // console.error('Failed to render Turnstile widget:', error);
        throw error;
      }
    }

    getToken(containerId) {
      return this.tokens.get(containerId) || null;
    }

    reset(containerId) {
      const widgetId = this.widgets.get(containerId);
      if (widgetId && window.turnstile) {
        window.turnstile.reset(widgetId);
        this.tokens.delete(containerId);
      }
    }

    remove(containerId) {
      const widgetId = this.widgets.get(containerId);
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
      this.widgets.delete(containerId);
      this.tokens.delete(containerId);
    }

    isExpired(containerId) {
      const widgetId = this.widgets.get(containerId);
      if (widgetId && window.turnstile) {
        try {
          return window.turnstile.isExpired(widgetId);
        } catch (error) {
          console.error(error);
        }
      }
      return true;
    }

    getResponse(containerId) {
      const widgetId = this.widgets.get(containerId);
      if (widgetId && window.turnstile) {
        try {
          return window.turnstile.getResponse(widgetId);
        } catch (error) {
          console.error(error);
        }
      }
      return null;
    }

    execute(containerId) {
      const widgetId = this.widgets.get(containerId);
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.execute(widgetId);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }

  window.turnstileManager = new TurnstileManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.turnstileManager.loadScript().catch((error) => {
        // Silently fail - Turnstile is optional
        // console.error('Failed to load Turnstile:', error);
      });
    });
  } else {
    window.turnstileManager.loadScript().catch((error) => {
      // Silently fail - Turnstile is optional
      // console.error('Failed to load Turnstile:', error);
    });
  }
})();

