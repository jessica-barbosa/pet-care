import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  byMomentDesc,
  eventKindColor,
  eventKindLabel,
  eventKindTextColor,
  type EventKind,
  type TimelineEvent,
} from '@/features/timeline/types'
import { useTimeline } from '@/features/timeline/useTimeline'
import { parseDateInput, today } from '@/lib/date'
import { cn, formatDate } from '@/lib/utils'

const filters: Array<{ value: EventKind | 'all'; label: string }> = [
  { value: 'all', label: 'Tudo' },
  { value: 'appointment', label: 'Consultas' },
  { value: 'vaccine', label: 'Vacinas' },
  { value: 'weight', label: 'Peso' },
]

/** "Setembro de 2026" — cabecalho de cada bloco da linha do tempo. */
function monthLabel(date: string): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parseDateInput(date))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function groupByMonth(events: TimelineEvent[]) {
  const groups: Array<{ key: string; label: string; events: TimelineEvent[] }> = []

  for (const event of events) {
    const key = event.date.slice(0, 7)
    const last = groups[groups.length - 1]

    if (last?.key === key) last.events.push(event)
    else groups.push({ key, label: monthLabel(event.date), events: [event] })
  }

  return groups
}

export default function PetHistoryPage() {
  const { petId = '' } = useParams()
  const { events, isLoading } = useTimeline(petId)
  const [filter, setFilter] = useState<EventKind | 'all'>('all')

  // Historico e so o que ja aconteceu; o que esta marcado para frente e da Agenda.
  const past = useMemo(
    () => events.filter((event) => event.date <= today()).sort(byMomentDesc),
    [events],
  )

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: past.length }
    for (const event of past) result[event.kind] = (result[event.kind] ?? 0) + 1
    return result
  }, [past])

  const groups = useMemo(
    () => groupByMonth(filter === 'all' ? past : past.filter((event) => event.kind === filter)),
    [past, filter],
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Historico"
        description="Tudo que ja aconteceu com o pet, das tres secoes, em ordem."
      />

      {past.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nada registrado ainda</p>
          <p className="mt-1 text-sm text-slate-500">
            Pesagens, vacinas e consultas aparecem aqui automaticamente conforme forem registradas.
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium ring-1 transition-colors',
                  filter === item.value
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'ml-1.5',
                    filter === item.value ? 'text-slate-300' : 'text-slate-400',
                  )}
                >
                  {counts[item.value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <Card className="max-w-2xl">
              <p className="text-sm text-slate-600">
                Nenhum registro desse tipo no historico deste pet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <Card key={group.key}>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    {group.label}
                  </h3>

                  <ol className="relative mt-4 border-l border-slate-200 pl-6">
                    {group.events.map((event) => (
                      <li key={event.id} className="relative pb-5 last:pb-0">
                        <span
                          aria-hidden
                          className={cn(
                            'absolute top-1.5 -left-[1.8125rem] size-2.5 rounded-full ring-2 ring-white',
                            eventKindColor[event.kind],
                          )}
                        />

                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span
                            className={cn('text-xs font-medium', eventKindTextColor[event.kind])}
                          >
                            {eventKindLabel[event.kind]}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(event.date)}
                            {event.time ? ` as ${event.time}` : ''}
                          </span>
                        </div>

                        <Link
                          to={event.to}
                          className="mt-0.5 block text-sm font-medium text-slate-900 hover:text-teal-700"
                        >
                          {event.title}
                        </Link>

                        {event.detail && (
                          <p className="mt-0.5 text-sm text-slate-500">{event.detail}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
