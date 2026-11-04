import { useMemo } from 'react'

import { useAppointments } from '@/features/appointments/queries'
import { useMedications } from '@/features/medications/queries'
import { describeMedicationEnd, getMedicationStatus } from '@/features/medications/types'
import { useVaccines } from '@/features/vaccines/queries'
import {
  describeDueDate,
  describeKind,
  getOpenDueRecords,
  getVaccineStatus,
} from '@/features/vaccines/types'
import { daysBetween, today } from '@/lib/date'

export type Pendency = {
  id: string
  /** `overdue`: ja passou da data. `soon`: chega em breve. */
  severity: 'overdue' | 'soon'
  title: string
  detail: string
  /** `YYYY-MM-DD` usada para ordenar dentro da mesma gravidade. */
  date: string
  /** Secao onde a pendencia se resolve. */
  to: string
}

/** Consultas agendadas dentro desta janela contam como "em breve". */
const APPOINTMENT_WINDOW_DAYS = 7

function describeIn(days: number): string {
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

/**
 * O que pede atencao agora, calculado so com as datas que o usuario digitou — o app
 * nao decide quando um cuidado "deveria" acontecer. Nao ha notificacao: o aviso aparece
 * quando a pessoa abre o app, e some sozinho quando ela registra o que faltava.
 *
 * Reusa as queries dos dominios (sem api nem cache proprios), como a Agenda e o
 * Historico: registrar uma vacina ou encerrar um medicamento atualiza o aviso na hora.
 */
export function usePendencies(petId: string) {
  const vaccines = useVaccines(petId)
  const appointments = useAppointments(petId)
  const medications = useMedications(petId)

  const items = useMemo<Pendency[]>(() => {
    const reference = today()
    const result: Pendency[] = []

    for (const record of getOpenDueRecords(vaccines.data ?? [])) {
      const status = getVaccineStatus(record, reference)
      if (status !== 'overdue' && status !== 'due-soon') continue

      result.push({
        id: `vaccine-${record.id}`,
        severity: status === 'overdue' ? 'overdue' : 'soon',
        title: record.name,
        detail: [describeKind(record), describeDueDate(record.nextDueDate!, reference)]
          .filter(Boolean)
          .join(' · '),
        date: record.nextDueDate!,
        to: `/pets/${petId}/vacinas`,
      })
    }

    for (const item of appointments.data ?? []) {
      if (item.status !== 'scheduled') continue

      const days = daysBetween(reference, item.date)
      if (days > APPOINTMENT_WINDOW_DAYS) continue

      result.push({
        id: `appointment-${item.id}`,
        severity: days < 0 ? 'overdue' : 'soon',
        title: item.reason,
        detail:
          days < 0
            ? 'Consulta agendada que já passou: registre o atendimento ou cancele'
            : `Consulta ${describeIn(days)}${item.time ? ` às ${item.time}` : ''}`,
        date: item.date,
        to: `/pets/${petId}/consultas`,
      })
    }

    for (const item of medications.data ?? []) {
      if (getMedicationStatus(item, reference) !== 'ending-soon' || !item.endDate) continue

      result.push({
        id: `medication-${item.id}`,
        severity: 'soon',
        title: item.name,
        detail: `Medicamento · ${describeMedicationEnd(item.endDate, reference)}`,
        date: item.endDate,
        to: `/pets/${petId}/medicamentos`,
      })
    }

    // Atrasado primeiro; dentro de cada grupo, o mais antigo (ou mais proximo) primeiro.
    return result.sort(
      (a, b) =>
        Number(b.severity === 'overdue') - Number(a.severity === 'overdue') ||
        a.date.localeCompare(b.date),
    )
  }, [petId, vaccines.data, appointments.data, medications.data])

  return {
    items,
    isLoading: vaccines.isLoading || appointments.isLoading || medications.isLoading,
  }
}
