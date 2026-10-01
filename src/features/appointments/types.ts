/**
 * Consulta e o unico registro do app que nasce no futuro e amadurece: voce agenda,
 * e depois volta para preencher o que o veterinario disse. Por isso — ao contrario
 * de peso e vacina — ela tem status e e editavel.
 */
export type AppointmentStatus = 'scheduled' | 'done' | 'cancelled'

export type Appointment = {
  id: string
  petId: string
  /** Data da consulta, `YYYY-MM-DD`. Pode ser futura. */
  date: string
  /** Horario `HH:MM`, opcional. */
  time?: string
  /** Motivo em texto livre: rotina, retorno, emergencia, o que for. */
  reason: string
  vet?: string
  clinic?: string
  status: AppointmentStatus
  /** Preenchidos depois do atendimento. */
  diagnosis?: string
  prescription?: string
  notes?: string
}

export type NewAppointment = Omit<Appointment, 'id'>

/** Patch parcial: o agendamento ja existe, so o desfecho e escrito depois. */
export type AppointmentUpdate = Pick<Appointment, 'id'> &
  Partial<Pick<Appointment, 'status' | 'diagnosis' | 'prescription' | 'notes'>>

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  done: 'Realizada',
  cancelled: 'Cancelada',
}

/** Agendadas: da mais proxima para a mais distante. Passado: da mais recente. */
export const byDateTimeAsc = (a: Appointment, b: Appointment) =>
  `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`)

export const byDateTimeDesc = (a: Appointment, b: Appointment) => byDateTimeAsc(b, a)

/** "12 de out. de 2026 as 10:30" — o horario so aparece quando existe. */
export function describeWhen(appointment: Appointment, formattedDate: string): string {
  return appointment.time ? `${formattedDate} as ${appointment.time}` : formattedDate
}
