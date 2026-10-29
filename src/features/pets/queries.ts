import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { clearPetPhoto, createPet, getPet, listPets, setPetPhoto } from '@/features/pets/api'
import type { Pet } from '@/features/pets/types'
import { extensionFor } from '@/lib/image'

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

/**
 * Recebe o arquivo JA reduzido (ver `prepareAvatar`): a tela prepara a imagem uma
 * vez para mostrar o preview e envia exatamente esse resultado.
 */
export function useSetPetPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pet, photo }: { pet: Pet; photo: Blob }) =>
      setPetPhoto(pet, photo, extensionFor(photo)),
    // A foto aparece no seletor, na sidebar e na visao geral: invalida a familia toda.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: petKeys.all }),
  })
}

export function useClearPetPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearPetPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: petKeys.all }),
  })
}
