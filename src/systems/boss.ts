import { distance, walkable } from '../world/tiles'
import type { Board, Point } from '../world/tiles'
import type { Actor } from '../game/types'
import { canEvade } from './combat'
export function planBossAttack(board:Board,boss:Actor,player:Point,occupied:Set<string>) {
  const aligned=boss.x===player.x||boss.y===player.y
  if(distance(boss,player)>4)return
  const charge=aligned && (distance(boss,player)>1 || (boss.specialCounter??0)%2===0)
  let intent:Point[]=[]
  if(charge) {
    const dx=Math.sign(player.x-boss.x),dy=Math.sign(player.y-boss.y)
    for(let n=1;n<=4;n++) {const p={x:boss.x+dx*n,y:boss.y+dy*n};if(!walkable(board,p.x,p.y))break;intent.push(p)}
  } else if(distance(boss,player)===1) intent=[{x:boss.x+1,y:boss.y},{x:boss.x-1,y:boss.y},{x:boss.x,y:boss.y+1},{x:boss.x,y:boss.y-1}].filter(p=>walkable(board,p.x,p.y))
  if(!intent.length || !canEvade(board,player,intent,occupied))return
  return {type:charge?'charge' as const:'slam' as const,intent}
}
