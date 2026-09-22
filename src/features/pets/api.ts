import type { Pet } from '@/features/pets/types'
import { supabase } from '@/lib/supabase'

/**
 * Camada de acesso a dados dos pets.
 *
 * Hoje responde com dados mock. Quando a tabela `pets` existir no Supabase,
 * basta trocar o corpo de cada funcao pela query real — a assinatura e os
 * hooks de `queries.ts` continuam iguais. Exemplo:
 *
 *   const { data, error } = await requireSupabase().from('pets').select('*')
 *   if (error) throw error
 *   return data
 */

const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Thor',
    species: 'dog',
    breed: 'Golden Retriever',
    birthDate: '2021-03-14',
    ownerName: 'Ana Souza',
    notes: 'Vacina antirrabica em dia.',
  },
  {
    id: '2',
    name: 'Mia',
    species: 'cat',
    breed: 'Siames',
    birthDate: '2019-11-02',
    ownerName: 'Carlos Lima',
    notes: 'Alergia a racao com frango.',
  },
  {
    id: '3',
    name: 'Bidu',
    species: 'dog',
    breed: 'SRD',
    birthDate: '2023-06-20',
    ownerName: 'Juliana Reis',
  },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listPets(): Promise<Pet[]> {
  if (!supabase) {
    await delay()
    return MOCK_PETS
  }

  // TODO(supabase): const { data, error } = await supabase.from('pets').select('*')
  await delay()
  return MOCK_PETS
}

export async function getPet(id: string): Promise<Pet | null> {
  if (!supabase) {
    await delay()
    return MOCK_PETS.find((pet) => pet.id === id) ?? null
  }

  // TODO(supabase): .from('pets').select('*').eq('id', id).maybeSingle()
  await delay()
  return MOCK_PETS.find((pet) => pet.id === id) ?? null
}
