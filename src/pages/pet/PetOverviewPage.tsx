import { Link, useParams } from 'react-router-dom'

import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAppointments } from '@/features/appointments/queries'
import { byDateTimeAsc, describeWhen } from '@/features/appointments/types'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { useCurrentPet } from '@/features/pets/queries'
import { speciesLabel } from '@/features/pets/types'
import { useVaccines } from '@/features/vaccines/queries'
import { getVaccineStatus } from '@/features/vaccines/types'
import { formatWeight } from '@/features/weights/types'
import { useWeights } from '@/features/weights/queries'
import { cn, formatDate, formatDateShort } from '@/lib/utils'

/**
 * Cada destaque e um atalho: o numero responde a pergunta e o clique leva para a
 * secao que tem o detalhe. Enquanto a query carrega, mostra "…" em vez de "—",
 * para "ainda nao sei" nao se confundir com "nao tem nada".
 */
function StatCard({
  title,
  value,
  hint,
  to,
  loading,
  tone = 'default',
  compact = false,
}: {
  title: string
  value: string
  hint: string
  to: string
  loading: boolean
  tone?: 'default' | 'alert'
  /** Datas sao longas e quebram em duas linhas no tamanho dos numeros. */
  compact?: boolean
}) {
  return (
    <Link
      to={to}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardTitle>{title}</CardTitle>
        <p
          className={cn(
            'mt-2 font-semibold',
            compact ? 'text-2xl' : 'text-3xl',
            loading ? 'text-slate-300' : tone === 'alert' ? 'text-red-600' : 'text-teal-700',
          )}
        >
          {loading ? '…' : value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{loading ? 'carregando' : hint}</p>
      </Card>
    </Link>
  )
}

export default function PetOverviewPage() {
  const { petId = '' } = useParams()
  const { data: pet } = useCurrentPet()

  const { data: weights = [], isLoading: loadingWeights } = useWeights(petId)
  const { data: vaccines = [], isLoading: loadingVaccines } = useVaccines(petId)
  const { data: appointments = [], isLoading: loadingAppointments } = useAppointments(petId)

  if (!pet) return null

  const latestWeight = weights[0]

  const nextAppointment = appointments
    .filter((item) => item.status === 'scheduled')
    .sort(byDateTimeAsc)[0]

  // "Pendente" = reforco vencido ou chegando nos proximos 30 dias.
  const pendingVaccines = vaccines.filter((record) => {
    const status = getVaccineStatus(record)
    return status === 'overdue' || status === 'due-soon'
  })
  const overdueCount = pendingVaccines.filter(
    (record) => getVaccineStatus(record) === 'overdue',
  ).length

  const fields = [
    { label: 'Especie', value: speciesLabel[pet.species] },
    { label: 'Raca', value: pet.breed ?? '—' },
    { label: 'Nascimento', value: pet.birthDate ? formatDate(pet.birthDate) : '—' },
    { label: 'Tutor', value: pet.ownerName ?? '—' },
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
          <StatCard
            title="Proxima consulta"
            to={`/pets/${petId}/consultas`}
            loading={loadingAppointments}
            compact
            value={nextAppointment ? formatDateShort(nextAppointment.date) : '—'}
            hint={
              nextAppointment
                ? describeWhen(nextAppointment, nextAppointment.reason)
                : 'nada agendado'
            }
          />

          <StatCard
            title="Peso atual"
            to={`/pets/${petId}/peso`}
            loading={loadingWeights}
            value={latestWeight ? formatWeight(latestWeight.weightKg) : '—'}
            hint={
              latestWeight ? `em ${formatDate(latestWeight.date)}` : 'nenhuma pesagem registrada'
            }
          />

          <StatCard
            title="Vacinas pendentes"
            to={`/pets/${petId}/vacinas`}
            loading={loadingVaccines}
            tone={overdueCount > 0 ? 'alert' : 'default'}
            value={String(pendingVaccines.length)}
            hint={
              overdueCount > 0
                ? `${overdueCount} em atraso`
                : pendingVaccines.length > 0
                  ? 'nos proximos 30 dias'
                  : 'nenhum reforco proximo'
            }
          />
        </div>
      </div>
    </>
  )
}
