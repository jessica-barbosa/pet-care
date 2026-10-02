import { eventKindColor, type TimelineEvent } from '@/features/timeline/types'
import { dateKey, daysInMonth, firstWeekday } from '@/lib/date'
import { cn } from '@/lib/utils'

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

/** Mais que isso vira sujeira na celula; o resto conta no "+N". */
const MAX_DOTS = 3

/**
 * Grade de um mes, uma celula por dia, com uma bolinha por evento.
 *
 * A bolinha sozinha nao informa nada — o dia inteiro e um botao com aria-label
 * dizendo quantos eventos tem, e clicar nele abre a lista escrita embaixo.
 */
export function MonthCalendar({
  year,
  month,
  eventsByDate,
  selected,
  onSelect,
  today,
}: {
  year: number
  /** 0 a 11, como no `Date`. */
  month: number
  eventsByDate: Map<string, TimelineEvent[]>
  selected: string | null
  onSelect: (date: string) => void
  today: string
}) {
  const total = daysInMonth(year, month)
  const leading = firstWeekday(year, month)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-xs font-medium text-slate-400">
            {weekday}
          </div>
        ))}

        {Array.from({ length: leading }, (_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {Array.from({ length: total }, (_, index) => {
          const day = index + 1
          const key = dateKey(year, month, day)
          const dayEvents = eventsByDate.get(key) ?? []
          const isToday = key === today
          const isSelected = key === selected

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${day} — ${
                dayEvents.length === 0
                  ? 'nada marcado'
                  : `${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`
              }`}
              className={cn(
                'flex aspect-square flex-col items-center justify-start gap-1 rounded-lg p-1.5 text-sm transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
                isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                !isSelected && isToday && 'bg-teal-50',
                !isSelected && !isToday && 'text-slate-700',
              )}
            >
              <span className={cn(isToday && !isSelected && 'font-semibold text-teal-700')}>
                {day}
              </span>

              <span className="flex flex-wrap items-center justify-center gap-0.5">
                {dayEvents.slice(0, MAX_DOTS).map((event) => (
                  <span
                    key={event.id}
                    aria-hidden
                    className={cn('size-1.5 rounded-full', eventKindColor[event.kind])}
                  />
                ))}
                {dayEvents.length > MAX_DOTS && (
                  <span
                    aria-hidden
                    className={cn(
                      'text-[10px] leading-none',
                      isSelected ? 'text-slate-300' : 'text-slate-400',
                    )}
                  >
                    +{dayEvents.length - MAX_DOTS}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
