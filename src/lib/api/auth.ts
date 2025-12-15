import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  // Login user
  async login(credentials: LoginRequest) {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  // Register new user
  async register(userData: RegisterRequest) {
    return api.post<AuthResponse>('/auth/register', userData);
  },

  // Get current user
  async me() {
    return api.get<{ user: User }>('/auth/me');
  },

  // Logout
  async logout() {
    return api.post<{ message: string }>('/auth/logout');
  },
};
