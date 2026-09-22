import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MockBanner } from '@/components/ui/MockBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { useCurrentPet } from '@/features/pets/queries'
import { speciesLabel } from '@/features/pets/types'
import { cn } from '@/lib/utils'

/** Secoes do pet. Novas features entram aqui + em uma rota filha do router. */
const navItems = [
  { path: '', label: 'Visao geral', icon: '🏠' },
  { path: 'agenda', label: 'Agenda', icon: '📅' },
  { path: 'peso', label: 'Peso', icon: '⚖️' },
  { path: 'consultas', label: 'Consultas', icon: '🩺' },
  { path: 'vacinas', label: 'Vacinas', icon: '💉' },
  { path: 'historico', label: 'Historico', icon: '📋' },
]

export function PetLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: pet, isLoading } = useCurrentPet()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-sm text-center">
          <p className="text-sm text-slate-600">Pet nao encontrado.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/')}>
            Escolher outro pet
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MockBanner />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="shrink-0 md:w-60">
          <div className="flex items-center gap-3 md:flex-col md:items-start">
            <PetAvatar pet={pet} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{pet.name}</p>
              <p className="text-xs text-slate-500">
                {speciesLabel[pet.species]}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </p>
            </div>
          </div>

          <NavLink
            to="/"
            className="mt-3 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            ← Trocar pet
          </NavLink>

          <nav className="mt-5 flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path ? `/pets/${pet.id}/${item.path}` : `/pets/${pet.id}`}
                end={item.path === ''}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-200',
                  )
                }
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-end gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user?.email}</span>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              Sair
            </Button>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
