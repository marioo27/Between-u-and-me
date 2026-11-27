import { readFileSync } from 'node:fs';
import { dataFile } from '../dataPath.js';
import type { Room, WhoamiCharacter } from '../types.js';

type Bank = WhoamiCharacter[];

function loadBank(locale: 'es' | 'en'): Bank {
  const file = locale === 'es' ? 'whoami-es.json' : 'whoami-en.json';
  return JSON.parse(readFileSync(dataFile(file), 'utf8')) as Bank;
}

function shuffle<T>(items: T[], rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function startWhoAmI(room: Room, locale: 'es' | 'en' = 'es'): void {
  if (room.seats.length < 2) {
    throw new Error('Need at least 2 players');
  }
  const bank = shuffle(loadBank(locale));
  if (bank.length < room.seats.length) {
    throw new Error('Not enough characters');
  }
  const characters = new Map<string, WhoamiCharacter>();
  room.seats.forEach((seat, i) => {
    const entry = bank[i]!;
    characters.set(seat.id, { name: entry.name, wiki: entry.wiki });
  });
  room.whoami = {
    locale,
    characters,
    public: {
      phase: 'memorize',
      memorizeIndex: 0,
    },
  };
  room.phase = 'claim';
  room.claims.clear();
}

export function whoamiVisibleFor(
  room: Room,
  yourSeatIds: string[],
): Record<string, WhoamiCharacter> {
  const out: Record<string, WhoamiCharacter> = {};
  const chars = room.whoami?.characters;
  if (!chars) return out;
  const yours = new Set(yourSeatIds);
  for (const [seatId, character] of chars) {
    if (!yours.has(seatId)) {
      out[seatId] = character;
    }
  }
  return out;
}

export function whoamiStartPlay(room: Room): void {
  if (!room.whoami) return;
  room.whoami.public.phase = 'play';
  room.phase = 'playing';
}
