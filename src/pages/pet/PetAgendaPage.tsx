import { SectionPlaceholder } from '@/components/ui/SectionPlaceholder'

export default function PetAgendaPage() {
  return (
    <SectionPlaceholder
      title="Agenda"
      description="Compromissos e lembretes do pet."
      planned={[
        'Calendario com consultas, vacinas e banhos',
        'Criar e editar compromissos',
        'Lembretes recorrentes (vermifugo, antipulgas)',
      ]}
    />
  )
}
