"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@/lib/types";
import { CitationChip } from "./CitationChip";

const CITE_RE = /\[(\d+)\]/g;

/**
 * Renders an assistant answer as Markdown, replacing inline `[n]` markers
 * with interactive CitationChips. Markers are tokenized to a placeholder
 * that survives Markdown parsing, then swapped back inside each leaf element.
 */
export function MessageContent({
  content,
  citations,
  blobUrls,
}: {
  content: string;
  citations: Citation[];
  blobUrls: Record<string, string>;
}) {
  const byIndex = new Map(citations.map((c) => [c.index, c]));

  const transform = (children: React.ReactNode): React.ReactNode =>
    React.Children.map(children, (child) => {
      if (typeof child === "string") return splitCitations(child);
      if (React.isValidElement(child)) {
        const el = child as React.ReactElement<{ children?: React.ReactNode }>;
        if (el.props.children) {
          return React.cloneElement(el, {}, transform(el.props.children));
        }
      }
      return child;
    });

  const splitCitations = (text: string): React.ReactNode => {
    const out: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    CITE_RE.lastIndex = 0;
    let key = 0;
    while ((m = CITE_RE.exec(text)) !== null) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const n = Number(m[1]);
      const citation = byIndex.get(n);
      out.push(
        <CitationChip
          key={`c-${key++}-${n}`}
          n={n}
          citation={citation}
          blobUrl={citation ? blobUrls[citation.documentId] : undefined}
        />,
      );
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out.length === 1 ? out[0] : out;
  };

  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{transform(children)}</p>,
          li: ({ children }) => <li>{transform(children)}</li>,
          strong: ({ children }) => (
            <strong className="text-pure-white">{transform(children)}</strong>
          ),
          em: ({ children }) => <em>{transform(children)}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
