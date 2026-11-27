/** Stable client id for claim restore across socket reconnects. */

const DEVICE_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function normalizeDeviceId(raw: unknown): string {
  const id = String(raw ?? '').trim();
  if (!DEVICE_RE.test(id)) {
    throw new Error('Invalid device id');
  }
  return id;
}
