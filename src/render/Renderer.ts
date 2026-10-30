import { actorMeta, actorSheet, crops } from '../data/sprites'
import { images, sprite } from './assets'
import type { ActorKind, Direction, Rect } from '../data/sprites'
import type { Game } from '../game/Game'
import type { Actor } from '../game/types'
import { floor, floorVariant, tile, walkable, wallShape } from '../world/tiles'
import type { Board, Point } from '../world/tiles'
const atlas = 'Map/Map_tileset.png'
export type DebugOptions = { grid: boolean; ids: boolean; collision: boolean; reveal?: boolean; decorations?: boolean; labFog?: boolean }
export class Renderer {
  ctx: CanvasRenderingContext2D
  before = new Map<number, Point>()
  started = -1000
  reducedMotion = false
  canvas: HTMLCanvasElement
  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; this.ctx = canvas.getContext('2d')! }
  reset() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.imageSmoothingEnabled = false
    this.ctx.fillStyle = '#101216'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
  drawTile(board: Board, x: number, y: number) {
    const ctx = this.ctx, px = x * 16, py = y * 16, t = tile(board, x, y)
    if (floor(board, x, y) || t === '+') {
      const v = floorVariant(board, x, y)
      sprite(ctx, atlas, v === 0 ? crops.floorCrack : v < 3 ? crops.floorDust : crops.floor, px, py)
      if (t === '>') sprite(ctx, atlas, crops.stairs, px, py)
      if (t === '+' || t === 'G') {
        ctx.fillStyle = '#342b26'; ctx.fillRect(px + 1, py, 14, 16)
        ctx.fillStyle = '#9d7950'; ctx.fillRect(px + 2, py + 1, 12, 14)
        ctx.fillStyle = '#d7b97e'; ctx.fillRect(px + 10, py + 8, 2, 2)
        ctx.strokeStyle = '#533b29'; ctx.strokeRect(px + 3.5, py + 2.5, 9, 11)
        if(t==='G') {ctx.fillStyle='#ed6c5844';ctx.fillRect(px,py,16,16);ctx.fillStyle='#b8a389';for(const n of [3,7,11])ctx.fillRect(px+n,py,1,16)}
      }
      return
    }
    const shape = wallShape(board, x, y)
    if (!shape.edges && !shape.notches.length) { ctx.fillStyle = '#1b1b1d'; ctx.fillRect(px, py, 16, 16); return }
    sprite(ctx, atlas, crops.wall, px, py)
    ctx.fillStyle = '#18191c70'; ctx.fillRect(px, py, 16, 16)
    if (shape.edges & 1) sprite(ctx, atlas, crops.top, px, py)
    if (shape.edges & 2) sprite(ctx, atlas, crops.right, px + 13, py)
    if (shape.edges & 4) sprite(ctx, atlas, crops.bottom, px, py + 13)
    if (shape.edges & 8) sprite(ctx, atlas, crops.left, px, py)
    for (const corner of shape.notches) {
      const xx = px + (corner < 2 ? 13 : 0), yy = py + (corner === 0 || corner === 3 ? 0 : 13)
      sprite(ctx, atlas, crops.top, xx, yy, 3, 3)
      ctx.fillStyle = '#bba47b'; ctx.fillRect(xx + 1, yy + 1, 1, 1)
    }
    if (shape.edges & 4) { ctx.fillStyle = '#08090b45'; ctx.fillRect(px, py + 16, 16, 2) }
  }
  board(board: Board, debug: DebugOptions) {
    for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) this.drawTile(board, x, y)
    const ctx = this.ctx
    for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) {
      const solid = !walkable(board, x, y)
      if (debug.collision && solid) { ctx.fillStyle = '#d952773d'; ctx.fillRect(x * 16, y * 16, 16, 16) }
      if (debug.grid) { ctx.strokeStyle = '#cfdecd40'; ctx.lineWidth = .3; ctx.strokeRect(x * 16, y * 16, 16, 16) }
      if (debug.ids) {
        const shape = wallShape(board, x, y)
        ctx.font = '4px monospace'; ctx.fillStyle = '#e9e0cb'
        const t=tile(board,x,y)
        ctx.fillText(t==='B'?'B':t==='G'?'G':solid ? `${shape.edges.toString(16)}:${shape.notches.join('')}` : t==='>'?'ST':'F', x * 16 + 1, y * 16 + 6)
      }
    }
  }
  actor(kind: ActorKind, direction: Direction, x: number, y: number, time: number, moving: boolean, scale = 1) {
    const meta = actorMeta(kind, direction), frame = moving ? Math.floor(time / 85) % meta.frames : 0, ctx = this.ctx
    ctx.fillStyle = '#05060866'; ctx.beginPath(); ctx.ellipse(x, y - 1, 5 * scale, 2 * scale, 0, 0, Math.PI * 2); ctx.fill()
    sprite(ctx, actorSheet(kind, direction), [0, frame * meta.size, meta.size, meta.size], Math.round(x - meta.anchor[0] * scale), Math.round(y - meta.anchor[1] * scale), meta.size * scale, meta.size * scale)
  }
  combat(game: Game, time: number, debug: DebugOptions) {
    this.reset()
    const ctx = this.ctx, progress = Math.min(1, Math.max(0, (Math.max(0,time - this.started)) / 180)), ease = this.reducedMotion?1:1 - (1 - progress) ** 3
    const old = this.before.get(0) ?? game.player
    const camera = { x: (old.x + (game.player.x - old.x) * ease) * 16 + 8, y: (old.y + (game.player.y - old.y) * ease) * 16 + 8 }
    const scale = 3
    const ox = Math.max(this.canvas.width / scale - game.board.width * 16, Math.min(0, this.canvas.width / scale / 2 - camera.x))
    const oy = Math.max(this.canvas.height / scale - game.board.height * 16, Math.min(0, this.canvas.height / scale / 2 - camera.y))
    ctx.scale(scale, scale); ctx.translate(Math.round(ox), Math.round(oy)); this.board(game.board, { ...debug, ids: false })
    this.dynamics(game,time,debug,Boolean(debug.reveal),ease,progress)
    if (game.scenario === 'dungeon' && !debug.reveal) this.fog(game)
    ctx.setTransform(1,0,0,1,0,0)
    if (game.scenario === 'dungeon') this.minimap(game)
    if(game.bossActive||game.status==='victory')this.bossHud(game)
  }
  dynamics(game: Game, time: number, debug: DebugOptions, reveal: boolean, ease = 1, progress = 1) {
    const ctx = this.ctx, visible = (p: Point) => reveal || game.canSee(p)
    if (debug.decorations !== false) {
      const decor = game.scenario === 'arena' ? [{ x:3,y:3,kind:'skull' },...[5,13,21].map(x=>({x,y:1,kind:'torch'}))] : game.decorations
      for (const d of decor) {
        if (d.kind === 'barrel') continue
        if (d.kind === 'skull') sprite(ctx,'Map/Decorations_tileset.png',crops.skull,d.x*16,d.y*16)
        if (d.kind === 'torch') {
          sprite(ctx,'Map/Torch.png',[0,this.reducedMotion?0:Math.floor(time/140)%3*16,16,16],d.x*16,d.y*16)
          if (visible(d)) {
            const glow=ctx.createRadialGradient(d.x*16+8,d.y*16+10,1,d.x*16+8,d.y*16+10,30)
            glow.addColorStop(0,'#eea34530');glow.addColorStop(1,'#eea34500');ctx.fillStyle=glow;ctx.fillRect(d.x*16-22,d.y*16-20,60,60)
          }
        }
      }
    }
    for (const trap of game.traps) {
      const seen = visible(trap)
      if (!seen && !game.explored.has(`${trap.x},${trap.y}`)) continue
      const phase = seen ? trap.phase : 0
      sprite(ctx,'Map/Spike.png',[0,(phase === 2 ? 3 : phase)*16,16,16],trap.x*16,trap.y*16)
      if (phase) {
        ctx.fillStyle=phase===1?'#dca24135':'#e44e4e40';ctx.fillRect(trap.x*16,trap.y*16,16,16)
        ctx.strokeStyle=phase===1?'#edba5f':'#fa7562';ctx.lineWidth=.7;ctx.strokeRect(trap.x*16+1,trap.y*16+1,14,14)
        ctx.fillStyle=phase===1?'#ffe4aa':'#ffa49a';ctx.font='bold 7px monospace';ctx.fillText(phase===1?'!':'×',trap.x*16+6,trap.y*16+10)
      }
    }
    for (const item of game.loot.filter(visible)) {
      if (item.kind==='ember') {
        ctx.fillStyle='#ed805226';ctx.beginPath();ctx.arc(item.x*16+8,item.y*16+8,9,0,Math.PI*2);ctx.fill()
        sprite(ctx,'Others/Others.png',[16,0,16,16],item.x*16,item.y*16)
      } else if(item.kind==='heal')sprite(ctx,'Others/HUD.png',crops.potion,item.x*16,item.y*16)
      else if(item.kind==='gold')sprite(ctx,'Others/Coin.png',[0,this.reducedMotion?0:Math.floor(time/120)%6*16,16,16],item.x*16,item.y*16)
      else {
        const color=item.tier===2?'#c48bf2':item.tier===1?'#e2be66':'#c4c6bb'
        ctx.fillStyle='#15171bbc';ctx.fillRect(item.x*16+2,item.y*16+2,12,12)
        ctx.strokeStyle=color;ctx.lineWidth=.6;ctx.strokeRect(item.x*16+2,item.y*16+2,12,12)
        if(item.itemId==='armor') {ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(item.x*16+4,item.y*16+4);ctx.lineTo(item.x*16+12,item.y*16+4);ctx.lineTo(item.x*16+11,item.y*16+11);ctx.lineTo(item.x*16+8,item.y*16+13);ctx.lineTo(item.x*16+5,item.y*16+11);ctx.fill()}
        else sprite(ctx,`Weapons/Weapons_${item.tier===2?'purple':item.tier===1?'gold':'normal'}_right.png`,item.itemId==='axe'?[59,48,32,16]:item.itemId==='spear'?[59,64,32,16]:crops.sword,item.x*16,item.y*16+4,item.itemId==='sword'?15:16,item.itemId==='sword'?6:8)
      }
    }
    for (const e of game.enemies.filter(e => e.hp > 0 && visible(e))) for (const p of e.intent.filter(visible)) {
      ctx.fillStyle = `rgba(224,77,62,${.22 + (this.reducedMotion?0:Math.sin(time / 140) * .08)})`; ctx.fillRect(p.x * 16, p.y * 16, 16, 16)
      ctx.strokeStyle = '#ff8d68'; ctx.lineWidth = .6; ctx.strokeRect(p.x * 16 + 1, p.y * 16 + 1, 14, 14)
      ctx.fillStyle = '#ffbf95'; ctx.font = 'bold 9px monospace'; ctx.fillText('!', p.x * 16 + 6, p.y * 16 + 11)
    }
    const actors = [game.player, ...game.enemies].filter(a => a.hp > 0 && visible(a))
    const layered: ({type:'actor'; y:number; actor:Actor} | {type:'barrel'; y:number; x:number})[] = actors.map(actor=>({type:'actor', y:actor.y,actor}))
    // Barrels retain a visible silhouette even when decorative details are disabled.
    for(const d of game.decorations.filter(d=>d.kind==='barrel' && (reveal || game.explored.has(`${d.x},${d.y}`)))) layered.push({type:'barrel',x:d.x,y:d.y})
    layered.sort((a,b)=>a.y-b.y)
    for (const entry of layered) {
      if(entry.type==='barrel') { sprite(ctx,'Map/Decorations_tileset.png',crops.barrel,entry.x*16,entry.y*16-8);continue }
      const a=entry.actor
      const prev = this.before.get(a.id) ?? a, moving = !this.reducedMotion && progress < 1 && (prev.x !== a.x || prev.y !== a.y)
      const x = (prev.x + (a.x - prev.x) * ease) * 16 + 8, y = (prev.y + (a.y - prev.y) * ease) * 16 + 15
      this.actor(a.kind, a.facing, x, y, time, moving)
      if(a.kind==='player') {
        const attacking=!this.reducedMotion&&progress<1&&game.events.some(e=>e.type==='attack')
        const dx=a.facing==='left'?-1:a.facing==='right'?1:0,dy=a.facing==='back'?-1:a.facing==='front'?1:0
        // Lower the blade quickly from upright to horizontal, then lift it back.
        const phase=progress<.4?progress/.4:(1-progress)/.6
        const swing=attacking?Math.sin(Math.max(0,phase)*Math.PI/2):0
        const side=a.facing==='left'?-1:1
        const reach=swing*3
        ctx.save();ctx.translate(x+side*6+dx*reach,y-7+dy*reach);ctx.rotate(-Math.PI/2+side*swing*Math.PI/2)
        const sword=game.weapon.id==='sword'
        sprite(ctx,`Weapons/Weapons_${game.weapon.tier===2?'purple':game.weapon.tier===1?'gold':'normal'}_right.png`,game.weapon.id==='axe'?[59,48,32,16]:game.weapon.id==='spear'?[59,64,32,16]:crops.sword,sword?-1:-4,sword?-3:-4,sword?15:16,sword?6:8);ctx.restore()
      }
      if(!this.reducedMotion&&progress<1&&game.events.some(e=>e.type==='damage'&&e.x===a.x&&e.y===a.y)) {
        ctx.strokeStyle='#ffe6bb';ctx.lineWidth=1;ctx.strokeRect(x-7,y-16,14,16)
      }
      if(a.kind==='boss') {ctx.strokeStyle=a.enraged?'#ff4f3c':'#df9d60';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(x,y,7,3,0,0,Math.PI*2);ctx.stroke()}
      if(a.kind==='ranger') {ctx.fillStyle='#efcb76';ctx.font='bold 5px monospace';ctx.fillText('N',x+6,y-10)}
      if (a.kind === 'player') { ctx.strokeStyle = '#e1bc78'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2); ctx.stroke() }
      else this.enemyBar(a, x, y)
    }
    if(!this.reducedMotion&&Math.max(0,time-this.started)<650)for(const e of game.events.filter(e=>e.type==='death'&&e.visible&&e.x!==undefined&&e.y!==undefined&&visible({x:e.x,y:e.y})&&e.kind)) {
      ctx.globalAlpha=Math.max(0,1-(Math.max(0,time-this.started))/650)
      this.actor(e.kind!,e.facing??'front',e.x!*16+8,e.y!*16+15,time,false);ctx.globalAlpha=1
    }
    if (!this.reducedMotion && progress < 1 && game.hits.some(h => h.color === '#ffdb93')) {
      const p = game.player, dx = p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0, dy = p.facing === 'back' ? -1 : p.facing === 'front' ? 1 : 0
      ctx.strokeStyle = '#ffe3a7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x * 16 + 8 + dx * 10, p.y * 16 + 8 + dy * 10, 6, progress * 3, progress * 3 + 2); ctx.stroke()
    }
    if (Math.max(0,time - this.started) < 650) {
      ctx.globalAlpha = Math.max(0, 1 - (Math.max(0,time - this.started)) / 650)
      for (const h of game.hits.filter(visible)) { ctx.font = 'bold 7px monospace'; ctx.fillStyle = h.color; ctx.fillText(h.value, h.x * 16 + 2, h.y * 16 - (this.reducedMotion?0:(Math.max(0,time - this.started)) / 55)) }
      ctx.globalAlpha = 1
    }
    if(!this.reducedMotion&&Math.max(0,time-this.started)<450)for(const e of game.events.filter(e=>e.type==='pickup'&&e.x!==undefined&&e.y!==undefined)) {
      const age=(Math.max(0,time-this.started))/450;ctx.globalAlpha=1-age;ctx.strokeStyle='#f1c97c';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(e.x!*16+8,e.y!*16+8,3+age*10,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1
    }
  }
  fog(game: Game) {
    const ctx=this.ctx
    for(let y=0;y<game.board.height;y++) for(let x=0;x<game.board.width;x++) {
      const id=`${x},${y}`
      if(game.visible.has(id)) continue
      ctx.fillStyle=game.explored.has(id)?'#080b10d9':'#0b0e13';ctx.fillRect(x*16,y*16,16,16)
    }
  }
  minimap(game: Game) {
    const ctx=this.ctx, scale=this.canvas.width<600?2:3, left=this.canvas.width-game.board.width*scale-20, top=game.bossActive||game.status==='victory'?this.canvas.height-game.board.height*scale-20:20
    ctx.fillStyle='#0b0e13ed';ctx.fillRect(left-8,top-8,game.board.width*scale+16,game.board.height*scale+16)
    for(let y=0;y<game.board.height;y++) for(let x=0;x<game.board.width;x++) {
      const id=`${x},${y}`
      if(!game.explored.has(id)) continue
      ctx.fillStyle=tile(game.board,x,y)==='>'?'#f0c775':walkable(game.board,x,y)?(game.visible.has(id)?'#9f9a7b':'#454b4e'):'#282e32'
      ctx.fillRect(left+x*scale,top+y*scale,scale,scale)
    }
    ctx.fillStyle='#f2d8a1';ctx.fillRect(left+game.player.x*scale-1,top+game.player.y*scale-1,5,5)
  }
  bossHud(game:Game) {
    const boss=game.boss;if(!boss)return
    const ctx=this.ctx,x=20,y=18,w=Math.min(610,this.canvas.width-40)
    ctx.fillStyle='#0d1116ed';ctx.fillRect(x-12,y-8,w+24,57)
    ctx.font='15px Segoe UI';ctx.fillStyle='#e8be89';ctx.fillText('THÚ VƯƠNG TÀN HỎA',x,y+10)
    const state=boss.intent.length?(boss.attackType==='charge'?'CHUẨN BỊ HÚC':'CHUẨN BỊ ĐẬP ĐẤT'):boss.recovery?'HỒI SỨC':boss.enraged?'CUỒNG NỘ':'ĐANG TIẾP CẬN'
    ctx.font='11px Segoe UI';ctx.fillStyle='#e9977a';ctx.fillText(`${state} · ${boss.hp}/${boss.maxHp} HP`,x,y+25)
    ctx.fillStyle='#392a29';ctx.fillRect(x,y+34,w,6);ctx.fillStyle=boss.enraged?'#e36f56':'#bd855e';ctx.fillRect(x,y+34,w*boss.hp/boss.maxHp,6)
  }
  enemyBar(a: Actor, x: number, y: number) {
    const ctx = this.ctx, top = y - (a.kind === 'warrior' ? 25 : 19)
    ctx.fillStyle = '#111318'; ctx.fillRect(x - 7, top, 14, 2)
    ctx.fillStyle = a.intent.length ? '#ffb477' : '#c56a59'; ctx.fillRect(x - 7, top, 14 * a.hp / a.maxHp, 2)
    if (a.recovery) { ctx.font = '5px monospace'; ctx.fillStyle = '#a2d7d2'; ctx.fillText('Z', x + 7, y - 19) }
  }
  lab(board: Board, debug: DebugOptions, game?: Game, time = 0) {
    const scale=Math.min(2,this.canvas.width/(board.width*16),this.canvas.height/(board.height*16))
    this.reset(); this.ctx.scale(scale, scale)
    this.ctx.translate((this.canvas.width / scale - board.width * 16) / 2, (this.canvas.height / scale - board.height * 16) / 2)
    this.board(board, debug)
    if(game) {
      this.dynamics(game,time,debug,!debug.labFog)
      if(debug.labFog) this.fog(game)
    }
  }
  asset(path: string, time: number, grid: boolean, selectedCrop?: Rect) {
    this.reset()
    const fit=Math.min(this.canvas.width/960,this.canvas.height/672)
    this.ctx.translate((this.canvas.width-960*fit)/2,(this.canvas.height-672*fit)/2);this.ctx.scale(fit,fit)
    const img = images.get(path)!, ctx = this.ctx, scale = Math.min(4, Math.floor(850 / img.width), Math.floor(540 / img.height)) || 1, x = 48, y = 65
    for (let yy = 0; yy < img.height * scale; yy += 16) for (let xx = 0; xx < img.width * scale; xx += 16) {
      ctx.fillStyle = ((xx + yy) / 16) % 2 ? '#2c2d33' : '#23252a'; ctx.fillRect(x + xx, y + yy, Math.min(16, img.width * scale - xx), Math.min(16, img.height * scale - yy))
    }
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    ctx.fillStyle = '#c0b497'; ctx.font = '14px monospace'; ctx.fillText(`${img.width} × ${img.height} px / ${scale}×`, x, y - 18)
    const match = path.match(/Characters\/(Player|Warrior|Monster)\/(BossMonster|Player|warrior|Monster)_walk_(\w+)\.png/)
    if (match) {
      const kind: ActorKind = match[2] === 'BossMonster' ? 'boss' : match[1]!.toLowerCase() as ActorKind
      const direction = match[3] === 'behind' ? 'back' : match[3] as Direction, meta = actorMeta(kind, direction)
      ctx.fillText(`${meta.size} × ${meta.size} / ${meta.frames} frames / chân (${meta.anchor.join(', ')})`, 300, 96)
      this.actor(kind, direction, 430, 260, time, true, 6)
      ctx.strokeStyle = '#dda85f'; ctx.strokeRect(430 - meta.anchor[0] * 6, 260 - meta.anchor[1] * 6, meta.size * 6, meta.size * 6)
      ctx.fillStyle = '#66d9c1'; ctx.fillRect(426, 258, 8, 4)
      ctx.fillStyle = '#b6b9bb'; ctx.fillText('Chấm xanh: điểm đặt chân', 300, 330); ctx.fillText('Khung vàng: giới hạn frame', 300, 354)
      if (grid) for (let i = 0; i < meta.frames; i++) { ctx.strokeStyle = '#7ce8c875'; ctx.strokeRect(x, y + i * meta.size * scale, meta.size * scale, meta.size * scale) }
    } else if (grid) {
      ctx.strokeStyle = '#9fc9b255'; ctx.font = '9px monospace'
      for (let yy = 0; yy < img.height; yy += 16) for (let xx = 0; xx < img.width; xx += 16) {
        ctx.strokeRect(x + xx * scale, y + yy * scale, Math.min(16, img.width - xx) * scale, Math.min(16, img.height - yy) * scale)
        ctx.fillStyle = '#b5e1ca'; ctx.fillText(`${xx},${yy}`, x + xx * scale + 1, y + yy * scale + 10)
      }
    }
    if (!match) {
      const frameWidth = path.endsWith('Player_idle.png') ? 17 : path.includes('Torch_left') || path.includes('Torch_right') ? 32 : 16
      const frameHeight = path.endsWith('Player_idle.png') ? 17 : 16
      const animated = path.endsWith('Player_idle.png') || /^Map\/(Torch(?:_left|_right)?|Spike)\.png$/.test(path) || path === 'Others/Coin.png'
      if (animated) {
        const count = img.height / frameHeight, f = Math.floor(time / 130) % count
        sprite(ctx, path, [0, f * frameHeight, frameWidth, frameHeight], 480, 200, frameWidth * 6, frameHeight * 6)
        ctx.fillStyle = '#c0b497'; ctx.font = '14px monospace'; ctx.fillText(`${frameWidth} × ${frameHeight} / ${count} frames`, 400, 160)
      }
    }
    if (selectedCrop) { ctx.strokeStyle = '#ffca70'; ctx.lineWidth = 2; ctx.strokeRect(x + selectedCrop[0] * scale, y + selectedCrop[1] * scale, selectedCrop[2] * scale, selectedCrop[3] * scale) }
  }
}
