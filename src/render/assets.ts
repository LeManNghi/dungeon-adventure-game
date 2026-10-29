import { files } from '../data/sprites'
import type { Rect } from '../data/sprites'

export const images = new Map<string, HTMLImageElement>()

export async function loadAssets() {
  await Promise.all(files.map(async file => {
    const img = new Image()
    img.src = `${import.meta.env.BASE_URL}assets/${file.path}`
    await img.decode()
    if (img.naturalWidth !== file.width || img.naturalHeight !== file.height) throw new Error(`Kích thước asset đã thay đổi: ${file.path}`)
    images.set(file.path, img)
  }))
}
export function sprite(ctx: CanvasRenderingContext2D, path: string, rect: Rect, x: number, y: number, w = rect[2], h = rect[3]) {
  const img = images.get(path)
  if (!img) throw new Error(`Thiếu asset: ${path}`)
  ctx.drawImage(img, ...rect, x, y, w, h)
}
