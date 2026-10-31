import { images } from './assets'
import { crops } from '../data/sprites'
import { equippedWeaponSprite } from '../data/weaponSprites'
import type { Item, WeaponKind } from '../data/items'

const iconCache = new Map<string, string>()

export function getItemIcon(item: Item): string {
  if (typeof document === 'undefined') return ''

  const key = `${item.id}_${item.tier}`
  const cached = iconCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.imageSmoothingEnabled = false

  if (item.kind === 'potion') {
    const img = images.get('Others/HUD.png')
    if (!img) return ''
    ctx.drawImage(img, crops.potion[0], crops.potion[1], crops.potion[2], crops.potion[3], 0, 0, 32, 32)
  } else if (item.kind === 'weapon') {
    const art = equippedWeaponSprite(item.id as WeaponKind, item.tier)
    const img = images.get(art.path)
    if (!img) return ''
    ctx.drawImage(img, art.rect[0], art.rect[1], art.rect[2], art.rect[3], 0, 0, 32, 32)
  } else if (item.kind === 'armor') {
    const tierColor = item.tier === 2 ? '#c48bf2' : item.tier === 1 ? '#e2be66' : '#d2d6c8'
    const darkColor = item.tier === 2 ? '#582f7c' : item.tier === 1 ? '#68501c' : '#393f3c'
    const highlight = 'rgba(255, 255, 255, 0.28)'

    // Outer silhouette
    ctx.fillStyle = darkColor
    ctx.beginPath()
    ctx.moveTo(5, 4)
    ctx.lineTo(27, 4)
    ctx.lineTo(25, 20)
    ctx.lineTo(16, 28)
    ctx.lineTo(7, 20)
    ctx.closePath()
    ctx.fill()

    // Inner plate
    ctx.fillStyle = tierColor
    ctx.beginPath()
    ctx.moveTo(7, 6)
    ctx.lineTo(25, 6)
    ctx.lineTo(23, 19)
    ctx.lineTo(16, 26)
    ctx.lineTo(9, 19)
    ctx.closePath()
    ctx.fill()

    // Left highlight
    ctx.fillStyle = highlight
    ctx.beginPath()
    ctx.moveTo(7, 6)
    ctx.lineTo(16, 6)
    ctx.lineTo(16, 26)
    ctx.lineTo(9, 19)
    ctx.closePath()
    ctx.fill()

    // Center crest
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(16, 8)
    ctx.lineTo(16, 22)
    ctx.moveTo(11, 13)
    ctx.lineTo(21, 13)
    ctx.stroke()
  }

  const url = canvas.toDataURL('image/png')
  if (url.length > 50) {
    iconCache.set(key, url)
  }
  return url
}

