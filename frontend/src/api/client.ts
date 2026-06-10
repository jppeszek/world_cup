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
    // Don't redirect on 401 - let the app handle it
    // This prevents redirect loops during auth check
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  register: (data: { token: string; email: string; nickname: string; password: string }) =>
    client.post('/auth/register', data),
  login: (data: { email: string; password: string }) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),

  // Matches
  getMatches: (params?: { status?: string; daysOffset?: number }) =>
    client.get('/matches', { params }),
  getMatch: (id: number) => client.get(`/matches/${id}`),

  // Predictions
  createPrediction: (data: {
    match_id: number;
    pred_home: number;
    pred_away: number;
    pred_winner?: 'home' | 'away';
  }) => client.post('/predictions', data),
  updatePrediction: (id: number, data: any) => client.put(`/predictions/${id}`, data),
  getUserPredictions: () => client.get('/predictions/me/predictions'),

  // Leaderboard
  getLeaderboard: () => client.get('/leaderboard'),
  getUserStats: () => client.get('/leaderboard/me/stats'),

  // Admin
  createInvite: (data: { email: string }) => client.post('/admin/invites', data),
  getInvites: () => client.get('/admin/invites'),
  importResults: () => client.post('/admin/import-results'),
  setMatchScore: (matchId: number, data: { score_home?: number; score_away?: number; clear?: boolean }) =>
    client.put(`/admin/matches/${matchId}/score`, data),
  updateMatchTeams: (matchId: number, data: { team_home: string; team_away: string }) =>
    client.put(`/admin/matches/${matchId}/teams`, data),
};

export default client;
