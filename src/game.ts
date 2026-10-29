import type { Direction } from './assets'
import { arena, distance, key, lineOfSight, nextStep, same, walkable } from './world'
import type { Board, Point } from './world'
export type Actor = Point & { id: number; kind: 'player' | 'monster' | 'warrior'; hp: number; maxHp: number; facing: Direction; intent: Point[]; recovery: boolean }
export type Hit = Point & { value: string; color: string }
export type Action = { type: 'move'; dx: number; dy: number } | { type: 'wait' }
export function facing(dx: number, dy: number): Direction { return dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'back' : 'front' }
export class Game {
  board: Board = arena()
  turn = 0
  status: 'playing' | 'dead' | 'won' = 'playing'
  player: Actor = { id: 0, kind: 'player', x: 5, y: 10, hp: 30, maxHp: 30, facing: 'front', intent: [], recovery: false }
  enemies: Actor[] = [
    { id: 1, kind: 'monster', x: 12, y: 9, hp: 10, maxHp: 10, facing: 'left', intent: [], recovery: false },
    { id: 2, kind: 'warrior', x: 20, y: 10, hp: 20, maxHp: 20, facing: 'left', intent: [], recovery: false },
  ]
  log: string[] = ['Tiến vào phòng. Sinh vật áp sát; lính canh báo trước đòn quét.']
  hits: Hit[] = []
  message(text: string) { this.log.unshift(text); this.log = this.log.slice(0, 12) }
  damage(target: Actor, amount: number) {
    target.hp = Math.max(0, target.hp - amount)
    this.hits.push({ x: target.x, y: target.y, value: `−${amount}`, color: target.kind === 'player' ? '#ff7470' : '#ffdb93' })
    if (!target.hp) { target.intent = []; this.message(target.kind === 'player' ? 'Bạn đã gục ngã.' : `${target.kind === 'monster' ? 'Sinh vật' : 'Lính canh'} đã bị hạ.`) }
  }
  act(action: Action): boolean {
    if (this.status !== 'playing') return false
    this.hits = []
    if (action.type === 'move') {
      if (Math.abs(action.dx) + Math.abs(action.dy) !== 1) return false
      this.player.facing = facing(action.dx, action.dy)
      const p = { x: this.player.x + action.dx, y: this.player.y + action.dy }
      const enemy = this.enemies.find(e => e.hp > 0 && same(e, p))
      if (enemy) { this.damage(enemy, 5); this.message(`Bạn đánh ${enemy.kind === 'monster' ? 'sinh vật' : 'lính canh'}: 5 sát thương.`) }
      else if (walkable(this.board, p.x, p.y)) Object.assign(this.player, p)
      else return false
    }
    this.turn++
    for (const enemy of this.enemies.filter(e => e.hp > 0)) {
      if (this.player.hp <= 0) break
      if (enemy.intent.length) {
        const strike = enemy.intent
        enemy.intent = []; enemy.recovery = true
        strike.forEach(p => this.hits.push({ ...p, value: '✦', color: '#ffb67b' }))
        if (strike.some(p => same(p, this.player))) { this.damage(this.player, 6); this.message('Đòn quét trúng bạn: 6 sát thương.') }
        else this.message('Bạn tránh được đòn quét. Lính canh đang hồi sức!')
        continue
      }
      if (enemy.recovery) { enemy.recovery = false; continue }
      if (distance(enemy, this.player) > 10 || !lineOfSight(this.board, enemy, this.player)) continue
      if (distance(enemy, this.player) === 1) {
        enemy.facing = facing(this.player.x - enemy.x, this.player.y - enemy.y)
        if (enemy.kind === 'monster') { this.damage(this.player, 3); this.message('Sinh vật cắn bạn: 3 sát thương.') }
        else {
          const dx = this.player.x - enemy.x, dy = this.player.y - enemy.y
          enemy.intent = [-1,0,1].map(offset => ({ x: enemy.x + dx + (dy ? offset : 0), y: enemy.y + dy + (dx ? offset : 0) })).filter(p => walkable(this.board, p.x, p.y))
          this.message('Lính canh giơ vũ khí — hãy rời các ô màu đỏ!')
        }
      } else {
        const blocked = new Set(this.enemies.filter(e => e !== enemy && e.hp > 0).map(key))
        const step = nextStep(this.board, enemy, this.player, blocked)
        if (step && !same(step, this.player)) { enemy.facing = facing(step.x - enemy.x, step.y - enemy.y); Object.assign(enemy, step) }
      }
    }
    if (!this.player.hp) this.status = 'dead'
    else if (this.enemies.every(e => e.hp === 0)) { this.status = 'won'; this.message('Phòng đã an toàn. Bạn hoàn thành bản thử chiến đấu!') }
    return true
  }
}
