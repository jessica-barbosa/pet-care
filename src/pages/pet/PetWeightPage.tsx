import { SectionPlaceholder } from '@/components/ui/SectionPlaceholder'

export default function PetWeightPage() {
  return (
    <SectionPlaceholder
      title="Peso"
      description="Acompanhamento do peso ao longo do tempo."
      planned={[
        'Registrar pesagem com data',
        'Grafico de evolucao',
        'Faixa de peso ideal por raca/idade',
      ]}
    />
  )
}
