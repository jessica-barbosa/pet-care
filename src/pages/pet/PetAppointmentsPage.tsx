import { SectionPlaceholder } from '@/components/ui/SectionPlaceholder'

export default function PetAppointmentsPage() {
  return (
    <SectionPlaceholder
      title="Consultas"
      description="Atendimentos veterinarios do pet."
      planned={[
        'Lista de consultas com veterinario e clinica',
        'Diagnostico, prescricao e anexos',
        'Agendar proxima consulta',
      ]}
    />
  )
}
