import { createAsyncThunk } from '@reduxjs/toolkit'
import { ticketsApi, CreateTicketData, UpdateTicketData, VerifyTicketData, CloseTicketData, TicketFilters } from '../../api/tickets'
import { handleApiError } from '../../api/client'

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (filters: TicketFilters | undefined, { rejectWithValue }) => {
    try {
      const cleaned: Record<string, string> | undefined = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .reduce<Record<string, string>>((acc, [k, v]) => {
              acc[k] = typeof v === 'string' ? v : String(v)
              return acc
            }, {})
        : undefined
      return await ticketsApi.getTickets(cleaned as Record<string, string> | undefined)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await ticketsApi.getTicket(id)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const createTicketThunk = createAsyncThunk(
  'tickets/create',
  async (data: CreateTicketData, { rejectWithValue }) => {
    try {
      return await ticketsApi.createTicket(data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const updateTicketThunk = createAsyncThunk(
  'tickets/update',
  async ({ id, data }: { id: string; data: UpdateTicketData }, { rejectWithValue }) => {
    try {
      return await ticketsApi.updateTicket(id, data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const verifyTicketThunk = createAsyncThunk(
  'tickets/verify',
  async ({ id, data }: { id: string; data: VerifyTicketData }, { rejectWithValue }) => {
    try {
      return await ticketsApi.verifyTicket(id, data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const closeTicketThunk = createAsyncThunk(
  'tickets/close',
  async ({ id, data }: { id: string; data?: CloseTicketData }, { rejectWithValue }) => {
    try {
      return await ticketsApi.closeTicket(id, data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const deleteTicketThunk = createAsyncThunk(
  'tickets/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ticketsApi.deleteTicket(id)
      return id
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const fetchTicketStats = createAsyncThunk(
  'tickets/stats',
  async (_, { rejectWithValue }) => {
    try {
      return await ticketsApi.getStats()
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)
