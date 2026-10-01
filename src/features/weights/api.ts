import type { NewWeightEntry, WeightEntry } from '@/features/weights/types'
import { supabase } from '@/lib/supabase'
import { toDateInput } from '@/lib/date'

/**
 * Camada de acesso a dados das pesagens.
 *
 * Hoje responde com dados mock em memoria. Quando a tabela `weights` existir no
 * Supabase, basta trocar o corpo de cada funcao pela query real — a assinatura
 * e os hooks de `queries.ts` continuam iguais. Exemplo:
 *
 *   const { data, error } = await requireSupabase()
 *     .from('weights').select('*').eq('pet_id', petId).order('date', { ascending: false })
 *   if (error) throw error
 *   return data
 */

/** Datas relativas a hoje: dados fixos envelheceriam e esvaziariam as telas. */
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toDateInput(date)
}

/**
 * Thor e Mia tem series longas com formatos diferentes (ganho continuo x pico e
 * queda); Bidu nao tem nenhuma pesagem (estado vazio). O caso de registro unico
 * fica coberto ao cadastrar um pet novo e lancar a primeira pesagem.
 */
const MOCK_WEIGHTS: WeightEntry[] = [
  // Intervalos de proposito irregulares: ninguem pesa o pet de 30 em 30 dias exatos,
  // e o grafico precisa aguentar hiato longo e pesagens coladas no mesmo mes.
  { id: 'w1', petId: '1', date: daysAgo(240), weightKg: 24.2 },
  { id: 'w2', petId: '1', date: daysAgo(232), weightKg: 24.4 },
  { id: 'w3', petId: '1', date: daysAgo(205), weightKg: 25.1 },
  { id: 'w4', petId: '1', date: daysAgo(118), weightKg: 27.8, notes: 'Trocou a racao.' },
  { id: 'w5', petId: '1', date: daysAgo(96), weightKg: 28.3 },
  { id: 'w6', petId: '1', date: daysAgo(88), weightKg: 28.5 },
  { id: 'w7', petId: '1', date: daysAgo(47), weightKg: 29.1, notes: 'Comecou a caminhada diaria.' },
  { id: 'w8', petId: '1', date: daysAgo(20), weightKg: 28.2 },
  { id: 'w9', petId: '1', date: daysAgo(4), weightKg: 27.6 },
  { id: 'w10', petId: '2', date: daysAgo(225), weightKg: 4.6 },
  { id: 'w11', petId: '2', date: daysAgo(190), weightKg: 4.8 },
  { id: 'w12', petId: '2', date: daysAgo(155), weightKg: 5.1, notes: 'Petiscos em excesso.' },
  { id: 'w13', petId: '2', date: daysAgo(120), weightKg: 5.0 },
  { id: 'w14', petId: '2', date: daysAgo(90), weightKg: 4.7, notes: 'Racao light, sem frango.' },
  { id: 'w15', petId: '2', date: daysAgo(45), weightKg: 4.3 },
  { id: 'w16', petId: '2', date: daysAgo(12), weightKg: 4.2 },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

/** Mais recente primeiro. */
const byDateDesc = (a: WeightEntry, b: WeightEntry) => b.date.localeCompare(a.date)

export async function listWeights(petId: string): Promise<WeightEntry[]> {
  if (!supabase) {
    await delay()
    return MOCK_WEIGHTS.filter((entry) => entry.petId === petId).sort(byDateDesc)
  }

  // TODO(supabase): .from('weights').select('*').eq('pet_id', petId).order('date')
  await delay()
  return MOCK_WEIGHTS.filter((entry) => entry.petId === petId).sort(byDateDesc)
}

export async function createWeight(input: NewWeightEntry): Promise<WeightEntry> {
  const entry: WeightEntry = { ...input, id: crypto.randomUUID() }

  if (!supabase) {
    await delay(400)
    MOCK_WEIGHTS.push(entry)
    return entry
  }

  // TODO(supabase): .from('weights').insert(input).select().single()
  await delay(400)
  MOCK_WEIGHTS.push(entry)
  return entry
}

/**
 * Pesagem e dado historico: nao existe delete por decisao de produto (25/09/2026).
 * Se precisar corrigir um lancamento errado, a afordancia certa e editar, nao remover.
 */
