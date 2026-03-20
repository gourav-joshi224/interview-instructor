const MAX_RECENT_SCORES = 5;

export const appendRecentScore = (recentScores: number[], nextScore: number): number[] => {
  const normalizedScore = Number.isFinite(nextScore) ? Math.max(0, Math.min(100, nextScore)) : 0;
  return [...recentScores, normalizedScore].slice(-MAX_RECENT_SCORES);
};

export const calculateRollingAverage = (recentScores: number[]): number => {
  if (recentScores.length === 0) {
    return 0;
  }

  const total = recentScores.reduce((sum, score) => sum + score, 0);
  return Number((total / recentScores.length).toFixed(2));
};
