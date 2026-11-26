import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, Locale } from '../../core/i18n/i18n';

@Component({
  imports: [RouterLink],
  selector: 'app-site-menu',
  styleUrl: './site-menu.css',
  templateUrl: './site-menu.html',
})
export class SiteMenu {
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly locale = this.i18n.locale;
  protected readonly t = this.i18n.t;

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected chooseLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    if (!this.open()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!this.host.nativeElement.contains(target)) {
      this.close();
    }
  }
}
