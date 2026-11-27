import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Resolve `data/` next to dist/ or src/. */
export function dataFile(name: string): string {
  const candidates = [
    join(here, 'data', name),
    join(here, '..', 'data', name),
    join(process.cwd(), 'data', name),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  throw new Error(`Data file not found: ${name}`);
}
