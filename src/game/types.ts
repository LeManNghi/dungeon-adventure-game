import type { Direction } from '../data/sprites'
import type { Point } from '../world/tiles'

export type Actor = Point & { id: number; kind: 'player' | 'monster' | 'warrior'; hp: number; maxHp: number; facing: Direction; intent: Point[]; recovery: boolean; lastSeen?: Point; searchTurns?: number }
export type Hit = Point & { value: string; color: string }
export type Action = { type: 'move'; dx: number; dy: number } | { type: 'wait' } | { type: 'interact' }
export type GameOptions = { scenario?: 'arena' | 'dungeon'; seed?: string }
