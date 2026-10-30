import type { Game } from '../game/Game'
export function contextualHint(g:Game,touch=false) {
  const p=g.player
  if(g.status==='dead')return `Bạn đã gục ngã: ${g.deathReason}. ${touch?'Chạm Bắt đầu hành trình mới để thử lại.':'Nhấn R để thử lại.'}`
  if(g.status==='camp')return 'Chọn nâng cấp rồi mua/bán đồ trước khi xuống tầng. Không tốn lượt.'
  if(g.status!=='playing')return 'Hành trình đã kết thúc. Bạn có thể thử lại với lựa chọn khác.'
  if(g.enemies.some(e=>e.hp>0&&g.canSee(e)&&e.intent.some(t=>t.x===p.x&&t.y===p.y)))return '⚠ Bạn đang trong vùng sắp bị đánh! Rời ô có dấu ! trước lượt kế tiếp.'
  if(g.recovering)return `Rìu cần hồi sức: ${touch?'chạm Chờ':'nhấn Space'}. Không thể di chuyển hoặc uống thuốc trong lượt này.`
  const trap=g.traps.find(t=>t.x===p.x&&t.y===p.y)
  if(trap&&trap.phase!==0)return '⚠ Đang đứng trên bẫy gai. Bước ra ngay; chờ hoặc dùng đồ vẫn làm bẫy tiến lượt.'
  if(p.hp<=p.maxHp/3)return `Sinh lực thấp! ${touch?'Chạm Thuốc':'Phím 1'} uống thuốc nếu có; dùng thuốc cũng tốn một lượt.`
  if(g.exit?.x===p.x&&g.exit.y===p.y&&g.floor<3)return `Đã tới cầu thang. ${touch?'Chạm Xuống tầng':'Nhấn E / Enter'} để tới điểm tiếp tế.`
  if(g.loot.some(l=>l.x===p.x&&l.y===p.y))return `Đồ còn dưới chân: túi đầy. ${touch?'Mở Túi đồ':'Mở I'} để bỏ một món chưa trang bị rồi ${touch?'chạm Chờ':'Space'} để nhặt.`
  if(touch)return 'Đi vào địch để đánh. Bật Đánh + hướng để đánh tại chỗ; ? mở hướng dẫn.'
  return 'Đi vào địch để đánh. Shift + hướng đánh tại chỗ; trang bị không tự tấn công. ? mở hướng dẫn.'
}
export function helpPanel() {
  return `<div class="modal-content help"><p class="eyebrow">CẨM NANG NGƯỜI GIỮ LỬA</p><h2>Mỗi bước đều là lựa chọn.</h2><p>Thế giới chỉ tiến khi bạn hành động. Mở hướng dẫn và túi đồ không tốn lượt.</p><dl><dt>Chơi trên điện thoại</dt><dd>Chạm D-pad để đi hoặc đánh địch sát bên. Bật Đánh + hướng rồi chạm hướng để đánh tại chỗ; chạm Đánh lần nữa để trở về di chuyển. Nút Chờ dùng để hồi sức rìu. Thuốc dùng bình đầu tiên; mở Túi đồ để chọn bình khác, trang bị hoặc bỏ đồ. Chỉ số và Nhật ký mở bảng riêng, không tốn lượt. Nút Xuống tầng sáng khi đứng ở cầu thang. Đóng bảng bằng nút × Đóng.</dd><dt>Di chuyển và đánh</dt><dd>WASD / mũi tên để đi; đi vào địch để đánh bằng vũ khí đang trang bị. Trang bị không tự tấn công. Shift + hướng đánh tại chỗ: kiếm 1 ô, giáo tối đa 2 ô, rìu quét 3 ô và cần Space hồi sức.</dd><dt>Hành trang và hồi phục</dt><dd>I mở túi. Trang bị, bỏ đồ và dùng bình đều tốn lượt. Phím 1–3 dùng các chồng thuốc; một bình hồi tối đa 12 HP. Nhặt bình không tự uống. Túi đầy thì bỏ đồ chưa trang bị và chờ trên vật phẩm để nhặt lại.</dd><dt>Đọc bản đồ</dt><dd>Thùng gỗ và cửa đóng chặn đường. Xương, đầu lâu và đuốc là trang trí, không chặn. Xu là vàng; bình đỏ là thuốc; khung vũ khí / khiên là trang bị; đốm lửa là Tàn hỏa. Cầu thang dùng E / Enter.</dd><dt>Nguy hiểm có báo trước</dt><dd>Ô có dấu ! là vùng địch chuẩn bị đánh; rời vùng trước hành động tiếp theo. Bẫy gai: ! vàng báo trước, × đỏ đang kích hoạt. Địch và bẫy vẫn hành động khi bạn đổi đồ hoặc uống thuốc. Boss khóa vùng húc / đập đất rồi hồi sức; tận dụng khoảng trống đó.</dd><dt>Tiếp tế và kết thúc</dt><dd>Qua hai điểm tiếp tế, chọn nâng cấp rồi mua/bán bằng vàng. Tầng 3 hạ Thú Vương để thắng. Chết mất tiến trình; R chơi lại cùng seed. Space / dấu chấm chờ; Esc tạm dừng. Rời cửa sổ sẽ tự tạm dừng.</dd></dl><button id="close-help">Đã hiểu · ? / Esc</button></div>`
}
