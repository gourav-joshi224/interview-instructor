import { Injectable } from '@nestjs/common';
import { AttemptGateInput, AttemptGateResult } from './attempt-gate.types';
import { assessGibberish } from './gibberish.util';
import { isExplicitNonAttempt } from './no-attempt.util';
import { getDiceCoefficient, getTokenOverlapMetrics } from './similarity.util';
import { assessTechnicalSignal, hasTopicKeywordMatch } from './technical-signal.util';
import { normalizeText, tokenizeNormalizedText } from './text-normalizer.util';

@Injectable()
export class AttemptGateService {
  public evaluate(input: AttemptGateInput): AttemptGateResult {
    const MIN_WORDS_BY_TOPIC: Record<string, number> = {
      system_design: 15,
      javascript: 8,
      nodejs: 8,
      caching: 12,
      databases: 12,
      queues: 12,
      apis: 12,
      concurrency: 12,
      debugging: 8,
      generic: 8,
      default: 8,
    };
    // Step 1: normalize each field independently for deterministic downstream checks.
    const normalizedQuestion = normalizeText(input.question);
    const normalizedAnswer = normalizeText(input.answer);

    // Step 2: normalized empty answer means there is no attempt content.
    if (normalizedAnswer.length === 0) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason: 'Answer is empty after normalization',
        signals: ['empty_answer'],
      };
    }

    // Step 3: explicit non-attempt phrases are immediate hard stops.
    if (isExplicitNonAttempt(normalizedAnswer)) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason: 'Explicit non-attempt phrase detected',
        signals: ['explicit_non_attempt'],
      };
    }

    const answerTokens = tokenizeNormalizedText(normalizedAnswer);
    const wordCount = answerTokens.length;
    let isShallowLength = false;
    const minWords = MIN_WORDS_BY_TOPIC[input.topic] ?? MIN_WORDS_BY_TOPIC.default;

    // Below topic-aware minimum is treated as no meaningful attempt.
    // Between min and 7 words may indicate an attempt but is usually too shallow.
    if (wordCount < minWords) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason: 'Answer is too short to be a meaningful attempt',
        signals: ['too_short'],
      };
    }

    if (wordCount >= minWords && wordCount <= 7) {
      isShallowLength = true;
    }

    const diceSimilarity = getDiceCoefficient(normalizedAnswer, normalizedQuestion);
    // 0.65 threshold allows shared technical terms without penalizing legitimate answers.
    if (diceSimilarity > 0.65) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason: 'Answer is copied from question',
        signals: ['copy_detected'],
      };
    }

    const tokenOverlap = getTokenOverlapMetrics(normalizedAnswer, normalizedQuestion);
    // >70% token reuse indicates paraphrased copying rather than original content.
    const highTokenReuse = tokenOverlap.tokenOverlapRatio > 0.7;
    // Fewer than 4 new meaningful tokens means little added signal beyond the question text.
    const tooFewNewTokens = tokenOverlap.newMeaningfulTokenCount < 4;
    if (highTokenReuse && tooFewNewTokens) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason: 'Answer mostly reuses question wording without meaningful additions',
        signals: ['copy_detected'],
      };
    }

    const hasTopicKeyword = hasTopicKeywordMatch(normalizedAnswer, input.topic);
    const gibberish = assessGibberish(normalizedAnswer, hasTopicKeyword);
    if (gibberish.isGibberish) {
      return {
        status: 'non_attempt',
        shouldEvaluate: false,
        scoreCap: 0,
        reason:
          gibberish.signal === 'repeated_word_spam'
            ? 'Answer appears to be repeated word spam'
            : 'Answer appears to be keyboard mash gibberish',
        signals: [gibberish.signal === 'repeated_word_spam' ? 'repeated_word_spam' : 'keyboard_mash'],
      };
    }

    const technicalSignal = assessTechnicalSignal(normalizedAnswer, input.topic);

    // Zero keyword hits means the response lacks topic-specific technical grounding.
    if (technicalSignal.keywordMatchCount === 0) {
      return {
        status: 'weak_attempt',
        shouldEvaluate: true,
        scoreCap: 25,
        reason: 'Answer lacks topic-specific technical signals',
        signals: ['no_technical_signal'],
      };
    }

    // One to two keyword hits indicates partial relevance but insufficient technical depth.
    if (technicalSignal.keywordMatchCount <= 2) {
      return {
        status: 'weak_attempt',
        shouldEvaluate: true,
        scoreCap: 50,
        reason: 'Answer has limited topic-specific technical signal',
        signals: ['technical_signal_1_2'],
      };
    }

    // Three or more keyword hits without explanation remains shallow despite terminology coverage.
    if (!technicalSignal.hasConnector) {
      return {
        status: 'weak_attempt',
        shouldEvaluate: true,
        scoreCap: 50,
        reason: 'Answer includes terms but lacks explanatory structure',
        signals: ['technical_signal_3+_no_connector'],
      };
    }

    // 20 cap keeps very short answers in bounded scoring even when technically relevant.
    if (isShallowLength) {
      return {
        status: 'weak_attempt',
        shouldEvaluate: true,
        scoreCap: 20,
        reason: 'Answer is technically relevant but too brief for full-credit evaluation',
        signals: ['shallow_length'],
      };
    }

    return {
      status: 'valid_attempt',
      shouldEvaluate: true,
      scoreCap: null,
      reason: 'Answer shows sufficient technical signal with explanation',
      signals: ['technical_signal_3+'],
    };
  }
}
