import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePets } from '@/features/pets/queries'

export default function DashboardPage() {
  const { data: pets = [], isLoading } = usePets()

  const stats = [
    { label: 'Pets cadastrados', value: isLoading ? '—' : pets.length },
    { label: 'Consultas na semana', value: '—' },
    { label: 'Vacinas pendentes', value: '—' },
  ]

  return (
    <>
      <PageHeader title="Dashboard" description="Visao geral do cuidado com os pets." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardTitle>{stat.label}</CardTitle>
            <p className="mt-2 text-3xl font-semibold text-teal-700">{stat.value}</p>
          </Card>
        ))}
      </div>
    </>
  )
}
