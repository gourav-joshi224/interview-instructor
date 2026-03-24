const EXPLICIT_NON_ATTEMPT_PHRASES: readonly string[] = [
  'i dont know',
  'i don t know',
  'dont know',
  'no idea',
  'idk',
  'skip',
  'pass',
  'not sure',
  'i have no clue',
  'i cannot answer',
  'cannot answer',
];

export const isExplicitNonAttempt = (normalizedAnswer: string): boolean => {
  if (!normalizedAnswer) {
    return false;
  }

  const paddedAnswer = ` ${normalizedAnswer} `;

  return EXPLICIT_NON_ATTEMPT_PHRASES.some((phrase: string): boolean => {
    const paddedPhrase = ` ${phrase} `;
    return normalizedAnswer === phrase || paddedAnswer.includes(paddedPhrase);
  });
};
