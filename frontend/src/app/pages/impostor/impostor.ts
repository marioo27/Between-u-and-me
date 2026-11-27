import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nService, Locale } from '../../core/i18n/i18n';
import { SiteMenu } from '../../shared/site-menu/site-menu';
import {
  DealtPlayer,
  ImpostorHintMode,
  ImpostorRound,
  ImpostorWordBank,
  PLAYER_NAME_MAX,
  RevealOrderMode,
  clampSelectedImpostors,
  clipGraphemes,
  dealRound,
  graphemeLength,
  listCategories,
  maxImpostors,
} from './impostor-deal';

type Phase = 'setup' | 'reveal' | 'play' | 'revealed';
type LoadState = 'loading' | 'ready' | 'error';
type EndConfirm = 'idle' | 'one' | 'two';
type SetupPlayer = { id: string; name: string };

let setupPlayerSeq = 0;
function nextSetupPlayerId(): string {
  setupPlayerSeq += 1;
  return `p-${setupPlayerSeq}`;
}

const WORD_FILES: Record<Locale, string> = {
  es: '/data/impostor-es.json',
  en: '/data/impostor-en.json',
};

@Component({
  imports: [RouterLink, SiteMenu],
  selector: 'app-impostor',
  styleUrl: './impostor.css',
  templateUrl: './impostor.html',
})
export class Impostor {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly namesList = viewChild<ElementRef<HTMLElement>>('namesList');

  protected readonly t = this.i18n.t;
  protected readonly nameMax = PLAYER_NAME_MAX;

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly bank = signal<ImpostorWordBank>({});
  protected readonly categories = signal<string[]>([]);
  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly players = signal<SetupPlayer[]>([]);
  protected readonly nameDraft = signal('');
  protected readonly selectedImpostors = signal(1);
  protected readonly categoriesOpen = signal(false);
  protected readonly chaos = signal(false);
  protected readonly hintMode = signal<ImpostorHintMode>('hint');
  protected readonly orderMode = signal<RevealOrderMode>('list');
  protected readonly discreet = signal(false);
  protected readonly phase = signal<Phase>('setup');
  protected readonly round = signal<ImpostorRound | null>(null);
  protected readonly revealIndex = signal(0);
  protected readonly holding = signal(false);
  protected readonly dragFrom = signal<number | null>(null);
  /** True after the current player has opened the card at least once. */
  protected readonly hasRevealed = signal(false);
  protected readonly showHowTo = signal(false);
  protected readonly endConfirm = signal<EndConfirm>('idle');
  protected readonly impostorsShown = signal(false);

  protected readonly names = computed(() => this.players().map((p) => p.name));
  protected readonly maxImp = computed(() => maxImpostors(this.players().length));
  protected readonly canStart = computed(
    () => this.loadState() === 'ready' && this.players().length >= 3,
  );
  protected readonly allCategoriesSelected = computed(() => {
    const all = this.categories();
    const selected = this.selectedCategories();
    return all.length > 0 && selected.length === all.length;
  });

  protected readonly categoriesSummary = computed(() => {
    const selected = this.selectedCategories();
    if (selected.length === 0) {
      return this.t().nhieCategoriesSummaryNone;
    }
    if (this.allCategoriesSelected()) {
      return this.t().nhieCategoriesSummaryAll;
    }
    return this.t().nhieCategoriesSummaryCount.replace(
      '{count}',
      String(selected.length),
    );
  });

  protected readonly currentPlayer = computed((): DealtPlayer | null => {
    const round = this.round();
    if (!round) return null;
    const index = round.revealOrder[this.revealIndex()];
    if (index === undefined) return null;
    return round.players[index] ?? null;
  });

  protected readonly starterName = computed(() => {
    const round = this.round();
    if (!round) return '';
    return round.players[round.starterIndex]?.name ?? '';
  });

  protected readonly isLastReveal = computed(() => {
    const round = this.round();
    if (!round) return false;
    return this.revealIndex() >= round.revealOrder.length - 1;
  });

  protected readonly impostorNames = computed(() => {
    const round = this.round();
    if (!round) return [];
    return round.players.filter((p) => p.isImpostor).map((p) => p.name);
  });

  constructor() {
    effect((onCleanup) => {
      const locale = this.i18n.locale();
      this.loadState.set('loading');
      const sub = this.http
        .get<ImpostorWordBank>(WORD_FILES[locale])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.applyBank(data),
          error: () => this.loadState.set('error'),
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      if (this.phase() === 'setup') {
        return;
      }
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
      };
      window.addEventListener('beforeunload', onBeforeUnload);
      onCleanup(() => window.removeEventListener('beforeunload', onBeforeUnload));
    });
  }

  protected categoryLabel(id: string): string {
    return this.i18n.impostorCategoryLabel(id);
  }

  protected onNameInput(value: string): void {
    this.nameDraft.set(clipGraphemes(value, PLAYER_NAME_MAX));
  }

  protected addName(): void {
    const value = this.nameDraft();
    if (graphemeLength(value) > PLAYER_NAME_MAX) return;
    this.players.update((list) => [
      ...list,
      { id: nextSetupPlayerId(), name: value },
    ]);
    this.nameDraft.set('');
    this.syncImpostorSelection();
  }

  protected removeName(index: number): void {
    this.players.update((list) => list.filter((_, i) => i !== index));
    this.syncImpostorSelection();
  }

  protected startReorder(index: number, event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId);
    }
    this.dragFrom.set(index);
  }

  protected moveReorder(event: PointerEvent): void {
    const from = this.dragFrom();
    if (from === null) {
      return;
    }
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const row = hit instanceof Element ? hit.closest('[data-name-index]') : null;
    if (!(row instanceof HTMLElement)) {
      return;
    }
    const to = Number(row.dataset['nameIndex']);
    if (!Number.isInteger(to) || to === from) {
      return;
    }
    this.animateReorder(() => {
      this.players.update((list) => {
        const next = [...list];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item!);
        return next;
      });
      this.dragFrom.set(to);
    });
  }

  protected endReorder(): void {
    this.dragFrom.set(null);
  }

  protected toggleCategoriesOpen(): void {
    this.categoriesOpen.update((open) => !open);
  }

  protected toggleAllCategories(): void {
    if (this.allCategoriesSelected()) {
      this.selectedCategories.set([]);
      return;
    }
    this.selectedCategories.set([...this.categories()]);
  }

  protected toggleCategory(id: string): void {
    const current = this.selectedCategories();
    this.selectedCategories.set(
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );
  }

  protected isCategorySelected(id: string): boolean {
    return this.selectedCategories().includes(id);
  }

  protected setImpostors(value: number): void {
    this.selectedImpostors.set(
      clampSelectedImpostors(this.players().length, value),
    );
  }

  protected setHintMode(mode: ImpostorHintMode): void {
    this.hintMode.set(mode);
  }

  protected setOrderMode(mode: RevealOrderMode): void {
    this.orderMode.set(mode);
  }

  protected startRound(): void {
    if (!this.canStart()) return;
    const cats = this.selectedCategories();
    const round = dealRound({
      names: this.names(),
      selectedCategories: cats.length ? cats : this.categories(),
      bank: this.bank(),
      selectedImpostors: this.selectedImpostors(),
      chaos: this.chaos(),
      hintMode: this.hintMode(),
      orderMode: this.orderMode(),
      discreet: this.discreet(),
    });
    this.round.set(round);
    this.revealIndex.set(0);
    this.holding.set(false);
    this.hasRevealed.set(false);
    this.impostorsShown.set(false);
    this.phase.set('reveal');
    this.endConfirm.set('idle');
  }

  protected holdStart(event: Event): void {
    event.preventDefault();
    this.holding.set(true);
    this.hasRevealed.set(true);
  }

  protected holdEnd(): void {
    this.holding.set(false);
  }

  protected nextReveal(): void {
    if (!this.hasRevealed()) {
      return;
    }
    this.holding.set(false);
    if (this.isLastReveal()) {
      this.phase.set('play');
      return;
    }
    this.revealIndex.update((i) => i + 1);
    this.hasRevealed.set(false);
  }

  protected goStartGame(): void {
    if (!this.hasRevealed()) {
      return;
    }
    this.holding.set(false);
    this.phase.set('play');
  }

  protected revealImpostors(): void {
    this.impostorsShown.set(true);
    this.phase.set('revealed');
  }

  protected newRound(): void {
    this.startRound();
  }

  protected openHowTo(): void {
    this.showHowTo.set(true);
  }

  protected closeHowTo(): void {
    this.showHowTo.set(false);
  }

  protected beginEnd(): void {
    this.endConfirm.set('one');
  }

  protected confirmEndStep(): void {
    if (this.endConfirm() === 'one') {
      this.endConfirm.set('two');
      return;
    }
    if (this.endConfirm() === 'two') {
      this.resetToSetupKeepSettings();
    }
  }

  protected cancelEnd(): void {
    this.endConfirm.set('idle');
  }

  protected resetToSetupKeepSettings(): void {
    this.round.set(null);
    this.revealIndex.set(0);
    this.holding.set(false);
    this.hasRevealed.set(false);
    this.impostorsShown.set(false);
    this.phase.set('setup');
    this.endConfirm.set('idle');
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  @HostListener('window:touchcancel')
  protected onGlobalRelease(): void {
    if (this.holding()) {
      this.holding.set(false);
    }
  }

  private applyBank(data: ImpostorWordBank): void {
    const cats = listCategories(data);
    const previous = this.selectedCategories();
    const next =
      previous.length === 0
        ? [...cats]
        : previous.filter((id) => cats.includes(id));
    this.bank.set(data);
    this.categories.set(cats);
    this.selectedCategories.set(next.length ? next : [...cats]);
    this.loadState.set('ready');
    this.syncImpostorSelection();
  }

  private syncImpostorSelection(): void {
    const max = maxImpostors(this.players().length);
    if (max < 1) {
      this.selectedImpostors.set(1);
      return;
    }
    this.selectedImpostors.set(
      clampSelectedImpostors(this.players().length, this.selectedImpostors()),
    );
  }

  private animateReorder(mutate: () => void): void {
    const root = this.namesList()?.nativeElement;
    if (!root) {
      mutate();
      return;
    }

    const before = new Map<string, DOMRect>();
    for (const row of Array.from(
      root.querySelectorAll<HTMLElement>('.setup__name-row'),
    )) {
      const id = row.dataset['nameId'];
      if (id) {
        before.set(id, row.getBoundingClientRect());
      }
    }

    mutate();

    afterNextRender(
      () => {
        for (const row of Array.from(
          root.querySelectorAll<HTMLElement>('.setup__name-row'),
        )) {
          const id = row.dataset['nameId'];
          if (!id) continue;
          const first = before.get(id);
          if (!first) continue;
          const last = row.getBoundingClientRect();
          const dy = first.top - last.top;
          if (Math.abs(dy) < 1) continue;
          row.animate(
            [
              { transform: `translateY(${dy}px)` },
              { transform: 'translateY(0)' },
            ],
            {
              duration: 240,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
          );
        }
      },
      { injector: this.injector },
    );
  }
}
