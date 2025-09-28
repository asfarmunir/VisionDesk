import { apiClient } from './client'

export interface UserSummary {
  _id: string
  name: string
  email: string
  role: string
  isActive?: boolean
  createdAt?: string
}

export interface UsersPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface UsersListResponse {
  users: UserSummary[]
  pagination: UsersPagination
}

export interface FetchUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: string
}

export const usersApi = {
  async list(params: FetchUsersParams = {}): Promise<UsersListResponse> {
    return apiClient.get<UsersListResponse>('/users', {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      ...(params.search ? { search: params.search } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.isActive !== undefined && params.isActive !== '' ? { isActive: params.isActive } : {})
    })
  },
  async assignRole(id: string, role: 'admin' | 'moderator' | 'user'): Promise<UserSummary> {
    return apiClient.put<UserSummary>(`/users/${id}/role`, { role })
  }
}

export default usersApi
