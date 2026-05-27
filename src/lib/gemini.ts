import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";

export type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

declare global {
  var __genai: GoogleGenAI | undefined;
}

const genai = global.__genai ?? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
if (process.env.NODE_ENV !== "production") global.__genai = genai;

/**
 * Embed an array of texts in a single batched request. Pinned to 768
 * dimensions to match the schema (see `EMBEDDING_DIMENSIONS`).
 */
export async function embedBatch(
  texts: string[],
  taskType: EmbedTask,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const result = await genai.models.embedContent({
    model: env.GEMINI_EMBED_MODEL,
    contents: texts,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });
  const embeddings = result.embeddings ?? [];
  return embeddings.map((e) => {
    if (!e.values) throw new Error("Gemini returned an embedding with no values");
    return e.values;
  });
}

export type ChatTurn = { role: "user" | "model"; text: string };

/**
 * Stream a chat completion. The caller receives an async iterator of token
 * strings; the final iterator value resolves to the complete text.
 */
export async function* streamChat(opts: {
  system: string;
  history: ChatTurn[];
  user: string;
}): AsyncGenerator<string, string, void> {
  const stream = await genai.models.generateContentStream({
    model: env.GEMINI_CHAT_MODEL,
    contents: [
      ...opts.history.map((t) => ({
        role: t.role,
        parts: [{ text: t.text }],
      })),
      { role: "user", parts: [{ text: opts.user }] },
    ],
    config: {
      systemInstruction: opts.system,
      temperature: 0.2,
    },
  });
  let full = "";
  for await (const chunk of stream) {
    const piece = chunk.text;
    if (piece) {
      full += piece;
      yield piece;
    }
  }
  return full;
}

/**
 * Non-streaming, single-shot call. Used for short tasks (auto-titling a
 * conversation).
 */
export async function generateOneShot(opts: {
  system?: string;
  user: string;
  maxOutputTokens?: number;
}): Promise<string> {
  const result = await genai.models.generateContent({
    model: env.GEMINI_CHAT_MODEL,
    contents: opts.user,
    config: {
      systemInstruction: opts.system,
      maxOutputTokens: opts.maxOutputTokens,
      temperature: 0.3,
    },
  });
  return result.text ?? "";
}
