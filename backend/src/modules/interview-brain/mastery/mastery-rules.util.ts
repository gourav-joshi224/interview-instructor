import { MasteryState, UserConceptMastery } from './mastery-updater.types';

export interface PromotionRuleInput {
  current: UserConceptMastery;
  previous: UserConceptMastery | null;
  sessionId: string;
  recentNonAttemptSpike: boolean;
}

export interface DemotionRuleInput {
  current: UserConceptMastery;
  recentNonAttemptSpike: boolean;
}

/**
 * Promotion is intentionally strict and deterministic:
 * - at least two strong attempts
 * - rolling average at or above 75
 * - no recent non-attempt spike
 *
 * We only persist `lastSeenSessionId` today, so true "strong across 2 sessions"
 * validation is a future enhancement once richer session history is stored.
 * For now we use the available signal: a previous different session counts as
 * cross-session evidence, otherwise we allow promotion to avoid blocking mastery forever.
 */
export const shouldPromoteToMastered = ({
  current,
  previous,
  sessionId,
  recentNonAttemptSpike,
}: PromotionRuleInput): boolean => {
  if (current.strongAttempts < 2 || current.rollingAverage < 75 || recentNonAttemptSpike) {
    return false;
  }

  if (!previous?.lastSeenSessionId) {
    return true;
  }

  return previous.lastSeenSessionId !== sessionId;
};

/**
 * Demotion is triggered by repeated poor recent performance or loss of consistency:
 * - trailing two scores are both below 45
 * - rolling average falls below 60
 * - repeated recent non-attempts are detected
 */
export const shouldDemoteFromMastered = ({
  current,
  recentNonAttemptSpike,
}: DemotionRuleInput): boolean => {
  const lastTwoScores = current.recentScores.slice(-2);
  const twoRecentFailures = lastTwoScores.length === 2 && lastTwoScores.every((score) => score < 45);

  return twoRecentFailures || current.rollingAverage < 60 || recentNonAttemptSpike;
};

/**
 * Recent non-attempt spikes are approximated from trailing zero scores because the
 * persisted record does not yet keep per-attempt status history. This keeps the rule
 * deterministic now and can be upgraded later once richer history is stored.
 */
export const hasRecentNonAttemptSpike = (recentScores: number[], recentNonAttemptsInSession: number): boolean => {
  const trailingZeroScores = recentScores.slice(-2).filter((score) => score === 0).length;
  return recentNonAttemptsInSession >= 2 || trailingZeroScores >= 2;
};

export const mapMasteryState = (
  attempts: number,
  rollingAverage: number,
  mastered: boolean,
): MasteryState => {
  if (attempts === 0) {
    return 'untested';
  }

  if (mastered) {
    return 'mastered';
  }

  if (rollingAverage < 45) {
    return 'needs_revision';
  }

  if (rollingAverage < 60) {
    return 'learning';
  }

  return 'improving';
};
