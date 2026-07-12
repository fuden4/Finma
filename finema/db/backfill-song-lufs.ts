import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { closePool, getPool } from "./pool";
import { measureSourceLoudness } from "@/lib/ffmpeg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_ROOT = resolve(process.cwd(), "public", "audio");

function loadEnvLocal(): void {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const contents = readFileSync(envPath, "utf-8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional if DATABASE_URL is already set
  }
}

function resolveAudioFilePath(audioUrl: string): string | null {
  const relativePath = audioUrl.replace(/^\/api\/audio\//, "");
  const filePath = resolve(AUDIO_ROOT, relativePath);
  if (!filePath.startsWith(AUDIO_ROOT)) {
    return null;
  }
  return filePath;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    title: string;
    audio_url: string;
  }>(
    `SELECT id, title, audio_url
     FROM songs
     WHERE source_lufs IS NULL
     ORDER BY created_at ASC`
  );

  console.log(`Found ${result.rows.length} song(s) without source_lufs.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of result.rows) {
    const filePath = resolveAudioFilePath(row.audio_url);
    if (!filePath || !existsSync(filePath)) {
      console.warn(`SKIP  ${row.title} (${row.id}): file not found at ${filePath ?? "invalid path"}`);
      skipped += 1;
      continue;
    }

    try {
      const loudness = await measureSourceLoudness(filePath);
      await pool.query(`UPDATE songs SET source_lufs = $1 WHERE id = $2`, [
        loudness.input_i,
        row.id,
      ]);
      console.log(
        `OK    ${row.title}: source_lufs=${loudness.input_i.toFixed(2)}`
      );
      updated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL  ${row.title} (${row.id}): ${message}`);
      failed += 1;
    }
  }

  console.log(
    `Backfill complete. updated=${updated}, skipped=${skipped}, failed=${failed}`
  );
  await closePool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
