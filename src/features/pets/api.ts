import type { NewPet, Pet, PetSpecies } from '@/features/pets/types'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

/**
 * Camada de acesso a dados dos pets.
 *
 * Com o Supabase configurado, fala com a tabela `pets`. Sem as variaveis de
 * ambiente, cai nos dados mock — o que mantem a app rodavel para quem clonar o
 * repositorio sem criar um projeto Supabase (ver "Modo mock" no README).
 *
 * O banco usa snake_case e a app camelCase: a conversao vive aqui, nos dois
 * mapeadores abaixo, e nenhuma tela precisa conhecer o formato das colunas.
 * `owner_id` nao e enviado no insert — a coluna tem `default auth.uid()` e a
 * policy de RLS recusa qualquer tentativa de gravar em nome de outro usuario.
 */

function toPet(row: Tables<'pets'>): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species as PetSpecies,
    breed: row.breed ?? undefined,
    birthDate: row.birth_date ?? undefined,
    ownerName: row.owner_name ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function toRow(pet: NewPet): TablesInsert<'pets'> {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? null,
    birth_date: pet.birthDate ?? null,
    owner_name: pet.ownerName ?? null,
    photo_url: pet.photoUrl ?? null,
    notes: pet.notes ?? null,
  }
}

// ---------------------------------------------------------------------------
// Mock (usado apenas sem Supabase configurado)
// ---------------------------------------------------------------------------

const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Thor',
    species: 'dog',
    breed: 'Golden Retriever',
    birthDate: '2021-03-14',
    ownerName: 'Ana Souza',
    notes: 'Se estressa com barulho de fogos.',
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

// ---------------------------------------------------------------------------

export async function listPets(): Promise<Pet[]> {
  if (!supabase) {
    await delay()
    return [...MOCK_PETS]
  }

  const { data, error } = await requireSupabase()
    .from('pets')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data.map(toPet)
}

export async function getPet(id: string): Promise<Pet | null> {
  if (!supabase) {
    await delay()
    return MOCK_PETS.find((pet) => pet.id === id) ?? null
  }

  // `maybeSingle` devolve null em vez de erro quando nao ha linha — o id pode
  // simplesmente nao existir (URL digitada a mao, pet de outro usuario).
  const { data, error } = await requireSupabase()
    .from('pets')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toPet(data) : null
}

export async function createPet(input: NewPet): Promise<Pet> {
  if (!supabase) {
    await delay(400)
    const pet: Pet = { ...input, id: crypto.randomUUID() }
    MOCK_PETS.push(pet)
    return pet
  }

  const { data, error } = await requireSupabase()
    .from('pets')
    .insert(toRow(input))
    .select()
    .single()

  if (error) throw error
  return toPet(data)
}
