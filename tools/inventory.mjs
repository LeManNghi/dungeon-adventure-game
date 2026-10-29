import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
const root = resolve('public/assets')
async function scan(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) result.push(...await scan(path))
    else if (entry.name.endsWith('.png')) {
      const bytes = await readFile(path)
      result.push({ path: relative(root, path).replaceAll('\\', '/'), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) })
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path))
}
const entries = await scan(root)
await writeFile('src/asset-manifest.json', JSON.stringify(entries, null, 2) + '\n')
console.log(`Đã kiểm kê ${entries.length} PNG → src/asset-manifest.json`)
