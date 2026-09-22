import { createContext } from 'react'

export type AuthUser = {
  id: string
  email: string
  name?: string
}

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  /** true quando a sessao vem de um mock local (Supabase ainda nao configurado). */
  isMock: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
