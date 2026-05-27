import { extractText } from "unpdf";

export type PdfParsed = {
  pages: string[];
  totalPages: number;
};

/**
 * Extract per-page text from a PDF buffer using `unpdf` (a Node-friendly
 * fork of pdfjs-dist). Per-page extraction is critical so we can attach
 * a `pageNumber` to each chunk for citation.
 */
export async function parsePdf(data: Uint8Array): Promise<PdfParsed> {
  const result = await extractText(data, { mergePages: false });
  const pages = Array.isArray(result.text) ? result.text : [result.text];
  return {
    pages: pages.map((p) => normalize(p)),
    totalPages: result.totalPages,
  };
}

function normalize(text: string): string {
  // pdfjs sometimes leaves dangling hyphens at line breaks for wrapped words,
  // plus a lot of \n inside paragraphs. Collapse safely.
  return text
    .replace(/-\n(\w)/g, "$1") // de-hyphenate line breaks
    .replace(/[ \t]+\n/g, "\n") // strip trailing whitespace on lines
    .replace(/\n{3,}/g, "\n\n") // collapse runaway newlines
    .replace(/[ \t]{2,}/g, " ") // collapse runs of spaces
    .trim();
}
