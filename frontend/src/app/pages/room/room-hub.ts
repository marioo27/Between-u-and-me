import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n';
import { RoomService } from '../../core/room/room.service';
import type { GameId } from '../../core/room/room.types';
import { SiteMenu } from '../../shared/site-menu/site-menu';

@Component({
  imports: [RouterLink, SiteMenu],
  selector: 'app-room-hub',
  styleUrl: './room.css',
  templateUrl: './room-hub.html',
})
export class RoomHub {
  private readonly rooms = inject(RoomService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18nService).t;

  protected readonly joinCode = signal('');
  protected readonly busy = signal(false);
  protected readonly error = this.rooms.error;
  protected readonly waking = this.rooms.waking;

  protected async create(game: GameId): Promise<void> {
    this.busy.set(true);
    try {
      const state = await this.rooms.create(game);
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
