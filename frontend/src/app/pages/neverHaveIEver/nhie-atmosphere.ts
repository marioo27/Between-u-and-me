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

const LAYOUTS: ReadonlyArray<Omit<AtmosphereMotif, 'id' | 'icon'>> = [
  { x: 8, y: 12, size: 2.4, duration: 14, delay: 0, drift: 12 },
  { x: 78, y: 8, size: 1.8, duration: 11, delay: -2, drift: -10 },
  { x: 18, y: 42, size: 2.1, duration: 16, delay: -4, drift: 8 },
  { x: 88, y: 36, size: 2.6, duration: 13, delay: -1, drift: -14 },
  { x: 6, y: 72, size: 1.9, duration: 15, delay: -6, drift: 10 },
  { x: 72, y: 68, size: 2.3, duration: 12, delay: -3, drift: -8 },
  { x: 42, y: 18, size: 1.6, duration: 17, delay: -5, drift: 16 },
  { x: 54, y: 78, size: 2.0, duration: 14, delay: -7, drift: -12 },
  { x: 30, y: 58, size: 1.7, duration: 18, delay: -2.5, drift: 9 },
  { x: 92, y: 82, size: 1.5, duration: 10, delay: -8, drift: -6 },
  { x: 48, y: 48, size: 2.2, duration: 19, delay: -1.5, drift: 11 },
  { x: 14, y: 88, size: 1.8, duration: 13, delay: -4.5, drift: -9 },
];

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

export function atmosphereMotifs(category: string | null | undefined): AtmosphereMotif[] {
  const theme = atmosphereTheme(category);
  const icons = theme.icons;
  return LAYOUTS.map((slot, index) => ({
    ...slot,
    id: `${category ?? 'otros'}-${index}`,
    icon: icons[index % icons.length]!,
  }));
}
