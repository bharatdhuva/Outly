import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

/**
 * Validates that GEMINI_API_KEY is configured in the environment.
 */
function getValidatedApiKey(): string {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY is not defined in environment variables. AI calls may fail.", {
      source: "ai/llm",
    });
  }
  return apiKey || "";
}

export interface ModelOptions {
  modelName?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

/**
 * Default model configuration:
 * Using gemini-2.5-flash as the primary fast & capable model.
 * Easily switchable or overridable per chain call.
 */
export const DEFAULT_MODEL_NAME = "gemini-2.5-flash";
export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Returns a configured LangChain ChatGoogleGenerativeAI model instance.
 *
 * @param options - Custom model parameters (modelName, temperature, maxOutputTokens, etc.)
 */
export function getChatModel(options: ModelOptions = {}): ChatGoogleGenerativeAI {
  const apiKey = getValidatedApiKey();
  const modelName = options.modelName ?? DEFAULT_MODEL_NAME;
  const temperature = options.temperature ?? 0.2;

  logger.info(`Initializing ChatGoogleGenerativeAI model: ${modelName} (temp: ${temperature})`, {
    source: "ai/llm",
  });

  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey,
    temperature,
    maxOutputTokens: options.maxOutputTokens,
    topP: options.topP,
  });
}

/**
 * Returns a configured LangChain GoogleGenerativeAIEmbeddings instance.
 *
 * @param modelName - Embedding model name (defaults to text-embedding-004)
 */
export function getEmbeddingsModel(modelName: string = DEFAULT_EMBEDDING_MODEL): GoogleGenerativeAIEmbeddings {
  const apiKey = getValidatedApiKey();

  logger.info(`Initializing GoogleGenerativeAIEmbeddings model: ${modelName}`, {
    source: "ai/llm",
  });

  return new GoogleGenerativeAIEmbeddings({
    model: modelName,
    apiKey,
  });
}

/**
 * Utility helper to compute cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, similarity));
}
