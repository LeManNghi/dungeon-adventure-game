import './style.css'
import { crops, files, loadAssets } from './assets'
import type { Rect } from './assets'
import { Game } from './game'
import type { Action } from './game'
import { Renderer } from './renderer'
import { fixture, fixtureNames } from './world'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header class="masthead"><a class="brand" href="#"><span class="brand-icon">✦</span> TÀN HỎA <span class="brand-sub">DUNGEON CHRONICLES</span></a><span class="build-label">BẢN THỬ 0.1 <i></i> MỐC 1 + 2</span></header>
<main><div class="intro"><div><p class="eyebrow">CHƯƠNG I / DƯỚI PHÁO ĐÀI</p><h1>Ánh lửa cuối cùng.</h1><p class="lede">Bóng tối có thể chờ. Hãy tính bước tiếp theo.</p></div><nav aria-label="Chế độ"><button data-mode="combat" aria-pressed="true">01 <span>Chiến đấu</span></button><button data-mode="lab" aria-pressed="false">02 <span>Kiểm tra map</span></button><button data-mode="assets" aria-pressed="false">03 <span>Assets</span></button></nav></div>
<div class="workspace"><section class="stage-panel" aria-label="Khu vực trò chơi"><div class="stage-heading"><span id="scene-name">PHÒNG CANH GÁC</span><span id="scene-state">ĐANG TẢI ASSETS…</span></div><div class="canvas-wrap"><canvas id="game" width="960" height="672" tabindex="0" aria-label="Phòng chiến đấu. Di chuyển bằng WASD hoặc phím mũi tên; Space để chờ."></canvas><div id="overlay" class="overlay" hidden></div></div><div class="stage-footer"><span class="live-dot"></span><span id="stage-hint">Mỗi hành động là một lượt. Không có áp lực thời gian.</span><span id="coords"></span></div></section>
<aside><section class="card" id="context"></section><section class="card tools"><p class="eyebrow">GÓC QUAN SÁT</p><label><input id="grid" type="checkbox"> Lưới ô</label><label><input id="ids" type="checkbox"> Mã ghép tile <small>map mẫu</small></label><label><input id="collision" type="checkbox"> Lớp va chạm</label><p class="muted">Màu hồng: ô bị chặn. Ô ngoài biên luôn bị chặn.</p></section><section class="card" id="journal"></section></aside></div>
<footer class="page-footer"><span>W A S D <b>Di chuyển / đánh</b></span><span>SPACE <b>Chờ một lượt</b></span><span>ESC <b>Tạm dừng</b></span><span>R <b>Chơi lại khi kết thúc</b></span></footer></main>`

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const canvas = $<HTMLCanvasElement>('#game'), renderer = new Renderer(canvas)
let game = new Game(), mode = 'combat', paused = false, ready = false, lockedUntil = 0
let fixtureIndex = 0, assetPath = 'Map/Map_tileset.png', cropName = ''
const params = new URLSearchParams(location.search)
if (['combat', 'lab', 'assets'].includes(params.get('view') ?? '')) mode = params.get('view')!
fixtureIndex = Math.max(0, Math.min(fixtureNames.length - 1, Number(params.get('fixture')) || 0))
if (files.some(f => f.path === params.get('asset'))) assetPath = params.get('asset')!
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)))
const debug = { grid: false, ids: false, collision: false }
const cropSources: Record<string, string> = { barrel: 'Map/Decorations_tileset.png', skull: 'Map/Decorations_tileset.png', coin: 'Others/Coin.png', heart: 'Others/HUD.png', sword: 'Weapons/Weapons_normal_right.png' }
const cropLabels: Record<string,string> = { floor: 'Sàn', floorDust: 'Sàn bụi', floorCrack: 'Sàn nứt', wall: 'Mặt tường', top: 'Viền trên', bottom: 'Viền dưới', left: 'Viền trái', right: 'Viền phải', stairs: 'Cầu thang', arch: 'Vòm (chưa dùng)', barrel: 'Thùng (vật cản)', skull: 'Đầu lâu (trang trí)', coin: 'Đồng xu', heart: 'Tim HUD', sword: 'Kiếm ngang' }
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
function refresh() {
  const p = game.player
  $('#scene-name').textContent = mode === 'combat' ? '01 / PHÒNG CANH GÁC' : mode === 'lab' ? `02 / ${fixtureNames[fixtureIndex]}` : '03 / THƯ VIỆN ASSETS'
  $('#scene-state').textContent = !ready ? 'ĐANG TẢI ASSETS…' : mode === 'combat' ? `LƯỢT ${String(game.turn).padStart(3,'0')} · ${paused ? 'TẠM DỪNG' : game.status === 'playing' ? 'CHỜ BẠN HÀNH ĐỘNG' : 'KẾT THÚC'}` : mode === 'lab' ? 'MAP CỐ ĐỊNH · KHÔNG SƯƠNG MÙ' : `${files.length} PNG · PIXEL GỐC`
  $('#coords').textContent = mode === 'combat' ? `${p.x}, ${p.y}` : ''
  $('#stage-hint').textContent = mode === 'combat' ? 'Mỗi hành động là một lượt. Không có áp lực thời gian.' : mode === 'lab' ? 'Viền nằm trong ô tường. Cửa đóng chặn đường; cầu thang đi được.' : 'Khung nguồn và animation dùng đúng kích thước riêng của từng nhân vật.'
  const overlay = $('#overlay')
  overlay.hidden = !((game.status !== 'playing' || paused) && mode === 'combat')
  if (!overlay.hidden) {
    overlay.innerHTML = `<p class="eyebrow">${paused && game.status === 'playing' ? 'NGHỈ MỘT CHÚT' : game.status === 'dead' ? 'NGỌN LỬA ĐÃ TẮT' : 'CĂN PHÒNG ĐÃ AN TOÀN'}</p><h2>${paused && game.status === 'playing' ? 'Đợi bước tiếp theo.' : game.status === 'dead' ? 'Bóng tối thắng lần này.' : 'Bạn vẫn còn ánh lửa.'}</h2><p>${paused && game.status === 'playing' ? 'Trò chơi đã dừng. Tiếp tục khi bạn sẵn sàng.' : `Kết thúc sau ${game.turn} lượt. Thử một cách tiếp cận khác?`}</p><button id="continue">${paused && game.status === 'playing' ? 'Tiếp tục' : 'Thử lại'} <span>→</span></button>`
    $('#continue').onclick = () => { if (paused && game.status === 'playing') paused = false; else restart(); refresh(); canvas.focus() }
  }
  if (mode === 'combat') {
    $('#context').innerHTML = `<p class="eyebrow">NGƯỜI GIỮ LỬA</p><div class="stat-title"><h2>Kẻ thám hiểm</h2><span>LV. 01</span></div><div class="health-label"><span>Sinh lực</span><strong>${p.hp} <small>/ ${p.maxHp}</small></strong></div><div class="health-track"><i style="width:${p.hp/p.maxHp*100}%"></i></div><div class="stat-row"><span>Kiếm cũ</span><strong>5 sát thương</strong></div><div class="stat-row"><span>Địch còn lại</span><strong>${game.enemies.filter(e=>e.hp>0).length} / 2</strong></div><button class="secondary full" id="restart">Bắt đầu lại</button>`
    $('#restart').onclick = restart
    $('#journal').innerHTML = `<p class="eyebrow">NHẬT KÝ HÀNH TRÌNH</p><ol class="log">${game.log.slice(0,5).map(l=>`<li>${escape(l)}</li>`).join('')}</ol><div class="tip"><strong>Đọc ý định của địch</strong><p>Ô đỏ là vùng sắp bị đánh. Bước ra ngoài trước lượt tiếp theo; tận dụng lúc lính canh hồi sức.</p></div>`
  } else if (mode === 'lab') {
    $('#context').innerHTML = `<p class="eyebrow">PHÒNG KIỂM TRA TILE</p><h2>Góc nối & đường viền</h2><label class="select-label" for="fixture">Bố cục mẫu</label><select id="fixture">${fixtureNames.map((n,i)=>`<option value="${i}" ${i===fixtureIndex?'selected':''}>${n}</option>`).join('')}</select><p class="muted">Map logic → mặt tường → viền cạnh → góc chéo. Không chọn tile khác vai trò ngẫu nhiên.</p>`
    $<HTMLSelectElement>('#fixture').onchange = e => { fixtureIndex = Number((e.target as HTMLSelectElement).value); refresh() }
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
}
function restart() { game = new Game(); paused = false; lockedUntil = 0; renderer.before.clear(); renderer.started=-1000; refresh(); canvas.focus() }
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
    refresh(); canvas.focus()
  }
})
for (const option of ['grid','ids','collision'] as const) $<HTMLInputElement>(`#${option}`).onchange = e => { debug[option]=(e.target as HTMLInputElement).checked }
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return
  const moves: Record<string,[number,number]> = { w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0] }
  const move=moves[event.key] ?? moves[event.key.toLowerCase()]
  if (move || event.key === ' ' || event.key === '.') event.preventDefault()
  if (event.repeat || mode !== 'combat') return
  if (event.key === 'Escape') { paused=!paused; refresh(); return }
  if (event.key.toLowerCase()==='r' && game.status !== 'playing') { restart(); return }
  if (move) act({type:'move',dx:move[0],dy:move[1]})
  else if (event.key === ' ' || event.key === '.') act({type:'wait'})
})
window.addEventListener('blur',()=> { if (mode === 'combat' && game.status === 'playing') { paused=true; refresh() } })
canvas.onpointerdown=()=>canvas.focus()
function frame(time: number) {
  if (ready) {
    if (mode === 'combat') renderer.combat(game,time,debug)
    else if (mode === 'lab') renderer.lab(fixture(fixtureIndex),debug)
    else renderer.asset(assetPath,time,debug.grid,cropName ? crops[cropName as keyof typeof crops] as Rect : undefined)
  }
  requestAnimationFrame(frame)
}
refresh()
loadAssets().then(()=> { ready=true; refresh(); canvas.focus(); requestAnimationFrame(frame) }).catch(error=> {
  $('#overlay').hidden=false; $('#overlay').textContent=`Không thể tải assets: ${error.message}. Hãy tải lại trang sau khi kiểm tra các file ảnh.`
  $('#scene-state').textContent='LỖI TẢI ASSETS'
})
