import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { deleteBlob } from "@/lib/blob";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  if (!doc) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort blob cleanup; chunks cascade-delete via FK.
  try {
    await deleteBlob(doc.blobUrl);
  } catch {
    /* blob may already be gone */
  }
  await db.delete(documents).where(eq(documents.id, id));
  return Response.json({ ok: true });
}
