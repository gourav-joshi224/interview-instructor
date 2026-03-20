import { Injectable } from '@nestjs/common';
import { QuestionTemplate, QuestionType } from '../domain';

@Injectable()
export class RulesService {
  private readonly defaultComparator = (a: QuestionTemplate, b: QuestionTemplate): number => {
    // Deterministic ordering: subtopic -> type -> id to keep selection stable.
    if (a.subtopic !== b.subtopic) return a.subtopic.localeCompare(b.subtopic);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.id.localeCompare(b.id);
  };

  /**
   * Pick the best N templates while enforcing variety rules and avoiding duplicates.
   * The method is intentionally deterministic to make unit testing trivial.
   */
  selectWithDiversity(
    templates: QuestionTemplate[],
    totalQuestions: number,
  ): QuestionTemplate[] {
    const sorted = [...templates].sort(this.defaultComparator);
    const selected: QuestionTemplate[] = [];
    const holdForCoverage: QuestionTemplate[] = [];
    const holdForSubtopicLimit: QuestionTemplate[] = [];

    const subtopicCounts = new Map<string, number>();
    const seenTypes = new Set<QuestionType>();
    const seenIds = new Set<string>();
    const enforceSinglePerSubtopic = totalQuestions === 5;

    const addTemplate = (template: QuestionTemplate) => {
      if (selected.length >= totalQuestions || seenIds.has(template.id)) {
        return;
      }
      selected.push(template);
      seenIds.add(template.id);
      seenTypes.add(template.type);
      subtopicCounts.set(template.subtopic, (subtopicCounts.get(template.subtopic) ?? 0) + 1);
    };

    // First pass: grab items that add new coverage without breaking strict subtopic limits.
    for (const template of sorted) {
      if (selected.length >= totalQuestions) break;

      const subtopicCount = subtopicCounts.get(template.subtopic) ?? 0;
      const introducesNewCoverage =
        subtopicCount === 0 || !seenTypes.has(template.type);

      if (enforceSinglePerSubtopic && subtopicCount >= 1) {
        holdForSubtopicLimit.push(template);
        continue;
      }

      if (introducesNewCoverage) {
        addTemplate(template);
      } else {
        holdForCoverage.push(template);
      }
    }

    // Second pass: fill remaining slots while still preferring type/subtopic variety.
    for (const template of holdForCoverage) {
      if (selected.length >= totalQuestions) break;
      const subtopicCount = subtopicCounts.get(template.subtopic) ?? 0;
      const avoidsSubtopicFlood = !enforceSinglePerSubtopic || subtopicCount < 1;
      if (avoidsSubtopicFlood) {
        addTemplate(template);
      }
    }

    // Final pass: relax the subtopic limit if we still lack enough questions.
    for (const template of holdForSubtopicLimit) {
      if (selected.length >= totalQuestions) break;
      addTemplate(template);
    }

    return selected.slice(0, totalQuestions);
  }

  collectConcepts(templates: QuestionTemplate[]): string[] {
    const concepts = new Set<string>();
    for (const template of templates) {
      for (const concept of template.concepts) {
        concepts.add(concept);
      }
    }
    return Array.from(concepts).sort();
  }
}
