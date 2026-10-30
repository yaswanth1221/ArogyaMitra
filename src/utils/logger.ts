/** Thin wrapper so logging can be swapped or silenced in one place. */
export const logger = {
  warn(message: string, detail?: unknown): void {
    console.warn(`[pulseguard] ${message}`, detail ?? '');
  },
  error(message: string, detail?: unknown): void {
    console.error(`[pulseguard] ${message}`, detail ?? '');
  },
};
