import type { SVGProps } from 'react'

/**
 * Icones da navegacao em SVG inline, nao emoji.
 *
 * Emoji parecem alinhados na caixa (mesma largura de avanco) mas sao DESENHADOS
 * em tamanhos diferentes por fonte e por sistema — o ⚖️ saia visivelmente menor e
 * mais baixo que os vizinhos. Com path proprio todos ocupam a mesma grade 24x24, e
 * `currentColor` faz o icone virar branco sozinho no item ativo.
 */
type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-5 shrink-0"
      {...props}
    >
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Icon>
  )
}

/** Balanca de dois pratos — peso. */
export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v16M8 20h8" />
      <path d="M4 8h16" />
      <path d="M4 8 1.8 13a2.6 2.6 0 0 0 4.4 0Z" />
      <path d="M20 8l2.2 5a2.6 2.6 0 0 1-4.4 0Z" />
    </Icon>
  )
}

/** Linha de batimento — consultas. */
export function PulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h3.5l2.5-6 4 12 2.5-6H21" />
    </Icon>
  )
}

export function SyringeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4" />
      <rect x="7" y="8.5" width="9" height="7" rx="1.5" />
      <path d="M10 8.5v7M13 8.5v7" />
      <path d="M16 10.5h2.5a1.5 1.5 0 0 1 0 3H16" />
    </Icon>
  )
}

/** Relogio — historico. */
export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </Icon>
  )
}
