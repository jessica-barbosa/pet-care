import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pets', label: 'Pets' },
  { to: '/agenda', label: 'Agenda' },
]

export function AppLayout() {
  const { user, isMock, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isMock && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
          Modo mock: Supabase ainda nao configurado (preencha <code>.env.local</code>).
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="mb-6 flex items-center gap-2">
            <img src="/pet.svg" alt="" className="size-7" />
            <span className="text-lg font-semibold">Pet Care</span>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-200',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-4">
            <nav className="flex gap-2 md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium',
                      isActive ? 'bg-teal-600 text-white' : 'text-slate-600',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">{user?.email}</span>
              <Button variant="secondary" size="sm" onClick={() => void signOut()}>
                Sair
              </Button>
            </div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
