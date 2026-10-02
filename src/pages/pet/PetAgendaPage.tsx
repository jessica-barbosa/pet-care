import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { MonthCalendar } from '@/features/timeline/components/MonthCalendar'
import {
  byMomentAsc,
  eventKindColor,
  eventKindLabel,
  eventKindTextColor,
  type EventKind,
  type TimelineEvent,
} from '@/features/timeline/types'
import { useTimeline } from '@/features/timeline/useTimeline'
import { parseDateInput, today } from '@/lib/date'
import { cn, formatDate } from '@/lib/utils'

const UPCOMING_LIMIT = 5

const kinds: EventKind[] = ['appointment', 'vaccine', 'weight']

/** "Outubro de 2026" */
function monthTitle(year: number, month: number): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function EventRow({ event }: { event: TimelineEvent }) {
  return (
    <li className="flex gap-3 py-2.5">
      <span
        aria-hidden
        className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', eventKindColor[event.kind])}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-xs font-medium', eventKindTextColor[event.kind])}>
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
        {event.detail && <p className="mt-0.5 text-sm text-slate-500">{event.detail}</p>}
      </div>
    </li>
  )
}

export default function PetAgendaPage() {
  const { petId = '' } = useParams()
  const { events, isLoading } = useTimeline(petId)
  const todayKey = today()

  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState<string | null>(todayKey)

  /**
   * Indice por data: a grade faz um lookup por celula em vez de varrer a lista
   * 30 vezes. Como tudo ja esta em memoria, navegar entre meses nao refaz query.
   */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>()
    for (const event of events) {
      const list = map.get(event.date)
      if (list) list.push(event)
      else map.set(event.date, [event])
    }
    for (const list of map.values()) list.sort(byMomentAsc)
    return map
  }, [events])

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.date >= todayKey)
        .sort(byMomentAsc)
        .slice(0, UPCOMING_LIMIT),
    [events, todayKey],
  )

  const selectedEvents = selected ? (eventsByDate.get(selected) ?? []) : []

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  function goToToday() {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
    setSelected(todayKey)
  }

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
        title="Agenda"
        description="Consultas, reforcos de vacina e pesagens no calendario. Os compromissos sao criados nas secoes de origem."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Mes anterior"
                onClick={() => shiftMonth(-1)}
              >
                ‹
              </Button>
              <h3 className="min-w-44 text-center text-sm font-semibold text-slate-900">
                {monthTitle(cursor.year, cursor.month)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Proximo mes"
                onClick={() => shiftMonth(1)}
              >
                ›
              </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>

          <MonthCalendar
            year={cursor.year}
            month={cursor.month}
            eventsByDate={eventsByDate}
            selected={selected}
            onSelect={setSelected}
            today={todayKey}
          />

          {/* Legenda: as bolinhas da grade so significam algo com ela por perto. */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            {kinds.map((kind) => (
              <span key={kind} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span aria-hidden className={cn('size-2 rounded-full', eventKindColor[kind])} />
                {eventKindLabel[kind]}
              </span>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:auto-rows-min">
          <Card>
            <CardTitle>
              {selected
                ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(
                    parseDateInput(selected),
                  )
                : 'Selecione um dia'}
            </CardTitle>

            {selectedEvents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nada marcado neste dia.</p>
            ) : (
              <ul className="mt-1 divide-y divide-slate-100">
                {selectedEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Proximos</CardTitle>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nada marcado daqui para frente. Consultas e reforcos de vacina aparecem aqui.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-slate-100">
                {upcoming.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
