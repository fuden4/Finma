import fs from "node:fs/promises";
import path from "node:path";

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export async function saveImageFile(
  file: File,
  options: {
    directory: string;
    filenamePrefix: string;
  }
): Promise<string> {
  const extFromName = path.extname(file.name).toLowerCase();
  const ext = extFromName || IMAGE_MIME_EXT[file.type] || ".jpg";
  const dir = path.join(process.cwd(), "public", options.directory);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${options.filenamePrefix}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/${options.directory}/${filename}`;
}
