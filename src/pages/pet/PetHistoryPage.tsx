import { SectionPlaceholder } from '@/components/ui/SectionPlaceholder'

export default function PetHistoryPage() {
  return (
    <SectionPlaceholder
      title="Historico"
      description="Linha do tempo de tudo que aconteceu com o pet."
      planned={[
        'Timeline unificada (consultas, vacinas, peso, medicacao)',
        'Filtro por tipo e periodo',
        'Anexos e exames',
      ]}
    />
  )
}
