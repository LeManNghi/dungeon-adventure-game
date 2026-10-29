import { INVENTORY_LIMIT } from '../data/items'
import type { Item } from '../data/items'
export function storeItem(inventory: Item[], item: Item): boolean {
  if(item.kind==='potion') {
    const stack=inventory.find(i=>i.kind==='potion' && i.quantity<3)
    if(stack) {stack.quantity++;return true}
  }
  if(inventory.length>=INVENTORY_LIMIT)return false
  inventory.push(item);return true
}
