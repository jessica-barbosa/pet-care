import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createExam, deleteExam, listExams } from '@/features/exams/api'

export const examKeys = {
  all: ['exams'] as const,
  list: (petId: string) => [...examKeys.all, 'list', petId] as const,
}

/** Exames do pet, do mais recente para o mais antigo. */
export function useExams(petId: string) {
  return useQuery({
    queryKey: examKeys.list(petId),
    queryFn: () => listExams(petId),
    enabled: Boolean(petId),
    // Os links assinados duram 1 hora; renovar ao voltar para a aba evita link vencido.
    refetchOnWindowFocus: true,
  })
}

export function useCreateExam(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.list(petId) }),
  })
}

export function useDeleteExam(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.list(petId) }),
  })
}
