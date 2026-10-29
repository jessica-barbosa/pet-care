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

/**
 * Troca o pet do mock por uma COPIA com o patch aplicado, nunca altera o objeto.
 * O React Query decide se re-renderiza comparando referencias: mutar no lugar faz
 * a consulta devolver o mesmo objeto de antes, e telas que nao re-renderizaram por
 * outro motivo ficam mostrando o dado velho. O banco real devolve objetos novos a
 * cada consulta, entao o mock precisa se comportar igual.
 */
function replaceMockPet(id: string, patch: Partial<Pet>): Pet {
  const index = MOCK_PETS.findIndex((item) => item.id === id)
  if (index < 0) throw new Error(`Pet ${id} nao encontrado`)

  MOCK_PETS[index] = { ...MOCK_PETS[index], ...patch }
  return MOCK_PETS[index]
}

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

// ---------------------------------------------------------------------------
// Foto
// ---------------------------------------------------------------------------

const PHOTO_BUCKET = 'pet-photos'

/**
 * O banco guarda a URL publica, entao descobrir o arquivo para apagar e o caminho
 * inverso: tudo que vem depois de `/pet-photos/`. URL que nao e do nosso bucket
 * (ex.: um valor antigo digitado a mao) devolve null e simplesmente nao e apagada.
 */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

/** Apaga o arquivo antigo; falha aqui nao pode desfazer a troca, que ja deu certo. */
async function removeStoredPhoto(photoUrl: string | undefined) {
  const path = photoUrl ? pathFromPublicUrl(photoUrl) : null
  if (!path) return

  const { error } = await requireSupabase().storage.from(PHOTO_BUCKET).remove([path])
  if (error) console.warn('Não foi possível apagar a foto antiga:', error.message)
}

/**
 * Troca a foto do pet.
 *
 * Ordem importa: sobe o arquivo novo, aponta o pet para ele e SO ENTAO apaga o
 * antigo. Se o upload falhar, o pet continua com a foto que tinha; se o update do
 * banco falhar, o arquivo recem-enviado e removido para nao virar lixo no bucket.
 *
 * Cada envio usa um nome novo (uuid) — nunca sobrescreve — o que dispensa
 * `upsert` e evita a foto antiga presa no cache do navegador/CDN.
 *
 * Caminho: `pets/{pet_id}-{uuid}.webp`, direto na pasta `pets/`. A policy de Storage
 * (migration 0003) le o id do pet nos primeiros 36 caracteres do NOME do arquivo e
 * confere na tabela `pets` se e um pet do usuario logado — o id do dono nao precisa
 * aparecer no caminho. O prefixo precisa continuar sendo exatamente o id do pet.
 */
export async function setPetPhoto(pet: Pet, photo: Blob, extension: string): Promise<Pet> {
  if (!supabase) {
    await delay(400)
    return replaceMockPet(pet.id, { photoUrl: URL.createObjectURL(photo) })
  }

  const client = requireSupabase()

  const path = `pets/${pet.id}-${crypto.randomUUID()}.${extension}`

  const upload = await client.storage.from(PHOTO_BUCKET).upload(path, photo, {
    contentType: photo.type,
    // Nome unico => o conteudo nunca muda, entao o cache pode durar um ano.
    cacheControl: '31536000',
  })
  if (upload.error) throw upload.error

  const photoUrl = client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl

  const { data, error } = await client
    .from('pets')
    .update({ photo_url: photoUrl })
    .eq('id', pet.id)
    .select()
    .single()

  if (error) {
    await client.storage.from(PHOTO_BUCKET).remove([path])
    throw error
  }

  await removeStoredPhoto(pet.photoUrl)
  return toPet(data)
}

/** Volta o pet para o avatar de inicial e apaga o arquivo. */
export async function clearPetPhoto(pet: Pet): Promise<Pet> {
  if (!supabase) {
    await delay(300)
    return replaceMockPet(pet.id, { photoUrl: undefined })
  }

  const { data, error } = await requireSupabase()
    .from('pets')
    .update({ photo_url: null })
    .eq('id', pet.id)
    .select()
    .single()

  if (error) throw error

  await removeStoredPhoto(pet.photoUrl)
  return toPet(data)
}
