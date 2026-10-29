import { arena } from '../world/fixtures'
import { distance, key, same, setTile, tile, walkable } from '../world/tiles'
import type { Board, Point } from '../world/tiles'
import { fieldOfView } from '../world/visibility'
import { generateDungeon, inRoom } from '../world/dungeon'
import type { BossArena, Decoration, Loot, Room, Trap } from '../world/dungeon'
import type { Actor, Hit, Action, GameOptions, GameEvent } from './types'
import { makeEnemy, enemyNames } from '../data/enemies'
import { makeItem, shopOffers } from '../data/items'
import type { Item, WeaponKind } from '../data/items'
import { upgrades } from '../data/upgrades'
import type { UpgradeId } from '../data/upgrades'
import { storeItem } from '../systems/inventory'
import { weaponArea } from '../systems/combat'
import { face, takeEnemyTurn } from '../systems/enemies'
import { balance } from '../data/balance'

export class Game {
  board: Board = arena()
  scenario: 'arena'|'dungeon'
  seed = ''
  floor = 1
  turn = 0
  floorTurn = 0
  level = 1
  xp = 0
  gold = 0
  kills = 0
  embers = 0
  emberFound = false
  baseAttack = 5
  shield = 0
  charged = 0
  recovering = false
  status: 'playing'|'camp'|'victory'|'dead'|'won' = 'playing'
  player: Actor = {id:0,kind:'player',x:5,y:10,hp:30,maxHp:30,facing:'front',intent:[],recovery:false}
  enemies: Actor[] = [makeEnemy('monster',1,12,9,1),makeEnemy('warrior',2,20,10,1)]
  inventory: Item[] = [makeItem('sword',0,1),makeItem('potion',0,2)]
  weaponUid = 1
  armorUid?: number
  serial = 3
  upgradeStacks: Record<UpgradeId,number> = {patience:0,blood:0,ward:0}
  chosenUpgrade?: UpgradeId
  purchased = new Set<number>()
  traps: Trap[] = []
  loot: Loot[] = []
  decorations: Decoration[] = []
  rooms: Room[] = []
  visitedRooms = new Set<number>()
  bossArena?: BossArena
  bossActive = false
  bossDefeated = false
  visible = new Set<string>()
  explored = new Set<string>()
  exit?: Point
  log: string[] = []
  events: GameEvent[] = []
  deathReason = ''
  hits: Hit[] = []
  constructor(options: GameOptions = {}) {
    this.scenario=options.scenario??'arena'
    if(this.scenario==='dungeon') {
      this.seed=options.seed??'tan-hoa-01';this.loadFloor(1)
      this.message('Tìm cầu thang, thu thập trang bị và Tàn hỏa. I mở túi; 1 uống bình máu; Shift + hướng để đánh xa.')
    } else this.message('Phòng luyện tập: đi vào địch để đánh; tránh ô đỏ trước đòn mạnh.')
    this.updateVision()
  }
  get weapon() {return this.inventory.find(i=>i.uid===this.weaponUid)!}
  get armor() {return this.inventory.find(i=>i.uid===this.armorUid)}
  get attack() {return this.baseAttack+this.level-1+this.embers+(this.weapon?.power??0)}
  get defense() {return this.armor?.power??0}
  get xpToNext() {return 12+(this.level-1)*8}
  get boss() {return this.enemies.find(e=>e.kind==='boss')}
  loadFloor(number:number) {
    const d=generateDungeon(this.seed,number)
    this.seed=d.seed;this.floor=number;this.board=d.board;this.rooms=d.rooms
    Object.assign(this.player,d.start);this.player.facing='front';this.player.intent=[]
    this.exit=d.exit;this.traps=d.traps;this.loot=d.loot;this.decorations=d.decorations
    this.enemies=d.enemies.map((e,i)=>makeEnemy(e.kind,i+1,e.x,e.y,number))
    this.bossArena=d.bossArena;this.bossActive=false;this.bossDefeated=false
    this.visible.clear();this.explored.clear();this.visitedRooms.clear();this.hits=[];this.events=[]
    this.floorTurn=0;this.recovering=false;this.charged=0;this.status='playing'
    this.enterRoom();this.updateVision();this.message(`Tầng ${number}: ${d.board.name}.`)
  }
  updateVision() {
    if(this.scenario==='arena')this.visible=new Set(this.board.cells.flatMap((row,y)=>[...row].map((_,x)=>`${x},${y}`)))
    else this.visible=fieldOfView(this.board,this.player)
    if(this.bossActive&&this.bossArena) {
      const r=this.bossArena
      for(let y=r.y-1;y<=r.y+r.h;y++)for(let x=r.x-1;x<=r.x+r.w;x++)this.visible.add(`${x},${y}`)
    }
    for(const p of this.visible)this.explored.add(p)
  }
  canSee(p:Point) {return this.visible.has(key(p))}
  message(text:string) {this.log.unshift(text);this.log=this.log.slice(0,12)}
  emit(event:GameEvent) {this.events.push(event)}
  damage(target:Actor,raw:number,source='Đòn đánh của địch') {
    if(target.hp<=0)return
    let amount=raw
    if(target===this.player) {
      amount=Math.max(1,raw-this.defense)
      const absorbed=Math.min(this.shield,amount);this.shield-=absorbed;amount-=absorbed
    }
    target.hp=Math.max(0,target.hp-amount)
    this.emit({type:'damage',x:target.x,y:target.y,kind:target.kind,visible:target===this.player||this.canSee(target)})
    if(target===this.player) {this.message(`${source}: ${amount?`−${amount} HP`:'đã được chắn'}.`);if(!target.hp)this.deathReason=source}
    this.hits.push({x:target.x,y:target.y,value:amount?`−${amount}`:'CHẮN',color:target===this.player?'#ff7470':'#ffdb93'})
    if(target.hp>0)return
    this.emit({type:'death',x:target.x,y:target.y,kind:target.kind,visible:target===this.player||this.canSee(target),facing:target.facing})
    target.intent=[];target.attackType=undefined
    this.message(`${enemyNames[target.kind]} đã gục ngã.`)
    if(target===this.player)return
    if(target.rewarded)return
    target.rewarded=true;this.kills++
    this.gold+=target.kind==='boss'?30:target.kind==='monster'?4:7
    this.xp+=target.kind==='boss'?25:target.kind==='monster'?4:7
    while(this.xp>=this.xpToNext) {
      this.xp-=this.xpToNext;this.level++;this.player.maxHp+=4;if(this.player.hp>0)this.player.hp=Math.min(this.player.maxHp,this.player.hp+4)
      this.emit({type:'level'});this.message(`Lên cấp ${this.level}! +1 sát thương, +4 HP tối đa.`)
    }
    if(this.upgradeStacks.blood&&this.player.hp>0)this.player.hp=Math.min(this.player.maxHp,this.player.hp+balance.bloodHeal*this.upgradeStacks.blood)
    if(target.kind==='boss') {
      this.bossDefeated=true;this.bossActive=false
      for(const p of this.bossArena?.gates??[])setTile(this.board,p.x,p.y,'.')
      this.emit({type:'victory'});this.status='victory';this.message('Thú Vương đã bị đánh bại. Ngọn lửa trở lại pháo đài!')
    }
  }
  pickup() {
    const item=this.loot.find(l=>same(l,this.player))
    if(!item)return
    if(item.kind==='ember') {
      this.embers++;this.emberFound=true;this.player.hp=Math.min(this.player.maxHp,this.player.hp+balance.emberHeal)
      this.message(`Nhận Tàn hỏa: +1 sát thương và hồi tối đa ${balance.emberHeal} HP!`)
    } else if(item.kind==='gold') {this.gold+=balance.goldPickup;this.message(`Nhặt ${balance.goldPickup} vàng.`)}
    else {
      const gear=makeItem(item.kind==='heal'?'potion':item.itemId??'sword',item.tier??0,this.serial++)
      if(!storeItem(this.inventory,gear)) {this.message('Túi đầy. Bỏ một món chưa trang bị để nhặt đồ mới.');return}
      this.message(`Nhặt ${gear.name}. ${gear.kind==='potion'?'Phím 1–3 để dùng.':'Mở túi I để trang bị.'}`)
    }
    this.emit({type:'pickup',x:item.x,y:item.y,visible:true})
    this.loot=this.loot.filter(l=>l!==item)
  }
  enterRoom() {
    const i=this.rooms.findIndex(r=>inRoom(this.player,r))
    if(i>=0&&!this.visitedRooms.has(i)) {this.visitedRooms.add(i);if(this.upgradeStacks.ward)this.shield=Math.max(this.shield,4*this.upgradeStacks.ward)}
    if(this.bossArena&&!this.bossActive&&!this.bossDefeated&&inRoom(this.player,this.bossArena)) {
      const gateIds=new Set(this.bossArena.gates.map(key))
      // Move a pursuing guard away before sealing a gate, never leave actors inside a wall.
      for(const e of this.enemies.filter(e=>e.hp>0&&gateIds.has(key(e)))) {
        const occupied=new Set([this.player,...this.enemies.filter(a=>a!==e&&a.hp>0)].map(key))
        const cells:Point[]=[]
        for(let y=1;y<this.board.height-1;y++)for(let x=1;x<this.board.width-1;x++) {
          const p={x,y};if(walkable(this.board,x,y)&&!inRoom(p,this.bossArena)&&!gateIds.has(key(p))&&!occupied.has(key(p)))cells.push(p)
        }
        cells.sort((a,b)=>distance(a,e)-distance(b,e));if(cells[0])Object.assign(e,cells[0])
      }
      for(const p of this.bossArena.gates)setTile(this.board,p.x,p.y,'G')
      this.bossActive=true;this.message('Cổng nghi lễ đóng lại. Thú Vương Tàn Hỏa thức tỉnh!')
    }
  }
  chooseUpgrade(id:UpgradeId) {
    if(this.status!=='camp'||this.chosenUpgrade||!upgrades.some(u=>u.id===id))return false
    this.chosenUpgrade=id;this.upgradeStacks[id]++;this.message(`Nhận nâng cấp: ${upgrades.find(u=>u.id===id)!.name}.`);return true
  }
  buy(index:number) {
    const offer=shopOffers[index]
    if(this.status!=='camp'||!offer||this.purchased.has(index)||this.gold<offer.price)return false
    const item=makeItem(offer.id,offer.tier,this.serial++)
    if(!storeItem(this.inventory,item))return false
    this.gold-=offer.price;this.purchased.add(index);this.message(`Mua ${item.name}.`);return true
  }
  continueRun() {
    if(this.status!=='camp'||!this.chosenUpgrade||this.floor>=3)return false
    this.chosenUpgrade=undefined;this.purchased.clear();this.loadFloor(this.floor+1);return true
  }
  sell(uid:number) {
    const item=this.inventory.find(i=>i.uid===uid)
    if(this.status!=='camp'||!item||uid===this.weaponUid||uid===this.armorUid)return false
    this.gold+=item.kind==='potion'?2:3+item.tier*2
    if(item.quantity>1)item.quantity--;else this.inventory=this.inventory.filter(i=>i!==item)
    return true
  }
  finishVictory() {if(this.status==='victory')this.status='won'}
  trapTurn() {
    for(const trap of this.traps) {
      if(trap.phase===1||trap.phase===2)for(const a of [this.player,...this.enemies].filter(a=>a.hp>0&&same(a,trap))) {
        this.damage(a,5,'Bẫy gai');if(a===this.player||this.canSee(trap))this.message(`${enemyNames[a.kind]} trúng bẫy gai.`)
      }
      trap.phase=(trap.phase+1)%3
    }
  }
  playerAttack(dx:number,dy:number) {
    const kind=this.weapon.id as WeaponKind,area=weaponArea(this.board,this.player,dx,dy,kind)
    let targets=area.map(p=>this.enemies.find(e=>e.hp>0&&same(e,p))).filter((e):e is Actor=>Boolean(e))
    if(kind!=='axe')targets=targets.slice(0,1)
    if(!targets.length)return false
    this.emit({type:'attack',x:this.player.x,y:this.player.y,visible:true})
    this.player.facing=face(dx,dy)
    const amount=this.attack+this.charged;this.charged=0
    for(const e of targets)this.damage(e,amount)
    if(kind==='axe')this.recovering=true
    return true
  }
  act(action:Action):boolean {
    if(this.status!=='playing')return false
    if(this.recovering&&action.type!=='wait') {this.message('Rìu cần hồi sức. Nhấn Space để chờ một lượt.');return false}
    if(action.type==='interact'&&!(this.scenario==='dungeon'&&this.floor<3&&tile(this.board,this.player.x,this.player.y)==='>'))return false
    this.hits=[];this.events=[]
    if(action.type==='move'||action.type==='attack') {
      if(Math.abs(action.dx)+Math.abs(action.dy)!==1)return false
      this.player.facing=face(action.dx,action.dy)
      const p={x:this.player.x+action.dx,y:this.player.y+action.dy}
      if(action.type==='attack'||this.enemies.some(e=>e.hp>0&&same(e,p))) {if(!this.playerAttack(action.dx,action.dy))return false}
      else if(walkable(this.board,p.x,p.y)) {Object.assign(this.player,p);this.emit({type:'step'});this.pickup();this.enterRoom()}
      else return false
    } else if(action.type==='equip') {
      const item=this.inventory.find(i=>i.uid===action.uid)
      if(!item||item.kind==='potion'||this.weaponUid===item.uid||this.armorUid===item.uid)return false
      if(item.kind==='weapon')this.weaponUid=item.uid;else this.armorUid=item.uid
      this.message(`Trang bị ${item.name}.`)
      this.emit({type:'equip'})
    } else if(action.type==='drop') {
      const item=this.inventory.find(i=>i.uid===action.uid)
      if(!item||this.weaponUid===item.uid||this.armorUid===item.uid||this.loot.some(l=>same(l,this.player)))return false
      this.loot.push({x:this.player.x,y:this.player.y,kind:item.kind==='potion'?'heal':'gear',itemId:item.id,tier:item.tier})
      if(item.quantity>1)item.quantity--;else this.inventory=this.inventory.filter(i=>i!==item)
    } else if(action.type==='use') {
      const potion=this.inventory.filter(i=>i.kind==='potion')[action.slot]
      if(!Number.isInteger(action.slot)||action.slot<0||!potion||this.player.hp===this.player.maxHp)return false
      const healed=Math.min(balance.potionHeal,this.player.maxHp-this.player.hp);this.player.hp+=healed;potion.quantity--
      if(!potion.quantity)this.inventory=this.inventory.filter(i=>i!==potion)
      this.message(`Uống bình máu: +${healed} HP.`)
      this.emit({type:'heal',x:this.player.x,y:this.player.y,visible:true})
      this.hits.push({x:this.player.x,y:this.player.y,value:`+${healed}`,color:'#8fe2ae'})
    } else if(action.type==='wait') {
      this.recovering=false;this.pickup();this.charged=3*this.upgradeStacks.patience
    }
    this.turn++;this.floorTurn++
    if(action.type==='interact') {this.status='camp';this.chosenUpgrade=undefined;this.purchased.clear();this.message('Đã tới điểm tiếp tế. Chọn nâng cấp trước khi xuống tầng.');return true}
    this.updateVision()
    for(const e of this.enemies.filter(e=>e.hp>0)) {
      if(this.player.hp<=0||this.status!=='playing')break
      takeEnemyTurn(this,e)
    }
    if(this.status==='playing')this.trapTurn()
    if(this.player.hp<=0)this.status='dead'
    else if(this.scenario==='arena'&&this.enemies.every(e=>e.hp===0))this.status='won'
    this.updateVision();return true
  }
}
