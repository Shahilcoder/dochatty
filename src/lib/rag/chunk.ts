import type { DocxSegment } from "./parse-docx";

export type ChunkInput = {
  content: string;
  pageNumber?: number | null;
  heading?: string | null;
  paragraphIdx?: number | null;
};

/**
 * Rough token estimate. Gemini's tokenizer is closer to ~4 chars/token for
 * English; we don't need exactness — we use this only for chunk sizing and
 * the `token_count` column (stored for analytics, not billing).
 */
export const charsToTokens = (chars: number) => Math.ceil(chars / 4);

const TARGET_CHARS = 3200; // ~800 tokens
const OVERLAP_CHARS = 480; // ~120 tokens

export function chunkPdf(pages: string[]): ChunkInput[] {
  const out: ChunkInput[] = [];
  pages.forEach((rawPage, idx) => {
    const pageNumber = idx + 1;
    const page = rawPage.trim();
    if (!page) return;
    if (page.length <= TARGET_CHARS) {
      out.push({ content: page, pageNumber });
      return;
    }
    for (const part of splitWithOverlap(page)) {
      out.push({ content: part, pageNumber });
    }
  });
  return out;
}

export function chunkDocx(segments: DocxSegment[]): ChunkInput[] {
  const out: ChunkInput[] = [];
  let buffer: string[] = [];
  let bufferHeading: string | null = null;
  let bufferFirstIdx: number | null = null;
  let bufferLen = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const content = buffer.join("\n\n").trim();
    if (content) {
      out.push({
        content,
        heading: bufferHeading,
        paragraphIdx: bufferFirstIdx,
      });
    }
    buffer = [];
    bufferLen = 0;
    bufferFirstIdx = null;
  };

  for (const seg of segments) {
    // New heading boundary — flush so a chunk never spans two headings.
    if (buffer.length > 0 && seg.heading !== bufferHeading) {
      flush();
    }
    if (buffer.length === 0) {
      bufferHeading = seg.heading;
      bufferFirstIdx = seg.paragraphIdx;
    }
    // If this segment alone exceeds the chunk size, split it.
    if (seg.text.length > TARGET_CHARS) {
      flush();
      const parts = splitWithOverlap(seg.text);
      parts.forEach((part, i) => {
        out.push({
          content: part,
          heading: seg.heading,
          paragraphIdx: seg.paragraphIdx + (i === 0 ? 0 : 0),
        });
      });
      continue;
    }
    // Otherwise, append to the running buffer.
    buffer.push(seg.text);
    bufferLen += seg.text.length;
    if (bufferLen >= TARGET_CHARS) flush();
  }
  flush();
  return out;
}

/**
 * Split a long text into TARGET_CHARS chunks with OVERLAP_CHARS of trailing
 * context carried into the next chunk. Splits prefer sentence boundaries.
 */
function splitWithOverlap(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let buf = "";

  for (const s of sentences) {
    if (!s) continue;
    if (buf.length + s.length + 1 > TARGET_CHARS && buf.length > 0) {
      out.push(buf.trim());
      const overlap = buf.length > OVERLAP_CHARS ? buf.slice(-OVERLAP_CHARS) : buf;
      buf = overlap + " " + s;
    } else {
      buf += (buf ? " " : "") + s;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
