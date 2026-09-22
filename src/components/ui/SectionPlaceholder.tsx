import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

/**
 * Casca de uma secao ainda sem feature implementada.
 * Ao construir a feature, troque este componente pelo conteudo real da pagina.
 */
export function SectionPlaceholder({
  title,
  description,
  planned,
}: {
  title: string
  description: string
  planned: string[]
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="max-w-2xl">
        <p className="text-sm font-medium text-slate-700">Previsto para esta secao</p>
        <ul className="mt-3 flex flex-col gap-2">
          {planned.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-500">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
