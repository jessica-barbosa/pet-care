import { daysBetween, today } from '@/lib/date'

/**
 * Vermifugo e antipulgas tem o mesmo formato de uma vacina (o que foi, quando foi
 * aplicado, data da proxima aplicacao digitada), entao vivem na mesma tabela e na
 * mesma tela, separados por este tipo.
 */
export type VaccineKind = 'vaccine' | 'dewormer' | 'flea_tick'

export const vaccineKindLabel: Record<VaccineKind, string> = {
  vaccine: 'Vacina',
  dewormer: 'Vermífugo',
  flea_tick: 'Antipulgas e carrapatos',
}

export const vaccineKinds = Object.keys(vaccineKindLabel) as VaccineKind[]

export type VaccineRecord = {
  id: string
  petId: string
  kind: VaccineKind
  /** Nome do cuidado, texto livre: quem sabe qual foi e o veterinario. */
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
  none: 'Sem próxima data',
}

/** "venceu ha 15 dias" / "vence hoje" / "em 18 dias". */
export function describeDueDate(nextDueDate: string, reference = today()): string {
  const days = daysBetween(reference, nextDueDate)
  if (days === 0) return 'vence hoje'

  const absolute = Math.abs(days)
  const unit = absolute === 1 ? 'dia' : 'dias'
  return days < 0 ? `venceu há ${absolute} ${unit}` : `em ${absolute} ${unit}`
}

const normalizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/**
 * Rotulo do tipo para mostrar ao lado do nome, ou vazio quando seria repeticao
 * ("Vermifugo" de tipo "Vermifugo"). Vacina sempre mostra, pois o nome e o da vacina.
 */
export function describeKind(record: VaccineRecord): string {
  const label = vaccineKindLabel[record.kind]
  return normalizeName(record.name) === normalizeName(label) ? '' : label
}

/**
 * Uma aplicacao mais recente do mesmo cuidado (mesmo tipo e mesmo nome, sem diferenciar
 * maiusculas nem acentos) renova o prazo: a data prevista do registro antigo deixa de
 * valer. Sem isso, uma antirrabica vencida continuaria "em atraso" para sempre, mesmo
 * depois de o tutor registrar a dose nova.
 */
export function isSuperseded(record: VaccineRecord, all: VaccineRecord[]): boolean {
  const key = normalizeName(record.name)

  return all.some(
    (other) =>
      other.id !== record.id &&
      other.kind === record.kind &&
      normalizeName(other.name) === key &&
      other.date > record.date,
  )
}

/** Registros com prazo ainda valendo: tem data prevista e nao foram renovados. */
export function getOpenDueRecords(records: VaccineRecord[]): VaccineRecord[] {
  return records.filter((record) => record.nextDueDate && !isSuperseded(record, records))
}

/** Reforcos primeiro pelo mais urgente; aplicacoes, da mais recente para a mais antiga. */
export const byNextDueAsc = (a: VaccineRecord, b: VaccineRecord) =>
  (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? '')

export const byDateDesc = (a: VaccineRecord, b: VaccineRecord) => b.date.localeCompare(a.date)
