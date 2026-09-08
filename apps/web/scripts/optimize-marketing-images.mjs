import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const marketingDir = path.join(root, 'public/images/marketing')
const ogTargets = new Set([
  'akademate-hero-operations.jpg',
  'akademate-product-ecosystem-v2.png',
  'akademate-finance-accounting-v2.png',
])

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (/\.(png|jpe?g)$/i.test(entry.name) && !/\.(webp|avif)$/i.test(entry.name)) files.push(full)
  }
  return files
}

async function convert(file) {
  const relative = path.relative(marketingDir, file)
  const parsed = path.parse(file)
  const webpOut = path.join(parsed.dir, `${parsed.name}.webp`)
  const avifOut = path.join(parsed.dir, `${parsed.name}.avif`)
  const pipeline = sharp(file, { failOn: 'none' }).rotate().resize({
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
  })

  await pipeline.clone().webp({ quality: 75 }).toFile(webpOut)
  await pipeline.clone().avif({ quality: 45 }).toFile(avifOut)

  if (ogTargets.has(path.basename(file))) {
    const ogOut = path.join(parsed.dir, `${parsed.name}-og.webp`)
    await sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width: 1200, height: 630, fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(ogOut)
  }

  const [webpStat, avifStat] = await Promise.all([stat(webpOut), stat(avifOut)])
  console.log(
    `${relative} -> webp ${(webpStat.size / 1024).toFixed(0)}KB avif ${(avifStat.size / 1024).toFixed(0)}KB`
  )
}

await mkdir(marketingDir, { recursive: true })
const files = await walk(marketingDir)
for (const file of files) await convert(file)
console.log(`Optimized ${files.length} marketing rasters`)
