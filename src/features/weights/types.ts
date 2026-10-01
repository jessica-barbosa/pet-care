export type WeightEntry = {
  id: string
  petId: string
  /** Data da pesagem no formato `YYYY-MM-DD`. */
  date: string
  /** Peso em quilos. */
  weightKg: number
  notes?: string
}

export type NewWeightEntry = Omit<WeightEntry, 'id'>

/** Variacao entre a pesagem mais recente e a anterior. */
export type WeightTrend = {
  /** Diferenca em kg (negativa quando o pet emagreceu). */
  deltaKg: number
  direction: 'up' | 'down' | 'stable'
}

/** Considera estavel abaixo de 50g para nao transformar ruido de balanca em tendencia. */
const STABLE_THRESHOLD_KG = 0.05

export function getWeightTrend(entries: WeightEntry[]): WeightTrend | null {
  if (entries.length < 2) return null

  const [latest, previous] = entries
  const deltaKg = latest.weightKg - previous.weightKg

  return {
    deltaKg,
    direction: Math.abs(deltaKg) < STABLE_THRESHOLD_KG ? 'stable' : deltaKg > 0 ? 'up' : 'down',
  }
}

export function formatWeight(weightKg: number): string {
  return `${weightKg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`
}
