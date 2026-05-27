import mammoth from "mammoth";
import { Parser } from "htmlparser2";

export type DocxSegment = {
  text: string;
  heading: string | null;
  paragraphIdx: number;
};

/**
 * Parse a DOCX buffer into ordered (paragraph) segments, each tagged with
 * its nearest preceding heading. DOCX has no inherent pages, so we cite by
 * heading + paragraph index instead.
 *
 * mammoth converts to clean semantic HTML (`<h1..6>`, `<p>`, `<li>`); we
 * walk that with htmlparser2 to build the segment list.
 */
export async function parseDocx(buffer: Buffer): Promise<DocxSegment[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer });

  const segments: DocxSegment[] = [];
  let currentHeading: string | null = null;
  let headingBuf: string[] = [];
  let paraBuf: string[] = [];
  let mode: "heading" | "para" | null = null;
  let paragraphIdx = 0;

  const parser = new Parser({
    onopentag(name) {
      if (/^h[1-6]$/.test(name)) {
        mode = "heading";
        headingBuf = [];
      } else if (name === "p" || name === "li") {
        mode = "para";
        paraBuf = [];
      }
    },
    ontext(text) {
      if (mode === "heading") headingBuf.push(text);
      else if (mode === "para") paraBuf.push(text);
    },
    onclosetag(name) {
      if (/^h[1-6]$/.test(name)) {
        const heading = headingBuf.join("").replace(/\s+/g, " ").trim();
        currentHeading = heading || currentHeading;
        mode = null;
        // Push the heading itself as its own segment (often answers the
        // question on its own — e.g. "Termination").
        if (heading) {
          segments.push({
            text: heading,
            heading: currentHeading,
            paragraphIdx: paragraphIdx++,
          });
        }
      } else if (name === "p" || name === "li") {
        const text = paraBuf.join("").replace(/\s+/g, " ").trim();
        mode = null;
        if (text) {
          segments.push({
            text,
            heading: currentHeading,
            paragraphIdx: paragraphIdx++,
          });
        }
      }
    },
  });

  parser.write(html);
  parser.end();

  return segments;
}
