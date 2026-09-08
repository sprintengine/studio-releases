#!/usr/bin/env node
// Validates sources.json: the curated list of skill and plugin SOURCES the
// studio recommends. Each row names a GitHub repository a person can add as a
// source; this repo authors none of what they hold.
//
// The cap is not cosmetic. Every source costs GitHub requests on every scan,
// and a studio with no token is on the anonymous budget — 60 requests an hour
// per machine — so a long list would spend it before reaching the sources
// somebody came for. Six is the ceiling.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MAX_SOURCES = 6
const KINDS = new Set(['claude-marketplace', 'skills-repo'])
const REPO = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/

const path = join(process.cwd(), 'sources.json')
const errors = []
let feed
try {
  feed = JSON.parse(readFileSync(path, 'utf8'))
} catch (error) {
  console.error(`sources.json could not be read: ${error.message}`)
  process.exit(1)
}

if (feed.schemaVersion !== 1) errors.push('schemaVersion must be 1.')
if (typeof feed.updatedAt !== 'string' || Number.isNaN(Date.parse(feed.updatedAt))) {
  errors.push('updatedAt must be an ISO 8601 instant.')
}
if (!Array.isArray(feed.sources)) {
  console.error('sources.json has no sources array.')
  process.exit(1)
}
if (feed.sources.length > MAX_SOURCES) {
  errors.push(`sources holds ${feed.sources.length} rows; the ceiling is ${MAX_SOURCES} (anonymous GitHub rate limits).`)
}

const ids = new Set()
const repos = new Set()
for (const [index, source] of feed.sources.entries()) {
  const at = `sources[${index}]`
  if (typeof source.id !== 'string' || !source.id) errors.push(`${at}: id is required.`)
  else if (ids.has(source.id)) errors.push(`${at}: duplicate id "${source.id}".`)
  else ids.add(source.id)

  if (typeof source.repo !== 'string' || !REPO.test(source.repo)) {
    errors.push(`${at}: repo must be "owner/name".`)
  } else if (repos.has(source.repo)) {
    errors.push(`${at}: duplicate repo "${source.repo}".`)
  } else {
    repos.add(source.repo)
  }

  if (!KINDS.has(source.kind)) {
    errors.push(`${at}: kind must be one of ${[...KINDS].join(', ')}.`)
  }
  if (typeof source.description !== 'string' || !source.description.trim()) {
    errors.push(`${at}: description is required.`)
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error)
  process.exit(1)
}
console.log(`sources.json: ${feed.sources.length} sources (${[...repos].join(', ')})`)
