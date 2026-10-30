import { APP_CONFIG } from '../config/appConfig';
import type { ProtocolSection } from '../types';
import { containsTerm, normalize, tokenize } from './text';

export interface RetrievalHit {
  section: ProtocolSection;
  score: number;
  matchedTerms: string[];
}

/** Scores every section by weighted keyword hits and returns hits sorted best-first. */
export function searchProtocols(query: string, sections: ProtocolSection[]): RetrievalHit[] {
  const normalized = normalize(query);
  const tokens = tokenize(normalized);
  return sections
    .map((section) => {
      const hits = section.keywords.filter(([term]) => containsTerm(normalized, tokens, term));
      return {
        section,
        score: hits.reduce((sum, [, weight]) => sum + weight, 0),
        matchedTerms: hits.map(([term]) => term),
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Best hit, but only if it clears the configured threshold; otherwise null (refuse). */
export function bestSupportedHit(
  query: string,
  sections: ProtocolSection[],
  minScore: number = APP_CONFIG.retrievalMinScore,
): RetrievalHit | null {
  const [top] = searchProtocols(query, sections);
  return top && top.score >= minScore ? top : null;
}
