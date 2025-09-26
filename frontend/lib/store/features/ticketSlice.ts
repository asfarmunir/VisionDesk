import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from './authSlice'

export interface Ticket {
  _id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'improvement' | 'task'
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'reopened'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  severity?: 'minor' | 'major' | 'critical' | 'blocker'
  category: string
  submittedBy: User
  assignedTo?: User
  resolvedBy?: User
  project?: {
    _id: string
    title: string
  }
  tags: string[]
  dueDate?: string
  resolvedDate?: string
  estimatedResolutionTime?: number
  actualResolutionTime?: number
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: string
  attachments: Array<{
    filename: string
    url: string
    uploadedAt: string
    uploadedBy: User
  }>
  comments: Array<{
    _id: string
    text: string
    author: User
    createdAt: string
    updatedAt: string
  }>
  history: Array<{
    action: string
    field: string
    oldValue: string
    newValue: string
    changedBy: User
    changedAt: string
  }>
  watchers: User[]
  createdAt: string
  updatedAt: string
}

export interface TicketsState {
  tickets: Ticket[]
  currentTicket: Ticket | null
  isLoading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    search: string
    status: string
    priority: string
    type: string
    severity: string
    assignedTo: string
    submittedBy: string
    category: string
    project: string
  }
  groupBy: 'status' | 'priority' | 'type' | 'assignee' | 'severity' | 'none'
  sortBy: 'createdAt' | 'priority' | 'dueDate' | 'title' | 'status'
  sortOrder: 'asc' | 'desc'
}

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    status: '',
    priority: '',
    type: '',
    severity: '',
    assignedTo: '',
    submittedBy: '',
    category: '',
    project: '',
  },
  groupBy: 'none',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setTickets: (state, action: PayloadAction<{ tickets: Ticket[]; pagination: TicketsState['pagination'] }>) => {
      state.tickets = action.payload.tickets
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    addTicket: (state, action: PayloadAction<Ticket>) => {
      state.tickets.unshift(action.payload)
    },
    updateTicket: (state, action: PayloadAction<Ticket>) => {
      const index = state.tickets.findIndex(t => t._id === action.payload._id)
      if (index !== -1) {
        state.tickets[index] = action.payload
      }
      if (state.currentTicket && state.currentTicket._id === action.payload._id) {
        state.currentTicket = action.payload
      }
    },
    deleteTicket: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter(t => t._id !== action.payload)
      if (state.currentTicket && state.currentTicket._id === action.payload) {
        state.currentTicket = null
      }
    },
    setCurrentTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.currentTicket = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<TicketsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    setGroupBy: (state, action: PayloadAction<TicketsState['groupBy']>) => {
      state.groupBy = action.payload
    },
    setSortBy: (state, action: PayloadAction<{ sortBy: TicketsState['sortBy']; sortOrder: TicketsState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },
    addComment: (state, action: PayloadAction<{ ticketId: string; comment: Ticket['comments'][0] }>) => {
      const ticket = state.tickets.find(t => t._id === action.payload.ticketId)
      if (ticket) {
        ticket.comments.push(action.payload.comment)
      }
      if (state.currentTicket && state.currentTicket._id === action.payload.ticketId) {
        state.currentTicket.comments.push(action.payload.comment)
      }
    },
    addWatcher: (state, action: PayloadAction<{ ticketId: string; user: User }>) => {
      const ticket = state.tickets.find(t => t._id === action.payload.ticketId)
      if (ticket && !ticket.watchers.find(w => w._id === action.payload.user._id)) {
        ticket.watchers.push(action.payload.user)
      }
      if (state.currentTicket && state.currentTicket._id === action.payload.ticketId && 
          !state.currentTicket.watchers.find(w => w._id === action.payload.user._id)) {
        state.currentTicket.watchers.push(action.payload.user)
      }
    },
    removeWatcher: (state, action: PayloadAction<{ ticketId: string; userId: string }>) => {
      const ticket = state.tickets.find(t => t._id === action.payload.ticketId)
      if (ticket) {
        ticket.watchers = ticket.watchers.filter(w => w._id !== action.payload.userId)
      }
      if (state.currentTicket && state.currentTicket._id === action.payload.ticketId) {
        state.currentTicket.watchers = state.currentTicket.watchers.filter(w => w._id !== action.payload.userId)
      }
    },
    addHistoryEntry: (state, action: PayloadAction<{ ticketId: string; entry: Ticket['history'][0] }>) => {
      const ticket = state.tickets.find(t => t._id === action.payload.ticketId)
      if (ticket) {
        ticket.history.push(action.payload.entry)
      }
      if (state.currentTicket && state.currentTicket._id === action.payload.ticketId) {
        state.currentTicket.history.push(action.payload.entry)
      }
    },
    clearError: (state) => {
      state.error = null
    }
  },
})

export const {
  setLoading,
  setError,
  setTickets,
  addTicket,
  updateTicket,
  deleteTicket,
  setCurrentTicket,
  setFilters,
  clearFilters,
  setGroupBy,
  setSortBy,
  addComment,
  addWatcher,
  removeWatcher,
  addHistoryEntry,
  clearError
} = ticketSlice.actions

export default ticketSlice.reducer