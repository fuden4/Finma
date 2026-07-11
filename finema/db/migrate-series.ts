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

async function main(): Promise<void> {
  loadEnvLocal();
  const sql = readFileSync(
    resolve(__dirname, "migrations/005_series_episodes.sql"),
    "utf-8"
  );
  const pool = getPool();
  console.log("Running series migration...");
  await pool.query(sql);
  console.log("Series migration complete.");
  await closePool();
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
