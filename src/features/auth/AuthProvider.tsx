import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthUser } from '@/features/auth/auth-context'
import { isSupabaseConfigured } from '@/lib/env'
import { supabase } from '@/lib/supabase'

const MOCK_SESSION_KEY = 'pet-care:mock-user'

/**
 * Enquanto o Supabase nao estiver configurado, a autenticacao usa uma sessao
 * mock guardada no localStorage — o suficiente para navegar pelas rotas privadas.
 * Com as env vars preenchidas, o fluxo real do Supabase Auth assume.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readMockUser)
  // Com Supabase, a sessao so e conhecida apos getSession(); no modo mock ja veio do localStorage.
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? toAuthUser(data.session.user) : null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toAuthUser(session.user) : null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const mockUser: AuthUser = { id: 'mock-user', email, name: email.split('@')[0] }
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser))
      setUser(mockUser)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) {
      localStorage.removeItem(MOCK_SESSION_KEY)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({ user, loading, isMock: !isSupabaseConfigured, signIn, signOut }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function toAuthUser(user: { id: string; email?: string }): AuthUser {
  return { id: user.id, email: user.email ?? '' }
}

function readMockUser(): AuthUser | null {
  if (supabase) return null
  try {
    const stored = localStorage.getItem(MOCK_SESSION_KEY)
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}
