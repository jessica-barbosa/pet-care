import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useCreateExam, useDeleteExam, useExams } from '@/features/exams/queries'
import {
  examAccept,
  examKindLabel,
  formatFileSize,
  validateExamFile,
  type Exam,
} from '@/features/exams/types'
import { today } from '@/lib/date'
import { formatDate } from '@/lib/utils'

export default function PetExamsPage() {
  const { petId = '' } = useParams()
  const { data: records, isLoading } = useExams(petId)
  const createExam = useCreateExam(petId)
  const deleteExam = useDeleteExam(petId)

  const [isFormOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [lab, setLab] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  /** Remocao em dois passos: o primeiro clique so pede confirmacao na propria linha. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const list = useMemo(() => records ?? [], [records])

  function closeForm() {
    setFormOpen(false)
    setTitle('')
    setDate(today())
    setLab('')
    setNotes('')
    setFile(null)
    setFileError(null)
    createExam.reset()
  }

  function handleFile(selected: File | undefined) {
    if (!selected) {
      setFile(null)
      setFileError(null)
      return
    }

    const invalid = validateExamFile(selected)
    setFile(invalid ? null : selected)
    setFileError(invalid)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !file) return

    await createExam.mutateAsync({
      petId,
      date,
      title: title.trim(),
      lab: lab.trim() || undefined,
      notes: notes.trim() || undefined,
      file,
    })

    closeForm()
  }

  async function handleDelete(exam: Exam) {
    await deleteExam.mutateAsync(exam)
    setConfirmingId(null)
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
        title="Exames"
        description="Laudos e resultados do pet, em PDF ou imagem."
        actions={<Button onClick={() => setFormOpen(true)}>Enviar exame</Button>}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title="Enviar exame"
        description="PDF, JPG, PNG ou WebP, até 10 MB. O arquivo fica privado: só você abre."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Exame">
              <input
                required
                autoFocus
                placeholder="Ex.: Hemograma"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Data do exame">
            <input
              required
              type="date"
              max={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Laboratório ou clínica" hint="Opcional">
            <input
              value={lab}
              onChange={(event) => setLab(event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Arquivo">
              <input
                required
                type="file"
                accept={examAccept}
                onChange={(event) => handleFile(event.target.files?.[0])}
                className={inputClass}
              />
            </Field>
            {file && (
              <p className="mt-1 text-xs text-slate-500">
                {file.name} · {formatFileSize(file.size)}
              </p>
            )}
            {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
          </div>

          <div className="sm:col-span-2">
            <Field label="Observações" hint="Opcional">
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {createExam.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">Não foi possível enviar o exame.</p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExam.isPending || !file}>
              {createExam.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </Modal>

      {list.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="text-sm font-medium text-slate-700">Nenhum exame enviado</p>
          <p className="mt-1 text-sm text-slate-500">
            Guarde aqui os laudos para tê-los à mão na próxima consulta.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardTitle>Exames guardados</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{list.length}</p>
              <p className="mt-1 text-xs text-slate-500">arquivo(s) neste pet</p>
            </Card>

            <Card>
              <CardTitle>Último exame</CardTitle>
              <p className="mt-2 text-2xl font-semibold text-teal-700">
                {formatDate(list[0].date)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">{list[0].title}</p>
            </Card>
          </div>

          <Card>
            <CardTitle>Histórico de exames</CardTitle>
            <ul className="mt-3 flex flex-col divide-y divide-slate-100">
              {list.map((exam) => {
                const isConfirming = confirmingId === exam.id
                const isDeleting = deleteExam.isPending && deleteExam.variables?.id === exam.id

                return (
                  <li
                    key={exam.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{exam.title}</p>
                      <p className="text-xs text-slate-500">
                        {[formatDate(exam.date), exam.lab, exam.notes].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {examKindLabel(exam.mimeType)}
                        {exam.sizeBytes !== undefined && ` · ${formatFileSize(exam.sizeBytes)}`}
                        {' · '}
                        {exam.fileName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirming ? (
                        <>
                          <span className="text-xs text-slate-600">
                            Remover o exame e o arquivo?
                          </span>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deleteExam.isPending}
                            onClick={() => void handleDelete(exam)}
                          >
                            {isDeleting ? 'Removendo...' : 'Remover'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={deleteExam.isPending}
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          {exam.url ? (
                            <a
                              href={exam.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                            >
                              Abrir
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">link indisponível</span>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmingId(exam.id)}
                          >
                            Remover
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {deleteExam.isError && (
              <p className="mt-2 text-sm text-red-600">Não foi possível remover o exame.</p>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
