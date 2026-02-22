import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const ROOT = path.resolve("content")

// 顺序固定：主标签 -> 内容域 -> 体裁/用途（最多 3 个）
const TAGS_BY_PERMALINK = new Map([
  ["/xswctf2025-wp", ["安全", "CTF", "题解"]],
  ["/ccb-2025-wp", ["安全", "CTF", "题解"]],
  ["/lilctf-wp", ["安全", "CTF", "题解"]],
  ["/hkgame2024-wp", ["安全", "CTF", "题解"]],
  ["/car-can", ["安全", "系统安全", "入门"]],
  ["/course-db-2025", ["学习", "数据库", "课程笔记"]],
  ["/how_to_change_major_in_sysu", ["学习", "转专业", "指南"]],
  ["/end-2024-spring", ["总结", "大学", "学期总结"]],
  ["/end-2024-autu", ["总结", "大学", "学期总结"]],
  ["/end-2025-autu", ["总结", "大学", "学期总结"]],
  ["/gaokao", ["总结", "大学", "复盘"]],
  ["/changelog", ["工具", "博客", "更新记录"]],
  ["/from-typst-to-latex", ["工具", "排版", "经验"]],
  ["/jupyter", ["工具", "Jupyter", "工作流"]],
  ["/acgn-lrbx", ["随笔", "ACGN", "复盘"]],
  ["/about", ["关于"]],
  ["/link", ["友链"]],
])

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(full)
      continue
    }
    if (!ent.isFile() || !full.endsWith(".md")) continue

    const src = fs.readFileSync(full, "utf8")
    const parsed = matter(src)
    const permalink = parsed.data?.permalink
    if (!permalink || !TAGS_BY_PERMALINK.has(permalink)) continue

    parsed.data.tags = TAGS_BY_PERMALINK.get(permalink)
    fs.writeFileSync(full, matter.stringify(parsed.content, parsed.data))
    console.log(`Rebalanced tags: ${path.relative(ROOT, full)}`)
  }
}

walk(ROOT)
