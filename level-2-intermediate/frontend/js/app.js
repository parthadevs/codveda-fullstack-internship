import {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  apiToggleProductStatus,
  fetchCategories,
  createCategory,
  logout,
  getMe,
} from "./api.js";
import { clearToken } from "./auth.js";

const productRows = document.getElementById("product-rows");
const resultCount = document.getElementById("result-count");
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const emptyState = document.getElementById("empty-state");
const tableWrap = document.getElementById("table-wrap");
const paginationNav = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const retryBtn = document.getElementById("retry-btn");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const categoryFilter = document.getElementById("category-filter");
const sortSelect = document.getElementById("sort-select");
const addProductBtn = document.getElementById("add-product-btn");
const emptyAddBtn = document.getElementById("empty-add-btn");
const openCategoryBtn = document.getElementById("create-category-btn");
const logoutBtn = document.getElementById("logout-btn");

const detailsDialog = document.getElementById("details-dialog");
const detailsTitle = document.getElementById("details-title");
const detailsBody = document.getElementById("details-body");
const detailsEditBtn = document.getElementById("details-edit-btn");
const detailsBadges = document.getElementById("details-badges");

const productDialog = document.getElementById("product-dialog");
const confirmDialog = document.getElementById("confirm-dialog");
const categoryDialog = document.getElementById("category-dialog");

const productForm = document.getElementById("product-form");
const dialogTitle = document.getElementById("dialog-title");
const formError = document.getElementById("form-error");
const saveBtn = document.getElementById("save-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
const toastContainer = document.getElementById("toast-container");

const categoryDialogError = document.getElementById("category-dialog-error");
const categoryNameInput = document.getElementById("category-name");
const categoryNameError = document.getElementById("category-name-error");
const createCategoryBtn = document.getElementById("category-dialog-submit-btn");
const categoryDialogCancelBtn = document.getElementById(
  "category-dialog-cancel-btn",
);

const fields = {
  name: document.getElementById("product-name"),
  sku: document.getElementById("product-sku"),
  price: document.getElementById("product-price"),
  stock: document.getElementById("product-stock"),
  description: document.getElementById("product-description"),
  category: document.getElementById("product-category"),
  isActive: document.getElementById("product-active"),
};

const fieldErrors = {
  name: document.getElementById("name-error"),
  sku: document.getElementById("sku-error"),
  price: document.getElementById("price-error"),
  stock: document.getElementById("stock-error"),
  description: document.getElementById("description-error"),
  categoryId: document.getElementById("category-error"),
};

const state = {
  products: [],
  categories: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  filters: {
    search: "",
    categoryId: "",
    isActive: "",
    sortBy: "createdAt",
    order: "desc",
  },
  editingId: null,
  isAdmin: false,
};

let loadInFlight = false;
let deleteTargetId = null;
let viewingProduct = null;

function showToast(message, type = "success") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setFieldError(field, message) {
  const input = field === "categoryId" ? fields.category : fields[field];
  const el = fieldErrors[field];
  if (!input || !el) return;
  if (message) {
    input.setAttribute("aria-invalid", "true");
    el.textContent = message;
    el.hidden = false;
  } else {
    input.removeAttribute("aria-invalid");
    el.textContent = "";
    el.hidden = true;
  }
}

function clearFormErrors() {
  Object.keys(fieldErrors).forEach((name) => setFieldError(name, ""));
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function isTruthyFlag(val) {
  return val === true || val === "true" || val === 1;
}

function statusBadgeHtml(isActive) {
  const active = isTruthyFlag(isActive);
  const cls = active ? "badge--active" : "badge--inactive";
  const label = active ? "Active" : "Inactive";
  return `<span class="badge ${cls}">${label}</span>`;
}

function stockMeterHtml(stock) {
  const count = Number(stock) || 0;
  const clamped = Math.max(0, Math.min(100, count));
  return `<meter class="stock-meter" min="0" max="100" low="10" high="40" optimum="100" value="${clamped}"></meter><span class="stock-count">${count}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function getCategoryName(categoryId) {
  if (!categoryId) return "—";
  const cat = state.categories.find((c) => String(c.id) === String(categoryId));
  return cat ? cat.name : String(categoryId);
}

function setPage(page) {
  state.pagination.page = page;
  loadProducts();
}

function setFilter(key, value) {
  state.filters[key] = value;
  state.pagination.page = 1;
  loadProducts();
}

function showView(viewId) {
  [loadingState, errorState, emptyState, tableWrap].forEach((el) => {
    if (el) el.hidden = true;
  });
  if (paginationNav && viewId !== "table-wrap") {
    paginationNav.hidden = true;
  }
  const target = document.getElementById(viewId);
  if (target) target.hidden = false;
}

function renderEmpty() {
  const hasFilters = Boolean(
    state.filters.search || state.filters.categoryId || state.filters.isActive,
  );
  const title = document.getElementById("empty-title");
  const text = document.getElementById("empty-text");
  if (title) {
    title.textContent = hasFilters
      ? "No products match your filters"
      : "No products yet";
  }
  if (text) {
    text.textContent = hasFilters
      ? "Clear the search or change filters to see more results."
      : "Add a product to get started.";
  }
  if (emptyAddBtn) emptyAddBtn.hidden = !state.isAdmin;
}

function renderTable() {
  const pag = state.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
  console.log(pag);
  resultCount.textContent = `${pag.total} product${pag.total === 1 ? "" : "s"}`;
  pageInfo.textContent = `Page ${pag.page} of ${Math.max(1, pag.pages)}`;
  prevPageBtn.disabled = pag.page <= 1;
  nextPageBtn.disabled = pag.page >= pag.pages;
  if (paginationNav) paginationNav.hidden = pag.pages <= 1;

  productRows.innerHTML = "";
  for (const product of state.products) {
    const active = isTruthyFlag(product.isActive);
    const categoryName = getCategoryName(product.categoryId);
    const tr = document.createElement("tr");
    if (!active) tr.classList.add("is-inactive");

    tr.innerHTML = `
      <td class="cell-name">
        <button type="button" class="link-btn product-name" data-action="view" data-id="${product.id}">${escapeHtml(product.name)}</button>
        <span class="product-desc" data-field="description">${escapeHtml(product.description)}</span>
      </td>
      <td data-label="SKU">
        <code class="sku-pill" data-field="sku">${escapeHtml(product.sku)}</code>
      </td>
      <td data-label="Category">
        ${
          categoryName !== "—"
            ? `<span class="cat-chip" data-field="category">${escapeHtml(categoryName)}</span>`
            : `<span class="muted">—</span>`
        }
      </td>
      <td data-label="Price" class="num price-cell" data-field="price">${formatPrice(product.price)}</td>
      <td data-label="Stock">
        <div class="stock">${stockMeterHtml(product.stock)}</div>
      </td>
      <td data-label="Status">
          <span class="status-cell">
            <span class="status-badge">${statusBadgeHtml(active)}</span>
            <span class="switch ${active ? "on" : "off"}" role="switch" aria-checked="${active}" data-action="toggle-status" data-id="${product.id}" data-admin-only${!state.isAdmin ? " hidden" : ""}>
              <span class="switch-thumb" aria-hidden="true"></span>
            </span>
          </span>
        </td>
      <td class="cell-actions">
        <div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="view" data-id="${product.id}">View</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="${product.id}" data-admin-only${!state.isAdmin ? " hidden" : ""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-action="delete" data-id="${product.id}" data-admin-only${!state.isAdmin ? " hidden" : ""}${!active ? " disabled" : ""}>Delete</button>
        </div>
      </td>
    `;
    productRows.appendChild(tr);
  }
}

async function loadProducts() {
  if (loadInFlight) return;
  loadInFlight = true;
  showView("loading-state");

  const page = state.pagination?.page ?? 1;
  const limit = state.pagination?.limit ?? 10;

  try {
    const allProduct = await fetchProducts({ ...state.filters, page, limit });
    const payload = allProduct.data || allProduct;
    state.products = payload.data || [];
    state.pagination = payload.pagination || {
      page,
      limit,
      total: 0,
      pages: 0,
    };

    if (!state.products.length) {
      resultCount.textContent = "0 products";
      showView("empty-state");
      renderEmpty();
    } else {
      showView("table-wrap");
      renderTable();
    }
  } catch (err) {
    console.error(err);
    showView("error-state");
    const msgEl = document.getElementById("error-message");
    if (msgEl)
      msgEl.textContent =
        err.message || "Could not load products. Please try again.";
    showToast(err.message || "Failed to load products", "error");
  } finally {
    loadInFlight = false;
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Product Details
async function openDetails(id) {
  const cached = state.products.find((p) => String(p.id) === String(id));
  if (cached) {
    renderDetails(cached);
  } else {
    detailsTitle.textContent = "Loading...";
    detailsBody.innerHTML = '<p class="muted">Loading product details...</p>';
  }
  detailsDialog.showModal();

  try {
    const res = await fetchProduct(id);
    const fresh = res.data || res;
    renderDetails(fresh);
  } catch (err) {
    if (!cached) {
      closeDetails();
      showToast(err.message || "Could not load product details", "error");
    }
  }
}

function renderDetails(product) {
  viewingProduct = product;
  const categoryName = getCategoryName(product.categoryId);
  const created = product.createdAt
    ? new Date(product.createdAt).toLocaleString()
    : "—";
  const updated = product.updatedAt
    ? new Date(product.updatedAt).toLocaleString()
    : "—";

  if (detailsBadges) {
    detailsBadges.innerHTML = `
      ${statusBadgeHtml(product.isActive)}
      ${categoryName !== "—" ? `<span class="cat-chip">${escapeHtml(categoryName)}</span>` : ""}
    `;
  }

  detailsTitle.textContent = product.name || "Product details";

  detailsBody.innerHTML = `
    <div class="details-hero">
      <div class="details-stat">
        <span class="details-stat_label">Price</span>
        <span class="details-stat_value">${formatPrice(product.price)}</span>
      </div>
      <div class="details-stat">
        <span class="details-stat-label">Inventory Stock</span>
        <div class="stock">${stockMeterHtml(product.stock)}</div>
      </div>
    </div>

    <dl class="details-grid">
      <div class="details-item">
        <dt>SKU</dt>
        <dd><code class="sku-pill">${escapeHtml(product.sku || "—")}</code></dd>
      </div>
      <div class="details-item">
        <dt>Product ID</dt>
        <dd><code class="sku-pill">${escapeHtml(String(product.id ?? "—"))}</code></dd>
      </div>
      <div class="details-item details-item--full">
        <dt>Description</dt>
        <dd class="details-desc">${escapeHtml(product.description || "No description provided.")}</dd>
      </div>
    </dl>
  `;
}

function closeDetails() {
  detailsDialog?.close();
  viewingProduct = null;
}

// add or edit product
function openDialog(product) {
  clearFormErrors();
  formError.hidden = true;

  if (product) {
    state.editingId = product.id;
    dialogTitle.textContent = "Edit product";
    fields.name.value = product.name || "";
    fields.sku.value = product.sku || "";
    fields.price.value = product.price ?? "";
    fields.stock.value = product.stock ?? "";
    fields.description.value = product.description || "";
    fields.category.value = product.categoryId || "";
    if (fields.isActive)
      fields.isActive.checked = isTruthyFlag(product.isActive);
  } else {
    state.editingId = null;
    dialogTitle.textContent = "Add product";
    productForm.reset();
    if (fields.isActive) fields.isActive.checked = true;
    fields.category.value = "";
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
  formError.hidden = true;

  const body = {
    name: fields.name.value.trim(),
    sku: fields.sku.value.trim().toUpperCase(),
    price: Number(fields.price.value),
    stock: Number(fields.stock.value),
    description: fields.description.value.trim() || null,
    categoryId: fields.category.value.trim() || null,
    ...(fields.isActive ? { isActive: fields.isActive.checked } : {}),
  };

  saveBtn.setAttribute("aria-busy", "true");
  saveBtn.disabled = true;

  try {
    if (state.editingId) {
      await updateProduct(state.editingId, body);
      showToast("Product updated");
    } else {
      await createProduct(body);
      showToast("Product created");
    }
    closeDialog();
    await loadProducts();
  } catch (err) {
    console.error(err);
    if (err.statusCode === 422 && Array.isArray(err.details)) {
      for (const fieldErr of err.details) {
        setFieldError(fieldErr.field, fieldErr.message);
      }
      formError.textContent = "Please fix the errors above.";
      formError.hidden = false;
    } else {
      formError.textContent = err.message || "Could not save product.";
      formError.hidden = false;
      showToast(err.message || "Save failed", "error");
    }
  } finally {
    saveBtn.removeAttribute("aria-busy");
    saveBtn.disabled = false;
  }
}

// delete product
function openConfirm(id) {
  deleteTargetId = id;
  confirmDialog.showModal();
}

function closeConfirm() {
  confirmDialog.close();
  deleteTargetId = null;
}

async function doDelete() {
  if (!deleteTargetId) return;
  confirmDeleteBtn.setAttribute("aria-busy", "true");
  confirmDeleteBtn.disabled = true;

  try {
    await deleteProduct(deleteTargetId);
    showToast("Product deleted");
    closeConfirm();
    await loadProducts();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Delete failed", "error");
  } finally {
    confirmDeleteBtn.removeAttribute("aria-busy");
    confirmDeleteBtn.disabled = false;
  }
}

// Toggle Status
async function handleToggleStatus(id) {
  const product = state.products.find((p) => String(p.id) === String(id));
  if (!product) return;

  const newActive = !isTruthyFlag(product.isActive);
  const btn = productRows.querySelector(
    `[data-action="toggle-status"][data-id="${id}"]`,
  );
  if (btn) {
    btn.setAttribute("aria-busy", "true");
    btn.style.pointerEvents = "none";
  }

  try {
    await apiToggleProductStatus(id, newActive);
    showToast(`Product ${newActive ? "activated" : "deactivated"}`);
    await loadProducts();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Status update failed", "error");
  } finally {
    if (btn) {
      btn.removeAttribute("aria-busy");
      btn.style.pointerEvents = "";
    }
  }
}

// lead categories
async function loadCategories(selectedId = null) {
  try {
    const response = await fetchCategories();
    state.categories = response.data || [];

    if (fields.category) {
      const current = selectedId ?? fields.category.value;
      fields.category.innerHTML = '<option value="">No category</option>';
      state.categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        fields.category.appendChild(opt);
      });
      fields.category.value = current;
    }

    if (categoryFilter) {
      const current = categoryFilter.value;
      categoryFilter.innerHTML = '<option value="">All categories</option>';
      state.categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        categoryFilter.appendChild(opt);
      });
      categoryFilter.value = current;
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function openCategoryDialog() {
  categoryDialogError.hidden = true;
  categoryNameError.hidden = true;
  categoryNameInput.removeAttribute("aria-invalid");
  categoryNameInput.value = "";
  categoryDialog.showModal();
  categoryNameInput.focus();
}

function closeCategoryDialog() {
  categoryDialog.close();
  categoryDialogError.hidden = true;
  categoryNameError.hidden = true;
  categoryNameInput.removeAttribute("aria-invalid");
  categoryNameInput.value = "";
}

async function handleCreateCategory() {
  const name = categoryNameInput.value.trim();
  categoryDialogError.hidden = true;
  categoryNameError.hidden = true;
  categoryNameInput.removeAttribute("aria-invalid");

  if (name.length < 2) {
    categoryNameInput.setAttribute("aria-invalid", "true");
    categoryNameError.textContent =
      "Category name must be at least 2 characters.";
    categoryNameError.hidden = false;
    return;
  }

  createCategoryBtn.setAttribute("aria-busy", "true");
  createCategoryBtn.disabled = true;

  try {
    const response = await createCategory({ name });
    const created = response.data || response;
    closeCategoryDialog();
    await loadCategories(created?.id ?? null);
    showToast("Category created");
  } catch (err) {
    console.error(err);
    categoryDialogError.textContent =
      err.message || "Failed to create category";
    categoryDialogError.hidden = false;
  } finally {
    createCategoryBtn.removeAttribute("aria-busy");
    createCategoryBtn.disabled = false;
  }
}

async function handleLogout() {
  try {
    await logout();
  } catch (err) {
    console.error(err);
  } finally {
    clearToken();
    window.location.href = "login.html";
  }
}

function setupEventListeners() {
  addProductBtn?.addEventListener("click", () => openDialog(null));
  emptyAddBtn?.addEventListener("click", () => openDialog(null));
  openCategoryBtn?.addEventListener("click", openCategoryDialog);
  logoutBtn?.addEventListener("click", handleLogout);

  searchInput?.addEventListener(
    "input",
    debounce((e) => setFilter("search", e.target.value.trim()), 300),
  );

  statusFilter?.addEventListener("change", (e) =>
    setFilter("isActive", e.target.value),
  );
  categoryFilter?.addEventListener("change", (e) =>
    setFilter("categoryId", e.target.value),
  );

  sortSelect?.addEventListener("change", (e) => {
    const [sortBy, order] = e.target.value.split(":");
    state.filters.sortBy = sortBy;
    setFilter("order", order);
  });

  prevPageBtn?.addEventListener("click", () =>
    setPage(state.pagination.page - 1),
  );
  nextPageBtn?.addEventListener("click", () =>
    setPage(state.pagination.page + 1),
  );
  retryBtn?.addEventListener("click", loadProducts);

  productDialog?.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", closeDialog);
  });

  productForm?.addEventListener("submit", saveProduct);
  confirmDeleteBtn?.addEventListener("click", doDelete);
  confirmCancelBtn?.addEventListener("click", closeConfirm);

  detailsDialog?.querySelectorAll("[data-close-details]").forEach((btn) => {
    btn.addEventListener("click", closeDetails);
  });
  detailsDialog?.addEventListener("click", (e) => {
    if (e.target === detailsDialog) closeDetails();
  });
  detailsEditBtn?.addEventListener("click", () => {
    const product = viewingProduct;
    closeDetails();
    if (product) openDialog(product);
  });

  productRows?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === "view") {
      openDetails(id);
    } else if (btn.dataset.action === "edit") {
      const product = state.products.find((p) => String(p.id) === String(id));
      if (product) openDialog(product);
    } else if (btn.dataset.action === "toggle-status") {
      handleToggleStatus(id);
    } else if (btn.dataset.action === "delete") {
      openConfirm(id);
    }
  });

  productDialog?.addEventListener("click", (e) => {
    if (e.target === productDialog) closeDialog();
  });
  confirmDialog?.addEventListener("click", (e) => {
    if (e.target === confirmDialog) closeConfirm();
  });
  categoryDialog?.addEventListener("click", (e) => {
    if (e.target === categoryDialog) closeCategoryDialog();
  });

  categoryDialogCancelBtn?.addEventListener("click", closeCategoryDialog);
  createCategoryBtn?.addEventListener("click", handleCreateCategory);
  categoryNameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateCategory();
    }
  });
}

async function init() {
  try {
    const response = await getMe();
    const user = response.data || response;
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-role").textContent = `(${user.role})`;
    document.getElementById("user-menu").hidden = false;

    state.isAdmin = user.role === "ADMIN";
    document.querySelectorAll("[data-admin-only]").forEach((el) => {
      el.hidden = !state.isAdmin;
    });

    await loadCategories();
    await loadProducts();
    setupEventListeners();
  } catch (err) {
    console.error(err);
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", init);
