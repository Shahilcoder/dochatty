import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversations, documents } from "@/lib/db/schema";
import { Library } from "@/components/home/Library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [docRows, convRows] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(50),
  ]);

  return (
    <Library
      documents={docRows.map((d) => ({
        id: d.id,
        filename: d.filename,
        mimeType: d.mimeType,
        blobUrl: d.blobUrl,
        pageCount: d.pageCount,
        status: d.status,
        error: d.error,
        byteSize: d.byteSize,
        createdAt: d.createdAt.toISOString(),
      }))}
      conversations={convRows.map((c) => ({
        id: c.id,
        title: c.title,
        documentIds: c.documentIds,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
