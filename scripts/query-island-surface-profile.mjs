import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const islandSlug = process.env.ISLAND_SLUG
if (!islandSlug) throw new Error('Set ISLAND_SLUG to one of the 16 canonical island slugs.')

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')
const outputPath = `/private/tmp/baha-buddy-island-surface-profile-${islandSlug}.json`

const islandBounds = {
  'nassau-paradise-island': [24.75, 25.35, -77.8, -76.9],
  'grand-bahama': [26.1, 27.1, -79.7, -77.5],
  bimini: [25.35, 26.1, -79.6, -78.9],
  abacos: [25.3, 27.1, -78.2, -76.6],
  'berry-islands': [25.2, 26.2, -78.5, -77.3],
  'eleuthera-harbour-island': [24.2, 26, -77.1, -75.5],
  'the-exumas': [23, 25.5, -77, -75],
  andros: [23, 25.5, -78.8, -76.1],
  'long-island': [22.5, 24.3, -75.8, -74.6],
  'cat-island': [23.9, 25.2, -76.1, -74.9],
  'san-salvador': [23.6, 24.5, -74.9, -74],
  'rum-cay': [23.2, 24, -75.2, -74.4],
  'ragged-island': [21.2, 22.8, -76.3, -75],
  mayaguana: [21.8, 22.8, -73.6, -72.3],
  inagua: [20.5, 21.8, -74.1, -72.5],
  'acklins-crooked-island': [21.6, 23.3, -75.4, -73],
}

const islandAliases = new Map([
  ['abaco', 'abacos'], ['the-abacos', 'abacos'], ['the abacos', 'abacos'],
  ['exuma', 'the-exumas'], ['exumas', 'the-exumas'], ['the exumas', 'the-exumas'],
  ['nassau', 'nassau-paradise-island'], ['paradise-island', 'nassau-paradise-island'], ['paradise island', 'nassau-paradise-island'],
  ['freeport', 'grand-bahama'], ['freeport-grand-bahama', 'grand-bahama'],
  ['eleuthera', 'eleuthera-harbour-island'], ['harbour-island', 'eleuthera-harbour-island'], ['harbor-island', 'eleuthera-harbour-island'],
])

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

function canonicalIsland(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return islandAliases.get(normalized) || normalized.replace(/\s+/g, '-')
}

function number(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function hasCoordinates(place) {
  const latitude = number(place.latitude)
  const longitude = number(place.longitude)
  return latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0
}

function insideBounds(place) {
  const bounds = islandBounds[islandSlug]
  const latitude = number(place.latitude)
  const longitude = number(place.longitude)
  return Boolean(bounds && hasCoordinates(place) && latitude >= bounds[0] && latitude <= bounds[1] && longitude >= bounds[2] && longitude <= bounds[3])
}

function hasDescription(place) {
  return [place.description, place.short_description].some((value) => typeof value === 'string' && value.trim().length >= 40)
}

function hasMedia(place) {
  if (typeof place.primary_image_url === 'string' && place.primary_image_url.trim()) return true
  return Array.isArray(place.gallery_images) && place.gallery_images.some((value) => typeof value === 'string' ? value.trim() : value?.url)
}

function normalizedName(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function countBy(rows, field) {
  const result = {}
  for (const row of rows) {
    const value = String(row[field] ?? '(null)')
    result[value] = (result[value] || 0) + 1
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

function refs(value, result = []) {
  if (Array.isArray(value)) {
    for (const item of value) refs(item, result)
  } else if (value && typeof value === 'object') {
    if (typeof value._ref === 'string') result.push(value._ref)
    for (const item of Object.values(value)) refs(item, result)
  }
  return result
}

function hardcodedSignals(searchTerms) {
  const relativePaths = [
    'bahabuddy-web/src/lib/islands.ts',
    'bahabuddy-web/src/components/marketplace/MarketplacePublicHeader.tsx',
    'bahabuddy-web/src/lib/chat-tools.ts',
    'Baha-Buddy-V2/lib/core/constants/baha_images.dart',
    'Baha-Buddy-V2/lib/features/home/widgets/home_sections.dart',
  ]
  const needles = [...new Set(searchTerms.map(normalizedName).filter((value) => value.length >= 4))]
  const signals = []
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(workspaceRoot, relativePath)
    if (!fs.existsSync(absolutePath)) continue
    for (const [index, line] of fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/).entries()) {
      const normalizedLine = normalizedName(line)
      if (needles.some((needle) => normalizedLine.includes(needle))) {
        signals.push({file: relativePath, line: index + 1, text: line.trim()})
      }
    }
  }
  return signals
}

async function fetchCurrentPlaces() {
  const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web/.env.local'))
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
  const fields = 'id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url,gallery_images'
  const rows = []
  for (let start = 0; ; start += 1000) {
    const response = await fetch(`${url}/rest/v1/places?select=${fields}`, {
      headers: {apikey: key, Authorization: `Bearer ${key}`, Range: `${start}-${start + 999}`},
    })
    if (!response.ok) throw new Error(`Supabase places: ${response.status} ${(await response.text()).slice(0, 200)}`)
    const page = await response.json()
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows.filter((row) => canonicalIsland(row.island_id || row.island_name) === islandSlug)
}

const sanity = await client.fetch(`{
  "destinations": *[_type == "destination" && islandId == $islandSlug] | order(_id asc),
  "candidates": *[_type == "canonicalPlaceCandidate" && destination->islandId == $islandSlug] | order(title asc),
  "places": *[_type == "placeEditorial" && destination->islandId == $islandSlug] | order(title asc),
  "imageCandidates": *[_type == "imageCandidate" && destination->islandId == $islandSlug] | order(title asc),
  "facts": *[_type == "islandFact" && destination->islandId == $islandSlug] | order(topic asc, title asc),
  "audits": *[_type == "islandResearchAudit" && destination->islandId == $islandSlug] | order(_updatedAt desc)
}`, {islandSlug}, {perspective: 'raw'})

if (!sanity.destinations.length) throw new Error(`No Sanity destination found for ${islandSlug}`)
const sourceIds = [...new Set(refs(sanity).filter((id) => id.startsWith('research-source-')))]
const sources = sourceIds.length
  ? await client.fetch(`*[_type == "researchSource" && _id in $sourceIds] | order(publisher asc, title asc)`, {sourceIds}, {perspective: 'raw'})
  : []
const supabasePlaces = await fetchCurrentPlaces()
const rowsByNormalizedName = new Map()
for (const row of supabasePlaces) {
  const name = normalizedName(row.name)
  rowsByNormalizedName.set(name, [...(rowsByNormalizedName.get(name) || []), row])
}
const duplicateNames = [...rowsByNormalizedName.entries()]
  .filter(([name, rows]) => name && rows.length > 1)
  .map(([name, rows]) => ({normalizedName: name, ids: rows.map((row) => row.id), titles: rows.map((row) => row.name)}))

const searchTerms = [
  islandSlug,
  ...sanity.destinations.map((document) => document.name),
  ...sanity.candidates.map((document) => document.title),
  ...sanity.places.map((document) => document.title),
]

const result = {
  generatedAt: new Date().toISOString(),
  islandSlug,
  output: outputPath,
  boundary: 'Read-only four-surface profile. No Sanity or Supabase write, publication, coordinate acceptance, media copying, external contact, or delivery approval.',
  sanity: {
    destinations: sanity.destinations,
    candidates: sanity.candidates,
    placeOverlays: sanity.places,
    imageCandidates: sanity.imageCandidates,
    facts: sanity.facts,
    audits: sanity.audits,
    sources,
    counts: {
      destinations: sanity.destinations.length,
      candidates: sanity.candidates.length,
      placeOverlays: sanity.places.length,
      imageCandidates: sanity.imageCandidates.length,
      imageCandidatesWithManagedAsset: sanity.imageCandidates.filter((document) => document.reviewImage?.asset?._ref).length,
      imageCandidatesExternalOnly: sanity.imageCandidates.filter((document) => !document.reviewImage?.asset?._ref).length,
      imageCandidatesReadyForEditorialReview: sanity.imageCandidates.filter((document) => document.reviewStatus === 'ready_for_editorial_review').length,
      imageCandidatesNeedingRightsReview: sanity.imageCandidates.filter((document) => ['source_display_only_not_cleared', 'controlled_library_asset_license_required', 'permission_required'].includes(document.rightsStatus)).length,
      imageCandidatesRejected: sanity.imageCandidates.filter((document) => document.reviewStatus === 'rejected' || document.rightsStatus === 'rejected').length,
      facts: sanity.facts.length,
      factsWithChannels: sanity.facts.filter((document) => (document.channels || []).length > 0).length,
      audits: sanity.audits.length,
      referencedSources: sources.length,
      activePlaceOverlays: sanity.places.filter((document) => document.active === true).length,
      placeOverlaysWithChannels: sanity.places.filter((document) => (document.channels || []).length > 0).length,
    },
  },
  supabase: {
    rows: supabasePlaces,
    profile: {
      rows: supabasePlaces.length,
      categories: countBy(supabasePlaces, 'category'),
      statuses: countBy(supabasePlaces, 'status'),
      active: countBy(supabasePlaces, 'is_active'),
      verified: countBy(supabasePlaces, 'is_verified'),
      withCoordinates: supabasePlaces.filter(hasCoordinates).length,
      insideBroadReviewBounds: supabasePlaces.filter(insideBounds).length,
      missingCoordinates: supabasePlaces.filter((row) => !hasCoordinates(row)).length,
      outsideBroadReviewBounds: supabasePlaces.filter((row) => hasCoordinates(row) && !insideBounds(row)).length,
      withUsefulDescription: supabasePlaces.filter(hasDescription).length,
      withMedia: supabasePlaces.filter(hasMedia).length,
      duplicateNames,
    },
  },
  hardcodedSignals: hardcodedSignals(searchTerms),
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({
  generatedAt: result.generatedAt,
  islandSlug,
  output: outputPath,
  boundary: result.boundary,
  sanity: result.sanity.counts,
  supabase: result.supabase.profile,
  hardcodedSignals: result.hardcodedSignals,
}, null, 2))
