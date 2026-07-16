import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import api from '../lib/api'
import type { AnalyticsSummary } from '../types'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'

const COLORS = ['#7c6af7', '#5e8ef7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ fontSize: '0.9375rem', fontWeight: 600, color: e.color }}>
          {e.name}: ₹{Number(e.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { account } = useAuthStore()
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [yearlyData, setYearlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const currency = account?.currency || '₹'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [summary, yearly] = await Promise.all([
        api.get(`/analytics/summary?year=${year}`),
        api.get('/analytics/yearly-comparison?years=5')
      ])
      setData(summary.data)
      setYearlyData(yearly.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [year])

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 16 }} />)}
      </div>
    )
  }

  const summaryCards = [
    { label: 'Total Income', value: data?.total_income, color: '#22c55e' },
    { label: 'Total Expenses', value: data?.total_expenses, color: '#ef4444' },
    { label: 'Net Savings', value: data?.savings, color: '#7c6af7' },
    { label: 'Avg Daily Expense', value: data?.avg_daily_expense, color: '#f59e0b' },
    { label: 'Avg Monthly Expense', value: data?.avg_monthly_expense, color: '#06b6d4' },
    { label: 'Transactions', value: data?.transaction_count, color: '#8b5cf6', prefix: '' },
  ]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Deep insights into your financial patterns</p>
          </div>
          <CustomSelect
            style={{ width: 100 }}
            value={String(year)}
            onChange={v => setYear(Number(v))}
            options={years.map(y => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </div>

      <div className="page-body">
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{card.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
                {card.prefix !== undefined ? card.prefix : currency}{typeof card.value === 'number' ? card.value.toLocaleString('en-IN') : '—'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlights */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {data.highest_expense && (
              <div className="card" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>🏆 Highest Expense</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{currency}{data.highest_expense.amount.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{data.highest_expense.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{data.highest_expense.date}</div>
              </div>
            )}
            {data.highest_income && (
              <div className="card" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: '0.8125rem', color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem' }}>💰 Highest Income</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{currency}{data.highest_income.amount.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{data.highest_income.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{data.highest_income.date}</div>
              </div>
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Category Breakdown */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Category Breakdown</div>
            {data?.category_breakdown && data.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.category_breakdown.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={90} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Amount" radius={[0, 4, 4, 0]}>
                    {data.category_breakdown.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>No data for {year}</div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Payment Methods</div>
            {data?.payment_breakdown && data.payment_breakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.payment_breakdown} cx="50%" cy="50%" outerRadius={80} dataKey="amount">
                      {data.payment_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {data.payment_breakdown.map((p, i) => (
                    <div key={p.method} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{p.method}</span>
                      <span style={{ fontWeight: 600 }}>{p.count} tx</span>
                      <span style={{ color: 'var(--text-muted)' }}>{currency}{p.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>No data for {year}</div>
            )}
          </div>
        </div>

        {/* Yearly Comparison */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Yearly Comparison</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Savings" fill="#7c6af7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Merchants */}
        {data?.top_merchants && data.top_merchants.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Top Merchants</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.top_merchants.map((m, i) => {
                const maxVal = data.top_merchants[0].total
                return (
                  <div key={m.merchant} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: `${COLORS[i % COLORS.length]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.merchant}</span>
                        <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length], whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>{currency}{m.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div className="progress-fill"
                          style={{ background: COLORS[i % COLORS.length], width: `${(m.total / maxVal) * 100}%` }}
                          initial={{ width: 0 }} animate={{ width: `${(m.total / maxVal) * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.6 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.count} tx</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
