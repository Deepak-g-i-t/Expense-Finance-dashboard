import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Bell } from 'lucide-react'
import api from '../lib/api'
import type { CalendarData, TransactionItem } from '../types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { useAuthStore } from '../store/authStore'

export default function CalendarPage() {
  const { account } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calData, setCalData] = useState<CalendarData>({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayTransactions, setDayTransactions] = useState<TransactionItem[]>([])
  const [loadingDay, setLoadingDay] = useState(false)

  const fetchCalendar = async (date: Date) => {
    setLoading(true)
    try {
      const m = date.getMonth() + 1
      const y = date.getFullYear()
      const { data } = await api.get(`/analytics/calendar?month=${m}&year=${y}`)
      setCalData(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCalendar(currentDate) }, [currentDate])

  const handleDayClick = async (dateStr: string) => {
    setSelectedDay(dateStr)
    setLoadingDay(true)
    try {
      const [expRes, incRes] = await Promise.all([
        api.get(`/expenses?date_from=${dateStr}&date_to=${dateStr}&page_size=100`),
        api.get(`/income?date_from=${dateStr}&date_to=${dateStr}&page_size=100`)
      ])
      const combined: TransactionItem[] = [
        ...expRes.data.items,
        ...incRes.data.items
      ].sort((a, b) => b.time.localeCompare(a.time))
      setDayTransactions(combined)
    } finally { setLoadingDay(false) }
  }

  const currency = account?.currency || '₹'
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthTotals = Object.values(calData).reduce(
    (acc, d) => ({
      income: acc.income + (d.income?.total || 0),
      expenses: acc.expenses + (d.expenses?.total || 0)
    }), { income: 0, expenses: 0 }
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Calendar View</h1>
            <p className="page-subtitle">{format(currentDate, 'MMMM yyyy')}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft size={16} /></button>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Month Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Month Income</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{currency}{monthTotals.income.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Month Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{currency}{monthTotals.expenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Net Savings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: monthTotals.income - monthTotals.expenses >= 0 ? '#22c55e' : '#ef4444' }}>
              {currency}{(monthTotals.income - monthTotals.expenses).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.25rem' }}>{d}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {/* Empty cells */}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const data = calData[dateStr]
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
              const isSelected = dateStr === selectedDay
              const hasData = data && (data.expenses || data.income || data.reminders)

              return (
                <motion.div
                  key={dateStr}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDayClick(dateStr)}
                  style={{
                    minHeight: 80, padding: '0.5rem', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : isToday ? 'rgba(124,106,247,0.4)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(124,106,247,0.15)' : isToday ? 'rgba(124,106,247,0.05)' : 'var(--bg-glass)',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: '0.875rem', marginBottom: '0.375rem'
                  }}>
                    {format(day, 'd')}
                  </div>

                  {data?.income && (
                    <div style={{ fontSize: '0.6875rem', color: '#22c55e', fontWeight: 600, marginBottom: '0.125rem' }}>
                      +{currency}{data.income.total >= 1000 ? `${(data.income.total / 1000).toFixed(1)}k` : data.income.total}
                    </div>
                  )}
                  {data?.expenses && (
                    <div style={{ fontSize: '0.6875rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.125rem' }}>
                      −{currency}{data.expenses.total >= 1000 ? `${(data.expenses.total / 1000).toFixed(1)}k` : data.expenses.total}
                    </div>
                  )}
                  {data?.reminders && data.reminders.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.125rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {data.reminders.slice(0, 2).map(r => (
                        <div key={r.id} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: r.status === 'overdue' ? '#ef4444' : r.priority === 'high' ? '#f59e0b' : '#7c6af7'
                        }} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { color: '#22c55e', label: 'Income' },
              { color: '#ef4444', label: 'Expenses' },
              { color: '#7c6af7', label: 'Reminders' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Detail Panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 480 }} initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="modal-header">
                <h2 className="modal-title">{format(new Date(selectedDay), 'MMMM d, yyyy')}</h2>
                <button className="btn btn-icon btn-secondary" onClick={() => setSelectedDay(null)}><X size={16} /></button>
              </div>

              {loadingDay ? (
                <div style={{ padding: '1rem 0' }}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />)}</div>
              ) : dayTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions on this day</div>
              ) : (
                <>
                  {/* Day Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    <div style={{ padding: '0.875rem', background: 'rgba(34,197,94,0.1)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income</div>
                      <div style={{ fontWeight: 800, color: '#22c55e' }}>
                        {currency}{dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ padding: '0.875rem', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expenses</div>
                      <div style={{ fontWeight: 800, color: '#ef4444' }}>
                        {currency}{dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 350, overflowY: 'auto' }}>
                    {dayTransactions.map((t) => (
                      <div key={`${t.type}-${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        {t.type === 'expense' ? <TrendingDown size={16} color="#ef4444" /> : <TrendingUp size={16} color="#22c55e" />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.time} · {t.category || t.source}</div>
                        </div>
                        <div style={{ fontWeight: 800, color: t.type === 'expense' ? '#ef4444' : '#22c55e', whiteSpace: 'nowrap' }}>
                          {t.type === 'expense' ? '−' : '+'}{currency}{t.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}

                    {/* Reminders */}
                    {calData[selectedDay]?.reminders?.map(rem => (
                      <div key={rem.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'rgba(124,106,247,0.05)', borderRadius: 10, border: '1px solid rgba(124,106,247,0.2)' }}>
                        <Bell size={16} color="#7c6af7" />
                        <div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{rem.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reminder · {rem.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
