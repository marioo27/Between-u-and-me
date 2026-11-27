import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n';
import { RoomService } from '../../core/room/room.service';
import type { GameId } from '../../core/room/room.types';
import { SiteMenu } from '../../shared/site-menu/site-menu';

function parseGame(raw: string | null | undefined): GameId | null {
  if (raw === 'nhie' || raw === 'impostor' || raw === 'whoami') return raw;
  return null;
}

@Component({
  imports: [RouterLink, SiteMenu],
  selector: 'app-room-hub',
  styleUrl: './room.css',
  templateUrl: './room-hub.html',
})
export class RoomHub {
  private readonly rooms = inject(RoomService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  private readonly gameParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => parseGame(p.get('game')))),
    { initialValue: parseGame(this.route.snapshot.queryParamMap.get('game')) },
  );

  protected readonly game = computed(() => this.gameParam());
  protected readonly backLink = computed(() => {
    const g = this.game();
    if (g === 'nhie') return '/nhie';
    if (g === 'impostor') return '/impostor';
    if (g === 'whoami') return '/whoami';
    return '/';
  });
  protected readonly backLabel = computed(() => {
    const g = this.game();
    const m = this.t();
    if (g === 'nhie') return m.homeNhieTitle;
    if (g === 'impostor') return m.homeImpostorTitle;
    if (g === 'whoami') return m.homeWhoamiTitle;
    return 'Between U & Me';
  });

  protected readonly mode = signal<'choose' | 'join'>('choose');
  protected readonly joinCode = signal('');
  protected readonly busy = signal(false);
  protected readonly error = this.rooms.error;
  protected readonly waking = this.rooms.waking;

  constructor() {
    const fromQuery = this.route.snapshot.queryParamMap.get('error');
    if (fromQuery) {
      this.rooms.error.set(fromQuery);
    }
  }

  protected showJoin(): void {
    this.mode.set('join');
    this.rooms.error.set(null);
  }

  protected showChoose(): void {
    this.mode.set('choose');
    this.joinCode.set('');
    this.rooms.error.set(null);
  }

  protected async onCreate(): Promise<void> {
    const g = this.game();
    if (!g) {
      this.rooms.error.set(this.t().roomNeedGame);
      return;
    }
    this.busy.set(true);
    try {
      const state = await this.rooms.create(g);
      await this.router.navigate(['/room', state.code]);
    } catch (err) {
      this.rooms.error.set(err instanceof Error ? err.message : 'Error');
    } finally {
      this.busy.set(false);
    }
  }

  protected async join(): Promise<void> {
    const code = this.joinCode().trim();
    if (!code) return;
    this.busy.set(true);
    try {
      const state = await this.rooms.join(code);
      await this.router.navigate(['/room', state.code]);
    } catch (err) {
      this.rooms.error.set(err instanceof Error ? err.message : 'Error');
    } finally {
      this.busy.set(false);
    }
  }
}
