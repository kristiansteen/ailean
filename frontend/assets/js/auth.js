// assets/js/auth.js

// Note: SSO functionality is temporarily disabled. The configuration remains for easy reactivation.
const googleConfig = {
    authority: "https://accounts.google.com",
    client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    redirect_uri: `${window.location.origin}/callback.html`,
    response_type: "id_token token",
    scope: "openid profile email",
    loadUserInfo: true,
};

const microsoftConfig = {
    authority: "https://login.microsoftonline.com/common",
    client_id: "YOUR_MICROSOFT_CLIENT_ID",
    redirect_uri: `${window.location.origin}/callback.html`,
    response_type: "id_token token",
    scope: "openid profile email",
    loadUserInfo: true,
};

// const googleUserManager = new Oidc.UserManager(googleConfig);
// const microsoftUserManager = new Oidc.UserManager(microsoftConfig);

/**
 * Logs the user in using a simple email-based approach for testing.
 * @param {string} email The user's email address.
 */
function loginWithEmail(email) {
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }
    const user = {
        id: email,
        name: email.split('@')[0], // Use the part before the @ as the display name
        email: email,
        provider: 'email'
    };
    localStorage.setItem('vimpl-user', JSON.stringify(user));
    window.location.reload(); // Reload the page to update the UI
}

function loginWithGoogle() {
    // SSO login is temporarily disabled.
    alert("SSO login is temporarily disabled for testing.");
    // localStorage.setItem('vimpl_provider', 'google');
    // googleUserManager.signinRedirect();
}

function loginWithMicrosoft() {
    // SSO login is temporarily disabled.
    alert("SSO login is temporarily disabled for testing.");
    // localStorage.setItem('vimpl_provider', 'microsoft');
    // microsoftUserManager.signinRedirect();
}

/**
 * Logs the current user out by clearing their data from localStorage.
 */
function logout() {
    localStorage.removeItem('vimpl-user');
    localStorage.removeItem('vimpl_provider'); // Also clear provider just in case
    localStorage.removeItem('accessToken'); // Clear API token
    // For local testing, redirecting to index.html is more reliable than origin
    window.location.href = 'index.html';
}

/**
 * Retrieves the current user's data from localStorage.
 * @returns {object|null} The user object or null if not logged in.
 */
function getCurrentUser() {
    const userString = localStorage.getItem('vimpl-user');
    if (userString) {
        try {
            return JSON.parse(userString);
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
            return null;
        }
    }
    return null;
}

/**
 * Handles the authentication callback from an OIDC provider.
 * This function is not used with the current email login but is kept for future SSO reactivation.
 */
async function handleAuthCallback() {
    const provider = localStorage.getItem('vimpl_provider');
    // let userManager = provider === 'google' ? googleUserManager : microsoftUserManager;

    // try {
    //     const user = await userManager.signinRedirectCallback();
    //     if (user) {
    //         const userData = {
    //             id: user.profile.sub,
    //             name: user.profile.name,
    //             email: user.profile.email,
    //             provider: provider
    //         };
    //         localStorage.setItem('vimpl-user', JSON.stringify(userData));
    //         window.location.href = localStorage.getItem('vimpl_redirect_url') || '/';
    //         localStorage.removeItem('vimpl_redirect_url');
    //     } else {
    //         window.location.href = '/';
    //     }
    // } catch (error) {
    //     console.error("Authentication callback error:", error);
    //     window.location.href = '/';
    // }
    console.log("handleAuthCallback called, but SSO is disabled.");
}
