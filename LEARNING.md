# Learning Dochatty — A Junior Developer's Guide

A walkthrough of how this app is built, in the order data actually flows through it.
Read top to bottom. Each lesson has: **what it does**, **the key code**, **why it's built
this way**, and (for the meaty ones) an **exercise**. Exercise answers are at the very bottom.

> The one-sentence summary: **Dochatty lets you upload a PDF/DOCX and ask questions about it.
> Every answer is grounded in the document and carries clickable citations back to the exact
> page or paragraph it came from.** That "grounded + cited" part is called **RAG**.

---

## Lesson 1 — The big picture & what RAG is

### What RAG is

An LLM like Gemini only knows what it was trained on. It has never seen *your* contract or
*your* research paper. **RAG = Retrieval-Augmented Generation**: instead of asking the model to
answer from memory, we first **retrieve** the most relevant snippets from your document, then
**augment** the prompt with them, and let the model **generate** an answer using only those
snippets. The payoff: answers are grounded in real text, and we can cite exactly where each
fact came from.

### The two flows

Everything in this codebase is one of two journeys:

```
UPLOAD (happens once per document):
  file → validate → save to Blob → parse text → split into chunks
       → turn each chunk into a vector (embedding) → store in Postgres

ASK (happens every question):
  question → turn into a vector → find the most similar chunks (vector search)
           → build a prompt with those chunks → stream answer from Gemini
           → pull the [n] citations out of the answer → show clickable chips
```

And wrapping both: a **password gate** (`proxy.ts`) that redirects you to `/login` unless you
have a valid signed cookie.

### The map (`src/`)

| Area | Files | Job |
|---|---|---|
| **Config/foundations** | `lib/env.ts`, `lib/gemini.ts`, `lib/db/client.ts` | env validation, Gemini SDK, DB connection |
| **Data model** | `lib/db/schema.ts` | the 4 tables (documents, chunks, conversations, messages) |
| **Ingestion** | `app/api/upload/route.ts`, `lib/rag/{parse-pdf,parse-docx,chunk,embed}.ts` | turn a file into stored vectors |
| **Retrieval + answer** | `lib/rag/{retrieve,prompt}.ts`, `lib/gemini.ts`, `app/api/chat/route.ts` | find chunks, build prompt, stream answer |
| **Frontend** | `components/chat/{ChatThread,MessageContent,CitationChip,SourcesPopover}.tsx` | render streaming answer + citations |
| **Auth** | `lib/auth.ts`, `proxy.ts` | password gate |

Keep the two-flow diagram in your head — every file below slots into it.

---

## Lesson 2 — Foundations (env, Gemini client, DB client)

Three small files that everything else imports. They share one pattern worth learning: **fail
fast, and reuse one instance.**

### `lib/env.ts` — validate environment variables at startup

```ts
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_CHAT_MODEL: z.string().default("gemini-2.5-flash"),
  // ...
  APP_PASSWORD: z.string().min(8, ...),
  AUTH_SECRET: z.string().min(32, ...),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) { throw new Error(`Invalid environment configuration:\n...`); }
export const env = parsed.data;
```

**Why:** instead of crashing deep inside a request with `undefined is not a string`, the app
refuses to start with a clear message listing exactly which env var is wrong. Anything that
needs a secret imports the typed `env` object — never raw `process.env`.

### `lib/gemini.ts` — one Gemini client, reused

```ts
const genai = global.__genai ?? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
if (process.env.NODE_ENV !== "production") global.__genai = genai;
```

**Why the `global.__genai` trick:** in dev, Next.js hot-reloads modules on every save. Without
this, you'd create a *new* client on every reload and slowly leak them. Stashing it on `global`
means "reuse the one you already made." (Same trick appears in `db/client.ts`.)

### `lib/db/client.ts` — one Postgres connection pool

```ts
const client = global.__pg ?? postgres(env.DATABASE_URL, {
  max: 5, idle_timeout: 20, prepare: false,
});
export const db = drizzle(client, { schema });
```

**Why `prepare: false`:** the DB is hosted on Neon, which pools connections through pgbouncer in
"transaction mode." Prepared statements break under that pooling, so they're turned off. `db` is
the Drizzle query builder everyone imports.

---

## Lesson 3 — The data model (`lib/db/schema.ts`)

This is the spine of the app. Four tables, defined with Drizzle ORM (TypeScript code that maps
to SQL tables).

### `documents` — one row per uploaded file

```ts
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  blobUrl: text("blob_url").notNull(),       // where the original file lives
  pageCount: integer("page_count"),          // nullable — PDFs only
  status: text("status").notNull().default("pending").$type<DocumentStatus>(),
  error: text("error"),                      // why ingestion failed, if it did
  // ...timestamps
});
```

`status` walks `pending → ready` (or `→ failed`). The UI uses it to show spinners / errors.

### `chunks` — the heart of RAG

```ts
export const chunks = pgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull()
    .references(() => documents.id, { onDelete: "cascade" }),  // delete doc → delete its chunks
  ordinal: integer("ordinal").notNull(),     // order within the document
  content: text("content").notNull(),        // the raw chunk text
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  // citation metadata — only ONE branch is filled per chunk:
  pageNumber: integer("page_number"),        // PDFs
  heading: text("heading"),                  // DOCX: nearest heading
  paragraphIdx: integer("paragraph_idx"),    // DOCX: paragraph number
  tokenCount: integer("token_count").notNull(),
}, (table) => [
  index("chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  index("chunks_document_id_idx").on(table.documentId),
]);
```

Three things to notice:
1. **`vector("embedding", { dimensions: 768 })`** — a special `pgvector` column type. Each chunk
   stores a 768-number array representing its *meaning*. `EMBEDDING_DIMENSIONS = 768` is a single
   constant so the schema, the embed calls, and storage all agree.
2. **The HNSW index with `vector_cosine_ops`** — this is what makes vector search *fast*.
   Without it, finding similar chunks would scan every row. HNSW is an approximate-nearest-
   neighbor index built for exactly this.
3. **The citation columns are mutually exclusive** — a PDF chunk fills `pageNumber`; a DOCX chunk
   fills `heading` + `paragraphIdx`. This is how a citation later knows "page 5" vs "§ Termination ¶17".

### `conversations` and `messages`

```ts
conversations: { id, title, documentIds: uuid[].array(), createdAt, updatedAt }
messages:      { id, conversationId, role: "user"|"assistant", content,
                 citations: jsonb<Citation[]>, createdAt }
```

- `conversations.documentIds` is a Postgres **array** column — which documents this chat can
  search over.
- `messages.citations` is **`jsonb`** — assistant messages stash their full citation list as JSON
  so reloading the page restores the clickable chips without re-running anything.

At the bottom, `$inferSelect` / `$inferInsert` generate TypeScript types *from* the tables, so
your queries are type-checked against the real schema.

**Exercise 3:** A user deletes a document that's referenced by 200 chunks and 3 conversations.
What happens to the chunks, and why? (Answer at bottom.)

---

## Lesson 4 — Ingestion entry point (`app/api/upload/route.ts`)

This is a Next.js **Route Handler** — a `POST` function that receives the uploaded file. It runs
the *entire* ingestion pipeline synchronously inside one request.

```ts
export const runtime = "nodejs";   // need Node APIs (Buffer) — not Edge
export const maxDuration = 60;     // allow 60s for big PDFs
```

### Step 1 — validate

```ts
const file = form.get("file");
if (!(file instanceof File)) return Response.json({ error: ... }, { status: 400 });
if (file.size > MAX_BYTES) return ... 413;             // 25 MB cap
if (file.type !== PDF_MIME && file.type !== DOCX_MIME) return ... 415;  // only PDF/DOCX
```

### Step 2 — save the original + create a `pending` row

```ts
const blobUrl = await uploadFile(file);                // → Vercel Blob
const [doc] = await db.insert(documents)
  .values({ filename: file.name, mimeType: file.type, blobUrl, byteSize: file.size, status: "pending" })
  .returning();
```

We save the file *before* parsing so the citation links have something to point at.

### Step 3 — the pipeline, wrapped in try/catch

```ts
try {
  const buffer = Buffer.from(await file.arrayBuffer());
  let inputs; let pageCount = null;

  if (file.type === PDF_MIME) {
    const { pages, totalPages } = await parsePdf(new Uint8Array(buffer));
    pageCount = totalPages;
    inputs = chunkPdf(pages);          // parse → chunk
  } else {
    const segments = await parseDocx(buffer);
    inputs = chunkDocx(segments);
  }
  if (inputs.length === 0) throw new Error("Document yielded no extractable text");

  const embeddings = await embedTexts(inputs.map((c) => c.content), "RETRIEVAL_DOCUMENT");

  await db.insert(chunks).values(inputs.map((c, i) => ({
    documentId: doc.id, ordinal: i, content: c.content, embedding: embeddings[i],
    pageNumber: c.pageNumber ?? null, heading: c.heading ?? null,
    paragraphIdx: c.paragraphIdx ?? null, tokenCount: charsToTokens(c.content.length),
  })));

  await db.update(documents).set({ status: "ready", readyAt: new Date(), pageCount })
    .where(eq(documents.id, doc.id));
  return Response.json({ id: doc.id, ... });
} catch (err) {
  await db.update(documents).set({ status: "failed", error: message }).where(...);
  return Response.json({ error: ... }, { status: 500 });
}
```

**Why synchronous (no job queue):** the PLAN says this is single-user with infrequent uploads.
A background worker would be over-engineering. The `pending → ready/failed` status + the
try/catch *is* the job-status system. Note the embeddings line up by index: `embeddings[i]`
belongs to `inputs[i]` because `embedTexts` preserves order (Lesson 7).

---

## Lesson 5 — Parsing (`parse-pdf.ts`, `parse-docx.ts`)

Goal: turn a binary file into text **plus the location metadata** needed for citations.

### PDF — per page (`unpdf`)

```ts
const result = await extractText(data, { mergePages: false });   // keep pages separate!
const pages = Array.isArray(result.text) ? result.text : [result.text];
return { pages: pages.map(normalize), totalPages: result.totalPages };
```

`mergePages: false` is the whole point — we get an **array of page strings**, so a chunk built
from `pages[4]` knows it's page 5. `normalize()` cleans up PDF text quirks (de-hyphenates words
split across line breaks, collapses runaway newlines/spaces).

### DOCX — segments with headings (`mammoth` + `htmlparser2`)

DOCX has no pages. So we cite by **heading + paragraph index** instead. Mammoth converts the
DOCX to clean semantic HTML (`<h1>`, `<p>`, `<li>`), and we walk that HTML with a streaming
parser:

```ts
const { value: html } = await mammoth.convertToHtml({ buffer });
let currentHeading = null; let paragraphIdx = 0;
const parser = new Parser({
  onopentag(name) { /* entering <h1-6> → heading mode; <p>/<li> → para mode */ },
  ontext(text)    { /* accumulate text into the right buffer */ },
  onclosetag(name) {
    if (/^h[1-6]$/.test(name)) {
      currentHeading = heading || currentHeading;     // remember nearest heading
      segments.push({ text: heading, heading: currentHeading, paragraphIdx: paragraphIdx++ });
    } else if (name === "p" || name === "li") {
      segments.push({ text, heading: currentHeading, paragraphIdx: paragraphIdx++ });
    }
  },
});
```

**The key idea — "nearest preceding heading":** as we stream through the document, we keep a
running `currentHeading`. Every paragraph that follows gets tagged with it. So a paragraph under
"§ Termination" carries `heading: "Termination"`. The heading text is *also* pushed as its own
segment because a heading often answers a question by itself.

Both parsers feed the chunker (Lesson 6). PDF gives `string[]` (pages); DOCX gives
`DocxSegment[]` (paragraphs with heading + index).

---

## Lesson 6 — Chunking (`lib/rag/chunk.ts`)

Why chunk at all? Two reasons: (1) embeddings work best on focused passages, not whole documents;
(2) vector search returns *chunks*, so chunk size = citation granularity. Too big = vague
citations; too small = lost context.

```ts
const TARGET_CHARS = 3200;   // ~800 tokens
const OVERLAP_CHARS = 480;   // ~120 tokens
export const charsToTokens = (chars) => Math.ceil(chars / 4);  // rough estimate, good enough
```

### `chunkPdf` — one citation unit = a page

```ts
pages.forEach((rawPage, idx) => {
  const pageNumber = idx + 1;
  if (page.length <= TARGET_CHARS) { out.push({ content: page, pageNumber }); return; }
  for (const part of splitWithOverlap(page)) out.push({ content: part, pageNumber });
});
```

Small page → one chunk. Big page → split, but *every* piece keeps the same `pageNumber`.

### `chunkDocx` — accumulate, but never cross a heading

```ts
for (const seg of segments) {
  if (buffer.length > 0 && seg.heading !== bufferHeading) flush();  // heading changed → cut here
  if (buffer.length === 0) { bufferHeading = seg.heading; bufferFirstIdx = seg.paragraphIdx; }
  if (seg.text.length > TARGET_CHARS) { flush(); /* split this giant paragraph */ continue; }
  buffer.push(seg.text);
  if (bufferLen >= TARGET_CHARS) flush();   // reached target → emit a chunk
}
flush();
```

It packs paragraphs into a buffer until it hits `TARGET_CHARS`, then **flushes** (emits a chunk).
The critical rule: **if the heading changes, flush first** — so a chunk never mixes two sections.
Each emitted chunk is tagged with the heading + the paragraph index of its *first* paragraph.

### `splitWithOverlap` — sentence-aware splitting with carry-over

```ts
const sentences = text.split(/(?<=[.!?])\s+/);   // split on sentence boundaries
for (const s of sentences) {
  if (buf.length + s.length + 1 > TARGET_CHARS && buf.length > 0) {
    out.push(buf.trim());
    const overlap = buf.slice(-OVERLAP_CHARS);    // carry the tail into the next chunk
    buf = overlap + " " + s;
  } else { buf += " " + s; }
}
```

**Why overlap:** if an answer straddles a chunk boundary, the overlap means the next chunk still
has the lead-in context — so retrieval doesn't slice a fact in half.

**Exercise 6:** Why does the chunker prefer splitting on sentence boundaries (`.!?`) instead of
just cutting at exactly 3200 characters? (Answer at bottom.)

---

## Lesson 7 — Embedding (`lib/rag/embed.ts` + `embedBatch` in `gemini.ts`)

An **embedding** is a list of numbers (here, 768 of them) that captures the *meaning* of a piece
of text. Similar meanings → similar vectors. This is what makes "search by meaning" possible.

### `embedTexts` — batch through Gemini, preserve order

```ts
const BATCH_SIZE = 64;
export async function embedTexts(texts, taskType) {
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    out.push(...await embedBatch(batch, taskType));   // append in order
  }
  return out;
}
```

Gemini won't embed thousands of chunks in one call, so we slice into batches of 64. `out.push(...)`
keeps everything in the original order — that's the invariant the upload route relies on
(`embeddings[i]` ↔ `inputs[i]`).

### `embedBatch` — the actual API call

```ts
const result = await genai.models.embedContent({
  model: env.GEMINI_EMBED_MODEL,
  contents: texts,
  config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },  // pin to 768
});
```

**The crucial detail — `taskType`:** embeddings are asymmetric. When we embed *document chunks*
we use `"RETRIEVAL_DOCUMENT"`; when we embed a *user's question* we use `"RETRIEVAL_QUERY"`.
Telling Gemini which side of the search each text is on makes the matching noticeably better.
`outputDimensionality: 768` must match the `vector(768)` column or inserts would fail.

---

## Lesson 8 — Retrieval (`lib/rag/retrieve.ts`)

Now the ASK flow begins. Given a question and a set of document IDs, find the most relevant chunks.

```ts
const [queryEmbedding] = await embedBatch([trimmed], "RETRIEVAL_QUERY");   // embed the question
if (!queryEmbedding) return [];

const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, queryEmbedding)})`;

return db.select({ chunkId: chunks.id, documentId: chunks.documentId,
                   filename: documents.filename, content: chunks.content,
                   pageNumber: chunks.pageNumber, heading: chunks.heading,
                   paragraphIdx: chunks.paragraphIdx, similarity })
  .from(chunks)
  .innerJoin(documents, eq(chunks.documentId, documents.id))   // to get the filename
  .where(inArray(chunks.documentId, opts.documentIds))         // SCOPE to selected docs
  .orderBy(desc(similarity))                                   // most similar first
  .limit(opts.topK ?? DEFAULT_TOP_K);                          // top 8
```

Walk through it:
1. **Embed the question** with `RETRIEVAL_QUERY` (the matching half of Lesson 7).
2. **`cosineDistance(...)`** generates pgvector's `<=>` operator. Distance 0 = identical meaning.
   We flip it to `similarity = 1 - distance` so bigger = more relevant.
3. **`inArray(chunks.documentId, documentIds)`** — only search the documents this conversation
   selected. This is the "single-doc vs multi-doc scope" feature in one line.
4. **`orderBy(desc(similarity)).limit(8)`** — return the 8 best chunks. This uses the HNSW index
   from Lesson 3, so it stays fast even with many chunks.

The result is `RetrievedChunk[]` — text + the citation metadata, ready for the prompt.

**Exercise 8:** Where does the `taskType` asymmetry from Lesson 7 show up here, and what would
break if this file used `"RETRIEVAL_DOCUMENT"` for the question by mistake? (Answer at bottom.)

---

## Lesson 9 — Prompt & citations (`lib/rag/prompt.ts`)

Two halves: build the prompt that *asks* for citations, then parse the citations back *out* of
the answer.

### The system prompt — rules of the game

```ts
export const SYSTEM_PROMPT = `You are a precise document question-answering assistant.
1. Answer ONLY using the numbered sources provided. Do not use outside knowledge.
2. Cite every fact with bracketed source numbers like [1] or [2][3]...
3. If the sources do not contain the answer, say so plainly and do not guess.
...`;
```

This is what forces grounded, cited answers. Rule 3 is what prevents hallucination.

### `formatQuestionWithSources` — number the chunks

```ts
const lines = ["Sources:"];
sources.forEach((s, i) => {
  lines.push("", `[${i + 1}] ${s.filename} — ${locationLabel(s)}`, s.content);
});
lines.push("", `Question: ${question}`);
```

Produces a message like:
```
Sources:
[1] contract.pdf — p. 5
<chunk text...>
[2] contract.pdf — § Termination · ¶17
<chunk text...>

Question: What is the notice period?
```

The model sees numbered sources and is told to cite with those same numbers. `locationLabel`
renders `p. 5` for PDFs, `§ Heading · ¶17` for DOCX.

### `extractCitations` — turn `[n]` markers into real citation objects

```ts
const re = /\[(\d+)\]/g; const used = new Set();
while ((m = re.exec(answer)) !== null) {
  const n = Number(m[1]);
  if (n >= 1 && n <= sources.length) used.add(n);   // ignore out-of-range numbers
}
return [...used].sort().map((n) => {
  const s = sources[n - 1];                          // [1] → sources[0]
  return { index: n, chunkId: s.chunkId, documentId: s.documentId,
           filename: s.filename, pageNumber: s.pageNumber ?? undefined,
           heading: ..., paragraphIdx: ..., snippet: truncate(s.content, 240) };
});
```

After the model answers, we scan it for `[n]` markers, map each number back to the real chunk it
referred to, and build a `Citation` (with a 240-char snippet for the popover). The guard
`n <= sources.length` quietly drops any number the model invented. This is the bridge between
"text the model wrote" and "clickable chip the user sees."

---

## Lesson 10 — The chat route (the heart) (`app/api/chat/route.ts`)

Everything converges here. This `POST` handler orchestrates retrieval + streaming + persistence.

### Setup: validate, load conversation, load history

```ts
const { conversationId, message, documentIds } = body;   // (validated)
const [conversation] = await db.select().from(conversations).where(eq(...)).limit(1);

// Load recent history BEFORE inserting the new message:
const recent = await db.select({ role: messages.role, content: messages.content })
  .from(messages).where(eq(messages.conversationId, conversationId))
  .orderBy(asc(messages.createdAt)).limit(HISTORY_TURNS * 2);   // last 6 turns
const history = recent.map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.content }));

await db.insert(messages).values({ conversationId, role: "user", content: userMessage });
```

Note the ordering: fetch history *first*, then insert the new user message, so the question
isn't duplicated into its own context. Gemini calls the assistant role `"model"`, so we translate.

### Retrieve + build prompt

```ts
const sources = await retrieve({ query: userMessage, documentIds });    // Lesson 8
const formatted = formatQuestionWithSources(userMessage, sources);      // Lesson 9
```

### Stream over Server-Sent Events (SSE)

```ts
const stream = new ReadableStream({
  async start(controller) {
    const send = (obj) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

    send({ type: "sources", sources: sources.map(...) });   // 1. send sources up front

    let full = "";
    for await (const piece of streamChat({ system: SYSTEM_PROMPT, history, user: formatted })) {
      full += piece;
      send({ type: "token", text: piece });                 // 2. stream each token
    }

    const citations = extractCitations(full, sources);      // 3. parse [n] markers

    const [assistantRow] = await db.insert(messages)
      .values({ conversationId, role: "assistant", content: full, citations })
      .returning({ id: messages.id });                      // 4. persist the answer
    await db.update(conversations).set({ updatedAt: new Date() }).where(...);

    if (conversation.title === "New conversation") { /* 5. best-effort auto-title via generateOneShot */ }

    send({ type: "done", messageId: assistantRow.id, citations });  // 6. final event
    controller.close();
  },
});
return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", ... } });
```

The SSE protocol is dead simple: each event is the text `data: <json>\n\n`. The four event
types (`sources`, `token`, `done`, `error`) are declared once in `lib/types.ts` as
`ChatStreamEvent`, so server and client agree on the shape. **Sources are sent first** so the UI
can show "Searching the document…" trust context before any tokens arrive. Auto-titling is in its
own `try/catch` and labeled "best-effort" — if it fails, the chat still works.

**Exercise 10:** Why is `extractCitations` called *after* the streaming loop finishes, instead of
on each `piece` as it arrives? (Answer at bottom.)

---

## Lesson 11 — Frontend streaming (`ChatThread.tsx` + citation UI)

The client side of the SSE protocol. `ChatThread` is a Client Component (`"use client"`) holding
the live chat state.

### Optimistic UI + the read loop

```ts
setMessages((prev) => [...prev, userMsg]);   // show the user's message immediately
setStreaming(true);
const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ conversationId, message, documentIds }) });

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = ""; let acc = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const parts = buffer.split("\n\n");      // SSE events are separated by blank lines
  buffer = parts.pop() ?? "";              // keep the last (possibly partial) piece
  for (const part of parts) {
    if (!part.trim().startsWith("data:")) continue;
    const event = JSON.parse(part.trim().slice(5));
    if (event.type === "token") { acc += event.text; setStreamText(acc); }   // grow the bubble
    else if (event.type === "done") { finalCitations = event.citations; finalId = event.messageId; }
    else if (event.type === "error") throw new Error(event.message);
  }
}
setMessages((prev) => [...prev, { id: finalId, role: "assistant", content: acc, citations: finalCitations }]);
```

The subtle bit: network chunks don't line up with SSE events. So we accumulate into `buffer`,
split on `\n\n`, and **`buffer = parts.pop()`** keeps any trailing half-event for the next read.
Tokens append to `acc` and update `streamText`, which re-renders the growing answer live.

### Rendering citations — `MessageContent` → `CitationChip` → `SourcesPopover`

- **`MessageContent`** renders the answer as Markdown (`react-markdown`), then walks the rendered
  children and replaces every `[n]` string with a `<CitationChip n={n} citation={...} />`. It
  matches each number to a citation via `byIndex.get(n)`.
- **`CitationChip`** is the trust feature: a pixel-bordered `[n]` button. If there's no matching
  citation it renders inert; otherwise clicking it toggles the popover.
- **`SourcesPopover`** shows the filename, location (`Page 5` / `Heading · ¶17`), the snippet, a
  "Copy quote" button, and an **"Open at this location"** link built by `citationHref` —
  `${blobUrl}#page=${pageNumber}` so the browser's PDF viewer jumps to the right page. It closes
  on outside-click or Escape.

This closes the loop the whole app exists for: a fact in the answer → a chip → the exact source.

---

## Lesson 12 — The auth gate (`lib/auth.ts` + `proxy.ts`)

Single-user password protection, done without a database or session store — just a signed cookie.

### `lib/auth.ts` — sign and verify with HMAC

```ts
// cookie value format:  "<issuedAt>.<hex(hmacSha256(issuedAt, AUTH_SECRET))>"
export async function signSession(secret, issuedAt = Date.now()) {
  const sig = await hmacHex(String(issuedAt), secret);
  return `${issuedAt}.${sig}`;
}
export async function verifySession(token, secret) {
  // split into payload + sig, reject if expired (30 days), re-derive HMAC, constant-time compare
  if (Date.now() - issuedAt > SESSION_TTL_SECONDS * 1000) return false;
  const expected = await hmacHex(payload, secret);
  return constantTimeEqual(sig, expected);
}
```

The cookie is a timestamp plus an HMAC signature of that timestamp. A user can't forge one without
`AUTH_SECRET`. Verification re-computes the signature and checks it matches — and that it's < 30
days old. Two security details:
- **`constantTimeEqual`** compares strings without short-circuiting on the first mismatch, so an
  attacker can't time their guesses. `passwordMatches` does the same for the password.
- Everything uses **Web Crypto** (`crypto.subtle`), not Node's `crypto`, so it runs in the **Edge
  runtime** where the proxy lives.

### `proxy.ts` — the gate (Next.js 16's renamed middleware)

```ts
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth")) return NextResponse.next();  // allow

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret.length > 0 && await verifySession(token, secret)) return NextResponse.next();    // valid → through

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);   // remember where they wanted to go
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/((?!_next/static|...).*)"] };   // skip static assets
```

This runs **before every matched request**. No valid cookie → redirect to `/login`, preserving
the intended URL in `?next=`. The `matcher` regex exempts static assets and the login/auth paths.

> ⚠️ Note from `AGENTS.md`: this is Next.js 16, where middleware was renamed to **`proxy`**. That's
> why the file is `src/proxy.ts` exporting `proxy`, not `middleware.ts`.

---

## Lesson 13 — Supporting CRUD & the full recap

### The supporting routes (skim these — they're standard CRUD)

- `app/api/auth/route.ts` — `POST` checks the password (`passwordMatches`), and on success sets
  the signed cookie (`signSession`). Has in-memory rate limiting to slow brute-force.
- `app/api/conversations/route.ts` — `GET` list, `POST` create a conversation.
- `app/api/conversations/[id]/route.ts` — `GET` one (with messages), `DELETE`.
- `app/api/documents/route.ts` — `GET` list of documents.
- `app/api/documents/[id]/route.ts` — `GET` one, `DELETE` (cascades to chunks via the FK from
  Lesson 3, and deletes the Blob file).

These are the "plumbing" — once you understand the four ingredients above (schema, ingestion,
retrieval, chat), these are just thin reads/writes over the same tables.

### The full journey, end to end (narrate this yourself for the final check)

```
1. You log in → POST /api/auth checks password → sets signed cookie.
2. proxy.ts lets you through because the cookie verifies.
3. You upload contract.pdf → POST /api/upload:
   validate → Blob → insert documents(status:pending) → parsePdf → chunkPdf
   → embedTexts(RETRIEVAL_DOCUMENT) → insert chunks(with vectors) → status:ready.
4. You open a chat and ask "What is the notice period?" → ChatThread POSTs to /api/chat.
5. /api/chat: save user msg → retrieve() embeds the question (RETRIEVAL_QUERY),
   vector-searches the selected docs, returns top-8 chunks.
6. formatQuestionWithSources numbers them; streamChat sends them to Gemini with SYSTEM_PROMPT.
7. Tokens stream back over SSE; ChatThread grows the answer bubble live.
8. Stream ends → extractCitations maps [n] → real chunks → persist assistant msg + citations
   → send "done".
9. MessageContent renders the answer, swapping [n] for CitationChips.
10. You click [1] → SourcesPopover shows the snippet + "Open at this location" → contract.pdf#page=5.
```

If you can say that out loud without looking, you understand Dochatty.

### Deliberately out of scope (per `PLAN.md`)

Multi-user/orgs, OCR for scanned PDFs, image understanding, a background job queue, a re-ranking
model, and hybrid BM25+vector search were all intentionally left out to keep the first version
focused. Knowing what was *omitted* — and why — is part of understanding the design.

---

## Exercise answers

**3 — Deleting a document:** The 200 chunks are deleted automatically, because the `chunks` table
declares `documentId ... references(() => documents.id, { onDelete: "cascade" })`. The database
itself removes child rows when the parent document is deleted — no extra code needed. (The
conversations aren't deleted; they just have a `documentId` in their array that no longer resolves
— the retrieval `inArray` filter simply finds no chunks for it.)

**6 — Sentence-boundary splitting:** Cutting at exactly 3200 chars could slice a sentence — even a
word — in half. That hurts two things: the embedding of a half-sentence captures muddier meaning
(worse retrieval), and a citation snippet that starts mid-sentence reads badly to the user.
Splitting on `.!?` keeps chunks semantically whole.

**8 — taskType asymmetry:** `retrieve.ts` calls `embedBatch([trimmed], "RETRIEVAL_QUERY")` — the
question is embedded as a *query*, while chunks were embedded as *documents* (Lesson 7). Gemini
optimizes the two differently so a question vector lands near the document vectors that answer it.
If you embedded the question as `"RETRIEVAL_DOCUMENT"`, the vectors would be subtly mismatched and
retrieval quality would drop — answers would get noticeably worse even though nothing crashes.

**10 — Why extract citations after the loop:** `[n]` markers can span network/token boundaries —
the `[`, the `1`, and the `]` might arrive in three separate `piece`s. You can only reliably regex
`[n]` once you have the *complete* text. Plus the citation list is computed once and sent in the
single `done` event, then persisted — there's no need to recompute it per token.
