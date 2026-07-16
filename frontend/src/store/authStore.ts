import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccountSettings } from '../types'

interface AuthState {
  token: string | null
  account: AccountSettings | null
  isAuthenticated: boolean
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  setAuth: (token: string, account: AccountSettings) => void
  setAccount: (account: AccountSettings) => void
  logout: () => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      account: null,
      isAuthenticated: false,
      theme: 'dark',
      sidebarOpen: false,

      setAuth: (token, account) => {
        localStorage.setItem('ea_token', token)
        set({ token, account, isAuthenticated: true })
        document.documentElement.setAttribute('data-theme', account.dark_mode ? 'dark' : 'light')
      },

      setAccount: (account) => {
        set({ account })
        document.documentElement.setAttribute('data-theme', account.dark_mode ? 'dark' : 'light')
      },

      logout: () => {
        localStorage.removeItem('ea_token')
        set({ token: null, account: null, isAuthenticated: false })
      },

      toggleTheme: () => {
        const current = get().theme
        const next = current === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ea-auth',
      partialize: (s) => ({ token: s.token, account: s.account, isAuthenticated: s.isAuthenticated, theme: s.theme })
    }
  )
)
