import { login } from './auth.js';

const form = document.getElementById('login-form');
const btn = document.getElementById('login-btn');
const formError = document.getElementById('form-error');
const fieldErrors = {
  email: document.getElementById('email-error'),
  password: document.getElementById('password-error'),
};
const inputs = {
  email: document.getElementById('email'),
  password: document.getElementById('password'),
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email = inputs.email.value.trim();
  const password = inputs.password.value;

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    await login(email, password);
    window.location.href = 'index.html';
  } catch (err) {
    console.error(err);
    if (err.statusCode === 422 && err.details) {
      for (const f of err.details) {
        setFieldError(f.field, f.message);
      }
    } else {
      formError.textContent = err.message || 'Login failed';
      formError.hidden = false;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

function setFieldError(field, message) {
  const input = inputs[field];
  const el = fieldErrors[field];
  if (!input || !el) return;
  input.setAttribute('aria-invalid', 'true');
  el.textContent = message;
  el.hidden = false;
}

function clearErrors() {
  formError.hidden = true;
  formError.textContent = '';
  for (const field of Object.keys(inputs)) {
    inputs[field].removeAttribute('aria-invalid');
    fieldErrors[field].textContent = '';
    fieldErrors[field].hidden = true;
  }
}

inputs.email.addEventListener('input', () => clearFieldError('email'));
inputs.password.addEventListener('input', () => clearFieldError('password'));

function clearFieldError(field) {
  inputs[field].removeAttribute('aria-invalid');
  fieldErrors[field].textContent = '';
  fieldErrors[field].hidden = true;
}
