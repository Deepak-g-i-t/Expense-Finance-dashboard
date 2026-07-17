import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, Edit3, Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Reminder, ReminderPriority, ReminderRepeat, ReminderStatus } from '../types'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'
import DatePicker from '../components/DatePicker'

const today = format(new Date(), 'yyyy-MM-dd')
const defaultForm = {
  title: '', description: '', amount: '', due_date: today, reminder_date: today,
  priority: 'medium' as ReminderPriority, repeat: 'one_time' as ReminderRepeat, status: 'pending' as ReminderStatus
}

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }
const STATUS_ICONS: Record<string, any> = {
  pending: <Clock size={16} color="#f59e0b" />,
  completed: <CheckCircle2 size={16} color="#22c55e" />,
  overdue: <AlertCircle size={16} color="#ef4444" />
}

export default function RemindersPage() {
  const { account } = useAuthStore()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [filterStatus, setFilterStatus] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filterStatus ? { status: filterStatus } : {})
      const { data } = await api.get(`/reminders?${params}`)
      // Auto-mark overdue
      const now = new Date()
      setReminders(data.map((r: Reminder) => ({
        ...r,
        status: r.status === 'pending' && new Date(r.due_date) < now ? 'overdue' : r.status
      })))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [filterStatus])

  const openEdit = (rem: Reminder) => {
    setForm({
      title: rem.title, description: rem.description || '', amount: rem.amount ? String(rem.amount) : '',
      due_date: rem.due_date, reminder_date: rem.reminder_date, priority: rem.priority,
      repeat: rem.repeat, status: rem.status
    })
    setEditingId(rem.id); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    try {
      const payload = { ...form, amount: form.amount ? parseFloat(form.amount) : undefined, description: form.description || undefined }
      if (editingId) { await api.put(`/reminders/${editingId}`, payload); toast.success('Reminder updated!') }
      else { await api.post('/reminders', payload); toast.success('Reminder set!') }
      setShowModal(false); fetch()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reminder?')) return
    try { await api.delete(`/reminders/${id}`); toast.success('Deleted'); fetch() }
    catch { toast.error('Failed') }
  }

  const markComplete = async (rem: Reminder) => {
    try {
      await api.put(`/reminders/${rem.id}`, { status: 'completed' })
      toast.success('Marked as completed!')
      fetch()
    } catch { toast.error('Failed') }
  }

  const currency = account?.currency || '₹'
  const pending = reminders.filter(r => r.status === 'pending').length
  const overdue = reminders.filter(r => r.status === 'overdue').length
  const completed = reminders.filter(r => r.status === 'completed').length

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Reminders</h1>
            <p className="page-subtitle">{pending} pending · {overdue} overdue · {completed} completed</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditingId(null); setShowModal(true) }}>
            <Plus size={16} /> Add Reminder
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Status filter tabs */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div className="tab-nav">
            {[
              { value: '', label: 'All' },
              { value: 'pending', label: `Pending (${pending})` },
              { value: 'overdue', label: `Overdue (${overdue})` },
              { value: 'completed', label: `Completed (${completed})` },
            ].map(f => (
              <button key={f.value} className={`tab-btn ${filterStatus === f.value ? 'active' : ''}`}
                onClick={() => setFilterStatus(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : reminders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>No reminders found</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Add reminders for bills, EMIs, subscriptions</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map((rem) => {
              const isOverdue = rem.status === 'overdue'
              const isCompleted = rem.status === 'completed'
              return (
                <motion.div key={rem.id} className="card"
                  style={{ opacity: isCompleted ? 0.6 : 1, border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ marginTop: 2 }}>{STATUS_ICONS[rem.status]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isOverdue ? '#ef4444' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none' }}>
                          {rem.title}
                        </div>
                        <span className="badge" style={{
                          background: `${PRIORITY_COLORS[rem.priority]}22`,
                          color: PRIORITY_COLORS[rem.priority]
                        }}>{rem.priority}</span>
                        <span className="badge badge-neutral">{rem.repeat.replace('_', ' ')}</span>
                      </div>
                      {rem.description && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{rem.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Due: </span>
                          <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-primary)', fontWeight: 600 }}>{rem.due_date}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Remind: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{rem.reminder_date}</span>
                        </div>
                        {rem.amount && (
                          <div style={{ fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Amount: </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currency}{rem.amount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      {!isCompleted && (
                        <button className="btn btn-sm btn-success" onClick={() => markComplete(rem)} title="Mark Complete">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      <button className="btn btn-icon btn-secondary" onClick={() => openEdit(rem)}><Edit3 size={13} /></button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDelete(rem.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 560 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingId ? 'Edit Reminder' : 'Add Reminder'}</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Title *</label>
                    <input className="input" placeholder="e.g. Electricity Bill, Credit Card Due"
                      value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea className="input" rows={2} placeholder="Optional details..."
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (Optional)</label>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <CustomSelect
                      value={form.priority}
                      onChange={v => setForm(f => ({ ...f, priority: v as ReminderPriority }))}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' }
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <DatePicker
                      value={form.due_date}
                      onChange={v => setForm(f => ({ ...f, due_date: v }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remind Me On</label>
                    <DatePicker
                      value={form.reminder_date}
                      onChange={v => setForm(f => ({ ...f, reminder_date: v }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Repeat</label>
                    <CustomSelect
                      value={form.repeat}
                      onChange={v => setForm(f => ({ ...f, repeat: v as ReminderRepeat }))}
                      options={[
                        { value: 'one_time', label: 'One Time' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'yearly', label: 'Yearly' }
                      ]}
                    />
                  </div>
                  {editingId && (
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <CustomSelect
                        value={form.status}
                        onChange={v => setForm(f => ({ ...f, status: v as ReminderStatus }))}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'overdue', label: 'Overdue' }
                        ]}
                      />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Add Reminder'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
