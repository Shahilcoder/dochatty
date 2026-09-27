"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Copy, Check, FileText } from "lucide-react";
import type { Citation } from "@/lib/types";
import { citationHref } from "@/lib/types";
import { cn } from "@/lib/utils";

function locationLabel(c: Citation): string {
  if (c.pageNumber != null) return `p. ${c.pageNumber}`;
  if (c.heading) {
    return c.paragraphIdx != null
      ? `${c.heading} · ¶${c.paragraphIdx}`
      : c.heading;
  }
  if (c.paragraphIdx != null) return `¶${c.paragraphIdx}`;
  return "Source";
}

export function SourcesPopover({
  citation,
  blobUrl,
  onClose,
}: {
  citation: Citation;
  blobUrl?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function copyQuote() {
    await navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      ref={ref}
      role="dialog"
      className={cn(
        "absolute z-50 left-0 top-[calc(100%+8px)] w-[320px]",
        "bg-surface border border-outline rounded-lg shadow-lg",
        "p-4 text-left",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <FileText className="size-4 text-primary shrink-0" />
        <span className="text-on-surface text-[13.5px] font-semibold truncate">
          {citation.filename}
        </span>
      </div>
      <div className="font-mono text-[11px] text-on-primary-container bg-primary-container inline-flex rounded px-1.5 py-0.5 mb-3">
        {locationLabel(citation)}
      </div>
      <p className="text-on-surface-variant text-[13.5px] leading-relaxed border-l-2 border-primary/40 pl-3 mb-3.5 max-h-[140px] overflow-y-auto">
        {citation.snippet}
      </p>
      <div className="flex items-center gap-3 border-t border-outline-variant pt-3">
        {blobUrl ? (
          <a
            href={citationHref(blobUrl, citation)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-tertiary hover:underline underline-offset-2"
          >
            <ExternalLink className="size-3.5" />
            Open at this location
          </a>
        ) : null}
        <button
          onClick={copyQuote}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-primary" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy quote
            </>
          )}
        </button>
      </div>
    </div>
  );
}
