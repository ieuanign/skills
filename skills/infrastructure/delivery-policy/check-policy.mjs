#!/usr/bin/env node
// Checks a delivery policy's front matter against the schema beside this file, one verdict per rule.
// `.mjs` and `node:` imports only: it ships into arbitrary repositories and runs by path.

import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export class SubsetError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`)
    this.line = line
  }
}

// YAML 1.1 readers turn these into booleans and 1.2 readers keep them as strings, so neither reading is safe.
const AMBIGUOUS_WORDS = /^(y|n|yes|no|on|off|true|false|null|~)$/i
const INTEGER = /^-?(0|[1-9][0-9]*)$/
const KEY = /^[A-Za-z0-9_][A-Za-z0-9_./-]*$/

function scalar(text, line) {
  if (text.startsWith('"')) {
    const m = /^("(?:[^"\\]|\\.)*")\s*(?:#.*)?$/.exec(text)
    if (!m) throw new SubsetError(line, 'unterminated or trailing text after a double-quoted scalar')
    try {
      return JSON.parse(m[1])
    } catch {
      throw new SubsetError(line, 'an escape outside the subset in a double-quoted scalar')
    }
  }
  const plain = text.replace(/\s+#.*$/, '').trimEnd()
  if (plain === 'true') return true
  if (plain === 'false') return false
  if (plain === 'null') return null
  if (INTEGER.test(plain)) return Number(plain)
  if (/^[&]/.test(plain)) throw new SubsetError(line, 'anchors are outside the subset')
  if (/^[*]/.test(plain)) throw new SubsetError(line, 'aliases are outside the subset')
  if (/^[!]/.test(plain)) throw new SubsetError(line, 'tags are outside the subset')
  if (/^[[{]/.test(plain)) throw new SubsetError(line, 'flow collections are outside the subset')
  if (/^[|>]/.test(plain)) throw new SubsetError(line, 'multi-line scalars are outside the subset')
  if (/^['%@`,?:-]/.test(plain)) throw new SubsetError(line, `a plain scalar may not start with "${plain[0]}"; double-quote it`)
  if (AMBIGUOUS_WORDS.test(plain)) throw new SubsetError(line, `"${plain}" reads differently across YAML versions; write true, false, null or a double-quoted string`)
  if (/^[-+.]?[0-9]/.test(plain)) throw new SubsetError(line, `"${plain}" is not an integer; double-quote it`)
  if (/:\s/.test(plain)) throw new SubsetError(line, 'a plain scalar may not contain ": "; double-quote it')
  return plain
}

/** The front matter's YAML subset → a plain value. Throws SubsetError naming the line of anything outside it. */
export function parseSubset(text, firstLine = 1) {
  const lines = []
  text.split('\n').forEach((raw, i) => {
    const line = firstLine + i
    if (/^\s*(#.*)?$/.test(raw)) return
    if (raw.includes('\t')) throw new SubsetError(line, 'tabs are outside the subset')
    const indent = raw.length - raw.trimStart().length
    if (indent % 2 !== 0) throw new SubsetError(line, 'indentation is not a multiple of two spaces')
    lines.push({ line, indent, body: raw.trim() })
  })
  let at = 0

  const isItem = l => l.body === '-' || l.body.startsWith('- ')

  function block(indent) {
    const first = lines[at]
    if (first.indent !== indent) throw new SubsetError(first.line, `expected indentation ${indent}, found ${first.indent}`)
    return isItem(first) ? sequence(indent) : mapping(indent)
  }

  // The value after `key:` or `-`: inline, or a block exactly two spaces deeper, or nothing (null).
  function nested(rest, indent, line) {
    if (rest !== '' && !rest.startsWith('#')) return scalar(rest, line)
    const next = lines[at]
    if (!next || next.indent <= indent) return null
    if (next.indent !== indent + 2) throw new SubsetError(next.line, `expected indentation ${indent + 2}, found ${next.indent}`)
    return block(indent + 2)
  }

  function mapping(indent) {
    const out = {}
    while (at < lines.length && lines[at].indent === indent) {
      const { line, body } = lines[at]
      if (isItem(lines[at])) throw new SubsetError(line, 'a sequence item where a mapping key was expected')
      const m = /^([^\s:#"']+):(?:\s+(.*))?$/.exec(body)
      if (!m) throw new SubsetError(line, 'expected "key: value" or "key:"')
      const key = m[1]
      if (!KEY.test(key) || AMBIGUOUS_WORDS.test(key)) throw new SubsetError(line, `key "${key}" is outside the subset`)
      if (Object.hasOwn(out, key)) throw new SubsetError(line, `duplicate key "${key}"`)
      at++
      out[key] = nested((m[2] ?? '').trim(), indent, line)
    }
    return out
  }

  function sequence(indent) {
    const out = []
    while (at < lines.length && lines[at].indent === indent) {
      const { line, body } = lines[at]
      if (!isItem(lines[at])) throw new SubsetError(line, 'a mapping key where a sequence item was expected')
      const rest = body.slice(1).trim()
      if (/^[^\s"#][^\s:]*:(\s|$)/.test(rest)) throw new SubsetError(line, 'a mapping on a sequence item line is outside the subset')
      at++
      out.push(nested(rest, indent, line))
    }
    return out
  }

  if (lines.length === 0) return null
  const doc = block(0)
  if (at < lines.length) throw new SubsetError(lines[at].line, `unexpected indentation ${lines[at].indent}`)
  return doc
}

/** A policy file → { yaml, firstLine } of its front matter, or throws naming what is missing. */
export function frontMatter(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') throw new SubsetError(1, 'the file does not open with "---" front matter')
  const end = lines.indexOf('---', 1)
  if (end === -1) throw new SubsetError(1, 'the front matter has no closing "---"')
  return { yaml: lines.slice(1, end).join('\n'), firstLine: 2 }
}

// Every keyword the schema may use. One outside this list fails the check rather than being skipped,
// since a constraint this validator silently ignored would pass anything.
const ANNOTATIONS = new Set(['$schema', '$id', '$comment', 'title', 'description', 'default'])
const SUBSCHEMA_MAPS = new Set(['properties', '$defs'])
const SUBSCHEMAS = new Set(['items', 'additionalProperties', 'if', 'then'])
const ASSERTIONS = new Set(['$ref', 'type', 'required', 'const', 'enum', 'minimum', 'maximum', 'minLength', 'minItems'])

export function assertKnownKeywords(schema, at = '#') {
  if (typeof schema === 'boolean') return
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error(`schema at ${at} is not a schema`)
  for (const [kw, v] of Object.entries(schema)) {
    if (SUBSCHEMA_MAPS.has(kw)) for (const [k, sub] of Object.entries(v)) assertKnownKeywords(sub, `${at}/${kw}/${k}`)
    else if (SUBSCHEMAS.has(kw)) assertKnownKeywords(v, `${at}/${kw}`)
    else if (!ANNOTATIONS.has(kw) && !ASSERTIONS.has(kw)) throw new Error(`schema keyword "${kw}" at ${at} is not implemented by this validator`)
  }
}

const typeOf = v =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v
const isType = (v, t) => (t === 'number' ? typeof v === 'number' : typeOf(v) === t)
const show = v => JSON.stringify(v)
const isObject = v => typeOf(v) === 'object'

// A rule is a node checked against a schema declaring `mark`; its value and change report under it.
const declaresMark = s => isObject(s) && isObject(s.properties) && Object.hasOwn(s.properties, 'mark')

function resolve(root, ref) {
  const m = /^#\/\$defs\/([^/]+)$/.exec(ref)
  if (!m || !Object.hasOwn(root.$defs ?? {}, m[1])) throw new Error(`schema $ref "${ref}" does not resolve`)
  return root.$defs[m[1]]
}

function validate(root, schema, value, path, ctx) {
  if (schema === true) return
  if (schema === false) return ctx.fail(path, 'not allowed')
  if (declaresMark(schema)) ctx.rule(path)
  if (schema.$ref) validate(root, resolve(root, schema.$ref), value, path, ctx)
  if (schema.type !== undefined) {
    const types = [].concat(schema.type)
    if (!types.some(t => isType(value, t))) return ctx.fail(path, `expected ${types.join(' or ')}, got ${show(value)}`)
  }
  if (Object.hasOwn(schema, 'const') && show(value) !== show(schema.const))
    ctx.fail(path, `expected ${show(schema.const)}, got ${show(value)}`)
  if (schema.enum && !schema.enum.some(e => show(e) === show(value)))
    ctx.fail(path, `expected one of ${schema.enum.map(show).join(', ')}, got ${show(value)}`)
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) ctx.fail(path, `${value} is below the minimum ${schema.minimum}`)
    if (schema.maximum !== undefined && value > schema.maximum) ctx.fail(path, `${value} is above the maximum ${schema.maximum}`)
  }
  if (typeof value === 'string' && schema.minLength !== undefined && value.length < schema.minLength)
    ctx.fail(path, 'empty')
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) ctx.fail(path, `fewer than ${schema.minItems} items`)
    if (schema.items !== undefined) value.forEach((v, i) => validate(root, schema.items, v, `${path}[${i}]`, ctx))
  }
  if (isObject(value)) {
    const props = schema.properties ?? {}
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) ctx.fail(join_(path, key), 'missing')
    for (const [key, v] of Object.entries(value)) {
      if (Object.hasOwn(props, key)) validate(root, props[key], v, join_(path, key), ctx)
      else if (schema.additionalProperties === false) ctx.fail(join_(path, key), 'not a key the schema knows')
      else if (schema.additionalProperties !== undefined) validate(root, schema.additionalProperties, v, join_(path, key), ctx)
    }
  }
  if (schema.if !== undefined) {
    const probe = collector(false)
    validate(root, schema.if, value, path, probe)
    if (probe.failed === 0 && schema.then !== undefined) validate(root, schema.then, value, path, ctx)
  }
}

const join_ = (path, key) => (path ? `${path}.${key}` : key)

// Each failure reports under the rule enclosing it, so a rule gets exactly one verdict line.
function collector(record = true) {
  const verdicts = new Map()
  const owner = path => {
    let best = null
    for (const r of verdicts.keys()) {
      if ((path === r || path.startsWith(`${r}.`) || path.startsWith(`${r}[`)) && (!best || r.length > best.length)) best = r
    }
    return best
  }
  return {
    failed: 0,
    verdicts,
    rule(path) {
      if (record && !verdicts.has(path)) verdicts.set(path, [])
    },
    fail(path, reason) {
      const r = record ? owner(path) : null
      const key = r ?? (path || '(root)')
      const text = r && r !== path ? `${path.slice(r.length + 1)}: ${reason}` : reason
      this.failed++
      if (record && !verdicts.has(key)) verdicts.set(key, [])
      if (record) verdicts.get(key).push(text)
    },
  }
}

/** A parsed front matter + the schema → [{ path, pass, reasons }], one per rule and per unowned failure. */
export function check(schema, doc) {
  assertKnownKeywords(schema)
  const ctx = collector(true)
  if (isObject(doc) && isObject(schema.properties)) {
    // Contract fields outside any rule (schema_version) still get a verdict line of their own.
    for (const [key, sub] of Object.entries(schema.properties)) if (!declaresMark(sub) && !sub.$ref && sub.type !== 'object') ctx.rule(key)
  }
  validate(schema, schema, doc, '', ctx)
  return [...ctx.verdicts].map(([path, reasons]) => ({ path, pass: reasons.length === 0, reasons }))
}

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), 'delivery-policy.schema.json')

const USAGE = `usage: check-policy.mjs <policy-file>

Checks the front matter of a delivery policy (docs/delivery-policy.md) against
delivery-policy.schema.json beside this script. Prints one "pass <rule>" or
"fail <rule>: <reason>" line per rule and exits 0 only when every rule passes.`

function main(argv) {
  if (argv.length !== 1 || argv[0].startsWith('-')) {
    process.stderr.write(`${USAGE}\n`)
    return 2
  }
  let schema
  try {
    schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))
    assertKnownKeywords(schema)
  } catch (err) {
    process.stderr.write(`check-policy: ${err.message}\n`)
    return 2
  }
  let doc
  try {
    const { yaml, firstLine } = frontMatter(readFileSync(argv[0], 'utf8'))
    doc = parseSubset(yaml, firstLine)
  } catch (err) {
    if (!(err instanceof SubsetError)) {
      process.stderr.write(`check-policy: ${err.message}\n`)
      return 2
    }
    process.stdout.write(`fail front matter: ${err.message}\n`)
    return 1
  }
  const verdicts = check(schema, doc)
  for (const v of verdicts) process.stdout.write(v.pass ? `pass ${v.path}\n` : `fail ${v.path}: ${v.reasons.join('; ')}\n`)
  return verdicts.every(v => v.pass) ? 0 : 1
}

// Node resolves a module's own path through symlinks and leaves argv[1] as the caller typed it, so a
// skill folder reached through one makes these differ — and an unresolved compare skips main() silently.
const invokedDirectly = invoked => {
  if (!invoked) return false
  if (import.meta.url === pathToFileURL(invoked).href) return true
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href
  } catch {
    return false
  }
}

if (invokedDirectly(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2))
}
