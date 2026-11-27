export type ImpostorHintMode = 'none' | 'hint' | 'category';
export type RevealOrderMode = 'list' | 'random';

/** Secret word + a related hint for impostor mode “hint”. */
export interface ImpostorWordEntry {
  word: string;
  hint: string;
}

export type ImpostorWordBank = Record<string, ImpostorWordEntry[]>;

export const IMPOSTOR_CATEGORY_ORDER = [
  'animales',
  'ciudades',
  'paises',
  'comidas',
  'deportes',
  'equipos_futbol',
  'jugadores_futbol',
  'marcas',
  'musica',
  'objetos',
  'peliculas',
  'personajes_famosos',
  'profesiones',
  'series_tv',
  'tecnologia',
  'vehiculos',
] as const;

export type ImpostorCategoryId = (typeof IMPOSTOR_CATEGORY_ORDER)[number];

export interface DealtPlayer {
  name: string;
  isImpostor: boolean;
  /** What this player sees when the card is held open. */
  revealWord: string | null;
  revealHintMode: ImpostorHintMode;
  revealCategory: string | null;
  revealHintWord: string | null;
}

export interface ImpostorRound {
  categoryId: string;
  secretWord: string;
  hintWord: string | null;
  hintMode: ImpostorHintMode;
  discreet: boolean;
  players: DealtPlayer[];
  /** Player indices in reveal sequence (supports duplicate names). */
  revealOrder: number[];
  starterIndex: number;
  impostorCount: number;
}

/** Fixed max impostors for N players (N >= 3). */
export function maxImpostors(playerCount: number): number {
  const n = Math.floor(playerCount);
  if (n < 3) return 0;
  if (n <= 4) return 1;
  if (n <= 6) return 2;
  if (n <= 9) return 3;
  if (n <= 12) return 4;
  return Math.floor(n / 3);
}

export function clampSelectedImpostors(
  playerCount: number,
  selected: number,
): number {
  const max = maxImpostors(playerCount);
  if (max < 1) return 0;
  return Math.min(max, Math.max(1, Math.floor(selected)));
}

/**
 * Chaos: usually the selected count; rarely nobody or everybody (~5% each).
 * Normal: exactly the selected count (clamped).
 */
export function resolveImpostorCount(options: {
  playerCount: number;
  selected: number;
  chaos: boolean;
  rng?: () => number;
}): number {
  const { playerCount, chaos, rng = Math.random } = options;
  const selected = clampSelectedImpostors(playerCount, options.selected);
  if (!chaos) {
    return selected;
  }
  const roll = rng();
  if (roll < 0.05) {
    return 0;
  }
  if (roll < 0.1) {
    return playerCount;
  }
  return selected;
}

export function listCategories(bank: ImpostorWordBank): string[] {
  const known = IMPOSTOR_CATEGORY_ORDER.filter((id) => id in bank);
  const extras = Object.keys(bank)
    .filter((id) => !IMPOSTOR_CATEGORY_ORDER.includes(id as ImpostorCategoryId))
    .sort();
  return [...known, ...extras];
}

export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function buildRevealOrder(
  playerCount: number,
  mode: RevealOrderMode,
  rng: () => number = Math.random,
): number[] {
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  return mode === 'random' ? shuffle(indices, rng) : indices;
}

export function dealRound(options: {
  names: readonly string[];
  selectedCategories: readonly string[];
  bank: ImpostorWordBank;
  selectedImpostors: number;
  chaos: boolean;
  hintMode: ImpostorHintMode;
  orderMode: RevealOrderMode;
  discreet: boolean;
  rng?: () => number;
}): ImpostorRound {
  const rng = options.rng ?? Math.random;
  const names = [...options.names];
  if (names.length < 3) {
    throw new Error('Need at least 3 players');
  }

  const categories =
    options.selectedCategories.length > 0
      ? options.selectedCategories.filter((id) => (options.bank[id]?.length ?? 0) > 0)
      : listCategories(options.bank).filter((id) => (options.bank[id]?.length ?? 0) > 0);

  if (categories.length === 0) {
    throw new Error('No categories with words');
  }

  const categoryId = categories[Math.floor(rng() * categories.length)]!;
  const entries = options.bank[categoryId]!;
  const entry = entries[Math.floor(rng() * entries.length)]!;
  const secretWord = entry.word;
  const pairedHint = entry.hint.trim();

  let hintMode = options.hintMode;
  let hintWord: string | null = pairedHint.length > 0 ? pairedHint : null;
  if (hintMode === 'hint' && hintWord === null) {
    hintMode = 'category';
  }

  const impostorCount = resolveImpostorCount({
    playerCount: names.length,
    selected: options.selectedImpostors,
    chaos: options.chaos,
    rng,
  });

  const indices = shuffle(
    names.map((_, i) => i),
    rng,
  ).slice(0, impostorCount);
  const impostorSet = new Set(indices);

  const players: DealtPlayer[] = names.map((name, index) => {
    const isImpostor = impostorSet.has(index);
    if (!isImpostor) {
      return {
        name,
        isImpostor: false,
        revealWord: secretWord,
        revealHintMode: 'none',
        revealCategory: categoryId,
        revealHintWord: null,
      };
    }
    return {
      name,
      isImpostor: true,
      revealWord: null,
      revealHintMode: hintMode,
      revealCategory: categoryId,
      revealHintWord: hintMode === 'hint' ? hintWord : null,
    };
  });

  const revealOrder = buildRevealOrder(names.length, options.orderMode, rng);
  const starterIndex = Math.floor(rng() * names.length);

  return {
    categoryId,
    secretWord,
    hintWord,
    hintMode,
    discreet: options.discreet,
    players,
    revealOrder,
    starterIndex,
    impostorCount,
  };
}

/** Grapheme-aware length (emoji = 1 when Segmenter exists). */
export function graphemeLength(value: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(value)].length;
  }
  return [...value].length;
}

export function clipGraphemes(value: string, max: number): string {
  if (graphemeLength(value) <= max) {
    return value;
  }
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(value)]
      .slice(0, max)
      .map((s) => s.segment)
      .join('');
  }
  return [...value].slice(0, max).join('');
}

export const PLAYER_NAME_MAX = 20;
