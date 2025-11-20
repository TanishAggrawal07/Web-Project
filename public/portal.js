const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const formatMoney = (value) => currency.format(Number(value || 0));
const formatPhase = (value = '') =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
const formatStatus = (value = '') =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : '—';

const readForm = (form) => {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (data[key] === '') {
      delete data[key];
    }
  });
  return data;
};

const createClient = (token, onExpire) => async (url, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    onExpire();
    throw new Error('Session expired');
  }
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

const showEmptyState = (target, text) => {
  if (!target) return;
  target.innerHTML = `<p class="empty-state">${text}</p>`;
};

const mountLogout = (portal, tokenKey) => {
  const trigger = document.querySelector(`[data-portal-logout="${portal}"]`);
  if (!trigger) return;
  trigger.addEventListener('click', () => {
    localStorage.removeItem(tokenKey);
    window.location.href = 'signin.html';
  });
};

const initVendorPortal = (client, tokenKey) => {
  const board = document.getElementById('vendor-tier-board');
  const table = document.getElementById('vendor-quotes-table');
  const instSelect = document.getElementById('vendor-institution');
  const tierSelect = document.getElementById('vendor-tier');
  const form = document.getElementById('vendor-quote-form');
  const formStatus = document.querySelector('[data-portal-form-status]');
  const badge = document.querySelector('[data-portal-status]');
  let tiersByInstitution = {};

  const setBadge = (label, tone = 'neutral') => {
    if (!badge) return;
    badge.textContent = label;
    badge.className = `status-pill ${tone}`;
  };

  const renderBoard = (institutions = []) => {
    if (!board) return;

    // Filter institutions that have at least one tier
    const activeInstitutions = institutions.filter(inst => inst.tiers && inst.tiers.length > 0);

    if (!activeInstitutions.length) {
      showEmptyState(board, 'No live phases yet.');
      return;
    }

    board.innerHTML = activeInstitutions
      .map((institution) => {
        const tiersHtml = institution.tiers
          .map(
            (tier) => `
            <article class="tier-card">
              <header>
                <span class="phase-pill ${tier.phase}">${formatPhase(tier.phase)}</span>
                <strong>${formatMoney(tier.askingPrice)}</strong>
              </header>
              <p class="tier-perks">${tier.perks || 'Perks shared on request.'}</p>
              <div class="tier-meta">
                <span>Slots: ${tier.capacity ?? 1}</span>
                <span>Expiry: ${formatDate(tier.expiresAt)}</span>
              </div>
            </article>`
          )
          .join('');

        return `
          <div class="institution-group">
            <header class="institution-group-header">
              <h3 class="institution-group-title">${institution.institutionName}</h3>
              <span class="institution-contact-info">Contact: ${institution.contactName}</span>
            </header>
            <div class="institution-tiers-grid">
              ${tiersHtml}
            </div>
          </div>
        `;
      })
      .join('');
  };

  const populateSelects = (institutions = []) => {
    if (!instSelect || !tierSelect) return;
    if (!institutions.length) {
      instSelect.innerHTML =
        '<option value="">No institutions currently live</option>';
      tierSelect.innerHTML =
        '<option value="">No phases available</option>';
      instSelect.disabled = true;
      tierSelect.disabled = true;
      return;
    }
    tiersByInstitution = {};
    instSelect.disabled = false;
    tierSelect.disabled = false;
    instSelect.innerHTML = institutions
      .map((institution, index) => {
        const id = institution._id || institution.id;
        tiersByInstitution[id] = institution.tiers || [];
        return `<option value="${id}" ${index === 0 ? 'selected' : ''
          }>${institution.institutionName}</option>`;
      })
      .join('');
    updateTierOptions(instSelect.value);
  };

  const updateTierOptions = (institutionId) => {
    if (!tierSelect) return;
    const options = tiersByInstitution[institutionId] || [];
    if (!options.length) {
      tierSelect.innerHTML = '<option value="">No phases for this institution</option>';
      tierSelect.disabled = true;
      return;
    }
    tierSelect.disabled = false;
    tierSelect.innerHTML = options
      .map(
        (tier, index) => `
        <option value="${tier.phase}" ${index === 0 ? 'selected' : ''}>
          ${formatPhase(tier.phase)} • ${formatMoney(tier.askingPrice)}
        </option>`
      )
      .join('');
  };

  instSelect?.addEventListener('change', (event) => {
    updateTierOptions(event.target.value);
  });

  const renderQuotes = (quotes = []) => {
    if (!table) return;
    if (!quotes.length) {
      table.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">No quotes yet</td></tr>';
      return;
    }
    table.innerHTML = quotes
      .map((quote) => {
        const institution = quote.institution || {};
        return `
        <tr>
          <td>${institution.institutionName || 'Institution'}</td>
          <td>${formatPhase(quote.tierPhase)}</td>
          <td>${formatMoney(quote.vendorAmount)}</td>
          <td>${formatMoney(quote.institutionExpectation)}</td>
          <td><span class="status-pill ${quote.status}">${formatStatus(
          quote.status
        )}</span></td>
          <td>${formatDate(quote.updatedAt || quote.createdAt)}</td>
        </tr>`;
      })
      .join('');
  };

  const loadTiers = async () => {
    setBadge('Loading...', 'neutral');
    try {
      const { institutions } = await client('/api/vendors/tiers');
      renderBoard(institutions);
      populateSelects(institutions);
      setBadge('Live', 'success');
    } catch (error) {
      setBadge(error.message, 'error');
    }
  };

  const loadQuotes = async () => {
    try {
      const { quotes } = await client('/api/vendors/quotes');
      renderQuotes(quotes);
    } catch (error) {
      renderQuotes([]);
      alert(error.message);
    }
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!formStatus) return;
    const institutionId = instSelect?.value;
    const tierPhase = tierSelect?.value;
    if (!institutionId || !tierPhase) {
      formStatus.textContent = 'Pick an institution and phase first.';
      formStatus.className = 'form-status error';
      return;
    }
    formStatus.textContent = 'Sending quote...';
    formStatus.className = 'form-status';
    try {
      const data = readForm(form);
      await client('/api/vendors/quotes', {
        method: 'POST',
        body: JSON.stringify({
          institutionId,
          tierPhase,
          vendorAmount: Number(data.vendorAmount),
          notes: data.vendorNotes || data.notes || ''
        })
      });
      form.reset();
      updateTierOptions(instSelect.value);
      formStatus.textContent = 'Quote sent.';
      formStatus.classList.add('success');
      await loadQuotes();
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.classList.add('error');
    }
  });

  loadTiers();
  loadQuotes();
};

const actionLabel = (action) => {
  if (action === 'accepted') return 'Accept';
  if (action === 'rejected') return 'Reject';
  return 'Mark Pending';
};

const initInstitutionPortal = (client, tokenKey) => {
  const board = document.getElementById('institution-tier-board');
  const table = document.getElementById('institution-quotes-table');
  const form = document.getElementById('institution-tier-form');
  const statusNode = document.querySelector('[data-tier-status]');
  const renderTiers = (tiers = []) => {
    if (!board) return;
    if (!tiers.length) {
      showEmptyState(board, 'Publish your first phase.');
      return;
    }
    board.innerHTML = tiers
      .map(
        (tier) => `
        <article class="tier-card">
          <header>
            <span class="phase-pill ${tier.phase}">${formatPhase(
          tier.phase
        )}</span>
            <strong>${formatMoney(tier.askingPrice)}</strong>
          </header>
          <p class="tier-perks">${tier.perks || 'Perks not provided.'}</p>
          <div class="tier-meta">
            <span>Slots: ${tier.capacity ?? 1}</span>
            <span>Expiry: ${formatDate(tier.expiresAt)}</span>
          </div>
        </article>`
      )
      .join('');
  };

  const renderQuotes = (quotes = []) => {
    if (!table) return;
    if (!quotes.length) {
      table.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">No quotes yet</td></tr>';
      return;
    }
    table.innerHTML = quotes
      .map((quote) => {
        const vendor = quote.vendor || {};
        const quoteId = quote._id || quote.id;
        return `
        <tr>
          <td>${vendor.businessName || 'Vendor'}<br><small>${vendor.contactName || ''}</small></td>
          <td>${formatPhase(quote.tierPhase)}</td>
          <td>${formatMoney(quote.vendorAmount)}</td>
          <td>${formatMoney(quote.institutionExpectation)}</td>
          <td><span class="status-pill ${quote.status}">${formatStatus(
          quote.status
        )}</span></td>
          <td>
            <div class="table-actions">
              ${['accepted', 'pending', 'rejected']
            .map(
              (action) => `
                <button
                  type="button"
                  class="table-action ${action}"
                  data-quote-action="${action}"
                  data-quote-id="${quoteId}"
                  ${quote.status === action ? 'disabled' : ''}
                >
                  ${actionLabel(action)}
                </button>`
            )
            .join('')}
            </div>
          </td>
        </tr>`;
      })
      .join('');
  };

  const loadTiers = async () => {
    try {
      const { institution } = await client('/api/institutions/tiers');
      renderTiers(institution?.tiers || []);
    } catch (error) {
      renderTiers([]);
      alert(error.message);
    }
  };

  const loadQuotes = async () => {
    try {
      const { quotes } = await client('/api/institutions/quotes');
      renderQuotes(quotes);
    } catch (error) {
      renderQuotes([]);
      alert(error.message);
    }
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!statusNode) return;
    statusNode.textContent = 'Saving...';
    statusNode.className = 'form-status';
    try {
      const data = readForm(form);
      const payload = {
        phase: data.phase || data.tierPhase,
        askingPrice: Number(data.askingPrice || data.tierPrice),
        capacity: data.capacity ? Number(data.capacity) : undefined,
        perks: data.perks || data.tierPerks,
        expiresAt: data.expiresAt || data.tierExpiry
      };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });
      await client('/api/institutions/tiers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      form.reset();
      statusNode.textContent = 'Phase published.';
      statusNode.classList.add('success');
      await loadTiers();
    } catch (error) {
      statusNode.textContent = error.message;
      statusNode.classList.add('error');
    }
  });

  table?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-quote-action]');
    if (!button || button.disabled) return;
    const { quoteId, quoteAction } = button.dataset;
    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Updating...';
    try {
      await client(`/api/institutions/quotes/${quoteId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: quoteAction })
      });
      await loadQuotes();
    } catch (error) {
      button.disabled = false;
      button.textContent = previousLabel;
      alert(error.message);
    }
  });

  loadTiers();
  loadQuotes();
};

const bootPortal = () => {
  const portal = document.body.dataset.portal;
  if (!portal) return;

  const tokenKey =
    portal === 'institution' ? 'institutionToken' : 'vendorToken';
  const oppositeTokenKey =
    portal === 'institution' ? 'vendorToken' : 'institutionToken';
  const signinRoute =
    portal === 'institution' ? 'institution-signin.html' : 'vendor-signin.html';
  const ownPortalRoute =
    portal === 'institution' ? 'institution-portal.html' : 'vendor-portal.html';

  const token = localStorage.getItem(tokenKey);
  const oppositeToken = localStorage.getItem(oppositeTokenKey);

  // Check if user is trying to access the wrong portal
  if (oppositeToken && !token) {
    // User has the opposite token - redirect to their own portal
    const correctPortal = portal === 'institution' ? 'vendor-portal.html' : 'institution-portal.html';
    window.location.href = correctPortal;
    return;
  }

  if (!token) {
    window.location.href = signinRoute;
    return;
  }

  const onExpire = () => {
    localStorage.removeItem(tokenKey);
    window.location.href = signinRoute;
  };
  const client = createClient(token, onExpire);
  mountLogout(portal, tokenKey);
  if (portal === 'institution') {
    initInstitutionPortal(client, tokenKey);
    return;
  }
  initVendorPortal(client, tokenKey);
};

document.addEventListener('DOMContentLoaded', bootPortal);


