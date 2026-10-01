import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Etiqueta de status. O texto carrega a informacao sozinho — cor e icone apenas
 * reforcam, entao quem nao distingue as cores le a mesma coisa.
 */
export type BadgeTone = 'red' | 'amber' | 'teal' | 'slate'

const tones: Record<BadgeTone, string> = {
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function Badge({
  tone = 'slate',
  icon,
  className,
  children,
}: {
  tone?: BadgeTone
  icon?: string
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        tones[tone],
        className,
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
