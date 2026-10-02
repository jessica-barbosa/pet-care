import type { NewVaccineRecord, VaccineRecord } from '@/features/vaccines/types'
import { byDateDesc } from '@/features/vaccines/types'
import { toDateInput } from '@/lib/date'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

/**
 * Camada de acesso a dados das vacinas.
 *
 * Como o peso, nao tem update nem delete — as policies de RLS so concedem SELECT
 * e INSERT. `next_due_date` e sempre o que o usuario digitou: nem a app nem o
 * banco calculam intervalo de reforco.
 */

function toRecord(row: Tables<'vaccines'>): VaccineRecord {
  return {
    id: row.id,
    petId: row.pet_id,
    name: row.name,
    date: row.date,
    nextDueDate: row.next_due_date ?? undefined,
    vet: row.vet ?? undefined,
    batch: row.batch ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function toRow(record: NewVaccineRecord): TablesInsert<'vaccines'> {
  return {
    pet_id: record.petId,
    name: record.name,
    date: record.date,
    next_due_date: record.nextDueDate ?? null,
    vet: record.vet ?? null,
    batch: record.batch ?? null,
    notes: record.notes ?? null,
  }
}

// ---------------------------------------------------------------------------
// Mock (usado apenas sem Supabase configurado)
// ---------------------------------------------------------------------------

/** Datas relativas a hoje: dados fixos envelheceriam e esvaziariam as telas. */
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInput(date)
}

/**
 * Thor cobre os quatro status (atraso, chegando, em dia, sem reforco); Mia tem
 * duas aplicacoes; Bidu nao tem nenhuma (estado vazio).
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

// ---------------------------------------------------------------------------

export async function listVaccines(petId: string): Promise<VaccineRecord[]> {
  if (!supabase) {
    await delay()
    return MOCK_VACCINES.filter((record) => record.petId === petId).sort(byDateDesc)
  }

  const { data, error } = await requireSupabase()
    .from('vaccines')
    .select('*')
    .eq('pet_id', petId)
    .order('date', { ascending: false })

  if (error) throw error
  return data.map(toRecord)
}

export async function createVaccine(input: NewVaccineRecord): Promise<VaccineRecord> {
  if (!supabase) {
    await delay(400)
    const record: VaccineRecord = { ...input, id: crypto.randomUUID() }
    MOCK_VACCINES.push(record)
    return record
  }

  const { data, error } = await requireSupabase()
    .from('vaccines')
    .insert(toRow(input))
    .select()
    .single()

  if (error) throw error
  return toRecord(data)
}
