import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { MedicationStatusBadge } from '@/features/medications/components/MedicationStatusBadge'
import {
  useCreateMedication,
  useEndMedication,
  useMedications,
} from '@/features/medications/queries'
import {
  byEndAsc,
  describeDosage,
  describeMedicationEnd,
  getMedicationStatus,
  type Medication,
} from '@/features/medications/types'
import { today } from '@/lib/date'
import { formatDate } from '@/lib/utils'

export default function PetMedicationsPage() {
  const { petId = '' } = useParams()
  const { data: records, isLoading } = useMedications(petId)
  const createMedication = useCreateMedication(petId)
  const endMedication = useEndMedication(petId)

  const [isFormOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState('')
  const [vet, setVet] = useState('')
  const [notes, setNotes] = useState('')

  const list = useMemo(() => records ?? [], [records])

  /** Em andamento: tudo que nao terminou (inclui o que ainda vai comecar). */
  const ongoing = useMemo(
    () => list.filter((item) => getMedicationStatus(item) !== 'finished').sort(byEndAsc),
    [list],
  )

  const inUseCount = ongoing.filter((item) => {
    const status = getMedicationStatus(item)
    return status === 'active' || status === 'ending-soon'
  }).length
  const endingSoonCount = ongoing.filter(
    (item) => getMedicationStatus(item) === 'ending-soon',
  ).length
  const finishedCount = list.length - ongoing.length

  function closeForm() {
    setFormOpen(false)
    setName('')
    setDose('')
    setFrequency('')
    setStartDate(today())
    setEndDate('')
    setVet('')
    setNotes('')
    createMedication.reset()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    if (endDate && endDate < startDate) return

    await createMedication.mutateAsync({
      petId,
      name: name.trim(),
      dose: dose.trim() || undefined,
      frequency: frequency.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      vet: vet.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    closeForm()
  }

  /** Encerra hoje; se o tratamento ainda nao comecou, encerra no proprio inicio (o banco exige termino >= inicio). */
  function handleEnd(medication: Medication) {
    const endOn = today() > medication.startDate ? today() : medication.startDate
    endMedication.mutate({ id: medication.id, endDate: endOn })
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
        title="Medicamentos"
        description="Medicamentos e tratamentos do pet."
        actions={<Button onClick={() => setFormOpen(true)}>Registrar medicamento</Button>}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title="Registrar medicamento"
        description="Dose e frequência são as que o veterinário indicou — o app não calcula nem confere."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Medicamento">
              <input
                required
                autoFocus
                placeholder="Ex.: Probiótico"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Dose" hint="Opcional">
            <input
              placeholder="Ex.: 1 comprimido"
              value={dose}
              onChange={(event) => setDose(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Frequência" hint="Opcional">
            <input
              placeholder="Ex.: Duas vezes ao dia"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Início do tratamento">
            <input
              required
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Término" hint="Opcional. Vazio = uso contínuo">
            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Veterinário ou clínica" hint="Opcional">
            <input
              value={vet}
              onChange={(event) => setVet(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Observações" hint="Opcional">
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClass}
            />
          </Field>

          {createMedication.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">
              Não foi possível salvar o medicamento.
            </p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMedication.isPending}>
              {createMedication.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {list.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nenhum medicamento registrado</p>
          <p className="mt-1 text-sm text-slate-500">
            Registre o primeiro para acompanhar o tratamento e ver o término no histórico e na
            agenda.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle>Em uso</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{inUseCount}</p>
              <p className="mt-1 text-xs text-slate-500">medicamento(s) em andamento</p>
            </Card>

            <Card>
              <CardTitle>Terminam em breve</CardTitle>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  endingSoonCount > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {endingSoonCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">nos próximos 3 dias</p>
            </Card>

            <Card>
              <CardTitle>Concluídos</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{finishedCount}</p>
              <p className="mt-1 text-xs text-slate-500">tratamento(s) encerrado(s)</p>
            </Card>
          </div>

          {ongoing.length > 0 && (
            <Card>
              <CardTitle>Em andamento</CardTitle>
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {ongoing.map((item) => {
                  const status = getMedicationStatus(item)
                  const isEnding =
                    endMedication.isPending && endMedication.variables?.id === item.id
                  const detail = [
                    describeDosage(item),
                    item.endDate ? describeMedicationEnd(item.endDate) : 'sem data de término',
                  ]
                    .filter(Boolean)
                    .join(' · ')

                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MedicationStatusBadge status={status} />
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={endMedication.isPending}
                          onClick={() => handleEnd(item)}
                        >
                          {isEnding ? 'Encerrando...' : 'Encerrar'}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {endMedication.isError && (
                <p className="mt-2 text-sm text-red-600">Não foi possível encerrar o tratamento.</p>
              )}
            </Card>
          )}

          <Card>
            <CardTitle>Histórico de medicamentos</CardTitle>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Início</th>
                    <th className="pb-2 font-medium">Medicamento</th>
                    <th className="pb-2 font-medium">Dose e frequência</th>
                    <th className="pb-2 font-medium">Término</th>
                    <th className="pb-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 whitespace-nowrap text-slate-700">
                        {formatDate(item.startDate)}
                      </td>
                      <td className="py-2 font-medium text-slate-900">
                        {item.name}
                        {(item.vet || item.notes) && (
                          <span className="block text-xs font-normal text-slate-500">
                            {[item.vet, item.notes].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-slate-500">{describeDosage(item) || '—'}</td>
                      <td className="py-2 whitespace-nowrap text-slate-500">
                        {item.endDate ? formatDate(item.endDate) : 'uso contínuo'}
                      </td>
                      <td className="py-2">
                        <MedicationStatusBadge status={getMedicationStatus(item)} />
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
