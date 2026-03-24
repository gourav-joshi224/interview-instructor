export const normalizeText = (input: string): string => {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

export const tokenizeNormalizedText = (normalizedText: string): string[] => {
  if (!normalizedText) {
    return [];
  }

  return normalizedText.split(' ').filter((token: string): boolean => token.length > 0);
};
