import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n';
import {
  collectPhrases,
  createDeck,
  drawNext,
  listCategories,
  NhieDeckState,
  NhiePromptBank,
} from './nhie-deck';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  imports: [RouterLink],
  selector: 'app-nhie',
  styleUrl: './nhie.css',
  templateUrl: './nhie.html',
})
export class Nhie implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

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

  protected readonly allSelected = computed(() => {
    const all = this.categories();
    const selected = this.selected();
    return all.length > 0 && selected.length === all.length;
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

  ngOnInit(): void {
    this.http.get<NhiePromptBank>('/data/yo-nunca.json').subscribe({
      next: (data) => {
        const cats = listCategories(data);
        this.bank.set(data);
        this.categories.set(cats);
        this.selected.set([...cats]);
        this.rebuildDeck(cats);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  protected categoryLabel(id: string): string {
    return this.i18n.categoryLabel(id);
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
