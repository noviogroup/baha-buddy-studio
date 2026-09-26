#!/usr/bin/env node

/**
 * Read-only crosswalk of the 64 signature places named in the official island
 * research configuration against the current Supabase places inventory.
 *
 * This script never mutates Supabase or Sanity. It emits a JSON/TSV report for
 * source verification and editorial adjudication.
 */

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')
const outputBase = process.argv[2] || '/private/tmp/baha-buddy-official-signature-place-crosswalk'

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

const islandConfiguration = [
  ['abacos', 'The Abacos', 'abacos', ['Elbow Reef Lighthouse', 'Man-O-War Cay', 'Tahiti Beach', 'Hope Town']],
  ['acklins-crooked-island', 'Acklins & Crooked Island', 'acklins-crooked-island', ['The Bight of Acklins', 'Ancient Lucayan Sites', 'Long Cay', 'Turtle Sound']],
  ['andros', 'Andros', 'andros', ['Blue Holes National Park', 'West Side National Park', 'Andros Barrier Reef', 'Androsia Batik Factory']],
  ['berry-islands', 'The Berry Islands', 'berry-islands', ['Chub Cay', 'Sugar Beach', "Hoffman's Cay Blue Hole", "Flo's Conch Bar"]],
  ['bimini', 'Bimini', 'bimini', ['Dolphin House Museum', 'Bimini Road', 'Fountain of Youth', 'SS Sapona Shipwreck']],
  ['cat-island', 'Cat Island', 'cat-island', ['Mount Alvernia and The Hermitage', "Sir Sidney Poitier's Boyhood Home", 'Old Bight Beach', 'Port Howe']],
  ['eleuthera-harbour-island', 'Eleuthera & Harbour Island', 'eleuthera-harbour-island', ['Glass Window Bridge', 'Pineapple Fields', 'Pink Sands Beach', 'Spanish Wells']],
  ['the-exumas', 'The Exumas', 'the-exumas', ['Big Major Cay', 'Thunderball Grotto', 'Compass Cay Marina', 'Exuma Cays Land & Sea Park']],
  ['grand-bahama', 'Grand Bahama', 'freeport-grand-bahama-island', ['Peterson Cay National Park', 'Port Lucaya Marketplace', 'Lucayan National Park', 'Gold Rock Beach']],
  ['inagua', 'Inagua', 'inagua', ['Inagua National Park', 'Little Inagua National Park', 'Great Inagua Lighthouse', 'Union Creek Reserve']],
  ['long-island', 'Long Island', 'long-island', ["Dean's Blue Hole", 'Cape Santa Maria Beach', 'Columbus Point', 'Twin Churches']],
  ['mayaguana', 'Mayaguana', 'mayaguana', ['Booby Cay', "Abraham's Bay", 'Horse Pond Beach', 'Pirates Well']],
  ['nassau-paradise-island', 'Nassau & Paradise Island', 'nassau-paradise-island', ['National Art Gallery of The Bahamas', "Queen's Staircase", 'Fort Fincastle', 'Government House']],
  ['ragged-island', 'Ragged Island', 'ragged-island', ['Duncan Town', 'Jumentos Cays', 'Hog Cay', 'Pigeon Cay']],
  ['rum-cay', 'Rum Cay', 'rum-cay', ['Port Nelson', 'HMS Conqueror Shipwreck', 'Conception Island National Park', 'Hartford Cave']],
  ['san-salvador', 'San Salvador', 'san-salvador', ['Southern Great Lake National Park', "Watling's Blue Hole", 'Gerace Research Centre', 'Bonefish Bay Beach']],
].map(([slug, name, page, highlights]) => ({slug, name, page, highlights}))

const islandAliases = new Map([
  ['abaco', 'abacos'], ['the abacos', 'abacos'], ['the-abacos', 'abacos'],
  ['acklins', 'acklins-crooked-island'], ['crooked island', 'acklins-crooked-island'], ['acklins and crooked island', 'acklins-crooked-island'],
  ['exuma', 'the-exumas'], ['exumas', 'the-exumas'], ['the exumas', 'the-exumas'],
  ['nassau', 'nassau-paradise-island'], ['new providence', 'nassau-paradise-island'], ['paradise island', 'nassau-paradise-island'],
  ['freeport', 'grand-bahama'], ['freeport grand bahama', 'grand-bahama'], ['grand bahama island', 'grand-bahama'],
  ['eleuthera', 'eleuthera-harbour-island'], ['harbour island', 'eleuthera-harbour-island'], ['harbor island', 'eleuthera-harbour-island'],
])

const islandBounds = {
  'nassau-paradise-island': {minLatitude: 24.75, maxLatitude: 25.35, minLongitude: -77.8, maxLongitude: -76.9},
  'grand-bahama': {minLatitude: 26.1, maxLatitude: 27.1, minLongitude: -79.7, maxLongitude: -77.5},
  bimini: {minLatitude: 25.35, maxLatitude: 26.1, minLongitude: -79.6, maxLongitude: -78.9},
  abacos: {minLatitude: 25.3, maxLatitude: 27.35, minLongitude: -78.45, maxLongitude: -76.6},
  'berry-islands': {minLatitude: 25.2, maxLatitude: 26.2, minLongitude: -78.5, maxLongitude: -77.3},
  'eleuthera-harbour-island': {minLatitude: 24.2, maxLatitude: 26, minLongitude: -77.1, maxLongitude: -75.5},
  'the-exumas': {minLatitude: 23, maxLatitude: 25.5, minLongitude: -77, maxLongitude: -75},
  andros: {minLatitude: 23, maxLatitude: 25.5, minLongitude: -78.8, maxLongitude: -76.1},
  'long-island': {minLatitude: 22.5, maxLatitude: 24.3, minLongitude: -75.8, maxLongitude: -74.6},
  'cat-island': {minLatitude: 23.9, maxLatitude: 25.2, minLongitude: -76.1, maxLongitude: -74.9},
  'san-salvador': {minLatitude: 23.6, maxLatitude: 24.5, minLongitude: -74.9, maxLongitude: -74},
  'rum-cay': {minLatitude: 23.2, maxLatitude: 24, minLongitude: -75.2, maxLongitude: -74.4},
  'ragged-island': {minLatitude: 21.2, maxLatitude: 22.8, minLongitude: -76.3, maxLongitude: -75},
  mayaguana: {minLatitude: 21.8, maxLatitude: 22.8, minLongitude: -73.6, maxLongitude: -72.3},
  inagua: {minLatitude: 20.5, maxLatitude: 21.8, minLongitude: -74.1, maxLongitude: -72.5},
  'acklins-crooked-island': {minLatitude: 21.6, maxLatitude: 23.3, minLongitude: -75.4, maxLongitude: -73},
}

function plain(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/\bthe\b/g, ' ')
    .replace(/\bnational art gallery of bahamas\b/g, 'national art gallery bahamas')
    .replace(/\bss\b/g, 's s')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

// Primary-source identity decisions for known catalog-name variants. These are
// deliberately explicit: fuzzy matching alone must never silently merge two
// places. Supporting source IDs travel with the report for editorial review.
const identityDecisions = new Map([
  ['andros::androsia batik factory', {
    catalogName: 'Androsia Batik Works Factory',
    sourceIds: ['research-source-operator-androsia'],
    rationale: 'The current operator identifies the Andros Town site as Androsia Batik Factory; the Supabase name adds “Works” but points to the same Androsia factory identity.',
  }],
  ['nassau-paradise-island::national art gallery bahamas', {
    catalogName: 'National Art Gallery of The Bahamas',
    sourceIds: ['research-source-operator-nagb'],
    rationale: 'The institution’s current site confirms the full identity and Nassau location.',
  }],
  ['san-salvador::southern great lake national park', {
    catalogName: 'Great Lake National Park',
    sourceIds: ['research-source-bnt-southern-great-lake'],
    rationale: 'The Bahamas National Trust uses Southern Great Lake National Park; the Supabase row omits “Southern” and requires an editor-approved canonical-name correction.',
  }],
])

function canonicalIsland(value) {
  const normalized = plain(value)
  return islandAliases.get(normalized) || normalized.replace(/\s+/g, '-')
}

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function insideBounds(place, slug) {
  const bounds = islandBounds[slug]
  const latitude = numeric(place.latitude)
  const longitude = numeric(place.longitude)
  return Boolean(bounds && latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0 &&
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude && longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude)
}

function levenshtein(left, right) {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length
  let previous = Array.from({length: right.length + 1}, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[right.length]
}

function similarity(left, right) {
  if (!left || !right) return 0
  return 1 - (levenshtein(left, right) / Math.max(left.length, right.length))
}

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web', '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')

const fields = 'id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url'
const places = []
for (let start = 0; ; start += 1000) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=${fields}&order=name.asc`, {
    headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Range: `${start}-${start + 999}`},
  })
  if (!response.ok) throw new Error(`places query failed: ${response.status} ${(await response.text()).slice(0, 200)}`)
  const rows = await response.json()
  places.push(...rows)
  if (rows.length < 1000) break
}

const normalizedPlaces = places.map((place) => ({
  ...place,
  normalizedName: plain(place.name),
  canonicalIsland: canonicalIsland(place.island_id || place.island_name),
}))

const crosswalk = islandConfiguration.flatMap((island) => island.highlights.map((officialName) => {
  const normalizedOfficialName = plain(officialName)
  const identityDecision = identityDecisions.get(`${island.slug}::${normalizedOfficialName}`) || null
  const decidedCatalogName = identityDecision ? plain(identityDecision.catalogName) : null
  const candidates = normalizedPlaces.map((place) => {
    const decisionMatch = Boolean(decidedCatalogName && place.normalizedName === decidedCatalogName)
    const nameScore = decisionMatch ? 1 : similarity(normalizedOfficialName, place.normalizedName)
    const assignedToExpectedIsland = place.canonicalIsland === island.slug
    const inBounds = insideBounds(place, island.slug)
    return {
      id: place.id,
      name: place.name,
      category: place.category,
      islandId: place.island_id,
      islandName: place.island_name,
      address: place.address,
      latitude: numeric(place.latitude),
      longitude: numeric(place.longitude),
      active: place.is_active === true && place.status === 'active',
      verified: place.is_verified === true,
      hasDescription: [place.description, place.short_description].some((value) => typeof value === 'string' && value.trim().length >= 40),
      hasMedia: typeof place.primary_image_url === 'string' && Boolean(place.primary_image_url.trim()),
      assignedToExpectedIsland,
      inBounds,
      nameScore,
      matchBasis: decisionMatch ? 'manual_primary_source_identity' : 'normalized_name',
    }
  }).filter((candidate) => candidate.nameScore >= 0.56)
    .sort((left, right) => Number(right.assignedToExpectedIsland) - Number(left.assignedToExpectedIsland) || right.nameScore - left.nameScore)

  const best = candidates[0] || null
  const second = candidates[1] || null
  let classification = 'absent'
  if (best) {
    const exactName = best.nameScore === 1 && best.matchBasis === 'normalized_name'
    const acceptedNameVariant = best.matchBasis === 'manual_primary_source_identity'
    const uniqueEnough = best.nameScore - (second?.nameScore || 0) >= 0.08 || best.assignedToExpectedIsland !== second?.assignedToExpectedIsland
    if (best.assignedToExpectedIsland && exactName && best.inBounds) classification = 'exact_in_bounds'
    else if (best.assignedToExpectedIsland && (acceptedNameVariant || best.nameScore >= 0.82) && best.inBounds && (acceptedNameVariant || uniqueEnough)) classification = 'strong_variant_in_bounds'
    else if (best.assignedToExpectedIsland && (acceptedNameVariant || best.nameScore >= 0.82) && !best.inBounds) classification = 'assigned_but_location_invalid'
    else if (!best.assignedToExpectedIsland && best.nameScore >= 0.9) classification = 'strong_name_wrong_island'
    else if (best.nameScore >= 0.82) classification = 'ambiguous_or_conflicting'
  }

  return {
    islandSlug: island.slug,
    islandName: island.name,
    sourceId: `research-source-bmot-${island.slug}`,
    sourceIds: [`research-source-bmot-${island.slug}`, ...(identityDecision?.sourceIds || [])],
    sourceUrl: `https://www.bahamas.com/islands/${island.page}`,
    officialName,
    identityDecision,
    classification,
    best,
    candidates: candidates.slice(0, 5),
  }
}))

const classifications = Object.fromEntries(
  [...new Set(crosswalk.map((row) => row.classification))]
    .sort()
    .map((classification) => [classification, crosswalk.filter((row) => row.classification === classification).length]),
)
const byIsland = Object.fromEntries(islandConfiguration.map((island) => {
  const rows = crosswalk.filter((row) => row.islandSlug === island.slug)
  return [island.slug, {
    highlights: rows.length,
    exactInBounds: rows.filter((row) => row.classification === 'exact_in_bounds').length,
    strongVariants: rows.filter((row) => row.classification === 'strong_variant_in_bounds').length,
    locationInvalid: rows.filter((row) => row.classification === 'assigned_but_location_invalid').length,
    wrongIsland: rows.filter((row) => row.classification === 'strong_name_wrong_island').length,
    ambiguous: rows.filter((row) => row.classification === 'ambiguous_or_conflicting').length,
    absent: rows.filter((row) => row.classification === 'absent').length,
  }]
}))

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: 'Four signature-place identities per canonical island group from the official Baha Buddy island research configuration.',
    inventory: 'Current Supabase places table, read-only.',
    boundary: 'Name matching is discovery only. Verification requires confirming the primary page still names the place and adjudicating identity, island assignment, coordinates, description, and media rights.',
  },
  inventory: {
    places: places.length,
    active: places.filter((place) => place.is_active === true && place.status === 'active').length,
    verified: places.filter((place) => place.is_verified === true).length,
  },
  classifications,
  byIsland,
  crosswalk,
}

fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(
  `${outputBase}.tsv`,
  [
    ['island', 'official_name', 'classification', 'place_id', 'place_name', 'assigned_island', 'address', 'latitude', 'longitude', 'active', 'verified', 'name_score'].join('\t'),
    ...crosswalk.map((row) => [
      row.islandSlug,
      row.officialName,
      row.classification,
      row.best?.id || '',
      row.best?.name || '',
      row.best?.islandId || row.best?.islandName || '',
      row.best?.address || '',
      row.best?.latitude ?? '',
      row.best?.longitude ?? '',
      row.best?.active ?? '',
      row.best?.verified ?? '',
      row.best?.nameScore?.toFixed(4) || '',
    ].join('\t')),
  ].join('\n') + '\n',
)

console.log(JSON.stringify({inventory: report.inventory, classifications, byIsland, report: `${outputBase}.json`, tsv: `${outputBase}.tsv`}, null, 2))
