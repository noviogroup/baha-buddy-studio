#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

function loadEnv(filePath) {
  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    values[match[1]] = value
  }
  return values
}

const defaultIds = [
  '427ca602-1fed-48a4-84b8-1c4581de80a2',
  '96abb6cc-3c1e-47d9-9156-eea0d8110451',
  'dc5fb048-5231-4111-8ff9-8e17873accd0',
  '74aedc62-dbc0-4b8a-8ca3-97f22db6175c',
  'fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49',
]
const ids = process.argv.slice(2).length ? process.argv.slice(2) : defaultIds
const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web', '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')

const query = new URLSearchParams({
  select: '*',
  id: `in.(${ids.join(',')})`,
  order: 'name.asc',
})
const response = await fetch(`${supabaseUrl}/rest/v1/places?${query}`, {
  headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`},
})
if (!response.ok) throw new Error(`places query failed: ${response.status} ${(await response.text()).slice(0, 200)}`)

const rows = await response.json()
const safeFields = [
  'id', 'name', 'slug', 'category', 'subcategory', 'island_id', 'island_name', 'address',
  'latitude', 'longitude', 'google_place_id', 'provider', 'provider_id', 'source', 'source_id',
  'rating', 'review_count', 'user_ratings_total', 'is_active', 'status', 'is_verified',
  'verification_status', 'last_verified_at', 'last_reviewed_at', 'created_at', 'updated_at', 'website',
]

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  requested: ids.length,
  returned: rows.length,
  availableFields: [...new Set(rows.flatMap((row) => Object.keys(row)))].sort(),
  rows: rows.map((row) => Object.fromEntries(safeFields.filter((field) => row[field] !== undefined).map((field) => [field, row[field]]))),
}, null, 2))
