import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const root = path.resolve('content')

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(p)
      continue
    }
    if (!ent.isFile() || !p.endsWith('.md')) continue

    const src = fs.readFileSync(p, 'utf8')
    const parsed = matter(src)
    const tags = parsed.data.tags
    if (!Array.isArray(tags) || tags.length <= 2) continue

    parsed.data.tags = tags.slice(0, 2)
    fs.writeFileSync(p, matter.stringify(parsed.content, parsed.data))
    console.log(`Trimmed tags: ${path.relative(root, p)} (${tags.length} -> 2)`)
  }
}

walk(root)
