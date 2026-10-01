import type { Appointment, AppointmentUpdate, NewAppointment } from '@/features/appointments/types'
import { byDateTimeDesc } from '@/features/appointments/types'
import { toDateInput } from '@/lib/date'
import { supabase } from '@/lib/supabase'

/**
 * Camada de acesso a dados das consultas.
 *
 * Hoje responde com dados mock em memoria. Quando a tabela `appointments` existir
 * no Supabase, basta trocar o corpo de cada funcao pela query real — a assinatura
 * e os hooks de `queries.ts` continuam iguais.
 *
 * Aqui existe `update` (nao existe em peso e vacina) porque a consulta e agendada
 * antes de acontecer: o desfecho e escrito depois. Continua sem delete — consulta
 * que nao aconteceu vira `cancelled`, e o registro fica.
 */

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

export async function listAppointments(petId: string): Promise<Appointment[]> {
  if (!supabase) {
    await delay()
    return MOCK_APPOINTMENTS.filter((item) => item.petId === petId).sort(byDateTimeDesc)
  }

  // TODO(supabase): .from('appointments').select('*').eq('pet_id', petId).order('date')
  await delay()
  return MOCK_APPOINTMENTS.filter((item) => item.petId === petId).sort(byDateTimeDesc)
}

export async function createAppointment(input: NewAppointment): Promise<Appointment> {
  const appointment: Appointment = { ...input, id: crypto.randomUUID() }

  if (!supabase) {
    await delay(400)
    MOCK_APPOINTMENTS.push(appointment)
    return appointment
  }

  // TODO(supabase): .from('appointments').insert(input).select().single()
  await delay(400)
  MOCK_APPOINTMENTS.push(appointment)
  return appointment
}

export async function updateAppointment({ id, ...patch }: AppointmentUpdate) {
  const index = MOCK_APPOINTMENTS.findIndex((item) => item.id === id)
  if (index < 0) throw new Error(`Consulta ${id} nao encontrada`)

  // TODO(supabase): .from('appointments').update(patch).eq('id', id).select().single()
  await delay(400)
  MOCK_APPOINTMENTS[index] = { ...MOCK_APPOINTMENTS[index], ...patch }
  return MOCK_APPOINTMENTS[index]
}
