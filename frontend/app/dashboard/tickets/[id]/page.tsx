"use client";
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  useAppDispatch,
  useAppSelector,
  type RootState
} from '../../../../lib/store'
import {
  fetchTicketById,
  updateTicketThunk,
  verifyTicketThunk,
  closeTicketThunk,
  deleteTicketThunk
} from '../../../../lib/store/thunks/ticketThunks'

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { currentTicket, isLoading, error } = useAppSelector((s: RootState) => s.tickets)
  const auth = useAppSelector((s: RootState) => s.auth)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', notes: '', timeSpent: '', resolution: '' })
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected'>('verified')
  const [verificationNotes, setVerificationNotes] = useState('')
  const [closureNotes, setClosureNotes] = useState('')

  useEffect(() => {
    if (id) dispatch(fetchTicketById(id))
  }, [id, dispatch])

  useEffect(() => {
    if (currentTicket) {
      setForm({
        title: currentTicket.title,
        description: currentTicket.description,
        notes: (currentTicket as any).notes || '',
        timeSpent: ((currentTicket as any).timeSpent ?? '').toString(),
        resolution: (currentTicket as any).resolution || ''
      })
    }
  }, [currentTicket])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTicket) return
    await dispatch(updateTicketThunk({ id: currentTicket._id, data: {
      title: form.title,
      description: form.description,
      notes: form.notes,
      timeSpent: form.timeSpent ? Number(form.timeSpent) : undefined,
      resolution: form.resolution || undefined
    }}))
    setEdit(false)
  }

  const handleVerify = async () => {
    if (!currentTicket) return
    await dispatch(verifyTicketThunk({ id: currentTicket._id, data: { status: verifyStatus, verificationNotes } }))
    setVerificationNotes('')
  }

  const handleClose = async () => {
    if (!currentTicket) return
    await dispatch(closeTicketThunk({ id: currentTicket._id, data: { closureNotes } }))
    setClosureNotes('')
  }

  const handleDelete = async () => {
    if (!currentTicket) return
    if (confirm('Delete this ticket?')) {
      await dispatch(deleteTicketThunk(currentTicket._id))
      router.push('/dashboard/tickets')
    }
  }

  if (isLoading && !currentTicket) return <div className="p-6 text-sm text-gray-500">Loading ticket...</div>
  if (error && !currentTicket) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!currentTicket) return null

  const status = (currentTicket as any).status as string
  const canVerify = status === 'pending' && (auth.user?.role === 'moderator' || auth.user?.role === 'admin')
  const canClose = status === 'verified' && (auth.user?.role === 'moderator' || auth.user?.role === 'admin')

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{currentTicket.title}</h1>
          <p className="text-xs text-gray-500">Status: <span className="capitalize font-medium">{status}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEdit(e => !e)} className="px-3 py-1.5 text-sm border rounded">{edit ? 'Cancel' : 'Edit'}</button>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm border rounded text-red-600">Delete</button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <input name="title" disabled={!edit} value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea name="description" disabled={!edit} value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm h-28 disabled:bg-gray-50" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Resolution Notes</label>
              <textarea name="notes" disabled={!edit} value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm h-24 disabled:bg-gray-50" />
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">Time Spent (hrs)</label>
                <input name="timeSpent" type="number" step="0.1" disabled={!edit} value={form.timeSpent} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Resolution Type</label>
                <input name="resolution" placeholder="fixed / duplicate / ..." disabled={!edit} value={form.resolution} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50" />
              </div>
            </div>
          </div>
        </div>
        {edit && (
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500">Save Changes</button>
          </div>
        )}
      </form>

      {(canVerify || canClose) && (
        <div className="space-y-6 border-t pt-6">
          {canVerify && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Verify Ticket</h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1">
                  <input type="radio" name="verifyStatus" value="verified" checked={verifyStatus === 'verified'} onChange={() => setVerifyStatus('verified')} /> Verified
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="verifyStatus" value="rejected" checked={verifyStatus === 'rejected'} onChange={() => setVerifyStatus('rejected')} /> Rejected
                </label>
              </div>
              <textarea
                placeholder="Verification notes (optional)"
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm h-24"
              />
              <button onClick={handleVerify} className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-500">Submit Verification</button>
            </div>
          )}
          {canClose && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Close Ticket</h2>
              <textarea
                placeholder="Closure notes (optional)"
                value={closureNotes}
                onChange={e => setClosureNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm h-24"
              />
              <button onClick={handleClose} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-500">Close Ticket</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
