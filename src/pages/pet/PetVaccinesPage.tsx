import { SectionPlaceholder } from '@/components/ui/SectionPlaceholder'

export default function PetVaccinesPage() {
  return (
    <SectionPlaceholder
      title="Vacinas"
      description="Carteira de vacinacao do pet."
      planned={[
        'Vacinas aplicadas com lote e data',
        'Proximos reforcos e alertas de atraso',
        'Carteira exportavel em PDF',
      ]}
    />
  )
}
