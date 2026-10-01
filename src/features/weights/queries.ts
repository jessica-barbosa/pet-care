import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createWeight, listWeights } from '@/features/weights/api'

export const weightKeys = {
  all: ['weights'] as const,
  list: (petId: string) => [...weightKeys.all, 'list', petId] as const,
}

/** Pesagens do pet, da mais recente para a mais antiga. */
export function useWeights(petId: string) {
  return useQuery({
    queryKey: weightKeys.list(petId),
    queryFn: () => listWeights(petId),
    enabled: Boolean(petId),
  })
}

export function useCreateWeight(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWeight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weightKeys.list(petId) }),
  })
}
