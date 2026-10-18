const tableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const dialog = document.getElementById('productDialog');
const form = document.getElementById('productForm');
const formError = document.getElementById('formError');
const toast = document.getElementById('toast');
let products = [];
let toastTimer;
let searchTimer;
let requestInProgress = false;

const categoryIcons = {
  'soft toys': '🧸', 'gift boxes': '🎁', flowers: '💐', 'greeting cards': '💌',
  jewellery: '💍', chocolates: '🍫', candles: '🕯️', accessories: '🎀'
};
const colourMap = {
  red: '#d85c62', 'rose red': '#c94b59', pink: '#e9a6bb', 'blush pink': '#e9a6bb',
  brown: '#9c704d', 'honey brown': '#b98b56', cream: '#e6d8b9', white: '#eeeae2',
  blue: '#81b7df', green: '#7eaa7a', black: '#55565c', purple: '#a48bd0', yellow: '#e8c65f'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
}
function iconFor(type) { return categoryIcons[String(type || '').toLowerCase()] || '🎁'; }
function colourFor(colour) { return colourMap[String(colour || '').toLowerCase()] || '#d9a58b'; }
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('toast-error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  let data = {};
  try { data = await response.json(); } catch (_) { /* response may be empty */ }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function loadProducts() {
  if (requestInProgress) return;
  requestInProgress = true;
  tableBody.innerHTML = '<tr><td colspan="6" class="loading-cell"><span class="spinner"></span> Loading your inventory...</td></tr>';
  try {
    products = await api('/products?search=' + encodeURIComponent(searchInput.value.trim()));
    renderProducts();
    setApiStatus(true);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="error-cell">Unable to load products. ${escapeHtml(error.message)}</td></tr>`;
    document.getElementById('resultLabel').textContent = 'Connection issue';
    document.getElementById('storeStatus').textContent = 'Offline';
    setApiStatus(false);
  } finally {
    requestInProgress = false;
  }
}
function setApiStatus(online) {
  const text = document.getElementById('apiStatusText');
  text.textContent = online ? 'System online' : 'Connection issue';
  text.closest('.system-status').classList.toggle('offline', !online);
  document.getElementById('storeStatus').textContent = online ? 'Connected' : 'Offline';
}
function renderProducts() {
  const total = products.length;
  const categoryCount = new Set(products.map(product => String(product.p_type).toLowerCase())).size;
  const average = total ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / total : 0;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('categoryCount').textContent = categoryCount;
  document.getElementById('averagePrice').textContent = money(Math.round(average));
  document.getElementById('productCountPill').textContent = `${total} ${total === 1 ? 'product' : 'products'}`;
  document.getElementById('sidebarProductCount').textContent = total;
  document.getElementById('resultLabel').textContent = `${total} ${total === 1 ? 'result' : 'results'}`;
  document.getElementById('tableFooterText').textContent = total ? `Showing ${total} ${total === 1 ? 'product' : 'products'}` : 'Your inventory is empty';
  document.getElementById('emptyState').hidden = total !== 0;
  document.querySelector('.table-wrap').hidden = total === 0;
  if (!total) { tableBody.innerHTML = ''; return; }

  tableBody.innerHTML = products.map((product, index) => `
    <tr class="product-row" style="--row-delay:${Math.min(index, 12) * 35}ms">
      <td><div class="product-cell"><span class="product-thumb">${iconFor(product.p_type)}</span><span class="product-info"><strong>${escapeHtml(product.p_name)}</strong><small>Gift item</small></span></div></td>
      <td><span class="id-badge">#${escapeHtml(product.p_id)}</span></td>
      <td><span class="category-badge">${escapeHtml(product.p_type)}</span></td>
      <td><span class="colour-value"><i style="--swatch:${colourFor(product.p_color)}"></i>${escapeHtml(product.p_color)}</span></td>
      <td><strong class="price-value">${money(product.price)}</strong></td>
      <td><div class="row-actions"><button class="action-button edit-action" type="button" data-edit="${Number(product.p_id)}" aria-label="Edit ${escapeHtml(product.p_name)}" title="Edit product"><span>✎</span> Edit</button><button class="action-button delete-action" type="button" data-delete="${Number(product.p_id)}" aria-label="Delete ${escapeHtml(product.p_name)}" title="Delete product">⌫</button></div></td>
    </tr>`).join('');
}
function openAdd() {
  form.reset();
  document.getElementById('productId').value = '';
  document.getElementById('dialogTitle').textContent = 'Add a new product';
  document.getElementById('saveButton').innerHTML = 'Save product <span>↗</span>';
  formError.textContent = '';
  dialog.showModal();
  document.getElementById('p_name').focus();
}
function openEdit(id) {
  const product = products.find(item => Number(item.p_id) === Number(id));
  if (!product) return;
  document.getElementById('productId').value = product.p_id;
  document.getElementById('p_name').value = product.p_name;
  document.getElementById('p_type').value = product.p_type;
  document.getElementById('price').value = product.price;
  document.getElementById('p_color').value = product.p_color;
  document.getElementById('dialogTitle').textContent = 'Edit product details';
  document.getElementById('saveButton').innerHTML = 'Save changes <span>↗</span>';
  formError.textContent = '';
  dialog.showModal();
  document.getElementById('p_name').focus();
}

['openAdd', 'openAddTop', 'emptyAdd'].forEach(id => document.getElementById(id).addEventListener('click', openAdd));
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
document.getElementById('cancelDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.getElementById('refreshBtn').addEventListener('click', () => loadProducts());
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadProducts(), 220);
});
// Convenience shortcut: Ctrl/Cmd + K focuses the inventory search.
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape' && dialog.open) dialog.close();
});

tableBody.addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) { openEdit(Number(editButton.dataset.edit)); return; }
  if (deleteButton) {
    const product = products.find(item => Number(item.p_id) === Number(deleteButton.dataset.delete));
    if (!product || !confirm(`Delete “${product.p_name}” from your inventory? This cannot be undone.`)) return;
    deleteButton.disabled = true;
    try {
      await api(`/products/${product.p_id}`, { method: 'DELETE' });
      showToast('Product deleted successfully.');
      await loadProducts();
    } catch (error) {
      showToast(error.message, true);
      deleteButton.disabled = false;
    }
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  formError.textContent = '';
  const id = document.getElementById('productId').value;
  const payload = {
    p_name: document.getElementById('p_name').value.trim(),
    p_type: document.getElementById('p_type').value.trim(),
    price: document.getElementById('price').value,
    p_color: document.getElementById('p_color').value.trim()
  };
  if (!payload.p_name || !payload.p_type || payload.price === '' || !payload.p_color) {
    formError.textContent = 'Please complete all required fields.';
    return;
  }
  if (!Number.isInteger(Number(payload.price)) || Number(payload.price) < 0) {
    formError.textContent = 'Enter a valid whole-number price (0 or higher).';
    return;
  }
  const saveButton = document.getElementById('saveButton');
  saveButton.disabled = true;
  saveButton.classList.add('is-saving');
  saveButton.textContent = id ? 'Updating…' : 'Saving…';
  try {
    await api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    dialog.close();
    showToast(id ? 'Product details updated.' : 'New product added to inventory.');
    await loadProducts();
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    saveButton.disabled = false;
    saveButton.classList.remove('is-saving');
    saveButton.innerHTML = id ? 'Save changes <span>↗</span>' : 'Save product <span>↗</span>';
  }
});

document.getElementById('themeBtn').addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  document.getElementById('themeBtn').textContent = dark ? '☀' : '☾';
  document.getElementById('themeBtn').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('sunshine-theme', dark ? 'dark' : 'light'); } catch (_) { /* storage may be disabled */ }
});
try {
  if (localStorage.getItem('sunshine-theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeBtn').textContent = '☀';
  }
} catch (_) { /* storage may be disabled */ }
loadProducts();
