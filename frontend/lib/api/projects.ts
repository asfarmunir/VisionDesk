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
  id?: string // some endpoints may return both id and _id
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
  progress?: number // backend may send numeric progress (even if derived)
  tags?: string[]
  tasks?: ProjectTask[] // optional tasks list if included
  // Virtual counts
  taskCount?: number
  completedTaskCount?: number
  // Mongoose timestamps
  createdAt: string
  updatedAt: string
}

// Minimal placeholder; expand when task schema is available
export interface ProjectTask {
  _id: string
  id?: string
  title: string
  description?: string
  status: 'open' | 'in-progress' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: 'bug' | 'feature' | 'enhancement' | 'maintenance' | 'documentation'
  projectId: string
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dueDate?: string
  startDate?: string
  completedDate?: string | null
  isOverdue?: boolean
  daysRemaining?: number
  createdAt?: string
  updatedAt?: string
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
    const resp = await apiClient.get<ProjectsListResponse>('/projects', {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 12),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
    })
    // Defensive normalization
    return {
      ...resp,
      projects: Array.isArray(resp.projects) ? resp.projects : [],
      pagination: resp.pagination
    }
  },
  async get(id: string): Promise<Project> {
    // Backend response shape: { success, data: { project: {...} } } OR sometimes direct
    const resp = await apiClient.get<{ project?: Project } | Project>(`/projects/${id}`)
    const project: Project = (resp as { project?: Project }).project || (resp as Project)
    if (project && !project.id) project.id = project._id
    return project
  },
  async create(payload: CreateProjectPayload): Promise<Project> {
    return apiClient.post<Project>('/projects', payload)
  },
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    return apiClient.put<Project>(`/projects/${id}`, payload)
  },
  async remove(id: string): Promise<null> { // backend returns success with null data on delete
    return apiClient.delete<null>(`/projects/${id}`)
  },
  async addTeamMember(id: string, userId: string, role: ProjectTeamMember['role']): Promise<Project> {
    // Backend: PUT /projects/:id/team-members { userId, role }
    return apiClient.put<Project>(`/projects/${id}/team-members`, { userId, role })
  }
}

export default projectsApi
