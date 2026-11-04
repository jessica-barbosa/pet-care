import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMedication, endMedication, listMedications } from '@/features/medications/api'

export const medicationKeys = {
  all: ['medications'] as const,
  list: (petId: string) => [...medicationKeys.all, 'list', petId] as const,
}

/** Medicamentos do pet, do que comecou mais recentemente para o mais antigo. */
export function useMedications(petId: string) {
  return useQuery({
    queryKey: medicationKeys.list(petId),
    queryFn: () => listMedications(petId),
    enabled: Boolean(petId),
  })
}

export function useCreateMedication(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMedication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicationKeys.list(petId) }),
  })
}

export function useEndMedication(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endMedication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicationKeys.list(petId) }),
  })
}
