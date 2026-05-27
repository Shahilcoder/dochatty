import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { chunks, documents } from "@/lib/db/schema";
import { uploadFile } from "@/lib/blob";
import { parsePdf } from "@/lib/rag/parse-pdf";
import { parseDocx } from "@/lib/rag/parse-docx";
import { chunkPdf, chunkDocx, charsToTokens } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

export const runtime = "nodejs";
// Allow up to 60s for ingestion of larger PDFs (Vercel hobby cap on serverless).
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing 'file' field" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }
  if (file.type !== PDF_MIME && file.type !== DOCX_MIME) {
    return Response.json(
      { error: "Only PDF and DOCX files are supported" },
      { status: 415 },
    );
  }

  const blobUrl = await uploadFile(file);

  const [doc] = await db
    .insert(documents)
    .values({
      filename: file.name,
      mimeType: file.type,
      blobUrl,
      byteSize: file.size,
      status: "pending",
    })
    .returning();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    let inputs: ReturnType<typeof chunkPdf>;
    let pageCount: number | null = null;

    if (file.type === PDF_MIME) {
      const { pages, totalPages } = await parsePdf(new Uint8Array(buffer));
      pageCount = totalPages;
      inputs = chunkPdf(pages);
    } else {
      const segments = await parseDocx(buffer);
      inputs = chunkDocx(segments);
    }

    if (inputs.length === 0) {
      throw new Error("Document yielded no extractable text");
    }

    const embeddings = await embedTexts(
      inputs.map((c) => c.content),
      "RETRIEVAL_DOCUMENT",
    );

    await db.insert(chunks).values(
      inputs.map((c, i) => ({
        documentId: doc.id,
        ordinal: i,
        content: c.content,
        embedding: embeddings[i],
        pageNumber: c.pageNumber ?? null,
        heading: c.heading ?? null,
        paragraphIdx: c.paragraphIdx ?? null,
        tokenCount: charsToTokens(c.content.length),
      })),
    );

    await db
      .update(documents)
      .set({ status: "ready", readyAt: new Date(), pageCount })
      .where(eq(documents.id, doc.id));

    return Response.json({
      id: doc.id,
      filename: doc.filename,
      chunks: inputs.length,
      pageCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(documents)
      .set({ status: "failed", error: message })
      .where(eq(documents.id, doc.id));
    return Response.json(
      { error: `Ingestion failed: ${message}`, documentId: doc.id },
      { status: 500 },
    );
  }
}
