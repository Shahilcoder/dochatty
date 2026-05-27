"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "error";

const ACCEPT = ".pdf,.docx";
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function UploadDropzone({
  onUploaded,
}: {
  onUploaded: (doc: { id: string; filename: string }) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.type !== PDF_MIME && file.type !== DOCX_MIME) {
      setStatus("error");
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setStatus("uploading");
    setError(null);
    setCurrentName(file.name);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        filename?: string;
        error?: string;
      };
      if (!res.ok || !body.id) {
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
      setStatus("idle");
      setCurrentName(null);
      onUploaded({ id: body.id, filename: body.filename ?? file.name });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  const busy = status === "uploading";

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={busy}
        className={cn(
          "w-full grid place-items-center text-center gap-3 px-6 py-10 rounded-lg border-2 border-dashed transition-all",
          dragging
            ? "border-neon-blue bg-neon-blue/10 shadow-glow-primary"
            : "border-outline-variant/70 hover:border-neon-blue/60 bg-surface-container-low/50",
          busy && "cursor-wait",
        )}
      >
        {busy ? (
          <>
            <Loader2 className="size-7 text-neon-blue animate-spin" />
            <div className="text-on-surface text-[15px]">
              Processing <span className="text-pure-white">{currentName}</span>…
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant font-[var(--font-pixel)]">
              parsing · embedding · indexing
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="size-7 text-neon-blue" />
            <div className="text-on-surface text-[15px]">
              <span className="text-pure-white font-semibold">
                Drop a document
              </span>{" "}
              or click to browse
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant font-[var(--font-pixel)]">
              PDF · DOCX · up to 25 MB
            </div>
          </>
        )}
      </button>

      {error ? (
        <div className="flex items-center gap-2 text-error text-[13.5px] mt-3 border-l-2 border-error pl-3 py-1">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
