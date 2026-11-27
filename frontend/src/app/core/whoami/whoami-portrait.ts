import { Injectable, signal } from '@angular/core';

export type WhoamiCharacter = {
  name: string;
  wiki?: string;
  tags?: string[];
};

type WikiSummary = {
  thumbnail?: { source?: string; width?: number; height?: number };
  originalimage?: { source?: string; width?: number; height?: number };
  type?: string;
};

const WIKI_HOSTS = ['en.wikipedia.org', 'es.wikipedia.org'] as const;

@Injectable({ providedIn: 'root' })
export class WhoamiPortraitService {
  private readonly cache = new Map<string, string | null>();
  private readonly inflight = new Map<string, Promise<string | null>>();

  /** Reactive map wiki → image URL (or empty string if missing). */
  readonly urls = signal<Record<string, string>>({});

  resolve(wiki: string | undefined | null): void {
    const key = (wiki ?? '').trim();
    if (!key || this.cache.has(key) || this.inflight.has(key)) return;

    const req = this.fetchBestThumb(key)
      .catch(() => null)
      .then((url) => {
        this.cache.set(key, url);
        this.inflight.delete(key);
        this.urls.update((map) => ({ ...map, [key]: url ?? '' }));
        return url;
      });

    this.inflight.set(key, req);
  }

  urlFor(wiki: string | undefined | null): string {
    const key = (wiki ?? '').trim();
    if (!key) return '';
    this.resolve(key);
    return this.urls()[key] ?? '';
  }

  private async fetchBestThumb(title: string): Promise<string | null> {
    for (const host of WIKI_HOSTS) {
      const url = await this.fetchSummaryThumb(host, title);
      if (url) return url;
    }
    return null;
  }

  private async fetchSummaryThumb(host: string, title: string): Promise<string | null> {
    const res = await fetch(
      `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as WikiSummary;
    if (data.type === 'disambiguation') return null;

    const original = data.originalimage?.source;
    const thumb = data.thumbnail?.source;
    // Prefer a larger derived thumb when Commons serves thumbnail URLs.
    const upgraded = this.upgradeThumbSize(thumb) ?? this.upgradeThumbSize(original);
    return upgraded ?? original ?? thumb ?? null;
  }

  /** Bump Wikipedia/Commons thumb width when the URL supports `/thumb/` sizing. */
  private upgradeThumbSize(url: string | undefined): string | null {
    if (!url) return null;
    // e.g. .../thumb/a/ab/File.jpg/220px-File.jpg → 640px
    const bumped = url.replace(/\/(\d{2,4})px-/i, '/640px-');
    return bumped !== url ? bumped : url;
  }
}
