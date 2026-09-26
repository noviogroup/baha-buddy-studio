#!/usr/bin/env node

/**
 * Read-only crosswalk of location-blocked official signature places against
 * the Bahamas Ministry of Tourism public map dataset.
 *
 * The map is authoritative identity/location evidence, but a visible marker
 * or status=1 is not proof of current operation, safe access, or accuracy.
 */

import fs from 'node:fs'

const signatureCrosswalkPath = process.argv[2] || '/private/tmp/baha-buddy-official-signature-place-crosswalk.json'
const outputBase = process.argv[3] || '/private/tmp/baha-buddy-signature-place-official-map-crosswalk'
const mapUrl = 'https://www.bahamas.com/map'
const mapEndpoint = 'https://www.bahamas.com/ajax/functions.php'

const destinationIds = new Map([
  ['abacos', 19],
  ['acklins-crooked-island', 20],
  ['andros', 21],
  ['berry-islands', 22],
  ['bimini', 23],
  ['cat-island', 24],
  ['eleuthera-harbour-island', 25],
  ['the-exumas', 26],
  ['grand-bahama', 27],
  ['inagua', 28],
  ['long-island', 29],
  ['mayaguana', 30],
  ['nassau-paradise-island', 31],
  ['ragged-island', 32],
  ['rum-cay', 33],
  ['san-salvador', 34],
])

function plain(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/\bthe\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const identityAliases = new Map([
  ['san-salvador::southern great lake national park', ['great lake national park']],
  ['nassau-paradise-island::national art gallery of bahamas', ['national art gallery of bahamas nagb']],
])

// These records locate a named visitor site or subfeature, not necessarily the
// whole cay, lagoon, community, or blue hole. They remain related-site evidence.
const relatedFeatureNames = new Map([
  ['abacos::man o war cay', ['man o war heritage museum', 'man o war marina']],
  ['the-exumas::big major cay', ['pig beach big major cay']],
  ['long-island::dean s blue hole', ['dean s blue hole beach']],
  ['ragged-island::hog cay', ['hog cay beach']],
])

const areaIdentities = new Set([
  'acklins-crooked-island::bight of acklins',
])

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function validPoint(latitude, longitude) {
  return latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0 &&
    latitude >= 20 && latitude <= 28 && longitude >= -80 && longitude <= -72
}

async function fetchDestination(slug, destinationId) {
  const response = await fetch(mapEndpoint, {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({operation: 'getDestData', dest: String(destinationId)}),
  })
  if (!response.ok) throw new Error(`Official map request failed for ${slug}: ${response.status} ${response.statusText}`)
  const payload = await response.json()
  if (!Array.isArray(payload.business)) throw new Error(`Official map returned no business array for ${slug}`)
  return payload.business
}

if (!fs.existsSync(signatureCrosswalkPath)) throw new Error(`Missing input: ${signatureCrosswalkPath}`)
const signatureCrosswalk = JSON.parse(fs.readFileSync(signatureCrosswalkPath, 'utf8'))
const targets = signatureCrosswalk.crosswalk.filter((row) => row.classification === 'assigned_but_location_invalid')
if (targets.length !== 19) throw new Error(`Expected 19 location-blocked signature places, found ${targets.length}`)

const rawByIsland = {}
for (const [slug, destinationId] of destinationIds) {
  rawByIsland[slug] = await fetchDestination(slug, destinationId)
}

const rows = targets.map((target) => {
  const normalizedOfficialName = plain(target.officialName)
  const identityKey = `${target.islandSlug}::${normalizedOfficialName}`
  const acceptedNames = new Set([
    normalizedOfficialName,
    ...(identityAliases.get(identityKey) || []),
  ])
  const relatedNames = new Set(relatedFeatureNames.get(identityKey) || [])
  const identityRows = rawByIsland[target.islandSlug]
    .filter((candidate) => acceptedNames.has(plain(candidate.business_name)))
    .map((candidate) => ({candidate, relationship: 'exact_or_source_backed_identity'}))
  const relatedRows = rawByIsland[target.islandSlug]
    .filter((candidate) => relatedNames.has(plain(candidate.business_name)))
    .map((candidate) => ({candidate, relationship: 'related_visitor_site'}))
  const selectedRows = identityRows.length ? identityRows : relatedRows
  const candidates = selectedRows
    .map(({candidate, relationship}) => {
      const latitude = numeric(candidate.latitude)
      const longitude = numeric(candidate.longitude)
      const mapRecordId = candidate.id ?? candidate.pin_id ?? null
      const mapRecordType = candidate.id != null ? 'tourism_business' : 'tourism_map_pin'
      return {
        mapRecordId,
        mapRecordType,
        mapBusinessId: candidate.id ?? null,
        mapPinId: candidate.pin_id ?? null,
        name: candidate.business_name,
        relationship,
        destinationId: Number(candidate.destination_id ?? candidate.dest_id),
        destination: candidate.destination,
        latitude,
        longitude,
        validPoint: validPoint(latitude, longitude),
        visibleStatus: candidate.status == null ? null : candidate.status === 1,
        address: [candidate.addr1, candidate.addr2, candidate.city].filter((value) => typeof value === 'string' && value.trim()).join(', ') || null,
        contactName: candidate.contact_name || null,
        phone: candidate.phone_alt || candidate.phone || null,
        email: candidate.email?.trim() || null,
        website: candidate.website || null,
        updatedAt: candidate.updated_at || null,
        createdAt: candidate.created_at || null,
        seoName: candidate.seo_name || null,
        sourceUrl: candidate.id != null ? `${mapUrl}#b=${candidate.id}` : mapUrl,
      }
    })
  let classification = 'official_identity_source_no_point'
  if (identityRows.length === 1 && candidates[0].validPoint) classification = 'official_map_point_candidate'
  else if (identityRows.length === 1) classification = 'official_map_identity_without_point'
  else if (identityRows.length > 1) classification = 'official_map_conflict_or_duplicate'
  else if (relatedRows.length) classification = 'official_map_related_site_point_only'
  else if (areaIdentities.has(identityKey)) classification = 'official_area_identity_no_point'
  return {
    islandSlug: target.islandSlug,
    islandName: target.islandName,
    officialName: target.officialName,
    supabasePlaceId: target.best.id,
    supabaseName: target.best.name,
    currentLatitude: target.best.latitude,
    currentLongitude: target.best.longitude,
    classification,
    source: {
      title: 'Bahamas Ministry of Tourism public map dataset',
      url: mapUrl,
      endpoint: mapEndpoint,
      checkedAt: new Date().toISOString(),
      boundary: 'Marker identity and point evidence only. A visible marker or status=1 does not prove current operation, hours, safe access, point accuracy, accessibility, or traveler suitability.',
    },
    candidates,
  }
})

const classifications = Object.fromEntries(
  [...new Set(rows.map((row) => row.classification))]
    .sort()
    .map((classification) => [classification, rows.filter((row) => row.classification === classification).length]),
)
const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: 'The 19 official signature-place identities whose matched Supabase rows have null or zero coordinates.',
    source: `${mapUrl} public marker data via ${mapEndpoint}`,
    identityRule: 'Exact normalized official names inside the expected tourism destination, explicit source-backed identity aliases, and an explicit allowlist of named related visitor sites. Related-site pins remain distinct from canonical feature points. No general fuzzy identity merge.',
    guardrail: 'All extracted points remain pending editorial candidates. This script never mutates Supabase or Sanity.',
  },
  classifications,
  rows,
}

fs.writeFileSync(`${outputBase}-raw.json`, `${JSON.stringify(rawByIsland, null, 2)}\n`)
fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(
  `${outputBase}.tsv`,
  [
    ['island', 'official_name', 'supabase_place_id', 'classification', 'map_record_id', 'map_record_type', 'map_name', 'relationship', 'latitude', 'longitude', 'visible_status', 'map_updated_at'].join('\t'),
    ...rows.map((row) => [
      row.islandSlug,
      row.officialName,
      row.supabasePlaceId,
      row.classification,
      row.candidates[0]?.mapRecordId || '',
      row.candidates[0]?.mapRecordType || '',
      row.candidates[0]?.name || '',
      row.candidates[0]?.relationship || '',
      row.candidates[0]?.latitude ?? '',
      row.candidates[0]?.longitude ?? '',
      row.candidates[0]?.visibleStatus ?? '',
      row.candidates[0]?.updatedAt || '',
    ].join('\t')),
  ].join('\n') + '\n',
)

console.log(JSON.stringify({targets: rows.length, classifications, report: `${outputBase}.json`, raw: `${outputBase}-raw.json`}, null, 2))
