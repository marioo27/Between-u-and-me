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

type LoadState = 'loading' | 'ready' | 'error';
type Phase = 'setup' | 'memorize' | 'play';
type SetupPlayer = { id: string; name: string };

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
  imports: [RouterLink, SiteMenu],
  selector: 'app-whoami',
  styleUrl: './whoami.css',
  templateUrl: './whoami.html',
})
export class WhoAmI {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly t = this.i18n.t;
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly bank = signal<{ name: string }[]>([]);
  protected readonly players = signal<SetupPlayer[]>([]);
  protected readonly nameDraft = signal('');
  protected readonly phase = signal<Phase>('setup');
  protected readonly characters = signal<Record<string, string>>({});
  protected readonly memorizeIndex = signal(0);
  protected readonly holding = signal(false);
  protected readonly showHowTo = signal(false);

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
      .map((p) => ({
        name: p.name,
        character: this.characters()[p.id] ?? '·',
      }));
    return { viewer: viewer.name, others };
  });

  constructor() {
    effect((onCleanup) => {
      const locale = this.i18n.locale();
      this.loadState.set('loading');
      const sub = this.http
        .get<{ name: string }[]>(FILES[locale])
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
    const chars: Record<string, string> = {};
    this.players().forEach((p, i) => {
      chars[p.id] = bank[i % bank.length]!.name;
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

  protected backSetup(): void {
    this.phase.set('setup');
    this.holding.set(false);
  }
}
