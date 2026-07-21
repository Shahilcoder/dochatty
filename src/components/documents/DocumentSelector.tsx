"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Check } from "lucide-react";
import type { DocumentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Toggle which documents are in scope for the current chat. Default is single
 * document; the user can multi-select to query across several at once.
 */
export function DocumentSelector({
  documents,
  selected,
  onChange,
}: {
  documents: DocumentSummary[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ready = documents.filter((d) => d.status === "ready");

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  const label =
    selected.length === 0
      ? "No documents"
      : selected.length === 1
        ? (ready.find((d) => d.id === selected[0])?.filename ?? "1 document")
        : `${selected.length} documents`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 bg-surface border border-outline hover:border-primary/50 rounded-md px-3 h-9 text-[13.5px] text-on-surface shadow-sm transition-colors max-w-[320px]"
      >
        <FileText className="size-3.5 text-primary shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 text-on-surface-variant shrink-0" />
      </button>

      {open ? (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-[320px] max-h-[320px] overflow-y-auto bg-surface border border-outline rounded-lg shadow-lg p-1.5">
          {ready.length === 0 ? (
            <div className="px-3 py-4 text-[13px] text-on-surface-variant text-center">
              No ready documents yet.
            </div>
          ) : (
            ready.map((d) => {
              const isSel = selected.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggle(d.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-[13.5px] transition-colors",
                    isSel
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface hover:bg-surface-container-high",
                  )}
                >
                  <span
                    className={cn(
                      "size-4 grid place-items-center border rounded-sm shrink-0",
                      isSel
                        ? "bg-primary border-primary text-on-primary"
                        : "border-outline",
                    )}
                  >
                    {isSel ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate flex-1">{d.filename}</span>
                  {d.pageCount ? (
                    <span className="font-mono text-[11px] text-on-surface-variant shrink-0">
                      {d.pageCount}p
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
