export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://konsulku-production.up.railway.app';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://konsulku-production.up.railway.app';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiCall('/api/profile', {
    method: 'PUT',
    body,
  });
};

export const createAppointment = (data) => {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiCall('/api/appointment', {
    method: 'POST',
    body,
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

export const acceptAppointment = (id) => {
  return apiCall(`/api/appointment/${id}/accept`, {
    method: 'PUT',
  });
};

export const completeAppointment = (id, catatan) => {
  return apiCall(`/api/appointment/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify({ catatan }),
  });
};

export const getMessages = (targetUserID) => {
  return apiCall(`/api/chat/${targetUserID}`, {
    method: 'GET',
  });
};

export const getChatContacts = () => {
  return apiCall(`/api/chat-contacts`, {
    method: 'GET',
  });
};

export const getNotifications = () => {
  return apiCall('/api/notification', {
    method: 'GET',
  });
};

export const markNotificationsAsRead = () => {
  return apiCall('/api/notification/read', {
    method: 'PUT',
  });
};

export const getDosenStats = () => {
  return apiCall('/api/stats/dosen', {
    method: 'GET',
  });
};

export const deleteMessage = (messageId) => {
  return apiCall(`/api/chat/${messageId}`, {
    method: 'DELETE',
  });
};

export const editMessage = (messageId, teks) => {
  return apiCall(`/api/chat/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ teks }),
  });
};

export const getAIAdvice = (topic, problem) => {
  return apiCall('/api/ai/advice', {
    method: 'POST',
    body: JSON.stringify({ topic, problem }),
  });
};

export const askSmartAssistant = (message) => {
  return apiCall('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

export const analyzeProposal = (file) => {
  const formData = new FormData();
  formData.append('proposal', file);
  
  return apiCall('/api/ai/analyze-proposal', {
    method: 'POST',
    body: formData,
  });
};

export const chatWithProposal = (fileName, fullText, question) => {
  return apiCall('/api/ai/chat-proposal', {
    method: 'POST',
    body: JSON.stringify({ fileName, fullText, question }),
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
