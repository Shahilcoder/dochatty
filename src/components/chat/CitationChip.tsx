"use client";

import { useState } from "react";
import type { Citation } from "@/lib/types";
import { SourcesPopover } from "./SourcesPopover";

/**
 * The trust feature. Inline pixel-bordered [n] marker; click to reveal the
 * exact source snippet and a link that opens the document at that location.
 */
export function CitationChip({
  n,
  citation,
  blobUrl,
}: {
  n: number;
  citation?: Citation;
  blobUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  // Unresolved citation (number with no matching source) — render inert.
  if (!citation) {
    return (
      <span className="inline-flex items-center justify-center align-baseline border border-outline-variant text-on-surface-variant px-1 h-[16px] rounded-sm text-[10px] font-[var(--font-pixel)] mx-0.5 leading-none">
        [{n}]
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Source ${n}: ${citation.filename}`}
        className="inline-flex items-center justify-center align-baseline border border-neon-blue/60 text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/25 hover:shadow-glow-primary px-1 h-[16px] rounded-sm text-[10px] font-[var(--font-pixel)] mx-0.5 leading-none transition-all cursor-pointer"
      >
        [{n}]
      </button>
      {open ? (
        <SourcesPopover
          citation={citation}
          blobUrl={blobUrl}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </span>
  );
}
