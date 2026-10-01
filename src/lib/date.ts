/**
 * Datas no app sao sempre strings `YYYY-MM-DD` (mesmo formato do `<input type="date">`).
 *
 * Cuidado com `new Date('2026-09-25')`: a ISO curta e interpretada como UTC e, em
 * fusos negativos como o do Brasil, volta como dia 24. Por isso os helpers abaixo
 * montam a data por componente e as comparacoes sao feitas na propria string.
 */

/** Converte `Date` para `YYYY-MM-DD` no fuso local. */
export function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Faz o parse de `YYYY-MM-DD` como data local (nunca UTC). */
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Hoje em `YYYY-MM-DD`. */
export function today(): string {
  return toDateInput(new Date())
}

/** Diferenca em dias inteiros entre duas datas `YYYY-MM-DD` (negativa no passado). */
export function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 86_400_000
  const diff = parseDateInput(to).getTime() - parseDateInput(from).getTime()
  return Math.round(diff / MS_PER_DAY)
}
