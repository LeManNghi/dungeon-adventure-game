import manifest from './asset-manifest.json'

export type Direction = 'front' | 'back' | 'left' | 'right'
export type ActorKind = 'player' | 'monster' | 'warrior' | 'ranger' | 'boss'
export type Rect = readonly [number, number, number, number]
export const TILE = 16
export const files = manifest
export const crops = {
  floor: [16, 112, 16, 16],
  floorDust: [0, 112, 16, 16],
  floorCrack: [32, 112, 16, 16],
  wall: [16, 16, 16, 16],
  top: [0, 13, 16, 3],
  bottom: [16, 41, 16, 3],
  left: [65, 17, 3, 16],
  right: [92, 17, 3, 16],
  stairs: [192, 112, 16, 16],
  arch: [64, 96, 48, 64],
  barrel: [0, 0, 16, 24],
  skull: [64, 0, 16, 16],
  coin: [0, 0, 16, 16],
  heart: [0, 0, 16, 16],
  potion: [48, 16, 16, 16],
  sword: [75, 84, 15, 6],
} as const satisfies Record<string, Rect>

export function actorSheet(kind: ActorKind, direction: Direction) {
  if(kind==='ranger')kind='warrior'
  if (kind === 'player') return `Characters/Player/Player_walk_${direction === 'back' ? 'behind' : direction}.png`
  if (kind === 'warrior') return `Characters/Warrior/warrior_walk_${direction === 'back' ? 'behind' : direction}.png`
  return `Characters/Monster/${kind === 'boss' ? 'BossMonster' : 'Monster'}_walk_${direction}.png`
}
export function actorMeta(kind: ActorKind, direction: Direction) {
  if(kind==='ranger')kind='warrior'
  const size = kind === 'player' ? 17 : kind === 'warrior' ? 22 : 16
  const frames = kind === 'player' ? (direction === 'front' ? 7 : 8) : kind === 'warrior' ? (direction === 'left' || direction === 'right' ? 8 : 12) : 4
  return { size, frames, anchor: [size / 2, size - 1] as const }
}
