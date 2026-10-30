import type { WeaponKind } from './items'
import type { Rect } from './sprites'

export type WeaponShape = 'sword' | 'hammer' | 'mace' | 'scythe'
export type WeaponVariant = 0 | 1 | 2 | 3 | 4

// The upright atlases are four columns by five rows of independent 16px cells.
// In particular, the handle at row 15 must never include pixels from row 16.
export const weaponShapes = {
  sword: {column:0,grip:[7,14]},
  hammer: {column:1,grip:[8,14]},
  mace: {column:2,grip:[8,14]},
  scythe: {column:3,grip:[11,14]},
} as const

export function weaponSprite(shape:WeaponShape,tier:number,variant:WeaponVariant=0) {
  const definition=weaponShapes[shape]
  return {
    path:`Weapons/Weapons_${tier===2?'purple':tier===1?'gold':'normal'}_up.png`,
    rect:[definition.column*16,variant*16,16,16] as Rect,
    grip:variant>0&&(shape==='mace'||shape==='scythe')?[7,14] as const:definition.grip,
  }
}

// Preserve the artwork associated with the existing three combat profiles.
// Gameplay names/ranges are separate from the four shapes present in the pack.
const profileShapes:Record<WeaponKind,WeaponShape>={sword:'sword',spear:'hammer',axe:'mace'}
export function equippedWeaponSprite(kind:WeaponKind,tier:number) {
  return weaponSprite(profileShapes[kind],tier)
}
