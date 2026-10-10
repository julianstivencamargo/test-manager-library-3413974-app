const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getUserRole() {
  return localStorage.getItem('role') || '';
}

export function setUserRole(role) {
  if (role) {
    localStorage.setItem('role', role);
  } else {
    localStorage.removeItem('role');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Error en la solicitud');
    error.code = data?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    error.details = data?.details || [];
    throw error;
  }

  return data;
}
