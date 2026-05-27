import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db/client";
import { conversations, documents, messages } from "@/lib/db/schema";
import { ChatThread } from "@/components/chat/ChatThread";
import type { ChatMessage, DocumentSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conversation) notFound();

  const [msgRows, docRows] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt)),
    db.select().from(documents).orderBy(desc(documents.createdAt)),
  ]);

  const initialMessages: ChatMessage[] = msgRows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    citations: m.citations ?? undefined,
  }));

  const docs: DocumentSummary[] = docRows.map((d) => ({
    id: d.id,
    filename: d.filename,
    mimeType: d.mimeType,
    blobUrl: d.blobUrl,
    pageCount: d.pageCount,
    status: d.status,
    error: d.error,
  }));

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-outline-variant/50 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-[13.5px] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Library
        </Link>
        <div className="w-px h-5 bg-outline-variant/50" />
        <h1 className="text-pure-white text-[15px] font-semibold truncate">
          {conversation.title}
        </h1>
      </header>
      <div className="flex-1 min-h-0">
        <ChatThread
          conversationId={conversationId}
          initialMessages={initialMessages}
          initialDocumentIds={conversation.documentIds}
          documents={docs}
        />
      </div>
    </div>
  );
}
