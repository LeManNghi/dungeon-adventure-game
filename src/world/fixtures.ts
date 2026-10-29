import { setTile } from './tiles'
import type { Board } from './tiles'

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
