import { signup } from './auth.js';

const form = document.getElementById('register-form');
const btn = document.getElementById('signup-btn');
const formError = document.getElementById('form-error');
const fieldErrors = {
  name: document.getElementById('name-error'),
  email: document.getElementById('email-error'),
  password: document.getElementById('password-error'),
  age: document.getElementById('age-error'),
};
const inputs = {
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  age: document.getElementById('age'),
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = {
    name: inputs.name.value.trim(),
    email: inputs.email.value.trim(),
    password: inputs.password.value,
    age: inputs.age.value ? Number(inputs.age.value) : undefined,
  };

  // Client-side validation
  let hasError = false;

  if (!data.name || data.name.length < 2) {
    setFieldError('name', 'Name must be at least 2 characters');
    hasError = true;
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    setFieldError('email', 'Valid email is required');
    hasError = true;
  }

  if (!data.password || data.password.length < 8 || data.password.length > 72) {
    setFieldError('password', 'Password must be 8-72 characters');
    hasError = true;
  }
  else if (!/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) {
    setFieldError('password', 'Password must contain at least one letter and one number');
    hasError = true;
  }

  if (hasError) return;

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    await signup(data.name, data.email, data.password, data.age);
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    if (err.statusCode === 422 && err.details) {
      for (const f of err.details) {
        setFieldError(f.field, f.message);
      }
    } else {
      formError.textContent = err.message || 'Signup failed';
      formError.hidden = false;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account';
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

inputs.name.addEventListener('input', () => clearFieldError('name'));
inputs.email.addEventListener('input', () => clearFieldError('email'));
inputs.password.addEventListener('input', () => clearFieldError('password'));
inputs.age.addEventListener('input', () => clearFieldError('age'));

function clearFieldError(field) {
  inputs[field].removeAttribute('aria-invalid');
  fieldErrors[field].textContent = '';
  fieldErrors[field].hidden = true;
}
