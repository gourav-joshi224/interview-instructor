export type ScoreEntry = {
  date: string;
  score: number;
  difficulty: string;
  experience: string;
};

export type RetryParams = {
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: string;
  focusConcepts: string[];
  sourceWeakAreas: string[];
};

export function getScoresKey(topic: string): string {
  return `ig_scores_${topic.toLowerCase().replace(/ /g, "_")}`;
}

export function saveSessionScore(topic: string, entry: ScoreEntry): void {
  try {
    const storageKey = getScoresKey(topic);
    const storedEntries = localStorage.getItem(storageKey);
    const parsedEntries = storedEntries ? JSON.parse(storedEntries) : [];
    const existingEntries = Array.isArray(parsedEntries) ? parsedEntries : [];
    const nextEntries = [...existingEntries, entry].slice(-10);

    localStorage.setItem(storageKey, JSON.stringify(nextEntries));
  } catch {
    // Ignore localStorage persistence failures.
  }
}

export function getSessionScores(topic: string): ScoreEntry[] {
  try {
    const storageKey = getScoresKey(topic);
    const storedEntries = localStorage.getItem(storageKey);
    const parsedEntries = storedEntries ? JSON.parse(storedEntries) : [];

    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}
