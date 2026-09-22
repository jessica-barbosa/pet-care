/** Junta classes condicionais sem dependencia externa. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(value: string | Date, locale = 'pt-BR'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}
