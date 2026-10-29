import type { Direction } from '../data/sprites'
import type { Point } from '../world/tiles'

export type Actor = Point & { id: number; kind: 'player' | 'monster' | 'warrior' | 'ranger' | 'boss'; hp: number; maxHp: number; facing: Direction; intent: Point[]; recovery: boolean; lastSeen?: Point; searchTurns?: number; attackType?:'sweep'|'shot'|'charge'|'slam'; enraged?:boolean; specialCounter?:number; basicUsed?:boolean; rewarded?:boolean }
export type Hit = Point & { value: string; color: string }
export type Action = { type: 'move'|'attack'; dx: number; dy: number } | { type: 'wait' } | { type: 'interact' } | {type:'equip'|'drop';uid:number} | {type:'use';slot:number}
export type GameOptions = { scenario?: 'arena' | 'dungeon'; seed?: string }
