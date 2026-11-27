import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n';
import { RoomService } from '../../core/room/room.service';
import type { ImpostorSetup } from '../../core/room/room.types';
import { SiteMenu } from '../../shared/site-menu/site-menu';

@Component({
  imports: [SiteMenu],
  selector: 'app-room-shell',
  styleUrl: './room.css',
  templateUrl: './room-shell.html',
})
export class RoomShell implements OnInit, OnDestroy {
  private readonly rooms = inject(RoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  protected readonly state = this.rooms.state;
  protected readonly error = this.rooms.error;
  protected readonly nameDraft = signal('');
  protected readonly draftClaim = signal<string[]>([]);
  protected readonly holding = signal(false);
  protected readonly hasRevealed = signal(false);

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
      character,
    }));
  });

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    try {
      if (!this.rooms.state() || this.rooms.state()?.code !== code.toUpperCase()) {
        await this.rooms.join(code);
      }
      this.draftClaim.set([...(this.rooms.state()?.yourSeatIds ?? [])]);
    } catch {
      await this.router.navigate(['/room']);
    }
  }

  ngOnDestroy(): void {
    /* keep socket for navigation within room; hub/home can disconnect */
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
    const setup: ImpostorSetup = {
      selectedCategories: [],
      selectedImpostors: 1,
      chaos: false,
      hintMode: 'hint',
      orderMode: 'list',
      discreet: false,
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
    if (!this.hasRevealed()) return;
    this.holding.set(false);
    this.hasRevealed.set(false);
    await this.rooms.action('nextReveal');
  }

  protected async goPlay(): Promise<void> {
    if (!this.hasRevealed()) return;
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

  protected leave(): void {
    this.rooms.disconnect();
    void this.router.navigate(['/room']);
  }
}
