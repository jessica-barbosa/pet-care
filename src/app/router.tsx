import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AgendaPage from '@/pages/AgendaPage'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PetDetailPage from '@/pages/PetDetailPage'
import PetsPage from '@/pages/PetsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/pets', element: <PetsPage /> },
          { path: '/pets/:petId', element: <PetDetailPage /> },
          { path: '/agenda', element: <AgendaPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
