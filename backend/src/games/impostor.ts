import { readFileSync } from 'node:fs';
import { dataFile } from '../dataPath.js';
import type { ImpostorSetup, ImpostorSeatSecret, Room } from '../types.js';
import { dealRound, type ImpostorWordBank } from './impostorDeal.js';

function loadBank(locale: 'es' | 'en'): ImpostorWordBank {
  const file = locale === 'es' ? 'impostor-es.json' : 'impostor-en.json';
  return JSON.parse(readFileSync(dataFile(file), 'utf8')) as ImpostorWordBank;
}

export function startImpostorRound(room: Room, setup: ImpostorSetup): void {
  if (room.seats.length < 3) {
    throw new Error('Need at least 3 players');
  }
  const bank = loadBank(setup.locale);
  const dealt = dealRound({
    names: room.seats.map((s) => s.name),
    selectedCategories: setup.selectedCategories,
    bank,
    selectedImpostors: setup.selectedImpostors,
    chaos: setup.chaos,
    hintMode: setup.hintMode,
    orderMode: setup.orderMode,
    discreet: setup.discreet,
  });

  const secrets = new Map<string, ImpostorSeatSecret>();
  room.seats.forEach((seat, index) => {
    const p = dealt.players[index]!;
    secrets.set(seat.id, {
      isImpostor: p.isImpostor,
      revealWord: p.revealWord,
      revealHintMode: p.revealHintMode,
      revealCategory: p.revealCategory,
      revealHintWord: p.revealHintWord,
    });
  });

  const revealOrder = dealt.revealOrder.map((i) => room.seats[i]!.id);
  const starterSeatId = room.seats[dealt.starterIndex]?.id ?? null;

  room.impostor = {
    setup,
    secrets,
    public: {
      phase: 'reveal',
      revealIndex: 0,
      revealOrder,
      starterSeatId,
      impostorSeatIds: null,
      setup,
    },
  };
  room.phase = 'claim';
  room.claims.clear();
}

export function impostorAdvanceReveal(room: Room): void {
  const imp = room.impostor;
  if (!imp || imp.public.phase !== 'reveal') return;
  if (imp.public.revealIndex >= imp.public.revealOrder.length - 1) {
    imp.public.phase = 'play';
    room.phase = 'playing';
    return;
  }
  imp.public.revealIndex += 1;
}

export function impostorGoPlay(room: Room): void {
  const imp = room.impostor;
  if (!imp) return;
  imp.public.phase = 'play';
  room.phase = 'playing';
}

export function impostorReveal(room: Room): void {
  const imp = room.impostor;
  if (!imp) return;
  const ids: string[] = [];
  for (const [seatId, secret] of imp.secrets) {
    if (secret.isImpostor) ids.push(seatId);
  }
  imp.public.impostorSeatIds = ids;
  imp.public.phase = 'revealed';
  room.phase = 'revealed';
}

export function impostorSecretsFor(
  room: Room,
  seatIds: string[],
): Record<string, ImpostorSeatSecret> {
  const out: Record<string, ImpostorSeatSecret> = {};
  const secrets = room.impostor?.secrets;
  if (!secrets) return out;
  for (const id of seatIds) {
    const s = secrets.get(id);
    if (s) out[id] = s;
  }
  return out;
}
