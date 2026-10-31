import type { Action } from '../game/types'
import type { Game } from '../game/Game'

export type ReadPanel = 'stats' | 'journal'
type Controls = {perform:(action:Action)=>void;open:(panel:ReadPanel|'bag')=>void;pause:()=>void;canAct:()=>boolean}

export function bindTouchControls(controls:Controls) {
  const $=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!
  let attackMode=false
  const attack=$<HTMLButtonElement>('#touch-attack')
  function reset() {attackMode=false;attack.setAttribute('aria-pressed','false')}
  document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button=>{
    const [dx,dy]=button.dataset.direction!.split(',').map(Number)
    button.onclick=()=>{if(controls.canAct())controls.perform({type:attackMode?'attack':'move',dx:dx!,dy:dy!})}
  })
  attack.onclick=()=>{if(controls.canAct()){attackMode=!attackMode;attack.setAttribute('aria-pressed',String(attackMode));$('#touch-tip').textContent=attackMode?'Chọn hướng để đánh tại chỗ. Chạm Đánh lần nữa để đi.':'Chạm hướng để đi hoặc đánh địch sát bên.'}}
  $('#touch-wait').onclick=()=>{if(controls.canAct())controls.perform({type:'wait'})}
  $('#touch-heal').onclick=()=>{if(controls.canAct())controls.perform({type:'use',slot:0})}
  $('#touch-stairs').onclick=()=>{if(controls.canAct())controls.perform({type:'interact'})}
  document.querySelectorAll<HTMLButtonElement>('[data-open-panel]').forEach(button=>button.onclick=()=>{reset();controls.open(button.dataset.openPanel as ReadPanel|'bag')})
  $('#touch-pause').onclick=()=>{reset();controls.pause()}
  function update(game:Game,blocked:boolean) {
    const playing=game.status==='playing',p=game.player
    if(blocked||!playing)reset()
    document.querySelectorAll<HTMLButtonElement>('[data-direction],#touch-attack').forEach(b=>b.disabled=blocked||!playing)
    $<HTMLButtonElement>('#touch-wait').disabled=blocked||!playing
    $<HTMLButtonElement>('#touch-heal').disabled=blocked||!playing||p.hp===p.maxHp||!game.inventory.some(i=>i.kind==='potion')
    $<HTMLButtonElement>('#touch-stairs').disabled=blocked||!playing||game.floor>=3||p.x!==game.exit?.x||p.y!==game.exit?.y
    $<HTMLButtonElement>('#touch-pause').disabled=!playing
    document.querySelectorAll<HTMLButtonElement>('[data-open-panel]').forEach(b=>b.disabled=!playing||blocked)
    const potions=game.inventory.filter(i=>i.kind==='potion').reduce((sum,i)=>sum+i.quantity,0)
    $('#touch-heal').textContent=`Thuốc ×${potions}`
    $('#touch-tip').textContent=attackMode?'Chọn hướng để đánh tại chỗ. Chạm Đánh lần nữa để đi.':'Chạm hướng để đi hoặc đánh địch sát bên.'
    $('#mobile-hud').innerHTML=`<div class="mobile-vitals"><span>HP <strong>${p.hp}/${p.maxHp}</strong></span><span>Cấp ${game.level} · ${game.gold} vàng</span><span>Lượt ${game.turn}</span></div><div class="health-track" role="meter" aria-label="Sinh lực" aria-valuenow="${p.hp}" aria-valuemin="0" aria-valuemax="${p.maxHp}"><i style="width:${p.hp/p.maxHp*100}%"></i></div><div class="mobile-gear">${game.weapon.name} · Công ${game.attack} · Giáp ${game.defense}${game.shield?` · Chắn ${game.shield}`:''}</div>`
  }
  return {update,reset}
}
