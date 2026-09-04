// Shape check for model-feed.json. Runs on every push and pull request so a bad
// merge cannot ship a feed the studio will refuse. Node 18+, no dependencies.
import { readFileSync } from 'node:fs'

const KNOWN_CLIS = ['claude-code', 'codex', 'grok', 'kimi-code', 'opencode', 'cursor']
const ROW_FIELDS = new Set([
  'id', 'label', 'description', 'contextWindow', 'effortLevels', 'defaultEffort',
  'supportsFastMode', 'releasedAt', 'alias', 'retired', 'retiredAt',
])
const errors = []
const fail = (msg) => errors.push(msg)

let feed
try {
  feed = JSON.parse(readFileSync(new URL('../model-feed.json', import.meta.url), 'utf8'))
} catch (err) {
  console.error(`model-feed.json is not valid JSON: ${err.message}`)
  process.exit(1)
}

if (feed.schemaVersion !== 1) fail(`schemaVersion must be 1, got ${JSON.stringify(feed.schemaVersion)}`)
if (typeof feed.updatedAt !== 'string' || Number.isNaN(Date.parse(feed.updatedAt))) {
  fail('updatedAt must be an ISO date-time string; bump it on every edit')
}
if (!feed.clis || typeof feed.clis !== 'object') fail('clis must be an object keyed by studio plugin id')

for (const [cli, entry] of Object.entries(feed.clis ?? {})) {
  if (!KNOWN_CLIS.includes(cli)) fail(`unknown plugin id "${cli}" (known: ${KNOWN_CLIS.join(', ')})`)
  if (!Array.isArray(entry?.models)) { fail(`${cli}.models must be an array`); continue }
  const seen = new Set()
  entry.models.forEach((row, i) => {
    const where = `${cli}.models[${i}]`
    if (typeof row.id !== 'string' || !row.id.trim()) fail(`${where}: id must be a non-empty string`)
    else if (seen.has(row.id)) fail(`${where}: duplicate id "${row.id}"`)
    else seen.add(row.id)
    if (typeof row.label !== 'string' || !row.label.trim()) fail(`${where}: label must be a non-empty string`)
    for (const key of Object.keys(row)) if (!ROW_FIELDS.has(key)) fail(`${where}: unknown field "${key}"`)
    if (row.retired === true && row.retiredAt == null) fail(`${where}: retired rows need retiredAt`)
    if (row.alias === true && row.releasedAt != null) fail(`${where}: alias rows float and have no releasedAt`)
    for (const key of ['releasedAt', 'retiredAt']) {
      if (row[key] != null && Number.isNaN(Date.parse(row[key]))) fail(`${where}: ${key} is not a date`)
    }
    if (row.effortLevels != null && !(Array.isArray(row.effortLevels) && row.effortLevels.every((e) => typeof e === 'string'))) {
      fail(`${where}: effortLevels must be an array of strings`)
    }
  })
}

if (errors.length) {
  console.error(`model-feed.json has ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
const total = Object.values(feed.clis).reduce((n, c) => n + c.models.length, 0)
console.log(`model-feed.json ok: ${Object.keys(feed.clis).length} CLIs, ${total} models, updated ${feed.updatedAt}`)
