export type Point = { x: number; y: number }
export type Board = { width: number; height: number; cells: string[]; name: string }
export const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
export const key = (p: Point) => `${p.x},${p.y}`
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
export function tile(board: Board, x: number, y: number) { return board.cells[y]?.[x] ?? '#' }
export function floor(board: Board, x: number, y: number) { return tile(board, x, y) === '.' || tile(board, x, y) === '>' }
export function walkable(board: Board, x: number, y: number) { return floor(board, x, y) }
export function setTile(board: Board, x: number, y: number, value: string) {
  const row = board.cells[y]!
  board.cells[y] = row.slice(0, x) + value + row.slice(x + 1)
}
function blank(name: string, width = 27, height = 19): Board {
  return { name, width, height, cells: Array.from({ length: height }, () => '#'.repeat(width)) }
}
function carve(b: Board, x: number, y: number, w: number, h: number) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setTile(b, xx, yy, '.')
}
export function arena() {
  const b = blank('Phòng canh gác')
  carve(b, 2, 2, 23, 15)
  for (const [x, y] of [[10, 6], [16, 6], [10, 12], [16, 12]]) setTile(b, x!, y!, '#')
  return b
}
export const fixtureNames = ['Góc & phòng chữ L', 'Hành lang · ngã T · ngã tư', 'Cột & cửa sát góc', 'Biên bản đồ']
export function fixture(index: number) {
  const b = blank(fixtureNames[index]!)
  if (index === 0) {
    carve(b, 2, 2, 8, 6); carve(b, 2, 8, 5, 8)
    carve(b, 13, 2, 11, 14); carve(b, 17, 6, 7, 10)
    for (let y = 6; y < 12; y++) for (let x = 17; x < 24; x++) setTile(b, x, y, '#')
  } else if (index === 1) {
    carve(b, 3, 3, 7, 5); carve(b, 17, 3, 7, 5)
    carve(b, 9, 5, 9, 1); carve(b, 13, 5, 1, 11)
    carve(b, 6, 12, 15, 1); carve(b, 10, 13, 1, 3)
    carve(b, 3, 15, 8, 2); carve(b, 18, 11, 6, 6)
  } else if (index === 2) {
    carve(b, 2, 2, 23, 15)
    for (const [x,y] of [[6,6],[13,6],[20,6]]) setTile(b, x!, y!, '#')
    for (let x = 2; x < 25; x++) setTile(b, x, 10, '#')
    setTile(b, 3, 10, '+'); setTile(b, 21, 10, '+'); setTile(b, 23, 15, '>')
  } else {
    carve(b, 0, 0, 11, 7); carve(b, 0, 6, 5, 13)
    carve(b, 16, 0, 11, 7); carve(b, 20, 6, 7, 13)
    carve(b, 0, 15, 27, 4)
  }
  return b
}
// Bits N/E/S/W identify exposed wall sides. Diagonal-only floor cuts a notch.
export function wallShape(board: Board, x: number, y: number) {
  let edges = 0
  directions.forEach((d, i) => { if (floor(board, x + d.x, y + d.y)) edges |= 1 << i })
  const notches: number[] = []
  const diagonals = [[1,-1], [1,1], [-1,1], [-1,-1]]
  diagonals.forEach(([dx,dy], i) => {
    const a = i, b = (i + 1) % 4
    if (!(edges & (1 << a)) && !(edges & (1 << b)) && floor(board, x + dx!, y + dy!)) notches.push(i)
  })
  const pairs = [3,6,12,9].filter(mask => (edges & mask) === mask).length
  return { edges, notches, role: edges === 15 ? 'cột' : pairs ? 'góc ngoài' : notches.length ? 'góc trong' : edges ? 'cạnh' : 'khối' }
}
export function lineOfSight(board: Board, a: Point, b: Point) {
  let x = a.x, y = a.y
  const dx = Math.abs(b.x - x), dy = Math.abs(b.y - y)
  const sx = x < b.x ? 1 : -1, sy = y < b.y ? 1 : -1
  let err = dx - dy
  while (x !== b.x || y !== b.y) {
    const e = err * 2
    if (e > -dy) { err -= dy; x += sx }
    if (e < dx) { err += dx; y += sy }
    if (!walkable(board, x, y)) return false
  }
  return true
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
