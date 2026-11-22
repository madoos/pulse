import type { Embedder } from '@support-assistant/domain/Embedder';

/** The model of the ingestion. Questions must use the same one to be comparable. */
export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';

type Extractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: true },
) => Promise<{ tolist: () => number[][] }>;

export type TransformersEmbedder = Embedder & {
  /** The embeddings of documents, as the ingestion computes them. */
  embedPassages: (texts: string[]) => Promise<number[][]>;
  /** Loads the model, so the first question does not wait for it. */
  warmUp: () => Promise<void>;
};

/**
 * Embeddings with transformers.js, in the process. The model is e5, which expects a prefix
 * telling a question from a passage. Normalized, so the cosine similarity is a dot product.
 *
 * The library is imported on first use: on a machine without a build of ONNX Runtime (macOS on
 * Intel) the API still starts, and only the assistant fails.
 */
export const createTransformersEmbedder = ({
  cacheDir,
  allowRemoteModels = true,
}: {
  cacheDir?: string;
  allowRemoteModels?: boolean;
} = {}): TransformersEmbedder => {
  let extractor: Promise<Extractor> | null = null;
  const load = () => {
    extractor ??= import('@huggingface/transformers').then(async ({ env, pipeline }) => {
      if (cacheDir) env.cacheDir = cacheDir;
      env.allowRemoteModels = allowRemoteModels;
      return (await pipeline('feature-extraction', EMBEDDING_MODEL, {
        dtype: 'q8',
      })) as unknown as Extractor;
    });
    extractor.catch(() => {
      extractor = null;
    });
    return extractor;
  };
  const embed = async (texts: string[]) =>
    (await (await load())(texts, { pooling: 'mean', normalize: true })).tolist();

  return {
    embedQuery: async (text) => (await embed([`query: ${text}`]))[0]!,
    embedPassages: (texts) => embed(texts.map((text) => `passage: ${text}`)),
    warmUp: async () => {
      await load();
    },
  };
};
