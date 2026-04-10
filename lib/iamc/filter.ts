// Design Ref: §4.4 — IAMC variable pattern matching
// Plan SC-03: data-driven filtering means new variables auto-appear without code changes

import type { IamcRow } from './types';

/**
 * Filter IamcRows by a variable name pattern.
 *
 * Pattern syntax:
 *   - '|' is a literal separator (matches IAMC variable naming convention)
 *   - '*' is a wildcard that matches an entire segment between separators
 *
 * Examples:
 *   "Capacity|Steel|*"              → matches Capacity|Steel|BF-BOF, EAF, DRI-H2
 *   "Capacity|Steel|BF-BOF"         → exact match only
 *   "*|Steel|*"                     → matches any Capacity|Steel|X or Emissions|Steel|X
 */
export function filterByVariablePattern(
  rows: IamcRow[],
  pattern: string,
): IamcRow[] {
  const regex = patternToRegex(pattern);
  return rows.filter((r) => regex.test(r.variable));
}

function patternToRegex(pattern: string): RegExp {
  // Escape regex special chars except '*', then replace '*' with segment matcher.
  // Note: '|' must be escaped (it's regex alternation); '*' is replaced, not escaped.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const body = escaped.replace(/\*/g, '[^|]+');
  return new RegExp(`^${body}$`);
}
