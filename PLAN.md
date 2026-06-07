# Dochatty — RAG over your documents

## Context

Build a single-user, deployable RAG application on the existing Next.js 16 / React 19 / Tailwind v4 scaffold. The user uploads a research paper, contract, product spec, or textbook (PDF or DOCX) and asks questions against it. Every answer carries inline citations naming the source document and a precise location (page number for PDFs, nearest heading + paragraph index for DOCX). The citation chip is the trust feature — clicking it reveals the exact source chunk and links to the original file.

Why now: the repo is a fresh `create-next-app` boilerplate. We have a chance to lay down a clean, opinionated architecture that follows Next.js 16's *current* conventions (App Router, Server Actions for mutations, Route Handlers for streaming) — not the older patterns the model may have memorized. See `AGENTS.md` and the docs bundled under `node_modules/next/dist/docs/`.

## Decisions locked in

| Area | Choice |
|---|---|
| Deployment | Deployable to Vercel, single-user, password-gated |
| LLM + embeddings | Google Gemini (`@google/genai` SDK) |
| Vector store | Postgres + `pgvector` (host: Neon) |
| ORM | Drizzle ORM + `drizzle-kit` (native `vector` column type) |
| File storage | Vercel Blob (original PDFs/DOCX) |
| Streaming | Yes — token-by-token via Route Handler streaming response |
| Chat scope | User-toggleable: default single-doc, can multi-select |
| Chat history | Persisted in Postgres |
| Auth | Password (single env-var), enforced in middleware |
| Design | Per `DESIGN.md` — Cyber-Growth aesthetic, dark, neon accents |
| PDF citing | Document name + page number |
| DOCX citing | Document name + nearest heading + paragraph index |

## Stack additions (new dependencies)

- **AI / RAG**: `@google/genai`
- **Data**: `drizzle-orm`, `drizzle-kit`, `postgres` (driver), `pgvector` (for type helpers if needed)
- **Storage**: `@vercel/blob`
- **Parsing**: `unpdf` (PDF text + page extraction, Node-friendly fork of pdfjs-dist), `mammoth` (DOCX → HTML with structure preserved)
- **Validation**: `zod`
- **UI niceties**: `clsx` (or `tailwind-merge`), `lucide-react` for monoline icons (matches DESIGN.md "monoline or pixel-art")
- **Markdown rendering** for answers: `react-markdown` + `remark-gfm`

Fonts (via `next/font/google`): `Space Grotesk`, `Press Start 2P`, `Pixelify Sans`.

## Architecture

```
                                            ┌────────────────────────────┐
                Upload (PDF/DOCX)            │ Vercel Blob                │
        ┌───────────────────────────────────►│  (original files)          │
        │                                    └────────────────────────────┘
        │                                                ▲
   ┌────┴─────┐    chunks+metadata    ┌──────────┐       │ signed URL
   │ Browser  │──── /api/upload ─────►│ Ingestion│       │ for citation
   │  (UI)    │                       │ pipeline │       │ "open at page"
   └────▲─────┘                       └────┬─────┘       │
        │                                  │ embeddings   │
        │  /api/chat (SSE stream)          ▼              │
        │  ┌────────────────────┐    ┌──────────────────┐ │
        └─►│ Chat route handler │◄──►│ Postgres + pgvec │◄┘
           │  + Gemini stream   │    │  documents,      │
           └────────────────────┘    │  chunks(vector), │
                                     │  conversations,  │
                                     │  messages        │
                                     └──────────────────┘
```

Flow at query time:
1. Embed the user's question with `gemini-embedding-001`.
2. Cosine-similarity search top-K chunks (default K=8) in `pgvector`, scoped to the conversation's selected document IDs.
3. Build a prompt with chunks (numbered `[1]`, `[2]`, …) and instruct Gemini to cite numbered sources inline.
4. Stream the answer back via Server-Sent Events. Final stream chunk carries the structured citation list (doc id, page/heading, chunk id, snippet) so the UI can render rich citation chips.

## Data model (Drizzle schema → Postgres)

```
documents
  id            uuid pk
  filename      text
  mime_type     text                 -- 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  blob_url      text                 -- Vercel Blob public/signed URL
  byte_size     int
  page_count    int     nullable     -- pdf only
  status        text                 -- 'pending' | 'ready' | 'failed'
  error         text    nullable
  created_at    timestamptz
  ready_at      timestamptz nullable

chunks
  id            uuid pk
  document_id   uuid fk -> documents
  ordinal       int                  -- order within doc
  content       text                 -- the raw chunk text
  embedding     vector(768)          -- gemini-embedding-001 default dim (configurable down to 256/512/1536/3072)
  -- citation metadata: only one of these branches is filled, per mime type
  page_number   int     nullable     -- pdf
  heading       text    nullable     -- docx: nearest heading text
  paragraph_idx int     nullable     -- docx: paragraph ordinal in source
  token_count   int

  index: HNSW on embedding (vector_cosine_ops)
  index: btree on document_id

conversations
  id                   uuid pk
  title                text          -- auto-generated from first question
  document_ids         uuid[]        -- selected docs for retrieval
  created_at           timestamptz
  updated_at           timestamptz

messages
  id              uuid pk
  conversation_id uuid fk
  role            text               -- 'user' | 'assistant'
  content         text
  citations       jsonb   nullable   -- assistant only: [{chunk_id, document_id, page?, heading?, paragraph_idx?, snippet}, ...]
  created_at      timestamptz
```

Embedding dimension: pin to **768** (Gemini's MRL default). Cheaper to store, plenty accurate for this scale. Codify the choice in a single constant.

## File structure

```
src/
├── app/
│   ├── layout.tsx                 # root layout: fonts (Space Grotesk, Press Start 2P, Pixelify Sans), color tokens
│   ├── globals.css                # tailwind v4 + DESIGN.md tokens via @theme inline
│   ├── (auth)/
│   │   └── login/page.tsx         # password gate UI
│   ├── (app)/
│   │   ├── layout.tsx             # app shell (sidebar + main)
│   │   ├── page.tsx               # home: doc library + new conversation CTA
│   │   ├── documents/
│   │   │   └── [id]/page.tsx      # doc detail (metadata, delete, "new chat with this doc")
│   │   └── chat/
│   │       └── [conversationId]/page.tsx   # chat thread (server component shell + client island)
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts           # POST: verify password, set httpOnly cookie
│   │   ├── upload/
│   │   │   └── route.ts           # POST: receive file, save to Blob, kick off ingestion
│   │   ├── chat/
│   │   │   └── route.ts           # POST: streaming answer (SSE)
│   │   ├── conversations/
│   │   │   ├── route.ts           # GET list, POST create
│   │   │   └── [id]/route.ts      # GET, DELETE
│   │   └── documents/
│   │       ├── route.ts           # GET list
│   │       └── [id]/route.ts      # GET, DELETE (also deletes chunks + blob)
│   └── middleware.ts              # password-cookie gate; redirects to /login
│
├── components/
│   ├── ui/                        # primitives: Button, Card, Input, Dialog, Chip, Toast
│   ├── chat/
│   │   ├── ChatThread.tsx         # client: renders messages, handles SSE
│   │   ├── ChatComposer.tsx
│   │   ├── CitationChip.tsx       # the trust feature
│   │   └── SourcesPopover.tsx     # click chip → show snippet + "open page N"
│   ├── documents/
│   │   ├── UploadDropzone.tsx     # drag-drop, multi-file
│   │   ├── DocumentList.tsx
│   │   └── DocumentSelector.tsx   # toggle 1-doc vs multi-doc scope
│   └── shell/
│       ├── Sidebar.tsx            # conversations + docs nav
│       └── TopBar.tsx
│
├── lib/
│   ├── env.ts                     # zod-validated env
│   ├── db/
│   │   ├── client.ts              # postgres + drizzle instance
│   │   └── schema.ts              # tables above
│   ├── blob.ts                    # @vercel/blob wrappers
│   ├── auth.ts                    # password check, cookie helpers
│   ├── gemini.ts                  # @google/genai client, embed(), stream()
│   ├── rag/
│   │   ├── parse-pdf.ts           # unpdf → per-page text
│   │   ├── parse-docx.ts          # mammoth → structured HTML → paragraphs+headings
│   │   ├── chunk.ts               # ~800-token chunks w/ ~120-token overlap, sentence-aware
│   │   ├── embed.ts               # batched embedding calls
│   │   ├── retrieve.ts            # similarity query with doc-id scoping
│   │   └── prompt.ts              # build system + retrieval prompt
│   └── utils.ts
│
└── drizzle/                       # migrations
```

## Document ingestion pipeline

`POST /api/upload` (multipart):
1. Validate: max 25 MB, mime in {pdf, docx}.
2. Write file to Vercel Blob → `blob_url`.
3. Insert `documents` row with `status='pending'`.
4. Run ingestion **synchronously** in the request (single-user, infrequent uploads — no job queue needed):
   - PDF → `unpdf` per-page text. Build chunks per page; carry `page_number` on each.
   - DOCX → `mammoth.convertToHtml` → walk DOM. Track running paragraph index and "nearest preceding heading" as we go. Build chunks; each chunk carries `heading` and `paragraph_idx` of its first paragraph.
   - Chunker: ~800 tokens, ~120 overlap, never cross page/heading boundary if avoidable. Token count via a tiny heuristic (chars/4) is fine for budgeting — actual tokens reported by Gemini.
   - Embed chunks in batches of 64 with `gemini-embedding-001`, `outputDimensionality: 768`, `taskType: 'RETRIEVAL_DOCUMENT'`.
   - Insert chunks; update `documents.status='ready'`, `page_count`.
5. On error: `status='failed'`, persist error message, surface in UI.

Return the document id; UI redirects to `/chat/new?documentId=…`.

## Chat / retrieval flow

`POST /api/chat` body: `{ conversationId, message, documentIds[] }`.

1. Persist user message.
2. Embed the question with `taskType: 'RETRIEVAL_QUERY'`, dim 768.
3. SQL: `SELECT … FROM chunks WHERE document_id = ANY($1) ORDER BY embedding <=> $2 LIMIT 8`.
4. Build prompt:
   - **System**: "You are a precise document QA assistant. Only use the provided sources. Cite each fact with `[n]` markers matching the source numbers. If the answer is not in the sources, say so."
   - **Sources block**: for each retrieved chunk, prepend `[n] (doc: <filename>, <page or heading>): <chunk text>`.
   - **User**: the question.
   - **History**: last 6 turns from `messages`.
5. Stream with `genai.models.generateContentStream`. Pipe deltas as SSE `data: {type:'token', text}` events to the client.
6. After the stream completes:
   - Parse `[n]` markers from the full response, map to actual `chunk_id`s and metadata.
   - Emit final SSE `data: {type:'done', citations: [...]}`.
   - Persist assistant message + citations.
   - If the conversation lacks a title, auto-title it: send the question + first ~80 chars of the answer to Gemini Flash for a short title.

Client (`ChatThread.tsx`): reads the SSE stream, renders streaming markdown via `react-markdown` with a custom `[n]` → `<CitationChip n={n}/>` transform. Clicking a chip opens `SourcesPopover` showing the chunk snippet + an "Open document" link that points to the blob URL with `#page=N` for PDFs (works in Chrome/Edge/Firefox PDF viewers).

## Citation rendering details

- Inline chip: small pixel-bordered rectangle (per DESIGN.md "Pixel-Border" badge style), `text-[10px]` Pixelify Sans, e.g. `[1]`.
- Popover content: source filename, location (`p. 5` or `§ Section 4.2 ¶17`), 3-line snippet, "Open at this location" link, "Copy quote" button.
- The citation chip is the design centerpiece — make it obviously interactive (hover glow per DESIGN.md elevation rules).

## Auth gate

- `lib/auth.ts`: compares submitted password to `APP_PASSWORD` env var with `timingSafeEqual`; on success sets a signed httpOnly cookie (HMAC over a timestamp; secret in `AUTH_SECRET`).
- `src/app/middleware.ts`: if cookie missing/invalid and path is not `/login` or `/api/auth`, redirect to `/login`.
- `/api/auth` route handler: rate-limit (in-memory token bucket) to slow brute-force.

## Design system implementation

In `src/app/layout.tsx`:
- Load `Space_Grotesk`, `Press_Start_2P`, `Pixelify_Sans` from `next/font/google`, register as CSS variables `--font-grotesk`, `--font-pixel-display`, `--font-pixel`.
- Add `<html className="dark">` (force dark mode — Cyber-Growth is dark-first).

In `src/app/globals.css`:
- Replace the boilerplate `:root` block with the full DESIGN.md color tokens as CSS custom properties.
- Expose them to Tailwind via `@theme inline` so utilities like `bg-surface-container`, `text-on-surface`, `text-primary`, `border-outline-variant`, `text-neon-blue`, `bg-void-black` resolve.
- Add a `.font-display`, `.font-pixel`, `.font-pixel-display` class set wired to the font variables.
- Define an `--glow-primary` shadow var matching DESIGN.md "blur 15px, color primary" inner/outer glow for active cards.
- Background: `bg-void-black` body, with optional decorative scan-line SVG bleed behind the main column.

## Env vars

`lib/env.ts` (zod-validated):

```
DATABASE_URL              # postgres connection (Neon)
GEMINI_API_KEY            # https://aistudio.google.com/apikey
BLOB_READ_WRITE_TOKEN     # Vercel Blob (auto-injected by Vercel; manual for local dev)
APP_PASSWORD              # single-user gate
AUTH_SECRET               # HMAC key for cookie
GEMINI_CHAT_MODEL         # default 'gemini-2.5-flash'  (use 'gemini-2.5-pro' for higher quality)
GEMINI_EMBED_MODEL        # default 'gemini-embedding-001'
```

Write a `.env.example` documenting all of these.

## Build order

1. **Foundation** — fonts + colors + tokens; replace boilerplate `page.tsx`; build base UI primitives (Button, Card, Chip, Input).
2. **Auth gate** — login page, middleware, cookie helpers. Verify by trying every other route while logged out → redirect.
3. **DB + schema** — Drizzle config, schema, first migration. Verify with `pnpm drizzle-kit push` against Neon; manually `INSERT` a row.
4. **Document ingestion** — `/api/upload`, parsers, chunker, embedder. Verify by uploading a known PDF and inspecting `documents`/`chunks` rows; spot-check a chunk's `page_number`.
5. **Retrieval** — `lib/rag/retrieve.ts` + a temporary `/api/test-query` to issue a question and dump top-K chunks. Verify retrieval quality manually with 5 known Q/A pairs.
6. **Streaming chat** — `/api/chat` SSE + `ChatThread`. Verify tokens stream and citations appear.
7. **Conversations** — list, create, switch, delete. Persistence across reloads.
8. **Document scope toggle** — single vs multi-doc. Verify retrieval filters to selected doc(s).
9. **Polish** — empty states, error toasts, upload progress, delete confirmations, mobile breakpoint.

## Critical files to read before coding

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — streaming responses, request signatures
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` — Server Actions vs Route Handlers, FormData
- `node_modules/next/dist/docs/01-app/01-getting-started/forms.md` — upload form pattern
- `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-fonts.md`
- `AGENTS.md` (already loaded) — the deprecation/breaking-change warning
- `DESIGN.md` (already loaded) — visual language

## Verification (end-to-end)

After step 6 (streaming chat), test the full path with two real documents:
1. Upload a real PDF (e.g. a 20-page research paper). Confirm `documents.page_count` is right and chunks have sensible `page_number` values.
2. Upload a real DOCX (a contract). Confirm chunks carry the nearest heading and a paragraph index.
3. Start a chat with the PDF: ask a question whose answer is on a known page. Confirm:
   - Tokens stream visibly.
   - The answer contains `[1]` (and possibly `[2]`) markers.
   - Hovering/clicking a chip shows the snippet and a link that opens the PDF at the correct page.
4. Toggle the document selector to include both docs; ask a question that requires both. Confirm citations from both files appear.
5. Reload the page → conversation history is intact.
6. Log out, hit the chat URL directly → redirected to `/login`.

Type check + lint clean: `pnpm tsc --noEmit && pnpm lint`.

## Out of scope (don't build)

- Multi-user / orgs / sharing
- OCR for scanned PDFs (we expect text-extractable PDFs)
- Image/figure understanding
- Background job queue (synchronous ingestion is fine at this scale)
- Re-ranking model in front of vector search (vanilla cosine is enough to start; revisit if quality is bad)
- Hybrid BM25 + vector search (same — revisit only if needed)
