import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
} from '@/features/appointments/queries'
import { byDateTimeAsc, describeWhen, type Appointment } from '@/features/appointments/types'
import { today } from '@/lib/date'
import { formatDate } from '@/lib/utils'

export default function PetAppointmentsPage() {
  const { petId = '' } = useParams()
  const { data: appointments, isLoading } = useAppointments(petId)
  const createAppointment = useCreateAppointment(petId)
  const updateAppointment = useUpdateAppointment(petId)

  const [isCreateOpen, setCreateOpen] = useState(false)
  const [outcomeTarget, setOutcomeTarget] = useState<Appointment | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)

  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [vet, setVet] = useState('')
  const [clinic, setClinic] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [prescription, setPrescription] = useState('')

  const list = useMemo(() => appointments ?? [], [appointments])

  const upcoming = useMemo(
    () => list.filter((item) => item.status === 'scheduled').sort(byDateTimeAsc),
    [list],
  )
  // Realizadas e canceladas: o que ja saiu do radar, da mais recente para a mais antiga.
  const past = useMemo(() => list.filter((item) => item.status !== 'scheduled'), [list])

  /** Consulta no futuro e um agendamento; no passado, e um atendimento ja ocorrido. */
  const isLogging = date <= today()

  function closeCreate() {
    setCreateOpen(false)
    setDate(today())
    setTime('')
    setReason('')
    setVet('')
    setClinic('')
    setDiagnosis('')
    setPrescription('')
    createAppointment.reset()
  }

  function openOutcome(appointment: Appointment) {
    setDiagnosis(appointment.diagnosis ?? '')
    setPrescription(appointment.prescription ?? '')
    updateAppointment.reset()
    setOutcomeTarget(appointment)
  }

  function closeOutcome() {
    setOutcomeTarget(null)
    setDiagnosis('')
    setPrescription('')
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!reason.trim()) return

    await createAppointment.mutateAsync({
      petId,
      date,
      time: time || undefined,
      reason: reason.trim(),
      vet: vet.trim() || undefined,
      clinic: clinic.trim() || undefined,
      status: isLogging ? 'done' : 'scheduled',
      diagnosis: isLogging ? diagnosis.trim() || undefined : undefined,
      prescription: isLogging ? prescription.trim() || undefined : undefined,
    })

    closeCreate()
  }

  async function handleOutcome(event: FormEvent) {
    event.preventDefault()
    if (!outcomeTarget) return

    await updateAppointment.mutateAsync({
      id: outcomeTarget.id,
      status: 'done',
      diagnosis: diagnosis.trim() || undefined,
      prescription: prescription.trim() || undefined,
    })

    closeOutcome()
  }

  async function handleCancel() {
    if (!cancelTarget) return

    await updateAppointment.mutateAsync({ id: cancelTarget.id, status: 'cancelled' })
    setCancelTarget(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const next = upcoming[0]
  const doneCount = list.filter((item) => item.status === 'done').length

  return (
    <>
      <PageHeader
        title="Consultas"
        description="Atendimentos veterinarios do pet."
        actions={<Button onClick={() => setCreateOpen(true)}>Nova consulta</Button>}
      />

      {/* Agendar (futuro) ou registrar o que ja aconteceu (passado): o mesmo formulario,
          que revela diagnostico e prescricao so quando a data nao e futura. */}
      <Modal
        open={isCreateOpen}
        onClose={closeCreate}
        title="Nova consulta"
        description={
          isLogging
            ? 'Data no passado: a consulta entra como realizada.'
            : 'Data no futuro: a consulta entra como agendada e voce preenche o desfecho depois.'
        }
      >
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <Field label="Data">
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Horario" hint="Opcional">
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Motivo">
              <input
                required
                placeholder="Ex.: Consulta de rotina"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Veterinario" hint="Opcional">
            <input
              value={vet}
              onChange={(event) => setVet(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Clinica" hint="Opcional">
            <input
              value={clinic}
              onChange={(event) => setClinic(event.target.value)}
              className={inputClass}
            />
          </Field>

          {isLogging && (
            <>
              <div className="sm:col-span-2">
                <Field label="Diagnostico" hint="Opcional">
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={(event) => setDiagnosis(event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Prescricao" hint="Opcional">
                  <textarea
                    rows={2}
                    value={prescription}
                    onChange={(event) => setPrescription(event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </>
          )}

          {createAppointment.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">
              Nao foi possivel salvar a consulta.
            </p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeCreate}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAppointment.isPending}>
              {createAppointment.isPending ? 'Salvando...' : isLogging ? 'Registrar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={outcomeTarget !== null}
        onClose={closeOutcome}
        title="Registrar atendimento"
        description={
          outcomeTarget
            ? `${outcomeTarget.reason} · ${describeWhen(outcomeTarget, formatDate(outcomeTarget.date))}`
            : undefined
        }
      >
        <form onSubmit={handleOutcome} className="grid gap-4">
          <Field label="Diagnostico" hint="Opcional">
            <textarea
              rows={3}
              autoFocus
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Prescricao" hint="Opcional">
            <textarea
              rows={3}
              value={prescription}
              onChange={(event) => setPrescription(event.target.value)}
              className={inputClass}
            />
          </Field>

          {updateAppointment.isError && (
            <p className="text-sm text-red-600">Nao foi possivel salvar o atendimento.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeOutcome}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAppointment.isPending}>
              {updateAppointment.isPending ? 'Salvando...' : 'Concluir consulta'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancelar consulta"
        description={
          cancelTarget
            ? `${cancelTarget.reason} · ${describeWhen(cancelTarget, formatDate(cancelTarget.date))}`
            : undefined
        }
      >
        <p className="text-sm text-slate-600">
          A consulta fica marcada como cancelada e continua no historico — nada e apagado.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCancelTarget(null)}>
            Voltar
          </Button>
          <Button variant="danger" disabled={updateAppointment.isPending} onClick={handleCancel}>
            {updateAppointment.isPending ? 'Cancelando...' : 'Cancelar consulta'}
          </Button>
        </div>
      </Modal>

      {list.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nenhuma consulta registrada</p>
          <p className="mt-1 text-sm text-slate-500">
            Agende a proxima consulta ou registre uma que ja aconteceu.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle>Proxima consulta</CardTitle>
              <p className="mt-2 text-2xl font-semibold text-teal-700">
                {next ? formatDate(next.date) : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {next
                  ? next.time
                    ? `as ${next.time} · ${next.reason}`
                    : next.reason
                  : 'nada agendado'}
              </p>
            </Card>

            <Card>
              <CardTitle>Agendadas</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{upcoming.length}</p>
              <p className="mt-1 text-xs text-slate-500">consulta(s) no futuro</p>
            </Card>

            <Card>
              <CardTitle>Realizadas</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{doneCount}</p>
              <p className="mt-1 text-xs text-slate-500">atendimento(s) concluido(s)</p>
            </Card>
          </div>

          {upcoming.length > 0 && (
            <Card>
              <CardTitle>Agendadas</CardTitle>
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.reason}</p>
                      <p className="text-xs text-slate-500">
                        {describeWhen(item, formatDate(item.date))}
                        {item.vet ? ` · ${item.vet}` : ''}
                        {item.clinic ? ` · ${item.clinic}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {/* So da para registrar o desfecho do que ja aconteceu — senao
                          o registro diria "Realizada" para uma consulta futura. */}
                      {item.date <= today() ? (
                        <Button size="sm" onClick={() => openOutcome(item)}>
                          Registrar atendimento
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">ainda nao aconteceu</span>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setCancelTarget(item)}>
                        Cancelar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {past.length > 0 && (
            <Card>
              <CardTitle>Historico</CardTitle>
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {past.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.reason}</p>
                      <AppointmentStatusBadge status={item.status} />
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {describeWhen(item, formatDate(item.date))}
                      {item.vet ? ` · ${item.vet}` : ''}
                      {item.clinic ? ` · ${item.clinic}` : ''}
                    </p>

                    {(item.diagnosis || item.prescription || item.notes) && (
                      <dl className="mt-2 grid gap-1 text-sm">
                        {item.diagnosis && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-slate-500">Diagnostico:</dt>
                            <dd className="text-slate-700">{item.diagnosis}</dd>
                          </div>
                        )}
                        {item.prescription && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-slate-500">Prescricao:</dt>
                            <dd className="text-slate-700">{item.prescription}</dd>
                          </div>
                        )}
                        {item.notes && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-slate-500">Observacoes:</dt>
                            <dd className="text-slate-700">{item.notes}</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {item.status === 'done' && (
                      <button
                        type="button"
                        onClick={() => openOutcome(item)}
                        className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800"
                      >
                        Editar desfecho
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
