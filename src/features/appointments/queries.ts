import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createAppointment, listAppointments, updateAppointment } from '@/features/appointments/api'

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (petId: string) => [...appointmentKeys.all, 'list', petId] as const,
}

/** Consultas do pet, da mais recente para a mais antiga. */
export function useAppointments(petId: string) {
  return useQuery({
    queryKey: appointmentKeys.list(petId),
    queryFn: () => listAppointments(petId),
    enabled: Boolean(petId),
  })
}

export function useCreateAppointment(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.list(petId) }),
  })
}

/** Registrar o atendimento ou cancelar: os dois sao patch no mesmo registro. */
export function useUpdateAppointment(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.list(petId) }),
  })
}
