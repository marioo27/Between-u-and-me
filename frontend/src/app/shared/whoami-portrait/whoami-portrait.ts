import { Component, computed, inject, input } from '@angular/core';
import { WhoamiPortraitService } from '../../core/whoami/whoami-portrait';

export type PortraitSize = 'lg' | 'md' | 'sm';

@Component({
  selector: 'app-whoami-portrait',
  styleUrl: './whoami-portrait.css',
  templateUrl: './whoami-portrait.html',
  host: {
    '[class.portrait-host--lg]': 'size() === "lg"',
    '[class.portrait-host--md]': 'size() === "md"',
    '[class.portrait-host--sm]': 'size() === "sm"',
  },
})
export class WhoamiPortrait {
  private readonly portraits = inject(WhoamiPortraitService);

  readonly name = input.required<string>();
  readonly wiki = input<string | undefined>('');
  readonly size = input<PortraitSize>('md');

  protected readonly src = computed(() => this.portraits.urlFor(this.wiki()));
  protected readonly failed = computed(() => {
    const key = (this.wiki() ?? '').trim();
    if (!key) return true;
    const map = this.portraits.urls();
    return key in map && !map[key];
  });
}
