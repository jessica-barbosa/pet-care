import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn(
        'inline-block size-6 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600',
        className,
      )}
    />
  )
}
