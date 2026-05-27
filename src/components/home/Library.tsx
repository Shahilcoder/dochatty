"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MessageSquarePlus,
  Trash2,
  FileText,
  FileType2,
  Clock,
  LogOut,
  Loader2,
} from "lucide-react";
import type { DocumentSummary } from "@/lib/types";
import { UploadDropzone } from "@/components/documents/UploadDropzone";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn, formatBytes } from "@/lib/utils";

type ConversationSummary = {
  id: string;
  title: string;
  documentIds: string[];
  updatedAt: string;
};

export function Library({
  documents,
  conversations,
}: {
  documents: (DocumentSummary & { byteSize: number; createdAt: string })[];
  conversations: ConversationSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const readyDocs = documents.filter((d) => d.status === "ready");

  async function createConversation(documentIds: string[]) {
    setBusyId("new");
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentIds }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      conversation?: { id: string };
    };
    setBusyId(null);
    if (body.conversation?.id) {
      router.push(`/chat/${body.conversation.id}`);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document and all its chunks?")) return;
    setBusyId(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setBusyId(null);
    startTransition(() => router.refresh());
  }

  async function deleteConversation(id: string) {
    if (!confirm("Delete this conversation?")) return;
    setBusyId(id);
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setBusyId(null);
    startTransition(() => router.refresh());
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="scanlines absolute inset-0 opacity-40 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16 border-b border-outline-variant/50">
        <div className="flex items-center gap-3">
          <div className="size-9 grid place-items-center bg-neon-blue text-pure-white rounded-sm font-[var(--font-pixel-display)] text-[11px]">
            DC
          </div>
          <div className="text-display-pixel text-pure-white text-[13px]">
            DOCHATTY
          </div>
        </div>
        <div className="flex items-center gap-3">
          {readyDocs.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              glow
              disabled={busyId === "new"}
              onClick={() => createConversation(readyDocs.map((d) => d.id))}
            >
              {busyId === "new" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="size-4" />
              )}
              New chat
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-10 max-w-[1100px] mx-auto space-y-12">
        <section>
          <SectionLabel>Upload</SectionLabel>
          <UploadDropzone
            onUploaded={(doc) => {
              startTransition(() => router.refresh());
              createConversation([doc.id]);
            }}
          />
        </section>

        <section>
          <SectionLabel>
            Documents{" "}
            <span className="text-on-surface-variant">({documents.length})</span>
          </SectionLabel>
          {documents.length === 0 ? (
            <EmptyHint>
              No documents yet. Upload a PDF or Word file to get started.
            </EmptyHint>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  busy={busyId === d.id}
                  onAsk={() => createConversation([d.id])}
                  onDelete={() => deleteDocument(d.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel>
            Conversations{" "}
            <span className="text-on-surface-variant">
              ({conversations.length})
            </span>
          </SectionLabel>
          {conversations.length === 0 ? (
            <EmptyHint>Your chats will appear here.</EmptyHint>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/chat/${c.id}`)}
                  className="w-full group flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/50 hover:border-neon-blue/50 rounded-md text-left transition-colors"
                >
                  <MessageSquarePlus className="size-4 text-neon-blue shrink-0" />
                  <span className="flex-1 truncate text-on-surface text-[14.5px]">
                    {c.title}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-on-surface-variant font-[var(--font-pixel)] shrink-0">
                    <Clock className="size-3" />
                    {timeAgo(c.updatedAt)}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {pending ? (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-surface-container-high border border-outline-variant/60 rounded-md px-3 py-2 text-[12px] text-on-surface-variant">
          <Loader2 className="size-3.5 animate-spin text-neon-blue" />
          Refreshing
        </div>
      ) : null}
    </div>
  );
}

function DocCard({
  doc,
  busy,
  onAsk,
  onDelete,
}: {
  doc: DocumentSummary & { byteSize: number };
  busy: boolean;
  onAsk: () => void;
  onDelete: () => void;
}) {
  const isPdf = doc.mimeType === "application/pdf";
  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-container-low border border-outline-variant/50 rounded-lg">
      <div className="flex items-start gap-3">
        {isPdf ? (
          <FileText className="size-5 text-neon-blue shrink-0 mt-0.5" />
        ) : (
          <FileType2 className="size-5 text-warning-amber shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-pure-white text-[14px] font-medium truncate">
            {doc.filename}
          </div>
          <div className="text-[11px] text-on-surface-variant font-[var(--font-pixel)] mt-1">
            {doc.pageCount ? `${doc.pageCount}p · ` : ""}
            {formatBytes(doc.byteSize)}
          </div>
        </div>
        <StatusChip status={doc.status} />
      </div>

      {doc.status === "failed" && doc.error ? (
        <p className="text-error text-[12px] line-clamp-2">{doc.error}</p>
      ) : null}

      <div className="flex items-center gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={doc.status !== "ready" || busy}
          onClick={onAsk}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Ask
        </Button>
        <button
          onClick={onDelete}
          disabled={busy}
          aria-label="Delete document"
          className="size-9 grid place-items-center rounded-md border border-outline-variant/60 text-on-surface-variant hover:text-error hover:border-error/50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: DocumentSummary["status"] }) {
  if (status === "ready") return <Chip tone="live">Ready</Chip>;
  if (status === "failed") return <Chip tone="danger">Failed</Chip>;
  return <Chip tone="warning">Processing</Chip>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] uppercase tracking-[0.2em] text-on-surface-variant font-[var(--font-pixel)] mb-4">
      {children}
    </h2>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("px-4 py-8 text-center text-on-surface-variant text-[14px] border border-dashed border-outline-variant/50 rounded-lg")}>
      {children}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
