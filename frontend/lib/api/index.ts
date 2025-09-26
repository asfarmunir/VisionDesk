// Export API client and utilities
export { apiClient, ApiError, handleApiError, tokenStorage } from './client'
export type { ApiResponse, PaginatedResponse } from './client'

// Import and export individual API services
import authApi from './auth'
import projectsApi from './projects'
import tasksApi from './tasks'
import ticketsApi from './tickets'
import usersApi from './users'
import analyticsApi from './analytics'

export { authApi, projectsApi, tasksApi, ticketsApi, usersApi, analyticsApi }

// Export API types
export type * from './auth'
export type * from './projects'
export type * from './tasks'
export type * from './tickets'
export type * from './users'
export type * from './analytics'

// Consolidated API object for convenience
const api = {
  auth: authApi,
  projects: projectsApi,
  tasks: tasksApi,
  tickets: ticketsApi,
  users: usersApi,
  analytics: analyticsApi,
}

export default api