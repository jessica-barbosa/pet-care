import type { Pet } from '@/features/pets/types'
import { speciesEmoji } from '@/features/pets/types'
import { cn } from '@/lib/utils'

/** Gradientes estaveis: o mesmo pet sempre recebe a mesma cor. */
const gradients = [
  'from-teal-400 to-emerald-600',
  'from-sky-400 to-indigo-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-lime-400 to-green-600',
]

const sizes = {
  sm: 'size-10 text-base',
  md: 'size-16 text-2xl',
  lg: 'size-28 text-4xl',
  xl: 'size-36 text-5xl',
} as const

const badgeSizes = {
  sm: 'hidden',
  md: 'size-6 text-xs -bottom-0.5 -right-0.5',
  lg: 'size-9 text-lg -bottom-1 -right-1',
  xl: 'size-11 text-xl -bottom-1 -right-1',
} as const

function gradientFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997
  }
  return gradients[hash % gradients.length]
}

export function PetAvatar({
  pet,
  size = 'md',
  className,
}: {
  pet: Pet
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <div className={cn('relative inline-block', className)}>
      {pet.photoUrl ? (
        <img
          src={pet.photoUrl}
          alt={pet.name}
          className={cn('rounded-full object-cover ring-2 ring-white/70', sizes[size])}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/70',
            gradientFor(pet.id + pet.name),
            sizes[size],
          )}
        >
          {pet.name.charAt(0).toUpperCase()}
        </div>
      )}

      <span
        aria-hidden
        className={cn(
          'absolute flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200',
          badgeSizes[size],
        )}
      >
        {speciesEmoji[pet.species]}
      </span>
    </div>
  )
}
