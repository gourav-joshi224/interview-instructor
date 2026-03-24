import { Logger } from '@nestjs/common';

const BOOL_TRUE = new Set(['true', '1', 'yes', 'y', 'on']);
const BOOL_FALSE = new Set(['false', '0', 'no', 'n', 'off']);

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (BOOL_TRUE.has(normalized)) return true;
  if (BOOL_FALSE.has(normalized)) return false;
  throw new Error('must be a boolean (true/false)');
};

export const validateEnv = () => {
  const logger = new Logger('EnvValidation');
  const fail = (field: string, reason: string) => {
    throw new Error(`ENV_VALIDATION_FAILED: ${field} — ${reason}`);
  };
  const parseOptionalInt = (field: string, raw: string | undefined, defaultValue: number) => {
    const value = raw ?? String(defaultValue);
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      fail(field, 'must be a number > 0');
    }
    return parsed;
  };

  const portRaw = process.env.PORT ?? '3001';
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) fail('PORT', 'must be a number > 0');

  const host = process.env.HOST ?? '0.0.0.0';
  if (!host) fail('HOST', 'must be a non-empty string');

  const corsOrigin = process.env.CORS_ORIGIN;
  if ((process.env.NODE_ENV ?? '').toLowerCase() === 'production' && !corsOrigin) {
    fail('CORS_ORIGIN', 'required in production');
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    logger.warn('XAI_API_KEY missing; interview generation calls will fail until provided.');
  }

  const xaiBaseUrl = process.env.XAI_BASE_URL ?? 'https://api.groq.com/openai/v1';
  try {
    // eslint-disable-next-line no-new
    new URL(xaiBaseUrl);
  } catch {
    fail('XAI_BASE_URL', 'must be a valid URL');
  }

  if (!process.env.XAI_MODEL) {
    fail('XAI_MODEL', 'is required');
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    fail('FIREBASE_PROJECT_ID', 'is required');
  }

  const firebaseApiKey = process.env.FIREBASE_API_KEY ?? '';
  if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(firebaseApiKey)) {
    fail('FIREBASE_API_KEY', 'must be a valid Firebase Web API key');
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? '';
  if (!clientEmail.includes('@')) {
    fail('FIREBASE_CLIENT_EMAIL', 'must contain @');
  }

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '').trim();
  if (!privateKey) {
    fail('FIREBASE_PRIVATE_KEY', 'is required');
  }
  if (!privateKey.startsWith('-----BEGIN')) {
    fail('FIREBASE_PRIVATE_KEY', 'must start with -----BEGIN');
  }

  const debugQuestionPipeline = parseBoolean(process.env.DEBUG_QUESTION_PIPELINE, false);
  const interviewDebug = parseBoolean(process.env.INTERVIEW_DEBUG, false);
  process.env.DEBUG_QUESTION_PIPELINE = debugQuestionPipeline.toString();
  process.env.INTERVIEW_DEBUG = interviewDebug.toString();

  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    logger.warn('INTERNAL_API_KEY not set; ApiKeyGuard will allow all requests (dev mode).');
  }

  const maxPerArchetype = parseOptionalInt('MAX_PER_ARCHETYPE', process.env.MAX_PER_ARCHETYPE, 3);
  const questionWordLimit = parseOptionalInt('QUESTION_WORD_LIMIT', process.env.QUESTION_WORD_LIMIT, 45);

  // Normalize defaults after validation for downstream config service.
  process.env.PORT = String(port);
  process.env.HOST = host;
  process.env.CORS_ORIGIN = corsOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  process.env.XAI_BASE_URL = xaiBaseUrl;
  process.env.MAX_PER_ARCHETYPE = String(maxPerArchetype);
  process.env.QUESTION_WORD_LIMIT = String(questionWordLimit);
};

export default () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  xai: {
    apiKey: process.env.XAI_API_KEY ?? '',
    // Allow overriding the provider; default to Groq's OpenAI-compatible endpoint
    baseUrl: process.env.XAI_BASE_URL ?? 'https://api.groq.com/openai/v1',
    model: process.env.XAI_MODEL ?? 'llama-3.1-8b-instant',
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY ?? '',
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
  },
});
