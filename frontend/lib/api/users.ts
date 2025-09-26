import { apiClient, ApiResponse, PaginatedResponse } from './client'
import { User } from '../store/features/authSlice'

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: User['role']
  department?: string
  jobTitle?: string
  phone?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: User['role']
  department?: string
  jobTitle?: string
  phone?: string
  avatar?: string
  isActive?: boolean
}

export interface UserFilters {
  search?: string
  role?: string
  department?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const usersApi = {
  // User management (Admin only)
  getUsers: (filters?: UserFilters): Promise<PaginatedResponse<User>> =>
    apiClient.get('/users', filters as Record<string, string>),

  getUser: (id: string): Promise<ApiResponse<User>> =>
    apiClient.get(`/users/${id}`),

  createUser: (data: CreateUserData): Promise<ApiResponse<User>> =>
    apiClient.post('/users', data),

  updateUser: (id: string, data: UpdateUserData): Promise<ApiResponse<User>> =>
    apiClient.put(`/users/${id}`, data),

  deleteUser: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/users/${id}`),

  // User activation/deactivation
  activateUser: (id: string): Promise<ApiResponse<User>> =>
    apiClient.patch(`/users/${id}/activate`),

  deactivateUser: (id: string): Promise<ApiResponse<User>> =>
    apiClient.patch(`/users/${id}/deactivate`),

  // Role management
  updateUserRole: (id: string, role: User['role']): Promise<ApiResponse<User>> =>
    apiClient.patch(`/users/${id}/role`, { role }),

  // Avatar management
  uploadAvatar: (id: string, file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.upload(`/users/${id}/avatar`, formData)
  },

  deleteAvatar: (id: string): Promise<ApiResponse<User>> =>
    apiClient.delete(`/users/${id}/avatar`),

  // Password reset (Admin)
  resetUserPassword: (id: string, newPassword: string): Promise<ApiResponse> =>
    apiClient.post(`/users/${id}/reset-password`, { newPassword }),

  // User statistics
  getUserStats: (id: string): Promise<ApiResponse<{
    projectsCount: number
    tasksCount: number
    completedTasksCount: number
    ticketsCount: number
    resolvedTicketsCount: number
    avgTaskCompletionTime: number
    avgTicketResolutionTime: number
  }>> =>
    apiClient.get(`/users/${id}/stats`),

  // Bulk operations
  bulkUpdateUsers: (data: { ids: string[]; updates: UpdateUserData }): Promise<ApiResponse<User[]>> =>
    apiClient.put('/users/bulk', data),

  bulkDeleteUsers: (ids: string[]): Promise<ApiResponse> =>
    apiClient.post('/users/bulk/delete', { ids }),

  bulkActivateUsers: (ids: string[]): Promise<ApiResponse<User[]>> =>
    apiClient.post('/users/bulk/activate', { ids }),

  bulkDeactivateUsers: (ids: string[]): Promise<ApiResponse<User[]>> =>
    apiClient.post('/users/bulk/deactivate', { ids }),

  // Export users
  exportUsers: (filters?: UserFilters, format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    const params: Record<string, string> = { format }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = String(value)
        }
      })
    }
    return apiClient.get('/users/export', params)
  },

  // Team and collaboration
  getTeamMembers: (): Promise<ApiResponse<User[]>> =>
    apiClient.get('/users/team'),

  searchUsers: (query: string, limit: number = 10): Promise<ApiResponse<User[]>> =>
    apiClient.get('/users/search', { q: query, limit: String(limit) }),

  // Department management
  getDepartments: (): Promise<ApiResponse<string[]>> =>
    apiClient.get('/users/departments'),

  // Analytics
  getUserAnalytics: (filters?: Partial<UserFilters>): Promise<ApiResponse<{
    totalUsers: number
    activeUsers: number
    roleDistribution: Record<string, number>
    departmentDistribution: Record<string, number>
    activityMetrics: {
      dailyActiveUsers: number
      weeklyActiveUsers: number
      monthlyActiveUsers: number
    }
    registrationTrend: Array<{
      date: string
      registrations: number
    }>
  }>> => {
    const params: Record<string, string> = {}
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = String(value)
        }
      })
    }
    return apiClient.get('/users/analytics', params)
  },
}

export default usersApi