import { Component, OnDestroy, OnInit, inject, output, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n';

const STORAGE_KEY = 'bum-splash-seen';
const SHOW_MS = 2800;

@Component({
  selector: 'app-brand-splash',
  styleUrl: './brand-splash.css',
  templateUrl: './brand-splash.html',
})
export class BrandSplash implements OnInit, OnDestroy {
  protected readonly t = inject(I18nService).t;
  readonly closed = output<void>();
  protected readonly visible = signal(false);
  protected readonly fading = signal(false);
  protected readonly useStatic = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        this.closed.emit();
        return;
      }
    } catch {
      /* private mode */
    }

    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.useStatic.set(true);
    }

    this.visible.set(true);
    this.timer = setTimeout(() => this.dismiss(), SHOW_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  protected skip(): void {
    this.dismiss();
  }

  private dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.visible() || this.fading()) return;
    this.fading.set(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      this.visible.set(false);
      this.closed.emit();
    }, 420);
  }
}
