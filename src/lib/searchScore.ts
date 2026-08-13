const SCORE_EXACT_WORD = 1
const SCORE_WORD_PREFIX = 0.85
const SCORE_ACRONYM = 0.7
const SCORE_SUBSTRING = 0.55
const SCORE_TYPO = 0.45
const SCORE_FUZZY = 0.2

const SEPARATORS = /[/\-_.]+/g

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

function wordsOf(input: string): string[] {
  const words = normalize(input).replace(SEPARATORS, " ").trim().split(/\s+/u)
  return words[0] ? words : []
}

function compactOf(input: string): string {
  return normalize(input).replace(SEPARATORS, "").replace(/\s+/gu, "")
}

function isSubsequence(needle: string, haystack: string): boolean {
  let index = 0
  for (const character of haystack) {
    if (character !== needle[index]) continue
    index += 1
    if (index === needle.length) return true
  }
  return false
}

function withinOneEdit(left: string, right: string): boolean {
  const lengthDelta = left.length - right.length
  if (Math.abs(lengthDelta) > 1 || left === right) return lengthDelta === 0 && left === right

  let shorter = left
  let longer = right
  if (lengthDelta > 0) {
    shorter = right
    longer = left
  }

  let index = 0
  while (index < shorter.length && shorter[index] === longer[index]) index += 1
  if (index === shorter.length) return longer.length - shorter.length === 1
  if (shorter.length === longer.length) {
    const transposed =
      index + 1 < shorter.length &&
      shorter[index] === longer[index + 1] &&
      shorter[index + 1] === longer[index] &&
      shorter.slice(index + 2) === longer.slice(index + 2)
    return transposed || shorter.slice(index + 1) === longer.slice(index + 1)
  }
  return shorter.slice(index) === longer.slice(index + 1)
}

function scoreToken(token: string, words: string[], compact: string, acronym: string): number {
  let best = 0

  for (const word of words) {
    if (word === token) return SCORE_EXACT_WORD
    if (word.startsWith(token)) best = Math.max(best, SCORE_WORD_PREFIX)
    if (word.includes(token)) best = Math.max(best, SCORE_SUBSTRING)
    if (token.length >= 4 && withinOneEdit(token, word)) best = Math.max(best, SCORE_TYPO)
    if (token.length >= 3 && isSubsequence(token, word)) best = Math.max(best, SCORE_FUZZY)
  }

  if (acronym === token || (token.length >= 2 && acronym.startsWith(token))) {
    best = Math.max(best, SCORE_ACRONYM)
  }
  if (compact.includes(token)) best = Math.max(best, SCORE_SUBSTRING)

  return best
}

function scoreCandidate(candidate: string, search: string): number {
  const tokens = wordsOf(search)
  if (tokens.length === 0) return 1

  const words = wordsOf(candidate)
  const compact = compactOf(candidate)
  const acronym = words.map((word) => word[0] ?? "").join("")
  let total = 0

  for (const token of tokens) {
    const score = scoreToken(token, words, compact, acronym)
    if (score === 0) return 0
    total += score
  }

  return total
}

export function commandFilter(value: string, search: string, keywords: readonly string[] = []): number {
  if (!search.trim()) return 1

  let best = scoreCandidate(value, search)
  for (const keyword of keywords) {
    best = Math.max(best, scoreCandidate(keyword, search))
  }
  if (keywords.length > 0) {
    best = Math.max(best, scoreCandidate(`${value} ${keywords.join(" ")}`, search))
  }
  return best
}
