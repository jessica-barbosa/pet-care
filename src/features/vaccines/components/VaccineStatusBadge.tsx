import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { vaccineStatusLabel, type VaccineStatus } from '@/features/vaccines/types'

const tones: Record<VaccineStatus, BadgeTone> = {
  overdue: 'red',
  'due-soon': 'amber',
  scheduled: 'teal',
  none: 'slate',
}

const icons: Record<VaccineStatus, string> = {
  overdue: '⚠',
  'due-soon': '⏳',
  scheduled: '✓',
  none: '–',
}

export function VaccineStatusBadge({
  status,
  className,
}: {
  status: VaccineStatus
  className?: string
}) {
  return (
    <Badge tone={tones[status]} icon={icons[status]} className={className}>
      {vaccineStatusLabel[status]}
    </Badge>
  )
}
