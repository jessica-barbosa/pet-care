import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { usePet } from '@/features/pets/queries'
import { formatDate } from '@/lib/utils'

export default function PetDetailPage() {
  const { petId = '' } = useParams()
  const { data: pet, isLoading } = usePet(petId)

  if (isLoading) return <Spinner />
  if (!pet) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Pet nao encontrado.</p>
        <Link to="/pets" className="mt-2 inline-block text-sm text-teal-700">
          Voltar para a lista
        </Link>
      </Card>
    )
  }

  const fields = [
    { label: 'Especie', value: pet.species },
    { label: 'Raca', value: pet.breed ?? '—' },
    { label: 'Nascimento', value: pet.birthDate ? formatDate(pet.birthDate) : '—' },
    { label: 'Tutor', value: pet.ownerName ?? '—' },
  ]

  return (
    <>
      <PageHeader title={pet.name} description={pet.notes} />
      <Card className="max-w-lg">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-slate-500">{field.label}</dt>
              <dd className="font-medium text-slate-900">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  )
}
