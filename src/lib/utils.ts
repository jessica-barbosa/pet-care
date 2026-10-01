import { parseDateInput } from '@/lib/date'

/** Junta classes condicionais sem dependencia externa. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(value: string | Date, locale = 'pt-BR'): string {
  // `new Date('2026-01-28')` e lido como UTC e volta dia 27 no fuso do Brasil.
  // Datas `YYYY-MM-DD` precisam ser montadas por componente — ver lib/date.ts.
  const date =
    typeof value === 'string'
      ? DATE_INPUT.test(value)
        ? parseDateInput(value)
        : new Date(value)
      : value

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

/**
 * "09/Out/2026" — data curta para onde nao cabe a extensa (eixo de grafico, card
 * estreito). Mes por extenso abreviado porque 09/10 e ambiguo entre quem le
 * dia/mes e quem le mes/dia.
 */
export function formatDateShort(value: string, locale = 'pt-BR'): string {
  const date = DATE_INPUT.test(value) ? parseDateInput(value) : new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  // pt-BR devolve "out.", "jan."; queremos "Out", "Jan".
  const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '')

  return `${day}/${month.charAt(0).toUpperCase()}${month.slice(1)}/${date.getFullYear()}`
}
