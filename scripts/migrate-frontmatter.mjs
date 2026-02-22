import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import yaml from "js-yaml"

const CONTENT_DIR = path.resolve("content")

function toDateOnly(rawValue) {
  if (!rawValue) return undefined
  if (typeof rawValue === "string") {
    const m = rawValue.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
  }

  const d = new Date(rawValue)
  if (Number.isNaN(d.getTime())) return undefined
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function normalizePermalink(slug) {
  if (!slug || typeof slug !== "string") return undefined
  const s = slug.trim().replace(/^\/+|\/+$/g, "")
  if (!s) return undefined
  return `/${s}`
}

function mapTags(data) {
  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean).map(String) : []
  return Array.from(new Set(tags))
}

function toBoolean(rawValue, fallback = false) {
  if (typeof rawValue === "boolean") return rawValue
  if (typeof rawValue === "string") {
    const normalized = rawValue.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return fallback
}

function rewriteAssetPaths(markdown) {
  return markdown
    .replaceAll("../../../assets/images/", "../assets/images/")
    .replaceAll("../../../assets/", "../assets/")
}

function convertFrontmatter(source, filePath) {
  const parsed = matter(source, {
    engines: {
      yaml: (s) => yaml.load(s, { schema: yaml.FAILSAFE_SCHEMA }),
    },
  })
  const data = parsed.data ?? {}

  const nextData = {
    title: data.title,
    date: toDateOnly(data.pubDatetime),
    description: data.description,
    tags: mapTags(data),
    draft: toBoolean(data.draft, false),
  }

  const permalink = normalizePermalink(data.slug)
  if (permalink) nextData.permalink = permalink

  // 使用 Quartz/Obsidian 风格 frontmatter 控制评论显隐，默认启用评论开关字段。
  nextData.comments = true

  const cleaned = Object.fromEntries(
    Object.entries(nextData).filter(([, value]) => value !== undefined && value !== null),
  )

  const body = rewriteAssetPaths(parsed.content)
  const output = matter.stringify(body, cleaned)
  fs.writeFileSync(filePath, output)
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue

    const src = fs.readFileSync(fullPath, "utf8")
    convertFrontmatter(src, fullPath)
    console.log(`Converted: ${path.relative(CONTENT_DIR, fullPath)}`)
  }
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.error(`Missing content directory: ${CONTENT_DIR}`)
  process.exit(1)
}

walk(CONTENT_DIR)
