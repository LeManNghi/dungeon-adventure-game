import { enemyNames } from '../data/enemies'
import type { Game } from '../game/Game'
import type { Actor } from '../game/types'
import type { Point } from '../world/tiles'
import { directions, distance, key, same, walkable } from '../world/tiles'
import { nextStep } from '../world/pathfinding'
import { lineOfSight } from '../world/visibility'
import { planBossAttack } from './boss'

export function face(dx:number,dy:number) {return dx>0?'right' as const:dx<0?'left' as const:dy<0?'back' as const:'front' as const}
function blockers(g:Game,e:Actor) {return new Set(g.enemies.filter(a=>a!==e&&a.hp>0).map(key))}
function moveToward(g:Game,e:Actor,p:Point) {
  const step=nextStep(g.board,e,p,blockers(g,e))
  if(step&&!same(step,g.player)) {e.facing=face(step.x-e.x,step.y-e.y);Object.assign(e,step)}
}
function resolve(g:Game,e:Actor) {
  const intent=e.intent,type=e.attackType;e.intent=[];e.attackType=undefined;e.recovery=true
  if(type==='charge') {
    for(const p of intent) {
      if(!walkable(g.board,p.x,p.y)||blockers(g,e).has(key(p)))break
      g.hits.push({...p,value:'✦',color:'#ffb67b'})
      if(same(p,g.player)) {g.damage(g.player,9,'Thú Vương húc');break}
      Object.assign(e,p)
    }
  } else if(type==='shot') {
    for(const p of intent) {
      if(!walkable(g.board,p.x,p.y))break
      g.hits.push({...p,value:'·',color:'#efbf6b'})
      const hit=[g.player,...g.enemies.filter(a=>a!==e&&a.hp>0)].find(a=>same(a,p))
      if(hit) {g.damage(hit,4+g.floor-1,'Lính nỏ bắn');break}
    }
  } else {
    const strike=intent.filter(p=>walkable(g.board,p.x,p.y))
    strike.forEach(p=>g.hits.push({...p,value:'✦',color:'#ffb67b'}))
    if(strike.some(p=>same(p,g.player)))g.damage(g.player,type==='slam'?7:6+g.floor-1,`${enemyNames[e.kind]} tung đòn mạnh`)
  }
  if(g.canSee(e))g.message(`${e.kind==='boss'?'Thú Vương':'Địch'} tung đòn và đang hồi sức.`)
}
function bossTurn(g:Game,e:Actor) {
  if(!g.bossActive)return
  if(!e.enraged&&e.hp<=e.maxHp/2) {
    e.enraged=true;e.intent=[];e.attackType=undefined;e.recovery=false
    g.message('Thú Vương cuồng nộ! Đòn đặc biệt sẽ xuất hiện thường xuyên hơn.');return
  }
  if(e.intent.length) {resolve(g,e);return}
  if(e.recovery) {e.recovery=false;return}
  const adjacent=distance(e,g.player)===1
  if(!e.enraged&&adjacent&&(e.specialCounter??0)%2===1&&!e.basicUsed) {
    e.basicUsed=true;g.damage(g.player,5,'Thú Vương đánh thường');return
  }
  const occupied=blockers(g,e);occupied.add(key(e))
  const plan=planBossAttack(g.board,e,g.player,occupied)
  if(plan) {
    e.intent=plan.intent;e.attackType=plan.type;e.specialCounter=(e.specialCounter??0)+1;e.basicUsed=false
    e.facing=face(g.player.x-e.x,g.player.y-e.y)
    g.emit({type:'telegraph',visible:g.canSee(e)})
    g.message(plan.type==='charge'?'Thú Vương cúi sừng — tránh đường húc!':'Thú Vương chuẩn bị đập đất — rời các ô đỏ!')
  } else moveToward(g,e,g.player)
}
export function takeEnemyTurn(g:Game,e:Actor) {
  if(e.kind==='boss') {bossTurn(g,e);return}
  if(e.intent.length) {resolve(g,e);return}
  if(e.recovery) {e.recovery=false;return}
  const sees=distance(e,g.player)<=8&&lineOfSight(g.board,e,g.player)
  if(sees) {e.lastSeen={x:g.player.x,y:g.player.y};e.searchTurns=4}
  else if(e.searchTurns&&e.lastSeen&&!same(e,e.lastSeen))e.searchTurns--
  else {e.lastSeen=undefined;e.searchTurns=0;return}
  const dist=distance(e,g.player)
  if(e.kind==='ranger'&&sees) {
    if(dist<=2) {
      const blocked=blockers(g,e)
      const retreat=directions.map(d=>({x:e.x+d.x,y:e.y+d.y})).filter(p=>walkable(g.board,p.x,p.y)&&!blocked.has(key(p))&&!same(p,g.player)&&distance(p,g.player)>dist).sort((a,b)=>distance(b,g.player)-distance(a,g.player))[0]
      if(retreat) {e.facing=face(retreat.x-e.x,retreat.y-e.y);Object.assign(e,retreat);return}
    }
    if((e.x===g.player.x||e.y===g.player.y)&&dist<=5) {
      const dx=Math.sign(g.player.x-e.x),dy=Math.sign(g.player.y-e.y)
      e.intent=[]
      for(let n=1;n<=5;n++) {const p={x:e.x+dx*n,y:e.y+dy*n};if(!walkable(g.board,p.x,p.y))break;e.intent.push(p)}
      e.facing=face(dx,dy);e.attackType='shot';g.emit({type:'telegraph',visible:g.canSee(e)});g.message('Lính nỏ lên dây — tránh đường bắn màu đỏ!');return
    }
  }
  if(sees&&dist===1) {
    e.facing=face(g.player.x-e.x,g.player.y-e.y)
    if(e.kind==='monster') {g.damage(g.player,3+g.floor-1,'Sinh vật cắn');g.message('Sinh vật tấn công bạn.')}
    else {
      const dx=g.player.x-e.x,dy=g.player.y-e.y
      e.intent=[-1,0,1].map(n=>({x:e.x+dx+(dy?n:0),y:e.y+dy+(dx?n:0)})).filter(p=>walkable(g.board,p.x,p.y))
      e.attackType='sweep';g.emit({type:'telegraph',visible:g.canSee(e)});g.message('Lính canh giơ vũ khí — hãy rời các ô màu đỏ!')
    }
  } else if(e.lastSeen)moveToward(g,e,e.lastSeen)
}
