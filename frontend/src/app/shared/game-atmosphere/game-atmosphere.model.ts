/** Floating print-style motifs for game pages (same recipe as Yo Nunca). */

export type GameAtmosphereIcon =
  | 'mask'
  | 'eye'
  | 'dice'
  | 'secret'
  | 'question'
  | 'face'
  | 'search'
  | 'tag';

export type GameAtmospherePreset = 'impostor' | 'whoami' | 'home';

export interface AtmosphereMotif {
  id: string;
  icon: GameAtmosphereIcon;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  travelX: number;
  travelY: number;
}

export interface AtmosphereTheme {
  icons: GameAtmosphereIcon[];
  paper: string;
  ink: string;
  copiesPerIcon: number;
}

const MIN_DISTANCE_PCT = 14;
const MAX_TRAVEL_REM = 3.25;

export const GAME_ATMOSPHERE: Record<GameAtmospherePreset, AtmosphereTheme> = {
  impostor: {
    paper: 'oklch(90% 0.028 35)',
    ink: 'oklch(38% 0.1 25)',
    copiesPerIcon: 3,
    icons: ['mask', 'eye', 'dice', 'secret'],
  },
  whoami: {
    paper: 'oklch(91% 0.03 250)',
    ink: 'oklch(36% 0.09 250)',
    copiesPerIcon: 3,
    icons: ['question', 'face', 'search', 'tag'],
  },
  home: {
    paper: 'oklch(91.5% 0.014 92)',
    ink: 'oklch(40% 0.05 70)',
    copiesPerIcon: 2,
    icons: ['mask', 'eye', 'dice', 'secret', 'question', 'face', 'search', 'tag'],
  },
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextUnit(seed: { value: number }): number {
  seed.value = (Math.imul(seed.value, 1664525) + 1013904223) >>> 0;
  return seed.value / 0x100000000;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function placePoints(
  count: number,
  seed: { value: number },
  minDistance: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
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

export function buildGameAtmosphereMotifs(preset: GameAtmospherePreset): AtmosphereMotif[] {
  const theme = GAME_ATMOSPHERE[preset];
  const seed = { value: hashSeed(`game-atm:${preset}`) };
  const roster: GameAtmosphereIcon[] = [];
  for (const icon of theme.icons) {
    for (let copy = 0; copy < theme.copiesPerIcon; copy += 1) {
      roster.push(icon);
    }
  }

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
    const travelX =
      (nextUnit(seed) < 0.5 ? -1 : 1) * (1.4 + nextUnit(seed) * (MAX_TRAVEL_REM - 1.4));
    const travelY =
      (nextUnit(seed) < 0.5 ? -1 : 1) * (1.4 + nextUnit(seed) * (MAX_TRAVEL_REM - 1.4));
    return {
      id: `${preset}-${icon}-${index}`,
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
