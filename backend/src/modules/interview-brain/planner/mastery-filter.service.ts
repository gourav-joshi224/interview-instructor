import { Injectable } from '@nestjs/common';
import { QuestionTemplate, UserConceptMastery } from '../domain';

/**
 * Filters out questions that only target concepts the user has already mastered.
 * If the remaining pool is too small, callers can reintroduce the fallback list
 * to keep the planner deterministic while still honoring "avoid mastered" first.
 */
@Injectable()
export class MasteryFilterService {
  partitionByMastery(
    templates: QuestionTemplate[],
    userMastery: UserConceptMastery[],
  ): { preferred: QuestionTemplate[]; fallback: QuestionTemplate[] } {
    if (!userMastery?.length) {
      return { preferred: [...templates], fallback: [] };
    }

    const masteredConcepts = new Set(
      userMastery.filter((record) => record.mastered).map((record) => record.conceptId),
    );

    const preferred: QuestionTemplate[] = [];
    const fallback: QuestionTemplate[] = [];

    for (const template of templates) {
      const targetsMasteredOnly =
        template.concepts.length > 0 &&
        template.concepts.every((conceptId) => masteredConcepts.has(conceptId));

      if (targetsMasteredOnly) {
        fallback.push(template);
      } else {
        preferred.push(template);
      }
    }

    return { preferred, fallback };
  }
}
