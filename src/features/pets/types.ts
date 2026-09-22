export type PetSpecies = 'dog' | 'cat' | 'bird' | 'other'

export type Pet = {
  id: string
  name: string
  species: PetSpecies
  breed?: string
  birthDate?: string
  ownerName?: string
  photoUrl?: string
  notes?: string
}
