import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const ROOT = path.resolve("content")

const TAGS_BY_PERMALINK = new Map([
  ["/xswctf2025-wp", ["安全", "CTF", "题解"]],
  ["/ccb-2025-wp", ["安全", "CTF", "题解"]],
  ["/lilctf-wp", ["安全", "CTF", "题解"]],
  ["/hkgame2024-wp", ["安全", "CTF", "题解"]],
  ["/car-can", ["安全", "系统安全", "Linux", "CAN总线"]],
  ["/course-db-2025", ["学习", "数据库", "课程笔记"]],
  ["/how_to_change_major_in_sysu", ["大学", "转专业", "指南"]],
  ["/end-2024-spring", ["大学", "复盘", "学期总结"]],
  ["/end-2024-autu", ["大学", "复盘", "学期总结"]],
  ["/end-2025-autu", ["大学", "复盘", "学期总结", "AI"]],
  ["/gaokao", ["大学", "转专业", "复盘"]],
  ["/changelog", ["博客", "SSG", "更新记录"]],
  ["/from-typst-to-latex", ["排版", "Markdown", "Typst", "LaTeX"]],
  ["/jupyter", ["Jupyter", "工作流", "效率"]],
  ["/acgn-lrbx", ["ACGN", "CTF", "复盘"]],
])

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const full = path.join(dir, item.name)
    if (item.isDirectory()) {
      walk(full)
      continue
    }
    if (!item.isFile() || !item.name.endsWith(".md")) continue
    if (path.basename(full) === "index.md" && path.dirname(full) === ROOT) continue

    const src = fs.readFileSync(full, "utf8")
    const parsed = matter(src)
    const permalink = parsed.data?.permalink
    if (!permalink || !TAGS_BY_PERMALINK.has(permalink)) {
      console.warn(`Skip (no mapping): ${path.relative(ROOT, full)}`)
      continue
    }

    parsed.data.tags = TAGS_BY_PERMALINK.get(permalink)
    const out = matter.stringify(parsed.content, parsed.data)
    fs.writeFileSync(full, out)
    console.log(`Updated tags: ${path.relative(ROOT, full)}`)
  }
}

walk(ROOT)
