import { useAuth } from '@/features/auth/useAuth'

/** Avisa que a app esta rodando com dados mock (Supabase ainda nao configurado). */
export function MockBanner() {
  const { isMock } = useAuth()
  if (!isMock) return null

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      Modo mock: Supabase ainda nao configurado (preencha <code>.env.local</code>).
    </div>
  )
}
