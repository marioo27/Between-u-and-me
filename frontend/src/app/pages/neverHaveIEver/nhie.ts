import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nService, Locale } from '../../core/i18n/i18n';
import {
  collectPhrases,
  createDeck,
  drawNext,
  listCategories,
  NhieDeckState,
  NhiePromptBank,
} from './nhie-deck';

type LoadState = 'loading' | 'ready' | 'error';

const PROMPT_FILES: Record<Locale, string> = {
  es: '/data/yo-nunca.json',
  en: '/data/nhie.json',
};

@Component({
  imports: [RouterLink],
  selector: 'app-nhie',
  styleUrl: './nhie.css',
  templateUrl: './nhie.html',
})
export class Nhie {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly t = this.i18n.t;

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly bank = signal<NhiePromptBank>({});
  protected readonly categories = signal<string[]>([]);
  protected readonly selected = signal<string[]>([]);
  protected readonly deck = signal<NhieDeckState>({
    remaining: [],
    pool: [],
    current: null,
    reshuffled: false,
  });
  protected readonly showReshuffleNote = signal(false);
  protected readonly filtersOpen = signal(false);

  protected readonly allSelected = computed(() => {
    const all = this.categories();
    const selected = this.selected();
    return all.length > 0 && selected.length === all.length;
  });

  protected readonly categoriesSummary = computed(() => {
    const selected = this.selected();
    if (selected.length === 0) {
      return this.t().nhieCategoriesSummaryNone;
    }
    if (this.allSelected()) {
      return this.t().nhieCategoriesSummaryAll;
    }
    return this.t().nhieCategoriesSummaryCount.replace(
      '{count}',
      String(selected.length),
    );
  });

  protected readonly poolSize = computed(() => this.deck().pool.length);
  protected readonly shownCount = computed(() => {
    const state = this.deck();
    if (state.pool.length === 0 || state.current === null) {
      return 0;
    }
    return state.pool.length - state.remaining.length;
  });

  protected readonly progressLabel = computed(() => {
    const total = this.poolSize();
    const current = this.shownCount();
    if (total === 0) {
      return '';
    }
    return this.t()
      .nhieProgress.replace('{current}', String(current))
      .replace('{total}', String(total));
  });

  protected readonly isEmpty = computed(
    () => this.loadState() === 'ready' && this.poolSize() === 0,
  );

  constructor() {
    effect((onCleanup) => {
      const locale = this.i18n.locale();
      this.loadState.set('loading');

      const sub = this.http
        .get<NhiePromptBank>(PROMPT_FILES[locale])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.applyBank(data),
          error: () => this.loadState.set('error'),
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  protected categoryLabel(id: string): string {
    return this.i18n.categoryLabel(id);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.applySelection([]);
      return;
    }
    this.applySelection([...this.categories()]);
  }

  protected toggleCategory(id: string): void {
    const current = this.selected();
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    this.applySelection(next);
  }

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  protected nextPhrase(): void {
    if (this.poolSize() === 0) {
      return;
    }
    const next = drawNext(this.deck());
    this.deck.set(next);
    this.showReshuffleNote.set(next.reshuffled);
  }

  private applyBank(data: NhiePromptBank): void {
    const cats = listCategories(data);
    const previous = this.selected();
    const nextSelected =
      previous.length === 0
        ? [...cats]
        : previous.filter((id) => cats.includes(id));

    this.bank.set(data);
    this.categories.set(cats);
    this.selected.set(nextSelected.length > 0 ? nextSelected : [...cats]);
    this.rebuildDeck(this.selected());
    this.loadState.set('ready');
  }

  private applySelection(next: string[]): void {
    this.selected.set(next);
    this.rebuildDeck(next);
  }

  private rebuildDeck(selectedCategories: string[]): void {
    const pool = collectPhrases(this.bank(), selectedCategories);
    this.deck.set(createDeck(pool));
    this.showReshuffleNote.set(false);
  }
}
