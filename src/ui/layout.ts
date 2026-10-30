export function mountLayout() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="masthead">
    <a class="brand" href="#"><span class="brand-icon">✦</span> TÀN HỎA</a><span id="floor-badge" class="floor-badge">TẦNG 1 / 3</span>
    <span class="header-message">Bóng tối có thể chờ. Hãy tính bước tiếp theo.</span>
    <div class="header-controls"><button id="help" class="secondary" aria-label="Mở hướng dẫn">? · Hướng dẫn</button>
    <details class="display-settings"><summary>Âm thanh & hiển thị</summary><section class="settings" aria-label="Âm thanh và hiển thị"><label><input id="sound" type="checkbox"> Âm thanh</label><label for="volume">Âm lượng <input id="volume" type="range" min="0" max="100" step="5"></label><label><input id="motion" type="checkbox"> Giảm chuyển động</label></section></details></div>
  </header>
  <main>
    <div id="onboarding" class="onboarding"><p><strong>Lần đầu xuống hầm ngục?</strong> WASD để đi; đi vào địch để đánh. Né ô có dấu ! trước lượt kế tiếp. Nhấn ? để đọc cẩm nang.</p><button id="dismiss-intro" class="secondary">Đã hiểu</button></div>
    <div class="workspace">
      <aside class="sidebar-left" aria-label="Nhân vật và trang bị">
        <section class="card" id="context"></section>
      </aside>
      <section class="stage-panel" aria-label="Khu vực trò chơi"><div class="stage-heading"><span id="scene-name">PHÒNG CANH GÁC</span><span id="scene-state">ĐANG TẢI ASSETS…</span></div><div class="canvas-wrap"><canvas id="game" width="960" height="672" tabindex="0" aria-label="Phòng chiến đấu. WASD để đi hoặc đánh; Space để chờ; ? mở hướng dẫn."></canvas><div id="overlay" class="overlay" role="dialog" aria-label="Bảng thông tin trò chơi" hidden></div></div><div class="stage-footer"><span class="live-dot"></span><span id="stage-hint" role="status" aria-live="polite"></span><span id="coords"></span></div></section>
      <aside class="sidebar-right" aria-label="Hành trang và nhật ký"><section class="card" id="bag-summary"></section><section class="card" id="journal"></section></aside>
    </div>
    <footer class="page-footer"><span>WASD / ↑↓←→ <b>Đi / đánh</b></span><span>SHIFT + HƯỚNG <b>Đánh tại chỗ</b></span><span>SPACE <b>Chờ</b></span><span>I <b>Túi đồ</b></span><span>1–3 <b>Uống thuốc</b></span><span>E <b>Cầu thang</b></span><span>ESC <b>Tạm dừng</b></span></footer>
  </main>`
}
