import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { uniqueSlug } from "../lib/slug";
import { closePool, getPool } from "./pool";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function backfillSlugs(
  table: "movies" | "songs"
): Promise<void> {
  const pool = getPool();
  const taken = new Set<string>();
  const existing = await pool.query(
    `SELECT slug FROM ${table} WHERE slug IS NOT NULL`
  );
  for (const row of existing.rows) {
    taken.add(row.slug as string);
  }

  const rows = await pool.query(
    `SELECT id, title FROM ${table} WHERE slug IS NULL ORDER BY created_at`
  );

  for (const row of rows.rows) {
    const slug = uniqueSlug(row.title as string, taken);
    await pool.query(`UPDATE ${table} SET slug = $2 WHERE id = $1`, [
      row.id,
      slug,
    ]);
  }

  await pool.query(`ALTER TABLE ${table} ALTER COLUMN slug SET NOT NULL`);
}

async function main(): Promise<void> {
  loadEnvLocal();
  const sql = readFileSync(
    resolve(__dirname, "migrations/009_content_slugs.sql"),
    "utf-8"
  );
  const pool = getPool();
  console.log("Running content slugs migration...");
  await pool.query(sql);
  console.log("Backfilling movie slugs...");
  await backfillSlugs("movies");
  console.log("Backfilling song slugs...");
  await backfillSlugs("songs");
  console.log("Content slugs migration complete.");
  await closePool();
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
