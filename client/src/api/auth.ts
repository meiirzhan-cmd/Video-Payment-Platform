import axios from 'axios';
import { API_URL } from '@/lib/constants';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/types';

// Separate axios instance for auth — no interceptor to avoid circular dependency
const authClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await authClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await authClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const res = await authClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  return res.data;
}
