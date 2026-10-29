import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

// Execute the actual TS rules without adding a browser or test framework dependency.
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
const worldUrl = moduleUrl(await readFile(new URL('../src/world.ts', import.meta.url), 'utf8'))
const world = await import(worldUrl)
const gameSource = (await readFile(new URL('../src/game.ts', import.meta.url), 'utf8')).replace("from './world'", `from '${worldUrl}'`)
const { Game } = await import(moduleUrl(gameSource))
const wait = { type: 'wait' }
const move = (dx,dy) => ({ type: 'move', dx, dy })
const guardOnly = () => {
  const g = new Game(); g.enemies = [g.enemies[1]]
  Object.assign(g.player,{x:8,y:8}); Object.assign(g.enemies[0],{x:9,y:8})
  return g
}

test('wall collision and diagonal inputs never consume a turn', () => {
  const g = new Game(); Object.assign(g.player,{x:2,y:2})
  const positions = g.enemies.map(e=>[e.x,e.y])
  assert.equal(g.act(move(-1,0)),false); assert.equal(g.act(move(1,1)),false)
  assert.equal(g.turn,0); assert.deepEqual(g.enemies.map(e=>[e.x,e.y]),positions)
})
test('moving and waiting advance exactly one turn; waiting never heals', () => {
  const g = new Game(); g.player.hp=25
  assert.equal(g.act(move(-1,0)),true); assert.equal(g.turn,1)
  assert.equal(g.act(wait),true); assert.equal(g.turn,2); assert.equal(g.player.hp,25)
})
test('bump attack damages without entering occupied tile', () => {
  const g = new Game(); g.enemies=[g.enemies[0]]
  Object.assign(g.enemies[0],{x:6,y:10})
  g.act(move(1,0)); assert.equal(g.enemies[0].hp,5); assert.equal(g.player.x,5); assert.equal(g.player.hp,27)
})
test('enemy moves OR attacks, never both in one turn', () => {
  const g = new Game(); g.enemies=[g.enemies[0]]; Object.assign(g.enemies[0],{x:7,y:10})
  g.act(wait); assert.equal(g.enemies[0].x,6); assert.equal(g.player.hp,30)
  g.act(wait); assert.equal(g.player.hp,27)
})
test('guard warns for one full action and locks its target area', () => {
  const g=guardOnly(); g.act(wait)
  assert.equal(g.player.hp,30); assert.equal(g.enemies[0].intent.length,3)
  const locked=g.enemies[0].intent.map(p=>({...p}))
  assert.ok(locked.some(p=>world.same(p,g.player)))
  g.act(move(-1,0)); assert.equal(g.player.hp,30); assert.equal(g.enemies[0].recovery,true)
  assert.equal(g.enemies[0].intent.length,0)
  g.act(move(1,0)); assert.equal(g.player.hp,30); assert.equal(g.enemies[0].intent.length,0)
})
test('staying in a warning deals damage once then gives a recovery turn', () => {
  const g=guardOnly(); g.act(wait); g.act(wait); assert.equal(g.player.hp,24)
  g.act(wait); assert.equal(g.player.hp,24)
})
test('killing a preparing enemy cancels its strike and wins', () => {
  const g=guardOnly(); g.enemies[0].hp=5; g.act(wait); g.act(move(1,0))
  assert.equal(g.enemies[0].hp,0); assert.deepEqual(g.enemies[0].intent,[])
  assert.equal(g.player.hp,30); assert.equal(g.status,'won'); assert.equal(g.act(wait),false)
})
test('death stops turns; a new game resets all state', () => {
  const g=guardOnly(); g.player.hp=1; g.act(wait); g.act(wait)
  assert.equal(g.status,'dead'); const turn=g.turn; assert.equal(g.act(wait),false); assert.equal(g.turn,turn)
  const fresh=new Game(); assert.equal(fresh.turn,0); assert.equal(fresh.player.hp,30); assert.equal(fresh.enemies.length,2)
})
test('pathfinding routes around walls and occupied cells', () => {
  const b={name:'path',width:7,height:5,cells:['#######','#.....#','#..#..#','#.....#','#######']}
  const step=world.nextStep(b,{x:2,y:2},{x:4,y:2},new Set(['2,1']))
  assert.deepEqual(step,{x:2,y:3}); assert.equal(world.lineOfSight(b,{x:2,y:2},{x:4,y:2}),false)
})
test('enemy simulation never overlaps actors or enters walls', () => {
  const g=new Game(); g.player.hp=1000
  for(let i=0;i<60;i++) {
    g.act(wait)
    const living=[g.player,...g.enemies].filter(e=>e.hp>0)
    assert.equal(new Set(living.map(world.key)).size,living.length)
    for(const e of living) assert.equal(world.walkable(g.board,e.x,e.y),true)
  }
})
test('all eight-neighbor combinations preserve edge and diagonal corner semantics', () => {
  const neighbors=[[1,0],[2,1],[1,2],[0,1],[2,0],[2,2],[0,2],[0,0]]
  for(let mask=0;mask<256;mask++) {
    const b={name:'mask',width:3,height:3,cells:['###','###','###']}
    neighbors.forEach(([x,y],i)=> {if(mask & (1<<i)) world.setTile(b,x,y,'.')})
    const result=world.wallShape(b,1,1)
    assert.equal(result.edges,mask&15)
    const expected=[]
    if((mask&16)&&!(mask&3)) expected.push(0)
    if((mask&32)&&!(mask&6)) expected.push(1)
    if((mask&64)&&!(mask&12)) expected.push(2)
    if((mask&128)&&!(mask&9)) expected.push(3)
    assert.deepEqual(result.notches,expected,`mask ${mask}`)
  }
})
test('fixture suite covers every orientation of convex and concave corners', () => {
  const concave=new Set(),convex=new Set()
  for(let i=0;i<world.fixtureNames.length;i++) {
    const b=world.fixture(i)
    assert.equal(b.cells.length,b.height); assert.ok(b.cells.every(r=>r.length===b.width))
    for(let y=0;y<b.height;y++) for(let x=0;x<b.width;x++) if(!world.floor(b,x,y)) {
      const s=world.wallShape(b,x,y); s.notches.forEach(c=>concave.add(c))
      for(const m of [3,6,12,9]) if((s.edges&m)===m) convex.add(m)
    }
  }
  assert.equal(concave.size,4); assert.equal(convex.size,4)
})
test('board boundaries and closed doors block movement; stairs are walkable', () => {
  const b=world.fixture(2)
  assert.equal(world.walkable(b,3,10),false); assert.equal(world.walkable(b,23,15),true)
  assert.equal(world.walkable(b,-1,3),false); assert.equal(world.walkable(b,27,3),false)
})
test('inventory records match every PNG and all character sheets divide into full frames', async () => {
  const manifest=JSON.parse(await readFile(new URL('../src/asset-manifest.json',import.meta.url),'utf8'))
  assert.ok(manifest.length>=38)
  for(const entry of manifest) {
    const data=await readFile(new URL(`../public/assets/${entry.path}`,import.meta.url))
    assert.equal(data.readUInt32BE(16),entry.width); assert.equal(data.readUInt32BE(20),entry.height)
    if(entry.path.includes('_walk_')) assert.equal(entry.height%entry.width,0)
  }
})
