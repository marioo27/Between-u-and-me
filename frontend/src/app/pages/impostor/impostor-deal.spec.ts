import { describe, expect, it } from 'vitest';
import {
  buildRevealOrder,
  clampSelectedImpostors,
  clipGraphemes,
  dealRound,
  graphemeLength,
  maxImpostors,
  pickHintWord,
  resolveImpostorCount,
} from './impostor-deal';

describe('maxImpostors', () => {
  it('follows the fixed table', () => {
    expect(maxImpostors(2)).toBe(0);
    expect(maxImpostors(3)).toBe(1);
    expect(maxImpostors(4)).toBe(1);
    expect(maxImpostors(5)).toBe(2);
    expect(maxImpostors(6)).toBe(2);
    expect(maxImpostors(7)).toBe(3);
    expect(maxImpostors(9)).toBe(3);
    expect(maxImpostors(10)).toBe(4);
    expect(maxImpostors(12)).toBe(4);
    expect(maxImpostors(15)).toBe(5);
  });
});

describe('resolveImpostorCount', () => {
  it('clamps selected count in normal mode', () => {
    expect(
      resolveImpostorCount({ playerCount: 5, selected: 9, chaos: false }),
    ).toBe(2);
    expect(
      resolveImpostorCount({ playerCount: 5, selected: 0, chaos: false }),
    ).toBe(1);
  });

  it('chaos rarely picks none or all; usually the selected count', () => {
    expect(
      resolveImpostorCount({
        playerCount: 6,
        selected: 2,
        chaos: true,
        rng: () => 0.01,
      }),
    ).toBe(0);
    expect(
      resolveImpostorCount({
        playerCount: 6,
        selected: 2,
        chaos: true,
        rng: () => 0.07,
      }),
    ).toBe(6);
    expect(
      resolveImpostorCount({
        playerCount: 6,
        selected: 2,
        chaos: true,
        rng: () => 0.5,
      }),
    ).toBe(2);
  });
});

describe('buildRevealOrder', () => {
  it('keeps list order or shuffles indices', () => {
    expect(buildRevealOrder(3, 'list')).toEqual([0, 1, 2]);
    const rng = () => 0.99;
    expect(buildRevealOrder(3, 'random', rng)).toHaveLength(3);
  });
});

describe('pickHintWord', () => {
  it('returns null when only the secret exists', () => {
    expect(pickHintWord(['solo'], 'solo')).toBeNull();
  });

  it('never returns the secret', () => {
    const hint = pickHintWord(['a', 'b', 'c'], 'a', () => 0);
    expect(hint).toBe('b');
  });
});

describe('dealRound', () => {
  const bank = {
    animales: ['gato', 'perro', 'loro'],
    comidas: ['pizza'],
  };

  it('deals civilians the secret and impostors per hint mode', () => {
    let n = 0;
    const rng = () => {
      const values = [0.1, 0.1, 0.5, 0.01, 0.2, 0.3, 0.4, 0.5, 0.6];
      return values[n++] ?? 0.5;
    };
    const round = dealRound({
      names: ['Ana', 'Bob', 'Cara'],
      selectedCategories: ['animales'],
      bank,
      selectedImpostors: 1,
      chaos: false,
      hintMode: 'hint',
      orderMode: 'list',
      discreet: false,
      rng,
    });
    expect(round.categoryId).toBe('animales');
    expect(round.players).toHaveLength(3);
    expect(round.impostorCount).toBe(1);
    const impostors = round.players.filter((p) => p.isImpostor);
    const civils = round.players.filter((p) => !p.isImpostor);
    expect(impostors).toHaveLength(1);
    expect(civils.every((p) => p.revealWord === round.secretWord)).toBe(true);
    expect(impostors[0]!.revealWord).toBeNull();
    expect(impostors[0]!.revealHintWord).not.toBe(round.secretWord);
  });

  it('falls back hint mode to category when only one word', () => {
    let n = 0;
    const rng = () => {
      const values = [0, 0, 0.5, 0.01, 0.2, 0.3, 0.4];
      return values[n++] ?? 0.5;
    };
    const round = dealRound({
      names: ['A', 'B', 'C'],
      selectedCategories: ['comidas'],
      bank,
      selectedImpostors: 1,
      chaos: false,
      hintMode: 'hint',
      orderMode: 'list',
      discreet: true,
      rng,
    });
    const impostor = round.players.find((p) => p.isImpostor)!;
    expect(impostor.revealHintMode).toBe('category');
  });
});

describe('grapheme helpers', () => {
  it('counts and clips graphemes', () => {
    expect(graphemeLength('abc')).toBe(3);
    expect(clipGraphemes('abcdefghijKLMNOPQRSTUV', 20).length).toBeLessThanOrEqual(
      22,
    );
    expect(graphemeLength(clipGraphemes('abcdefghijKLMNOPQRSTUV', 20))).toBe(20);
  });
});

describe('clampSelectedImpostors', () => {
  it('stays within 1..max', () => {
    expect(clampSelectedImpostors(8, 1)).toBe(1);
    expect(clampSelectedImpostors(8, 3)).toBe(3);
    expect(clampSelectedImpostors(8, 99)).toBe(3);
  });
});
