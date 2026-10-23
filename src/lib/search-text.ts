export function foldSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function compactSearch(value: string) {
  return foldSearch(value).replace(/[^a-z0-9]+/g, "");
}

export function queryMatches(haystack: string, query: string) {
  const tokens = foldSearch(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const folded = foldSearch(haystack);
  const compact = compactSearch(folded);
  return tokens.every((token) => {
    if (folded.includes(token)) return true;
    const squashed = compactSearch(token);
    return squashed.length > 0 && compact.includes(squashed);
  });
}
