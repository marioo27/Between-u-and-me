import {
  collectPhrases,
  createDeck,
  drawNext,
  listCategories,
  NhiePromptBank,
  shuffle,
} from './nhie-deck';

const sampleBank: NhiePromptBank = {
  sexo_y_sexualidad: ['A1', 'A2'],
  amor_y_relaciones: ['B1'],
  vacia: [],
  otros: ['C1', 'C2', 'C3'],
};

function sequentialRng(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

describe('nhie-deck', () => {
  describe('listCategories', () => {
    it('returns known categories in canonical order and appends extras', () => {
      expect(listCategories(sampleBank)).toEqual([
        'sexo_y_sexualidad',
        'amor_y_relaciones',
        'otros',
        'vacia',
      ]);
    });
  });

  describe('collectPhrases', () => {
    it('returns an empty list when no categories are selected', () => {
      expect(collectPhrases(sampleBank, [])).toEqual([]);
    });

    it('filters phrases to the selected categories', () => {
      expect(collectPhrases(sampleBank, ['amor_y_relaciones', 'otros'])).toEqual([
        'B1',
        'C1',
        'C2',
        'C3',
      ]);
    });

    it('skips empty categories without failing', () => {
      expect(collectPhrases(sampleBank, ['vacia', 'sexo_y_sexualidad'])).toEqual([
        'A1',
        'A2',
      ]);
    });

    it('returns an empty list when selected categories have no phrases', () => {
      expect(collectPhrases(sampleBank, ['vacia'])).toEqual([]);
    });
  });

  describe('shuffle', () => {
    it('returns a new array with the same items', () => {
      const input = ['a', 'b', 'c'];
      const result = shuffle(input, sequentialRng([0, 0]));
      expect(result).toHaveLength(3);
      expect(result.sort()).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(input);
    });
  });

  describe('createDeck / drawNext', () => {
    it('creates an empty deck when the pool is empty', () => {
      expect(createDeck([])).toEqual({
        remaining: [],
        pool: [],
        current: null,
        reshuffled: false,
      });
    });

    it('draws every phrase once before reshuffling', () => {
      const pool = ['one', 'two', 'three'];
      let state = createDeck(pool, sequentialRng([0, 0]));
      const seen = new Set<string>();

      expect(state.current).not.toBeNull();
      seen.add(state.current!);

      state = drawNext(state, sequentialRng([0, 0]));
      seen.add(state.current!);
      expect(state.reshuffled).toBe(false);

      state = drawNext(state, sequentialRng([0, 0]));
      seen.add(state.current!);
      expect(state.reshuffled).toBe(false);
      expect(seen).toEqual(new Set(pool));
      expect(state.remaining).toEqual([]);

      state = drawNext(state, sequentialRng([0, 0]));
      expect(state.reshuffled).toBe(true);
      expect(pool).toContain(state.current!);
      expect(state.remaining).toHaveLength(pool.length - 1);
    });

    it('keeps returning null when drawing from an empty pool', () => {
      const empty = createDeck([]);
      expect(drawNext(empty)).toEqual({
        remaining: [],
        pool: [],
        current: null,
        reshuffled: false,
      });
    });
  });
});
