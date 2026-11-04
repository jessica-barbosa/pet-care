import type { Exam, NewExam } from '@/features/exams/types'
import { byExamDateDesc, examFileTypes, validateExamFile } from '@/features/exams/types'
import { requireSupabase, supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

/**
 * Camada de acesso a dados dos exames.
 *
 * O arquivo vai para o bucket PRIVADO `pet-exams` e o banco guarda so o caminho. Para
 * abrir, a listagem pede links assinados (1 hora): quem nao esta logado, ou nao e dono
 * do pet, nao consegue nem listar nem abrir. Nao tem update; o delete existe porque um
 * envio errado nao tem outra correcao.
 */

const EXAM_BUCKET = 'pet-exams'
const SIGNED_URL_SECONDS = 60 * 60

function toExam(row: Tables<'exams'>, url?: string): Exam {
  return {
    id: row.id,
    petId: row.pet_id,
    date: row.date,
    title: row.title,
    lab: row.lab ?? undefined,
    notes: row.notes ?? undefined,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes ?? undefined,
    filePath: row.file_path,
    url,
  }
}

// ---------------------------------------------------------------------------
// Mock (usado apenas sem Supabase configurado)
// ---------------------------------------------------------------------------

/** Os arquivos do mock vivem na memoria da aba: somem ao recarregar, como os registros. */
const MOCK_EXAMS: Exam[] = []

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------

export async function listExams(petId: string): Promise<Exam[]> {
  if (!supabase) {
    await delay()
    return MOCK_EXAMS.filter((exam) => exam.petId === petId).sort(byExamDateDesc)
  }

  const client = requireSupabase()

  const { data, error } = await client
    .from('exams')
    .select('*')
    .eq('pet_id', petId)
    .order('date', { ascending: false })

  if (error) throw error
  if (data.length === 0) return []

  // Um unico pedido assina todos. Se falhar, a lista aparece mesmo assim, sem o botao
  // de abrir — melhor que esconder os exames por causa de um link.
  const signed = await client.storage.from(EXAM_BUCKET).createSignedUrls(
    data.map((row) => row.file_path),
    SIGNED_URL_SECONDS,
  )

  const urlByPath = new Map<string, string>()
  for (const item of signed.data ?? []) {
    if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl)
  }

  return data.map((row) => toExam(row, urlByPath.get(row.file_path)))
}

/**
 * Envia o arquivo e registra o exame.
 *
 * Ordem importa: sobe o arquivo primeiro; se o registro no banco falhar, o arquivo
 * recem-enviado e removido para nao virar lixo no bucket. Caminho:
 * `exams/{pet_id}-{uuid}.{ext}` — a policy de Storage (migration 0005) le o id do pet
 * nos 36 primeiros caracteres do NOME do arquivo, entao esse prefixo nao pode mudar.
 */
export async function createExam(input: NewExam): Promise<Exam> {
  const invalid = validateExamFile(input.file)
  if (invalid) throw new Error(invalid)

  if (!supabase) {
    await delay(500)
    const exam: Exam = {
      id: crypto.randomUUID(),
      petId: input.petId,
      date: input.date,
      title: input.title,
      lab: input.lab,
      notes: input.notes,
      fileName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      filePath: `exams/${input.petId}-mock`,
      url: URL.createObjectURL(input.file),
    }
    MOCK_EXAMS.push(exam)
    return exam
  }

  const client = requireSupabase()
  const path = `exams/${input.petId}-${crypto.randomUUID()}.${examFileTypes[input.file.type]}`

  const upload = await client.storage.from(EXAM_BUCKET).upload(path, input.file, {
    contentType: input.file.type,
  })
  if (upload.error) throw upload.error

  const { data, error } = await client
    .from('exams')
    .insert({
      pet_id: input.petId,
      date: input.date,
      title: input.title,
      lab: input.lab ?? null,
      notes: input.notes ?? null,
      file_path: path,
      file_name: input.file.name,
      mime_type: input.file.type,
      size_bytes: input.file.size,
    })
    .select()
    .single()

  if (error) {
    await client.storage.from(EXAM_BUCKET).remove([path])
    throw error
  }

  const signed = await client.storage.from(EXAM_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  return toExam(data, signed.data?.signedUrl)
}

/** Remove o registro e, depois, o arquivo. Falha ao apagar o arquivo nao desfaz o delete. */
export async function deleteExam(exam: Exam): Promise<void> {
  if (!supabase) {
    await delay(300)
    const index = MOCK_EXAMS.findIndex((item) => item.id === exam.id)
    if (index >= 0) {
      if (exam.url) URL.revokeObjectURL(exam.url)
      MOCK_EXAMS.splice(index, 1)
    }
    return
  }

  const client = requireSupabase()

  // Primeiro o banco: a RLS confirma que o exame e do usuario antes de mexer no arquivo.
  const { error } = await client.from('exams').delete().eq('id', exam.id)
  if (error) throw error

  const removal = await client.storage.from(EXAM_BUCKET).remove([exam.filePath])
  if (removal.error)
    console.warn('Não foi possível apagar o arquivo do exame:', removal.error.message)
}
