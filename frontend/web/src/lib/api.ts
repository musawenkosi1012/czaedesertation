import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

// Interceptor to add auth token and handle redirects
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export async function registerUser(payload: {
  username: string;
  password: string;
  name: string;
  phone_number: string;
  national_id: string;
  date_of_birth: string;
  location: string;
  employment_type: string;
}) {
  return (await api.post('/auth/register', payload)).data;
}

export async function getMyProfile() {
  return (await api.get('/borrowers/me')).data;
}

export async function applyForLoan(payload: {
  amount: number;
  interest_rate: number;
  duration_days: number;
}) {
  return (await api.post('/loans/apply', payload)).data;
}

export function decodeTokenPayload(token: string): { sub: string; role: string; borrower_id: number | null } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default api;
