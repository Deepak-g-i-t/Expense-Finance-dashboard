import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Receipt, TrendingUp, PiggyBank, Bell,
  Calendar, BarChart3, Settings, LogOut, TrendingDown, X,
  Menu, Sun, Moon
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { to: '/income', icon: TrendingUp, label: 'Income' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { account, logout, theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99,
              backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>ExpenseIQ</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{account?.display_name}</div>
          </div>
          <button className="btn btn-icon btn-secondary" style={{ marginLeft: 'auto', display: 'none' }}
            id="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{
            padding: '0.875rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', marginBottom: '0.75rem'
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {account?.account_id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {account?.currency} · {account?.default_payment_method}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span style={{ fontSize: '0.8125rem' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button id="logout-btn" className="btn btn-danger btn-icon" onClick={handleLogout}
              title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <header style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        padding: '1rem', alignItems: 'center', gap: '1rem'
      }} id="mobile-header">
        <button className="btn btn-icon btn-secondary" onClick={() => setSidebarOpen(true)}>
          <Menu size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>ExpenseIQ</span>
      </header>
    </>
  )
}
