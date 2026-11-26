/** Motifs + palettes for category atmosphere (shared print style). */

export type AtmosphereIcon =
  | 'heart'
  | 'bolt'
  | 'star'
  | 'kiss'
  | 'ring'
  | 'envelope'
  | 'bloom'
  | 'bottle'
  | 'glass'
  | 'note'
  | 'confetti'
  | 'duo'
  | 'chat'
  | 'wave'
  | 'mask'
  | 'drop'
  | 'book'
  | 'pencil'
  | 'clock'
  | 'bag'
  | 'phone'
  | 'at'
  | 'signal'
  | 'cam'
  | 'cuffs'
  | 'scale'
  | 'warn'
  | 'brain'
  | 'thought'
  | 'mood'
  | 'spark'
  | 'question'
  | 'dice';

export interface AtmosphereMotif {
  id: string;
  icon: AtmosphereIcon;
  /** Horizontal position, 0–100 (%). */
  x: number;
  /** Vertical position, 0–100 (%). */
  y: number;
  /** Motif size in rem. */
  size: number;
  /** Float loop duration (s). */
  duration: number;
  /** Animation delay (s). */
  delay: number;
  /** Max rotation drift (deg). */
  drift: number;
  /** Travel on X while floating (rem). */
  travelX: number;
  /** Travel on Y while floating (rem). */
  travelY: number;
}

export interface AtmosphereTheme {
  icons: AtmosphereIcon[];
  /** Soft paper tint. */
  paper: string;
  /** Motif stroke colour. */
  ink: string;
  /** Card / pass-1 (× pass-2 → overprint). */
  accent: string;
  /** Second pass that sticks out. */
  accent2: string;
  /** Die-cut CTA fill. */
  sticker: string;
}

/** How many instances of each category icon float on screen. */
const COPIES_PER_ICON = 3;

/** Minimum centre-to-centre distance in % of the viewport. */
const MIN_DISTANCE_PCT = 14;

/** Visible float radius (rem); kept under ~half min gap so icons don’t collide. */
const MAX_TRAVEL_REM = 3.25;

export const ATMOSPHERE_THEMES: Record<string, AtmosphereTheme> = {
  sexo_y_sexualidad: {
    paper: 'oklch(90% 0.04 20)',
    ink: 'oklch(42% 0.14 18)',
    accent: 'oklch(62% 0.16 8)',
    accent2: 'oklch(72% 0.18 45)',
    sticker: 'oklch(78% 0.15 350)',
    icons: ['heart', 'kiss', 'bolt', 'star'],
  },
  amor_y_relaciones: {
    paper: 'oklch(91% 0.035 350)',
    ink: 'oklch(40% 0.14 350)',
    accent: 'oklch(68% 0.15 350)',
    accent2: 'oklch(74% 0.16 25)',
    sticker: 'oklch(82% 0.12 330)',
    icons: ['heart', 'ring', 'envelope', 'bloom'],
  },
  fiesta_alcohol_y_drogas: {
    paper: 'oklch(91% 0.045 70)',
    ink: 'oklch(42% 0.14 45)',
    accent: 'oklch(72% 0.16 85)',
    accent2: 'oklch(68% 0.2 40)',
    sticker: 'oklch(78% 0.17 25)',
    icons: ['bottle', 'glass', 'note', 'confetti'],
  },
  amistades_y_vida_social: {
    paper: 'oklch(91% 0.03 210)',
    ink: 'oklch(38% 0.1 212)',
    accent: 'oklch(65% 0.12 212)',
    accent2: 'oklch(71% 0.19 50)',
    sticker: 'oklch(80% 0.16 352)',
    icons: ['duo', 'chat', 'wave', 'star'],
  },
  vergüenza_y_situaciones_comprometidas: {
    paper: 'oklch(90% 0.035 310)',
    ink: 'oklch(40% 0.12 310)',
    accent: 'oklch(62% 0.14 305)',
    accent2: 'oklch(72% 0.16 350)',
    sticker: 'oklch(78% 0.13 320)',
    icons: ['mask', 'drop', 'mood', 'spark'],
  },
  estudios_trabajo_y_vida_cotidiana: {
    paper: 'oklch(91% 0.025 240)',
    ink: 'oklch(38% 0.08 240)',
    accent: 'oklch(60% 0.11 245)',
    accent2: 'oklch(74% 0.15 75)',
    sticker: 'oklch(78% 0.1 230)',
    icons: ['book', 'pencil', 'clock', 'bag'],
  },
  redes_sociales_y_tecnologia: {
    paper: 'oklch(91% 0.035 195)',
    ink: 'oklch(36% 0.1 200)',
    accent: 'oklch(68% 0.13 195)',
    accent2: 'oklch(78% 0.17 120)',
    sticker: 'oklch(82% 0.14 200)',
    icons: ['phone', 'at', 'signal', 'cam'],
  },
  delitos_y_problemas_legales: {
    paper: 'oklch(90% 0.03 40)',
    ink: 'oklch(36% 0.1 30)',
    accent: 'oklch(55% 0.12 35)',
    accent2: 'oklch(72% 0.15 85)',
    sticker: 'oklch(70% 0.14 20)',
    icons: ['cuffs', 'scale', 'warn', 'bolt'],
  },
  personalidad_pensamientos_y_emociones: {
    paper: 'oklch(91% 0.035 145)',
    ink: 'oklch(36% 0.1 145)',
    accent: 'oklch(62% 0.11 155)',
    accent2: 'oklch(72% 0.17 55)',
    sticker: 'oklch(80% 0.12 145)',
    icons: ['brain', 'thought', 'mood', 'spark'],
  },
  otros: {
    paper: 'oklch(91.5% 0.014 92)',
    ink: 'oklch(38% 0.05 70)',
    accent: 'oklch(65% 0.12 212)',
    accent2: 'oklch(71% 0.19 50)',
    sticker: 'oklch(80% 0.16 352)',
    icons: ['spark', 'question', 'dice', 'star'],
  },
};

const FALLBACK_THEME: AtmosphereTheme = ATMOSPHERE_THEMES['otros']!;

export function atmosphereTheme(category: string | null | undefined): AtmosphereTheme {
  if (!category) {
    return FALLBACK_THEME;
  }
  return ATMOSPHERE_THEMES[category] ?? FALLBACK_THEME;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic [0, 1) from a mutating seed box. */
function nextUnit(seed: { value: number }): number {
  seed.value = (Math.imul(seed.value, 1664525) + 1013904223) >>> 0;
  return seed.value / 0x100000000;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Scatter centres across the full viewport (including header/footer bands)
 * with a minimum distance so float paths won’t overlap.
 */
function placePoints(
  count: number,
  seed: { value: number },
  minDistance: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  // Full-bleed: allow centres into top/bottom chrome so icons drift through.
  const xMin = 3;
  const xMax = 97;
  const yMin = 2;
  const yMax = 98;

  for (let i = 0; i < count; i += 1) {
    let placed: { x: number; y: number } | null = null;
    let gap = minDistance;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const candidate = {
        x: xMin + nextUnit(seed) * (xMax - xMin),
        y: yMin + nextUnit(seed) * (yMax - yMin),
      };
      if (points.every((p) => dist(p, candidate) >= gap)) {
        placed = candidate;
        break;
      }
      if (attempt > 0 && attempt % 20 === 0) {
        gap = Math.max(6, gap * 0.85);
      }
    }
    points.push(
      placed ?? {
        x: xMin + ((i * 37) % (xMax - xMin)),
        y: yMin + ((i * 53) % (yMax - yMin)),
      },
    );
  }
  return points;
}

export function atmosphereMotifs(category: string | null | undefined): AtmosphereMotif[] {
  const theme = atmosphereTheme(category);
  const icons = theme.icons;
  const key = category ?? 'otros';
  const seed = { value: hashSeed(`atm:${key}`) };

  const roster: AtmosphereIcon[] = [];
  for (const icon of icons) {
    for (let copy = 0; copy < COPIES_PER_ICON; copy += 1) {
      roster.push(icon);
    }
  }

  // Mild shuffle (seeded) so copies aren’t clustered by icon type.
  for (let i = roster.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextUnit(seed) * (i + 1));
    const tmp = roster[i]!;
    roster[i] = roster[j]!;
    roster[j] = tmp;
  }

  const points = placePoints(roster.length, seed, MIN_DISTANCE_PCT);

  return roster.map((icon, index) => {
    const point = points[index]!;
    const size = 1.55 + nextUnit(seed) * 1.15;
    const duration = 7 + nextUnit(seed) * 6;
    const delay = -nextUnit(seed) * 8;
    const drift = (nextUnit(seed) * 2 - 1) * 22;
    // Prefer a clear travel magnitude so motion reads on screen.
    const travelX =
      (nextUnit(seed) < 0.5 ? -1 : 1) * (1.4 + nextUnit(seed) * (MAX_TRAVEL_REM - 1.4));
    const travelY =
      (nextUnit(seed) < 0.5 ? -1 : 1) * (1.4 + nextUnit(seed) * (MAX_TRAVEL_REM - 1.4));
    return {
      id: `${key}-${icon}-${index}`,
      icon,
      x: Math.round(point.x * 10) / 10,
      y: Math.round(point.y * 10) / 10,
      size: Math.round(size * 100) / 100,
      duration: Math.round(duration * 10) / 10,
      delay: Math.round(delay * 10) / 10,
      drift: Math.round(drift),
      travelX: Math.round(travelX * 100) / 100,
      travelY: Math.round(travelY * 100) / 100,
    };
  });
}
