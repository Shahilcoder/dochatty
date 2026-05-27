"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type {
  ChatMessage,
  ChatStreamEvent,
  Citation,
  DocumentSummary,
} from "@/lib/types";
import { MessageContent } from "./MessageContent";
import { ChatComposer } from "./ChatComposer";
import { DocumentSelector } from "@/components/documents/DocumentSelector";

type Props = {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialDocumentIds: string[];
  documents: DocumentSummary[];
};

export function ChatThread({
  conversationId,
  initialMessages,
  initialDocumentIds,
  documents,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamCitations, setStreamCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    initialDocumentIds.length > 0
      ? initialDocumentIds
      : documents.filter((d) => d.status === "ready").map((d) => d.id),
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const blobUrls = Object.fromEntries(documents.map((d) => [d.id, d.blobUrl]));

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamText, scrollToBottom]);

  const send = useCallback(
    async (text: string) => {
      if (streaming) return;
      setError(null);

      if (selectedDocs.length === 0) {
        setError("Select at least one document to ask about.");
        return;
      }

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);
      setStreamText("");
      setStreamCitations([]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: text,
            documentIds: selectedDocs,
          }),
        });

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        let finalCitations: Citation[] = [];
        let finalId = `a-${Date.now()}`;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const event = JSON.parse(line.slice(5).trim()) as ChatStreamEvent;
            if (event.type === "token") {
              acc += event.text;
              setStreamText(acc);
            } else if (event.type === "done") {
              finalCitations = event.citations;
              finalId = event.messageId;
              setStreamCitations(event.citations);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: finalId,
            role: "assistant",
            content: acc,
            citations: finalCitations,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setStreaming(false);
        setStreamText("");
        setStreamCitations([]);
      }
    },
    [conversationId, selectedDocs, streaming],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-outline-variant/50 px-4 py-3">
        <DocumentSelector
          documents={documents}
          selected={selectedDocs}
          onChange={setSelectedDocs}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !streaming ? (
            <EmptyChat />
          ) : null}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} blobUrls={blobUrls} />
          ))}

          {streaming ? (
            <div className="flex flex-col gap-1">
              <RoleLabel role="assistant" />
              {streamText ? (
                <div className="text-on-surface text-[15px] leading-relaxed">
                  <MessageContent
                    content={streamText}
                    citations={streamCitations}
                    blobUrls={blobUrls}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-on-surface-variant text-[14px]">
                  <Loader2 className="size-4 animate-spin text-neon-blue" />
                  Searching the document…
                </div>
              )}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-center gap-2 text-error text-[14px] border-l-2 border-error pl-3 py-1">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-outline-variant/50 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <ChatComposer onSend={send} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  blobUrls,
}: {
  message: ChatMessage;
  blobUrls: Record<string, string>;
}) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col gap-1 items-end">
        <RoleLabel role="user" />
        <div className="bg-surface-container-high border border-outline-variant/50 rounded-lg rounded-tr-sm px-4 py-2.5 text-pure-white text-[15px] max-w-[85%]">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <RoleLabel role="assistant" />
      <div className="text-on-surface text-[15px] leading-relaxed">
        <MessageContent
          content={message.content}
          citations={message.citations ?? []}
          blobUrls={blobUrls}
        />
      </div>
    </div>
  );
}

function RoleLabel({ role }: { role: "user" | "assistant" }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-[var(--font-pixel)]">
      {role === "user" ? "You" : "Dochatty"}
    </span>
  );
}

function EmptyChat() {
  return (
    <div className="text-center py-16">
      <div className="text-display-pixel text-on-surface-variant text-[12px] mb-3">
        ASK ANYTHING
      </div>
      <p className="text-on-surface-variant text-[15px] max-w-sm mx-auto">
        Ask a question about your document. Every answer cites its source.
      </p>
    </div>
  );
}
