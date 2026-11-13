import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus as apiToggleProductStatus,
} from './api.js';

// DOM elements
const productRows = document.getElementById('product-rows');
const resultCount = document.getElementById('result-count');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyText = document.getElementById('empty-text');
const tableWrap = document.getElementById('table-wrap');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const retryBtn = document.getElementById('retry-btn');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const sortSelect = document.getElementById('sort-select');
const addProductBtn = document.getElementById('add-product-btn');
const emptyAddBtn = document.getElementById('empty-add-btn');

const productDialog = document.getElementById('product-dialog');
const confirmDialog = document.getElementById('confirm-dialog');
const productForm = document.getElementById('product-form');
const dialogTitle = document.getElementById('dialog-title');
const formError = document.getElementById('form-error');
const saveBtn = document.getElementById('save-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const toastContainer = document.getElementById('toast-container');

const fields = {
  name: document.getElementById('product-name'),
  sku: document.getElementById('product-sku'),
  price: document.getElementById('product-price'),
  stock: document.getElementById('product-stock'),
  description: document.getElementById('product-description'),
};

const fieldErrors = {
  name: document.getElementById('name-error'),
  sku: document.getElementById('sku-error'),
  price: document.getElementById('price-error'),
  stock: document.getElementById('stock-error'),
  description: document.getElementById('description-error'),
};

const views = [loadingState, errorState, emptyState, tableWrap];

const state = {
  products: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  filters: {
    search: '',
    category: '',
    isActive: '',
    sortBy: 'createdAt',
    order: 'desc',
  },
  editingId: null,
};

let latestRequestId = 0;

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
});

function formatPrice(value) {
  return priceFormatter.format(value);
}

function isTruthyFlag(value) {
  return value === true || value === 'true';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setBusy(button, busy) {
  if (busy) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }
  button.disabled = busy;
}

function setFieldError(name, message) {
  const input = fields[name];
  const errorEl = fieldErrors[name];
  if (!input || !errorEl) return;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
  errorEl.textContent = message || '';
  errorEl.hidden = !message;
}

function setFormError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function clearFormErrors() {
  Object.keys(fieldErrors).forEach((name) => setFieldError(name, ''));
  setFormError('');
}

function hasActiveFilters() {
  const { search, category, isActive } = state.filters;
  return Boolean(search || category || isActive !== '');
}


function setPage(page) {
  state.pagination.page = page;
  loadProducts();
}

function setFilters(updates) {
  Object.assign(state.filters, updates);
  state.pagination.page = 1;
  loadProducts();
}

// rendering
function showView(view) {
  for (const el of views) el.hidden = el !== view;
}

function renderEmpty() {
  const filtered = hasActiveFilters();
  emptyTitle.textContent = filtered ? 'No products match your filters' : 'No products yet';
  emptyText.textContent = filtered
    ? 'Clear the search or change filters to see more results.'
    : 'Add a product to get started.';
  emptyAddBtn.hidden = false;
}

function statusBadgeHtml(isActive) {
  const active = isTruthyFlag(isActive);
  const cls = active ? 'badge--active' : 'badge--inactive';
  const label = active ? 'Active' : 'Inactive';
  return `<span class="badge ${cls}">${label}</span>`;
}

function stockMeterHtml(stock) {
  const count = Number(stock) || 0;
  const value = Math.max(0, Math.min(100, count));
  return `
    <meter class="stock-meter" min="0" max="100" low="10" high="40" optimum="100" value="${value}"></meter>
    <span class="stock-count">${count}</span>
  `;
}

function buildRow(product) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="cell-name">
      <span class="product-name" data-field="name">${escapeHtml(product.name || '')}</span>
      <span class="product-desc" data-field="description">${escapeHtml(product.description || '')}</span>
    </td>
    <td data-label="SKU"><span class="sku" data-field="sku">${escapeHtml(product.sku || '')}</span></td>
    <td data-label="Price" class="num" data-field="price">${formatPrice(product.price)}</td>
    <td data-label="Stock">
      <div class="stock">${stockMeterHtml(product.stock)}</div>
    </td>
    <td data-label="Status"><span class="badge" data-field="status">${statusBadgeHtml(product.isActive)}</span></td>
    <td class="cell-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
      <label class="toggle-switch">
        <input type="checkbox" data-action="toggle-status" class="toggle-switch__input" ${isTruthyFlag(product.isActive) ? 'checked' : ''}>
        <span class="toggle-switch__slider"></span>
      </label>
      <button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-action="delete">Delete</button>
    </td>
  `;

  tr.querySelectorAll('[data-action]').forEach((btn) => {
    btn.dataset.id = product.id;
  });
  return tr;
}

function renderTable() {
  const { page, total, pages } = state.pagination;
  resultCount.textContent = `${total} product${total === 1 ? '' : 's'}`;
  pageInfo.textContent = `Page ${page} of ${Math.max(1, pages)}`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= pages;

  pagination.hidden = false;
  productRows.replaceChildren(...state.products.map(buildRow));
}

// data loading
async function loadProducts() {
  const requestId = ++latestRequestId;
  showView(loadingState);
  pagination.hidden = true;

  const { page, limit } = state.pagination;

  try {
    const data = await fetchProducts({ ...state.filters, page, limit });
    if (requestId !== latestRequestId) return;

    const serverPagination = data?.pagination || { page, limit, total: 0, pages: 0 };
    state.products = data?.data || [];
    state.pagination = {
      page: serverPagination.page,
      limit: serverPagination.limit,
      total: serverPagination.total,
      pages: serverPagination.pages,
    };

    if (!state.products.length) {
      pagination.hidden = true;
      showView(emptyState);
      renderEmpty();
    } else {
      showView(tableWrap);
      renderTable();
    }
  } catch (err) {
    if (requestId !== latestRequestId) return;
    console.error(err);
    pagination.hidden = true;
    showView(errorState);
    errorMessage.textContent = err.message || 'Could not load products. Please try again.';
    showToast(err.message || 'Failed to load products', 'error');
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// product dialog

function openDialog(product) {
  clearFormErrors();

  if (product) {
    state.editingId = product.id;
    dialogTitle.textContent = 'Edit product';
    fields.name.value = product.name || '';
    fields.sku.value = product.sku || '';
    fields.price.value = product.price ?? '';
    fields.stock.value = product.stock ?? '';
    fields.description.value = product.description || '';
  } else {
    state.editingId = null;
    dialogTitle.textContent = 'Add product';
    productForm.reset();
  }

  productDialog.showModal();
}

function closeDialog() {
  productDialog.close();
  state.editingId = null;
}

async function saveProduct(e) {
  e.preventDefault();
  clearFormErrors();

  const body = {
    name: fields.name.value.trim(),
    sku: fields.sku.value.trim().toUpperCase(),
    price: Number(fields.price.value),
    stock: Number(fields.stock.value),
    description: fields.description.value.trim() || null,
  };

  setBusy(saveBtn, true);

  try {
    if (state.editingId) {
      await updateProduct(state.editingId, body);
      showToast('Product updated');
    } else {
      await createProduct(body);
      showToast('Product created');
    }
    closeDialog();
    await loadProducts();
  } catch (err) {
    console.error(err);
    if (err.statusCode === 422 && err.details) {
      for (const fieldErr of err.details) {
        setFieldError(fieldErr.field, fieldErr.message);
      }
      setFormError('Please fix the errors above.');
    } else {
      setFormError(err.message || 'Could not save product.');
      showToast(err.message || 'Save failed', 'error');
    }
  } finally {
    setBusy(saveBtn, false);
  }
}

// delete confirmation

function openConfirm(id) {
  confirmDialog.dataset.id = id;
  confirmDialog.showModal();
}

function closeConfirm() {
  confirmDialog.close();
  delete confirmDialog.dataset.id;
}

async function doDelete() {
  const id = confirmDialog.dataset.id;
  if (!id) return;
  setBusy(confirmDeleteBtn, true);

  try {
    await deleteProduct(id);
    showToast('Product deleted');
    closeConfirm();
    if (state.products.length === 1 && state.pagination.page > 1) {
      state.pagination.page -= 1;
    }
    await loadProducts();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Delete failed', 'error');
  } finally {
    setBusy(confirmDeleteBtn, false);
  }
}

// events

addProductBtn.addEventListener('click', () => openDialog(null));
emptyAddBtn.addEventListener('click', () => openDialog(null));

searchInput.addEventListener('input', debounce((e) => {
  setFilters({ search: e.target.value.trim() });
}, 300));

statusFilter.addEventListener('change', (e) => {
  setFilters({ isActive: e.target.value });
});

sortSelect.addEventListener('change', (e) => {
  const [sortBy, order] = e.target.value.split(':');
  setFilters({ sortBy, order });
});

prevPageBtn.addEventListener('click', () => setPage(state.pagination.page - 1));
nextPageBtn.addEventListener('click', () => setPage(state.pagination.page + 1));

retryBtn.addEventListener('click', loadProducts);

productDialog.querySelectorAll('[data-close-dialog]').forEach((btn) => {
  btn.addEventListener('click', closeDialog);
});

productForm.addEventListener('submit', saveProduct);

confirmDeleteBtn.addEventListener('click', doDelete);
confirmCancelBtn.addEventListener('click', closeConfirm);


productRows.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit') {
    const product = state.products.find((p) => String(p.id) === id);
    if (product) openDialog(product);
  } else if (btn.dataset.action === 'delete') {
    openConfirm(id);
  }
});

productRows.addEventListener('change', async (e) => {
  const toggle = e.target.closest('[data-action="toggle-status"]');
  if (!toggle) return;

  const id = toggle.dataset.id;
  const newActive = toggle.checked;

  setBusy(toggle, true);
  try {
    await apiToggleProductStatus(id, newActive);
    showToast(`Product ${newActive ? 'activated' : 'deactivated'}`);
    await loadProducts();
  } catch (err) {
    console.error(err);
    toggle.checked = !newActive;
    showToast(err.message || 'Status update failed', 'error');
  } finally {
    setBusy(toggle, false);
  }
});

productDialog.addEventListener('click', (e) => {
  if (e.target === productDialog) closeDialog();
});
confirmDialog.addEventListener('click', (e) => {
  if (e.target === confirmDialog) closeConfirm();
});


loadProducts();