// Export API client and utilities
export { apiClient, ApiError, handleApiError, tokenStorage } from './client'
export type { ApiResponse, PaginatedResponse } from './client'

// Import and export individual API services
import authApi from './auth'

export { authApi }

// Export API types
export type * from './auth'

// Consolidated API object for convenience
const api = {
  auth: authApi,
}

export default api