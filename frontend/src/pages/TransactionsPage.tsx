import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import api from '../lib/api'
import type { TransactionItem } from '../types'
import { useAuthStore } from '../store/authStore'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'
import CustomSelect from '../components/CustomSelect'
import DatePicker from '../components/DatePicker'

const QUICK_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
]

export default function TransactionsPage() {
  const { account } = useAuthStore()
  const [items, setItems] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | 'expense' | 'income'>('all')
  const [quickFilter, setQuickFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const getDateRange = (filter: string) => {
    const now = new Date()
    switch (filter) {
      case 'today': return { from: format(now, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case 'yesterday': return { from: format(subDays(now, 1), 'yyyy-MM-dd'), to: format(subDays(now, 1), 'yyyy-MM-dd') }
      case 'week': return { from: format(startOfWeek(now), 'yyyy-MM-dd'), to: format(endOfWeek(now), 'yyyy-MM-dd') }
      case 'month': return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') }
      case 'year': return { from: format(startOfYear(now), 'yyyy-MM-dd'), to: format(endOfYear(now), 'yyyy-MM-dd') }
      default: return { from: '', to: '' }
    }
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const dateRange = quickFilter ? getDateRange(quickFilter) : { from: dateFrom, to: dateTo }
    
    try {
      const promises = []
      const params: any = { page, page_size: 20, sort_by: sortBy, ...(search && { search }), ...(dateRange.from && { date_from: dateRange.from }), ...(dateRange.to && { date_to: dateRange.to }) }

      if (type !== 'income') {
        promises.push(api.get('/expenses', { params }))
      }
      if (type !== 'expense') {
        promises.push(api.get('/income', { params }))
      }

      const results = await Promise.all(promises)
      let combined: TransactionItem[] = []
      let totalCount = 0

      results.forEach(r => {
        combined.push(...r.data.items)
        totalCount += r.data.total
      })

      // Sort combined
      combined.sort((a, b) => {
        if (sortBy === 'newest' || sortBy === 'oldest') {
          const cmp = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
          return sortBy === 'newest' ? -cmp : cmp
        }
        return sortBy === 'highest' ? b.amount - a.amount : a.amount - b.amount
      })

      setItems(combined)
      setTotal(totalCount)
      setTotalPages(Math.ceil(totalCount / 20))
    } finally { setLoading(false) }
  }, [page, search, type, sortBy, quickFilter, dateFrom, dateTo])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const currency = account?.currency || '₹'
  const totalExpenses = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const totalIncome = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">{total} transactions</p>
      </div>

      <div className="page-body">
        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Showing Income</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>+{currency}{totalIncome.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Showing Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>−{currency}{totalExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Net</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalIncome - totalExpenses >= 0 ? '#22c55e' : '#ef4444' }}>
              {currency}{(totalIncome - totalExpenses).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
            <button className={`btn btn-sm ${!quickFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setQuickFilter('')}>All Time</button>
            {QUICK_FILTERS.map(f => (
              <button key={f.value} className={`btn btn-sm ${quickFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setQuickFilter(quickFilter === f.value ? '' : f.value)}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search all transactions..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <div className="tab-nav">
              {(['all', 'expense', 'income'] as const).map(t => (
                <button key={t} className={`tab-btn ${type === t ? 'active' : ''}`} onClick={() => { setType(t); setPage(1) }}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
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

          {!quickFilter && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">From Date</label>
                <DatePicker value={dateFrom} onChange={v => { setDateFrom(v); setPage(1) }} placeholder="Select date" />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">To Date</label>
                <DatePicker value={dateTo} onChange={v => { setDateTo(v); setPage(1) }} placeholder="Select date" />
              </div>
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            {loading ? (
              <div style={{ padding: '2rem' }}>{Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />
              ))}</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                No transactions found for the selected filters.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category / Source</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <motion.tr key={`${item.type}-${item.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {item.type === 'expense'
                            ? <TrendingDown size={14} color="#ef4444" />
                            : <TrendingUp size={14} color="#22c55e" />}
                          <span className={`badge ${item.type === 'expense' ? 'badge-danger' : 'badge-success'}`}>
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {item.date}<br /><span style={{ fontSize: '0.75rem' }}>{item.time}</span>
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {item.description}
                        </div>
                        {item.merchant && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.merchant}</div>}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{item.category || item.source}</span>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.payment_method || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap',
                        color: item.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                        {item.type === 'expense' ? '−' : '+'}{currency}{item.amount.toLocaleString('en-IN')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
