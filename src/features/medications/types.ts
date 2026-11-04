import { daysBetween, today } from '@/lib/date'

/**
 * Medicamento ou tratamento. Dose e frequencia sao texto livre: o app registra o que
 * o veterinario passou, nunca calcula nem valida posologia.
 */
export type Medication = {
  id: string
  petId: string
  /** Nome do medicamento, texto livre. */
  name: string
  dose?: string
  frequency?: string
  /** Inicio do tratamento, `YYYY-MM-DD`. */
  startDate: string
  /**
   * Dia em que o tratamento termina: a partir dele, ja conta como concluido. Vazio = sem
   * data de termino (uso continuo) ate o tutor encerrar.
   */
  endDate?: string
  vet?: string
  notes?: string
}

export type NewMedication = Omit<Medication, 'id'>

/** Unico campo que muda depois de registrado: encerrar o tratamento define o termino. */
export type MedicationUpdate = Pick<Medication, 'id'> & { endDate: string }

export type MedicationStatus = 'upcoming' | 'active' | 'ending-soon' | 'finished'

/** Janela em que um tratamento ja conta como "termina em breve". */
const ENDING_SOON_DAYS = 3

/**
 * Situacao derivada APENAS das datas que o usuario digitou — aritmetica sobre o dado
 * dele, nunca duracao de tratamento presumida pelo app.
 */
export function getMedicationStatus(medication: Medication, reference = today()): MedicationStatus {
  if (daysBetween(reference, medication.startDate) > 0) return 'upcoming'

  if (medication.endDate) {
    const days = daysBetween(reference, medication.endDate)
    // "Encerrar" grava a data de hoje: tem que virar "Concluido" na hora, e nao so amanha.
    if (days <= 0) return 'finished'
    if (days <= ENDING_SOON_DAYS) return 'ending-soon'
  }

  return 'active'
}

export const medicationStatusLabel: Record<MedicationStatus, string> = {
  upcoming: 'Ainda não começou',
  active: 'Em uso',
  'ending-soon': 'Termina em breve',
  finished: 'Concluído',
}

/** "terminou hoje" / "termina amanhã" / "termina em 2 dias" / "terminou há 10 dias". */
export function describeMedicationEnd(endDate: string, reference = today()): string {
  const days = daysBetween(reference, endDate)
  if (days === 0) return 'terminou hoje'
  if (days === 1) return 'termina amanhã'

  const absolute = Math.abs(days)
  const unit = absolute === 1 ? 'dia' : 'dias'
  return days < 0 ? `terminou há ${absolute} ${unit}` : `termina em ${absolute} ${unit}`
}

/** Dose e frequencia na mesma linha, so o que foi preenchido. */
export function describeDosage(medication: Medication): string {
  return [medication.dose, medication.frequency].filter(Boolean).join(' · ')
}

/** Mais recente primeiro (historico). */
export const byStartDesc = (a: Medication, b: Medication) => b.startDate.localeCompare(a.startDate)

/** Em andamento: o que termina antes vem primeiro; sem termino (uso continuo) por ultimo. */
export const byEndAsc = (a: Medication, b: Medication) =>
  (a.endDate ?? '9999-12-31').localeCompare(b.endDate ?? '9999-12-31')
