import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/axios'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('ecolio_token')
    const savedUser = localStorage.getItem('ecolio_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      // Refresh user data
      api.get('/auth/me').then((res) => {
        setUser(res.data.user)
        localStorage.setItem('ecolio_user', JSON.stringify(res.data.user))
      }).catch((err) => {
        // Ne déconnecter que si le token est explicitement rejeté (401),
        // pas sur erreur réseau (backend pas encore démarré, timeout…)
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          localStorage.removeItem('ecolio_token')
          localStorage.removeItem('ecolio_user')
          setToken(null)
          setUser(null)
        }
        // Erreur réseau → on garde la session en cache
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('ecolio_token', t)
    localStorage.setItem('ecolio_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('ecolio_token')
    localStorage.removeItem('ecolio_user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user!, ...data }
    setUser(updated)
    localStorage.setItem('ecolio_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
