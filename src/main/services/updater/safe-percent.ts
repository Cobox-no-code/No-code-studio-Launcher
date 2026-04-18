/**
 * electron-updater's download-progress event is unpredictable — percent
 * may arrive as number, string, or embedded in an object. Normalise all
 * shapes to a clamped 0-100 number. Used in place of raw .toFixed() calls
 * which crash when given a non-number.
 */
export function safePercent(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "object" && val !== null && "percent" in val) {
    return safePercent((val as { percent: unknown }).percent);
  }
  const n = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}
