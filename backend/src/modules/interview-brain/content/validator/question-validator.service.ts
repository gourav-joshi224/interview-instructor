import { Injectable } from '@nestjs/common';
import { RenderedQuestion } from '../topic-pack.types';
import { DEFAULT_KEYWORD_FAMILIES, countWords } from '../renderer/question-finalizer.util';

export interface ValidationContext {
  askedQuestions: string[];
  usedFamilyKeys: string[];
  usedSkeletons: string[];
  usedHookIds: string[];
  usedNumericScales?: string[];
  availableHookCount?: number;
}

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

@Injectable()
export class QuestionValidatorService {
  validate(candidate: RenderedQuestion, context: ValidationContext): ValidationResult {
    const reasons: string[] = [];
    const normalized = this.normalize(candidate.text);
    const numericScale = this.extractNumericScale(candidate.text);
    const wordCount = countWords(candidate.text);

    if (context.askedQuestions.some((q) => this.normalize(q) === normalized)) {
      reasons.push('duplicate-question-text');
    }

    if (context.usedFamilyKeys.includes(candidate.familyKey)) {
      reasons.push('family-key-reused');
    }

    const skeleton = this.normalizeSkeleton(candidate.skeleton || candidate.text);
    if (context.usedSkeletons.some((skel) => this.normalizeSkeleton(skel) === skeleton)) {
      reasons.push('skeleton-reused');
    }

    const hookReuseForbidden =
      typeof context.availableHookCount === 'number'
        ? context.usedHookIds.length < context.availableHookCount
        : true;

    if (hookReuseForbidden && context.usedHookIds.includes(candidate.hookId)) {
      reasons.push('hook-reused');
    }

    if (this.containsTenThousandUsers(candidate.text)) {
      reasons.push('repeated-10000-concurrent-users');
    }

    if (numericScale) {
      const seen = context.usedNumericScales ?? [];
      if (seen.includes(numericScale)) {
        reasons.push('numeric-scale-reused');
      }
    }

    if (wordCount > 45) {
      reasons.push('word-count-exceeded');
    }

    if (this.hasRepeatedKeywords(candidate.text)) {
      reasons.push('concept-overlap-high');
    }

    if (this.hasMultiAsk(candidate.text)) {
      reasons.push('multi-ask');
    }

    if (this.hasDuplicatedFragments(candidate.text)) {
      reasons.push('duplicated-fragment');
    }

    if (this.looksLikeMetadataConcat(candidate.text)) {
      reasons.push('bloated-question');
    }

    return { valid: reasons.length === 0, reasons };
  }

  private normalize(value: string): string {
    return value.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').toLowerCase().trim();
  }

  private normalizeSkeleton(value: string): string {
    return this.normalize(value).replace(/\d+/g, '');
  }

  containsTenThousandUsers(value: string): boolean {
    return /10[, ]?000\s+(concurrent\s+)?(user|request|rps|qps)/i.test(value);
  }

  extractNumericScale(value: string): string | null {
    const match = value.match(/(\d[\d,]+)\s*(rps|qps|users?|reqs?|requests?)/i);
    return match ? match[1].replace(/,/g, '') : null;
  }

  private hasRepeatedKeywords(value: string): boolean {
    const lowered = value.toLowerCase();

    return DEFAULT_KEYWORD_FAMILIES.some((family) => {
      const matches = lowered.match(family.pattern);
      const max = family.maxRepeats ?? 2;
      return (matches?.length ?? 0) > max;
    });
  }

  private hasMultiAsk(value: string): boolean {
    const questionMarks = (value.match(/\?/g) ?? []).length;
    return questionMarks > 1;
  }

  private hasDuplicatedFragments(value: string): boolean {
    const fragments = value
      .split(/(?<=[.?!])\s+|;\s+|:\s+/)
      .map((f) => f.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    for (const fragment of fragments) {
      const norm = this.normalize(fragment);
      if (seen.has(norm)) {
        return true;
      }
      seen.add(norm);
    }
    return false;
  }

  private looksLikeMetadataConcat(value: string): boolean {
    const longColonRuns = (value.match(/:\s*[^.?!]{20,}/g) ?? []).length;
    const repeatedKeywords = this.hasRepeatedKeywords(value);
    const tooManyClauses = (value.split(/(?<=[.?!])/).filter(Boolean).length) > 3;
    return longColonRuns > 2 || (repeatedKeywords && tooManyClauses);
  }
}
