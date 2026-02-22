import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'karting-bna-user'

export interface User {
  email: string
  name: string
  picture?: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  loginAsGuest: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as User
    return data?.name ? data : null
  } catch {
    return null
  }
}

const GUEST_USER: User = { name: 'Invitado', email: '' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(loadStoredUser())
    setIsLoading(false)
  }, [])

  const login = useCallback((u: User) => {
    setUser(u)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {}
  }, [])

  const loginAsGuest = useCallback(() => {
    setUser(GUEST_USER)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(GUEST_USER))
    } catch {}
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

/** Decodifica el payload de un JWT (solo para lectura de datos del usuario) */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
