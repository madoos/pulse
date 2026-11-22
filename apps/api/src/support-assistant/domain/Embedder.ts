/** Turns text into an embedding, with the same model the ingestion used for the documents. */
export type Embedder = {
  /** The embedding of a question, to compare it with the documents. */
  embedQuery: (text: string) => Promise<number[]>;
};
