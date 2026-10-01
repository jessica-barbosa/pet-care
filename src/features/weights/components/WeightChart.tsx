import { useId, useMemo, useState } from 'react'

import { formatWeight, type WeightEntry } from '@/features/weights/types'
import { daysBetween, parseDateInput } from '@/lib/date'
import { formatDateShort } from '@/lib/utils'

/**
 * Grafico de area de peso x tempo, em SVG inline (sem dependencia de chart lib).
 *
 * Serie unica: a cor e o teal da marca e nao ha legenda — o titulo do card ja diz
 * o que esta plotado. O valor de cada ponto tambem existe na tabela abaixo do
 * grafico, entao o tooltip enriquece sem ser a unica forma de ler o dado.
 */

const VIEW_WIDTH = 720
const VIEW_HEIGHT = 260
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 }

const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom

const SERIES_COLOR = '#0d9488' // teal-600, validado contra a superficie branca do card
const GRID_COLOR = '#e2e8f0' // slate-200
const AXIS_TEXT = '#94a3b8' // slate-400

type Point = { x: number; y: number; entry: WeightEntry }

/** Escala com folga de 10% e um piso minimo, para a linha nao colar nas bordas. */
function buildScale(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const padding = span === 0 ? Math.max(min * 0.1, 0.5) : span * 0.1
  return { min: min - padding, max: max + padding }
}

/** Extremos do eixo: data exata, para ler como "da primeira ate a ultima pesagem". */
const formatAxisDate = formatDateShort

function formatTooltipDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(parseDateInput(value))
}

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const gradientId = useId()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Ordem cronologica: a lista chega da mais recente para a mais antiga.
  const series = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries])

  const points = useMemo<Point[]>(() => {
    if (series.length === 0) return []

    const scale = buildScale(series.map((entry) => entry.weightKg))
    const range = scale.max - scale.min || 1

    // Eixo X proporcional ao tempo, nao ao indice: duas pesagens com 3 dias de
    // intervalo ficam coladas, e um intervalo de 6 meses ocupa metade do grafico.
    // Espacar por indice achataria os hiatos e mentiria sobre o ritmo do ganho/perda.
    const firstDate = series[0].date
    const totalDays = daysBetween(firstDate, series[series.length - 1].date)

    return series.map((entry, index) => {
      // Sem intervalo (pesagem unica, ou todas no mesmo dia) nao ha tempo para
      // projetar: um ponto fica centrado e varios se distribuem por indice.
      const ratio =
        totalDays > 0
          ? daysBetween(firstDate, entry.date) / totalDays
          : series.length > 1
            ? index / (series.length - 1)
            : 0.5

      return {
        x: PADDING.left + ratio * PLOT_WIDTH,
        y: PADDING.top + PLOT_HEIGHT - ((entry.weightKg - scale.min) / range) * PLOT_HEIGHT,
        entry,
      }
    })
  }, [series])

  if (points.length === 0) return null

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const baseline = PADDING.top + PLOT_HEIGHT
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

  const scale = buildScale(series.map((entry) => entry.weightKg))
  const gridValues = [scale.max, (scale.max + scale.min) / 2, scale.min]

  const active = activeIndex === null ? null : points[activeIndex]
  const last = points[points.length - 1]

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Evolucao do peso em ${series.length} ${series.length === 1 ? 'pesagem' : 'pesagens'}`}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grade: hairline solida, recessiva. */}
        {gridValues.map((value, index) => {
          const y = PADDING.top + (index / (gridValues.length - 1)) * PLOT_HEIGHT
          return (
            <g key={value}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={VIEW_WIDTH - PADDING.right}
                y2={y}
                stroke={GRID_COLOR}
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={AXIS_TEXT}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {value.toFixed(1)}
              </text>
            </g>
          )
        })}

        {points.length > 1 && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke={SERIES_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Crosshair do ponto ativo. */}
        {active && (
          <line
            x1={active.x}
            y1={PADDING.top}
            x2={active.x}
            y2={baseline}
            stroke={SERIES_COLOR}
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        )}

        {/* Marcadores: anel de 2px na cor da superficie para nao sumirem sobre a linha. */}
        {points.map((point, index) => {
          const isActive = activeIndex === index
          const isLast = index === points.length - 1
          if (!isActive && !isLast && points.length > 1) return null
          return (
            <circle
              key={point.entry.id}
              cx={point.x}
              cy={point.y}
              r={isActive ? 5 : 4}
              fill={SERIES_COLOR}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )
        })}

        {/*
          Alvo de hover/foco generoso: o leitor mira numa data, nao num ponto de 8px.
          Com o eixo proporcional ao tempo os pontos ficam irregulares, entao cada
          faixa vai ate o meio do caminho ate o vizinho — sem sobreposicao nem buraco.
        */}
        {points.map((point, index) => {
          const left = index === 0 ? PADDING.left : (points[index - 1].x + point.x) / 2
          const right =
            index === points.length - 1
              ? VIEW_WIDTH - PADDING.right
              : (point.x + points[index + 1].x) / 2

          return (
            <rect
              key={`hit-${point.entry.id}`}
              x={left}
              y={PADDING.top}
              width={Math.max(right - left, 1)}
              height={PLOT_HEIGHT}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${formatTooltipDate(point.entry.date)}: ${formatWeight(point.entry.weightKg)}`}
              onPointerEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              className="outline-none"
            />
          )
        })}

        {/* Rotulo direto so na ponta — nunca um numero em cada ponto. */}
        {!active && (
          <text
            x={last.x}
            y={last.y - 12}
            textAnchor={points.length > 1 ? 'end' : 'middle'}
            fontSize="12"
            fontWeight="600"
            fill="#334155"
          >
            {formatWeight(last.entry.weightKg)}
          </text>
        )}

        {active && (
          <text
            x={Math.min(Math.max(active.x, PADDING.left + 40), VIEW_WIDTH - PADDING.right - 40)}
            y={active.y - 12}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#334155"
          >
            {formatWeight(active.entry.weightKg)}
          </text>
        )}

        {/* Eixo X: primeira e ultima data (rotulo em cada ponto vira ruido). */}
        <text x={PADDING.left} y={VIEW_HEIGHT - 8} fontSize="11" fill={AXIS_TEXT}>
          {formatAxisDate(series[0].date)}
        </text>
        {points.length > 1 && (
          <text
            x={VIEW_WIDTH - PADDING.right}
            y={VIEW_HEIGHT - 8}
            textAnchor="end"
            fontSize="11"
            fill={AXIS_TEXT}
          >
            {formatAxisDate(series[series.length - 1].date)}
          </text>
        )}
      </svg>

      {active && (
        <figcaption className="mt-1 text-center text-xs text-slate-500">
          {formatTooltipDate(active.entry.date)}
          {active.entry.notes ? ` · ${active.entry.notes}` : ''}
        </figcaption>
      )}
    </figure>
  )
}
