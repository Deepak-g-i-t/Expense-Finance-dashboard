import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Palette, Download, Upload, Plus, Trash2, Tag, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Category } from '../types'
import { useAuthStore } from '../store/authStore'
import CustomSelect from '../components/CustomSelect'

const CURRENCY_OPTIONS = ['₹', '$', '€', '£', '¥', '₩', 'Fr', 'kr']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallet', 'Other']
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fuel', 'Shopping', 'Electronics', 'Medical', 'Entertainment', 'Education', 'Bills', 'Rent', 'Investment', 'Travel', 'Gifts', 'Subscription', 'Miscellaneous']

export default function SettingsPage() {
  const { account, setAccount, toggleTheme, theme } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    display_name: account?.display_name || '',
    currency: account?.currency || '₹',
    monthly_budget: account?.monthly_budget || 0,
    default_payment_method: account?.default_payment_method || 'Cash',
    default_category: account?.default_category || 'Miscellaneous',
    dark_mode: account?.dark_mode ?? true,
  })
  const [pinForm, setPinForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' })
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#7c6af7')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data))
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/settings', form)
      setAccount(data)
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const changePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinForm.new_pin !== pinForm.confirm_pin) { toast.error('PINs do not match'); return }
    if (!/^\d{4,8}$/.test(pinForm.new_pin)) { toast.error('PIN must be 4–8 digits'); return }
    try {
      await api.post('/settings/change-pin', { current_pin: pinForm.current_pin, new_pin: pinForm.new_pin })
      toast.success('PIN changed successfully!')
      setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' })
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to change PIN') }
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      const { data } = await api.post('/categories', { name: newCatName.trim(), color: newCatColor })
      setCategories(c => [...c, data])
      setNewCatName('')
      toast.success('Category added!')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const deleteCategory = async (cat: Category) => {
    if (cat.is_default) { toast.error('Cannot delete default categories'); return }
    if (!confirm(`Delete "${cat.name}"?`)) return
    try {
      await api.delete(`/categories/${cat.id}`)
      setCategories(c => c.filter(x => x.id !== cat.id))
      toast.success('Deleted')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const exportExcel = async () => {
    try {
      const res = await api.get('/settings/export/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `expense_analytics_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click(); URL.revokeObjectURL(url)
      toast.success('Excel exported!')
    } catch { toast.error('Export failed') }
  }

  const exportCSV = async () => {
    try {
      const res = await api.get('/settings/export/csv', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `expense_analytics_${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
      toast.success('CSV exported!')
    } catch { toast.error('Export failed') }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) { toast.error('Select a file'); return }
    setImporting(true)
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const { data } = await api.post('/settings/import/excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(`Imported: ${data.expenses} expenses, ${data.incomes} incomes. Skipped: ${data.skipped}`)
      setImportFile(null)
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Import failed') }
    finally { setImporting(false) }
  }

  const Section = ({ icon: Icon, title, children }: any) => (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,106,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account</p>
      </div>

      <div className="page-body" style={{ maxWidth: 700 }}>
        {/* Profile & Preferences */}
        <Section icon={User} title="Profile & Preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="input" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <CustomSelect
                value={form.currency}
                onChange={v => setForm(f => ({ ...f, currency: v }))}
                options={CURRENCY_OPTIONS.map(c => ({ value: c, label: c }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Budget ({form.currency})</label>
              <input className="input" type="number" min="0" value={form.monthly_budget}
                onChange={e => setForm(f => ({ ...f, monthly_budget: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Default Payment Method</label>
              <CustomSelect
                value={form.default_payment_method}
                onChange={v => setForm(f => ({ ...f, default_payment_method: v }))}
                options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Category</label>
              <CustomSelect
                value={form.default_category}
                onChange={v => setForm(f => ({ ...f, default_category: v }))}
                options={categories.map(c => ({ value: c.name, label: c.name }))}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Dark Mode</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Switch between dark and light theme</div>
            </div>
            <button className={`btn ${form.dark_mode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setForm(f => ({ ...f, dark_mode: !f.dark_mode })); toggleTheme() }}>
              {form.dark_mode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </Section>

        {/* Change PIN */}
        <Section icon={Lock} title="Change PIN">
          <form onSubmit={changePin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current PIN</label>
                <div style={{ position: 'relative' }}>
                  <input className="input pin-input" type={showPin ? 'text' : 'password'} maxLength={8} placeholder="••••"
                    value={pinForm.current_pin} onChange={e => setPinForm(f => ({ ...f, current_pin: e.target.value.replace(/\D/g, '') }))} required />
                  <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">New PIN</label>
                  <input className="input pin-input" type="password" maxLength={8} placeholder="••••"
                    value={pinForm.new_pin} onChange={e => setPinForm(f => ({ ...f, new_pin: e.target.value.replace(/\D/g, '') }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New PIN</label>
                  <input className="input pin-input" type="password" maxLength={8} placeholder="••••"
                    value={pinForm.confirm_pin} onChange={e => setPinForm(f => ({ ...f, confirm_pin: e.target.value.replace(/\D/g, '') }))} required />
                </div>
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: 'fit-content' }}>Change PIN</button>
            </div>
          </form>
        </Section>

        {/* Categories */}
        <Section icon={Tag} title="Categories">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {categories.map(cat => (
              <motion.div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem',
                borderRadius: 100, border: `1px solid ${cat.color}44`, background: `${cat.color}11`, fontSize: '0.875rem'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                <span style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                {!cat.is_default && (
                  <button onClick={() => deleteCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          <form onSubmit={addCategory} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Add Custom Category</label>
              <input className="input" placeholder="Category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                style={{ width: 48, height: 42, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 4, background: 'var(--bg-glass)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 42, flexShrink: 0 }}>
              <Plus size={15} /> Add
            </button>
          </form>
        </Section>

        {/* Export / Import */}
        <Section icon={Download} title="Export & Import">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button id="export-excel-btn" className="btn btn-secondary" onClick={exportExcel}><Download size={15} /> Export Excel</button>
            <button id="export-csv-btn" className="btn btn-secondary" onClick={exportCSV}><Download size={15} /> Export CSV</button>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Import from Excel</div>
            <form onSubmit={handleImport} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Select Excel File (.xlsx)</label>
                <input className="input" type="file" accept=".xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={importing || !importFile}>
                <Upload size={15} /> {importing ? 'Importing...' : 'Import'}
              </button>
            </form>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.625rem' }}>
              Import from a previously exported Excel file. Duplicate entries will be automatically skipped.
            </p>
          </div>
        </Section>

        {/* Account Info */}
        <div className="card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Account Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['Account ID', account?.account_id],
              ['Created', account?.created_at ? new Date(account.created_at).toLocaleDateString() : '—'],
              ['Currency', account?.currency],
              ['Monthly Budget', `${account?.currency}${account?.monthly_budget?.toLocaleString('en-IN')}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
