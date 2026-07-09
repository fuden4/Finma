import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
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

function readSql(filename: string): string {
  return readFileSync(resolve(__dirname, filename), "utf-8");
}

async function runSql(label: string, sql: string): Promise<void> {
  const pool = getPool();
  console.log(`Running ${label}...`);
  await pool.query(sql);
  console.log(`${label} complete.`);
}

async function verify(): Promise<void> {
  const pool = getPool();
  const tables = ["users", "movies", "genres", "movie_genres", "movie_streams", "watch_progress", "movie_views", "movie_searches", "watch_events", "watchlist", "movie_ratings", "movie_comments", "comment_reports"];
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    console.log(`  ${table}: ${result.rows[0].count} rows`);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  const seedOnly = process.argv.includes("--seed-only");

  try {
    if (!seedOnly) {
      await runSql("schema", readSql("schema.sql"));
    } else {
      const pool = getPool();
      await pool.query(
        "TRUNCATE comment_reports, movie_comments, movie_ratings, watchlist, watch_events, movie_searches, movie_views, watch_progress, movie_streams, movie_genres, genres, movies, users CASCADE"
      );
    }
    await runSql("seed", readSql("seed.sql"));
    console.log("\nVerification:");
    await verify();
    console.log("\nDatabase migration successful.");
  } finally {
    await closePool();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
