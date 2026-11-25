export type NhiePromptBank = Record<string, string[]>;

export const NHIE_CATEGORY_ORDER = [
  'sexo_y_sexualidad',
  'amor_y_relaciones',
  'fiesta_alcohol_y_drogas',
  'amistades_y_vida_social',
  'vergüenza_y_situaciones_comprometidas',
  'estudios_trabajo_y_vida_cotidiana',
  'redes_sociales_y_tecnologia',
  'delitos_y_problemas_legales',
  'personalidad_pensamientos_y_emociones',
  'otros',
] as const;

export type NhieCategoryId = (typeof NHIE_CATEGORY_ORDER)[number];

export interface NhieCard {
  text: string;
  category: string;
}

export function listCategories(bank: NhiePromptBank): string[] {
  const known = NHIE_CATEGORY_ORDER.filter((id) => id in bank);
  const extras = Object.keys(bank).filter((id) => !NHIE_CATEGORY_ORDER.includes(id as NhieCategoryId));
  return [...known, ...extras.sort()];
}

export function collectPhrases(
  bank: NhiePromptBank,
  selectedCategories: readonly string[],
): NhieCard[] {
  if (selectedCategories.length === 0) {
    return [];
  }

  const phrases: NhieCard[] = [];
  for (const category of selectedCategories) {
    const entries = bank[category];
    if (!entries?.length) {
      continue;
    }
    for (const text of entries) {
      phrases.push({ text, category });
    }
  }
  return phrases;
}

/** Fisher–Yates shuffle. Optional rng for tests. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface NhieDeckState {
  /** Remaining cards in the current cycle (already shuffled). */
  remaining: NhieCard[];
  /** All cards matching the active filter (source pool). */
  pool: NhieCard[];
  current: NhieCard | null;
  /** True when the pool was reshuffled because it was exhausted. */
  reshuffled: boolean;
}

export function createDeck(
  pool: readonly NhieCard[],
  rng: () => number = Math.random,
): NhieDeckState {
  if (pool.length === 0) {
    return { remaining: [], pool: [], current: null, reshuffled: false };
  }

  const remaining = shuffle(pool, rng);
  const current = remaining[0] ?? null;
  return {
    remaining: remaining.slice(1),
    pool: [...pool],
    current,
    reshuffled: false,
  };
}

export function drawNext(
  state: NhieDeckState,
  rng: () => number = Math.random,
): NhieDeckState {
  if (state.pool.length === 0) {
    return { remaining: [], pool: [], current: null, reshuffled: false };
  }

  if (state.remaining.length > 0) {
    const [current, ...remaining] = state.remaining;
    return {
      remaining,
      pool: state.pool,
      current,
      reshuffled: false,
    };
  }

  const reshuffled = shuffle(state.pool, rng);
  const current = reshuffled[0] ?? null;
  return {
    remaining: reshuffled.slice(1),
    pool: state.pool,
    current,
    reshuffled: true,
  };
}
