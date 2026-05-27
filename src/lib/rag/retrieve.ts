import { cosineDistance, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { chunks, documents } from "@/lib/db/schema";
import { embedBatch } from "@/lib/gemini";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  filename: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  paragraphIdx: number | null;
  similarity: number;
};

const DEFAULT_TOP_K = 8;

/**
 * Embed the user's query and return the top-K most-similar chunks among the
 * provided documents. Uses pgvector's cosine distance (`<=>`); similarity is
 * computed as 1 - distance for monotonic-with-relevance ordering.
 */
export async function retrieve(opts: {
  query: string;
  documentIds: string[];
  topK?: number;
}): Promise<RetrievedChunk[]> {
  if (opts.documentIds.length === 0) return [];

  const trimmed = opts.query.trim();
  if (!trimmed) return [];

  const [queryEmbedding] = await embedBatch([trimmed], "RETRIEVAL_QUERY");
  if (!queryEmbedding) return [];

  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, queryEmbedding)})`;

  return db
    .select({
      chunkId: chunks.id,
      documentId: chunks.documentId,
      filename: documents.filename,
      content: chunks.content,
      pageNumber: chunks.pageNumber,
      heading: chunks.heading,
      paragraphIdx: chunks.paragraphIdx,
      similarity,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.documentId, documents.id))
    .where(inArray(chunks.documentId, opts.documentIds))
    .orderBy(desc(similarity))
    .limit(opts.topK ?? DEFAULT_TOP_K);
}
