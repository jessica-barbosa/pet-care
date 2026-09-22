import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { MockBanner } from '@/components/ui/MockBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { usePets } from '@/features/pets/queries'
import { speciesLabel } from '@/features/pets/types'

/**
 * Tela de selecao de pet — o "quem esta assistindo" da app.
 * E a primeira pagina depois do login; todo o resto vive dentro de um pet.
 */
export default function SelectPetPage() {
  const { user, signOut } = useAuth()
  const { data: pets, isLoading, error } = usePets()

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <MockBanner />

      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src="/pet.svg" alt="" className="size-7" />
          <span className="text-lg font-semibold">Pet Care</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 sm:inline">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:bg-white/10"
            onClick={() => void signOut()}
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Quem vamos cuidar hoje?
        </h1>
        <p className="mb-12 text-sm text-slate-400">Escolha um pet para ver a rotina dele.</p>

        {isLoading && <Spinner className="border-slate-600 border-t-teal-400" />}
        {error && <p className="text-sm text-red-400">Nao foi possivel carregar os pets.</p>}

        {pets && (
          <ul className="flex flex-wrap items-start justify-center gap-8 sm:gap-12">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link
                  to={`/pets/${pet.id}`}
                  className="group flex w-32 flex-col items-center gap-3 rounded-2xl p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400"
                >
                  <PetAvatar
                    pet={pet}
                    size="lg"
                    className="transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105"
                  />
                  <div className="text-center">
                    <p className="font-medium text-slate-200 transition-colors group-hover:text-white">
                      {pet.name}
                    </p>
                    <p className="text-xs text-slate-500">{speciesLabel[pet.species]}</p>
                  </div>
                </Link>
              </li>
            ))}

            <li>
              <Link
                to="/pets/novo"
                className="group flex w-32 flex-col items-center gap-3 rounded-2xl p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400"
              >
                <span className="flex size-28 items-center justify-center rounded-full border-2 border-dashed border-slate-600 text-4xl font-light text-slate-500 transition group-hover:scale-105 group-hover:border-teal-400 group-hover:text-teal-400">
                  +
                </span>
                <span className="text-center text-sm font-medium text-slate-400 transition-colors group-hover:text-white">
                  Cadastrar pet
                </span>
              </Link>
            </li>
          </ul>
        )}
      </main>
    </div>
  )
}
