import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/axios'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  // Renvoie un jeton d'étape quand la double authentification est activée (code à demander ensuite)
  login: (email: string, password: string) => Promise<{ challengeToken?: string }>
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// La session elle-même vit dans un cookie httpOnly géré par le backend. Seul le profil
// (non sensible) est mis en cache dans localStorage pour afficher l'interface sans attendre.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ancien stockage du jeton (avant le passage au cookie httpOnly) : on le supprime
    localStorage.removeItem('ecolio_token')
    const savedUser = localStorage.getItem('ecolio_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      // Refresh user data
      api.get('/auth/me').then((res) => {
        setUser(res.data.user)
        localStorage.setItem('ecolio_user', JSON.stringify(res.data.user))
      }).catch((err) => {
        // Ne déconnecter que si la session est explicitement rejetée (401),
        // pas sur erreur réseau (backend pas encore démarré, timeout…)
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          localStorage.removeItem('ecolio_user')
          setUser(null)
        }
        // Erreur réseau → on garde la session en cache
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const startSession = (u: User) => {
    localStorage.setItem('ecolio_user', JSON.stringify(u))
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    if (res.data.two_factor_required) return { challengeToken: res.data.challenge_token as string }
    startSession(res.data.user)
    return {}
  }

  const verifyTwoFactor = async (challengeToken: string, code: string) => {
    const res = await api.post('/auth/login/2fa', { challenge_token: challengeToken, code })
    startSession(res.data.user)
  }

  const logout = () => {
    // Révoque la session côté serveur (le cookie et le jeton deviennent inutilisables)
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('ecolio_user')
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user!, ...data }
    setUser(updated)
    localStorage.setItem('ecolio_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
