import type { Direction } from '../data/sprites'
import { arena } from '../world/fixtures'
import { distance, key, same, tile, walkable } from '../world/tiles'
import type { Board, Point } from '../world/tiles'
import { fieldOfView, lineOfSight } from '../world/visibility'
import { nextStep } from '../world/pathfinding'
import { generateDungeon } from '../world/dungeon'
import type { Decoration, Loot, Trap } from '../world/dungeon'
import type { Actor, Hit, Action, GameOptions } from './types'

export function facing(dx: number, dy: number): Direction { return dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'back' : 'front' }
export class Game {
  board: Board = arena()
  scenario: 'arena' | 'dungeon'
  seed = ''
  turn = 0
  attack = 5
  emberFound = false
  status: 'playing' | 'dead' | 'won' = 'playing'
  player: Actor = { id: 0, kind: 'player', x: 5, y: 10, hp: 30, maxHp: 30, facing: 'front', intent: [], recovery: false }
  enemies: Actor[] = [
    { id: 1, kind: 'monster', x: 12, y: 9, hp: 10, maxHp: 10, facing: 'left', intent: [], recovery: false },
    { id: 2, kind: 'warrior', x: 20, y: 10, hp: 20, maxHp: 20, facing: 'left', intent: [], recovery: false },
  ]
  traps: Trap[] = []
  loot: Loot[] = []
  decorations: Decoration[] = []
  visible = new Set<string>()
  explored = new Set<string>()
  exit?: Point
  log: string[] = []
  hits: Hit[] = []
  constructor(options: GameOptions = {}) {
    this.scenario = options.scenario ?? 'arena'
    if (this.scenario === 'dungeon') {
      const d = generateDungeon(options.seed ?? 'tan-hoa-01')
      this.seed = d.seed; this.board = d.board; Object.assign(this.player, d.start)
      this.exit = d.exit; this.traps = d.traps; this.loot = d.loot; this.decorations = d.decorations
      this.enemies = d.enemies.map((e,i) => ({ ...e, id: i + 1, hp: e.kind === 'warrior' ? 20 : 10, maxHp: e.kind === 'warrior' ? 20 : 10, facing: 'front', intent: [], recovery: false }))
      this.message('Tìm cầu thang và nhấn E / Enter để xuống. Tàn hỏa đỏ giúp kiếm mạnh hơn; bình đỏ hồi máu.')
      this.message('Khám phá khu canh gác. Gai vàng báo trước; gai đỏ gây 5 sát thương. Cả quái cũng trúng bẫy.')
    } else this.message('Tiến vào phòng. Sinh vật áp sát; lính canh báo trước đòn quét.')
    this.updateVision()
  }
  updateVision() {
    if (this.scenario === 'arena') {
      this.visible = new Set(this.board.cells.flatMap((row,y) => [...row].map((_,x) => `${x},${y}`)))
    } else this.visible = fieldOfView(this.board,this.player)
    for (const p of this.visible) this.explored.add(p)
  }
  canSee(p: Point) { return this.visible.has(key(p)) }
  message(text: string) { this.log.unshift(text); this.log = this.log.slice(0, 12) }
  damage(target: Actor, amount: number) {
    target.hp = Math.max(0, target.hp - amount)
    this.hits.push({ x: target.x, y: target.y, value: `−${amount}`, color: target.kind === 'player' ? '#ff7470' : '#ffdb93' })
    if (!target.hp) { target.intent = []; this.message(target.kind === 'player' ? 'Bạn đã gục ngã.' : `${target.kind === 'monster' ? 'Sinh vật' : 'Lính canh'} đã bị hạ.`) }
  }
  pickup() {
    const item = this.loot.find(l => same(l,this.player))
    if (!item || (item.kind === 'heal' && this.player.hp === this.player.maxHp)) return
    if (item.kind === 'ember') {
      this.emberFound = true; this.attack++
      this.player.hp = Math.min(this.player.maxHp,this.player.hp + 8)
      this.message('Nhận Tàn hỏa: +1 sát thương kiếm và hồi tối đa 8 HP!')
      this.hits.push({ ...this.player, value: '+1 ATK', color: '#f5c975' })
    } else {
      const amount = Math.min(12,this.player.maxHp - this.player.hp)
      this.player.hp += amount; this.message(`Nhặt bình máu: hồi ${amount} HP.`)
      this.hits.push({ ...this.player, value: `+${amount}`, color: '#8ad8b0' })
    }
    this.loot = this.loot.filter(l => l !== item)
  }
  enemyTurn(enemy: Actor) {
    if (enemy.intent.length) {
      const strike = enemy.intent
      enemy.intent = []; enemy.recovery = true
      strike.forEach(p => this.hits.push({ ...p, value: '✦', color: '#ffb67b' }))
      if (strike.some(p => same(p,this.player))) { this.damage(this.player,6); this.message('Đòn quét trúng bạn: 6 sát thương.') }
      else if (this.canSee(enemy)) this.message('Bạn tránh được đòn quét. Lính canh đang hồi sức!')
      return
    }
    if (enemy.recovery) { enemy.recovery = false; return }
    const seesPlayer = distance(enemy,this.player) <= 8 && lineOfSight(this.board,enemy,this.player)
    if (seesPlayer) { enemy.lastSeen = { x: this.player.x, y: this.player.y }; enemy.searchTurns = 4 }
    else if (enemy.searchTurns && enemy.lastSeen && !same(enemy,enemy.lastSeen)) enemy.searchTurns--
    else { enemy.lastSeen = undefined; enemy.searchTurns = 0; return }
    if (seesPlayer && distance(enemy,this.player) === 1) {
      enemy.facing = facing(this.player.x - enemy.x,this.player.y - enemy.y)
      if (enemy.kind === 'monster') { this.damage(this.player,3); this.message('Sinh vật cắn bạn: 3 sát thương.') }
      else {
        const dx = this.player.x - enemy.x, dy = this.player.y - enemy.y
        enemy.intent = [-1,0,1].map(offset => ({ x: enemy.x + dx + (dy ? offset : 0), y: enemy.y + dy + (dx ? offset : 0) })).filter(p => walkable(this.board,p.x,p.y))
        this.message('Lính canh giơ vũ khí — hãy rời các ô màu đỏ!')
      }
    } else if (enemy.lastSeen) {
      const blocked = new Set(this.enemies.filter(e => e !== enemy && e.hp > 0).map(key))
      const step = nextStep(this.board,enemy,enemy.lastSeen,blocked)
      if (step && !same(step,this.player)) { enemy.facing = facing(step.x - enemy.x,step.y - enemy.y); Object.assign(enemy,step) }
    }
  }
  trapTurn() {
    for (const trap of this.traps) {
      // A warning triggers after this action; entering an already raised spike also hurts.
      if (trap.phase === 1 || trap.phase === 2) {
        for (const actor of [this.player,...this.enemies].filter(a => a.hp > 0 && same(a,trap))) {
          this.damage(actor,5)
          if (actor.kind === 'player' || this.canSee(trap)) this.message(`${actor.kind === 'player' ? 'Bạn' : 'Địch'} trúng bẫy gai: 5 sát thương.`)
        }
      }
      trap.phase = (trap.phase + 1) % 3
    }
  }
  act(action: Action): boolean {
    if (this.status !== 'playing') return false
    if (action.type === 'interact' && !(this.scenario === 'dungeon' && tile(this.board,this.player.x,this.player.y) === '>')) return false
    this.hits = []
    if (action.type === 'move') {
      if (Math.abs(action.dx) + Math.abs(action.dy) !== 1) return false
      this.player.facing = facing(action.dx,action.dy)
      const p = { x: this.player.x + action.dx, y: this.player.y + action.dy }
      const enemy = this.enemies.find(e => e.hp > 0 && same(e,p))
      if (enemy) { this.damage(enemy,this.attack); this.message(`Bạn đánh ${enemy.kind === 'monster' ? 'sinh vật' : 'lính canh'}: ${this.attack} sát thương.`) }
      else if (walkable(this.board,p.x,p.y)) { Object.assign(this.player,p); this.pickup() }
      else return false
    }
    if (action.type === 'wait') this.pickup()
    this.turn++
    if (action.type === 'interact') { this.status = 'won'; this.message('Bạn tìm được đường xuống! Hoàn thành tầng thử nghiệm.'); this.updateVision(); return true }
    this.updateVision()
    for (const enemy of this.enemies.filter(e => e.hp > 0)) {
      if (this.player.hp <= 0) break
      this.enemyTurn(enemy)
    }
    this.trapTurn()
    if (!this.player.hp) this.status = 'dead'
    else if (this.scenario === 'arena' && this.enemies.every(e => e.hp === 0)) { this.status = 'won'; this.message('Phòng đã an toàn. Bạn hoàn thành bản thử chiến đấu!') }
    this.updateVision()
    return true
  }
}
