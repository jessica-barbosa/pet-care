import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { VaccineStatusBadge } from '@/features/vaccines/components/VaccineStatusBadge'
import { useCreateVaccine, useVaccines } from '@/features/vaccines/queries'
import { byNextDueAsc, describeDueDate, getVaccineStatus } from '@/features/vaccines/types'
import { today } from '@/lib/date'
import { formatDate } from '@/lib/utils'

export default function PetVaccinesPage() {
  const { petId = '' } = useParams()
  const { data: records, isLoading } = useVaccines(petId)
  const createVaccine = useCreateVaccine(petId)

  const [isFormOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(today())
  const [nextDueDate, setNextDueDate] = useState('')
  const [vet, setVet] = useState('')
  const [batch, setBatch] = useState('')
  const [notes, setNotes] = useState('')

  const list = useMemo(() => records ?? [], [records])

  /** Reforcos: so o que tem data marcada, do mais urgente para o mais distante. */
  const upcoming = useMemo(
    () => list.filter((record) => record.nextDueDate).sort(byNextDueAsc),
    [list],
  )

  const overdueCount = upcoming.filter((record) => getVaccineStatus(record) === 'overdue').length
  const dueSoonCount = upcoming.filter((record) => getVaccineStatus(record) === 'due-soon').length

  function closeForm() {
    setFormOpen(false)
    setName('')
    setDate(today())
    setNextDueDate('')
    setVet('')
    setBatch('')
    setNotes('')
    createVaccine.reset()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await createVaccine.mutateAsync({
      petId,
      name: name.trim(),
      date,
      nextDueDate: nextDueDate || undefined,
      vet: vet.trim() || undefined,
      batch: batch.trim() || undefined,
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

  return (
    <>
      <PageHeader
        title="Vacinas"
        description="Carteira de vacinacao do pet."
        actions={<Button onClick={() => setFormOpen(true)}>Registrar vacina</Button>}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title="Registrar vacina"
        description="O proximo reforco e a data que o veterinario passou — o app nao calcula intervalo."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Vacina">
              <input
                required
                autoFocus
                placeholder="Ex.: Antirrabica"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Data da aplicacao">
            <input
              required
              type="date"
              max={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Proximo reforco" hint="Opcional">
            <input
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Veterinario ou clinica" hint="Opcional">
            <input
              value={vet}
              onChange={(event) => setVet(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Lote" hint="Opcional">
            <input
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
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

          {createVaccine.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">Nao foi possivel salvar a vacina.</p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createVaccine.isPending}>
              {createVaccine.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {list.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nenhuma vacina registrada</p>
          <p className="mt-1 text-sm text-slate-500">
            Registre a primeira aplicacao para montar a carteira de vacinacao.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle>Em atraso</CardTitle>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {overdueCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {overdueCount === 0 ? 'nenhum reforco vencido' : 'reforco(s) ja vencido(s)'}
              </p>
            </Card>

            <Card>
              <CardTitle>Proximos 30 dias</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{dueSoonCount}</p>
              <p className="mt-1 text-xs text-slate-500">reforco(s) chegando</p>
            </Card>

            <Card>
              <CardTitle>Aplicacoes</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{list.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                desde {formatDate(list[list.length - 1].date)}
              </p>
            </Card>
          </div>

          {upcoming.length > 0 && (
            <Card>
              <CardTitle>Proximos reforcos</CardTitle>
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {upcoming.map((record) => {
                  const status = getVaccineStatus(record)
                  return (
                    <li
                      key={record.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{record.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(record.nextDueDate!)} · {describeDueDate(record.nextDueDate!)}
                        </p>
                      </div>
                      <VaccineStatusBadge status={status} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          <Card>
            <CardTitle>Historico de aplicacoes</CardTitle>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Vacina</th>
                    <th className="pb-2 font-medium">Veterinario</th>
                    <th className="pb-2 font-medium">Lote</th>
                    <th className="pb-2 font-medium">Proximo reforco</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 whitespace-nowrap text-slate-700">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-2 font-medium text-slate-900">
                        {record.name}
                        {record.notes && (
                          <span className="block text-xs font-normal text-slate-500">
                            {record.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-slate-500">{record.vet ?? '—'}</td>
                      <td className="py-2 text-slate-500">{record.batch ?? '—'}</td>
                      <td className="py-2 whitespace-nowrap text-slate-500">
                        {record.nextDueDate ? formatDate(record.nextDueDate) : '—'}
                      </td>
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
