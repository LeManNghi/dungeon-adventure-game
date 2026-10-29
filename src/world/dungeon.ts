import { distance, key, setTile, tile, walkable } from './tiles'
import { reachable } from './pathfinding'
import { normalizeSeed, hashSeed, seededRandom } from './random'
import type { Board, Point } from './tiles'

export type Room = { x: number; y: number; w: number; h: number; center: Point }
export type Trap = Point & { phase: number }
export type Loot = Point & { kind: 'ember' | 'heal' }
export type Decoration = Point & { kind: 'skull' | 'barrel' | 'torch' }
export type Dungeon = {
  seed: string; board: Board; rooms: Room[]; start: Point; exit: Point
  enemies: (Point & { kind: 'monster' | 'warrior' })[]
  traps: Trap[]; loot: Loot[]; decorations: Decoration[]
}
export function generateDungeon(input: string): Dungeon {
  const seed = normalizeSeed(input), random = seededRandom(seed)
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
  const board: Board = { width: 45, height: 35, cells: Array.from({ length: 35 }, () => '#'.repeat(45)), name: 'Khu canh gác', variantSeed: hashSeed(seed) }
  const rooms: Room[] = []
  const dig = (x: number, y: number) => setTile(board, x, y, '.')
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const x = 2 + col * 14 + int(0, 2), y = 2 + row * 10 + int(0, 1), w = int(7, 10), h = int(6, 8)
    const room = { x, y, w, h, center: { x: x + Math.floor(w / 2), y: y + Math.floor(h / 2) } }
    rooms.push(room)
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) dig(xx, yy)
  }
  const segment = (a: Point, b: Point) => {
    let x = a.x, y = a.y; dig(x, y)
    while (x !== b.x) { x += Math.sign(b.x - x); dig(x, y) }
    while (y !== b.y) { y += Math.sign(b.y - y); dig(x, y) }
  }
  const connected = new Set<string>()
  const connect = (i: number, j: number) => {
    const edge = [Math.min(i, j), Math.max(i, j)].join('-')
    if (connected.has(edge)) return
    connected.add(edge)
    const a = rooms[Math.min(i, j)]!, b = rooms[Math.max(i, j)]!
    if (Math.abs(i - j) === 1) {
      const mid = Math.floor((a.x + a.w + b.x) / 2)
      segment(a.center, { x: mid, y: a.center.y }); segment({ x: mid, y: a.center.y }, { x: mid, y: b.center.y }); segment({ x: mid, y: b.center.y }, b.center)
    } else {
      const mid = Math.floor((a.y + a.h + b.y) / 2)
      segment(a.center, { x: a.center.x, y: mid }); segment({ x: a.center.x, y: mid }, { x: b.center.x, y: mid }); segment({ x: b.center.x, y: mid }, b.center)
    }
  }
  const adjacent = (i: number) => [i % 3 > 0 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1, i > 2 ? i - 3 : -1, i < 6 ? i + 3 : -1].filter(n => n >= 0)
  const visited = new Set([0]), stack = [0]
  while (stack.length) {
    const current = stack[stack.length - 1]!, choices = adjacent(current).filter(i => !visited.has(i))
    if (!choices.length) { stack.pop(); continue }
    const next = choices[int(0, choices.length - 1)]!
    connect(current, next); visited.add(next); stack.push(next)
  }
  // Two shortcuts make room traversal a choice rather than a single long chain.
  const extras: [number, number][] = []
  for (let i = 0; i < 9; i++) for (const j of adjacent(i)) if (i < j && !connected.has(`${i}-${j}`)) extras.push([i,j])
  for (let i = 0; i < 2 && extras.length; i++) { const [a,b] = extras.splice(int(0,extras.length-1),1)[0]!; connect(a,b) }
  const start = { ...rooms[0]!.center }, steps = reachable(board, start)
  const exitRoom = rooms.reduce((a,b) => steps.get(key(a.center))! > steps.get(key(b.center))! ? a : b)
  const exit = { ...exitRoom.center }; setTile(board, exit.x, exit.y, '>')
  const occupied = new Set([key(start), key(exit)])
  const decorations: Decoration[] = []
  rooms.forEach((r, i) => {
    if (tile(board, r.center.x, r.y - 1) === '#') decorations.push({ x: r.center.x, y: r.y - 1, kind: 'torch' })
    if (i && i % 3 === 0) {
      const p = { x: r.x + 1, y: r.y + 1 }; setTile(board, p.x, p.y, 'B'); occupied.add(key(p)); decorations.push({ ...p, kind: 'barrel' })
    }
  })
  function place(room: Room, minFromStart = 0): Point {
    const candidates: Point[] = []
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const p = { x,y }
      if (walkable(board,x,y) && !occupied.has(key(p)) && distance(p,start) >= minFromStart) candidates.push(p)
    }
    if (!candidates.length) throw new Error(`Không có vị trí sinh hợp lệ: ${seed}`)
    const p = candidates[int(0,candidates.length-1)]!; occupied.add(key(p)); return p
  }
  const enemies = rooms.slice(1).map((r,i) => ({ ...place(r,8), kind: (i % 3 === 2 ? 'warrior' : 'monster') as 'warrior' | 'monster' }))
  const loot: Loot[] = [
    { ...place(rooms[4]!), kind: 'ember' },
    { ...place(rooms[2]!), kind: 'heal' },
    { ...place(rooms[6]!), kind: 'heal' },
  ]
  const traps: Trap[] = [1,5,7].map(i => ({ ...place(rooms[i]!), phase: 0 }))
  rooms.forEach((r,i) => { if (i % 2) decorations.push({ ...place(r), kind: 'skull' }) })
  const dungeon = { seed, board, rooms, start, exit, enemies, traps, loot, decorations }
  const errors = validateDungeon(dungeon)
  if (errors.length) throw new Error(`Dungeon không hợp lệ (${seed}): ${errors.join('; ')}`)
  return dungeon
}
export function validateDungeon(d: Dungeon) {
  const errors: string[] = [], steps = reachable(d.board,d.start)
  if (!steps.has(key(d.exit))) errors.push('lối ra không tiếp cận được')
  for (let y = 0; y < d.board.height; y++) for (let x = 0; x < d.board.width; x++) {
    if ((x === 0 || y === 0 || x === d.board.width-1 || y === d.board.height-1) && tile(d.board,x,y) !== '#') errors.push(`hở biên ${x},${y}`)
    if (walkable(d.board,x,y) && !steps.has(`${x},${y}`)) errors.push(`vùng tách rời ${x},${y}`)
  }
  const occupied = new Set<string>()
  for (const p of [d.start,d.exit,...d.enemies,...d.loot,...d.traps,...d.decorations]) {
    if (occupied.has(key(p))) errors.push(`sinh trùng ô ${key(p)}`)
    occupied.add(key(p))
    if ('kind' in p && p.kind === 'torch') { if (tile(d.board,p.x,p.y) !== '#') errors.push('đuốc không nằm trên tường'); continue }
    if ('kind' in p && p.kind === 'barrel') { if (tile(d.board,p.x,p.y) !== 'B') errors.push('thùng thiếu va chạm'); continue }
    if (!steps.has(key(p))) errors.push(`vật thể không tiếp cận được ${key(p)}`)
  }
  return errors
}
