export const PLATFORM_TARGET_LUFS = -14.0;

export function formatSourceLufs(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} LUFS`;
}

export function formatVolumeAdjustmentDb(
  value: number,
  sourceLufs: number | null
): string {
  if (sourceLufs == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} dB`;
}
