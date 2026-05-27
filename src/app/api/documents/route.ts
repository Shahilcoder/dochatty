import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt));
  return Response.json({ documents: rows });
}
