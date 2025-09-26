"use client";
import { useEffect, useState } from 'react'
import {
  useAppDispatch,
  useAppSelector,
  type RootState
} from '../../../lib/store'
import {
  fetchTickets,
  fetchTicketStats,
  createTicketThunk,
  deleteTicketThunk
} from '../../../lib/store/thunks/ticketThunks'
import type { CreateTicketData } from '../../../lib/api/tickets'

export default function TicketsPage() {
  const dispatch = useAppDispatch()
  const { tickets, isLoading, error, pagination, stats } = useAppSelector((s: RootState) => s.tickets)
  const auth = useAppSelector((s: RootState) => s.auth)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<Partial<CreateTicketData>>({
    taskId: '',
    title: '',
    description: '',
    notes: '',
    timeSpent: undefined,
  })

  useEffect(() => {
    dispatch(fetchTickets(undefined))
    dispatch(fetchTicketStats())
  }, [dispatch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'timeSpent' ? Number(value) : value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.taskId || !form.title || !form.description || !form.notes || !form.timeSpent) return
    await dispatch(createTicketThunk(form as CreateTicketData))
    setShowCreate(false)
    setForm({ taskId: '', title: '', description: '', notes: '', timeSpent: undefined })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this ticket?')) {
      await dispatch(deleteTicketThunk(id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Tickets</h1>
          {stats && (
            <p className="text-xs text-gray-500">Pending: {stats.pendingTickets} • Verified: {stats.verifiedTickets} • Rejected: {stats.rejectedTickets} • Closed: {stats.closedTickets}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchTickets(undefined))}
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
          >Refresh</button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500 disabled:opacity-50"
            disabled={!auth.isAuthenticated}
          >New Ticket</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {isLoading && <div className="text-sm text-gray-500">Loading tickets...</div>}
      {!isLoading && tickets.length === 0 && <div className="text-sm text-gray-500">No tickets found.</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map(t => (
          <div key={t._id} className="border rounded p-4 bg-white shadow-sm flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <a href={`/dashboard/tickets/${t._id}`} className="font-medium line-clamp-1 hover:underline">{t.title}</a>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 border capitalize">{(t as any).status}</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{t.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
              <button onClick={() => handleDelete(t._id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input name="taskId" placeholder="Task ID" value={form.taskId} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
              <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
              <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Resolution Notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
              <input name="timeSpent" type="number" step="0.1" placeholder="Time Spent (hrs)" value={form.timeSpent ?? ''} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
                <button
                  type="submit"
                  disabled={!form.taskId || !form.title || !form.description || !form.notes || !form.timeSpent}
                  className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded disabled:opacity-50"
                >Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center gap-4 pt-4">
          <button disabled={pagination.currentPage === 1} className="text-sm px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="text-xs text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
          <button disabled={!pagination.hasNextPage} className="text-sm px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
