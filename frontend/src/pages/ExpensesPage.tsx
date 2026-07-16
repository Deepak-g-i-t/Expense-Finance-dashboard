import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, Edit3, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Expense, Category } from '../types'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'
import DatePicker from '../components/DatePicker'

const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallet', 'Other']

const categoryColors: Record<string, string> = {
  Food: '#f97316', Transport: '#3b82f6', Fuel: '#eab308', Shopping: '#ec4899',
  Electronics: '#8b5cf6', Medical: '#ef4444', Entertainment: '#06b6d4', Education: '#10b981',
  Bills: '#f59e0b', Rent: '#6366f1', Investment: '#14b8a6', Travel: '#0ea5e9',
  Gifts: '#d946ef', Subscription: '#64748b', Miscellaneous: '#94a3b8'
}

interface ExpenseFormData {
  amount: string; category: string; description: string; merchant: string
  date: string; time: string; payment_method: string; notes: string
}

const defaultForm: ExpenseFormData = {
  amount: '', category: 'Food', description: '', merchant: '',
  date: format(new Date(), 'yyyy-MM-dd'), time: format(new Date(), 'HH:mm'),
  payment_method: 'UPI', notes: ''
}

export default function ExpensesPage() {
  const { account } = useAuthStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ExpenseFormData>(defaultForm)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showDetail, setShowDetail] = useState<Expense | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), page_size: '15', sort_by: sortBy,
        ...(search && { search }),
        ...(filterCategory && { category: filterCategory })
      })
      const { data } = await api.get(`/expenses?${params}`)
      setExpenses(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterCategory, sortBy])

  useEffect(() => {
    fetchExpenses()
    api.get('/categories').then(r => setCategories(r.data))
  }, [fetchExpenses])

  const openAdd = () => {
    setForm({ ...defaultForm, payment_method: account?.default_payment_method || 'UPI', category: account?.default_category || 'Food' })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (exp: Expense) => {
    setForm({
      amount: String(exp.amount), category: exp.category, description: exp.description,
      merchant: exp.merchant || '', date: exp.date, time: exp.time,
      payment_method: exp.payment_method, notes: exp.notes || ''
    })
    setEditingId(exp.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) { toast.error('Description is required'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Valid amount required'); return }

    setSubmitting(true)
    try {
      const payload = {
        amount: parseFloat(form.amount), category: form.category,
        description: form.description, merchant: form.merchant || undefined,
        date: form.date, time: form.time, payment_method: form.payment_method,
        notes: form.notes || undefined
      }
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload)
        toast.success('Expense updated!')
      } else {
        await api.post('/expenses', payload)
        toast.success('Expense added!')
      }
      setShowModal(false)
      fetchExpenses()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Expense deleted')
      fetchExpenses()
      if (showDetail?.id === id) setShowDetail(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const currency = account?.currency || '₹'

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-subtitle">{total} records found</p>
          </div>
          <button id="add-expense-btn" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: '2.25rem' }}
                placeholder="Search expenses..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <CustomSelect
              style={{ width: 160 }}
              value={filterCategory}
              onChange={v => { setFilterCategory(v); setPage(1) }}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c.name, label: c.name }))
              ]}
              placeholder="All Categories"
            />
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

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            {loading ? (
              <div style={{ padding: '2rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 8 }} />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
                No expenses found. {search || filterCategory ? 'Try adjusting filters.' : 'Add your first expense!'}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Merchant</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ cursor: 'pointer' }} onClick={() => setShowDetail(exp)}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {exp.date}<br /><span style={{ fontSize: '0.75rem' }}>{exp.time}</span>
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {exp.description}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: `${categoryColors[exp.category] || '#7c6af7'}22`,
                          color: categoryColors[exp.category] || '#7c6af7'
                        }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{exp.merchant || '—'}</td>
                      <td><span className="badge badge-neutral">{exp.payment_method}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        −{currency}{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-icon btn-secondary" onClick={() => openEdit(exp)} title="Edit">
                            <Edit3 size={13} />
                          </button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(exp.id)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description *</label>
                    <input className="input" placeholder="e.g. Dinner with friends after office"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <CustomSelect
                      value={form.category}
                      onChange={v => setForm(f => ({ ...f, category: v }))}
                      options={categories.map(c => ({ value: c.name, label: c.name }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <DatePicker
                      value={form.date}
                      onChange={v => setForm(f => ({ ...f, date: v }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input className="input" type="time" value={form.time}
                      onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <CustomSelect
                      value={form.payment_method}
                      onChange={v => setForm(f => ({ ...f, payment_method: v }))}
                      options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Merchant / Store</label>
                    <input className="input" placeholder="e.g. Swiggy, Amazon"
                      value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="input" rows={2} placeholder="Optional notes..."
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button id="save-expense-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDetail(null)}>
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <div className="modal-header">
                <h2 className="modal-title">Expense Detail</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setShowDetail(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444' }}>
                    −{currency}{showDetail.amount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                    {showDetail.description}
                  </div>
                </div>
                {[
                  ['Category', showDetail.category],
                  ['Date', showDetail.date],
                  ['Time', showDetail.time],
                  ['Payment Method', showDetail.payment_method],
                  ['Merchant', showDetail.merchant || '—'],
                  ['Notes', showDetail.notes || '—'],
                  ['Recorded', new Date(showDetail.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { openEdit(showDetail); setShowDetail(null) }}>
                  <Edit3 size={14} /> Edit
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(showDetail.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
