import { tokenizeNormalizedText } from './text-normalizer.util';

interface TokenOverlapMetrics {
  tokenOverlapRatio: number;
  newMeaningfulTokenCount: number;
}

const STOPWORDS: ReadonlySet<string> = new Set<string>([
  'a',
  'an',
  'the',
  'is',
  'are',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'what',
  'why',
  'how',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'it',
  'be',
  'as',
  'with',
  'by',
  'from',
  'at',
]);

const toCharacterBigrams = (text: string): string[] => {
  const compact = text.replace(/\s+/g, '');

  if (compact.length < 2) {
    return [];
  }

  const bigrams: string[] = [];
  for (let index = 0; index < compact.length - 1; index += 1) {
    bigrams.push(compact.slice(index, index + 2));
  }

  return bigrams;
};

export const getDiceCoefficient = (left: string, right: string): number => {
  if (left === right) {
    return left.length === 0 ? 0 : 1;
  }

  const leftBigrams = toCharacterBigrams(left);
  const rightBigrams = toCharacterBigrams(right);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const leftCounts = new Map<string, number>();
  for (const bigram of leftBigrams) {
    const current = leftCounts.get(bigram) ?? 0;
    leftCounts.set(bigram, current + 1);
  }

  let overlapCount = 0;
  for (const bigram of rightBigrams) {
    const current = leftCounts.get(bigram) ?? 0;
    if (current > 0) {
      overlapCount += 1;
      leftCounts.set(bigram, current - 1);
    }
  }

  return (2 * overlapCount) / (leftBigrams.length + rightBigrams.length);
};

const isMeaningfulToken = (token: string): boolean => {
  return token.length >= 3 && !STOPWORDS.has(token);
};

export const getTokenOverlapMetrics = (
  normalizedAnswer: string,
  normalizedQuestion: string,
): TokenOverlapMetrics => {
  const answerTokens = tokenizeNormalizedText(normalizedAnswer);
  const questionTokens = tokenizeNormalizedText(normalizedQuestion);
  const answerTokenSet = new Set<string>(answerTokens);
  const questionTokenSet = new Set<string>(questionTokens);

  if (answerTokens.length === 0) {
    return {
      tokenOverlapRatio: 0,
      newMeaningfulTokenCount: 0,
    };
  }

  let overlappedTokenCount = 0;
  const newMeaningfulTokenSet = new Set<string>();

  for (const token of answerTokenSet) {
    if (!questionTokenSet.has(token) && isMeaningfulToken(token)) {
      newMeaningfulTokenSet.add(token);
    }
  }

  for (const token of questionTokenSet) {
    if (answerTokenSet.has(token)) {
      overlappedTokenCount += 1;
    }
  }

  return {
    tokenOverlapRatio:
      questionTokens.length === 0 ? 0 : overlappedTokenCount / questionTokens.length,
    newMeaningfulTokenCount: newMeaningfulTokenSet.size,
  };
};
