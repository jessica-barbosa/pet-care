import { useQuery } from '@tanstack/react-query'

import { getPet, listPets } from '@/features/pets/api'

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
