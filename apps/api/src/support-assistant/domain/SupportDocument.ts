/** A support document of an advisory firm: a chat, an internal note, a ticket or an email. */
export type SupportDocument = {
  /** As `SUP-0001`. */
  id: string;
  firmId: number;
  /** As `YYYY-MM-DD`. */
  date: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  text: string;
  tags: string[];
};

/** A document found by a search, with how similar it is to what was searched, from 0 to 1. */
export type FoundDocument = { document: SupportDocument; similarity: number };

/** What the agent can narrow a search with. Never the firm: the code fixes it. */
export type SearchFilters = {
  /** As `YYYY-MM-DD`, both included. */
  from?: string;
  to?: string;
  category?: string;
  status?: string;
};
