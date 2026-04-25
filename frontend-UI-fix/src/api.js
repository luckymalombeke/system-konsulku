export const API_BASE_URL = 'http://localhost:8081';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Terjadi kesalahan pada server');
  }

  return response.json();
};

export const login = (username, password, role) => {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
};

export const register = (data) => {
  return apiCall('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getProfile = () => {
  return apiCall('/api/profile', {
    method: 'GET',
  });
};

export const getDosenList = () => {
  return apiCall('/api/dosen', {
    method: 'GET',
  });
};

export const updateProfile = (data) => {
  return apiCall('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const getAppointments = () => {
  return apiCall('/api/appointment', {
    method: 'GET',
  });
};

export const getAppointmentByID = (id) => {
  return apiCall(`/api/appointment/${id}`, {
    method: 'GET',
  });
};

export const cancelAppointment = (id, alasan) => {
  return apiCall(`/api/appointment/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ alasan }),
  });
};

export const rejectAppointment = (id, alasan) => {
  return apiCall(`/api/appointment/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ alasan }),
  });
};

export const getMessages = (targetUserID) => {
  return apiCall(`/api/chat/${targetUserID}`, {
    method: 'GET',
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
