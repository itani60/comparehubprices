(function(){
  function initTabsAndModals(){
    var userTab = document.getElementById('tlfUserTab');
    var businessTab = document.getElementById('tlfBusinessTab');
    var userForm = document.getElementById('tlfUserForm');
    var businessForm = document.getElementById('tlfBusinessForm');


    function activate(tab){
      if(tab === 'user'){
        if(userTab) userTab.classList.add('active');
        if(businessTab) businessTab.classList.remove('active');
        if(userForm) userForm.style.display = 'block';
        if(businessForm) businessForm.style.display = 'none';
        // Show user Turnstile widget, hide business widget
        var userContainer = document.getElementById('login-turnstile-container');
        var businessContainer = document.getElementById('business-login-turnstile-container');
        if(userContainer) userContainer.style.display = 'flex';
        if(businessContainer) businessContainer.style.display = 'none';
      } else {
        if(businessTab) businessTab.classList.add('active');
        if(userTab) userTab.classList.remove('active');
        if(businessForm) businessForm.style.display = 'block';
        if(userForm) userForm.style.display = 'none';
        // Show business Turnstile widget, hide user widget
        var businessContainer = document.getElementById('business-login-turnstile-container');
        var userContainer = document.getElementById('login-turnstile-container');
        if(businessContainer) businessContainer.style.display = 'flex';
        if(userContainer) userContainer.style.display = 'none';
      }
    }

    if(userTab) userTab.addEventListener('click', function(e){ e.preventDefault(); activate('user'); });
    if(businessTab) businessTab.addEventListener('click', function(e){ e.preventDefault(); activate('business'); });

    var userForgot = document.getElementById('tlfUserForgot');
    var bizForgot = document.getElementById('tlfBusinessForgot');
    if (userForgot) {
      userForgot.addEventListener('click', function(e){
        e.preventDefault();
        var modalEl = document.getElementById('tlfForgotPasswordModal');
        if (modalEl && window.bootstrap && window.bootstrap.Modal) {
          var modal = new bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }
    if (bizForgot) {
      bizForgot.addEventListener('click', function(e){
        e.preventDefault();
        var modalEl = document.getElementById('tlfBusinessForgotPasswordModal');
        if (modalEl && window.bootstrap && window.bootstrap.Modal) {
          var modal = new bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTabsAndModals);
  } else {
    initTabsAndModals();
  }
})();

(function(){
  var GOOGLE_CLIENT_ID = '921064121179-1nco9up7a0b2p399sr2eo9m3lepncpb6.apps.googleusercontent.com';
  var googleOneTapInitialized = false;

  function bindEyeToggle(btnId, inputId){
    var btn = document.getElementById(btnId);
    var input = document.getElementById(inputId);
    if(!btn || !input) return;
    btn.addEventListener('click', function(){
      var isPwd = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPwd ? 'text' : 'password');
      var icon = btn.querySelector('i');
      if(icon){ icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }
    });
  }

  function initEyeToggles(){
    bindEyeToggle('tlfUserPasswordToggle', 'tlfUserPassword');
    bindEyeToggle('tlfBusinessPasswordToggle', 'tlfBusinessPassword');
  }

  function bindLoginSubmit(){
    var form = document.getElementById('tlfUserForm');
    if(!form) return;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var emailEl = document.getElementById('tlfUserEmail');
      var passEl = document.getElementById('tlfUserPassword');
      if(!emailEl || !passEl) return;
      var btn = document.getElementById('tlfUserSubmit');
      
      // Get Turnstile token
      var turnstileToken = null;
      if(window.turnstileManager) {
        turnstileToken = window.turnstileManager.getToken('login-turnstile-container');
        if(!turnstileToken) {
          if(typeof showWarningToast === 'function') {
            showWarningToast('Please complete the security verification.');
          } else {
            alert('Please complete the security verification.');
          }
          if(window.turnstileManager) {
            window.turnstileManager.reset('login-turnstile-container');
          }
          return;
        }
      }
      
      try {
        if(btn){ btn.disabled = true; btn.classList.add('loading'); }
        
        // Ensure we're using regular auth service (not business)
        var svc = window.awsAuthService;
        if(!svc) {
          throw new Error('Regular authentication service not available. Please ensure aws-auth.js is loaded.');
        }
        
        await svc.login(emailEl.value.trim(), passEl.value, turnstileToken);
        
        // Call getUserInfo to verify session (using regular auth service, not business)
        try { 
          await svc.getUserInfo(); 
        } catch(getUserInfoErr) {
          // Silently ignore getUserInfo errors - session might not be ready yet
          // Only log if it's not a session error
          if(getUserInfoErr && getUserInfoErr.message && 
             !getUserInfoErr.message.includes('Session') && 
             !getUserInfoErr.message.includes('Not authenticated')) {
            console.warn('getUserInfo call after login failed:', getUserInfoErr);
          }
        }
        // Prefer redirecting back to the page user came from
        var returnTo = null;
        try { returnTo = sessionStorage.getItem('chp_return_to'); } catch(_) {}
        if (returnTo) {
          try { sessionStorage.removeItem('chp_return_to'); } catch(_) {}
          window.location.href = returnTo; return;
        }
        // Default fallback
        window.location.href = 'test.html';
      } catch(err){
        console.error('Login flow error:', err);
        // Reset Turnstile widget on error
        if(window.turnstileManager) {
          window.turnstileManager.reset('login-turnstile-container');
        }
        
        // Handle suspended account
        if(err && err.error === 'ACCOUNT_SUSPENDED') {
          var suspensionMessage = err.message || 'Your account has been suspended.';
          if(err.suspensionReason) {
            suspensionMessage += ' Reason: ' + err.suspensionReason;
          }
          suspensionMessage += ' Please contact support at support@comparehubprices.site to appeal this decision.';
          if(typeof showErrorToast === 'function') {
            showErrorToast(suspensionMessage, 'Account Suspended');
          } else {
            alert(suspensionMessage);
          }
          if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
          return;
        }
        
        // Handle deleted account
        if(err && err.error === 'ACCOUNT_DELETED') {
          var deletedMessage = err.message || 'This account has been deleted and is no longer accessible.';
          if(typeof showErrorToast === 'function') {
            showErrorToast(deletedMessage, 'Account Deleted');
          } else {
            alert(deletedMessage);
          }
          if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
          return;
        }
        
        // Show error message with toast notification
        var errorMessage = 'Login failed. ';
        if(err && err.message) {
          if(err.message.includes('Incorrect') || err.message.includes('password') || err.message.includes('email')) {
            errorMessage = 'Login failed. Incorrect email or password. Please try again.';
          } else {
            errorMessage += err.message;
          }
        } else {
          errorMessage += 'Please check your credentials and try again.';
        }
        
        if(typeof showErrorToast === 'function') {
          showErrorToast(errorMessage);
        } else {
          alert(errorMessage);
        }
      } finally {
        if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
      }
    });
  }

  function bindBusinessLoginSubmit(){
    var form = document.getElementById('tlfBusinessForm');
    if(!form) return;
    
    var mfaSession = null; // Store MFA session token (for TOTP)
    var emailMfaSession = null; // Store email MFA session token
    var emailMfaTokens = null; // Store tokens for email MFA flow
    var currentMfaMethod = null; // 'email' or 'totp'
    var hasEmailMfa = false;
    var hasTotpMfa = false;
    var resendTimer = null;
    var resendCooldown = 60; // seconds
    
    // Get UI elements
    var emailMfaCodeEl = document.getElementById('tlfBusinessEmailMfaCode');
    var mfaCodeEl = document.getElementById('tlfBusinessMfaCode');
    var mfaField = document.getElementById('tlfBusinessMfaField');
    var emailMfaSection = document.getElementById('tlfBusinessEmailMfaSection');
    var totpMfaSection = document.getElementById('tlfBusinessTotpMfaSection');
    var mfaMethodSwitcher = document.getElementById('tlfBusinessMfaMethodSwitcher');
    var switchEmailBtn = document.getElementById('tlfBusinessMfaSwitchEmail');
    var switchTotpBtn = document.getElementById('tlfBusinessMfaSwitchTOTP');
    var resendEmailOtpBtn = document.getElementById('tlfBusinessResendEmailOtp');
    var resendTimerEl = document.getElementById('tlfBusinessResendTimer');
    
    // Add input validation for MFA codes (only numbers)
    function setupMfaInputValidation(inputEl) {
      if(!inputEl) return;
      inputEl.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
      inputEl.addEventListener('paste', function(e) {
        e.preventDefault();
        var pastedText = (e.clipboardData || window.clipboardData).getData('text');
        var numbersOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 6);
        e.target.value = numbersOnly;
      });
    }
    
    setupMfaInputValidation(emailMfaCodeEl);
    setupMfaInputValidation(mfaCodeEl);
    
    // Resend timer function
    function startResendTimer(seconds) {
      if(resendTimer) clearInterval(resendTimer);
      if(!resendTimerEl || !resendEmailOtpBtn) return;
      
      resendEmailOtpBtn.disabled = true;
      resendTimerEl.style.display = 'inline';
      
      var remaining = seconds;
      resendTimerEl.textContent = 'Resend available in ' + remaining + 's';
      
      resendTimer = setInterval(function() {
        remaining--;
        if(remaining <= 0) {
          clearInterval(resendTimer);
          resendTimer = null;
          resendEmailOtpBtn.disabled = false;
          resendTimerEl.style.display = 'none';
        } else {
          resendTimerEl.textContent = 'Resend available in ' + remaining + 's';
        }
      }, 1000);
    }
    
    // Switch MFA method
    function switchMfaMethod(method) {
      if(method === 'email') {
        currentMfaMethod = 'email';
        if(emailMfaSection) emailMfaSection.style.display = 'block';
        if(totpMfaSection) totpMfaSection.style.display = 'none';
        if(switchEmailBtn) switchEmailBtn.classList.add('active');
        if(switchTotpBtn) switchTotpBtn.classList.remove('active');
        if(emailMfaCodeEl) {
          emailMfaCodeEl.value = '';
          setTimeout(function() { emailMfaCodeEl.focus(); }, 100);
        }
      } else if(method === 'totp') {
        currentMfaMethod = 'totp';
        if(emailMfaSection) emailMfaSection.style.display = 'none';
        if(totpMfaSection) totpMfaSection.style.display = 'block';
        if(switchEmailBtn) switchEmailBtn.classList.remove('active');
        if(switchTotpBtn) switchTotpBtn.classList.add('active');
        if(mfaCodeEl) {
          mfaCodeEl.value = '';
          setTimeout(function() { mfaCodeEl.focus(); }, 100);
        }
      }
    }
    
    // Setup method switcher buttons
    if(switchEmailBtn) {
      switchEmailBtn.addEventListener('click', function() {
        switchMfaMethod('email');
      });
    }
    if(switchTotpBtn) {
      switchTotpBtn.addEventListener('click', function() {
        switchMfaMethod('totp');
      });
    }
    
    // Setup resend email OTP button
    if(resendEmailOtpBtn) {
      resendEmailOtpBtn.addEventListener('click', async function() {
        var emailEl = document.getElementById('tlfBusinessEmail');
        if(!emailEl || !emailMfaSession) return;
        
        try {
          resendEmailOtpBtn.disabled = true;
          var svc = window.businessAWSAuthService;
          if(!svc) throw new Error('Business authentication service not available.');
          
          var result = await svc.sendEmailMFALoginOTP(
            emailEl.value.trim(),
            emailMfaTokens,
            true, // resend
            emailMfaSession
          );
          
          emailMfaSession = result.session;
          startResendTimer(resendCooldown);
          
          var globalMessage = document.getElementById('loginGlobalMessage');
          if(globalMessage) {
            globalMessage.textContent = 'Verification code has been resent to your email.';
            globalMessage.classList.remove('d-none', 'alert-danger', 'alert-warning');
            globalMessage.classList.add('alert-success');
            setTimeout(function() {
              globalMessage.classList.remove('alert-success');
              globalMessage.classList.add('alert-info');
            }, 3000);
          }
        } catch(err) {
          console.error('Resend email OTP error:', err);
          var errorMsg = err.message || 'Failed to resend code. Please try again.';
          if(err.retryAfter) {
            errorMsg += ' Please wait ' + Math.ceil(err.retryAfter) + ' seconds.';
            startResendTimer(err.retryAfter);
          } else {
            startResendTimer(resendCooldown);
          }
          if(typeof showErrorToast === 'function') {
            showErrorToast(errorMsg);
          } else {
            alert(errorMsg);
          }
        } finally {
          resendEmailOtpBtn.disabled = false;
        }
      });
    }
    
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var emailEl = document.getElementById('tlfBusinessEmail');
      var passEl = document.getElementById('tlfBusinessPassword');
      var btn = document.getElementById('tlfBusinessSubmit');
      var btnText = btn ? btn.querySelector('.btn-text') : null;
      
      if(!emailEl || !passEl) return;
      
      // Check if we're in MFA verification step
      var isMfaStep = mfaField && mfaField.style.display !== 'none';
      var isEmailMfaStep = isMfaStep && currentMfaMethod === 'email' && emailMfaCodeEl && emailMfaCodeEl.value.trim();
      var isTotpMfaStep = isMfaStep && currentMfaMethod === 'totp' && mfaCodeEl && mfaCodeEl.value.trim();
      
      // Get Turnstile token (only needed for initial login, not MFA step)
      var turnstileToken = null;
      if(!isMfaStep && window.turnstileManager) {
        turnstileToken = window.turnstileManager.getToken('business-login-turnstile-container');
        if(!turnstileToken) {
          if(typeof showWarningToast === 'function') {
            showWarningToast('Please complete the security verification.');
          } else {
            alert('Please complete the security verification.');
          }
          if(window.turnstileManager) {
            window.turnstileManager.reset('business-login-turnstile-container');
          }
          return;
        }
      }
      
      try {
        if(btn){ btn.disabled = true; btn.classList.add('loading'); }
        
        // Ensure we're using business auth service (not regular)
        var svc = window.businessAWSAuthService;
        if(!svc) {
          throw new Error('Business authentication service not available. Please ensure aws-auth-business.js is loaded.');
        }
        
        var result;
        
        // Handle MFA verification step
        if(isEmailMfaStep && emailMfaSession) {
          // Email MFA verification
          var emailMfaCode = emailMfaCodeEl.value.trim();
          if(!emailMfaCode || emailMfaCode.length !== 6) {
            if(typeof showWarningToast === 'function') {
              showWarningToast('Please enter a valid 6-digit code from your email.');
            } else {
              alert('Please enter a valid 6-digit code from your email.');
            }
            if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
            return;
          }
          
          result = await svc.verifyEmailMFALoginOTP(emailEl.value.trim(), emailMfaCode, emailMfaSession);
          
          if(result && result.success && result.tokens) {
            // Email MFA verified - complete login with tokens
            // The tokens are already stored server-side, so we just need to get session
            try {
              await svc.getUserInfo();
            } catch(_) {}
            
            // Reset form
            resetLoginForm();
            
            // Redirect
            var returnTo = null;
            try { returnTo = sessionStorage.getItem('chp_return_to'); } catch(_) {}
            if (returnTo) {
              try { sessionStorage.removeItem('chp_return_to'); } catch(_) {}
              window.location.href = returnTo;
              return;
            }
            window.location.href = 'test.html';
            return;
          }
        } else if(isTotpMfaStep && mfaSession) {
          // TOTP MFA verification
          var mfaCode = mfaCodeEl.value.trim();
          if(!mfaCode || mfaCode.length !== 6) {
            if(typeof showWarningToast === 'function') {
              showWarningToast('Please enter a valid 6-digit code from your authenticator app.');
            } else {
              alert('Please enter a valid 6-digit code from your authenticator app.');
            }
            if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
            return;
          }
          result = await svc.login(emailEl.value.trim(), passEl.value, null, mfaCode, mfaSession);
        } else {
          // Initial login attempt
          result = await svc.login(emailEl.value.trim(), passEl.value, turnstileToken);
        }
        
        // Check if TOTP MFA is required (from Cognito)
        if(result && result.requiresMfa && result.session && result.challengeName === 'SOFTWARE_TOKEN_MFA') {
          mfaSession = result.session;
          hasTotpMfa = true;
          
          // Check if user also has email MFA from login response
          hasEmailMfa = result.emailMfaEnabled || false;
          
          // Show MFA UI - if email MFA is available, switcher will appear
          showMfaUI(hasEmailMfa, hasTotpMfa);
          
          if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
          return;
        }
        
        // Check if Email MFA is required (from login Lambda)
        if(result && result.requiresMfa && result.challengeName === 'EMAIL_MFA' && result.tokens) {
          // Email MFA is required and tokens are provided
          emailMfaTokens = result.tokens;
          hasEmailMfa = true;
          
          // Send email MFA OTP
          try {
            var emailMfaResult = await svc.sendEmailMFALoginOTP(
              emailEl.value.trim(),
              emailMfaTokens
            );
            
            emailMfaSession = emailMfaResult.session;
            
            // Show MFA UI
            showMfaUI(hasEmailMfa, hasTotpMfa);
            
            if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
            return;
          } catch(err) {
            console.error('Error sending email MFA OTP:', err);
            if(typeof showErrorToast === 'function') {
              showErrorToast('Failed to send verification code. Please try again.');
            } else {
              alert('Failed to send verification code. Please try again.');
            }
            if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
            return;
          }
        }
        
        // Check if login was successful but we need to check for email MFA
        if(result && result.success && !result.requiresMfa) {
          // Login successful, but check if email MFA is required
          try {
            var userInfo = await svc.getUserInfo();
            if(userInfo && userInfo.success && userInfo.user) {
              hasEmailMfa = userInfo.user.emailMfaEnabled || false;
              var primaryMfa = userInfo.user.primaryMFA || null;
              
              // If email MFA is enabled and is primary, send email OTP
              if(hasEmailMfa && (primaryMfa === 'EMAIL' || !userInfo.user.mfaType || userInfo.user.mfaType === 'EMAIL')) {
                // Get tokens from the successful login
                var sessionResult = await svc.getSessionTokens();
                if(sessionResult && sessionResult.success && sessionResult.tokens) {
                  emailMfaTokens = sessionResult.tokens;
                  
                  // Send email MFA OTP
                  var emailMfaResult = await svc.sendEmailMFALoginOTP(
                    emailEl.value.trim(),
                    emailMfaTokens
                  );
                  
                  emailMfaSession = emailMfaResult.session;
                  hasEmailMfa = true;
                  
                  // Show MFA UI
                  showMfaUI(hasEmailMfa, hasTotpMfa);
                  
                  if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
                  return;
                }
              }
            }
          } catch(err) {
            console.error('Error checking email MFA:', err);
          }
        }
        
        // Login successful (with or without MFA)
        resetLoginForm();
        
        try { 
          await svc.getUserInfo(); 
        } catch(_) {}
        
        // Prefer redirecting back to the page user came from
        var returnTo = null;
        try { returnTo = sessionStorage.getItem('chp_return_to'); } catch(_) {}
        if (returnTo) {
          try { sessionStorage.removeItem('chp_return_to'); } catch(_) {}
          window.location.href = returnTo; 
          return;
        }
        
        // Default fallback - redirect to business dashboard or home
        window.location.href = 'test.html';
        
      } catch(err){
        console.error('Business login flow error:', err);
        
        // Reset Turnstile widget on error (only if not in MFA step)
        if(!isMfaStep && window.turnstileManager) {
          window.turnstileManager.reset('business-login-turnstile-container');
        }
        
        // Handle suspended account
        if(err && err.error === 'ACCOUNT_SUSPENDED') {
          var suspensionMessage = err.message || 'Your account has been suspended.';
          if(err.suspensionReason) {
            suspensionMessage += ' Reason: ' + err.suspensionReason;
          }
          suspensionMessage += ' Please contact support at support@comparehubprices.site to appeal this decision.';
          if(typeof showErrorToast === 'function') {
            showErrorToast(suspensionMessage, 'Account Suspended');
          } else {
            alert(suspensionMessage);
          }
          if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
          return;
        }
        
        // Handle deleted account
        if(err && err.error === 'ACCOUNT_DELETED') {
          var deletedMessage = err.message || 'This account has been deleted and is no longer accessible.';
          if(typeof showErrorToast === 'function') {
            showErrorToast(deletedMessage, 'Account Deleted');
          } else {
            alert(deletedMessage);
          }
          if(btn){ btn.disabled = false; btn.classList.remove('loading'); }
          return;
        }
        
        // Handle Turnstile requirement
        if(err.requiresTurnstile) {
          if(typeof showWarningToast === 'function') {
            showWarningToast('Security verification required. Please complete the Turnstile challenge.');
          } else {
            alert('Security verification required. Please complete the Turnstile challenge.');
          }
          if(window.turnstileManager) {
            window.turnstileManager.reset('business-login-turnstile-container');
          }
          return;
        }
        
        // Show user-friendly error message
        var errorMsg = 'Login failed. ';
        if(err.message) {
          if(err.message.includes('Incorrect') || err.message.includes('password') || err.message.includes('email') || err.message.includes('Invalid')) {
            errorMsg = 'Login failed. Incorrect email or password. Please try again.';
          } else {
            errorMsg += err.message;
          }
        } else if(err.response && err.response.message) {
          if(err.response.message.includes('Incorrect') || err.response.message.includes('password') || err.response.message.includes('email') || err.response.message.includes('Invalid')) {
            errorMsg = 'Login failed. Incorrect email or password. Please try again.';
          } else {
            errorMsg += err.response.message;
          }
        } else {
          errorMsg += 'Please check your credentials and try again.';
        }
        
        // If MFA verification failed, clear the MFA code field
        if(isEmailMfaStep && emailMfaCodeEl) {
          emailMfaCodeEl.value = '';
          emailMfaCodeEl.focus();
        } else if(isTotpMfaStep && mfaCodeEl) {
          mfaCodeEl.value = '';
          mfaCodeEl.focus();
        }
        
        if(typeof showErrorToast === 'function') {
          showErrorToast(errorMsg);
        } else {
          alert(errorMsg);
        }
        
      } finally {
        if(btn){ 
          btn.disabled = false; 
          btn.classList.remove('loading');
        }
      }
    });
    
    // Helper function to show MFA UI
    function showMfaUI(hasEmail, hasTotp) {
      var emailEl = document.getElementById('tlfBusinessEmail');
      var passEl = document.getElementById('tlfBusinessPassword');
      var emailField = emailEl ? emailEl.closest('.tlf-field') : null;
      var passwordField = passEl ? passEl.closest('.tlf-field') : null;
      var rememberRow = document.querySelector('#tlfBusinessForm .tlf-row');
      var turnstileContainer = document.getElementById('business-login-turnstile-container');
      var btnText = document.getElementById('tlfBusinessSubmit') ? document.getElementById('tlfBusinessSubmit').querySelector('.btn-text') : null;
      var globalMessage = document.getElementById('loginGlobalMessage');
      
      // Get MFA field and related elements (with fallback if not in scope)
      var mfaFieldEl = (typeof mfaField !== 'undefined' && mfaField) ? mfaField : document.getElementById('tlfBusinessMfaField');
      var mfaMethodSwitcherEl = (typeof mfaMethodSwitcher !== 'undefined' && mfaMethodSwitcher) ? mfaMethodSwitcher : document.getElementById('tlfBusinessMfaMethodSwitcher');
      
      // Hide email and password fields
      if(emailField) emailField.style.display = 'none';
      if(passwordField) passwordField.style.display = 'none';
      if(rememberRow) rememberRow.style.display = 'none';
      if(turnstileContainer) turnstileContainer.style.display = 'none';
      
      // Show MFA field
      if(mfaFieldEl) mfaFieldEl.style.display = 'block';
      
      // Show method switcher if both methods are available
      if(hasEmail && hasTotp && mfaMethodSwitcherEl) {
        mfaMethodSwitcherEl.style.display = 'block';
      } else {
        if(mfaMethodSwitcherEl) mfaMethodSwitcherEl.style.display = 'none';
      }
      
      // Determine which method to show by default
      if(hasEmail && hasTotp) {
        // Both available - default to email if it's primary, otherwise TOTP
        switchMfaMethod('email'); // Default to email
      } else if(hasEmail) {
        switchMfaMethod('email');
      } else if(hasTotp) {
        switchMfaMethod('totp');
      }
      
      // Start resend timer for email MFA
      if(hasEmail && currentMfaMethod === 'email') {
        startResendTimer(resendCooldown);
      }
      
      // Update button text
      if(btnText) {
        btnText.textContent = 'Verify Code';
      }
      
      // Show message
      if(globalMessage) {
        if(currentMfaMethod === 'email') {
          globalMessage.textContent = 'A verification code has been sent to your email. Please enter it below.';
        } else {
          globalMessage.textContent = 'Please enter the code from your authenticator app.';
        }
        globalMessage.classList.remove('d-none', 'alert-danger', 'alert-warning');
        globalMessage.classList.add('alert-info');
      }
    }
    
    // Helper function to reset login form
    function resetLoginForm() {
      mfaSession = null;
      emailMfaSession = null;
      emailMfaTokens = null;
      currentMfaMethod = null;
      hasEmailMfa = false;
      hasTotpMfa = false;
      if(resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
      
      var emailEl = document.getElementById('tlfBusinessEmail');
      var passEl = document.getElementById('tlfBusinessPassword');
      var emailField = emailEl ? emailEl.closest('.tlf-field') : null;
      var passwordField = passEl ? passEl.closest('.tlf-field') : null;
      var rememberRow = document.querySelector('#tlfBusinessForm .tlf-row');
      var turnstileContainer = document.getElementById('business-login-turnstile-container');
      var btnText = document.getElementById('tlfBusinessSubmit') ? document.getElementById('tlfBusinessSubmit').querySelector('.btn-text') : null;
      
      // Get MFA field and related elements (with fallback if not in scope)
      var mfaFieldEl = (typeof mfaField !== 'undefined' && mfaField) ? mfaField : document.getElementById('tlfBusinessMfaField');
      var resendTimerElLocal = (typeof resendTimerEl !== 'undefined' && resendTimerEl) ? resendTimerEl : document.getElementById('tlfBusinessResendTimer');
      var resendEmailOtpBtnLocal = (typeof resendEmailOtpBtn !== 'undefined' && resendEmailOtpBtn) ? resendEmailOtpBtn : document.getElementById('tlfBusinessResendEmailOtp');
      
      if(emailField) emailField.style.display = 'block';
      if(passwordField) passwordField.style.display = 'block';
      if(rememberRow) rememberRow.style.display = 'flex';
      if(mfaFieldEl) mfaFieldEl.style.display = 'none';
      if(turnstileContainer) turnstileContainer.style.display = 'block';
      if(btnText) btnText.textContent = 'Sign In to Business';
      if(resendTimerElLocal) resendTimerElLocal.style.display = 'none';
      if(resendEmailOtpBtnLocal) resendEmailOtpBtnLocal.disabled = false;
    }
  }

  function bindGoogleSignIn(){
    var container = document.getElementById('googleButtonContainer');
    if(!container) return;
    var btn = container.querySelector('.gsi-material-button');
    if(!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var svc = window.awsAuthService;
      if(svc && svc.initGoogleSignIn){
        svc.initGoogleSignIn();
      }
    });
  }

  function renderGoogleButton(){
    var container = document.getElementById('googleButtonContainer');
    if(!container) return;
    if(!window.google || !window.google.accounts || !window.google.accounts.id) return;

    google.accounts.id.renderButton(container, {
      type: 'standard',
      text: 'continue_with',
      shape: 'pill',
      theme: 'outline',
      size: 'large',
      logo_alignment: 'left',
      width: 280
    });

    container.style.display = 'flex';
  }

  function promptGoogleOneTap(){
    if(window.google && window.google.accounts && window.google.accounts.id){
      try {
        google.accounts.id.prompt(function(notification){
          if(notification && notification.isNotDisplayed && notification.isNotDisplayed()){
            console.warn('Google One Tap not displayed:', notification.getNotDisplayedReason && notification.getNotDisplayedReason());
          }
          if(notification && notification.isSkippedMoment && notification.isSkippedMoment()){
            console.warn('Google One Tap skipped:', notification.getSkippedReason && notification.getSkippedReason());
          }
        });
      } catch(err) {
        console.warn('Google One Tap prompt error:', err);
      }
    }
  }

  async function handleOneTapCredential(response){
    if(!response || !response.credential){
      return;
    }

    try {
      var svc = window.awsAuthService;
      if(!svc || !svc.loginWithGoogleCredential){
        throw new Error('Google login service unavailable');
      }

      await svc.loginWithGoogleCredential(response.credential);
      
      // Call getUserInfo to verify session (using regular auth service, not business)
      try { 
        await svc.getUserInfo(); 
      } catch(getUserInfoErr) {
        // Silently ignore getUserInfo errors - session might not be ready yet
        // Only log if it's not a session error
        if(getUserInfoErr && getUserInfoErr.message && 
           !getUserInfoErr.message.includes('Session') && 
           !getUserInfoErr.message.includes('Not authenticated')) {
          console.warn('getUserInfo call after Google login failed:', getUserInfoErr);
        }
      }

      if(window.google && window.google.accounts && window.google.accounts.id){
        try { google.accounts.id.disableAutoSelect(); } catch(_) {}
      }

      var returnTo = null;
      try { returnTo = sessionStorage.getItem('chp_return_to'); } catch(_) {}
      if (returnTo) {
        try { sessionStorage.removeItem('chp_return_to'); } catch(_) {}
        window.location.href = returnTo; return;
      }

      window.location.href = 'test.html';
    } catch(err){
      console.error('Google One Tap login failed:', err);
      var googleErrorMsg = 'Google sign-in failed: ' + (err && err.message ? err.message : 'Unknown error');
      if(typeof showErrorToast === 'function') {
        showErrorToast(googleErrorMsg);
      } else {
        alert(googleErrorMsg);
      }
    }
  }

  function initGoogleOneTap(){
    if(googleOneTapInitialized) {
      promptGoogleOneTap();
      return;
    }

    if(!window.google || !window.google.accounts || !window.google.accounts.id){
      setTimeout(initGoogleOneTap, 200);
      return;
    }

    googleOneTapInitialized = true;

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleOneTapCredential,
        auto_select: true,
        cancel_on_tap_outside: false,
        context: 'signin',
        itp_support: true
      });
      renderGoogleButton();
      promptGoogleOneTap();
    } catch(err) {
      console.error('Google One Tap initialization failed:', err);
    }
  }

  function handleGoogleCallback(){
    var urlParams = new URLSearchParams(window.location.search);
    var code = urlParams.get('code');
    var state = urlParams.get('state');
    var error = urlParams.get('error');
    
    if(error){
      if(typeof showWarningToast === 'function') {
        showWarningToast('Google sign-in was cancelled or failed.');
      } else {
        alert('Google sign-in was cancelled or failed.');
      }
      window.location.href = 'login.html';
      return;
    }
    
    if(code && state){
      (async function(){
        try{
          var svc = window.awsAuthService;
          if(!svc || !svc.handleGoogleCallback){
            if(typeof showErrorToast === 'function') {
              showErrorToast('Google sign-in service not available.');
            } else {
              alert('Google sign-in service not available.');
            }
            window.location.href = 'login.html';
            return;
          }
          await svc.handleGoogleCallback(code, state);
          
          // Call getUserInfo to verify session (using regular auth service, not business)
          try { 
            await svc.getUserInfo(); 
          } catch(getUserInfoErr) {
            // Silently ignore getUserInfo errors - session might not be ready yet
            // Only log if it's not a session error
            if(getUserInfoErr && getUserInfoErr.message && 
               !getUserInfoErr.message.includes('Session') && 
               !getUserInfoErr.message.includes('Not authenticated')) {
              console.warn('getUserInfo call after Google callback failed:', getUserInfoErr);
            }
          }
          
          var returnTo = null;
          try { returnTo = sessionStorage.getItem('chp_return_to'); } catch(_) {}
          if (returnTo) {
            try { sessionStorage.removeItem('chp_return_to'); } catch(_) {}
            window.location.href = returnTo; return;
          }
          window.location.href = 'test.html';
        } catch(err){
          console.error('Google callback error:', err);
          var callbackErrorMsg = 'Google sign-in failed: ' + err.message;
          if(typeof showErrorToast === 'function') {
            showErrorToast(callbackErrorMsg);
          } else {
            alert(callbackErrorMsg);
          }
          window.location.href = 'login.html';
        }
      })();
    }
  }

  // Turnstile widget rendering
  async function renderTurnstileWidgets(){
    if(!window.turnstileManager) {
      console.warn('Turnstile manager not available');
      return;
    }

    try {
      // Render user login widget
      var userContainer = document.getElementById('login-turnstile-container');
      if(userContainer) {
        await window.turnstileManager.render('#login-turnstile-container', {
          theme: 'light',
          size: 'normal',
          action: 'login',
          callback: function(token) {
            console.log('Login Turnstile token received');
          },
          errorCallback: function(errorCode) {
            console.error('Login Turnstile error:', errorCode);
          },
          expiredCallback: function() {
            console.warn('Login Turnstile token expired');
          }
        });
      }

      // Render business login widget
      var businessContainer = document.getElementById('business-login-turnstile-container');
      if(businessContainer) {
        await window.turnstileManager.render('#business-login-turnstile-container', {
          theme: 'light',
          size: 'normal',
          action: 'business-login',
          callback: function(token) {
            console.log('Business login Turnstile token received');
          },
          errorCallback: function(errorCode) {
            console.error('Business login Turnstile error:', errorCode);
          },
          expiredCallback: function() {
            console.warn('Business login Turnstile token expired');
          }
        });
      }
    } catch(error) {
      console.error('Failed to render Turnstile widgets:', error);
    }
  }

  window.chpPromptGoogleOneTap = promptGoogleOneTap;
  window.chpInitGoogleOneTap = initGoogleOneTap;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', async function(){ 
      initEyeToggles(); 
      bindLoginSubmit();
      bindBusinessLoginSubmit();
      bindGoogleSignIn();
      handleGoogleCallback();
      initGoogleOneTap();
      // Render Turnstile widgets after a short delay to ensure manager is loaded
      setTimeout(renderTurnstileWidgets, 500);
    });
  } else {
    initEyeToggles(); 
    bindLoginSubmit();
    bindBusinessLoginSubmit();
    bindGoogleSignIn();
    handleGoogleCallback();
    initGoogleOneTap();
    // Render Turnstile widgets after a short delay to ensure manager is loaded
    setTimeout(renderTurnstileWidgets, 500);
  }
})();


