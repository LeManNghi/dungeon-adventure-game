import { directions, key, same, walkable } from './tiles'
import type { Board, Point } from './tiles'

export function reachable(board: Board, origin: Point) {
  const steps = new Map<string, number>()
  if (!walkable(board, origin.x, origin.y)) return steps
  const queue = [origin]; steps.set(key(origin), 0)
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!
    for (const d of directions) {
      const n = { x: p.x + d.x, y: p.y + d.y }
      if (!walkable(board, n.x, n.y) || steps.has(key(n))) continue
      steps.set(key(n), steps.get(key(p))! + 1); queue.push(n)
    }
  }
  return steps
}
export function nextStep(board: Board, start: Point, target: Point, blocked: Set<string>): Point | undefined {
  const queue: { p: Point; first?: Point }[] = [{ p: start }]
  const seen = new Set([key(start)])
  for (let i = 0; i < queue.length; i++) {
    const entry = queue[i]!
    for (const d of directions) {
      const p = { x: entry.p.x + d.x, y: entry.p.y + d.y }
      if (!walkable(board, p.x, p.y) || seen.has(key(p)) || blocked.has(key(p))) continue
      const first = entry.first ?? p
      if (same(p, target)) return first
      seen.add(key(p)); queue.push({ p, first })
    }
  }
}
