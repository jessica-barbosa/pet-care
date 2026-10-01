import type { NewVaccineRecord, VaccineRecord } from '@/features/vaccines/types'
import { byDateDesc } from '@/features/vaccines/types'
import { toDateInput } from '@/lib/date'
import { supabase } from '@/lib/supabase'

/**
 * Camada de acesso a dados das vacinas.
 *
 * Hoje responde com dados mock em memoria. Quando a tabela `vaccines` existir no
 * Supabase, basta trocar o corpo de cada funcao pela query real — a assinatura e
 * os hooks de `queries.ts` continuam iguais. Exemplo:
 *
 *   const { data, error } = await requireSupabase()
 *     .from('vaccines').select('*').eq('pet_id', petId).order('date', { ascending: false })
 *   if (error) throw error
 *   return data
 *
 * Como no peso, nao existe delete: aplicacao de vacina e dado historico.
 */

/** Datas relativas a hoje: dados fixos envelheceriam e esvaziariam as telas. */
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInput(date)
}

/**
 * Thor cobre os quatro status (atraso, chegando, em dia, sem reforco); Mia tem
 * duas aplicacoes; Bidu nao tem nenhuma (estado vazio).
 *
 * Nomes e intervalos aqui sao dados de exemplo digitados, nao recomendacao: o app
 * nao guarda tabela de protocolo vacinal.
 */
const MOCK_VACCINES: VaccineRecord[] = [
  {
    id: 'v1',
    petId: '1',
    name: 'Antirrabica',
    date: daysFromNow(-380),
    nextDueDate: daysFromNow(-15),
    vet: 'Clinica VetSul',
    batch: 'ARB-2251',
  },
  {
    id: 'v2',
    petId: '1',
    name: 'V10 (multipla canina)',
    date: daysFromNow(-347),
    nextDueDate: daysFromNow(18),
    vet: 'Clinica VetSul',
    batch: 'V10-8830',
  },
  {
    id: 'v3',
    petId: '1',
    name: 'Gripe canina',
    date: daysFromNow(-120),
    nextDueDate: daysFromNow(245),
    vet: 'Dra. Helena Prado',
  },
  {
    id: 'v4',
    petId: '1',
    name: 'Giardia',
    date: daysFromNow(-200),
    notes: 'Dose unica combinada com o check-up.',
  },
  {
    id: 'v5',
    petId: '2',
    name: 'V4 (quadrupla felina)',
    date: daysFromNow(-298),
    nextDueDate: daysFromNow(62),
    vet: 'Dra. Helena Prado',
    batch: 'V4-1174',
  },
  {
    id: 'v6',
    petId: '2',
    name: 'Antirrabica',
    date: daysFromNow(-298),
    nextDueDate: daysFromNow(3),
    vet: 'Dra. Helena Prado',
  },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listVaccines(petId: string): Promise<VaccineRecord[]> {
  if (!supabase) {
    await delay()
    return MOCK_VACCINES.filter((record) => record.petId === petId).sort(byDateDesc)
  }

  // TODO(supabase): .from('vaccines').select('*').eq('pet_id', petId).order('date')
  await delay()
  return MOCK_VACCINES.filter((record) => record.petId === petId).sort(byDateDesc)
}

export async function createVaccine(input: NewVaccineRecord): Promise<VaccineRecord> {
  const record: VaccineRecord = { ...input, id: crypto.randomUUID() }

  if (!supabase) {
    await delay(400)
    MOCK_VACCINES.push(record)
    return record
  }

  // TODO(supabase): .from('vaccines').insert(input).select().single()
  await delay(400)
  MOCK_VACCINES.push(record)
  return record
}
