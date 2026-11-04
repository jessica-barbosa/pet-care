import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { medicationStatusLabel, type MedicationStatus } from '@/features/medications/types'

const tones: Record<MedicationStatus, BadgeTone> = {
  upcoming: 'slate',
  active: 'teal',
  'ending-soon': 'amber',
  finished: 'slate',
}

const icons: Record<MedicationStatus, string> = {
  upcoming: '–',
  active: '●',
  'ending-soon': '⏳',
  finished: '✓',
}

export function MedicationStatusBadge({
  status,
  className,
}: {
  status: MedicationStatus
  className?: string
}) {
  return (
    <Badge tone={tones[status]} icon={icons[status]} className={className}>
      {medicationStatusLabel[status]}
    </Badge>
  )
}
