/**
 * Evento e o denominador comum de peso, vacina e consulta.
 *
 * Agenda e Historico nao tem dados proprios: as duas leem esta lista e apenas
 * filtram e desenham diferente (calendario x linha do tempo). Qualquer dominio
 * novo entra aqui e aparece nas duas telas sem tocar em nenhuma delas.
 */
export type EventKind = 'weight' | 'vaccine' | 'appointment'

export type TimelineEvent = {
  /** Prefixado pela origem: ids de dominios diferentes podem coincidir. */
  id: string
  petId: string
  /** `YYYY-MM-DD`. Pode ser futura (reforco marcado, consulta agendada). */
  date: string
  time?: string
  kind: EventKind
  title: string
  detail?: string
  /** Secao onde o evento tem o detalhe completo. */
  to: string
}

export const eventKindLabel: Record<EventKind, string> = {
  weight: 'Peso',
  vaccine: 'Vacina',
  appointment: 'Consulta',
}

/**
 * Uma cor por tipo, usada na bolinha do calendario e no marcador da timeline.
 * Sao tres matizes bem separadas, e nunca aparecem sozinhas — sempre com o
 * rotulo do tipo ao lado.
 */
export const eventKindColor: Record<EventKind, string> = {
  weight: 'bg-teal-500',
  vaccine: 'bg-violet-500',
  appointment: 'bg-sky-500',
}

export const eventKindTextColor: Record<EventKind, string> = {
  weight: 'text-teal-700',
  vaccine: 'text-violet-700',
  appointment: 'text-sky-700',
}

/** Mais recente primeiro (historico). */
export const byMomentDesc = (a: TimelineEvent, b: TimelineEvent) =>
  `${b.date} ${b.time ?? ''}`.localeCompare(`${a.date} ${a.time ?? ''}`)

/** Mais proximo primeiro (agenda). */
export const byMomentAsc = (a: TimelineEvent, b: TimelineEvent) => byMomentDesc(b, a)
