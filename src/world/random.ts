export function normalizeSeed(seed: string) { return seed.trim().slice(0, 64) || 'tan-hoa-01' }
export function hashSeed(seed: string) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  return hash >>> 0
}
export function seededRandom(seed: string) {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let n = Math.imul(state ^ (state >>> 15), 1 | state)
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
}
