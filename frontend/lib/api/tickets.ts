import { apiClient } from './client'

// NOTE: Backend ticket status values differ from the current frontend slice.
// Backend uses: pending | verified | rejected | closed
// We'll type against backend here; slice alignment will follow in a later task.
export type BackendTicketStatus = 'pending' | 'verified' | 'rejected' | 'closed'

// Minimal ticket interface reflecting backend controller populated shape (subset for now)
// Minimal related user/task subset types to avoid 'any'
interface BackendUserRef { _id: string; name?: string; email?: string; role?: string }
interface BackendTaskRef { _id: string; title: string; description?: string; projectId?: string; status?: string }

export interface BackendTicket {
  _id: string
  taskId: BackendTaskRef
  title: string
  description: string
  notes?: string
  timeSpent?: number
  resolution?: string
  status: BackendTicketStatus
  resolvedBy?: BackendUserRef
  verifiedBy?: BackendUserRef
  verificationNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateTicketData {
  taskId: string
  title: string
  description: string
  notes?: string
  timeSpent?: number
  resolution?: string // defaults server-side to 'fixed'
}

export type UpdateTicketData = Partial<Omit<CreateTicketData, 'taskId'>>

export interface VerifyTicketData {
  status: Exclude<BackendTicketStatus, 'pending' | 'closed'> // 'verified' | 'rejected'
  verificationNotes?: string
}

export interface CloseTicketData { closureNotes?: string }

export interface TicketFilters {
  page?: number
  limit?: number
  status?: BackendTicketStatus | ''
  resolution?: string
  resolvedBy?: string
  taskId?: string
}

export interface TicketPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface TicketStats {
  totalTickets: number
  pendingTickets: number
  verifiedTickets: number
  rejectedTickets: number
  closedTickets: number
  avgTimeSpent: number
  totalTimeSpent: number
  resolutionBreakdown: Record<string, number>
}

export const ticketsApi = {
  getTickets: (filters?: TicketFilters): Promise<{ tickets: BackendTicket[]; pagination: TicketPagination }> =>
    apiClient.get('/tickets', filters as Record<string, string>),

  getTicket: (id: string): Promise<BackendTicket> =>
    apiClient.get(`/tickets/${id}`),

  createTicket: (data: CreateTicketData): Promise<BackendTicket> =>
    apiClient.post('/tickets', data),

  verifyTicket: (id: string, data: VerifyTicketData): Promise<BackendTicket> =>
    apiClient.put(`/tickets/${id}/verify`, data),

  updateTicket: (id: string, data: UpdateTicketData): Promise<BackendTicket> =>
    apiClient.put(`/tickets/${id}`, data),

  deleteTicket: (id: string): Promise<{ success: boolean | undefined }> =>
    apiClient.delete(`/tickets/${id}`),

  closeTicket: (id: string, data?: CloseTicketData): Promise<BackendTicket> =>
    apiClient.put(`/tickets/${id}/close`, data),

  getStats: (): Promise<TicketStats> =>
    apiClient.get('/tickets/stats')
}

export default ticketsApi