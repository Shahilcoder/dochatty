import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversations } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .limit(100);
  return Response.json({ conversations: rows });
}

type CreateRequest = { documentIds?: string[]; title?: string };

export async function POST(request: Request) {
  let body: CreateRequest = {};
  try {
    body = (await request.json()) as CreateRequest;
  } catch {
    // Allow empty bodies — create with defaults.
  }
  const documentIds = Array.isArray(body.documentIds) ? body.documentIds : [];
  const title = body.title?.trim() || "New conversation";

  const [row] = await db
    .insert(conversations)
    .values({ title, documentIds })
    .returning();
  return Response.json({ conversation: row });
}
