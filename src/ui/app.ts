import { loadPreferences, savePreferences } from './preferences'
import { GameAudio } from '../systems/audio'
import { contextualHint, helpPanel } from './help'
import { loadAssets } from '../render/assets'
import { Game } from '../game/Game'
import type { Action } from '../game/types'
import { Renderer } from '../render/Renderer'
import { normalizeSeed } from '../world/random'

import { mountLayout } from './layout'
import { playerPanel, inventoryPanel, campPanel, endingPanel, bagSummary } from './gamePanels'
import type { UpgradeId } from '../data/upgrades'

export function startApp() {
  mountLayout()
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
  const canvas = $<HTMLCanvasElement>('#game'), renderer = new Renderer(canvas)
  const settings=loadPreferences(), audio=new GameAudio(settings)
  renderer.reducedMotion=settings.reducedMotion
  let helpOpen=false
  const params = new URLSearchParams(location.search)
  let currentSeed = normalizeSeed(params.get('seed') ?? 'tan-hoa-01')
  let currentScenario: 'arena' | 'dungeon' = params.get('scenario') === 'arena' ? 'arena' : 'dungeon'
  let game = new Game({ scenario: currentScenario, seed: currentSeed }), paused = false, ready = false, lockedUntil = 0
  let inventoryOpen = false
  let victoryTimer: number | undefined
  const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  function seedControls() {
    return `<form id="seed-form"><label class="select-label" for="seed">Seed bản đồ</label><div class="seed-row"><input id="seed" maxlength="64" value="${escape(currentSeed)}" autocomplete="off" spellcheck="false"><button type="submit" class="secondary">Tạo</button></div></form><button id="new-seed" class="secondary full">Khám phá seed mới →</button>`
  }
  function bindSeedControls() {
    const form = $<HTMLFormElement>('#seed-form')
    if (!form) return
    form.onsubmit = event => { event.preventDefault(); currentSeed = normalizeSeed($<HTMLInputElement>('#seed').value); currentScenario='dungeon'; restart(); syncUrl() }
    $('#new-seed').onclick = () => { currentSeed=`TH-${crypto.getRandomValues(new Uint32Array(1))[0]!.toString(16)}`; currentScenario='dungeon'; restart(); syncUrl() }
  }
  function syncUrl() {
    const url = new URL(location.href)
    url.searchParams.set('seed',currentSeed); url.searchParams.set('scenario',currentScenario)
    for(const name of ['view','fixture','asset','grid','ids','collision','reveal','decor','fog'])url.searchParams.delete(name)
    history.replaceState(null,'',url)
  }
  function refresh() {
    const p = game.player
    $('#bag-summary').innerHTML=bagSummary(game)
    $('#floor-badge').textContent=`TẦNG ${game.floor} / 3`
    const dungeon = game.scenario === 'dungeon'
    $('#scene-name').textContent = dungeon ? `01 / TẦNG ${game.floor} · ${game.board.name.toUpperCase()}` : '01 / PHÒNG LUYỆN TẬP'
    $('#scene-state').textContent = !ready ? 'ĐANG TẢI ASSETS…' : `LƯỢT ${String(game.turn).padStart(3,'0')} · ${paused ? 'TẠM DỪNG' : game.status === 'playing' ? 'CHỜ BẠN HÀNH ĐỘNG' : game.status==='camp'?'ĐIỂM TIẾP TẾ':game.status==='victory'?'THÚ VƯƠNG ĐÃ GỤC':'KẾT THÚC'}`
    $('#coords').textContent = `${p.x}, ${p.y}`
    $('#stage-hint').textContent = contextualHint(game)
    const overlay = $('#overlay')
    overlay.hidden = (!helpOpen && !paused && !inventoryOpen && !['camp','dead','won'].includes(game.status))
    if (!overlay.hidden) {
      if(helpOpen)overlay.innerHTML=helpPanel()
      else if(game.status==='camp')overlay.innerHTML=campPanel(game)
      else if(inventoryOpen&&!paused)overlay.innerHTML=inventoryPanel(game)
      else if(paused&&game.status==='playing')overlay.innerHTML='<div class="modal-content"><p class="eyebrow">NGHỈ MỘT CHÚT</p><h2>Đợi bước tiếp theo.</h2><p>Thế giới đang chờ bạn.</p><button id="continue">Tiếp tục →</button></div>'
      else overlay.innerHTML=endingPanel(game)
    }
    $('#context').innerHTML = playerPanel(game) + `<details class="run-settings"><summary>Bản đồ và seed</summary><label class="select-label" for="scenario">Chế độ chơi</label><select id="scenario"><option value="dungeon" ${dungeon?'selected':''}>Khám phá dungeon</option><option value="arena" ${!dungeon?'selected':''}>Phòng luyện tập</option></select>${seedControls()}<button class="secondary full" id="restart">Bắt đầu lại</button></details>`
    $('#restart').onclick = restart
    $<HTMLSelectElement>('#scenario').onchange = e => { currentScenario=(e.target as HTMLSelectElement).value as 'arena'|'dungeon';restart();syncUrl() }
    $('#journal').innerHTML = `<p class="eyebrow">NHẬT KÝ HÀNH TRÌNH</p><ol class="log">${game.log.slice(0,12).map(l=>`<li>${escape(l)}</li>`).join('')}</ol><div class="tip"><strong>Đọc ý định của địch</strong><p>Ô đỏ là vùng sắp bị đánh. Bước ra ngoài trước lượt tiếp theo; tận dụng lúc lính canh hồi sức.</p></div>`

    const closeHelp=$('#close-help');if(closeHelp)closeHelp.onclick=()=>{helpOpen=false;refresh();canvas.focus()}
    bindSeedControls(); bindPlayButtons()
  }
  function descend() {
    if(!game.continueRun())return
    inventoryOpen=false;paused=false;lockedUntil=0;renderer.before.clear();renderer.started=-1000;refresh();canvas.focus()
  }
  function bindPlayButtons() {
    const bag=$('#bag');if(bag)bag.onclick=()=>{inventoryOpen=true;refresh();canvas.focus()}
    const close=$('#close-bag');if(close)close.onclick=()=>{inventoryOpen=false;refresh();canvas.focus()}
    const proceed=$('#continue');if(proceed)proceed.onclick=()=>{if(paused&&game.status==='playing')paused=false;else restart();refresh();canvas.focus()}
    document.querySelectorAll<HTMLButtonElement>('[data-use]').forEach(b=>b.onclick=()=>act({type:'use',slot:Number(b.dataset.use)}))
    document.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(b=>b.onclick=()=>act({type:'equip',uid:Number(b.dataset.equip)}))
    document.querySelectorAll<HTMLButtonElement>('[data-drop]').forEach(b=>b.onclick=()=>act({type:'drop',uid:Number(b.dataset.drop)}))
    document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(b=>b.onclick=()=>{game.chooseUpgrade(b.dataset.upgrade as UpgradeId);refresh()})
    document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b=>b.onclick=()=>{game.buy(Number(b.dataset.buy));refresh()})
    document.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach(b=>b.onclick=()=>{game.sell(Number(b.dataset.sell));refresh()})
    const down=$('#descend');if(down)down.onclick=descend
  }
  function restart() {
    window.clearTimeout(victoryTimer)
    game = new Game({ scenario:currentScenario,seed:currentSeed })
    helpOpen=false;inventoryOpen = false; paused = false; lockedUntil = 0; renderer.before.clear(); renderer.started=-1000; refresh(); canvas.focus()
  }
  function scheduleVictory() {
    if(game.status==='victory') {
      const finished=game
      victoryTimer=window.setTimeout(()=>{if(game===finished&&finished.status==='victory'){finished.finishVictory();refresh()}},650)
    }
  }
  function act(action: Action) {
    if (!ready || helpOpen || paused || performance.now() < lockedUntil || game.status !== 'playing') return
    const before=new Map([game.player,...game.enemies].map(a=>[a.id,{x:a.x,y:a.y}]))
    if (game.act(action)) {renderer.before=before;renderer.started=performance.now();lockedUntil=performance.now()+185;audio.play(game.events)}
    scheduleVictory()
    inventoryOpen=false; refresh()
  }
  window.addEventListener('keydown', event => {
    if(event.key==='Escape'&&helpOpen){event.preventDefault();helpOpen=false;refresh();canvas.focus();return}
    if(event.key==='?'&&!event.repeat&&!(event.target instanceof HTMLInputElement)){event.preventDefault();helpOpen=!helpOpen;refresh();canvas.focus();return}
    if(helpOpen)return
    audio.unlock()
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return
    const moves: Record<string,[number,number]> = { w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0] }
    const move=moves[event.key] ?? moves[event.key.toLowerCase()]
    if (move || event.key === ' ' || event.key === '.' || event.key === 'Enter') event.preventDefault()
    if (event.repeat) return
    if (event.key.toLowerCase()==='i' && game.status==='playing' && !paused) {inventoryOpen=!inventoryOpen;refresh();return}
    if (event.key === 'Escape') {if(inventoryOpen)inventoryOpen=false;else paused=!paused;refresh();return}
    if(inventoryOpen)return
    if(game.status==='camp') {if(event.key==='Enter')descend();return}
    if(/^[1-3]$/.test(event.key)) {act({type:'use',slot:Number(event.key)-1});return}
    if (event.key.toLowerCase()==='r' && game.status !== 'playing') { restart(); return }
    if (move) act({type:event.shiftKey?'attack':'move',dx:move[0],dy:move[1]})
    else if (event.key === ' ' || event.key === '.') act({type:'wait'})
    else if (event.key.toLowerCase() === 'e' || event.key === 'Enter') act({type:'interact'})
  })
  window.addEventListener('blur',()=> { audio.suspend();if (game.status === 'playing') { paused=true; refresh() } })
  canvas.onpointerdown=()=>{audio.unlock();canvas.focus()}
  document.addEventListener('pointerdown',()=>audio.unlock())
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.suspend();if(game.status==='playing'){paused=true;refresh()}}})
  $('#help').onclick=()=>{helpOpen=!helpOpen;refresh();canvas.focus()}
  const sound=$<HTMLInputElement>('#sound'),volume=$<HTMLInputElement>('#volume'),motion=$<HTMLInputElement>('#motion')
  sound.checked=settings.sound;volume.value=String(settings.volume*100);motion.checked=settings.reducedMotion
  const saveSettings=()=>{settings.sound=sound.checked;settings.volume=Number(volume.value)/100;settings.reducedMotion=motion.checked;renderer.reducedMotion=settings.reducedMotion;savePreferences(settings);audio.update();audio.unlock()}
  sound.onchange=saveSettings;volume.oninput=saveSettings;motion.onchange=saveSettings
  $('#onboarding').hidden=settings.introduced
  $('#dismiss-intro').onclick=()=>{settings.introduced=true;savePreferences(settings);$('#onboarding').hidden=true;canvas.focus()}
  function resizeCanvas() {
    const wrap=canvas.parentElement!,width=wrap.clientWidth,height=wrap.clientHeight
    const ratio=width<600?1.5:1
    canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio))
  }
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement!)
  window.addEventListener('resize',resizeCanvas);resizeCanvas()
  function frame(time: number) {
    if (ready) renderer.combat(game,time)
    requestAnimationFrame(frame)
  }
  syncUrl()
  refresh()
  loadAssets().then(()=> { ready=true; refresh(); canvas.focus(); requestAnimationFrame(frame) }).catch(error=> {
    $('#overlay').hidden=false; $('#overlay').textContent=`Không thể tải assets: ${error.message}. Hãy tải lại trang sau khi kiểm tra các file ảnh.`
    $('#scene-state').textContent='LỖI TẢI ASSETS'
  })
  
}
