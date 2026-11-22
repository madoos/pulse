# ADR-0023: Support assistant per advisory firm, with vector search and an agent

- **Status:** Proposed
- **Date:** 2026-11-22
- **Category:** Architecture

## Context

Besides metrics, the network has an operational record of each advisory firm: chats, internal notes, tickets and emails about onboarding, payments, income tax, VAT, certificates and payroll. Today, knowing the recurring problems of a firm means asking whoever remembers them. The users want to ask questions about one firm from its detail page, such as "what recurring incidents does it have?" or "what do we know about how it works with VAT?", and get an answer together with the documents that back it.

The requirements that matter most are not the quality of the prose:

- **Isolation.** A question about firm A must never use a document of firm B.
- **Traceability.** Every answer cites its sources (id, type and date), and they can be checked.
- **Honesty.** Without enough information, the answer says so instead of making something up.
- **Growth.** Today there are 330 documents, between 4 and 9 per firm and about 290 characters each. Documents only accumulate, and more types of source will come.

The data arrives sanitized from the ingestion layer ([ADR-0013](0013-business-data-arrives-sanitized-from-ingestion.md)) and is loaded as a versioned seed ([ADR-0012](0012-versioned-seeds-applied-with-migrations.md)). PostgreSQL already has the `vector` extension ([ADR-0005](0005-use-postgresql.md)). The deployment is a single VPS with 2 cores and 3.8 GB of memory, about 2 GB of it free ([ADR-0008](0008-infrastructure-docker-compose-and-k3s.md)).

## Decision

### The embeddings of the documents come from the ingestion

- Each document arrives with its **embedding** already computed: one vector per document, from its title and its text. They are short, so they are not split into chunks.
- **Computing those embeddings belongs to the ingestion layer**, like sanitizing the data ([ADR-0013](0013-business-data-arrives-sanitized-from-ingestion.md)). The application does not compute them.
- The application simulates that ingestion as it does with the firms and their metrics: a script reads the source file, computes the embeddings and writes a data file that a versioned seed loads.
- The model is **`multilingual-e5-small`** (384 dimensions, quantized): multilingual, because the documents are in Spanish, and small enough for the VPS.

### The question is embedded by the application, with the same model

- Comparing a question with the documents needs both in the same vector space, so the API embeds the question **with the same model** as the ingestion, using transformers.js inside the API process.
- On Linux x64 it takes about **50 ms** per question. Loading the model takes a few seconds and is done once, when the API starts. The process grows to about 480 MB, so the memory limit of the API goes from 256 MiB to **768 MiB**, which fits in the free memory of the VPS.
- The model ships **inside the image** of the API, downloaded when the image is built, so the API never needs the network to load it. ONNX Runtime needs glibc, so the image of the API moves from Alpine to **Debian slim**.

### A table of support documents

- `support_documents` keeps only what is useful to search and to cite: the id of the document, the firm it belongs to, its date, type, category, priority, status, title, text, tags, its embedding and a **hash of its content**.
- The hash tells the ingestion whether a document changed and its embedding has to be recomputed. A deleted document disappears from the table, so it can no longer be found or cited.

### Top-k vector search, always within one firm

- The search returns the **10 most similar documents** (top-k), never every document of the firm. The cost of a question stays the same whether a firm has 9 documents or 10,000.
- It accepts optional filters: **a date range**, a category and a status. Embeddings do not understand dates, so questions like "the last months" are narrowed with dates.
- **The firm is fixed by the code, never by the model.** It comes from the route, and the search tool carries it inside: the model can choose what to search for, but not in which firm. Every query filters by the firm in SQL before ordering by similarity.
- A document is only used if its **similarity is above a threshold**. If no document passes it, the API answers that there is not enough information **without calling the model**: deterministic, testable and free.

### An agent with a search tool

- The answer comes from an **agent** built with the OpenRouter agent library. It has a single tool, `search_support_documents`, which runs the vector search above.
- The agent can **search again** when what it found is not enough, with other words, another category or other dates. The loop is bounded by a **maximum number of steps**.
- The model is **`openrouter/free`**: free models, enough for this test. When their quota runs out, the API reports it as such and the interface says so clearly. The model is a setting, so changing to a paid one is a matter of configuration. Without an API key, the assistant reports itself as unavailable and the rest of the application works as usual.
- The agent receives the documents of a first search with the question, so a simple question needs a single model call. It cites each document by its id in brackets, as `[SUP-0001]`.

### Sources checked by the code

- The API **only keeps the sources that the searches of that firm actually returned**. A citation of a made-up id, or of one of another firm, is removed from the answer and never reaches the user.
- The type, date and title of each source are read from the database, not taken from the text of the model.

### Everything is recorded, in the same database

- A separate `assistant` schema in the same PostgreSQL records each **conversation** (firm and user), each **message** (the question, its text **and its embedding**, the answer, the sources, whether there was enough information, the model and the tokens) and each **step** of the agent (every search with its input and the documents it returned with their similarity, and the reasoning when the model exposes it).
- With that record any answer can be rebuilt: what was asked, what was searched, what was found and what was answered.
- Keeping the embedding of each question allows **optimizing later**: reusing searches for repeated questions, evaluating the quality of the retrieval or comparing models, without recomputing anything.

## Out of scope

- **Computing the embeddings of the documents:** it belongs to the ingestion layer.
- **Reranking:** with 4 to 9 documents per firm, the top 10 already holds almost everything. With thousands of documents per firm, a reranker over the top-k would be the next step.
- **An approximate vector index (HNSW):** the search filters by firm first, and a firm has few documents. It is needed when a single firm has thousands.
- **Acceptance tests:** the model is external, free and not deterministic, so a scenario that goes through it would fail at random. The rules that matter (isolation, threshold, sources, steps) are covered by unit and integration tests with a fake agent.

## Alternatives considered

- **Sending every document of the firm to the model:** simpler and fine for 9 documents, but the cost of each question grows with the documents, and they only accumulate.
- **Full-text search only:** no model to embed the question, but it misses questions that use other words than the documents ("problemas con Hacienda" against "requerimiento de la AEAT").
- **Searching the whole network and filtering by firm afterwards:** a single mistake in that filter would leak documents of another firm. The filter goes in the query, before anything else.
- **Letting the model choose the firm as a tool parameter:** a wrong or manipulated prompt could ask for another firm.
- **A separate database for the record:** more isolation, but one more service to run, migrate and back up. A separate schema keeps it apart and can move later.
- **A paid model:** better answers and steadier quotas, at a cost that this test does not need. It is one setting away.

## Consequences

### Positive

- A question about a firm can only use the documents of that firm, by construction.
- Every answer can be checked: its sources exist, belong to the firm and are shown as the database has them.
- The cost per question is bounded by the top-k and the steps, not by how many documents the firm has.
- Questions without support are answered honestly and without spending a model call.
- The record of questions, searches and answers is the base for evaluating and improving the assistant.

### Negative

- Two new dependencies: the OpenRouter API, external and with a free quota that can run out, and an embedding model that makes the image of the API larger (about 150 MB) and its memory higher (about 480 MB).
- The image of the API leaves Alpine for Debian slim, which is larger and brings more packages to keep patched.
- ONNX Runtime has no build for macOS on Intel, so on such a machine the assistant only works inside Docker.
- The ingestion and the API must use the same embedding model. Changing it means recomputing every embedding.
- Free models may log what they receive. With real data, the model should be a paid one with a data policy that fits.
