import type { Citation } from "@/lib/db/schema";

export type { Citation };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export type SourceRef = {
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber: number | null;
  heading: string | null;
  paragraphIdx: number | null;
};

/** Server-sent events emitted by POST /api/chat. */
export type ChatStreamEvent =
  | { type: "sources"; sources: SourceRef[] }
  | { type: "token"; text: string }
  | { type: "done"; messageId: string; citations: Citation[] }
  | { type: "error"; message: string };

export type DocumentSummary = {
  id: string;
  filename: string;
  mimeType: string;
  blobUrl: string;
  pageCount: number | null;
  status: "pending" | "ready" | "failed";
  error: string | null;
};

/** Build a viewer URL that jumps to a page for PDFs. */
export function citationHref(blobUrl: string, citation: Citation): string {
  if (citation.pageNumber != null) {
    return `${blobUrl}#page=${citation.pageNumber}`;
  }
  return blobUrl;
}
