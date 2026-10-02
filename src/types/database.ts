/**
 * Tipos do banco, no formato que o gerador do Supabase produz.
 *
 * Escritos a mao a partir de `supabase/migrations/0001_initial_schema.sql`. Para
 * regerar depois de qualquer migration (precisa de `npx supabase login` antes):
 *
 *   npx supabase gen types typescript --project-id kgcoiptpmawfgogmttoo > src/types/database.ts
 *
 * `species` e `status` saem como `string` porque no banco sao text + CHECK, nao
 * enum — e assim que o gerador os trata. A conversao para as unioes da aplicacao
 * fica nos `features/*\/api.ts`, junto com o resto do mapeamento.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      pets: {
        Row: {
          id: string
          owner_id: string
          name: string
          species: string
          breed: string | null
          birth_date: string | null
          owner_name: string | null
          photo_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          name: string
          species: string
          breed?: string | null
          birth_date?: string | null
          owner_name?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          species?: string
          breed?: string | null
          birth_date?: string | null
          owner_name?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      weights: {
        Row: {
          id: string
          pet_id: string
          date: string
          weight_kg: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          date: string
          weight_kg: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          date?: string
          weight_kg?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vaccines: {
        Row: {
          id: string
          pet_id: string
          name: string
          date: string
          next_due_date: string | null
          vet: string | null
          batch: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          name: string
          date: string
          next_due_date?: string | null
          vet?: string | null
          batch?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          name?: string
          date?: string
          next_due_date?: string | null
          vet?: string | null
          batch?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          pet_id: string
          date: string
          time: string | null
          reason: string
          vet: string | null
          clinic: string | null
          status: string
          diagnosis: string | null
          prescription: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          date: string
          time?: string | null
          reason: string
          vet?: string | null
          clinic?: string | null
          status?: string
          diagnosis?: string | null
          prescription?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          date?: string
          time?: string | null
          reason?: string
          vet?: string | null
          clinic?: string | null
          status?: string
          diagnosis?: string | null
          prescription?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** Atalhos usados pelos mapeadores em `features/*\/api.ts`. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
