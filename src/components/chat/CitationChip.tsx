"use client";

import { useState } from "react";
import type { Citation } from "@/lib/types";
import { SourcesPopover } from "./SourcesPopover";

/**
 * The trust feature (DESIGN.md signature component). Inline the citation reads
 * as a compact green-tinted pill with a green left accent and a mono numeral —
 * the one place the calm, Inter-only system earns typographic contrast. Click
 * to expand into the source card with the exact snippet and a link that opens
 * the document at that location.
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
      <span className="inline-flex items-center justify-center align-baseline mx-0.5 h-[18px] min-w-[18px] px-1 rounded-[5px] bg-surface-container-high text-on-surface-variant font-mono text-[11px] leading-none">
        {n}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Source ${n}: ${citation.filename}`}
        className="inline-flex items-center justify-center align-baseline mx-0.5 h-[18px] min-w-[18px] px-1 rounded-[5px] border-l-2 border-primary bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-mono text-[11px] leading-none transition-colors cursor-pointer"
      >
        {n}
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
