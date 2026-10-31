import { INVENTORY_LIMIT } from '../data/items'
import type { Item } from '../data/items'

export const POTION_STACK_LIMIT = 99

export function storeItem(inventory: Item[], item: Item): boolean {
  if(item.kind==='potion') {
    const stack=inventory.find(i=>i.kind==='potion' && i.quantity<POTION_STACK_LIMIT)
    if(stack) {stack.quantity++;return true}
  }
  if(inventory.length>=INVENTORY_LIMIT)return false
  inventory.push(item);return true
}
