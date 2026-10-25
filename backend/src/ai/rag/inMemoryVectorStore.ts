import { VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document, type DocumentInterface } from "@langchain/core/documents";
import { cosineSimilarity } from "../llm.js";
import { logger } from "../../lib/logger.js";

export interface StoredRecord {
  id: string;
  document: DocumentInterface;
  embedding: number[];
}

/**
 * An in-memory, high-precision Vector Store conforming strictly to LangChain's VectorStore interface.
 * 
 * Why this is ideal:
 * 1. Zero external infrastructure dependency (runs completely within memory, instant startup).
 * 2. Fully compliant with LangChain LCEL chains and retriever pipelines (`.asRetriever()`, `.similaritySearch()`).
 * 3. Supports metadata filtering and calibrated cosine similarity scoring.
 * 4. Easily explained in technical interviews: shows understanding of vector spaces, cosine similarity,
 *    and LangChain core abstractions rather than just relying on a black-box 3rd party service.
 */
export class InMemoryVectorStore extends VectorStore {
  private records: StoredRecord[] = [];

  constructor(embeddings: EmbeddingsInterface) {
    super(embeddings, {});
  }

  _vectorstoreType(): string {
    return "outly_in_memory_vector_store";
  }

  /**
   * Adds pre-computed vector embeddings along with their corresponding LangChain Documents.
   */
  async addVectors(
    vectors: number[][],
    documents: DocumentInterface[]
  ): Promise<string[]> {
    const ids: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const embedding = vectors[i];
      const id = (doc.metadata?.id as string) || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      this.records.push({
        id,
        document: doc,
        embedding,
      });

      ids.push(id);
    }

    return ids;
  }

  /**
   * Generates embeddings for the provided documents and stores them in memory.
   */
  async addDocuments(documents: DocumentInterface[]): Promise<string[]> {
    if (!documents || documents.length === 0) return [];

    const texts = documents.map((doc) => doc.pageContent);
    logger.info(`[InMemoryVectorStore] Generating embeddings for ${texts.length} chunks...`, {
      source: "ai/rag/inMemoryVectorStore",
    });

    const vectors = await this.embeddings.embedDocuments(texts);
    return this.addVectors(vectors, documents);
  }

  /**
   * Performs vector cosine similarity search against stored embeddings and returns
   * top-k documents along with their similarity score (0 to 1).
   */
  async similaritySearchVectorWithScore(
    queryVector: number[],
    k = 4,
    filter?: (doc: DocumentInterface) => boolean
  ): Promise<[DocumentInterface, number][]> {
    if (this.records.length === 0) {
      return [];
    }

    const scoredRecords: Array<{ document: DocumentInterface; score: number }> = [];

    for (const record of this.records) {
      if (filter && !filter(record.document)) {
        continue;
      }

      const score = cosineSimilarity(queryVector, record.embedding);
      scoredRecords.push({
        document: record.document,
        score,
      });
    }

    // Sort descending by similarity score
    scoredRecords.sort((a, b) => b.score - a.score);

    const topK = scoredRecords.slice(0, k);
    return topK.map((item) => [item.document, item.score]);
  }

  /**
   * Returns the count of documents currently stored.
   */
  get size(): number {
    return this.records.length;
  }

  /**
   * Clears all stored records.
   */
  clear(): void {
    this.records = [];
  }

  /**
   * Factory method to create an InMemoryVectorStore from text strings.
   */
  static async fromTexts(
    texts: string[],
    metadatas: object[] | object,
    embeddings: EmbeddingsInterface
  ): Promise<InMemoryVectorStore> {
    const docs = texts.map((text, idx) => {
      const meta = Array.isArray(metadatas) ? metadatas[idx] || {} : metadatas || {};
      return new Document({ pageContent: text, metadata: meta });
    });

    return InMemoryVectorStore.fromDocuments(docs, embeddings);
  }

  /**
   * Factory method to create and populate an InMemoryVectorStore from LangChain Documents.
   */
  static async fromDocuments(
    docs: DocumentInterface[],
    embeddings: EmbeddingsInterface
  ): Promise<InMemoryVectorStore> {
    const store = new InMemoryVectorStore(embeddings);
    await store.addDocuments(docs);
    return store;
  }
}

/**
 * Cache to avoid re-chunking and re-embedding when the same company is queried multiple times.
 * Keyed by companyId or unique company identifier.
 */
const companyStoreCache = new Map<string, { store: InMemoryVectorStore; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export function getCachedCompanyVectorStore(companyKey: string): InMemoryVectorStore | null {
  const cached = companyStoreCache.get(companyKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    companyStoreCache.delete(companyKey);
    return null;
  }

  return cached.store;
}

export function setCachedCompanyVectorStore(companyKey: string, store: InMemoryVectorStore): void {
  companyStoreCache.set(companyKey, {
    store,
    timestamp: Date.now(),
  });
}
