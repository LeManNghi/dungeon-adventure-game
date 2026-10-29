import type { Actor } from '../game/types'
import { balance } from './balance'
export const enemyNames = {player:'Bạn',monster:'Sinh vật',warrior:'Lính canh',ranger:'Lính nỏ',boss:'Thú Vương Tàn Hỏa'}
export function makeEnemy(kind: Exclude<Actor['kind'],'player'>, id:number, x:number, y:number, floor:number): Actor {
  const hp=kind==='boss'?balance.bossHp:(kind==='warrior'?20:kind==='ranger'?14:10)+(floor-1)*3
  return {id,kind,x,y,hp,maxHp:hp,facing:'front',intent:[],recovery:false,enraged:false,specialCounter:0}
}
