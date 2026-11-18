import { API_BASE } from './config.js';
import { clearToken } from './auth.js';

const prefix = '/api/v1';

async function request(path, options = {}, retried = false) {
  const res = await fetch(`${API_BASE}${prefix}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (res.status === 401 && !retried && path !== '/auth/refresh') {
    const refreshRes = await fetch(`${API_BASE}${prefix}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      return request(path, options, true);
    }

    clearToken();
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.statusCode = res.status;
    err.details = data.errors;
    throw err;
  }

  return data;
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  const set = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    qs.set(key, String(value));
  };

  set('page', params.page);
  set('limit', params.limit);
  set('search', params.search);
  set('categoryId', params.categoryId);
  set('isActive', params.isActive);
  set('minPrice', params.minPrice);
  set('maxPrice', params.maxPrice);
  set('inStock', params.inStock);
  set('sortBy', params.sortBy);
  set('order', params.order);

  return qs.toString();
}

export async function fetchProducts(params = {}) {
  const qs = buildQuery(params);
  return request(`/products${qs ? `?${qs}` : ''}`);
}

export async function fetchProduct(id) {
  return request(`/products/${id}`);
}

export async function createProduct(body) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProduct(id, body) {
  return request(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export async function apiToggleProductStatus(id, isActive) {
  return request(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchCategories() {
  return request('/categories');
}

export async function createCategory(body) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCategory(id, body) {
  return request(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' });
}

export async function getMe() {
  return request('/auth/me');
}

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name, email, password, age) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, age }),
  });
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}