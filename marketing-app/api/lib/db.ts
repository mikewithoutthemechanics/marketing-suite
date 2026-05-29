import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import type { BrandKit, Channel, GenerateRequest, GenerateResponse, StoredGeneration } from '../../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configuredPath = process.env.SQLITE_PATH
if (configuredPath) {
  fs.mkdirSync(path.dirname(configuredPath), { recursive: true })
}

const dataDir = process.env.VERCEL ? path.join('/tmp', 'marrow-studio') : path.join(__dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = configuredPath || path.join(dataDir, 'marketing.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS brand_kit (
    id TEXT PRIMARY KEY,
    product TEXT NOT NULL,
    audience TEXT NOT NULL,
    brand_voice TEXT,
    do_not_say_json TEXT,
    claim_safe_mode INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL,
    goal TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
  CREATE INDEX IF NOT EXISTS idx_generations_channel ON generations(channel);
`)

const getBrandStmt = db.prepare(
  'SELECT id, product, audience, brand_voice, do_not_say_json, claim_safe_mode, updated_at FROM brand_kit WHERE id = ?',
)
const upsertBrandStmt = db.prepare(`
  INSERT INTO brand_kit (id, product, audience, brand_voice, do_not_say_json, claim_safe_mode, updated_at)
  VALUES (@id, @product, @audience, @brand_voice, @do_not_say_json, @claim_safe_mode, @updated_at)
  ON CONFLICT(id) DO UPDATE SET
    product=excluded.product,
    audience=excluded.audience,
    brand_voice=excluded.brand_voice,
    do_not_say_json=excluded.do_not_say_json,
    claim_safe_mode=excluded.claim_safe_mode,
    updated_at=excluded.updated_at
`)

const insertGenerationStmt = db.prepare(
  'INSERT INTO generations (id, channel, goal, input_json, output_json, created_at) VALUES (@id, @channel, @goal, @input_json, @output_json, @created_at)',
)
const listGenerationsStmt = db.prepare(
  'SELECT id, channel, goal, input_json, output_json, created_at FROM generations ORDER BY created_at DESC LIMIT ?',
)
const getGenerationStmt = db.prepare(
  'SELECT id, channel, goal, input_json, output_json, created_at FROM generations WHERE id = ?',
)

export function getBrandKit(): BrandKit | null {
  const row = getBrandStmt.get('default') as
    | {
        product: string
        audience: string
        brand_voice: string | null
        do_not_say_json: string | null
        claim_safe_mode: number
        updated_at: string
      }
    | undefined
  if (!row) return null
  return {
    product: row.product,
    audience: row.audience,
    brandVoice: row.brand_voice || undefined,
    doNotSay: row.do_not_say_json ? (JSON.parse(row.do_not_say_json) as string[]) : undefined,
    claimSafeMode: !!row.claim_safe_mode,
    updatedAt: row.updated_at,
  }
}

export function upsertBrandKit(kit: BrandKit): BrandKit {
  const updatedAt = new Date().toISOString()
  upsertBrandStmt.run({
    id: 'default',
    product: kit.product,
    audience: kit.audience,
    brand_voice: kit.brandVoice || null,
    do_not_say_json: kit.doNotSay ? JSON.stringify(kit.doNotSay) : null,
    claim_safe_mode: kit.claimSafeMode ? 1 : 0,
    updated_at: updatedAt,
  })
  return { ...kit, updatedAt }
}

export function saveGeneration(input: GenerateRequest, output: GenerateResponse): StoredGeneration {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  insertGenerationStmt.run({
    id,
    channel: input.channel,
    goal: input.goal,
    input_json: JSON.stringify(input),
    output_json: JSON.stringify(output),
    created_at: createdAt,
  })
  return { id, channel: input.channel, goal: input.goal, input, output, createdAt }
}

export function listGenerations(limit = 50): Array<StoredGeneration> {
  const rows = listGenerationsStmt.all(limit) as Array<{
    id: string
    channel: string
    goal: string
    input_json: string
    output_json: string
    created_at: string
  }>
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel as Channel,
    goal: r.goal,
    input: JSON.parse(r.input_json) as GenerateRequest,
    output: JSON.parse(r.output_json) as GenerateResponse,
    createdAt: r.created_at,
  }))
}

export function getGeneration(id: string): StoredGeneration | null {
  const row = getGenerationStmt.get(id) as
    | { id: string; channel: string; goal: string; input_json: string; output_json: string; created_at: string }
    | undefined
  if (!row) return null
  return {
    id: row.id,
    channel: row.channel as Channel,
    goal: row.goal,
    input: JSON.parse(row.input_json) as GenerateRequest,
    output: JSON.parse(row.output_json) as GenerateResponse,
    createdAt: row.created_at,
  }
}
