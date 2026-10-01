import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createVaccine, listVaccines } from '@/features/vaccines/api'

export const vaccineKeys = {
  all: ['vaccines'] as const,
  list: (petId: string) => [...vaccineKeys.all, 'list', petId] as const,
}

/** Vacinas do pet, da aplicacao mais recente para a mais antiga. */
export function useVaccines(petId: string) {
  return useQuery({
    queryKey: vaccineKeys.list(petId),
    queryFn: () => listVaccines(petId),
    enabled: Boolean(petId),
  })
}

export function useCreateVaccine(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVaccine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vaccineKeys.list(petId) }),
  })
}
