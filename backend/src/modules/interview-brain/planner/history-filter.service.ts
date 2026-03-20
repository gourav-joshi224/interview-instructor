import { Injectable } from '@nestjs/common';
import { QuestionTemplate } from '../domain';

/**
 * Simple recent-history guard that keeps recently used question ids out of the
 * primary pool, but returns them as fallback so the planner can still fill
 * sessions when the fresh pool is too small.
 */
@Injectable()
export class HistoryFilterService {
  partitionByHistory(
    templates: QuestionTemplate[],
    recentQuestionIds: string[],
  ): { preferred: QuestionTemplate[]; fallback: QuestionTemplate[] } {
    if (!recentQuestionIds?.length) {
      return { preferred: [...templates], fallback: [] };
    }

    const recent = new Set(recentQuestionIds);
    const preferred: QuestionTemplate[] = [];
    const fallback: QuestionTemplate[] = [];

    for (const template of templates) {
      if (recent.has(template.id)) {
        fallback.push(template);
      } else {
        preferred.push(template);
      }
    }

    return { preferred, fallback };
  }
}
