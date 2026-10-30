/** Lower-case, strip punctuation, collapse spaces. Keeps Devanagari letters and marks. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(normalized: string): string[] {
  return normalized === '' ? [] : normalized.split(' ');
}

/**
 * Multi-word terms match as a phrase prefix; single words match a token by prefix
 * (so "bleed" covers "bleeding"). Terms of 3 chars or fewer must match exactly to
 * avoid accidental hits such as "ors" inside "doctors".
 */
export function containsTerm(normalized: string, tokens: string[], term: string): boolean {
  if (term.includes(' ')) return ` ${normalized}`.includes(` ${term}`);
  if (term.length <= 3) return tokens.includes(term);
  return tokens.some((token) => token.startsWith(term));
}
