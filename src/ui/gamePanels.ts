import type { Game } from '../game/Game'
import { INVENTORY_LIMIT, makeItem, shopOffers, weaponDescriptions } from '../data/items'
import { upgrades } from '../data/upgrades'
import { balance } from '../data/balance'

export function playerPanel(g:Game) {
  const p=g.player,potion=g.inventory.find(i=>i.kind==='potion')
  return `<p class="eyebrow">NGƯỜI GIỮ LỬA</p><div class="stat-title"><h2>Kẻ thám hiểm</h2><span>LV. ${g.level}</span></div>
  <div class="health-label"><span>Sinh lực</span><strong>${p.hp} <small>/ ${p.maxHp}</small></strong></div><div class="health-track"><i style="width:${p.hp/p.maxHp*100}%"></i></div>
  <div class="xp-track" aria-label="Kinh nghiệm"><i style="width:${g.xp/g.xpToNext*100}%"></i></div><div class="stat-row"><span>XP ${g.xp}/${g.xpToNext}</span><strong>${g.gold} vàng</strong></div>
  <div class="stat-row"><span>${g.weapon.name}</span><strong>${g.attack}${g.charged?` + ${g.charged}`:''} sát thương</strong></div><div class="stat-row"><span>Giáp / chắn</span><strong>${g.defense} / ${g.shield}</strong></div>
  <div class="objective"><strong>${g.status==='camp'?'Tiếp tế trước chặng mới':g.recovering?'Cần hồi sức — nhấn Space':g.floor===3?'Hạ Thú Vương Tàn Hỏa':'Tìm cầu thang để xuống tiếp'}</strong><p>${g.recovering?'Rìu cần một lượt chờ sau khi chém.':weaponDescriptions[g.weapon.id as keyof typeof weaponDescriptions]}</p></div>
  <div class="panel-actions"><button id="bag" class="secondary" ${g.status!=='playing'?'disabled':''}>I · Túi ${g.inventory.length}/${INVENTORY_LIMIT}</button><button data-use="0" class="secondary" ${g.status!=='playing'||!potion||p.hp===p.maxHp||g.recovering?'disabled':''}>1 · Máu ×${potion?.quantity??0}</button></div>`
}
export function inventoryPanel(g:Game) {
  return `<div class="modal-content"><p class="eyebrow">HÀNH TRANG · ${g.inventory.length}/${INVENTORY_LIMIT}</p><h2>Chuẩn bị bước tiếp theo.</h2><p>Mở túi không tốn lượt. Trang bị, bỏ đồ hoặc uống thuốc tốn một lượt và địch sẽ hành động.</p>
  <div class="item-list">${g.inventory.map(i=>{
    const equipped=i.uid===g.weaponUid||i.uid===g.armorUid
    return `<article class="item-row"><div><strong>${i.name}${i.quantity>1?` ×${i.quantity}`:''}</strong><small>${i.kind==='potion'?`Hồi tối đa ${balance.potionHeal} HP`:i.kind==='armor'?`Giảm ${i.power} sát thương mỗi đòn`:weaponDescriptions[i.id as keyof typeof weaponDescriptions]}${equipped?' · ĐANG TRANG BỊ':''}</small></div><div>${i.kind==='potion'?`<button data-use="${g.inventory.filter(a=>a.kind==='potion').indexOf(i)}" ${g.player.hp===g.player.maxHp||g.recovering?'disabled':''}>Uống</button>`:`<button data-equip="${i.uid}" ${equipped||g.recovering?'disabled':''}>Trang bị</button>`}<button data-drop="${i.uid}" ${equipped||g.recovering?'disabled':''}>Bỏ</button></div></article>`
  }).join('')}</div><button id="close-bag" class="secondary">Đóng túi · I / Esc</button></div>`
}
export function campPanel(g:Game) {
  return `<div class="modal-content camp"><p class="eyebrow">ĐIỂM TIẾP TẾ · TẦNG ${g.floor} → ${g.floor+1}</p><h2>Một khoảng sáng giữa bóng tối.</h2><p>Chọn một nâng cấp. Mua đồ bằng vàng trước khi tiếp tục. Thế giới đang chờ.</p><div class="upgrade-grid">${upgrades.map((u,i)=>`<button data-upgrade="${u.id}" class="upgrade ${g.chosenUpgrade===u.id?'selected':''}" ${g.chosenUpgrade?'disabled':''}><small>0${i+1}</small><strong>${u.name}</strong><span>${u.description}</span></button>`).join('')}</div>
  <div class="camp-heading"><h3>Tiếp tế</h3><strong id="camp-gold">${g.gold} vàng · Túi ${g.inventory.length}/${INVENTORY_LIMIT}</strong></div><div class="shop-grid">${shopOffers.map((o,i)=>`<button data-buy="${i}" ${g.gold<o.price||g.purchased.has(i)||(g.inventory.length>=INVENTORY_LIMIT&&!(o.id==='potion'&&g.inventory.some(p=>p.kind==='potion'&&p.quantity<3)))?'disabled':''}>${makeItem(o.id,o.tier,-1).name}<small>${g.purchased.has(i)?'Đã mua':`${o.price} vàng`}</small></button>`).join('')}</div>
  <details><summary>Đồ đang mang · bán đồ chưa trang bị</summary><div class="sell-list">${g.inventory.map(i=>`<button data-sell="${i.uid}" ${i.uid===g.weaponUid||i.uid===g.armorUid?'disabled':''}>${i.name} ×${i.quantity} <small>+${i.kind==='potion'?2:3+i.tier*2} vàng</small></button>`).join('')}</div></details>
  <button id="descend" ${g.chosenUpgrade?'':'disabled'}>Xuống tầng ${g.floor+1} →</button><p class="muted">${g.chosenUpgrade?'Nâng cấp đã nhận. HP, vàng, trang bị và kinh nghiệm được giữ khi xuống tầng.':'Chọn một nâng cấp để tiếp tục. Túi đầy thì bán đồ chưa trang bị để tạo chỗ trống.'}</p></div>`
}
export function endingPanel(g:Game) {
  return `<div class="modal-content"><p class="eyebrow">${g.status==='dead'?'NGỌN LỬA ĐÃ TẮT':'PHÁO ĐÀI ĐÃ ĐƯỢC GIẢI THOÁT'}</p><h2>${g.status==='dead'?'Bóng tối thắng lần này.':'Bạn mang ánh lửa trở về.'}</h2>${g.status==='dead'?`<p>Đòn kết liễu: ${g.deathReason}.</p>`:''}<div class="run-stats"><span>Tầng <strong>${g.floor}/3</strong></span><span>Lượt <strong>${g.turn}</strong></span><span>Địch hạ <strong>${g.kills}</strong></span><span>Cấp <strong>${g.level}</strong></span><span>Vàng <strong>${g.gold}</strong></span></div><p>Chơi lại cùng seed để thử một lựa chọn trang bị và nâng cấp khác.</p><button id="continue">Bắt đầu hành trình mới →</button></div>`
}
