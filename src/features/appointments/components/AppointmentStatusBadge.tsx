import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { appointmentStatusLabel, type AppointmentStatus } from '@/features/appointments/types'

const tones: Record<AppointmentStatus, BadgeTone> = {
  scheduled: 'amber',
  done: 'teal',
  cancelled: 'slate',
}

const icons: Record<AppointmentStatus, string> = {
  scheduled: '📅',
  done: '✓',
  cancelled: '✕',
}

export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  return (
    <Badge tone={tones[status]} icon={icons[status]} className={className}>
      {appointmentStatusLabel[status]}
    </Badge>
  )
}
