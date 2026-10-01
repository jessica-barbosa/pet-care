import { daysBetween, today } from '@/lib/date'

export type VaccineRecord = {
  id: string
  petId: string
  /** Nome da vacina, texto livre: quem sabe qual foi e o veterinario. */
  name: string
  /** Data da aplicacao, `YYYY-MM-DD`. */
  date: string
  /** Proximo reforco, `YYYY-MM-DD`. Sempre digitado — o app nao calcula intervalo. */
  nextDueDate?: string
  vet?: string
  batch?: string
  notes?: string
}

export type NewVaccineRecord = Omit<VaccineRecord, 'id'>

export type VaccineStatus = 'overdue' | 'due-soon' | 'scheduled' | 'none'

/** Janela em que um reforco ja conta como "chegando". */
const DUE_SOON_DAYS = 30

/**
 * Status derivado APENAS da data que o usuario digitou — aritmetica sobre o dado
 * dele, nunca protocolo veterinario presumido pelo app.
 */
export function getVaccineStatus(record: VaccineRecord, reference = today()): VaccineStatus {
  if (!record.nextDueDate) return 'none'

  const days = daysBetween(reference, record.nextDueDate)
  if (days < 0) return 'overdue'
  if (days <= DUE_SOON_DAYS) return 'due-soon'
  return 'scheduled'
}

export const vaccineStatusLabel: Record<VaccineStatus, string> = {
  overdue: 'Em atraso',
  'due-soon': 'Chegando',
  scheduled: 'Em dia',
  none: 'Sem reforco definido',
}

/** "venceu ha 15 dias" / "vence hoje" / "em 18 dias". */
export function describeDueDate(nextDueDate: string, reference = today()): string {
  const days = daysBetween(reference, nextDueDate)
  if (days === 0) return 'vence hoje'

  const absolute = Math.abs(days)
  const unit = absolute === 1 ? 'dia' : 'dias'
  return days < 0 ? `venceu ha ${absolute} ${unit}` : `em ${absolute} ${unit}`
}

/** Reforcos primeiro pelo mais urgente; aplicacoes, da mais recente para a mais antiga. */
export const byNextDueAsc = (a: VaccineRecord, b: VaccineRecord) =>
  (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? '')

export const byDateDesc = (a: VaccineRecord, b: VaccineRecord) => b.date.localeCompare(a.date)
