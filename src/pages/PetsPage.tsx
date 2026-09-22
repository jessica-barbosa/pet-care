import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { usePets } from '@/features/pets/queries'
import { formatDate } from '@/lib/utils'

const speciesLabel: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Passaro',
  other: 'Outro',
}

export default function PetsPage() {
  const { data: pets, isLoading, error } = usePets()

  return (
    <>
      <PageHeader
        title="Pets"
        description="Todos os pets cadastrados."
        actions={<Button disabled>Novo pet</Button>}
      />

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Nao foi possivel carregar os pets.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets?.map((pet) => (
          <Card key={pet.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{pet.name}</h3>
                <p className="text-sm text-slate-500">
                  {speciesLabel[pet.species] ?? pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </p>
              </div>
              <Link to={`/pets/${pet.id}`} className="text-sm font-medium text-teal-700">
                Ver
              </Link>
            </div>
            {pet.birthDate && (
              <p className="mt-3 text-xs text-slate-400">Nascimento: {formatDate(pet.birthDate)}</p>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
