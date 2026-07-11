import path from "node:path";

const IMAGES_ROOT = path.join(process.cwd(), "public", "images");

export function toUploadPublicUrl(
  directory: string,
  filename: string
): string {
  const relativeDir = directory.startsWith("images/")
    ? directory.slice("images/".length)
    : directory === "images"
      ? ""
      : directory;

  return relativeDir
    ? `/api/uploads/${relativeDir}/${filename}`
    : `/api/uploads/${filename}`;
}

export function resolveUploadedImagePath(segments: string[]): string | null {
  const relativePath = path.join(...segments);
  const normalized = path.normalize(relativePath);

  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }

  const filePath = path.join(IMAGES_ROOT, normalized);
  if (!filePath.startsWith(IMAGES_ROOT)) {
    return null;
  }

  return filePath;
}
