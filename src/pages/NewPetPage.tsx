import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { MockBanner } from '@/components/ui/MockBanner'
import { useCreatePet } from '@/features/pets/queries'
import { speciesLabel, type PetSpecies } from '@/features/pets/types'

export default function NewPetPage() {
  const navigate = useNavigate()
  const createPet = useCreatePet()

  const [name, setName] = useState('')
  const [species, setSpecies] = useState<PetSpecies>('dog')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [ownerName, setOwnerName] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const pet = await createPet.mutateAsync({
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      birthDate: birthDate || undefined,
      ownerName: ownerName.trim() || undefined,
    })
    navigate(`/pets/${pet.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MockBanner />

      <div className="mx-auto max-w-lg px-4 py-10">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </Link>

        <h1 className="mt-4 mb-1 text-2xl font-semibold tracking-tight text-slate-900">
          Cadastrar pet
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Dados basicos por enquanto — foto e detalhes vem depois.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nome">
              <input
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Especie">
              <select
                value={species}
                onChange={(event) => setSpecies(event.target.value as PetSpecies)}
                className={inputClass}
              >
                {Object.entries(speciesLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Raca" hint="Opcional">
              <input
                value={breed}
                onChange={(event) => setBreed(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Data de nascimento" hint="Opcional">
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Tutor" hint="Opcional">
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className={inputClass}
              />
            </Field>

            {createPet.isError && (
              <p className="text-sm text-red-600">Nao foi possivel salvar o pet.</p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPet.isPending}>
                {createPet.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
