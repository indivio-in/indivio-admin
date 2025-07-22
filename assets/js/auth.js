// This file runs immediately to handle all authentication logic.

document.addEventListener('DOMContentLoaded', () => {
    // This function will secure all pages on load.
    protectPage();

    // Attach listeners only if the elements exist on the current page.
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', adminLogout);
    }
});

/**
 * Secures pages by checking the user's auth state.
 * Prevents page content from "flashing" before the check is complete.
 * Redirects unauthenticated users to the login page and authenticated users away from it.
 */
function protectPage() {
    // onAuthStateChanged is the listener that detects login/logout events.
    // The 'S' in 'State' must be capitalized.
    auth.onAuthStateChanged(user => {
        const isOnLoginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('/');
        
        if (user) {
            // ---- User is LOGGED IN ----
            if (isOnLoginPage) {
                // If they are on the login page, send them to the dashboard.
                window.location.replace('/indivio-admin/dashboard.html');
            }
            // On any other page, reveal the content.
            document.body.classList.remove('is-loading');

        } else {
            // ---- User is LOGGED OUT ----
            if (!isOnLoginPage) {
                // If they are on any page other than login, send them to the login page.
                window.location.replace('/indivio-admin/login.html');
            }
            // If they are already on the login page, just reveal it.
            document.body.classList.remove('is-loading');
        }
    });
}

/**
 * Handles the email/password login form submission.
 * @param {Event} e The form submission event.
 */
function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const button = e.target.querySelector('button');

    button.disabled = true;
    button.textContent = "Signing In...";
    
    auth.signInWithEmailAndPassword(email, password)
      .catch(error => {
        errorDiv.textContent = `Login Failed: ${error.message}`;
        errorDiv.style.display = 'block';
        button.disabled = false;
        button.textContent = "Sign In";
      });
}

/**
 * Handles the "Continue with Google" button click.
 */
function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => {
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = `Google Sign-In Failed: ${error.message}`;
            errorDiv.style.display = 'block';
        });
}

/**
 * Signs the current admin out and redirects to the login page.
 */
function adminLogout() {
    auth.signOut().catch(error => console.error("Sign out error:", error));
}