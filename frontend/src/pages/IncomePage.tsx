import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, Edit3, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Income } from '../types'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'
import DatePicker from '../components/DatePicker'

const INCOME_SOURCES = ['Salary', 'Freelancing', 'Refund', 'Gift', 'Interest', 'Scholarship', 'Other']

const defaultForm = {
  amount: '', source: 'Salary', description: '', notes: '',
  date: format(new Date(), 'yyyy-MM-dd'), time: format(new Date(), 'HH:mm')
}

export default function IncomePage() {
  const { account } = useAuthStore()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [submitting, setSubmitting] = useState(false)

  const fetchIncomes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '15', sort_by: sortBy, ...(search && { search }) })
      const { data } = await api.get(`/income?${params}`)
      setIncomes(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } finally { setLoading(false) }
  }, [page, search, sortBy])

  useEffect(() => { fetchIncomes() }, [fetchIncomes])

  const openAdd = () => { setForm(defaultForm); setEditingId(null); setShowModal(true) }
  const openEdit = (inc: Income) => {
    setForm({ amount: String(inc.amount), source: inc.source, description: inc.description, notes: inc.notes || '', date: inc.date, time: inc.time })
    setEditingId(inc.id); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) { toast.error('Description is required'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Valid amount required'); return }
    setSubmitting(true)
    try {
      const payload = { amount: parseFloat(form.amount), source: form.source, description: form.description, date: form.date, time: form.time, notes: form.notes || undefined }
      if (editingId) { await api.put(`/income/${editingId}`, payload); toast.success('Income updated!') }
      else { await api.post('/income', payload); toast.success('Income added!') }
      setShowModal(false); fetchIncomes()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to save') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this income record?')) return
    try { await api.delete(`/income/${id}`); toast.success('Deleted'); fetchIncomes() }
    catch { toast.error('Failed to delete') }
  }

  const currency = account?.currency || '₹'
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Income</h1>
            <p className="page-subtitle">{total} records · This page: {currency}{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <button className="btn btn-success" onClick={openAdd}><Plus size={16} /> Add Income</button>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search income..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <CustomSelect
              style={{ width: 150 }}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'highest', label: 'Highest Amount' },
                { value: 'lowest', label: 'Lowest Amount' }
              ]}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            {loading ? (
              <div style={{ padding: '2rem' }}>{Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 8 }} />
              ))}</div>
            ) : incomes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                No income records found. Add your first income entry!
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Description</th>
                    <th>Source</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((inc) => (
                    <motion.tr key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {inc.date}<br /><span style={{ fontSize: '0.75rem' }}>{inc.time}</span>
                      </td>
                      <td><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, fontWeight: 500 }}>{inc.description}</div></td>
                      <td><span className="badge badge-success">{inc.source}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.notes || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>+{currency}{inc.amount.toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-icon btn-secondary" onClick={() => openEdit(inc)}><Edit3 size={13} /></button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(inc.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingId ? 'Edit Income' : 'Add Income'}</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description *</label>
                    <input className="input" placeholder="e.g. Monthly salary from TCS" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Source</label>
                    <CustomSelect
                      value={form.source}
                      onChange={v => setForm(f => ({ ...f, source: v }))}
                      options={INCOME_SOURCES.map(s => ({ value: s, label: s }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <DatePicker
                      value={form.date}
                      onChange={v => setForm(f => ({ ...f, date: v }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input className="input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="input" rows={2} placeholder="Optional notes..." value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Income'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
