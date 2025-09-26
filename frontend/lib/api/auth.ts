import { apiClient } from './client'
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
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface TokenValidationResponse {
  valid: boolean
  user: User
}

export const authApi = {
  // Authentication
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    apiClient.post('/auth/login', credentials),

  register: (data: RegisterData): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout'),

  // Profile management
  getProfile: (): Promise<User> =>
    apiClient.get('/auth/profile'),

  updateProfile: (data: Partial<User>): Promise<User> =>
    apiClient.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
    apiClient.put('/auth/change-password', data),

  // Password reset
  forgotPassword: (email: string): Promise<void> =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }): Promise<void> =>
    apiClient.post('/auth/reset-password', data),

  // Email verification
  verifyEmail: (token: string): Promise<void> =>
    apiClient.post('/auth/verify-email', { token }),

  resendVerification: (): Promise<void> =>
    apiClient.post('/auth/resend-verification'),

  // Token validation
  validateToken: (): Promise<TokenValidationResponse> =>
    apiClient.get('/auth/verify'),
}

export default authApi