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
import type { WhoamiCharacter } from '../../core/whoami/whoami-portrait';
import { GameAtmosphere } from '../../shared/game-atmosphere/game-atmosphere';
import { GAME_ATMOSPHERE } from '../../shared/game-atmosphere/game-atmosphere.model';
import { SiteMenu } from '../../shared/site-menu/site-menu';
import {
  PortraitSize,
  WhoamiPortrait,
} from '../../shared/whoami-portrait/whoami-portrait';

type LoadState = 'loading' | 'ready' | 'error';
type Phase = 'setup' | 'memorize' | 'play';
type SetupPlayer = { id: string; name: string };
type CancelConfirm = 'idle' | 'one' | 'two';

let seq = 0;
function nextId(): string {
  seq += 1;
  return `w-${seq}`;
}

const FILES: Record<Locale, string> = {
  es: '/data/whoami-es.json',
  en: '/data/whoami-en.json',
};

@Component({
  imports: [RouterLink, SiteMenu, WhoamiPortrait, GameAtmosphere],
  selector: 'app-whoami',
  styleUrls: ['./whoami.css', '../../shared/whoami-portrait/whoami-seen-layout.css'],
  templateUrl: './whoami.html',
  host: {
    '[style.--atmosphere-paper]': 'atm.paper',
    '[style.--atmosphere-ink]': 'atm.ink',
    '[style.background]': 'atm.paper',
  },
})
export class WhoAmI {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly atm = GAME_ATMOSPHERE.whoami;
  protected readonly t = this.i18n.t;
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly bank = signal<WhoamiCharacter[]>([]);
  protected readonly players = signal<SetupPlayer[]>([]);
  protected readonly nameDraft = signal('');
  protected readonly phase = signal<Phase>('setup');
  protected readonly characters = signal<Record<string, WhoamiCharacter>>({});
  protected readonly memorizeIndex = signal(0);
  protected readonly holding = signal(false);
  protected readonly showHowTo = signal(false);
  protected readonly cancelConfirm = signal<CancelConfirm>('idle');

  protected readonly canStart = computed(
    () => this.loadState() === 'ready' && this.players().length >= 2,
  );

  protected readonly currentMemorize = computed(() => {
    const list = this.players();
    const idx = this.memorizeIndex();
    const viewer = list[idx];
    if (!viewer) return null;
    const others = list
      .filter((p) => p.id !== viewer.id)
      .map((p) => {
        const ch = this.characters()[p.id];
        return {
          name: p.name,
          character: ch?.name ?? '·',
          wiki: ch?.wiki,
        };
      });
    return { viewer: viewer.name, others };
  });

  protected readonly portraitSize = computed<PortraitSize>(() => {
    const n = this.currentMemorize()?.others.length ?? 1;
    if (n <= 1) return 'lg';
    if (n <= 4) return 'md';
    return 'sm';
  });

  constructor() {
    effect((onCleanup) => {
      const locale = this.i18n.locale();
      this.loadState.set('loading');
      const sub = this.http
        .get<WhoamiCharacter[]>(FILES[locale])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.bank.set(data);
            this.loadState.set('ready');
          },
          error: () => this.loadState.set('error'),
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected addName(): void {
    const value = this.nameDraft().trim().slice(0, 20);
    this.players.update((list) => [...list, { id: nextId(), name: value || '·' }]);
    this.nameDraft.set('');
  }

  protected removeName(index: number): void {
    this.players.update((list) => list.filter((_, i) => i !== index));
  }

  protected start(): void {
    if (!this.canStart()) return;
    const bank = [...this.bank()].sort(() => Math.random() - 0.5);
    const chars: Record<string, WhoamiCharacter> = {};
    this.players().forEach((p, i) => {
      chars[p.id] = bank[i % bank.length]!;
    });
    this.characters.set(chars);
    this.memorizeIndex.set(0);
    this.phase.set('memorize');
  }

  protected nextMemorize(): void {
    if (this.memorizeIndex() >= this.players().length - 1) {
      this.phase.set('play');
      return;
    }
    this.holding.set(false);
    this.memorizeIndex.update((i) => i + 1);
  }

  protected holdStart(event: Event): void {
    event.preventDefault();
    this.holding.set(true);
  }

  protected holdEnd(): void {
    this.holding.set(false);
  }

  protected openHowTo(): void {
    this.showHowTo.set(true);
  }

  protected closeHowTo(): void {
    this.showHowTo.set(false);
  }

  protected beginCancel(): void {
    this.cancelConfirm.set('one');
  }

  protected confirmCancelStep(): void {
    if (this.cancelConfirm() === 'one') {
      this.cancelConfirm.set('two');
      return;
    }
    if (this.cancelConfirm() === 'two') {
      this.backSetup();
    }
  }

  protected dismissCancel(): void {
    this.cancelConfirm.set('idle');
  }

  protected backSetup(): void {
    this.phase.set('setup');
    this.holding.set(false);
    this.cancelConfirm.set('idle');
  }
}
