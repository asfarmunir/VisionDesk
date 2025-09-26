import { apiClient, ApiResponse } from './client'
import { User } from '../store/features/authSlice'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  // Authentication
  login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/login', credentials),

  register: (data: RegisterData): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/register', data),

  logout: (): Promise<ApiResponse> =>
    apiClient.post('/auth/logout'),

  // Profile management
  getProfile: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/profile'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> =>
    apiClient.put('/auth/change-password', data),

  // Password reset
  forgotPassword: (email: string): Promise<ApiResponse> =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }): Promise<ApiResponse> =>
    apiClient.post('/auth/reset-password', data),

  // Email verification
  verifyEmail: (token: string): Promise<ApiResponse> =>
    apiClient.post('/auth/verify-email', { token }),

  resendVerification: (): Promise<ApiResponse> =>
    apiClient.post('/auth/resend-verification'),

  // Token validation
  validateToken: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/validate'),
}

export default authApi