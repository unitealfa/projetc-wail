import { ApiError as GeminiApiError, GoogleGenAI, type GenerateContentParameters } from '@google/genai';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const GEMINI_TIMEOUT_MS = 25_000;
const MAX_GEMINI_ATTEMPTS = 4;

export interface GeminiRawResponse {
  text?: string;
  modelVersion?: string;
}

export type GeminiGenerator = (
  apiKey: string,
  request: GenerateContentParameters,
) => Promise<GeminiRawResponse>;

interface GenerateStructuredOptions<T> {
  prompt: string;
  image: { buffer: Buffer; mimeType: string };
  jsonSchema: unknown;
  validate: (value: unknown) => T;
  generator?: GeminiGenerator;
  keys?: string[];
  primaryModel?: string;
  fallbackModel?: string;
}

export interface StructuredGeminiResult<T> {
  data: T;
  model: string;
}

function configuredKeys(): string[] {
  return [...new Set(env.GEMINI_API_KEYS.split(',').map((key) => key.trim()).filter((key) => key && !/^YOUR_/i.test(key)))];
}

async function sdkGenerator(apiKey: string, request: GenerateContentParameters): Promise<GeminiRawResponse> {
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: GEMINI_TIMEOUT_MS,
      retryOptions: { attempts: 1 },
    },
  });
  return client.models.generateContent(request);
}

function errorKind(error: unknown): 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'UNAVAILABLE' {
  if (error instanceof ApiError && error.code === 'AI_INVALID_RESPONSE') return 'INVALID_RESPONSE';
  if (error instanceof GeminiApiError) {
    if (error.status === 429) return 'RATE_LIMIT';
    if (error.status === 401 || error.status === 403) return 'AUTH';
    if (error.status === 408 || error.status === 504) return 'TIMEOUT';
  }
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : '';
  if (name === 'AbortError' || /timeout|timed out/i.test(message)) return 'TIMEOUT';
  return 'UNAVAILABLE';
}

export async function generateStructuredGemini<T>(
  options: GenerateStructuredOptions<T>,
): Promise<StructuredGeminiResult<T>> {
  const keys = [...new Set(options.keys ?? configuredKeys())]
    .map((key) => key.trim())
    .filter((key) => key && !/^YOUR_/i.test(key))
    .slice(0, MAX_GEMINI_ATTEMPTS);
  if (keys.length === 0 || keys.every((key) => /^YOUR_/i.test(key))) {
    throw new ApiError(503, "Le service d'analyse d'image n'est pas configuré.", 'AI_NOT_CONFIGURED');
  }

  const primaryModel = options.primaryModel ?? env.GEMINI_MODEL;
  const fallbackModel = options.fallbackModel ?? env.GEMINI_FALLBACK_MODEL;
  const generate = options.generator ?? sdkGenerator;
  const kinds: ReturnType<typeof errorKind>[] = [];

  for (const [index, apiKey] of keys.entries()) {
    // Une clé n'est appelée qu'une seule fois. La dernière clé utilise le modèle
    // fallback lorsqu'il est différent et qu'au moins deux clés sont disponibles.
    const useFallback = keys.length > 1 && index === keys.length - 1 && fallbackModel !== primaryModel;
    const model = useFallback ? fallbackModel : primaryModel;
    const startedAt = Date.now();
    try {
      const response = await generate(apiKey, {
        model,
        contents: [{
          role: 'user',
          parts: [
            { text: options.prompt },
            { inlineData: { data: options.image.buffer.toString('base64'), mimeType: options.image.mimeType } },
          ],
        }],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: options.jsonSchema,
          maxOutputTokens: 3000,
          httpOptions: { timeout: GEMINI_TIMEOUT_MS, retryOptions: { attempts: 1 } },
        },
      });
      if (!response.text) {
        throw new ApiError(502, 'Réponse IA vide.', 'AI_INVALID_RESPONSE');
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        throw new ApiError(502, 'Réponse IA invalide.', 'AI_INVALID_RESPONSE');
      }
      let data: T;
      try {
        data = options.validate(parsed);
      } catch {
        throw new ApiError(502, 'Réponse IA invalide.', 'AI_INVALID_RESPONSE');
      }
      console.info('Analyse Gemini.', { model, durationMs: Date.now() - startedAt, success: true });
      return { data, model: response.modelVersion ?? model };
    } catch (error) {
      const kind = errorKind(error);
      kinds.push(kind);
      console.warn('Analyse Gemini.', { model, durationMs: Date.now() - startedAt, success: false, errorType: kind });
    }
  }

  if (kinds.every((kind) => kind === 'RATE_LIMIT')) {
    throw new ApiError(503, "Le service d'analyse d'image est temporairement indisponible. Réessayez dans quelques instants.", 'AI_RATE_LIMITED');
  }
  if (kinds.includes('TIMEOUT')) {
    throw new ApiError(504, "L'analyse prend trop de temps. Réessayez.", 'AI_TIMEOUT');
  }
  if (kinds.every((kind) => kind === 'INVALID_RESPONSE')) {
    throw new ApiError(502, "Le service d'analyse a retourné une réponse invalide.", 'AI_INVALID_RESPONSE');
  }
  throw new ApiError(503, "Le service d'analyse d'image est temporairement indisponible.", 'AI_UNAVAILABLE');
}
