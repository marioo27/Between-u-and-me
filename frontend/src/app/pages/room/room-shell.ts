import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService, Locale } from '../../core/i18n/i18n';
import { RoomService } from '../../core/room/room.service';
import type { ImpostorSetup } from '../../core/room/room.types';
import { GameAtmosphere } from '../../shared/game-atmosphere/game-atmosphere';
import {
  GAME_ATMOSPHERE,
  type GameAtmospherePreset,
} from '../../shared/game-atmosphere/game-atmosphere.model';
import { SiteMenu } from '../../shared/site-menu/site-menu';
import {
  PortraitSize,
  WhoamiPortrait,
} from '../../shared/whoami-portrait/whoami-portrait';
import {
  ImpostorHintMode,
  ImpostorWordBank,
  RevealOrderMode,
  clampSelectedImpostors,
  listCategories,
  maxImpostors,
} from '../impostor/impostor-deal';

const IMPOSTOR_FILES: Record<Locale, string> = {
  es: '/data/impostor-es.json',
  en: '/data/impostor-en.json',
};

@Component({
  imports: [SiteMenu, WhoamiPortrait, GameAtmosphere],
  selector: 'app-room-shell',
  styleUrls: ['./room.css', '../../shared/whoami-portrait/whoami-seen-layout.css'],
  templateUrl: './room-shell.html',
  host: {
    '[style.--atmosphere-paper]': 'atmPaper()',
    '[style.background]': 'atmPaper()',
  },
})
export class RoomShell implements OnInit, OnDestroy {
  private readonly rooms = inject(RoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = this.i18n.t;

  protected readonly state = this.rooms.state;
  protected readonly error = this.rooms.error;
  protected readonly nameDraft = signal('');
  protected readonly draftClaim = signal<string[]>([]);
  protected readonly holding = signal(false);
  protected readonly hasRevealed = signal(false);
  protected readonly leaveConfirm = signal<'idle' | 'one' | 'two'>('idle');

  protected readonly categories = signal<string[]>([]);
  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly selectedImpostors = signal(1);
  protected readonly categoriesOpen = signal(false);
  protected readonly chaos = signal(false);
  protected readonly hintMode = signal<ImpostorHintMode>('hint');
  protected readonly orderMode = signal<RevealOrderMode>('list');
  protected readonly discreet = signal(false);

  protected readonly seatName = computed(() => {
    const map = new Map((this.state()?.seats ?? []).map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? '·';
  });

  protected readonly currentRevealSeatId = computed(() => {
    const imp = this.state()?.impostor;
    if (!imp) return null;
    return imp.revealOrder[imp.revealIndex] ?? null;
  });

  protected readonly yourRevealSecrets = computed(() => {
    const secrets = this.state()?.impostor?.yourSecrets ?? {};
    return Object.entries(secrets);
  });

  protected readonly impostorNames = computed(() => {
    const st = this.state();
    const ids = st?.impostor?.impostorSeatIds ?? [];
    return ids.map((id) => this.seatName()(id));
  });

  protected readonly visibleWhoami = computed(() => {
    const chars = this.state()?.whoami?.visibleCharacters ?? {};
    return Object.entries(chars).map(([id, character]) => ({
      id,
      name: this.seatName()(id),
      character: typeof character === 'string' ? character : character.name,
      wiki: typeof character === 'string' ? undefined : character.wiki,
    }));
  });

  protected readonly whoamiPortraitSize = computed<PortraitSize>(() => {
    const n = this.visibleWhoami().length;
    if (n <= 1) return 'lg';
    if (n <= 4) return 'md';
    return 'sm';
  });

  protected readonly atmPreset = computed<GameAtmospherePreset>(() => {
    const g = this.state()?.game;
    if (g === 'impostor') return 'impostor';
    if (g === 'whoami') return 'whoami';
    return 'home';
  });

  protected readonly atmPaper = computed(() => GAME_ATMOSPHERE[this.atmPreset()].paper);

  protected readonly maxImp = computed(() => maxImpostors(this.state()?.seats.length ?? 0));
  protected readonly allCategoriesSelected = computed(() => {
    const all = this.categories();
    const selected = this.selectedCategories();
    return all.length > 0 && selected.length === all.length;
  });
  protected readonly categoriesSummary = computed(() => {
    const selected = this.selectedCategories();
    if (selected.length === 0) return this.t().nhieCategoriesSummaryNone;
    if (this.allCategoriesSelected()) return this.t().nhieCategoriesSummaryAll;
    return this.t().nhieCategoriesSummaryCount.replace('{count}', String(selected.length));
  });

  private lastSyncedClaims = '';

  constructor() {
    effect(() => {
      const yours = [...(this.state()?.yourSeatIds ?? [])].sort().join('|');
      if (yours === this.lastSyncedClaims) return;
      this.lastSyncedClaims = yours;
      this.draftClaim.set([...(this.state()?.yourSeatIds ?? [])]);
    });

    effect((onCleanup) => {
      if (this.state()?.game !== 'impostor') return;
      const locale = this.i18n.locale();
      const sub = this.http
        .get<ImpostorWordBank>(IMPOSTOR_FILES[locale])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (bank) => {
            const cats = listCategories(bank);
            this.categories.set(cats);
            if (this.selectedCategories().length === 0) {
              this.selectedCategories.set([...cats]);
            }
          },
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const n = this.state()?.seats.length ?? 0;
      this.selectedImpostors.update((current) => clampSelectedImpostors(n, current || 1));
    });
  }

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    try {
      if (!this.rooms.state() || this.rooms.state()?.code !== code.toUpperCase()) {
        await this.rooms.join(code);
      }
      this.draftClaim.set([...(this.rooms.state()?.yourSeatIds ?? [])]);
    } catch (err) {
      const message = err instanceof Error ? err.message : this.t().roomNotFound;
      await this.router.navigate(['/room'], {
        queryParams: { error: message },
      });
    }
  }

  ngOnDestroy(): void {
    /* keep socket for navigation within room; hub/home can disconnect */
  }

  protected categoryLabel(id: string): string {
    const labels = this.t().impostorCategory as Record<string, string>;
    return labels[id] ?? id;
  }

  protected toggleCategoriesOpen(): void {
    this.categoriesOpen.update((open) => !open);
  }

  protected toggleAllCategories(): void {
    if (this.allCategoriesSelected()) {
      this.selectedCategories.set([]);
    } else {
      this.selectedCategories.set([...this.categories()]);
    }
  }

  protected isCategorySelected(id: string): boolean {
    return this.selectedCategories().includes(id);
  }

  protected toggleCategory(id: string): void {
    this.selectedCategories.update((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  protected setImpostors(value: number): void {
    this.selectedImpostors.set(
      clampSelectedImpostors(this.state()?.seats.length ?? 0, value),
    );
  }

  protected setHintMode(mode: ImpostorHintMode): void {
    this.hintMode.set(mode);
  }

  protected setOrderMode(mode: RevealOrderMode): void {
    this.orderMode.set(mode);
  }

  protected async addSeat(): Promise<void> {
    const name = this.nameDraft().trim();
    if (!name) return;
    await this.rooms.addSeat(name);
    this.nameDraft.set('');
  }

  protected async removeSeat(id: string): Promise<void> {
    await this.rooms.removeSeat(id);
  }

  protected toggleClaim(id: string): void {
    this.draftClaim.update((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  protected isClaimedByYou(id: string): boolean {
    return this.draftClaim().includes(id);
  }

  protected isClaimedByOther(id: string): boolean {
    const st = this.state();
    if (!st) return false;
    if (this.draftClaim().includes(id) || st.yourSeatIds.includes(id)) {
      return false;
    }
    return Object.values(st.claims).some((seats) => seats.includes(id));
  }

  protected async saveClaim(): Promise<void> {
    await this.rooms.claim(this.draftClaim());
  }

  protected async startNhie(): Promise<void> {
    await this.rooms.start({ locale: this.i18n.locale() });
  }

  protected async startWhoami(): Promise<void> {
    await this.rooms.start({ locale: this.i18n.locale() });
  }

  protected async startImpostor(): Promise<void> {
    const seatCount = this.state()?.seats.length ?? 0;
    const setup: ImpostorSetup = {
      selectedCategories: [...this.selectedCategories()],
      selectedImpostors: clampSelectedImpostors(seatCount, this.selectedImpostors()),
      chaos: this.chaos(),
      hintMode: this.hintMode(),
      orderMode: this.orderMode(),
      discreet: this.discreet(),
      locale: this.i18n.locale(),
    };
    await this.rooms.start({ impostorSetup: setup });
  }

  protected async finishClaim(): Promise<void> {
    await this.rooms.action('finishClaim');
    this.hasRevealed.set(false);
  }

  protected async nhieNext(): Promise<void> {
    await this.rooms.action('next');
  }

  protected async nextReveal(): Promise<void> {
    // Host advances for others; only block if it's THIS phone's turn and they haven't held.
    if (this.isYourRevealTurn() && !this.hasRevealed()) return;
    this.holding.set(false);
    this.hasRevealed.set(false);
    await this.rooms.action('nextReveal');
  }

  protected async goPlay(): Promise<void> {
    if (this.isYourRevealTurn() && !this.hasRevealed()) return;
    this.holding.set(false);
    await this.rooms.action('goPlay');
  }

  protected async revealImpostors(): Promise<void> {
    await this.rooms.action('revealImpostors');
  }

  protected holdStart(event: Event): void {
    event.preventDefault();
    this.holding.set(true);
    this.hasRevealed.set(true);
  }

  protected holdEnd(): void {
    this.holding.set(false);
  }

  protected isYourRevealTurn(): boolean {
    const seatId = this.currentRevealSeatId();
    if (!seatId) return false;
    return (this.state()?.yourSeatIds ?? []).includes(seatId);
  }

  protected secretFor(seatId: string) {
    return this.state()?.impostor?.yourSecrets?.[seatId] ?? null;
  }

  protected beginLeave(): void {
    this.leaveConfirm.set('one');
  }

  protected confirmLeaveStep(): void {
    if (this.leaveConfirm() === 'one') {
      this.leaveConfirm.set('two');
      return;
    }
    if (this.leaveConfirm() === 'two') {
      this.leaveConfirm.set('idle');
      this.leaveNow();
    }
  }

  protected dismissLeave(): void {
    this.leaveConfirm.set('idle');
  }

  protected leaveNow(): void {
    const game = this.state()?.game;
    this.rooms.disconnect();
    if (game === 'nhie') {
      void this.router.navigate(['/nhie']);
    } else if (game === 'impostor') {
      void this.router.navigate(['/impostor']);
    } else if (game === 'whoami') {
      void this.router.navigate(['/whoami']);
    } else {
      void this.router.navigate(['/']);
    }
  }
}
