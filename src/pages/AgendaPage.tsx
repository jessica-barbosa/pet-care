import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export default function AgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" description="Consultas, vacinas e lembretes." />
      <Card>
        <p className="text-sm text-slate-600">
          Placeholder — a agenda sera implementada quando o modelo de dados estiver definido.
        </p>
      </Card>
    </>
  )
}
