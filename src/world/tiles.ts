export type Point = { x: number; y: number }
export type Board = { width: number; height: number; cells: string[]; name: string; variantSeed?: number }
export const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
export const key = (p: Point) => `${p.x},${p.y}`
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
export function tile(board: Board, x: number, y: number) { return board.cells[y]?.[x] ?? '#' }
export function floor(board: Board, x: number, y: number) { return ['.', '>', 'B'].includes(tile(board, x, y)) }
export function walkable(board: Board, x: number, y: number) { return floor(board, x, y) && tile(board, x, y) !== 'B' }
export function opaque(board: Board, x: number, y: number) { return ['#', '+'].includes(tile(board, x, y)) }
export function floorVariant(board: Board, x: number, y: number) { return (((x * 31 + y * 17) ^ (board.variantSeed ?? 0)) >>> 0) % 13 }
export function setTile(board: Board, x: number, y: number, value: string) {
  const row = board.cells[y]!
  board.cells[y] = row.slice(0, x) + value + row.slice(x + 1)
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
