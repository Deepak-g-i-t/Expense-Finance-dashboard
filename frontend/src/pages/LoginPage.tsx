import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, TrendingUp, Lock, User, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    account_id: '', pin: '', display_name: '', remember: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account_id.trim() || !form.pin.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    if (!/^\d{4,8}$/.test(form.pin)) {
      toast.error('PIN must be 4–8 digits')
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { account_id: form.account_id, pin: form.pin }
        : { account_id: form.account_id, pin: form.pin, display_name: form.display_name || 'Personal' }

      const { data } = await api.post(endpoint, payload)
      
      // Fetch account details
      const { data: account } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      })

      setAuth(data.access_token, account)
      toast.success(mode === 'login' ? `Welcome back, ${account.display_name}!` : 'Account created! Welcome!')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(124, 106, 247, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(94, 142, 247, 0.06) 0%, transparent 60%)'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '1rem' }}
      >
        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 1rem',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(124, 106, 247, 0.4)'
            }}>
              <TrendingUp size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              ExpenseIQ
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
              Personal Finance Analytics
            </p>
          </div>

          {/* Mode toggle */}
          <div className="tab-nav" style={{ marginBottom: '1.75rem' }}>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              style={{ flex: 1 }} onClick={() => setMode('login')}>Sign In</button>
            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              style={{ flex: 1 }} onClick={() => setMode('register')}>Create Account</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <div style={{ position: 'relative' }}>
                    <Sparkles size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" style={{ paddingLeft: '2.5rem' }}
                      placeholder="e.g. Personal Finance"
                      value={form.display_name}
                      onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Account ID <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="account-id" className="input" style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. myaccount"
                    value={form.account_id}
                    onChange={(e) => setForm(f => ({ ...f, account_id: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN (4–8 digits) <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="pin-input" className="input pin-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                    type={showPin ? 'text' : 'password'}
                    placeholder="••••"
                    maxLength={8}
                    value={form.pin}
                    onChange={(e) => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                    required
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button id="login-btn" type="submit" className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                      </path>
                    </svg>
                    Processing...
                  </span>
                ) : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            🔒 Your data is stored locally & securely encrypted
          </p>
        </div>
      </motion.div>
    </div>
  )
}
