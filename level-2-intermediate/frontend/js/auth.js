import { login as apiLogin, signup as apiSignup, logout as apiLogout , getMe} from './api.js';

export async function login(email, password) {
  return apiLogin(email, password);
}

export async function signup(name, email, password, age) {
  return apiSignup(name, email, password, age);
}

export async function me() {
  return getMe();
}

export async function logout() {
  try {
    await apiLogout();
  } catch {
    // ignore errors on logout
  }
  clearToken();
  document.dispatchEvent(new Event('auth:change'));
}

export function setToken() {
  // Token is stored in HttpOnly cookie by backend, not accessible to JS
}

export function getToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
}

export function clearToken() {
  document.cookie = 'token=; path=/; max-age=0';
}

export function isAuthenticated() {
  return !!getToken();
}
