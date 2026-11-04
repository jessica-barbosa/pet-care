import { usePendencies } from '@/features/pendencies/usePendencies'
import { cn } from '@/lib/utils'

/**
 * Selo no avatar da tela de selecao: quantas pendencias o pet tem. O numero e o texto
 * abaixo do nome carregam a informacao sozinhos; a cor so reforca a gravidade.
 */
export function PendingBadge({ petId }: { petId: string }) {
  const { items } = usePendencies(petId)
  if (items.length === 0) return null

  const hasOverdue = items.some((item) => item.severity === 'overdue')

  return (
    <span
      aria-hidden
      className={cn(
        'absolute top-0 right-0 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold text-white ring-2 ring-slate-900',
        hasOverdue ? 'bg-red-600' : 'bg-amber-500',
      )}
    >
      {items.length}
    </span>
  )
}

/** "2 pendências" abaixo do nome; vazio quando nao ha nenhuma. */
export function PendingText({ petId }: { petId: string }) {
  const { items } = usePendencies(petId)
  if (items.length === 0) return null

  const hasOverdue = items.some((item) => item.severity === 'overdue')

  return (
    <p className={cn('mt-0.5 text-xs font-medium', hasOverdue ? 'text-red-400' : 'text-amber-400')}>
      {items.length === 1 ? '1 pendência' : `${items.length} pendências`}
    </p>
  )
}
