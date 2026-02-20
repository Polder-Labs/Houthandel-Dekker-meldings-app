/* ============================================
   HoutVeilig - Microsoft 365 SSO Authentication
   Using MSAL.js 2.x (Browser)
   ============================================ */

// === MSAL Configuration ===
// ⚠️ UPDATE THESE VALUES after registering the app in Entra ID
const msalConfig = {
    auth: {
        clientId: "78ede6bb-58a2-481f-94b4-3eafa89be166",       // Application (client) ID from Entra ID
        authority: "https://login.microsoftonline.com/3c27c8d3-c979-401c-8763-a4bf501815ff", // Your M365 tenant
        redirectUri: window.location.origin,    // Auto-detected from hosting URL
        postLogoutRedirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    },
    system: {
        loggerOptions: {
            logLevel: msal.LogLevel ? msal.LogLevel.Warning : 3
        }
    }
};

// Scopes for login - basic profile info
const loginRequest = {
    scopes: ["User.Read", "openid", "profile", "email"]
};

// === MSAL Instance ===
let msalInstance = null;
let currentAccount = null;

/**
 * Initialize MSAL and handle redirect response
 */
async function initAuth() {
    try {
        msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Handle redirect response (after login redirect)
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            currentAccount = response.account;
        } else {
            // Check if user is already signed in
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                currentAccount = accounts[0];
            }
        }
        
        updateAuthUI();
        return currentAccount;
    } catch (error) {
        console.error("MSAL initialization error:", error);
        showAuthError(error);
        return null;
    }
}

/**
 * Sign in with Microsoft 365
 */
async function signIn() {
    if (!msalInstance) {
        console.error("MSAL not initialized");
        return;
    }
    
    try {
        // Try popup first, fallback to redirect
        const response = await msalInstance.loginPopup(loginRequest);
        currentAccount = response.account;
        updateAuthUI();
    } catch (error) {
        if (error instanceof msal.BrowserAuthError && 
            (error.errorCode === "popup_window_error" || error.errorCode === "user_cancelled")) {
            // Popup blocked or cancelled, try redirect
            try {
                await msalInstance.loginRedirect(loginRequest);
            } catch (redirectError) {
                console.error("Login redirect error:", redirectError);
                showAuthError(redirectError);
            }
        } else {
            console.error("Login error:", error);
            showAuthError(error);
        }
    }
}

/**
 * Sign out
 */
async function signOut() {
    if (!msalInstance) return;
    
    try {
        await msalInstance.logoutPopup({
            account: currentAccount,
            postLogoutRedirectUri: window.location.origin
        });
        currentAccount = null;
        updateAuthUI();
    } catch (error) {
        // Fallback to redirect logout
        try {
            await msalInstance.logoutRedirect({
                account: currentAccount
            });
        } catch (redirectError) {
            console.error("Logout error:", redirectError);
        }
    }
}

/**
 * Get the current user's display name
 */
function getUserDisplayName() {
    if (!currentAccount) return null;
    return currentAccount.name || currentAccount.username;
}

/**
 * Get the current user's email
 */
function getUserEmail() {
    if (!currentAccount) return null;
    return currentAccount.username; // UPN / email
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return currentAccount !== null;
}

/**
 * Get an access token silently (for API calls)
 */
async function getAccessToken(scopes = ["User.Read"]) {
    if (!msalInstance || !currentAccount) return null;
    
    const tokenRequest = {
        scopes: scopes,
        account: currentAccount
    };
    
    try {
        const response = await msalInstance.acquireTokenSilent(tokenRequest);
        return response.accessToken;
    } catch (error) {
        // If silent fails, try interactive
        if (error instanceof msal.InteractionRequiredAuthError) {
            try {
                const response = await msalInstance.acquireTokenPopup(tokenRequest);
                return response.accessToken;
            } catch (popupError) {
                console.error("Token acquisition error:", popupError);
                return null;
            }
        }
        console.error("Silent token error:", error);
        return null;
    }
}

/**
 * Update the UI based on authentication state
 */
function updateAuthUI() {
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    const splashScreen = document.getElementById('splash-screen');
    const userNameEl = document.getElementById('user-display-name');
    const userEmailEl = document.getElementById('user-email');
    const authErrorEl = document.getElementById('auth-error');
    
    if (authErrorEl) {
        authErrorEl.classList.add('hidden');
    }
    
    if (isAuthenticated()) {
        // User is logged in - show app
        if (loginScreen) loginScreen.classList.add('hidden');
        if (splashScreen) splashScreen.style.display = 'none';
        if (app) app.classList.remove('hidden');
        
        // Update user info in header
        if (userNameEl) userNameEl.textContent = getUserDisplayName() || '';
        if (userEmailEl) userEmailEl.textContent = getUserEmail() || '';
        
        // Pre-fill form fields with user info
        const naamInput = document.getElementById('melder-naam');
        if (naamInput && !naamInput.value) {
            naamInput.value = getUserDisplayName() || '';
        }
        
        const emailInput = document.getElementById('email-ontvanger');
        if (emailInput && !emailInput.value) {
            const savedEmail = localStorage.getItem('houtveilig-email');
            if (savedEmail) {
                emailInput.value = savedEmail;
            }
        }
    } else {
        // User is not logged in - show login screen
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (app) app.classList.add('hidden');
        if (splashScreen) splashScreen.style.display = 'none';
    }
}

/**
 * Show authentication error
 */
function showAuthError(error) {
    const authErrorEl = document.getElementById('auth-error');
    const authErrorMsg = document.getElementById('auth-error-message');
    
    if (authErrorEl && authErrorMsg) {
        let message = 'Er is een fout opgetreden bij het inloggen.';
        
        if (error.errorMessage) {
            message = error.errorMessage;
        } else if (error.message) {
            message = error.message;
        }
        
        // Check for common configuration errors
        if (message.includes('YOUR_CLIENT_ID_HERE') || message.includes('YOUR_TENANT_ID_HERE')) {
            message = 'De app is nog niet geconfigureerd. Stel de Client ID en Tenant ID in bij auth.js.';
        }
        
        authErrorMsg.textContent = message;
        authErrorEl.classList.remove('hidden');
    }
}
