export type PetSpecies = 'dog' | 'cat' | 'bird' | 'other'

export type Pet = {
  id: string
  name: string
  species: PetSpecies
  breed?: string
  birthDate?: string
  ownerName?: string
  /** Preenchido quando o upload de foto existir; ate la o avatar usa a inicial. */
  photoUrl?: string
  notes?: string
}

export type NewPet = Omit<Pet, 'id'>

export const speciesLabel: Record<PetSpecies, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Passaro',
  other: 'Outro',
}

export const speciesEmoji: Record<PetSpecies, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  other: '🐾',
}
