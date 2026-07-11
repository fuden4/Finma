import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export async function writeUploadToFile(
  file: File,
  destinationPath: string
): Promise<void> {
  const source = Readable.fromWeb(
    file.stream() as Parameters<typeof Readable.fromWeb>[0]
  );
  await pipeline(source, createWriteStream(destinationPath));
}
