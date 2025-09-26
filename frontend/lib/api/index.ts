// Export API client and utilities
export { apiClient, ApiError, handleApiError, tokenStorage } from './client'
export type { ApiResponse, PaginatedResponse } from './client'

// Import and export individual API services
import authApi from './auth'
import projectsApi from './projects'

export { authApi, projectsApi }

// Export API types
export type * from './auth'
export type * from './projects'

// Consolidated API object for convenience
const api = {
  auth: authApi,
  projects: projectsApi,
}

export default api