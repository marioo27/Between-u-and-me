import { Component, inject, signal } from '@angular/core';
import { I18nService, Locale } from '../../core/i18n/i18n';

@Component({
  selector: 'app-language-bubble',
  styleUrl: './language-bubble.css',
  templateUrl: './language-bubble.html',
})
export class LanguageBubble {
  private readonly i18n = inject(I18nService);

  protected readonly open = signal(false);
  protected readonly locale = this.i18n.locale;
  protected readonly t = this.i18n.t;

  protected toggleMenu(): void {
    this.open.update((value) => !value);
  }

  protected closeMenu(): void {
    this.open.set(false);
  }

  protected choose(locale: Locale): void {
    this.i18n.setLocale(locale);
    this.open.set(false);
  }
}
