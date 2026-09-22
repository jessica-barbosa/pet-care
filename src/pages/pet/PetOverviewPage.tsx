import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { useCurrentPet } from '@/features/pets/queries'
import { speciesLabel } from '@/features/pets/types'
import { formatDate } from '@/lib/utils'

export default function PetOverviewPage() {
  const { data: pet } = useCurrentPet()
  if (!pet) return null

  const fields = [
    { label: 'Especie', value: speciesLabel[pet.species] },
    { label: 'Raca', value: pet.breed ?? '—' },
    { label: 'Nascimento', value: pet.birthDate ? formatDate(pet.birthDate) : '—' },
    { label: 'Tutor', value: pet.ownerName ?? '—' },
  ]

  const highlights = [
    { label: 'Proxima consulta', value: '—' },
    { label: 'Peso atual', value: '—' },
    { label: 'Vacinas pendentes', value: '—' },
  ]

  return (
    <>
      <PageHeader title="Visao geral" description={`Resumo do cuidado com ${pet.name}.`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4">
            <PetAvatar pet={pet} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{pet.name}</p>
              <p className="text-xs text-slate-500">{pet.notes ?? 'Sem observacoes.'}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-slate-500">{field.label}</dt>
                <dd className="font-medium text-slate-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:auto-rows-min">
          {highlights.map((item) => (
            <Card key={item.label}>
              <CardTitle>{item.label}</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-teal-700">{item.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
