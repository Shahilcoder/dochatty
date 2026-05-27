import type { Citation } from "@/lib/db/schema";
import type { RetrievedChunk } from "./retrieve";

export const SYSTEM_PROMPT = `You are a precise document question-answering assistant.

Rules:
1. Answer ONLY using the numbered sources provided in the user message. Do not use outside knowledge.
2. Cite every fact with bracketed source numbers like [1] or [2][3]. Place the bracket immediately after the sentence or phrase it supports.
3. If the sources do not contain the answer, say so plainly and do not guess.
4. Quote tersely; favor direct phrasing from the sources.
5. Use Markdown for structure (lists, bold) when it aids clarity. Do not use Markdown headings.`;

/**
 * Build the user-side message that prepends numbered sources before the
 * question. Numbering is 1-based and matches the [n] citations the model is
 * instructed to emit.
 */
export function formatQuestionWithSources(
  question: string,
  sources: RetrievedChunk[],
): string {
  if (sources.length === 0) {
    return `Question: ${question}\n\nNo sources are available.`;
  }
  const lines: string[] = ["Sources:"];
  sources.forEach((s, i) => {
    const loc = locationLabel(s);
    lines.push("", `[${i + 1}] ${s.filename} — ${loc}`, s.content);
  });
  lines.push("", `Question: ${question}`);
  return lines.join("\n");
}

export function locationLabel(s: Pick<RetrievedChunk, "pageNumber" | "heading" | "paragraphIdx">): string {
  if (s.pageNumber != null) return `p. ${s.pageNumber}`;
  if (s.heading) {
    return s.paragraphIdx != null
      ? `§ ${s.heading} · ¶${s.paragraphIdx}`
      : `§ ${s.heading}`;
  }
  if (s.paragraphIdx != null) return `¶${s.paragraphIdx}`;
  return "—";
}

/**
 * Walk the model's final text, find all `[n]` markers, and build a Citation
 * list keyed off the retrieved sources. Numbers the model didn't actually
 * use are dropped, so the UI only renders chips that are reachable.
 */
export function extractCitations(
  answer: string,
  sources: RetrievedChunk[],
): Citation[] {
  const used = new Set<number>();
  const re = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    const n = Number(m[1]);
    if (n >= 1 && n <= sources.length) used.add(n);
  }
  return [...used]
    .sort((a, b) => a - b)
    .map((n) => {
      const s = sources[n - 1];
      return {
        index: n,
        chunkId: s.chunkId,
        documentId: s.documentId,
        filename: s.filename,
        pageNumber: s.pageNumber ?? undefined,
        heading: s.heading ?? undefined,
        paragraphIdx: s.paragraphIdx ?? undefined,
        snippet: truncate(s.content, 240),
      };
    });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
