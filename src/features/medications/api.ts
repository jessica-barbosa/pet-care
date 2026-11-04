import type { Medication, MedicationUpdate, NewMedication } from '@/features/medications/types'
import { byStartDesc } from '@/features/medications/types'
import { toDateInput } from '@/lib/date'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

/**
 * Camada de acesso a dados dos medicamentos.
 *
 * Nao tem delete (a policy so concede SELECT, INSERT e UPDATE) e o UPDATE so alcanca
 * `end_date`: depois de registrado, o unico gesto possivel e encerrar o tratamento.
 */

function toMedication(row: Tables<'medications'>): Medication {
  return {
    id: row.id,
    petId: row.pet_id,
    name: row.name,
    dose: row.dose ?? undefined,
    frequency: row.frequency ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    vet: row.vet ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function toRow(medication: NewMedication): TablesInsert<'medications'> {
  return {
    pet_id: medication.petId,
    name: medication.name,
    dose: medication.dose ?? null,
    frequency: medication.frequency ?? null,
    start_date: medication.startDate,
    end_date: medication.endDate ?? null,
    vet: medication.vet ?? null,
    notes: medication.notes ?? null,
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
 * Thor cobre tres situacoes (termina em breve, concluido, uso continuo); Mia tem um
 * em uso; Bidu nao tem nenhum (estado vazio).
 */
const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'm1',
    petId: '1',
    name: 'Probiótico',
    dose: '1 sachê',
    frequency: 'Uma vez ao dia',
    startDate: daysFromNow(-6),
    endDate: daysFromNow(2),
    vet: 'Dra. Helena Prado',
  },
  {
    id: 'm2',
    petId: '1',
    name: 'Colírio',
    dose: '1 gota em cada olho',
    frequency: 'Duas vezes ao dia',
    startDate: daysFromNow(-30),
    endDate: daysFromNow(-20),
    vet: 'Clínica VetSul',
    notes: 'Tratamento concluído sem intercorrências.',
  },
  {
    id: 'm3',
    petId: '1',
    name: 'Suplemento articular',
    dose: '1 comprimido',
    frequency: 'Uma vez ao dia',
    startDate: daysFromNow(-60),
    notes: 'Uso contínuo.',
  },
  {
    id: 'm4',
    petId: '2',
    name: 'Pasta de malte',
    frequency: 'Duas vezes por semana',
    startDate: daysFromNow(-40),
  },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------

export async function listMedications(petId: string): Promise<Medication[]> {
  if (!supabase) {
    await delay()
    return MOCK_MEDICATIONS.filter((item) => item.petId === petId).sort(byStartDesc)
  }

  const { data, error } = await requireSupabase()
    .from('medications')
    .select('*')
    .eq('pet_id', petId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data.map(toMedication)
}

export async function createMedication(input: NewMedication): Promise<Medication> {
  if (!supabase) {
    await delay(400)
    const medication: Medication = { ...input, id: crypto.randomUUID() }
    MOCK_MEDICATIONS.push(medication)
    return medication
  }

  const { data, error } = await requireSupabase()
    .from('medications')
    .insert(toRow(input))
    .select()
    .single()

  if (error) throw error
  return toMedication(data)
}

/** Encerrar o tratamento: define a data de termino. */
export async function endMedication({ id, endDate }: MedicationUpdate): Promise<Medication> {
  if (!supabase) {
    await delay(400)
    const index = MOCK_MEDICATIONS.findIndex((item) => item.id === id)
    if (index < 0) throw new Error(`Medicamento ${id} não encontrado`)
    MOCK_MEDICATIONS[index] = { ...MOCK_MEDICATIONS[index], endDate }
    return MOCK_MEDICATIONS[index]
  }

  const { data, error } = await requireSupabase()
    .from('medications')
    .update({ end_date: endDate })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toMedication(data)
}
