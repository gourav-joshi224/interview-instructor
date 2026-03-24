import { Inject, Injectable } from '@nestjs/common';
import { calculateConfidence } from './confidence.util';
import {
  MASTERY_REPOSITORY,
  MasteryQuestionResult,
  MasteryRepository,
  MasteryUpdateInput,
  MasteryUpdateSummary,
  UserConceptMastery,
} from './mastery-updater.types';
import {
  hasRecentNonAttemptSpike,
  mapMasteryState,
  shouldDemoteFromMastered,
  shouldPromoteToMastered,
} from './mastery-rules.util';
import { appendRecentScore, calculateRollingAverage } from './rolling-average.util';

interface ConceptSessionCounters {
  recentNonAttemptsInSession: number;
}

@Injectable()
export class MasteryUpdaterService {
  constructor(
    @Inject(MASTERY_REPOSITORY)
    private readonly masteryRepository: MasteryRepository,
  ) {}

  async updateSessionMastery(input: MasteryUpdateInput): Promise<MasteryUpdateSummary> {
    const conceptIds = this.collectConceptIds(input.questionResults);
    if (conceptIds.length === 0) {
      return {
        userId: input.userId,
        sessionId: input.sessionId,
        updatedConcepts: [],
        newlyMastered: [],
        newlyFlaggedForRevision: [],
      };
    }

    const existingRecords = await this.masteryRepository.getByUserAndConceptIds(input.userId, conceptIds);
    const existingByConceptId = new Map(existingRecords.map((record) => [record.conceptId, record]));
    const perConceptCounters = new Map<string, ConceptSessionCounters>();
    const updatedRecords: UserConceptMastery[] = [];
    const newlyMastered: string[] = [];
    const newlyFlaggedForRevision: string[] = [];

    for (const conceptId of conceptIds) {
      const previous = existingByConceptId.get(conceptId) ?? null;
      let nextRecord = this.createBaseRecord(input.userId, conceptId, input.topic, previous);

      if (
        previous?.mastered &&
        previous.lastSeenSessionId &&
        previous.lastSeenSessionId !== input.sessionId &&
        previous.cooldownSessionsRemaining > 0
      ) {
        nextRecord.cooldownSessionsRemaining = previous.cooldownSessionsRemaining - 1;
      }

      const resultsForConcept = input.questionResults.filter((result) => result.conceptIds.includes(conceptId));

      for (const result of resultsForConcept) {
        nextRecord = this.applyQuestionResult(nextRecord, result, perConceptCounters, conceptId);
      }

      const counters = perConceptCounters.get(conceptId) ?? { recentNonAttemptsInSession: 0 };
      const recentNonAttemptSpike = hasRecentNonAttemptSpike(
        nextRecord.recentScores,
        counters.recentNonAttemptsInSession,
      );

      const wasMastered = previous?.mastered ?? false;
      const shouldDemote = wasMastered && shouldDemoteFromMastered({ current: nextRecord, recentNonAttemptSpike });
      const shouldPromote = !shouldDemote
        ? shouldPromoteToMastered({
            current: nextRecord,
            previous,
            sessionId: input.sessionId,
            recentNonAttemptSpike,
          })
        : false;

      if (shouldDemote) {
        nextRecord.mastered = false;
        nextRecord.state = 'needs_revision';
        nextRecord.cooldownSessionsRemaining = 0;
      } else if (shouldPromote) {
        nextRecord.mastered = true;
        nextRecord.state = 'mastered';
        nextRecord.cooldownSessionsRemaining = 3;
      } else {
        nextRecord.mastered = false;
        nextRecord.state = mapMasteryState(nextRecord.attempts, nextRecord.rollingAverage, false);
      }

      nextRecord.lastSeenSessionId = input.sessionId;
      nextRecord.lastSeenAt = input.sessionCompletedAt;

      if (!wasMastered && nextRecord.mastered) {
        newlyMastered.push(conceptId);
      }

      if ((previous?.state ?? 'untested') !== 'needs_revision' && nextRecord.state === 'needs_revision') {
        newlyFlaggedForRevision.push(conceptId);
      }

      updatedRecords.push(nextRecord);
    }

    await this.masteryRepository.upsertMany(updatedRecords);

    return {
      userId: input.userId,
      sessionId: input.sessionId,
      updatedConcepts: updatedRecords.map((record) => record.conceptId),
      newlyMastered,
      newlyFlaggedForRevision,
    };
  }

  private createBaseRecord(
    userId: string,
    conceptId: string,
    topic: MasteryUpdateInput['topic'],
    previous: UserConceptMastery | null,
  ): UserConceptMastery {
    return (
      previous ?? {
        userId,
        conceptId,
        topic,
        attempts: 0,
        evaluatedAttempts: 0,
        strongAttempts: 0,
        weakAttempts: 0,
        nonAttemptCount: 0,
        recentScores: [],
        rollingAverage: 0,
        confidence: 0,
        state: 'untested',
        mastered: false,
        lastSeenSessionId: null,
        lastSeenAt: null,
        cooldownSessionsRemaining: 0,
      }
    );
  }

  private applyQuestionResult(
    record: UserConceptMastery,
    result: MasteryQuestionResult,
    perConceptCounters: Map<string, ConceptSessionCounters>,
    conceptId: string,
  ): UserConceptMastery {
    const nextRecord: UserConceptMastery = {
      ...record,
      attempts: record.attempts + 1,
    };

    const counters = perConceptCounters.get(conceptId) ?? { recentNonAttemptsInSession: 0 };
    const status = result.attemptGate.status;

    if (status === 'non_attempt') {
      nextRecord.nonAttemptCount += 1;
      nextRecord.recentScores = appendRecentScore(nextRecord.recentScores, 0);
      counters.recentNonAttemptsInSession += 1;
    } else {
      nextRecord.evaluatedAttempts += 1;
      nextRecord.recentScores = appendRecentScore(nextRecord.recentScores, result.score);

      if (status === 'weak_attempt') {
        nextRecord.weakAttempts += 1;
      }

      if (result.score >= 75) {
        nextRecord.strongAttempts += 1;
      }
    }

    perConceptCounters.set(conceptId, counters);

    nextRecord.rollingAverage = calculateRollingAverage(nextRecord.recentScores);
    nextRecord.confidence = calculateConfidence(nextRecord.rollingAverage, nextRecord.attempts);

    return nextRecord;
  }

  private collectConceptIds(questionResults: MasteryQuestionResult[]): string[] {
    const conceptIds = new Set<string>();

    for (const result of questionResults) {
      for (const conceptId of result.conceptIds) {
        conceptIds.add(conceptId);
      }
    }

    return Array.from(conceptIds).sort();
  }
}
