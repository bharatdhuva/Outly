import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { getEmbeddingsModel } from "../llm.js";
import { cleanScrapedContext } from "./textCleaner.js";
import {
  InMemoryVectorStore,
  getCachedCompanyVectorStore,
  setCachedCompanyVectorStore,
} from "./inMemoryVectorStore.js";
import { logger } from "../../lib/logger.js";

export interface RetrievedSnippet {
  content: string;
  similarityScore: number;
  metadata: {
    companyName: string;
    chunkIndex: number;
    totalChunks: number;
    source?: string;
  };
}

export interface RetrievalResult {
  snippets: RetrievedSnippet[];
  formattedContext: string;
  totalChunksIndexed: number;
  retrievedCount: number;
}

/**
 * Splits cleaned company text into semantic chunks using LangChain's RecursiveCharacterTextSplitter.
 * 
 * Strategy:
 * - Chunk size: ~550 characters (~100-130 tokens) - optimal for capturing a specific product feature,
 *   team value, or tech stack block without bloating LLM context.
 * - Chunk overlap: ~100 characters - preserves continuity across sentence boundaries.
 * - Separators: prioritizes paragraph breaks ("\n\n"), newline ("\n"), sentence ends (". "), and spaces (" ").
 */
export async function splitCompanyContentIntoChunks(
  cleanedText: string,
  companyName: string,
  sourceUrl?: string
): Promise<Document[]> {
  if (!cleanedText || cleanedText.trim().length === 0) {
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 550,
    chunkOverlap: 100,
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""],
  });

  const rawChunks = await splitter.splitText(cleanedText);

  return rawChunks.map((chunk, index) => {
    return new Document({
      pageContent: chunk.trim(),
      metadata: {
        companyName,
        chunkIndex: index,
        totalChunks: rawChunks.length,
        source: sourceUrl || "company_scrape",
      },
    });
  });
}

/**
 * Builds or retrieves a cached InMemoryVectorStore for a given company.
 */
export async function getOrBuildCompanyVectorStore(params: {
  companyId?: string;
  companyName: string;
  scrapedData: any;
  websiteUrl?: string;
}): Promise<{ store: InMemoryVectorStore; totalChunks: number }> {
  const cacheKey = params.companyId || `company_${params.companyName.toLowerCase().trim()}`;

  // 1. Check cache first
  const cachedStore = getCachedCompanyVectorStore(cacheKey);
  if (cachedStore && cachedStore.size > 0) {
    logger.info(`[RAG-Retriever] Cache HIT for company: ${params.companyName} (${cachedStore.size} chunks)`, {
      source: "ai/rag/companyRetriever",
    });
    return { store: cachedStore, totalChunks: cachedStore.size };
  }

  // 2. Clean scraped text
  const cleanedText = cleanScrapedContext(params.scrapedData);
  let effectiveText = cleanedText;

  // Fallback if website was empty or scrape failed
  if (!effectiveText || effectiveText.trim().length < 20) {
    effectiveText = `${params.companyName} is an innovative organization with modern engineering, software products, and technology teams.`;
  }

  // 3. Chunk into LangChain Documents
  const documents = await splitCompanyContentIntoChunks(
    effectiveText,
    params.companyName,
    params.websiteUrl
  );

  // 4. Generate embeddings and populate LangChain VectorStore
  const embeddings = getEmbeddingsModel();
  const vectorStore = new InMemoryVectorStore(embeddings);

  if (documents.length > 0) {
    await vectorStore.addDocuments(documents);
  }

  // 5. Store in cache
  setCachedCompanyVectorStore(cacheKey, vectorStore);

  logger.info(`[RAG-Retriever] Indexed ${documents.length} chunks into VectorStore for ${params.companyName}`, {
    source: "ai/rag/companyRetriever",
  });

  return { store: vectorStore, totalChunks: documents.length };
}

/**
 * Retrieves the most relevant company knowledge chunks for a candidate profile & target role.
 * 
 * Rather than dumping the entire website scrape into the prompt, RAG queries the vector store
 * using the candidate's target role, key skills, and outreach hook. Only the top-k highest
 * similarity chunks are returned.
 */
export async function retrieveCompanyContext(params: {
  companyId?: string;
  companyName: string;
  targetRole?: string;
  keySkills?: string;
  personalizationHook?: string;
  scrapedData: any;
  websiteUrl?: string;
  topK?: number;
}): Promise<RetrievalResult> {
  const k = params.topK ?? 4;
  const startTime = Date.now();

  const { store, totalChunks } = await getOrBuildCompanyVectorStore({
    companyId: params.companyId,
    companyName: params.companyName,
    scrapedData: params.scrapedData,
    websiteUrl: params.websiteUrl,
  });

  if (store.size === 0) {
    return {
      snippets: [],
      formattedContext: "No specific company background available.",
      totalChunksIndexed: 0,
      retrievedCount: 0,
    };
  }

  // Construct a targeted semantic query that reflects what the candidate cares about
  const rolePart = params.targetRole ? `Role: ${params.targetRole}.` : "";
  const skillsPart = params.keySkills ? `Tech stack & skills: ${params.keySkills}.` : "";
  const hookPart = params.personalizationHook ? `Focus area: ${params.personalizationHook}.` : "";
  const semanticQuery = `${params.companyName} engineering products, technology stack, mission, recent projects. ${rolePart} ${skillsPart} ${hookPart}`.trim();

  logger.info(`[RAG-Retriever] Querying vector store for: "${semanticQuery.slice(0, 120)}..."`, {
    source: "ai/rag/companyRetriever",
  });

  // Query vector store using cosine similarity
  const resultsWithScore = await store.similaritySearchVectorWithScore(
    await store.embeddings.embedQuery(semanticQuery),
    k
  );

  const snippets: RetrievedSnippet[] = resultsWithScore.map(([doc, score]) => ({
    content: doc.pageContent,
    similarityScore: Math.round(score * 100) / 100,
    metadata: {
      companyName: doc.metadata.companyName,
      chunkIndex: doc.metadata.chunkIndex,
      totalChunks: doc.metadata.totalChunks,
      source: doc.metadata.source,
    },
  }));

  // Format the retrieved snippets into clear, cited context blocks
  const formattedLines = snippets.map((s, idx) => {
    return `[Context Chunk ${idx + 1} | Relevance: ${Math.round(s.similarityScore * 100)}%]:\n${s.content}`;
  });

  const formattedContext = formattedLines.length > 0
    ? formattedLines.join("\n\n")
    : "No highly relevant context chunks found.";

  logger.info(`[RAG-Retriever] Retrieved ${snippets.length} relevant chunks in ${Date.now() - startTime}ms`, {
    company: params.companyName,
    totalChunks,
    retrievedCount: snippets.length,
    source: "ai/rag/companyRetriever",
  });

  return {
    snippets,
    formattedContext,
    totalChunksIndexed: totalChunks,
    retrievedCount: snippets.length,
  };
}
