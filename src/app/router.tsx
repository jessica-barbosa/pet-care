import { createBrowserRouter } from 'react-router-dom'

import { PetLayout } from '@/components/layout/PetLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import NewPetPage from '@/pages/NewPetPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SelectPetPage from '@/pages/SelectPetPage'
import PetAgendaPage from '@/pages/pet/PetAgendaPage'
import PetAppointmentsPage from '@/pages/pet/PetAppointmentsPage'
import PetHistoryPage from '@/pages/pet/PetHistoryPage'
import PetOverviewPage from '@/pages/pet/PetOverviewPage'
import PetVaccinesPage from '@/pages/pet/PetVaccinesPage'
import PetWeightPage from '@/pages/pet/PetWeightPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Selecao de pet: tela cheia, sem sidebar.
      { path: '/', element: <SelectPetPage /> },
      { path: '/pets/novo', element: <NewPetPage /> },
      // Dentro de um pet: sidebar com as secoes.
      {
        path: '/pets/:petId',
        element: <PetLayout />,
        children: [
          { index: true, element: <PetOverviewPage /> },
          { path: 'agenda', element: <PetAgendaPage /> },
          { path: 'peso', element: <PetWeightPage /> },
          { path: 'consultas', element: <PetAppointmentsPage /> },
          { path: 'vacinas', element: <PetVaccinesPage /> },
          { path: 'historico', element: <PetHistoryPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
