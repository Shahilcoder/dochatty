import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Singleton postgres client. Reused across hot reloads in dev so we don't
 * leak connections.
 *
 * `prepare: false` is set for Neon / pgbouncer compatibility — prepared
 * statements break under transaction-mode pooling.
 */
declare global {
  var __pg: ReturnType<typeof postgres> | undefined;
}

const client =
  global.__pg ??
  postgres(env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
