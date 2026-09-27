"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MessageSquarePlus,
  Trash2,
  FileText,
  FileType2,
  LogOut,
  Loader2,
  MessagesSquare,
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — Evernote-style navigation rail */}
      <aside className="md:w-72 shrink-0 md:h-screen md:sticky md:top-0 bg-surface border-b md:border-b-0 md:border-r border-outline flex flex-col">
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
          <BrandMark />
          <span className="text-title text-on-surface">Dochatty</span>
        </div>

        <div className="px-4 pb-4">
          <Button
            variant="primary"
            className="w-full"
            disabled={readyDocs.length === 0 || busyId === "new"}
            onClick={() => createConversation(readyDocs.map((d) => d.id))}
          >
            {busyId === "new" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="size-4" />
            )}
            New chat
          </Button>
        </div>

        <div className="px-5 pt-1 pb-2">
          <SectionLabel>Conversations</SectionLabel>
        </div>
        <nav className="flex-1 md:overflow-y-auto px-2 pb-2 space-y-0.5 max-h-64 md:max-h-none overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-body-sm text-on-surface-variant">
              Your chats will appear here.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/chat/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/chat/${c.id}`);
                }}
                className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left hover:bg-surface-container-high cursor-pointer transition-colors"
              >
                <MessagesSquare className="size-4 text-on-surface-variant shrink-0" />
                <span className="flex-1 truncate text-on-surface text-[14px]">
                  {c.title}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-on-surface-variant hover:text-error transition-all p-0.5 rounded"
                >
                  <Trash2 className="size-3.5" />
                </span>
              </div>
            ))
          )}
        </nav>

        <div className="px-4 py-4 border-t border-outline shrink-0">
          <Button variant="ghost" size="sm" className="w-full" onClick={logout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content — the white-canvas library */}
      <main className="flex-1 min-w-0 bg-background">
        <div className="max-w-[900px] mx-auto px-5 md:px-12 py-10 md:py-14 space-y-12">
          <header>
            <h1 className="text-headline-xl text-on-surface">Your library</h1>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-xl">
              Upload a paper, contract, or spec — then ask. Every answer cites
              its exact source.
            </p>
          </header>

          <section>
            <SectionLabel>Add a document</SectionLabel>
            <div className="mt-3">
              <UploadDropzone
                onUploaded={(doc) => {
                  startTransition(() => router.refresh());
                  createConversation([doc.id]);
                }}
              />
            </div>
          </section>

          <section>
            <SectionLabel>
              Documents{" "}
              <span className="text-on-surface-variant font-normal normal-case tracking-normal">
                ({documents.length})
              </span>
            </SectionLabel>
            <div className="mt-3">
              {documents.length === 0 ? (
                <EmptyHint>
                  No documents yet. Upload a PDF or Word file to get started.
                </EmptyHint>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
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
            </div>
          </section>
        </div>
      </main>

      {pending ? (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-surface border border-outline shadow-md rounded-md px-3 py-2 text-[12px] text-on-surface-variant">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          Refreshing
        </div>
      ) : null}
    </div>
  );
}

function BrandMark() {
  return (
    <span className="size-9 grid place-items-center bg-primary text-on-primary rounded-lg shadow-sm">
      <MessagesSquare className="size-5" />
    </span>
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
    <div className="flex flex-col gap-3 p-4 bg-surface border border-outline rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "size-9 grid place-items-center rounded-md shrink-0",
            isPdf
              ? "bg-primary-container text-primary"
              : "bg-tertiary-container text-tertiary",
          )}
        >
          {isPdf ? (
            <FileText className="size-5" />
          ) : (
            <FileType2 className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-on-surface text-[14px] font-medium truncate">
            {doc.filename}
          </div>
          <div className="text-[12px] text-on-surface-variant mt-0.5">
            {doc.pageCount ? `${doc.pageCount} pages · ` : ""}
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
          variant="secondary"
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
          className="size-9 grid place-items-center rounded-md border border-outline text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error-container transition-colors disabled:opacity-50"
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
  return <h2 className="text-label text-on-surface-variant">{children}</h2>;
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-10 text-center text-on-surface-variant text-[14px] border border-dashed border-outline rounded-lg bg-surface">
      {children}
    </div>
  );
}
