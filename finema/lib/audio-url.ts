export function toAudioPublicUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, "");
  return `/api/audio/${normalized}`;
}
