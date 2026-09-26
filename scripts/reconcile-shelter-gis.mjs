#!/usr/bin/env node

/**
 * Build a review-only crosswalk between the official 2026 DRM shelter drafts
 * and the public 2023 Bahamas shelter GIS layer.
 *
 * Usage:
 *   node scripts/reconcile-shelter-gis.mjs [facility-seed.ndjson] [gis.json] [output-base]
 *
 * The script never publishes or mutates Sanity. Its output is an evidence
 * report plus candidate replacement documents for a separately reviewed import.
 */

import fs from 'node:fs'

const facilitySeedPath = process.argv[2] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const gisPath = process.argv[3] || '/private/tmp/baha-2023-shelter-gis.json'
const outputBase = process.argv[4] || '/private/tmp/baha-buddy-shelter-gis-crosswalk'

if (!fs.existsSync(facilitySeedPath)) {
  throw new Error(`Missing input: ${facilitySeedPath}. Run npm run research:build-baseline first.`)
}

if (!fs.existsSync(gisPath)) {
  const endpoint = new URL('https://services5.arcgis.com/7hGqXW40U1lPUYw2/arcgis/rest/services/2023_Bahamas_Shelter_Location_WFL1/FeatureServer/0/query')
  endpoint.search = new URLSearchParams({
    where: '1=1',
    outFields: 'OBJECTID,Shelter_Na,Island,Settlement,Y_Coordina,X_Coordina,File_Link,District,Street,ShelterType',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  }).toString()
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error(`GIS download failed: ${response.status} ${response.statusText}`)
  const payload = await response.json()
  if (!Array.isArray(payload.features)) throw new Error(`GIS download returned no features: ${JSON.stringify(payload).slice(0, 300)}`)
  fs.writeFileSync(gisPath, `${JSON.stringify(payload, null, 2)}\n`)
}

const documents = fs.readFileSync(facilitySeedPath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse)
const facilities = documents.filter((document) => document._type === 'emergencyFacility')
const gisPayload = JSON.parse(fs.readFileSync(gisPath, 'utf8'))
const gisFeatures = Array.isArray(gisPayload.features) ? gisPayload.features : []

// A same-settlement fuzzy name is not always the same building. Keep explicit
// exclusions here so an automated re-run cannot silently promote them.
const classificationOverrides = new Map([
  [7, {
    classification: 'conflict_or_ambiguous',
    reason: 'The 2026 row says Amy Roberts Primary School while the 2023 GIS says Amy Roberts Primary Pre-School. The shared campus/settlement is insufficient to prove the same shelter building.',
  }],
])

if (facilities.length !== 121) throw new Error(`Expected 121 emergency-facility drafts, found ${facilities.length}`)
if (gisFeatures.length !== 144) throw new Error(`Expected 144 public GIS features, found ${gisFeatures.length}`)

const destinationByReference = new Map([
  ['dest-abacos', 'abacos'],
  ['dest-acklins-crooked-island', 'acklins-crooked-island'],
  ['dest-andros', 'andros'],
  ['dest-berry-islands', 'berry-islands'],
  ['dest-bimini', 'bimini'],
  ['dest-cat-island', 'cat-island'],
  ['dest-eleuthera', 'eleuthera-harbour-island'],
  ['dest-exuma', 'the-exumas'],
  ['dest-grand-bahama', 'grand-bahama'],
  ['dest-inagua', 'inagua'],
  ['dest-long-island', 'long-island'],
  ['dest-mayaguana', 'mayaguana'],
  ['dest-nassau', 'nassau-paradise-island'],
  ['dest-rum-cay', 'rum-cay'],
  ['dest-san-salvador', 'san-salvador'],
])

const gisIslandAliases = new Map([
  ['abaco', 'abacos'],
  ["abaco moore s island", 'abacos'],
  ['elbow cay abaco', 'abacos'],
  ['acklins', 'acklins-crooked-island'],
  ['crooked island', 'acklins-crooked-island'],
  ['andros mangrove cay', 'andros'],
  ['central andros', 'andros'],
  ['north andros', 'andros'],
  ['south andros', 'andros'],
  ['berry islands', 'berry-islands'],
  ['bimini', 'bimini'],
  ['cat island', 'cat-island'],
  ['eleuthera', 'eleuthera-harbour-island'],
  ['harbour island eleuthera', 'eleuthera-harbour-island'],
  ['exuma', 'the-exumas'],
  ['grand bahama', 'grand-bahama'],
  ['inagua', 'inagua'],
  ['long island', 'long-island'],
  ['mayaguana', 'mayaguana'],
  ['new providence', 'nassau-paradise-island'],
  ['ragged island', 'ragged-island'],
  ['rum cay', 'rum-cay'],
  ['san salvador', 'san-salvador'],
])

function plain(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/\bcentre\b/g, 'center')
    .replace(/\bcommunity ctr\b/g, 'community center')
    .replace(/\bhighschool\b/g, 'high school')
    .replace(/\bpre school\b/g, 'preschool')
    .replace(/\bseventh[ -]?day\b/g, 'seventh day')
    .replace(/\bst[.]?\b/g, 'saint')
    .replace(/\bmt[.]?\b/g, 'mount')
    .replace(/\bcogop\b/g, 'church of god of prophecy')
    .replace(/\bsda\b/g, 'seventh day adventist')
    .replace(/\bthe baptist\b/g, 'baptist')
    .replace(/\broman catholic\b/g, 'catholic')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeIsland(value) {
  return gisIslandAliases.get(plain(value)) || null
}

function normalizeName(value) {
  return plain(value)
    .replace(/\bfor use by\b.*$/g, '')
    .replace(/\breserved for\b.*$/g, '')
    .replace(/\bafter storm passage\b.*$/g, '')
    .replace(/\bafter passage\b.*$/g, '')
    .replace(/\bspecial needs shelter\b/g, '')
    .replace(/\bshelter needs shelter\b/g, '')
    .replace(/\bauditorium\b/g, '')
    .replace(/\bgymnasium\b/g, 'gym')
    .replace(/\bcommunity hall\b/g, 'community center')
    .replace(/\ball age\b/g, 'all age')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeSettlement(value) {
  return plain(value)
    .replace(/\bbouge\b/g, 'bogue')
    .replace(/\bgoverno r\b/g, 'governor')
    .replace(/\bcolonel hil\b/g, 'colonel hill')
    .replace(/\bbullocks harbour\b/g, 'bullock harbour')
    .replace(/\bdeadman s cay\b/g, 'deadmans cay')
    .replace(/\bfarmer s hill\b/g, 'farmers hill')
    .replace(/\bhooper s bay\b/g, 'hoopers bay')
    .replace(/\bforbe s hill\b/g, 'forbes hill')
    .replace(/\bwilliam s town\b/g, 'williams town')
    .replace(/\bpirate s well\b/g, 'pirates well')
    .replace(/\s+/g, ' ')
    .trim()
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

function tokenSimilarity(left, right) {
  const leftTokens = new Set(left.split(' ').filter(Boolean))
  const rightTokens = new Set(right.split(' ').filter(Boolean))
  if (!leftTokens.size || !rightTokens.size) return 0
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return intersection / new Set([...leftTokens, ...rightTokens]).size
}

function coordinate(feature) {
  const longitude = Number(feature.geometry?.x ?? feature.attributes?.X_Coordina)
  const latitude = Number(feature.geometry?.y ?? feature.attributes?.Y_Coordina)
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude !== 0 && latitude !== 0
    ? {longitude, latitude}
    : null
}

const gisRows = gisFeatures.map((feature) => {
  const attributes = feature.attributes || {}
  return {
    objectId: attributes.OBJECTID,
    island: attributes.Island || '',
    islandSlug: normalizeIsland(attributes.Island),
    name: attributes.Shelter_Na || '',
    normalizedName: normalizeName(attributes.Shelter_Na),
    settlement: attributes.Settlement || '',
    normalizedSettlement: normalizeSettlement(attributes.Settlement),
    district: attributes.District || '',
    street: attributes.Street || '',
    normalizedStreet: normalizeSettlement(attributes.Street),
    shelterType: attributes.ShelterType || '',
    coordinate: coordinate(feature),
  }
})

const crosswalk = facilities.map((facility) => {
  const islandSlug = destinationByReference.get(facility.destination?._ref)
  if (!islandSlug) throw new Error(`Unknown destination reference on ${facility._id}: ${facility.destination?._ref}`)
  const normalizedName = normalizeName(facility.title)
  const normalizedSettlement = normalizeSettlement(facility.settlement)
  const candidates = gisRows
    .filter((row) => row.islandSlug === islandSlug)
    .map((row) => {
      const characterNameScore = similarity(normalizedName, row.normalizedName)
      const wordNameScore = tokenSimilarity(normalizedName, row.normalizedName)
      const nameScore = Math.max(characterNameScore, wordNameScore)
      const settlementFieldScore = similarity(normalizedSettlement, row.normalizedSettlement)
      const streetScore = similarity(normalizedSettlement, row.normalizedStreet)
      const settlementScore = Math.max(settlementFieldScore, streetScore)
      return {
        ...row,
        nameExact: normalizedName === row.normalizedName,
        nameScore,
        matchedLocationField: streetScore > settlementFieldScore ? 'street' : 'settlement',
        settlementFieldScore,
        streetScore,
        settlementScore,
        score: (nameScore * 0.8) + (settlementScore * 0.2),
      }
    })
    .sort((left, right) => right.score - left.score || Number(right.nameExact) - Number(left.nameExact))

  const best = candidates[0] || null
  const second = candidates[1] || null
  const margin = best ? best.score - (second?.score || 0) : 0
  let classification = 'unmatched'
  if (best) {
    if (!best.coordinate && (best.nameExact || best.nameScore >= 0.86)) classification = 'matched_without_coordinates'
    else if (best.coordinate && best.nameExact && best.settlementScore >= 0.9 && margin >= 0.04) classification = 'exact'
    else if (best.coordinate && best.nameExact && best.settlementScore >= 0.72 && margin >= 0.08) classification = 'strong_settlement_variant'
    else if (best.coordinate && best.nameScore >= 0.86 && best.settlementScore >= 0.82 && margin >= 0.08) classification = 'strong_name_variant'
    else if (best.nameExact || best.nameScore >= 0.84) classification = 'conflict_or_ambiguous'
  }
  const override = classificationOverrides.get(facility.sourceEntryNumber)
  if (override) classification = override.classification

  return {
    facilityId: facility._id,
    sourceEntryNumber: facility.sourceEntryNumber,
    islandSlug,
    facilityName: facility.title,
    facilitySettlement: facility.settlement,
    classification,
    classificationNote: override?.reason || '',
    margin,
    best,
    candidates: candidates.slice(0, 3),
  }
})

const classifications = Object.fromEntries(
  [...new Set(crosswalk.map((row) => row.classification))]
    .sort()
    .map((classification) => [classification, crosswalk.filter((row) => row.classification === classification).length]),
)

const byIsland = Object.fromEntries(
  [...new Set(crosswalk.map((row) => row.islandSlug))]
    .sort()
    .map((islandSlug) => {
      const rows = crosswalk.filter((row) => row.islandSlug === islandSlug)
      return [islandSlug, {
        facilities: rows.length,
        exact: rows.filter((row) => row.classification === 'exact').length,
        strongVariants: rows.filter((row) => row.classification.startsWith('strong_')).length,
        conflicts: rows.filter((row) => row.classification === 'conflict_or_ambiguous').length,
        withoutCoordinates: rows.filter((row) => row.classification === 'matched_without_coordinates').length,
        unmatched: rows.filter((row) => row.classification === 'unmatched').length,
      }]
    }),
)

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {facilitySeedPath, gisPath, facilityCount: facilities.length, gisFeatureCount: gisRows.length},
  methodology: {
    boundary: 'Same canonical island group only. No cross-island match is permitted.',
    automaticEvidence: 'This report proposes candidates only. It does not approve coordinates, publish facilities, or establish current readiness.',
    coordinateSource: 'ArcGIS WGS84 geometry is preferred; numeric attributes are fallback only. Zero/null coordinates are rejected.',
  },
  classifications,
  byIsland,
  crosswalk,
}

const locationSourceId = 'research-source-bahamas-2023-hurricane-shelter-gis'
const locationSource = documents.find((document) => document._id === locationSourceId)
if (!locationSource) throw new Error(`Missing ${locationSourceId} in ${facilitySeedPath}; rebuild the research baseline first.`)

const crosswalkByFacilityId = new Map(crosswalk.map((row) => [row.facilityId, row]))
const replacementFacilities = facilities.map((facility) => {
  const row = crosswalkByFacilityId.get(facility._id)
  if (!row) throw new Error(`Missing crosswalk result for ${facility._id}`)
  const carriesCandidate = ['exact', 'strong_name_variant', 'strong_settlement_variant'].includes(row.classification)
  const carriesSourceCandidate = carriesCandidate || ['conflict_or_ambiguous', 'matched_without_coordinates'].includes(row.classification)
  const statusByClassification = {
    exact: 'exact_candidate',
    strong_name_variant: 'strong_name_variant',
    strong_settlement_variant: 'strong_location_variant',
    conflict_or_ambiguous: 'conflict_or_ambiguous',
    matched_without_coordinates: 'matched_without_coordinates',
    unmatched: 'unmatched',
  }
  const notesByClassification = {
    exact: `Same canonical island group, normalized facility name, and published settlement/street align with GIS object ${row.best?.objectId}. The 2023 coordinate is a pending historical candidate only; it is not a verified entrance, current shelter route, inspection result, or activation status.`,
    strong_name_variant: `Same canonical island group and published settlement/street align; the facility names differ by a strong spelling or wording variant. GIS object ${row.best?.objectId} is retained as a pending historical candidate only. Confirm the exact building before accepting it.`,
    strong_settlement_variant: `The facility name aligns exactly and the same-island location labels are strong variants. GIS object ${row.best?.objectId} is retained as a pending historical candidate only. Confirm the exact building and location wording before accepting it.`,
    conflict_or_ambiguous: row.classificationNote || `The top same-island GIS candidate (${row.best?.objectId || 'none'}) has a conflicting or ambiguous facility/location match. No coordinate is carried into the candidate field. Resolve identity against an authority-issued facility record before use.`,
    matched_without_coordinates: `A strong same-island historical facility match exists at GIS object ${row.best?.objectId}, but the public row has null or zero coordinates. No coordinate is carried forward.`,
    unmatched: 'No sufficiently strong same-island match was found in the 2023 public GIS. No coordinate is carried forward; obtain a current authority-issued facility location or perform a documented manual reconciliation.',
  }
  const review = {
    _type: 'emergencyLocationReview',
    source: {_type: 'reference', _ref: locationSourceId},
    sourceDatasetYear: 2023,
    checkedAt: '2026-08-05',
    reconciliationStatus: statusByClassification[row.classification],
    reviewDecision: carriesCandidate ? 'pending' : 'not_applicable',
    notes: notesByClassification[row.classification],
  }
  if (carriesSourceCandidate && row.best) {
    review.sourceObjectId = row.best.objectId
    review.sourceFacilityName = row.best.name
    review.sourceIsland = row.best.island
    if (row.best.settlement) review.sourceSettlement = row.best.settlement
    if (row.best.street) review.sourceStreet = row.best.street
    review.nameMatchScore = Number(row.best.nameScore.toFixed(6))
    review.locationMatchScore = Number(row.best.settlementScore.toFixed(6))
  }
  if (carriesCandidate && row.best?.coordinate) {
    review.candidateLocation = {
      _type: 'geopoint',
      lat: row.best.coordinate.latitude,
      lng: row.best.coordinate.longitude,
    }
  }
  return {...facility, historicalLocationReview: review}
})

if (replacementFacilities.filter((facility) => facility.historicalLocationReview?.candidateLocation).length !== 51) {
  throw new Error('Expected exactly 51 coordinate candidates after explicit exclusions.')
}
if (replacementFacilities.some((facility) => facility.channels?.length)) {
  throw new Error('Refusing to emit emergency-facility replacements with delivery channels.')
}

fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(
  `${outputBase}.tsv`,
  [
    ['entry', 'island', 'facility', 'published_location', 'classification', 'gis_object_id', 'gis_name', 'gis_settlement', 'gis_street', 'matched_location_field', 'longitude', 'latitude', 'name_score', 'location_score', 'margin'].join('\t'),
    ...crosswalk.map((row) => [
      row.sourceEntryNumber,
      row.islandSlug,
      row.facilityName,
      row.facilitySettlement,
      row.classification,
      row.best?.objectId || '',
      row.best?.name || '',
      row.best?.settlement || '',
      row.best?.street || '',
      row.best?.matchedLocationField || '',
      row.best?.coordinate?.longitude || '',
      row.best?.coordinate?.latitude || '',
      row.best?.nameScore?.toFixed(4) || '',
      row.best?.settlementScore?.toFixed(4) || '',
      row.margin.toFixed(4),
    ].join('\t')),
  ].join('\n') + '\n',
)
fs.writeFileSync(
  `${outputBase}-sanity-replacements.ndjson`,
  `${[locationSource, ...replacementFacilities].map((document) => JSON.stringify(document)).join('\n')}\n`,
)

console.log(JSON.stringify({
  classifications,
  coordinateCandidates: 51,
  byIsland,
  report: `${outputBase}.json`,
  tsv: `${outputBase}.tsv`,
  sanityReplacements: `${outputBase}-sanity-replacements.ndjson`,
}, null, 2))
