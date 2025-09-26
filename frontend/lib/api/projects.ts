import { apiClient } from './client'

export interface ProjectTeamMember {
  user: {
    _id: string
    name: string
    email: string
    role: string
  }
  role: 'lead' | 'developer' | 'tester' | 'designer'
  joinedAt: string
}

// NOTE: This reflects the current backend Mongoose schema (Project.js)
// Only fields defined in schema or provided via timestamps/virtuals are present.
// Virtuals: taskCount, completedTaskCount
export interface Project {
  _id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdBy: {
    _id: string
    name: string
    email: string
    role: string
  }
  teamMembers: ProjectTeamMember[]
  startDate?: string // schema default Date.now
  completedDate?: string | null
  // Virtual counts
  taskCount?: number
  completedTaskCount?: number
  // Mongoose timestamps
  createdAt: string
  updatedAt: string
}

export interface ProjectsPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
  pageSize?: number
}

export interface ProjectsListResponse {
  projects: Project[]
  pagination: ProjectsPagination
}

export interface FetchProjectsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
}

export interface CreateProjectPayload {
  title: string
  description: string
  priority?: Project['priority']
}

export interface UpdateProjectPayload {
  title?: string
  description?: string
  status?: Project['status']
  priority?: Project['priority']
}

export const projectsApi = {
  async list(params: FetchProjectsParams = {}): Promise<ProjectsListResponse> {
    return apiClient.get<ProjectsListResponse>('/projects', {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 12),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
    })
  },
  async create(payload: CreateProjectPayload): Promise<Project> {
    return apiClient.post<Project>('/projects', payload)
  },
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    return apiClient.put<Project>(`/projects/${id}`, payload)
  },
  async remove(id: string): Promise<null> { // backend returns success with null data on delete
    return apiClient.delete<null>(`/projects/${id}`)
  }
}

export default projectsApi
