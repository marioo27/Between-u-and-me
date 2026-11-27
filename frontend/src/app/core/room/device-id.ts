const STORAGE_KEY = 'bum-device-id';

/** Stable per-tab id so room claims survive Socket.IO reconnects. */
export function getDeviceId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
  } catch {
    /* private mode */
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}
