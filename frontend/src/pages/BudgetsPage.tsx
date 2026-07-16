import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, Edit3, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Budget, Category } from '../types'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'

export default function BudgetsPage() {
  const { account } = useAuthStore()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ category: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}`)
      setBudgets(data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchBudgets()
    api.get('/categories').then(r => setCategories(r.data))
  }, [selectedMonth, selectedYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Fill all required fields'); return
    }
    try {
      if (editingId) {
        await api.put(`/budgets/${editingId}`, { amount: parseFloat(form.amount) })
        toast.success('Budget updated!')
      } else {
        await api.post('/budgets', { category: form.category, amount: parseFloat(form.amount), month: form.month, year: form.year })
        toast.success('Budget created!')
      }
      setShowModal(false); fetchBudgets()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return
    try { await api.delete(`/budgets/${id}`); toast.success('Deleted'); fetchBudgets() }
    catch { toast.error('Failed') }
  }

  const currency = account?.currency || '₹'
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const getColor = (pct: number) => pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e'

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Budget Management</h1>
            <p className="page-subtitle">{budgets.length} budgets · {currency}{totalSpent.toLocaleString('en-IN')} / {currency}{totalBudget.toLocaleString('en-IN')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ category: '', amount: '', month: selectedMonth, year: selectedYear }); setEditingId(null); setShowModal(true) }}>
            <Plus size={16} /> Add Budget
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Month/Year Selector */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <CustomSelect
              style={{ width: 120 }}
              value={String(selectedMonth)}
              onChange={v => setSelectedMonth(Number(v))}
              options={months.map((m, i) => ({ value: String(i + 1), label: m }))}
            />
            <CustomSelect
              style={{ width: 100 }}
              value={String(selectedYear)}
              onChange={v => setSelectedYear(Number(v))}
              options={years.map(y => ({ value: String(y), label: String(y) }))}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing budgets for {months[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
        </div>

        {/* Summary */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Total Budget</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c6af7' }}>{currency}{totalBudget.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Total Spent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{currency}{totalSpent.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Remaining</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{currency}{(totalBudget - totalSpent).toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}

        {/* Budget Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 140 }} />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>No budgets set for this period</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Set budgets to track your spending</div>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }}
              onClick={() => { setForm({ category: '', amount: '', month: selectedMonth, year: selectedYear }); setEditingId(null); setShowModal(true) }}>
              <Plus size={16} /> Set Budget
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {budgets.map((budget) => {
              const pct = budget.percentage
              const color = getColor(pct)
              return (
                <motion.div key={budget.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{budget.category}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {months[budget.month - 1]} {budget.year}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {pct >= 100 && <AlertTriangle size={16} color="#ef4444" />}
                      {pct < 50 && <TrendingUp size={16} color="#22c55e" />}
                      <button className="btn btn-icon btn-secondary" onClick={() => { setForm({ category: budget.category, amount: String(budget.amount), month: budget.month, year: budget.year }); setEditingId(budget.id); setShowModal(true) }}><Edit3 size={12} /></button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDelete(budget.id)}><Trash2 size={12} /></button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Spent: <strong style={{ color }}>{currency}{budget.spent.toLocaleString('en-IN')}</strong></span>
                      <span style={{ color: 'var(--text-secondary)' }}>Budget: <strong style={{ color: 'var(--text-primary)' }}>{currency}{budget.amount.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill"
                        style={{ background: color, width: `${Math.min(100, pct)}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.375rem', color: 'var(--text-muted)' }}>
                      <span style={{ color }}>{pct.toFixed(1)}% used</span>
                      <span>Remaining: {currency}{budget.remaining.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {pct >= 100 && (
                    <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: '0.8125rem', color: '#ef4444', textAlign: 'center' }}>
                      ⚠️ Budget exceeded by {currency}{Math.abs(budget.remaining).toLocaleString('en-IN')}
                    </div>
                  )}
                  {pct >= 80 && pct < 100 && (
                    <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: '0.8125rem', color: '#f59e0b', textAlign: 'center' }}>
                      ⚠️ Approaching limit — {(100 - pct).toFixed(0)}% remaining
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingId ? 'Edit Budget' : 'Set Budget'}</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!editingId && (
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <CustomSelect
                        value={form.category}
                        onChange={v => setForm(f => ({ ...f, category: v }))}
                        options={[
                          { value: '', label: 'Select category...' },
                          ...categories.map(c => ({ value: c.name, label: c.name }))
                        ]}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Budget Amount ({currency}) *</label>
                    <input className="input" type="number" min="1" step="0.01" placeholder="0.00"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  {!editingId && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Month</label>
                        <CustomSelect
                          value={String(form.month)}
                          onChange={v => setForm(f => ({ ...f, month: Number(v) }))}
                          options={months.map((m, i) => ({ value: String(i + 1), label: m }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year</label>
                        <CustomSelect
                          value={String(form.year)}
                          onChange={v => setForm(f => ({ ...f, year: Number(v) }))}
                          options={years.map(y => ({ value: String(y), label: String(y) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Set Budget'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
