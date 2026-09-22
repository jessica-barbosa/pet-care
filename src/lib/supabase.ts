import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env, isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * Cliente unico do Supabase. Retorna `null` enquanto as variaveis de ambiente
 * nao estiverem preenchidas, para a app continuar rodando com dados mock.
 *
 * Quando o projeto Supabase existir:
 *   1. preencha .env.local a partir de .env.example
 *   2. gere os tipos: npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Use dentro de codigo que so roda depois do Supabase configurado. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local',
    )
  }
  return supabase
}
