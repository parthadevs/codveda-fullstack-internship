import { API_BASE } from './config.js';
const prefix = '/api/v1';
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${prefix}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await res.json();
    console.log(data);
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.statusCode = res.status;
    err.details = data.errors;
    throw err;
  }
  return data.data;
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
  set('category', params.category);
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

export async function toggleProductStatus(id, isActive) {
  return request(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}