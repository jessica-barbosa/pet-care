import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { WeightChart } from '@/features/weights/components/WeightChart'
import { useCreateWeight, useWeights } from '@/features/weights/queries'
import { formatWeight, getWeightTrend } from '@/features/weights/types'
import { today } from '@/lib/date'
import { formatDate } from '@/lib/utils'

export default function PetWeightPage() {
  const { petId = '' } = useParams()
  const { data: entries, isLoading } = useWeights(petId)
  const createWeight = useCreateWeight(petId)

  const [isFormOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(today())
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')

  /** O Modal desmonta o conteudo ao fechar; aqui so voltamos o estado ao inicial. */
  function closeForm() {
    setFormOpen(false)
    setWeightKg('')
    setNotes('')
    setDate(today())
    createWeight.reset()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = Number(weightKg.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return

    await createWeight.mutateAsync({
      petId,
      date,
      weightKg: parsed,
      notes: notes.trim() || undefined,
    })

    closeForm()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const list = entries ?? []
  const latest = list[0]
  const trend = getWeightTrend(list)

  return (
    <>
      <PageHeader
        title="Peso"
        description="Acompanhamento do peso ao longo do tempo."
        actions={<Button onClick={() => setFormOpen(true)}>Registrar pesagem</Button>}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title="Registrar pesagem"
        description="A pesagem entra no historico e no grafico de evolucao."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Data">
            <input
              required
              type="date"
              max={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Peso (kg)">
            <input
              required
              autoFocus
              inputMode="decimal"
              placeholder="Ex.: 27,6"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Observacoes" hint="Opcional">
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {createWeight.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">Nao foi possivel salvar a pesagem.</p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createWeight.isPending}>
              {createWeight.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {list.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nenhuma pesagem registrada</p>
          <p className="mt-1 text-sm text-slate-500">
            Registre a primeira pesagem para comecar a acompanhar a evolucao do peso.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle>Peso atual</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-teal-700">
                {formatWeight(latest.weightKg)}
              </p>
              <p className="mt-1 text-xs text-slate-500">em {formatDate(latest.date)}</p>
            </Card>

            <Card>
              <CardTitle>Variacao</CardTitle>
              {trend ? (
                <>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '−' : ''}
                    {formatWeight(Math.abs(trend.deltaKg))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {trend.direction === 'stable'
                      ? 'estavel desde a anterior'
                      : `${trend.direction === 'up' ? 'acima' : 'abaixo'} da pesagem anterior`}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-3xl font-semibold text-slate-400">—</p>
                  <p className="mt-1 text-xs text-slate-500">precisa de ao menos duas pesagens</p>
                </>
              )}
            </Card>

            <Card>
              <CardTitle>Registros</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{list.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                desde {formatDate(list[list.length - 1].date)}
              </p>
            </Card>
          </div>

          <Card>
            <CardTitle>Evolucao do peso</CardTitle>
            {list.length === 1 ? (
              <p className="mt-2 text-sm text-slate-500">
                Com uma unica pesagem ainda nao ha evolucao para desenhar — registre outra para ver
                a curva.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Passe o mouse (ou use Tab) sobre o grafico para ver cada pesagem.
              </p>
            )}
            <div className="mt-4">
              <WeightChart entries={list} />
            </div>
          </Card>

          <Card>
            <CardTitle>Historico de pesagens</CardTitle>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Peso</th>
                    <th className="pb-2 font-medium">Observacoes</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-700">{formatDate(entry.date)}</td>
                      <td
                        className="py-2 font-medium text-slate-900"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatWeight(entry.weightKg)}
                      </td>
                      <td className="py-2 text-slate-500">{entry.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
