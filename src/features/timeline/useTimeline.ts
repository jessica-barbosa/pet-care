import { useMemo } from 'react'

import { useAppointments } from '@/features/appointments/queries'
import { appointmentStatusLabel } from '@/features/appointments/types'
import type { TimelineEvent } from '@/features/timeline/types'
import { useVaccines } from '@/features/vaccines/queries'
import { formatWeight } from '@/features/weights/types'
import { useWeights } from '@/features/weights/queries'

/**
 * Junta os tres dominios numa lista unica de eventos — passado e futuro.
 *
 * Nao tem api nem cache proprios: reusa as queries de cada dominio, entao o que
 * for registrado numa secao aparece aqui na hora, sem invalidacao extra. Quem
 * consome (Agenda, Historico) filtra o recorte que precisa.
 */
export function useTimeline(petId: string) {
  const weights = useWeights(petId)
  const vaccines = useVaccines(petId)
  const appointments = useAppointments(petId)

  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = []

    for (const entry of weights.data ?? []) {
      result.push({
        id: `weight-${entry.id}`,
        petId,
        date: entry.date,
        kind: 'weight',
        title: `Pesagem — ${formatWeight(entry.weightKg)}`,
        detail: entry.notes,
        to: `/pets/${petId}/peso`,
      })
    }

    for (const record of vaccines.data ?? []) {
      result.push({
        id: `vaccine-${record.id}`,
        petId,
        date: record.date,
        kind: 'vaccine',
        title: `${record.name} aplicada`,
        detail: [record.vet, record.notes].filter(Boolean).join(' · ') || undefined,
        to: `/pets/${petId}/vacinas`,
      })

      // O reforco e um segundo evento, quase sempre no futuro — e o que faz a
      // vacina aparecer na Agenda meses depois da aplicacao.
      if (record.nextDueDate) {
        result.push({
          id: `vaccine-due-${record.id}`,
          petId,
          date: record.nextDueDate,
          kind: 'vaccine',
          // "previsto": e uma data marcada, nao uma aplicacao. Sem isso, um reforco
          // vencido aparece no Historico como se a vacina tivesse sido dada.
          title: `Reforco previsto — ${record.name}`,
          to: `/pets/${petId}/vacinas`,
        })
      }
    }

    for (const item of appointments.data ?? []) {
      result.push({
        id: `appointment-${item.id}`,
        petId,
        date: item.date,
        time: item.time,
        kind: 'appointment',
        title: item.reason,
        detail:
          [item.vet, item.clinic].filter(Boolean).join(' · ') ||
          appointmentStatusLabel[item.status],
        to: `/pets/${petId}/consultas`,
      })
    }

    return result
  }, [petId, weights.data, vaccines.data, appointments.data])

  return {
    events,
    isLoading: weights.isLoading || vaccines.isLoading || appointments.isLoading,
    isError: weights.isError || vaccines.isError || appointments.isError,
  }
}
