import type { Game } from '../game/Game'
import { INVENTORY_LIMIT, makeItem, shopOffers, weaponDescriptions } from '../data/items'
import { upgrades } from '../data/upgrades'
import { balance } from '../data/balance'
import { getItemIcon } from '../render/itemIcons'
import { POTION_STACK_LIMIT } from '../systems/inventory'

export function playerPanel(g:Game) {
  const p=g.player
  return `<p class="eyebrow">NGƯỜI GIỮ LỬA</p><div class="stat-title"><h2>Kẻ thám hiểm</h2><span>LV. ${g.level}</span></div>
  <div class="health-label"><span>Sinh lực</span><strong>${p.hp} <small>/ ${p.maxHp}</small></strong></div><div class="health-track"><i style="width:${p.hp/p.maxHp*100}%"></i></div>
  <div class="xp-track" aria-label="Kinh nghiệm"><i style="width:${g.xp/g.xpToNext*100}%"></i></div><div class="stat-row"><span>XP ${g.xp}/${g.xpToNext}</span><strong>${g.gold} vàng</strong></div>
  <div class="stat-row"><span>Sát thương</span><strong id="player-attack">${g.attack}${g.charged?` + ${g.charged}`:''}</strong></div><div class="stat-row"><span>Giáp / chắn</span><strong>${g.defense} / ${g.shield}</strong></div><div class="stat-row"><span>Lượt / địch đã hạ</span><strong>${g.turn} / ${g.kills}</strong></div>
  <div class="equipment-block"><p class="eyebrow">TRANG BỊ HIỆN TẠI</p><span>Vũ khí</span><strong>${g.weapon.name}</strong><span>Giáp</span><strong>${g.armor?.name??'Chưa trang bị'}</strong></div>
  <div class="objective"><strong>${g.status==='camp'?'Tiếp tế trước chặng mới':g.floor===3?'Hạ Thú Vương Tàn Hỏa':'Tìm cầu thang để xuống tiếp'}</strong><p>${weaponDescriptions[g.weapon.id as keyof typeof weaponDescriptions]}</p></div>
  `
}

export function bagSummary(g: Game, selectedUid?: number | null) {
  const active = g.status === 'playing'
  const selectedItem = g.inventory.find(i => i.uid === selectedUid)
  const isEquipped = selectedItem ? (selectedItem.uid === g.weaponUid || selectedItem.uid === g.armorUid) : false
  const tileHasLoot = g.loot.some(l => l.x === g.player.x && l.y === g.player.y)

  let canUse = false
  if (active && selectedItem) {
    if (selectedItem.kind === 'potion') {
      canUse = g.player.hp < g.player.maxHp
    } else {
      canUse = !isEquipped
    }
  }
  const canDrop = active && Boolean(selectedItem) && !isEquipped && !tileHasLoot

  const slots = Array.from({ length: INVENTORY_LIMIT }, (_, idx) => {
    const item = g.inventory[idx]
    if (!item) {
      return `<div class="bag-slot empty" aria-hidden="true"></div>`
    }
    const isSelected = item.uid === selectedUid
    const equipped = item.uid === g.weaponUid || item.uid === g.armorUid
    return `<button type="button" class="bag-slot bag-item ${isSelected ? 'selected' : ''} ${equipped ? 'equipped' : ''}" data-bag-select="${item.uid}" title="${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}" aria-label="${item.name}, số lượng ${item.quantity}">
      <img src="${getItemIcon(item)}" alt="${item.name}" class="bag-item-icon" />
      <span class="slot-qty">${item.quantity}</span>
      ${equipped ? '<span class="slot-tag">DÙNG</span>' : ''}
    </button>`
  }).join('')

  const itemDesc = selectedItem
    ? (selectedItem.kind === 'potion'
        ? `Hồi tối đa ${balance.potionHeal} HP`
        : selectedItem.kind === 'armor'
        ? `Giảm ${selectedItem.power} sát thương mỗi đòn`
        : weaponDescriptions[selectedItem.id as keyof typeof weaponDescriptions])
    : ''

  return `<div class="bag-header">
    <p class="eyebrow">TÚI ĐỒ · ${g.inventory.length}/${INVENTORY_LIMIT}</p>
  </div>
  <div class="bag-grid" role="region" aria-label="Các ô túi đồ">
    ${slots}
  </div>
  <div class="bag-selected-info">
    ${selectedItem
      ? `<div class="bag-selected-name"><strong>${selectedItem.name}</strong>${isEquipped ? ' <span class="badge-equipped">Đang dùng</span>' : ''}</div>
         <div class="bag-selected-desc">${itemDesc}</div>`
      : `<div class="bag-selected-desc muted">Chọn một vật phẩm trong túi</div>`
    }
  </div>
  <div class="bag-actions">
    <button id="bag-action-use" class="bag-btn use-btn" ${canUse ? '' : 'disabled'}>Dùng</button>
    <button id="bag-action-drop" class="bag-btn drop-btn" ${canDrop ? '' : 'disabled'}>Bỏ</button>
  </div>`
}

export function inventoryPanel(g: Game, selectedUid?: number | null) {
  return `<div class="modal-content bag-modal-content">
    ${bagSummary(g, selectedUid)}
    <button id="close-bag" class="secondary" data-close-panel>Đóng túi · Esc</button>
  </div>`
}

export function campPanel(g:Game) {
  return `<div class="modal-content camp"><p class="eyebrow">ĐIỂM TIẾP TẾ · TẦNG ${g.floor} → ${g.floor+1}</p><h2>Một khoảng sáng giữa bóng tối.</h2><p>Chọn một nâng cấp. Mua đồ bằng vàng trước khi tiếp tục. Thế giới đang chờ.</p><div class="upgrade-grid">${upgrades.map((u,i)=>`<button data-upgrade="${u.id}" class="upgrade ${g.chosenUpgrade===u.id?'selected':''}" ${g.chosenUpgrade?'disabled':''}><small>0${i+1}</small><strong>${u.name}</strong><span>${u.description}</span></button>`).join('')}</div>
  <div class="camp-heading"><h3>Tiếp tế</h3><strong id="camp-gold">${g.gold} vàng · Túi ${g.inventory.length}/${INVENTORY_LIMIT}</strong></div><div class="shop-grid">${shopOffers.map((o,i)=>`<button data-buy="${i}" ${g.gold<o.price||g.purchased.has(i)||(g.inventory.length>=INVENTORY_LIMIT&&!(o.id==='potion'&&g.inventory.some(p=>p.kind==='potion'&&p.quantity<POTION_STACK_LIMIT)))?'disabled':''}>${makeItem(o.id,o.tier,-1).name}<small>${g.purchased.has(i)?'Đã mua':`${o.price} vàng`}</small></button>`).join('')}</div>
  <details><summary>Đồ đang mang · bán đồ chưa trang bị</summary><div class="sell-list">${g.inventory.map(i=>`<button data-sell="${i.uid}" ${i.uid===g.weaponUid||i.uid===g.armorUid?'disabled':''}>${i.name} ×${i.quantity} <small>+${i.kind==='potion'?2:3+i.tier*2} vàng</small></button>`).join('')}</div></details>
  <button id="descend" ${g.chosenUpgrade?'':'disabled'}>Xuống tầng ${g.floor+1} →</button><p class="muted">${g.chosenUpgrade?'Nâng cấp đã nhận. HP, vàng, trang bị và kinh nghiệm được giữ khi xuống tầng.':'Chọn một nâng cấp để tiếp tục. Túi đầy thì bán đồ chưa trang bị để tạo chỗ trống.'}</p></div>`
}

export function endingPanel(g:Game) {
  return `<div class="modal-content"><p class="eyebrow">${g.status==='dead'?'NGỌN LỬA ĐÃ TẮT':'PHÁO ĐÀI ĐÃ ĐƯỢC GIẢI THOÁT'}</p><h2>${g.status==='dead'?'Bóng tối thắng lần này.':'Bạn mang ánh lửa trở về.'}</h2>${g.status==='dead'?`<p>Đòn kết liễu: ${g.deathReason}.</p>`:''}<div class="run-stats"><span>Tầng <strong>${g.floor}/3</strong></span><span>Lượt <strong>${g.turn}</strong></span><span>Địch hạ <strong>${g.kills}</strong></span><span>Cấp <strong>${g.level}</strong></span><span>Vàng <strong>${g.gold}</strong></span></div><p>Chơi lại cùng seed để thử một lựa chọn trang bị và nâng cấp khác.</p><button id="continue">Bắt đầu hành trình mới →</button></div>`
}
