const authActions = {
  'vendor-signup': {
    url: '/api/vendors/signup',
    tokenKey: 'vendorToken',
    redirect: 'vendor-portal.html'
  },
  'institution-signup': {
    url: '/api/institutions/signup',
    tokenKey: 'institutionToken',
    redirect: 'institution-portal.html'
  },
  'vendor-signin': {
    url: '/api/vendors/signin',
    tokenKey: 'vendorToken',
    redirect: 'vendor-portal.html'
  },
  'institution-signin': {
    url: '/api/institutions/signin',
    tokenKey: 'institutionToken',
    redirect: 'institution-portal.html'
  }
};

const readFormData = (form) => {
  const raw = Object.fromEntries(new FormData(form).entries());
  Object.keys(raw).forEach((key) => {
    if (raw[key] === '') {
      delete raw[key];
    }
  });
  return raw;
};

const handleAuth = () => {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const actionKey = form.dataset.authForm;
  const action = authActions[actionKey];
  if (!action) return;

  const statusNode =
    form.querySelector('[data-auth-status]') ||
    document.createElement('p');

  if (!statusNode.dataset.authStatus) {
    statusNode.dataset.authStatus = 'inline';
    statusNode.classList.add('form-status');
    form.append(statusNode);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusNode.textContent = 'Processing...';
    statusNode.classList.remove('error', 'success');

    try {
      const payload = readFormData(form);
      const response = await fetch(action.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to continue');
      }

      localStorage.setItem(action.tokenKey, data.token);
      statusNode.textContent = 'Success. Redirecting...';
      statusNode.classList.add('success');
      setTimeout(() => {
        window.location.href = action.redirect;
      }, 700);
    } catch (error) {
      statusNode.textContent = error.message;
      statusNode.classList.add('error');
    }
  });
};

document.addEventListener('DOMContentLoaded', handleAuth);

