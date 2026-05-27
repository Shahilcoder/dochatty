import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Match Next.js precedence: .env.local wins over .env
loadEnv({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
