import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  conversations,
  messages,
  type Citation,
  type MessageRole,
} from "@/lib/db/schema";
import { retrieve } from "@/lib/rag/retrieve";
import {
  SYSTEM_PROMPT,
  formatQuestionWithSources,
  extractCitations,
} from "@/lib/rag/prompt";
import { generateOneShot, streamChat, type ChatTurn } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRequest = {
  conversationId: string;
  message: string;
  documentIds: string[];
};

const HISTORY_TURNS = 6;

export async function POST(request: Request) {
  let body: Partial<ChatRequest>;
  try {
    body = (await request.json()) as Partial<ChatRequest>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim();
  const userMessage = body.message?.trim();
  const documentIds = Array.isArray(body.documentIds) ? body.documentIds : [];

  if (!conversationId) {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }
  if (!userMessage) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }
  if (documentIds.length === 0) {
    return Response.json(
      { error: "At least one document must be in scope" },
      { status: 400 },
    );
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Fetch recent turns BEFORE we insert the new user message.
  const recent = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(HISTORY_TURNS * 2);
  const history: ChatTurn[] = recent.map((m) => ({
    role: (m.role as MessageRole) === "assistant" ? "model" : "user",
    text: m.content,
  }));

  // Persist the user's message.
  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: userMessage,
  });

  // Retrieve grounded context.
  const sources = await retrieve({ query: userMessage, documentIds });
  const formatted = formatQuestionWithSources(userMessage, sources);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        // Send the source list up front so the client can render trust UI
        // even before the first token lands.
        send({
          type: "sources",
          sources: sources.map((s) => ({
            chunkId: s.chunkId,
            documentId: s.documentId,
            filename: s.filename,
            pageNumber: s.pageNumber,
            heading: s.heading,
            paragraphIdx: s.paragraphIdx,
          })),
        });

        let full = "";
        const iter = streamChat({
          system: SYSTEM_PROMPT,
          history,
          user: formatted,
        });
        for await (const piece of iter) {
          full += piece;
          send({ type: "token", text: piece });
        }

        const citations: Citation[] = extractCitations(full, sources);

        const [assistantRow] = await db
          .insert(messages)
          .values({
            conversationId,
            role: "assistant",
            content: full,
            citations,
          })
          .returning({ id: messages.id });

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        // Best-effort auto-title for fresh conversations.
        if (conversation.title === "New conversation") {
          try {
            const title = await generateOneShot({
              system: "Return a 3-6 word title for this conversation. No quotes.",
              user: `Q: ${userMessage}\nA (excerpt): ${full.slice(0, 200)}`,
              maxOutputTokens: 16,
            });
            const cleaned = title.replace(/^["'`]|["'`.]+$/g, "").trim();
            if (cleaned) {
              await db
                .update(conversations)
                .set({ title: cleaned.slice(0, 80) })
                .where(eq(conversations.id, conversationId));
            }
          } catch {
            /* non-fatal */
          }
        }

        send({
          type: "done",
          messageId: assistantRow.id,
          citations,
        });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
