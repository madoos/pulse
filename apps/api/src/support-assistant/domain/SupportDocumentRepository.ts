import type { FoundDocument, SearchFilters } from './SupportDocument';

export type SupportDocumentRepository = {
  /**
   * The documents of one firm most similar to an embedding, the most similar first.
   * The firm is always part of the query: a search never sees another firm.
   */
  search: (
    firmId: number,
    query: SearchFilters & { embedding: number[] },
    limit: number,
  ) => Promise<FoundDocument[]>;
  /** The dates of the first and the last document of a firm, or null if it has none. */
  dateRange: (firmId: number) => Promise<{ from: string; to: string } | null>;
};
