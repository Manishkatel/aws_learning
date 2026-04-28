import { apiPost, apiGet, API_ENDPOINTS, refreshAccessToken } from './django-api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  interests?: string[];
  year_in_college?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  interests?: string[];
  year_in_college?: string;
  picture?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Login user and store JWT tokens
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);
  
  // Store tokens
  localStorage.setItem('django_access_token', response.access);
  localStorage.setItem('django_refresh_token', response.refresh);
  localStorage.setItem('django_user', JSON.stringify(response.user));
  
  return response;
}

/**
 * Signup new user
 */
export async function signupUser(data: SignupData): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>(API_ENDPOINTS.SIGNUP, data);
  
  // Store tokens
  localStorage.setItem('django_access_token', response.access);
  localStorage.setItem('django_refresh_token', response.refresh);
  localStorage.setItem('django_user', JSON.stringify(response.user));
  
  return response;
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('django_refresh_token');
    if (refreshToken) {
      await apiPost(API_ENDPOINTS.LOGOUT, { refresh: refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('django_access_token');
    localStorage.removeItem('django_refresh_token');
    localStorage.removeItem('django_user');
  }
}

/**
 * Get current user from local storage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('django_user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('django_access_token');
}

/**
 * Refresh token automatically
 */
export async function ensureAuthenticated(): Promise<boolean> {
  if (isAuthenticated()) return true;
  return await refreshAccessToken();
}

/**
 * Get user profile from API
 */
export async function getUserProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>(API_ENDPOINTS.USER_PROFILE);
}
