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
  /**
   * `needsConfirmation` vem true quando o projeto exige confirmacao por e-mail:
   * a conta foi criada mas ainda nao ha sessao.
   */
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
