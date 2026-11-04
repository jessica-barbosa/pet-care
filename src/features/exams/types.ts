/**
 * Exame: um laudo (PDF ou imagem) guardado no Storage, mais os dados para achar depois.
 * O app nao le nem interpreta o arquivo — so guarda e abre.
 */
export type Exam = {
  id: string
  petId: string
  /** Data do exame, `YYYY-MM-DD`. */
  date: string
  /** Texto livre: "Hemograma", "Raio-X de quadril"... */
  title: string
  /** Laboratorio ou clinica. */
  lab?: string
  notes?: string
  fileName: string
  mimeType: string
  sizeBytes?: number
  /** Caminho no bucket privado; so o banco e o Storage o enxergam. */
  filePath: string
  /** Link assinado, valido por 1 hora; vazio se nao foi possivel gerar. */
  url?: string
}

export type NewExam = Pick<Exam, 'petId' | 'date' | 'title' | 'lab' | 'notes'> & {
  file: File
}

/** Tipos aceitos e a extensao usada no nome do arquivo guardado. */
export const examFileTypes: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Mesmo limite do bucket: a app confere antes de enviar para o erro ser claro. */
export const EXAM_MAX_BYTES = 10 * 1024 * 1024

/** Atributo `accept` do input de arquivo. */
export const examAccept = Object.keys(examFileTypes).join(',')

/** Devolve a mensagem de erro, ou null se o arquivo pode ser enviado. */
export function validateExamFile(file: File): string | null {
  if (!(file.type in examFileTypes)) return 'Envie um arquivo PDF, JPG, PNG ou WebP.'
  if (file.size > EXAM_MAX_BYTES) return 'O arquivo é grande demais. O limite é de 10 MB.'
  if (file.size === 0) return 'O arquivo está vazio.'
  return null
}

/** "850 KB" / "2,3 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

export const examKindLabel = (mimeType: string) =>
  mimeType === 'application/pdf' ? 'PDF' : 'Imagem'

/** Mais recente primeiro. */
export const byExamDateDesc = (a: Exam, b: Exam) => b.date.localeCompare(a.date)
