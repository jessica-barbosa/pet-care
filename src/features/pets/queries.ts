import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { createPet, getPet, listPets } from '@/features/pets/api'

export const petKeys = {
  all: ['pets'] as const,
  list: () => [...petKeys.all, 'list'] as const,
  detail: (id: string) => [...petKeys.all, 'detail', id] as const,
}

export function usePets() {
  return useQuery({ queryKey: petKeys.list(), queryFn: listPets })
}

export function usePet(id: string) {
  return useQuery({ queryKey: petKeys.detail(id), queryFn: () => getPet(id), enabled: Boolean(id) })
}

/** Pet da rota atual (`/pets/:petId/...`). */
export function useCurrentPet() {
  const { petId = '' } = useParams()
  return usePet(petId)
}

export function useCreatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: petKeys.all }),
  })
}
