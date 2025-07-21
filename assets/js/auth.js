document.addEventListener('DOMContentLoaded', () => {
    protectPage();

    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
});

function protectPage() {
    auth.onAuthStateChanged(user => {
        const isOnLoginPage = window.location.pathname.endsWith('login.html');
        if (user) {
            if (isOnLoginPage) {
                window.location.replace('dashboard.html');
            }
            document.body.classList.remove('is-loading');
        } else {
            if (!isOnLoginPage) {
                window.location.replace('login.html');
            }
            document.body.classList.remove('is-loading');
        }
    });
}

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

function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => {
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = `Google Sign-In Failed: ${error.message}`;
            errorDiv.style.display = 'block';
        });
}

function adminLogout() {
    auth.signOut().catch(error => console.error("Sign out error:", error));
}