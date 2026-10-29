import { crops, files } from '../data/sprites'
import { loadAssets } from '../render/assets'
import type { Rect } from '../data/sprites'
import { Game } from '../game/Game'
import type { Action } from '../game/types'
import { Renderer } from '../render/Renderer'
import { fixture, fixtureNames } from '../world/fixtures'
import { normalizeSeed } from '../world/random'

import { mountLayout } from './layout'

export function startApp() {
  mountLayout()
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
  const canvas = $<HTMLCanvasElement>('#game'), renderer = new Renderer(canvas)
  const params = new URLSearchParams(location.search)
  let currentSeed = normalizeSeed(params.get('seed') ?? 'tan-hoa-01')
  let currentScenario: 'arena' | 'dungeon' = params.get('scenario') === 'arena' ? 'arena' : 'dungeon'
  let game = new Game({ scenario: currentScenario, seed: currentSeed }), mode = 'combat', paused = false, ready = false, lockedUntil = 0
  let labGame = game.scenario === 'dungeon' ? game : new Game({ scenario:'dungeon',seed:currentSeed })
  let fixtureIndex = 0, assetPath = 'Map/Map_tileset.png', cropName = ''
  const labNames = [...fixtureNames, 'Dungeon theo seed']
  if (['combat', 'lab', 'assets'].includes(params.get('view') ?? '')) mode = params.get('view')!
  fixtureIndex = Math.max(0, Math.min(labNames.length - 1, Number(params.get('fixture')) || 0))
  if (files.some(f => f.path === params.get('asset'))) assetPath = params.get('asset')!
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)))
  const debug = { grid: params.get('grid') === '1', ids: params.get('ids') === '1', collision: params.get('collision') === '1', reveal: params.get('reveal') === '1', decorations: params.get('decor') !== '0', labFog: params.get('fog') === '1' }
  for (const option of Object.keys(debug) as (keyof typeof debug)[]) $<HTMLInputElement>(`#${option}`).checked = debug[option]
  const cropSources: Record<string, string> = { barrel: 'Map/Decorations_tileset.png', skull: 'Map/Decorations_tileset.png', coin: 'Others/Coin.png', heart: 'Others/HUD.png', potion: 'Others/HUD.png', sword: 'Weapons/Weapons_normal_right.png' }
  const cropLabels: Record<string,string> = { floor: 'Sàn', floorDust: 'Sàn bụi', floorCrack: 'Sàn nứt', wall: 'Mặt tường', top: 'Viền trên', bottom: 'Viền dưới', left: 'Viền trái', right: 'Viền phải', stairs: 'Cầu thang', arch: 'Vòm (chưa dùng)', barrel: 'Thùng (vật cản)', skull: 'Đầu lâu (trang trí)', coin: 'Đồng xu', heart: 'Tim HUD', potion: 'Bình hồi máu', sword: 'Kiếm ngang' }
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
    url.searchParams.set('seed',currentSeed); url.searchParams.set('scenario',currentScenario); url.searchParams.set('view',mode)
    if (mode === 'lab') url.searchParams.set('fixture',String(fixtureIndex))
    history.replaceState(null,'',url)
  }
  function refresh() {
    const p = game.player
    const dungeon = game.scenario === 'dungeon'
    $('#scene-name').textContent = mode === 'combat' ? dungeon ? '01 / TẦNG 1 · KHU CANH GÁC' : '01 / PHÒNG LUYỆN TẬP' : mode === 'lab' ? `02 / ${labNames[fixtureIndex]}` : '03 / THƯ VIỆN ASSETS'
    $('#scene-state').textContent = !ready ? 'ĐANG TẢI ASSETS…' : mode === 'combat' ? `LƯỢT ${String(game.turn).padStart(3,'0')} · ${paused ? 'TẠM DỪNG' : game.status === 'playing' ? 'CHỜ BẠN HÀNH ĐỘNG' : 'KẾT THÚC'}` : mode === 'lab' ? fixtureIndex === 4 ? `SEED: ${currentSeed}` : 'MAP CỐ ĐỊNH · KHÔNG SƯƠNG MÙ' : `${files.length} PNG · PIXEL GỐC`
    $('#coords').textContent = mode === 'combat' ? `${p.x}, ${p.y}` : ''
    $('#stage-hint').textContent = mode === 'combat' ? dungeon ? (game.exit && p.x === game.exit.x && p.y === game.exit.y ? 'Đã tới cầu thang. Nhấn E / Enter để hoàn thành tầng.' : 'Tìm cầu thang. Ô vàng báo bẫy; ô đỏ gây sát thương. Bình máu nhặt khi thiếu HP.') : 'Mỗi hành động là một lượt. Không có áp lực thời gian.' : mode === 'lab' ? 'Viền nằm trong ô tường. Cửa đóng và thùng chặn đường; cầu thang đi được.' : 'Khung nguồn và animation dùng đúng kích thước riêng của từng nhân vật.'
    const overlay = $('#overlay')
    overlay.hidden = !((game.status !== 'playing' || paused) && mode === 'combat')
    if (!overlay.hidden) {
      overlay.innerHTML = `<p class="eyebrow">${paused && game.status === 'playing' ? 'NGHỈ MỘT CHÚT' : game.status === 'dead' ? 'NGỌN LỬA ĐÃ TẮT' : dungeon ? 'ĐÃ TÌM THẤY ĐƯỜNG XUỐNG' : 'CĂN PHÒNG ĐÃ AN TOÀN'}</p><h2>${paused && game.status === 'playing' ? 'Đợi bước tiếp theo.' : game.status === 'dead' ? 'Bóng tối thắng lần này.' : 'Bạn vẫn còn ánh lửa.'}</h2><p>${paused && game.status === 'playing' ? 'Trò chơi đã dừng. Tiếp tục khi bạn sẵn sàng.' : `Kết thúc sau ${game.turn} lượt.${dungeon ? ` Tàn hỏa: ${game.emberFound?'đã tìm thấy':'chưa thu thập'}. Bản thử hiện có một tầng.` : ''}`}</p><button id="continue">${paused && game.status === 'playing' ? 'Tiếp tục' : dungeon ? 'Chơi lại seed này' : 'Thử lại'} <span>→</span></button>`
      $('#continue').onclick = () => { if (paused && game.status === 'playing') paused = false; else restart(); refresh(); canvas.focus() }
    }
    if (mode === 'combat') {
      $('#context').innerHTML = `<p class="eyebrow">NGƯỜI GIỮ LỬA</p><div class="stat-title"><h2>Kẻ thám hiểm</h2><span>TẦNG 01</span></div><div class="health-label"><span>Sinh lực</span><strong>${p.hp} <small>/ ${p.maxHp}</small></strong></div><div class="health-track"><i style="width:${p.hp/p.maxHp*100}%"></i></div><div class="stat-row"><span>${game.emberFound?'Kiếm tàn hỏa':'Kiếm cũ'}</span><strong>${game.attack} sát thương</strong></div><div class="stat-row"><span>Địch còn lại</span><strong>${game.enemies.filter(e=>e.hp>0).length} / ${game.enemies.length}</strong></div>${dungeon?`<div class="objective"><strong>Mục tiêu: tìm đường xuống</strong><p>Đi lên cầu thang rồi nhấn E / Enter. Tàn hỏa đỏ tăng sức mạnh; không cần hạ hết địch.</p><span>${game.emberFound?'✦ Đã nhận Tàn hỏa':'◇ Tàn hỏa chưa tìm thấy'}</span></div>`:''}<label class="select-label" for="scenario">Chế độ chơi</label><select id="scenario"><option value="dungeon" ${dungeon?'selected':''}>Khám phá dungeon</option><option value="arena" ${!dungeon?'selected':''}>Phòng luyện tập</option></select>${seedControls()}<button class="secondary full" id="restart">${dungeon?'Chơi lại seed này':'Bắt đầu lại'}</button>`
      $('#restart').onclick = restart
      $<HTMLSelectElement>('#scenario').onchange = e => { currentScenario=(e.target as HTMLSelectElement).value as 'arena'|'dungeon';restart();syncUrl() }
      $('#journal').innerHTML = `<p class="eyebrow">NHẬT KÝ HÀNH TRÌNH</p><ol class="log">${game.log.slice(0,5).map(l=>`<li>${escape(l)}</li>`).join('')}</ol><div class="tip"><strong>Đọc ý định của địch</strong><p>Ô đỏ là vùng sắp bị đánh. Bước ra ngoài trước lượt tiếp theo; tận dụng lúc lính canh hồi sức.</p></div>`
    } else if (mode === 'lab') {
      $('#context').innerHTML = `<p class="eyebrow">PHÒNG KIỂM TRA TILE</p><h2>Góc nối & đường viền</h2><label class="select-label" for="fixture">Bố cục mẫu</label><select id="fixture">${labNames.map((n,i)=>`<option value="${i}" ${i===fixtureIndex?'selected':''}>${n}</option>`).join('')}</select>${seedControls()}<p class="muted">Map logic → mặt tường → viền cạnh → góc chéo. Map seed luôn dùng đúng tầng đang chơi, kể cả vị trí địch và vật phẩm còn lại.</p>`
      $<HTMLSelectElement>('#fixture').onchange = e => { fixtureIndex = Number((e.target as HTMLSelectElement).value); refresh();syncUrl() }
      $('#journal').innerHTML = `<p class="eyebrow">CÁCH ĐỌC MAP</p><div class="tip"><strong>Mã E:C</strong><p>E là bitmask cạnh N=1, E=2, S=4, W=8 (hệ 16). C là góc chéo NE=0, SE=1, SW=2, NW=3. F: sàn, ST: cầu thang.</p></div><p class="muted">Mỗi viền nằm phía trong ô bị chặn. Góc lồi nối hai cạnh; góc lõm bổ sung mảnh góc khi chỉ có sàn chéo.</p><p class="muted">Cửa hiện là hình tạm dựng bằng Canvas. Vòm lớn và cầu thang chéo chưa được dùng làm tile tự ghép.</p>`
    } else {
      const file = files.find(f=>f.path===assetPath)!
      const relevant = Object.entries(crops).filter(([name])=>(cropSources[name] ?? 'Map/Map_tileset.png')===assetPath)
      $('#context').innerHTML = `<p class="eyebrow">THƯ VIỆN / ${files.length} PNG</p><h2>Khung hình gốc</h2><label class="select-label" for="asset">Tệp ảnh</label><select id="asset">${files.map(f=>`<option ${f.path===assetPath?'selected':''}>${escape(f.path)}</option>`).join('')}</select><div class="stat-row"><span>Kích thước</span><strong>${file.width} × ${file.height}</strong></div>${relevant.length?`<label class="select-label" for="crop">Vùng sử dụng</label><select id="crop"><option value="">Toàn bộ ảnh</option>${relevant.map(([n])=>`<option value="${n}" ${n===cropName?'selected':''}>${cropLabels[n]}</option>`).join('')}</select>`:''}<p class="muted">Lưới 16 px chỉ là thước tham chiếu cho atlas. Player dùng frame 17 px; Warrior dùng 22 px.</p>`
      $<HTMLSelectElement>('#asset').onchange = e => { assetPath=(e.target as HTMLSelectElement).value; cropName=''; refresh() }
      const cropSelect = $<HTMLSelectElement>('#crop')
      if (cropSelect) cropSelect.onchange = e => { cropName=(e.target as HTMLSelectElement).value; refresh() }
      $('#journal').innerHTML = `<p class="eyebrow">GHI CHÚ KIỂM KÊ</p><p class="muted">Player: 7 frame đi trước, 8 frame các hướng còn lại. Warrior: 12 frame trước/sau, 8 frame trái/phải. Monster và Boss: 4 frame mỗi hướng.</p><div class="tip"><strong>Boss có bộ hình riêng</strong><p>Chọn BossMonster và từng hướng để xem animation cùng điểm đặt chân. Boss chưa tham gia phòng chiến đấu ở mốc 2.</p></div>${cropName ? `<p class="muted">${cropLabels[cropName]}: [x, y, w, h] = ${(crops[cropName as keyof typeof crops]).join(', ')}</p>` : ''}`
    }
    bindSeedControls()
  }
  function restart() {
    game = new Game({ scenario:currentScenario,seed:currentSeed }); labGame=game.scenario==='dungeon'?game:new Game({scenario:'dungeon',seed:currentSeed})
    paused = false; lockedUntil = 0; renderer.before.clear(); renderer.started=-1000; refresh(); canvas.focus()
  }
  function act(action: Action) {
    if (!ready || paused || mode !== 'combat' || performance.now() < lockedUntil || game.status !== 'playing') return
    renderer.transition(game)
    if (game.act(action)) lockedUntil = performance.now() + 185
    refresh()
  }
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
    button.onclick = () => {
      mode = button.dataset.mode!
      document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed', String(b === button)))
      refresh(); syncUrl(); canvas.focus()
    }
  })
  for (const option of Object.keys(debug) as (keyof typeof debug)[]) $<HTMLInputElement>(`#${option}`).onchange = e => { debug[option]=(e.target as HTMLInputElement).checked }
  window.addEventListener('keydown', event => {
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return
    const moves: Record<string,[number,number]> = { w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0] }
    const move=moves[event.key] ?? moves[event.key.toLowerCase()]
    if (move || event.key === ' ' || event.key === '.' || event.key === 'Enter') event.preventDefault()
    if (event.repeat || mode !== 'combat') return
    if (event.key === 'Escape') { paused=!paused; refresh(); return }
    if (event.key.toLowerCase()==='r' && game.status !== 'playing') { restart(); return }
    if (move) act({type:'move',dx:move[0],dy:move[1]})
    else if (event.key === ' ' || event.key === '.') act({type:'wait'})
    else if (event.key.toLowerCase() === 'e' || event.key === 'Enter') act({type:'interact'})
  })
  window.addEventListener('blur',()=> { if (mode === 'combat' && game.status === 'playing') { paused=true; refresh() } })
  canvas.onpointerdown=()=>canvas.focus()
  function frame(time: number) {
    if (ready) {
      if (mode === 'combat') renderer.combat(game,time,debug)
      else if (mode === 'lab') renderer.lab(fixtureIndex === 4 ? labGame.board : fixture(fixtureIndex),debug,fixtureIndex === 4 ? labGame : undefined,time)
      else renderer.asset(assetPath,time,debug.grid,cropName ? crops[cropName as keyof typeof crops] as Rect : undefined)
    }
    requestAnimationFrame(frame)
  }
  refresh()
  loadAssets().then(()=> { ready=true; refresh(); canvas.focus(); requestAnimationFrame(frame) }).catch(error=> {
    $('#overlay').hidden=false; $('#overlay').textContent=`Không thể tải assets: ${error.message}. Hãy tải lại trang sau khi kiểm tra các file ảnh.`
    $('#scene-state').textContent='LỖI TẢI ASSETS'
  })
  
}
