import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { BrandKit, Channel, GenerateRequest, GenerateResponse, StoredGeneration } from '../../shared/types.js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null

let memoryBrandKit: BrandKit | null = null
let memoryGenerations: StoredGeneration[] = []

function mapBrandKit(row: any): BrandKit {
  return {
    product: row.product,
    audience: row.audience,
    brandVoice: row.brand_voice || undefined,
    doNotSay: Array.isArray(row.do_not_say) ? (row.do_not_say as string[]) : undefined,
    claimSafeMode: !!row.claim_safe_mode,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  }
}

function mapGeneration(row: any): StoredGeneration {
  return {
    id: String(row.id),
    channel: row.channel as Channel,
    goal: row.goal,
    input: row.input as GenerateRequest,
    output: row.output as GenerateResponse,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  }
}

export async function getBrandKit(): Promise<BrandKit | null> {
  if (!supabase) return memoryBrandKit
  const { data, error } = await supabase.from('brand_kit').select('*').eq('id', 'default').maybeSingle()
  if (error || !data) return null
  return mapBrandKit(data)
}

export async function upsertBrandKit(kit: BrandKit): Promise<BrandKit> {
  const updatedAt = new Date().toISOString()
  if (!supabase) {
    memoryBrandKit = { ...kit, updatedAt }
    return memoryBrandKit
  }
  const row = {
    id: 'default',
    product: kit.product,
    audience: kit.audience,
    brand_voice: kit.brandVoice || null,
    do_not_say: kit.doNotSay || null,
    claim_safe_mode: !!kit.claimSafeMode,
    updated_at: updatedAt,
  }
  const { data, error } = await supabase.from('brand_kit').upsert(row, { onConflict: 'id' }).select('*').single()
  if (error) {
    return { ...kit, updatedAt }
  }
  return mapBrandKit(data)
}

export async function saveGeneration(input: GenerateRequest, output: GenerateResponse): Promise<StoredGeneration> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const item: StoredGeneration = { id, channel: input.channel, goal: input.goal, input, output, createdAt }
  if (!supabase) {
    memoryGenerations = [item, ...memoryGenerations]
    return item
  }
  const row = {
    id,
    channel: input.channel,
    goal: input.goal,
    input,
    output,
    created_at: createdAt,
  }
  await supabase.from('generations').insert(row)
  return item
}

export async function listGenerations(limit = 50): Promise<Array<StoredGeneration>> {
  if (!supabase) return memoryGenerations.slice(0, limit)
  const { data, error } = await supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error || !data) return []
  return data.map(mapGeneration)
}

export async function getGeneration(id: string): Promise<StoredGeneration | null> {
  if (!supabase) return memoryGenerations.find((g) => g.id === id) || null
  const { data, error } = await supabase.from('generations').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return mapGeneration(data)
}
