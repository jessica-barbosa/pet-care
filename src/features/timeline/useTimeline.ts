import { useMemo } from 'react'

import { useAppointments } from '@/features/appointments/queries'
import { appointmentStatusLabel } from '@/features/appointments/types'
import { useExams } from '@/features/exams/queries'
import { useMedications } from '@/features/medications/queries'
import { describeDosage } from '@/features/medications/types'
import type { TimelineEvent } from '@/features/timeline/types'
import { useVaccines } from '@/features/vaccines/queries'
import type { VaccineKind } from '@/features/vaccines/types'
import { formatWeight } from '@/features/weights/types'
import { useWeights } from '@/features/weights/queries'

/** Vacina e "aplicada"; vermifugo e antipulgas, "aplicacao". */
const appliedTitle = (kind: VaccineKind, name: string) =>
  kind === 'vaccine' ? `${name} aplicada` : `Aplicação — ${name}`

const dueTitle = (kind: VaccineKind, name: string) =>
  kind === 'vaccine' ? `Reforço previsto — ${name}` : `Próxima aplicação — ${name}`

/**
 * Junta os cinco dominios numa lista unica de eventos — passado e futuro.
 *
 * Nao tem api nem cache proprios: reusa as queries de cada dominio, entao o que
 * for registrado numa secao aparece aqui na hora, sem invalidacao extra. Quem
 * consome (Agenda, Historico) filtra o recorte que precisa.
 */
export function useTimeline(petId: string) {
  const weights = useWeights(petId)
  const vaccines = useVaccines(petId)
  const appointments = useAppointments(petId)
  const medications = useMedications(petId)
  const exams = useExams(petId)

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
        title: appliedTitle(record.kind, record.name),
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
          title: dueTitle(record.kind, record.name),
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

    for (const item of medications.data ?? []) {
      result.push({
        id: `medication-${item.id}`,
        petId,
        date: item.startDate,
        kind: 'medication',
        title: `Início — ${item.name}`,
        detail: describeDosage(item) || undefined,
        to: `/pets/${petId}/medicamentos`,
      })

      if (item.endDate) {
        result.push({
          id: `medication-end-${item.id}`,
          petId,
          date: item.endDate,
          kind: 'medication',
          title: `Fim do tratamento — ${item.name}`,
          to: `/pets/${petId}/medicamentos`,
        })
      }
    }

    for (const item of exams.data ?? []) {
      result.push({
        id: `exam-${item.id}`,
        petId,
        date: item.date,
        kind: 'exam',
        title: `Exame — ${item.title}`,
        detail: item.lab,
        to: `/pets/${petId}/exames`,
      })
    }

    return result
  }, [petId, weights.data, vaccines.data, appointments.data, medications.data, exams.data])

  return {
    events,
    isLoading:
      weights.isLoading ||
      vaccines.isLoading ||
      appointments.isLoading ||
      medications.isLoading ||
      exams.isLoading,
    isError:
      weights.isError ||
      vaccines.isError ||
      appointments.isError ||
      medications.isError ||
      exams.isError,
  }
}
