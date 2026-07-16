import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ExpensesPage from './pages/ExpensesPage'
import IncomePage from './pages/IncomePage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage from './pages/BudgetsPage'
import RemindersPage from './pages/RemindersPage'
import CalendarPage from './pages/CalendarPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import { useAuthStore } from './store/authStore'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore()
  
  useEffect(() => {
    if (!isAuthenticated) return
    let timer = setTimeout(() => { logout(); window.location.href = '/login' }, SESSION_TIMEOUT_MS)
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { logout(); window.location.href = '/login' }, SESSION_TIMEOUT_MS) }
    document.addEventListener('mousemove', reset)
    document.addEventListener('keydown', reset)
    document.addEventListener('click', reset)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousemove', reset)
      document.removeEventListener('keydown', reset)
      document.removeEventListener('click', reset)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { account } = useAuthStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', account?.dark_mode ? 'dark' : 'light')
  }, [account?.dark_mode])

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.9375rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><AppLayout><ExpensesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute><AppLayout><IncomePage /></AppLayout></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><AppLayout><TransactionsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><AppLayout><BudgetsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute><AppLayout><RemindersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
      </Routes>
    </>
  )
}
