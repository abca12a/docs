import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))

const config = readJson('docs.json')
const languages = config.navigation?.languages

assert.ok(Array.isArray(languages), 'docs.json must define navigation.languages')
assert.deepEqual(
  languages.map(({ language }) => language),
  ['cn', 'en', 'jp'],
  'navigation.languages must be ordered as cn, en, jp',
)

function collectPages(node, insidePages = false) {
  if (typeof node === 'string') return insidePages ? [node] : []
  if (Array.isArray(node)) return node.flatMap((entry) => collectPages(entry, insidePages))
  if (!node || typeof node !== 'object') return []
  return Object.entries(node).flatMap(([key, value]) => collectPages(value, key === 'pages'))
}

const languagePages = new Map(
  languages.map((entry) => [entry.language, collectPages(entry)]),
)

const normalizePage = (language, page) => {
  const prefix = `${language}/`
  return page.startsWith(prefix) ? page.slice(prefix.length) : page
}

const canonicalPages = languagePages.get('cn').map((page) => normalizePage('cn', page))
assert.equal(canonicalPages.length, 20, 'cn navigation must contain all 20 documentation pages')

function structureSignature(content) {
  return content.split('\n').flatMap((line) => {
    if (/^### /.test(line)) return ['H3']
    if (/^## /.test(line)) return ['H2']
    if (/^```/.test(line)) return [`FENCE:${line.slice(3).trim()}`]
    if (/^\|.*\|$/.test(line)) return ['TABLE_ROW']
    if (/^- /.test(line)) return ['LIST_ITEM']
    if (/^\d+\. /.test(line)) return ['ORDERED_ITEM']
    const components = [...line.matchAll(/<(\/)?([A-Z][A-Za-z]*)\b/g)]
    return components.map((match) => `${match[1] ? 'CLOSE' : 'OPEN'}:${match[2]}`)
  })
}

function stripAllowedChineseApiLiterals(content) {
  return [
    'open ai 特价',
    'claude 特价',
    'open ai 自有号池',
    'claude 自有号池',
    'claude 满血渠道',
  ].reduce((text, literal) => text.replaceAll(literal, ''), content)
}

for (const [language, pages] of languagePages) {
  assert.deepEqual(
    pages.map((page) => normalizePage(language, page)),
    canonicalPages,
    `${language} navigation must contain the same pages as cn`,
  )

  for (const page of pages) {
    const path = resolve(root, `${page}.mdx`)
    assert.ok(existsSync(path), `Missing localized page: ${page}.mdx`)
    const content = readFileSync(path, 'utf8')
    assert.match(content, /^---\n[\s\S]*?^title:\s*".+"/m, `${page}.mdx must have a title`)
    assert.match(content, /^---\n[\s\S]*?^description:\s*".+"/m, `${page}.mdx must have a description`)
    assert.doesNotMatch(
      content,
      /\b(?:TODO|TBD)\b|placeholder|同中文|中文同様/i,
      `${page}.mdx must not contain unfinished content`,
    )

    if (language !== 'cn') {
      const sourcePage = normalizePage(language, page)
      const sourceContent = readFileSync(resolve(root, `${sourcePage}.mdx`), 'utf8')
      assert.deepEqual(
        structureSignature(content),
        structureSignature(sourceContent),
        `${page}.mdx must preserve the ordered source structure`,
      )
    }

    if (language === 'en') {
      assert.doesNotMatch(
        stripAllowedChineseApiLiterals(content),
        /\p{Script=Han}/u,
        `${page}.mdx contains untranslated Chinese text`,
      )
    }

    if (language === 'jp') {
      assert.doesNotMatch(
        stripAllowedChineseApiLiterals(content),
        /[这为个们后发还过门开关无从时块应则选调线级张处让务实据统见显图总权读变边并项进价满]/,
        `${page}.mdx contains likely untranslated Simplified Chinese text`,
      )
    }

    const allLinks = [...content.matchAll(/href="([^"]+)"|\]\(([^)\s#]+)(?:#[^)]*)?\)/g)]
      .map((match) => match[1] ?? match[2])
    const internalLinks = allLinks.filter((link) => !/^(?:https?:|mailto:|#)/.test(link))

    for (const link of internalLinks) {
      assert.ok(link.startsWith('/'), `${page}.mdx contains a relative internal link: ${link}`)
      assert.ok(
        existsSync(resolve(root, `${link.slice(1)}.mdx`)),
        `${page}.mdx links to a missing page: ${link}`,
      )
    }

    if (language !== 'cn') {
      for (const link of internalLinks) {
        assert.ok(
          link.startsWith(`/${language}/`),
          `${page}.mdx contains an unlocalized internal link: ${link}`,
        )
      }
    }
  }
}

const snapshot = readJson('data/supported-models.json')
assert.equal(snapshot.source, 'https://dimilinks.com/api/pricing')
assert.match(snapshot.verified_at, /^\d{4}-\d{2}-\d{2}$/)

const allowedModels = new Set([
  ...snapshot.models,
  'grok-imagine-video',
])
const modelPattern = /\b(?:(?:gpt|grok|deepseek|kimi|glm|MiniMax|video|gemini)-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*|claude-(?:fable|haiku|opus|sonnet)-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*|qwen[0-9]+(?:\.[0-9]+)*(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?)\b/g
const explicitModelPattern = /(?:["']model["']|\bmodel|default_model)\s*(?::|=)\s*["']([^"']+)["']/g

function referencedModels(content) {
  return new Set([
    ...(content.match(modelPattern) ?? []),
    ...[...content.matchAll(explicitModelPattern)].map((match) => match[1]),
  ])
}

for (const pages of languagePages.values()) {
  for (const page of pages) {
    const content = readFileSync(resolve(root, `${page}.mdx`), 'utf8')
    for (const model of referencedModels(content)) {
      assert.ok(allowedModels.has(model), `${page}.mdx references unsupported model ${model}`)
    }
  }
}

const openApiContent = readFileSync(resolve(root, 'api-reference/openapi.json'), 'utf8')
for (const model of referencedModels(openApiContent)) {
  assert.ok(allowedModels.has(model), `api-reference/openapi.json references unsupported model ${model}`)
}

console.log(`Verified ${canonicalPages.length} pages across ${languages.length} languages.`)
