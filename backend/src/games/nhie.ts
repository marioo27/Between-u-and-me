import { readFileSync } from 'node:fs';
import { dataFile } from '../dataPath.js';
import type { Room } from '../types.js';

type Bank = Record<string, string[]>;

function loadBank(locale: 'es' | 'en'): Bank {
  const file = locale === 'es' ? 'yo-nunca.json' : 'nhie.json';
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

export function initNhie(room: Room, locale: 'es' | 'en' = 'es'): void {
  const bank = loadBank(locale);
  const deck: { text: string; category: string }[] = [];
  for (const [category, phrases] of Object.entries(bank)) {
    for (const text of phrases) {
      deck.push({ text, category });
    }
  }
  room.nhie = {
    locale,
    deck: shuffle(deck),
    index: 0,
  };
}

export function nhiePublic(room: Room) {
  const state = room.nhie;
  if (!state || state.deck.length === 0) {
    return { phrase: null, category: null, index: 0, total: 0 };
  }
  const card = state.deck[state.index] ?? null;
  return {
    phrase: card?.text ?? null,
    category: card?.category ?? null,
    index: state.index + 1,
    total: state.deck.length,
  };
}

export function nhieNext(room: Room): void {
  if (!room.nhie || room.nhie.deck.length === 0) return;
  if (room.nhie.index >= room.nhie.deck.length - 1) {
    room.nhie.deck = shuffle(room.nhie.deck);
    room.nhie.index = 0;
    return;
  }
  room.nhie.index += 1;
}
