import { key, opaque } from './tiles'
import type { Board, Point } from './tiles'

export function lineOfSight(board: Board, a: Point, b: Point, includeOpaqueTarget = false) {
  let x = a.x, y = a.y
  const dx = Math.abs(b.x - x), dy = Math.abs(b.y - y)
  const sx = x < b.x ? 1 : -1, sy = y < b.y ? 1 : -1
  let err = dx - dy
  while (x !== b.x || y !== b.y) {
    const oldX = x, oldY = y
    const e = err * 2
    if (e > -dy) { err -= dy; x += sx }
    if (e < dx) { err += dx; y += sy }
    if (oldX !== x && oldY !== y && opaque(board, oldX, y) && opaque(board, x, oldY)) return false
    if (opaque(board, x, y) && !(includeOpaqueTarget && x === b.x && y === b.y)) return false
  }
  return true
}
export function fieldOfView(board: Board, origin: Point, radius = 7) {
  const visible = new Set<string>([key(origin)])
  for (let y = Math.max(0, origin.y - radius); y <= Math.min(board.height - 1, origin.y + radius); y++) {
    for (let x = Math.max(0, origin.x - radius); x <= Math.min(board.width - 1, origin.x + radius); x++) {
      if ((x - origin.x) ** 2 + (y - origin.y) ** 2 <= radius ** 2 && lineOfSight(board, origin, { x, y }, true)) visible.add(key({ x, y }))
    }
  }
  return visible
}
