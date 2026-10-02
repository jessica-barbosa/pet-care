import type {
  Appointment,
  AppointmentStatus,
  AppointmentUpdate,
  NewAppointment,
} from '@/features/appointments/types'
import { byDateTimeDesc } from '@/features/appointments/types'
import { toDateInput } from '@/lib/date'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

/**
 * Camada de acesso a dados das consultas.
 *
 * Unica tabela com UPDATE liberado na RLS: a consulta e agendada antes de
 * acontecer e recebe o desfecho depois. Continua sem DELETE — consulta que nao
 * aconteceu vira `cancelled`, e a linha fica.
 */

function toAppointment(row: Tables<'appointments'>): Appointment {
  return {
    id: row.id,
    petId: row.pet_id,
    date: row.date,
    // Postgres devolve `time` como "HH:MM:SS"; o <input type="time"> usa "HH:MM".
    time: row.time ? row.time.slice(0, 5) : undefined,
    reason: row.reason,
    vet: row.vet ?? undefined,
    clinic: row.clinic ?? undefined,
    status: row.status as AppointmentStatus,
    diagnosis: row.diagnosis ?? undefined,
    prescription: row.prescription ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function toRow(appointment: NewAppointment): TablesInsert<'appointments'> {
  return {
    pet_id: appointment.petId,
    date: appointment.date,
    time: appointment.time ?? null,
    reason: appointment.reason,
    vet: appointment.vet ?? null,
    clinic: appointment.clinic ?? null,
    status: appointment.status,
    diagnosis: appointment.diagnosis ?? null,
    prescription: appointment.prescription ?? null,
    notes: appointment.notes ?? null,
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
 * Thor cobre os tres status; Mia tem uma agendada e uma realizada; Bidu nao tem
 * nenhuma (estado vazio).
 */
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    petId: '1',
    date: daysFromNow(12),
    time: '10:30',
    reason: 'Retorno - controle de peso',
    vet: 'Dra. Helena Prado',
    clinic: 'Clinica VetSul',
    status: 'scheduled',
  },
  {
    id: 'a2',
    petId: '1',
    date: daysFromNow(-47),
    time: '09:00',
    reason: 'Consulta de rotina',
    vet: 'Dra. Helena Prado',
    clinic: 'Clinica VetSul',
    status: 'done',
    diagnosis: 'Sobrepeso leve. Exame fisico sem outras alteracoes.',
    prescription: 'Racao de controle calorico e caminhada diaria de 30 min.',
  },
  {
    id: 'a3',
    petId: '1',
    date: daysFromNow(-120),
    reason: 'Check-up e vacinacao',
    vet: 'Dr. Marcos Ferraz',
    clinic: 'Clinica VetSul',
    status: 'done',
    diagnosis: 'Exame fisico normal.',
  },
  {
    id: 'a4',
    petId: '1',
    date: daysFromNow(-200),
    time: '14:00',
    reason: 'Avaliacao ortopedica',
    clinic: 'Clinica VetSul',
    status: 'cancelled',
    notes: 'Desmarcada pela clinica.',
  },
  {
    id: 'a5',
    petId: '2',
    date: daysFromNow(3),
    time: '15:00',
    reason: 'Avaliacao dermatologica',
    vet: 'Dra. Helena Prado',
    status: 'scheduled',
  },
  {
    id: 'a6',
    petId: '2',
    date: daysFromNow(-90),
    reason: 'Cocaira e queda de pelo',
    vet: 'Dra. Helena Prado',
    status: 'done',
    diagnosis: 'Reacao alimentar a proteina de frango.',
    prescription: 'Racao hipoalergenica sem frango por 60 dias.',
  },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------

export async function listAppointments(petId: string): Promise<Appointment[]> {
  if (!supabase) {
    await delay()
    return MOCK_APPOINTMENTS.filter((item) => item.petId === petId).sort(byDateTimeDesc)
  }

  const { data, error } = await requireSupabase()
    .from('appointments')
    .select('*')
    .eq('pet_id', petId)
    .order('date', { ascending: false })
    .order('time', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data.map(toAppointment)
}

export async function createAppointment(input: NewAppointment): Promise<Appointment> {
  if (!supabase) {
    await delay(400)
    const appointment: Appointment = { ...input, id: crypto.randomUUID() }
    MOCK_APPOINTMENTS.push(appointment)
    return appointment
  }

  const { data, error } = await requireSupabase()
    .from('appointments')
    .insert(toRow(input))
    .select()
    .single()

  if (error) throw error
  return toAppointment(data)
}

export async function updateAppointment({ id, ...patch }: AppointmentUpdate) {
  if (!supabase) {
    await delay(400)
    const index = MOCK_APPOINTMENTS.findIndex((item) => item.id === id)
    if (index < 0) throw new Error(`Consulta ${id} nao encontrada`)
    MOCK_APPOINTMENTS[index] = { ...MOCK_APPOINTMENTS[index], ...patch }
    return MOCK_APPOINTMENTS[index]
  }

  // Patch parcial: so os campos do desfecho. `undefined` vira null para limpar
  // um campo que o usuario apagou ao editar.
  const { data, error } = await requireSupabase()
    .from('appointments')
    .update({
      ...(patch.status !== undefined && { status: patch.status }),
      ...('diagnosis' in patch && { diagnosis: patch.diagnosis ?? null }),
      ...('prescription' in patch && { prescription: patch.prescription ?? null }),
      ...('notes' in patch && { notes: patch.notes ?? null }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toAppointment(data)
}
