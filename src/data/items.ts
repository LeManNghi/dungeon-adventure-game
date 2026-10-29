import { balance } from './balance'
export type WeaponKind = 'sword' | 'spear' | 'axe'
export type ItemId = WeaponKind | 'armor' | 'potion'
export type Item = { uid: number; id: ItemId; kind: 'weapon'|'armor'|'potion'; name: string; tier: number; power: number; quantity: number }
export const INVENTORY_LIMIT = 8
export const itemNames: Record<ItemId,string> = { sword:'Kiếm',spear:'Giáo',axe:'Rìu',armor:'Giáp',potion:'Bình máu' }
export function makeItem(id: ItemId, tier: number, uid: number): Item {
  const kind = id === 'potion' ? 'potion' : id === 'armor' ? 'armor' : 'weapon'
  const bonus = id === 'axe' ? 2 : id === 'spear' ? -1 : 0
  return {uid,id,kind,tier,power:kind==='weapon'?bonus+tier*balance.weaponTierPower:kind==='armor'?1+tier:0,quantity:1,name:`${itemNames[id]}${kind==='potion'?'':tier===2?' hư không':tier===1?' hoàng kim':' cũ'}`}
}
export const shopOffers: {id:ItemId; tier:number; price:number}[] = [
  {id:'potion',tier:0,price:10},{id:'spear',tier:1,price:18},{id:'axe',tier:1,price:18},{id:'armor',tier:1,price:16},
]
export const weaponDescriptions: Record<WeaponKind,string> = {
  sword:'Đánh một ô sát bên. Không cần hồi sức.',
  spear:'Đánh thẳng tối đa 2 ô, dừng ở mục tiêu đầu. Shift + hướng để đâm xa.',
  axe:'Quét 3 ô phía trước; sau đòn đánh phải chờ một lượt để hồi sức.',
}
