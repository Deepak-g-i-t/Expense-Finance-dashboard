import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  CalendarDays, Clock, Calendar, Target,
  ArrowUpRight, Bell, AlertCircle, CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts'
import api from '../lib/api'
import type { DashboardStats, MonthlyTrend, CategoryStat, DailySpending, Reminder } from '../types'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'

const CATEGORY_COLORS = [
  '#7c6af7', '#5e8ef7', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
  '#6366f1', '#0ea5e9', '#d946ef', '#64748b', '#84cc16'
]

function StatCard({ title, value, icon: Icon, color, change, prefix = '₹', subtitle, onClick }: any) {
  return (
    <motion.div
      className={`stat-card ${onClick ? 'clickable' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        {change !== undefined && (
          <span className={`badge ${change >= 0 ? 'badge-success' : 'badge-danger'}`}>
            <ArrowUpRight size={12} style={{ transform: change < 0 ? 'rotate(90deg)' : '' }} />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1 }}>
        {prefix}{Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '0.875rem', boxShadow: 'var(--shadow-md)'
    }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontSize: '0.9375rem', fontWeight: 600, color: entry.color }}>
          {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { account } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trend, setTrend] = useState<MonthlyTrend[]>([])
  const [categories, setCategories] = useState<CategoryStat[]>([])
  const [daily, setDaily] = useState<DailySpending[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/monthly-trend'),
      api.get('/dashboard/category-distribution'),
      api.get('/dashboard/daily-spending?days=14'),
      api.get('/reminders?status=pending'),
    ]).then(([s, t, c, d, r]) => {
      setStats(s.data)
      setTrend(t.data)
      setCategories(c.data)
      setDaily(d.data)
      setReminders(r.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const currency = account?.currency || '₹'

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Current Balance', value: stats?.current_balance ?? 0, icon: Wallet, color: '#7c6af7', onClick: () => navigate('/transactions') },
    { title: 'Total Income', value: stats?.total_income ?? 0, icon: TrendingUp, color: '#22c55e', onClick: () => navigate('/income') },
    { title: 'Total Expenses', value: stats?.total_expenses ?? 0, icon: TrendingDown, color: '#ef4444', onClick: () => navigate('/expenses') },
    { title: 'Savings', value: stats?.savings ?? 0, icon: PiggyBank, color: '#06b6d4', onClick: () => navigate('/analytics') },
    { title: "This Month's Spending", value: stats?.current_month_spending ?? 0, icon: CalendarDays, color: '#f59e0b', onClick: () => navigate('/transactions') },
    { title: "Today's Spending", value: stats?.today_spending ?? 0, icon: Clock, color: '#8b5cf6', onClick: () => navigate('/transactions') },
    { title: "This Week's Spending", value: stats?.this_week_spending ?? 0, icon: Calendar, color: '#ec4899', onClick: () => navigate('/transactions') },
    { title: 'Remaining Monthly Budget', value: stats?.remaining_monthly_budget ?? 0, icon: Target, color: '#14b8a6', onClick: () => navigate('/budgets') },
  ]

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">{todayFormatted}</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {statCards.map((card, i) => (
            <motion.div key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <StatCard {...card} prefix={currency} />
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Monthly Trend */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Monthly Income vs Expense</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2.5} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Category Split</div>
            {categories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categories} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      dataKey="amount" paddingAngle={3}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {categories.slice(0, 5).map((cat, i) => (
                    <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.875rem' }}>
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Daily Spending */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Daily Spending (14 days)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Expenses" radius={[4, 4, 0, 0]}
                  fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6af7" />
                    <stop offset="100%" stopColor="#5e8ef7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reminders Widget */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Upcoming Reminders</div>
              <Bell size={16} color="var(--accent-primary)" />
            </div>
            {reminders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reminders.map((rem) => {
                  const isOverdue = new Date(rem.due_date) < new Date() && rem.status === 'pending'
                  return (
                    <div key={rem.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.875rem', background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-sm)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`
                    }}>
                      <div style={{ marginTop: 2 }}>
                        {isOverdue
                          ? <AlertCircle size={16} color="#ef4444" />
                          : <CheckCircle2 size={16} color="var(--accent-primary)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isOverdue ? '#ef4444' : 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rem.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          Due: {rem.due_date} {rem.amount ? `· ₹${rem.amount}` : ''}
                        </div>
                      </div>
                      <span className={`badge ${rem.priority === 'high' ? 'badge-danger' : rem.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                        {rem.priority}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.875rem' }}>
                No upcoming reminders
              </div>
            )}
          </div>
        </div>

        {/* Savings Trend */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.0625rem' }}>Savings Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#22c55e" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
