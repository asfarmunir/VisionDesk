import { apiClient, ApiResponse, PaginatedResponse } from './client'
import { Ticket } from '../store/features/ticketSlice'

export interface CreateTicketData {
  title: string
  description: string
  type: Ticket['type']
  priority: Ticket['priority']
  severity?: Ticket['severity']
  category: string
  project?: string
  tags?: string[]
  dueDate?: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: string
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: Ticket['status']
  assignedTo?: string
  resolvedDate?: string
  actualResolutionTime?: number
}

export interface TicketFilters {
  search?: string
  status?: string
  priority?: string
  type?: string
  severity?: string
  assignedTo?: string
  submittedBy?: string
  category?: string
  project?: string
  tags?: string[]
  dueDateFrom?: string
  dueDateTo?: string
  createdFrom?: string
  createdTo?: string
  overdue?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  groupBy?: string
}

export interface TicketComment {
  text: string
}

export const ticketsApi = {
  // CRUD operations
  getTickets: (filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> =>
    apiClient.get('/tickets', filters as Record<string, string>),

  getTicket: (id: string): Promise<ApiResponse<Ticket>> =>
    apiClient.get(`/tickets/${id}`),

  createTicket: (data: CreateTicketData): Promise<ApiResponse<Ticket>> =>
    apiClient.post('/tickets', data),

  updateTicket: (id: string, data: UpdateTicketData): Promise<ApiResponse<Ticket>> =>
    apiClient.put(`/tickets/${id}`, data),

  deleteTicket: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/tickets/${id}`),

  // Status management
  updateTicketStatus: (id: string, status: Ticket['status']): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/status`, { status }),

  resolveTicket: (id: string, resolution?: string): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/resolve`, { resolution }),

  reopenTicket: (id: string, reason?: string): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/reopen`, { reason }),

  closeTicket: (id: string, resolution?: string): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/close`, { resolution }),

  // Assignment management
  assignTicket: (id: string, userId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/assign`, { assignedTo: userId }),

  unassignTicket: (id: string): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/unassign`),

  // Comments
  addComment: (id: string, comment: TicketComment): Promise<ApiResponse<Ticket>> =>
    apiClient.post(`/tickets/${id}/comments`, comment),

  updateComment: (id: string, commentId: string, comment: TicketComment): Promise<ApiResponse<Ticket>> =>
    apiClient.put(`/tickets/${id}/comments/${commentId}`, comment),

  deleteComment: (id: string, commentId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.delete(`/tickets/${id}/comments/${commentId}`),

  // Watchers
  addWatcher: (id: string, userId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.post(`/tickets/${id}/watchers`, { userId }),

  removeWatcher: (id: string, userId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.delete(`/tickets/${id}/watchers/${userId}`),

  // Attachments
  uploadAttachment: (id: string, file: File): Promise<ApiResponse<Ticket>> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload(`/tickets/${id}/attachments`, formData)
  },

  deleteAttachment: (id: string, attachmentId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.delete(`/tickets/${id}/attachments/${attachmentId}`),

  // History and tracking
  getTicketHistory: (id: string): Promise<ApiResponse<Ticket['history']>> =>
    apiClient.get(`/tickets/${id}/history`),

  // Priority and severity management
  updatePriority: (id: string, priority: Ticket['priority']): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/priority`, { priority }),

  updateSeverity: (id: string, severity: Ticket['severity']): Promise<ApiResponse<Ticket>> =>
    apiClient.patch(`/tickets/${id}/severity`, { severity }),

  // Linking and relationships
  linkTickets: (id: string, linkedTicketId: string, relationship: 'blocks' | 'duplicate' | 'related'): Promise<ApiResponse<Ticket>> =>
    apiClient.post(`/tickets/${id}/links`, { linkedTicketId, relationship }),

  unlinkTickets: (id: string, linkedTicketId: string): Promise<ApiResponse<Ticket>> =>
    apiClient.delete(`/tickets/${id}/links/${linkedTicketId}`),

  // Bulk operations
  bulkUpdateTickets: (data: { ids: string[]; updates: Partial<Ticket> }): Promise<ApiResponse<Ticket[]>> =>
    apiClient.put('/tickets/bulk', data),

  bulkDeleteTickets: (ids: string[]): Promise<ApiResponse> =>
    apiClient.post('/tickets/bulk/delete', { ids }),

  bulkAssignTickets: (data: { ids: string[]; assignedTo: string }): Promise<ApiResponse<Ticket[]>> =>
    apiClient.post('/tickets/bulk/assign', data),

  bulkUpdateStatus: (data: { ids: string[]; status: Ticket['status'] }): Promise<ApiResponse<Ticket[]>> =>
    apiClient.post('/tickets/bulk/status', data),

  // Categories and tags
  getCategories: (): Promise<ApiResponse<string[]>> =>
    apiClient.get('/tickets/categories'),

  getTags: (): Promise<ApiResponse<string[]>> =>
    apiClient.get('/tickets/tags'),

  // Analytics and reporting
  getTicketAnalytics: (filters?: Partial<TicketFilters>): Promise<ApiResponse<{
    statusDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
    typeDistribution: Record<string, number>
    severityDistribution: Record<string, number>
    categoryDistribution: Record<string, number>
    resolutionMetrics: {
      avgResolutionTime: number
      totalTickets: number
      resolvedTickets: number
      overdueTickets: number
    }
    trendData: Array<{
      date: string
      created: number
      resolved: number
      closed: number
    }>
  }>> => {
    const params: Record<string, string> = {}
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
      })
    }
    return apiClient.get('/tickets/analytics', params)
  },

  // SLA and escalation
  getSLAStatus: (id: string): Promise<ApiResponse<{
    slaTarget: number
    timeSpent: number
    timeRemaining: number
    escalated: boolean
    escalationLevel: number
  }>> =>
    apiClient.get(`/tickets/${id}/sla`),

  escalateTicket: (id: string, reason: string): Promise<ApiResponse<Ticket>> =>
    apiClient.post(`/tickets/${id}/escalate`, { reason }),

  // Export and reporting
  exportTickets: (filters?: TicketFilters, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> => {
    const params: Record<string, string> = { format }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
      })
    }
    return apiClient.get('/tickets/export', params)
  },

  // My tickets
  getMyTickets: (filters?: Omit<TicketFilters, 'assignedTo'>): Promise<PaginatedResponse<Ticket>> => {
    const params: Record<string, string> = {}
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
      })
    }
    return apiClient.get('/tickets/my-tickets', params)
  },

  // Submitted tickets
  getSubmittedTickets: (filters?: Omit<TicketFilters, 'submittedBy'>): Promise<PaginatedResponse<Ticket>> => {
    const params: Record<string, string> = {}
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
      })
    }
    return apiClient.get('/tickets/submitted', params)
  },

  // Templates
  getTicketTemplates: (): Promise<ApiResponse<Array<{
    id: string
    name: string
    description: string
    template: Partial<CreateTicketData>
  }>>> =>
    apiClient.get('/tickets/templates'),

  createFromTemplate: (templateId: string, data: Partial<CreateTicketData>): Promise<ApiResponse<Ticket>> =>
    apiClient.post(`/tickets/templates/${templateId}/create`, data),
}

export default ticketsApi