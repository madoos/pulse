import type { FoundDocument } from './SupportDocument';

/** How many documents a search returns at most, however many the firm has. */
export const TOP_K = 10;

/**
 * Below this similarity a document is not about the question. Calibrated with the documents of
 * the seed and the model of the ingestion: questions about a firm score from 0.79 to 0.86 with
 * its documents, and unrelated ones from 0.70 to 0.80. The threshold stops the clearly unrelated
 * ones ("¿quién ganó el mundial?") without calling the model; for the few in between, the agent
 * is told to say that there is not enough information.
 */
export const SIMILARITY_THRESHOLD = 0.78;

/** How many times the agent can search before it has to answer. */
export const MAX_SEARCHES = 4;

/** How many previous turns of the conversation the agent sees. */
export const HISTORY_TURNS = 6;

/** The documents similar enough to be about the question. */
export const relevantOf = (found: FoundDocument[], threshold = SIMILARITY_THRESHOLD) =>
  found.filter((f) => f.similarity >= threshold);

const CITATION = /SUP-\d+/g;

/** Models often write the id with another dash ("SUP‑0001", "SUP–0001"): it is the same id. */
const LOOSE_CITATION = /SUP[\u2010-\u2015\u2212]\s?(\d+)/g;

export const normalizeCitations = (text: string) => text.replace(LOOSE_CITATION, 'SUP-$1');

/**
 * The sources of an answer: the documents it cites that a search of this firm returned,
 * in the order they are first cited. A made-up id, or one of another firm, is dropped.
 */
export const sourcesOf = (text: string, retrieved: Map<string, FoundDocument>) => {
  const cited = [...new Set(text.match(CITATION) ?? [])];
  return cited.flatMap((id) => {
    const found = retrieved.get(id);
    return found ? [found.document] : [];
  });
};

/** Drops from the text the citations that are not sources, so it never shows a made-up id. */
export const withoutUnknownCitations = (text: string, retrieved: Map<string, FoundDocument>) =>
  normalizeCitations(text)
    .replace(/ ?\[(SUP-\d+)\]/g, (match, id: string) => (retrieved.has(id) ? match : ''))
    .replace(CITATION, (id) => (retrieved.has(id) ? id : 'un documento no verificado'));
