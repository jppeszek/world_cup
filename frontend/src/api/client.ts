import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle errors
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  register: (data: { token: string; email: string; nickname: string; password: string }) =>
    client.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) => client.post('/api/auth/login', data),
  logout: () => client.post('/api/auth/logout'),
  me: () => client.get('/api/auth/me'),

  // Matches
  getMatches: (params?: { status?: string; daysOffset?: number }) =>
    client.get('/api/matches', { params }),
  getMatch: (id: number) => client.get(`/api/matches/${id}`),

  // Predictions
  createPrediction: (data: {
    match_id: number;
    pred_home: number;
    pred_away: number;
    pred_winner?: 'home' | 'away';
  }) => client.post('/api/predictions', data),
  updatePrediction: (id: number, data: any) => client.put(`/api/predictions/${id}`, data),
  getUserPredictions: () => client.get('/api/predictions/me/predictions'),

  // Leaderboard
  getLeaderboard: () => client.get('/api/leaderboard'),
  getUserStats: () => client.get('/api/leaderboard/me/stats'),

  // Admin
  createInvite: (data: { email: string }) => client.post('/api/admin/invites', data),
  getInvites: () => client.get('/api/admin/invites'),
  importResults: () => client.post('/api/admin/import-results'),
};

export default client;
