// Session-aware navigation bar handler
// Detects user login state and updates navigation accordingly

const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
};

const detectUserSession = () => {
    const vendorToken = localStorage.getItem('vendorToken');
    const institutionToken = localStorage.getItem('institutionToken');

    if (vendorToken) {
        const payload = decodeJWT(vendorToken);
        if (payload) {
            return {
                type: 'vendor',
                token: vendorToken,
                userInfo: payload
            };
        }
    }

    if (institutionToken) {
        const payload = decodeJWT(institutionToken);
        if (payload) {
            return {
                type: 'institution',
                token: institutionToken,
                userInfo: payload
            };
        }
    }

    return null;
};

const handleNavLogout = (session) => {
    if (session.type === 'vendor') {
        localStorage.removeItem('vendorToken');
        window.location.href = 'vendor-signin.html';
    } else if (session.type === 'institution') {
        localStorage.removeItem('institutionToken');
        window.location.href = 'institution-signin.html';
    }
};

const updateNavigation = (session) => {
    const signinItem = document.querySelector('[data-nav-signin]');
    const signupItem = document.querySelector('[data-nav-signup]');
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return;

    if (session) {
        // User is logged in - hide auth links and show user info
        if (signinItem) signinItem.style.display = 'none';
        if (signupItem) signupItem.style.display = 'none';

        // Create user info display
        const userInfoItem = document.createElement('li');
        userInfoItem.className = 'nav-user-info';
        userInfoItem.style.cssText = 'display: flex; align-items: center; gap: 1rem; color: white;';

        const userName = session.userInfo.businessName ||
            session.userInfo.institutionName ||
            session.userInfo.contactName ||
            'User';

        const userType = session.type === 'vendor' ? 'Vendor' : 'Institution';

        userInfoItem.innerHTML = `
      <span style="font-size: 0.9rem; opacity: 0.9;">${userName} (${userType})</span>
    `;

        // Create logout button
        const logoutItem = document.createElement('li');
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'signup-btn';
        logoutBtn.style.cssText = 'cursor: pointer; border: none;';
        logoutBtn.addEventListener('click', () => handleNavLogout(session));

        logoutItem.appendChild(logoutBtn);

        // Insert before the last item or at the end
        navLinks.appendChild(userInfoItem);
        navLinks.appendChild(logoutItem);
    } else {
        // User is logged out - ensure auth links are visible
        if (signinItem) signinItem.style.display = '';
        if (signupItem) signupItem.style.display = '';
    }
};

const initSessionAwareNav = () => {
    const session = detectUserSession();
    updateNavigation(session);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initSessionAwareNav);
