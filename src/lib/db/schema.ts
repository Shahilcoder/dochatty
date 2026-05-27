import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Gemini embeddings dimension. `gemini-embedding-001` supports MRL truncation
 * to 768/512/256 — we pin to 768 (sweet spot of quality / storage / speed).
 * Changing this means a schema migration AND re-embedding every chunk.
 */
export const EMBEDDING_DIMENSIONS = 768;

export type DocumentStatus = "pending" | "ready" | "failed";
export type MessageRole = "user" | "assistant";

export type Citation = {
  /** 1-based source number as it appears in the answer text, e.g. [3] → 3. */
  index: number;
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber?: number;
  heading?: string;
  paragraphIdx?: number;
  snippet: string;
};

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  blobUrl: text("blob_url").notNull(),
  byteSize: integer("byte_size").notNull(),
  pageCount: integer("page_count"),
  status: text("status").notNull().default("pending").$type<DocumentStatus>(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readyAt: timestamp("ready_at", { withTimezone: true }),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    pageNumber: integer("page_number"),
    heading: text("heading"),
    paragraphIdx: integer("paragraph_idx"),
    tokenCount: integer("token_count").notNull(),
  },
  (table) => [
    index("chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("chunks_document_id_idx").on(table.documentId),
  ],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("New conversation"),
  documentIds: uuid("document_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<MessageRole>(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<Citation[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
  ],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
