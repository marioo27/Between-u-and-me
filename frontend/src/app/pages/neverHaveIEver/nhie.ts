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
import { SiteMenu } from '../../shared/site-menu/site-menu';
import {
  atmosphereMotifs,
  atmosphereTheme,
} from './nhie-atmosphere';
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
  imports: [RouterLink, SiteMenu],
  selector: 'app-nhie',
  styleUrl: './nhie.css',
  templateUrl: './nhie.html',
  host: {
    '[style.--atmosphere-paper]': 'atmosphere().paper',
    '[style.--atmosphere-ink]': 'atmosphere().ink',
    '[style.--color-accent]': 'atmosphere().accent',
    '[style.--color-accent-2]': 'atmosphere().accent2',
    '[style.--sticker-fill]': 'atmosphere().sticker',
    '[style.background]': 'atmosphere().paper',
  },
})
export class Nhie {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly t = this.i18n.t;
  protected readonly showHowTo = signal(false);

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly bank = signal<NhiePromptBank>({});
  protected readonly deck = signal<NhieDeckState>({
    remaining: [],
    pool: [],
    current: null,
    reshuffled: false,
  });
  protected readonly showReshuffleNote = signal(false);

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

  protected readonly currentCategory = computed(
    () => this.deck().current?.category ?? null,
  );

  protected readonly atmosphere = computed(() => {
    const category = this.currentCategory();
    const theme = atmosphereTheme(category);
    return {
      category,
      paper: theme.paper,
      ink: theme.ink,
      accent: theme.accent,
      accent2: theme.accent2,
      sticker: theme.sticker,
      motifs: atmosphereMotifs(category),
    };
  });

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

  protected openHowTo(): void {
    this.showHowTo.set(true);
  }

  protected closeHowTo(): void {
    this.showHowTo.set(false);
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
    this.bank.set(data);
    this.deck.set(createDeck(collectPhrases(data, cats)));
    this.showReshuffleNote.set(false);
    this.loadState.set('ready');
  }
}
