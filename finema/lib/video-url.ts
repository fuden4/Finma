import path from "node:path";

const VIDEOS_ROOT = path.join(process.cwd(), "public", "videos");

export function toVideoPublicUrl(relativePath: string): string {
  return `/videos/${relativePath.replace(/^\/+/, "")}`;
}

export function resolveVideoPath(segments: string[]): string | null {
  const relativePath = path.join(...segments);
  const normalized = path.normalize(relativePath);

  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }

  const filePath = path.join(VIDEOS_ROOT, normalized);
  if (!filePath.startsWith(VIDEOS_ROOT)) {
    return null;
  }

  return filePath;
}
