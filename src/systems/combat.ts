import { lineOfSight } from '../world/visibility'
import { directions, key, walkable } from '../world/tiles'
import type { Board, Point } from '../world/tiles'
import type { WeaponKind } from '../data/items'
export function weaponArea(board:Board,origin:Point,dx:number,dy:number,weapon:WeaponKind): Point[] {
  if(Math.abs(dx)+Math.abs(dy)!==1)return []
  const points:Point[]=[]
  if(weapon==='axe') {
    for(const offset of [-1,0,1])points.push({x:origin.x+dx+(dy?offset:0),y:origin.y+dy+(dx?offset:0)})
  } else {
    for(let n=1;n<=(weapon==='spear'?2:1);n++) {
      const p={x:origin.x+dx*n,y:origin.y+dy*n}
      if(!walkable(board,p.x,p.y))break
      points.push(p)
    }
  }
  return points.filter(p=>walkable(board,p.x,p.y)&&lineOfSight(board,origin,p))
}
export function canEvade(board:Board,player:Point,intent:Point[],occupied:Set<string>) {
  const danger=new Set(intent.map(key))
  return directions.some(d=>{const p={x:player.x+d.x,y:player.y+d.y};return walkable(board,p.x,p.y)&&!danger.has(key(p))&&!occupied.has(key(p))})
}
