import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { usePendencies } from '@/features/pendencies/usePendencies'

/**
 * Aviso de pendencias da visao geral. Nao e notificacao: so aparece com o app aberto.
 * Sem pendencia, fica uma linha discreta confirmando que esta tudo em dia — para
 * "nao carregou" nao se confundir com "nao tem nada".
 */
export function PendingList({ petId }: { petId: string }) {
  const { items, isLoading } = usePendencies(petId)

  if (isLoading) return null

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800 ring-1 ring-teal-200">
        ✓ Tudo em dia: nenhuma pendência no momento.
      </p>
    )
  }

  return (
    <Card>
      <CardTitle>
        Pendências <span className="font-normal text-slate-500">({items.length})</span>
      </CardTitle>
      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg py-2.5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
              {item.severity === 'overdue' ? (
                <Badge tone="red" icon="⚠">
                  Atrasado
                </Badge>
              ) : (
                <Badge tone="amber" icon="⏳">
                  Em breve
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
