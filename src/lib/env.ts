/**
 * Acesso centralizado as variaveis de ambiente do Vite.
 * Enquanto o Supabase nao estiver configurado, `isSupabaseConfigured` fica false
 * e a app roda com os dados mock de `src/features/*\/api.ts`.
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
} as const

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
