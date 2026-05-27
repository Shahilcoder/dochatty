// Bootstraps the database for dochatty.
//
//   1. Enables the pgvector extension (must run before drizzle pushes the
//      schema — the `chunks.embedding` column uses the `vector` type).
//   2. Pushes the Drizzle schema (call `pnpm db:push` after this, or use the
//      combined `pnpm db:setup`).
//
// Run with: node scripts/setup-db.mjs

import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("× DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  console.log("→ Enabling pgvector extension…");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✓ pgvector ready.");
} catch (err) {
  console.error("× Failed to enable pgvector:", err.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
