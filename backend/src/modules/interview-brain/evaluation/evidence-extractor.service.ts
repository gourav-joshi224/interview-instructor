import { Injectable } from '@nestjs/common';
import {
  EvidenceExtractionAdapter,
  EvidenceExtractionResult,
  EvidenceExtractorInput,
  EvidenceMatch,
} from './evaluation.types';
import { normalizeText, tokenizeNormalizedText } from './text-normalizer.util';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'how',
  'if',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'so',
  'that',
  'the',
  'their',
  'then',
  'to',
  'use',
  'uses',
  'using',
  'with',
  'without',
]);

const REASONING_MARKERS = ['because', 'therefore', 'so that', 'tradeoff', 'trade-off', 'if', 'when', 'otherwise'];
const COMMUNICATION_MARKERS = ['first', 'second', 'finally', 'for example', 'for instance', 'step', 'then'];

class HeuristicEvidenceExtractionAdapter implements EvidenceExtractionAdapter {
  public extract(input: EvidenceExtractorInput): EvidenceExtractionResult {
    const normalizedQuestion = normalizeText(input.question);
    const normalizedAnswer = normalizeText(input.answer);
    const answerTokens = tokenizeNormalizedText(normalizedAnswer);

    return {
      normalizedQuestion,
      normalizedAnswer,
      mustHaveMatches: input.rubric.mustHave.map((item) => this.matchRubricItem(item, normalizedAnswer)),
      niceToHaveMatches: input.rubric.niceToHave.map((item) => this.matchRubricItem(item, normalizedAnswer)),
      strategyMatches: input.rubric.validStrategies.map((item) => this.matchRubricItem(item, normalizedAnswer)),
      redFlagMatches: input.rubric.redFlags.map((item) => this.matchRedFlag(item, normalizedAnswer)),
      communicationSignals: COMMUNICATION_MARKERS.filter((marker) => normalizedAnswer.includes(marker)),
      reasoningSignals: REASONING_MARKERS.filter((marker) => normalizedAnswer.includes(marker)),
      answerTokenCount: answerTokens.length,
    };
  }

  private matchRubricItem(item: string, normalizedAnswer: string): EvidenceMatch {
    const normalizedItem = normalizeText(item);
    const itemTokens = this.getMeaningfulTokens(normalizedItem);
    const matchedTokens = itemTokens.filter((token) => normalizedAnswer.includes(token));
    const directPhraseMatch = normalizedAnswer.includes(normalizedItem);
    const overlapRatio = itemTokens.length === 0 ? 0 : matchedTokens.length / itemTokens.length;
    const matched = directPhraseMatch || (itemTokens.length >= 2 ? overlapRatio >= 0.5 : overlapRatio === 1);

    return {
      rubricItem: item,
      matched,
      confidence: directPhraseMatch ? 1 : Number(overlapRatio.toFixed(2)),
      evidence: matchedTokens,
      rationale: matched
        ? directPhraseMatch
          ? 'Direct phrase overlap found in answer'
          : 'Meaningful token overlap suggests the concept was addressed'
        : 'Not enough concept tokens were found in the answer',
    };
  }

  private matchRedFlag(item: string, normalizedAnswer: string): EvidenceMatch {
    const normalizedItem = normalizeText(item);
    const itemTokens = this.getMeaningfulTokens(normalizedItem);
    const matchedTokens = itemTokens.filter((token) => normalizedAnswer.includes(token));
    const directPhraseMatch = normalizedAnswer.includes(normalizedItem);
    const overlapRatio = itemTokens.length === 0 ? 0 : matchedTokens.length / itemTokens.length;
    const matched = directPhraseMatch || overlapRatio >= 0.6;

    return {
      rubricItem: item,
      matched,
      confidence: directPhraseMatch ? 1 : Number(overlapRatio.toFixed(2)),
      evidence: matchedTokens,
      rationale: matched
        ? 'Answer contains language strongly associated with a rubric red flag'
        : 'No strong red-flag evidence detected',
    };
  }

  private getMeaningfulTokens(value: string): string[] {
    return [...new Set(tokenizeNormalizedText(value).filter((token) => token.length > 2 && !STOP_WORDS.has(token)))];
  }
}

@Injectable()
export class EvidenceExtractorService {
  private readonly adapter: EvidenceExtractionAdapter = new HeuristicEvidenceExtractionAdapter();

  public extract(input: EvidenceExtractorInput): EvidenceExtractionResult {
    return this.adapter.extract(input);
  }
}
