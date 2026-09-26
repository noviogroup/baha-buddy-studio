#!/usr/bin/env node

/**
 * Read-only identity and location crosswalk for the 37 official signature
 * places that are absent from the canonical Supabase place catalog.
 *
 * Inputs are the official signature-place/Supabase crosswalk and the cached
 * Bahamas Ministry of Tourism public-map response. The script never writes to
 * Supabase or Sanity and never promotes a coordinate automatically.
 */

import fs from 'node:fs'

const signatureCrosswalkPath = process.argv[2] || '/private/tmp/baha-buddy-official-signature-place-crosswalk.json'
const mapRawPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-official-map-crosswalk-raw.json'
const outputBase = process.argv[4] || '/private/tmp/baha-buddy-absent-signature-place-location-crosswalk'
const mapUrl = 'https://www.bahamas.com/map'
const pointAgreementThresholdMetres = 150

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

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function validPoint(latitude, longitude) {
  return latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0 &&
    latitude >= 20 && latitude <= 28 && longitude >= -80 && longitude <= -72
}

function metresBetween(left, right) {
  const toRadians = (value) => value * Math.PI / 180
  const latitudeDelta = toRadians(right.latitude - left.latitude)
  const longitudeDelta = toRadians(right.longitude - left.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(left.latitude)) * Math.cos(toRadians(right.latitude)) *
    Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function key(islandSlug, officialName) {
  return `${islandSlug}::${officialName}`
}

const metadataRows = [
  ['abacos', 'Hope Town', 'community', 'destination', 'area', [], ['Hope Town Beach', 'Hope Town Inn & Marina'], 'Hope Town is a community identity. A beach, marina, business, or lodging point must not become the coordinate for the whole settlement.'],
  ['acklins-crooked-island', 'Ancient Lucayan Sites', 'multi_site_identity', 'culture', 'area', [], [], 'The official name is plural and distributed. Each archaeological or cultural site requires its own authority, identity, protection, and location evidence.'],
  ['acklins-crooked-island', 'Long Cay', 'community', 'destination', 'automatic', [], [], 'Long Cay is a settlement/island identity; an official marker can be reviewed as a representative point but not assumed to be an entrance or routing destination.'],
  ['acklins-crooked-island', 'Turtle Sound', 'natural_feature', 'nature', 'automatic', [], [], 'Turtle Sound is a natural feature. The only official-map record has an impossible positive longitude and is retained as invalid evidence.'],
  ['andros', 'West Side National Park', 'protected_area', 'nature', 'area', ['Andros West Side National Park'], [], 'This is a very large wilderness protected area with no single visitor entrance represented by the official source. Park geometry and responsible access context are needed.'],
  ['berry-islands', 'Chub Cay', 'geographic_area', 'destination', 'automatic', [], [], 'Chub Cay is a cay identity. The official point is a candidate representation, not proof of a dock, airport, resort entrance, or public access point.'],
  ['berry-islands', 'Sugar Beach', 'beach', 'beach', 'automatic', [], [], 'The same-name tourism business record has no point and the official map pin supplies one candidate. Access, public/private boundary, and routing still require review.'],
  ['bimini', 'Dolphin House Museum', 'museum', 'culture', 'identity_source', [], [], 'The national tourism authority identifies the museum in Alice Town, but the public map dataset does not provide an exact museum point. Current visitor operation remains unverified.'],
  ['bimini', 'Fountain of Youth', 'natural_feature', 'nature', 'automatic', [], [], 'Two same-name official points are kilometres apart. Neither point can be selected without responsible local or site-level corroboration.'],
  ['bimini', 'SS Sapona Shipwreck', 'shipwreck', 'experiences', 'automatic', ['Sapona Shipwreck'], [], 'The official map uses the shorter Sapona Shipwreck identity. A marine point is not proof of mooring, safe approach, dive conditions, operator suitability, or legal access.'],
  ['cat-island', 'Mount Alvernia and The Hermitage', 'historic_site', 'culture', 'automatic', ['The Hermitage on Mt. Alvernia'], [], 'The official source-backed alias locates The Hermitage on Mount Alvernia. Trailhead, parking, path, summit, and structure should remain distinct during routing review.'],
  ['cat-island', "Sir Sidney Poitier's Boyhood Home", 'historic_site', 'culture', 'identity_source', [], [], 'The official island source establishes the identity, but no exact public tourism-map point or current visitor-operation evidence was found.'],
  ['cat-island', 'Old Bight Beach', 'beach', 'beach', 'automatic', [], [], 'The official beach pin is a candidate feature point. Public access, approach, conditions, facilities, and accessibility remain unresolved.'],
  ['cat-island', 'Port Howe', 'community', 'destination', 'area', [], [], 'Port Howe is a settlement/community identity, not one venue. A future catalog model should not fabricate a single entrance.'],
  ['eleuthera-harbour-island', 'Pineapple Fields', 'agricultural_area', 'culture', 'area', [], [], 'The official signature wording describes a broad pineapple identity. The similarly named condo-hotel and individual farm operators are not the same canonical feature.'],
  ['eleuthera-harbour-island', 'Spanish Wells', 'community', 'destination', 'area', [], ['Spanish Wells Beach'], 'Spanish Wells is a community/island identity. The related beach pin cannot stand in for the whole settlement.'],
  ['the-exumas', 'Thunderball Grotto', 'natural_feature', 'nature', 'automatic', [], [], 'The same-name business record has no point and an official map pin supplies one candidate. Marine approach, tide, swimming/diving safety, permissions, and operator context remain unresolved.'],
  ['grand-bahama', 'Peterson Cay National Park', 'protected_area', 'nature', 'automatic', [], [], 'The official same-name park pin is not labeled as a landing, mooring, park entrance, or safe route. Responsible BNT access context remains necessary.'],
  ['grand-bahama', 'Port Lucaya Marketplace', 'marketplace', 'shopping', 'automatic', [], [], 'The official marketplace identity has one point candidate. Exact public entrance, hours, tenant operation, accessibility, and transport context remain separate checks.'],
  ['inagua', 'Great Inagua Lighthouse', 'lighthouse', 'culture', 'automatic', [], [], 'The official same-name lighthouse marker is a location candidate only. Current responsible operation, climb/visit permission, access, and structural safety remain unverified.'],
  ['inagua', 'Union Creek Reserve', 'protected_area', 'nature', 'automatic', [], [], 'The official same-name reserve marker is not identified as a visitor entrance. BNT describes a low-infrastructure research reserve, so access requires responsible confirmation.'],
  ['long-island', 'Cape Santa Maria Beach', 'beach', 'beach', 'related', [], ['Cape Santa Maria'], 'The map pin says Cape Santa Maria, while nearby resort records represent commercial operators. The point remains related evidence, not an exact public-beach coordinate.'],
  ['long-island', 'Columbus Point', 'historic_site', 'culture', 'related', [], ['Columbus Harbour Beach'], 'Only a related Columbus Harbour Beach pin was found. It does not establish the official Columbus Point identity or an appropriate visitor point.'],
  ['long-island', 'Twin Churches', 'multi_site_identity', 'culture', 'area', [], [], 'The official identity is plural. The two church sites must be identified and located independently before a canonical model is proposed.'],
  ['mayaguana', "Abraham's Bay", 'community', 'destination', 'automatic', [], [], "Abraham's Bay is a settlement/area identity. The official point is a candidate representation, not proof of a town-square, dock, beach, or routing destination."],
  ['mayaguana', 'Pirates Well', 'historic_site', 'culture', 'automatic', [], [], 'The official same-name marker is a candidate point. Site identity, condition, access, and traveler suitability require corroboration.'],
  ['nassau-paradise-island', "Queen's Staircase", 'historic_site', 'culture', 'automatic', [], [], 'The public tourism dataset contains two official same-name points beyond the agreement threshold. Neither is selected automatically.'],
  ['nassau-paradise-island', 'Fort Fincastle', 'historic_site', 'culture', 'automatic', [], [], 'Two same-name tourism points materially disagree, including a business point that appears inconsistent with the fort complex. A responsible authority point is required.'],
  ['nassau-paradise-island', 'Government House', 'historic_site', 'culture', 'automatic', [], [], 'The tourism marker and official identity/address can support a point review, but public access and event operations remain separate and volatile.'],
  ['ragged-island', 'Duncan Town', 'community', 'destination', 'automatic', [], [], 'Duncan Town is a settlement identity. The official point is a representative candidate, not proof of a particular public building, dock, or route.'],
  ['ragged-island', 'Jumentos Cays', 'geographic_area', 'nature', 'area', [], [], 'The Jumentos Cays are a broad chain. The official point is retained as an area marker and must not be used as a traveler routing destination.'],
  ['ragged-island', 'Pigeon Cay', 'geographic_area', 'nature', 'identity_source', [], [], 'The official island source establishes the signature identity, but no exact public tourism-map point was found in the Ragged Island dataset.'],
  ['rum-cay', 'Port Nelson', 'community', 'destination', 'automatic', [], [], 'Port Nelson is a settlement identity. The official point is a representative candidate, not proof of a dock, airport, public office, or route.'],
  ['rum-cay', 'HMS Conqueror Shipwreck', 'shipwreck', 'experiences', 'automatic', ['HMS Conqueror'], [], 'The public map uses HMS Conqueror as a source-backed identity alias. Its marine point is not safe-approach, mooring, diving, or legal-access evidence.'],
  ['rum-cay', 'Hartford Cave', 'natural_feature', 'nature', 'automatic', [], [], 'The official same-name marker is a point candidate only. Exact entrance, land access, cave condition, permissions, and safety remain unresolved.'],
  ['san-salvador', 'Gerace Research Centre', 'research_center', 'culture', 'automatic', ['The Gerace Research Center'], [], 'The public map uses the US spelling Center. The current operator supports institutional identity, but ordinary traveler access cannot be inferred from research/group operations.'],
  ['san-salvador', 'Bonefish Bay Beach', 'beach', 'beach', 'related', [], ['Bonefish Bay'], 'The public map locates Bonefish Bay, not an exact Bonefish Bay Beach access point. Keep the related feature and beach identity distinct.'],
]

const metadata = new Map(metadataRows.map(([islandSlug, officialName, featureType, categoryProposal, mode, aliases, relatedNames, identityBoundary]) => [
  key(islandSlug, officialName),
  {featureType, categoryProposal, mode, aliases, relatedNames, identityBoundary},
]))

for (const inputPath of [signatureCrosswalkPath, mapRawPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

const signatureCrosswalk = JSON.parse(fs.readFileSync(signatureCrosswalkPath, 'utf8'))
const rawByIsland = JSON.parse(fs.readFileSync(mapRawPath, 'utf8'))
const targets = signatureCrosswalk.crosswalk.filter((row) => row.classification === 'absent')
if (targets.length !== 37) throw new Error(`Expected 37 absent official signature places, found ${targets.length}`)

const targetKeys = new Set(targets.map((row) => key(row.islandSlug, row.officialName)))
const missingMetadata = [...targetKeys].filter((value) => !metadata.has(value))
const extraMetadata = [...metadata.keys()].filter((value) => !targetKeys.has(value))
if (missingMetadata.length || extraMetadata.length) {
  throw new Error(`Metadata mismatch. Missing: ${missingMetadata.join(', ') || 'none'}; extra: ${extraMetadata.join(', ') || 'none'}`)
}

function mapRecord(candidate, relationship) {
  const latitude = numeric(candidate.latitude)
  const longitude = numeric(candidate.longitude)
  const mapRecordId = candidate.id ?? candidate.pin_id ?? null
  const mapRecordType = candidate.id != null ? 'tourism_business' : 'tourism_map_pin'
  const pointIsValid = validPoint(latitude, longitude)
  const pointIssue = pointIsValid
    ? null
    : latitude === null || longitude === null || latitude === 0 || longitude === 0
      ? 'missing_coordinate'
      : 'invalid_coordinate'
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
    validPoint: pointIsValid,
    pointIssue,
    visibleStatus: candidate.status == null ? null : candidate.status === 1,
    address: [candidate.addr1, candidate.addr2, candidate.city].filter((value) => typeof value === 'string' && value.trim()).join(', ') || null,
    phone: candidate.phone_alt || candidate.phone || null,
    email: candidate.email?.trim() || null,
    website: candidate.website || null,
    updatedAt: candidate.updated_at || null,
    createdAt: candidate.created_at || null,
    seoName: candidate.seo_name || null,
    sourceUrl: candidate.id != null ? `${mapUrl}#b=${candidate.id}` : mapUrl,
  }
}

const rows = targets.map((target) => {
  const rowMetadata = metadata.get(key(target.islandSlug, target.officialName))
  const identityNames = new Set([target.officialName, ...rowMetadata.aliases].map(plain))
  const relatedNames = new Set(rowMetadata.relatedNames.map(plain))
  const islandRecords = rawByIsland[target.islandSlug] || []
  const identityRecords = islandRecords
    .filter((candidate) => identityNames.has(plain(candidate.business_name)))
    .map((candidate) => mapRecord(candidate, 'exact_or_source_backed_identity'))
  const relatedRecords = islandRecords
    .filter((candidate) => relatedNames.has(plain(candidate.business_name)))
    .map((candidate) => mapRecord(candidate, 'related_site'))
  const evidenceRecords = [...identityRecords, ...relatedRecords]
  const validIdentityPoints = identityRecords.filter((record) => record.validPoint)
  const validRelatedPoints = relatedRecords.filter((record) => record.validPoint)

  let maxIdentityPointDistanceMetres = null
  if (validIdentityPoints.length > 1) {
    const distances = []
    for (let left = 0; left < validIdentityPoints.length; left += 1) {
      for (let right = left + 1; right < validIdentityPoints.length; right += 1) {
        distances.push(metresBetween(validIdentityPoints[left], validIdentityPoints[right]))
      }
    }
    maxIdentityPointDistanceMetres = Math.max(...distances)
  }

  let classification
  if (rowMetadata.mode === 'area') classification = 'official_area_identity_no_point'
  else if (rowMetadata.mode === 'related') classification = validRelatedPoints.length ? 'official_map_related_site_point_only' : 'official_identity_source_no_point'
  else if (rowMetadata.mode === 'identity_source') classification = 'official_identity_source_no_point'
  else if (!identityRecords.length) classification = validRelatedPoints.length ? 'official_map_related_site_point_only' : 'official_identity_source_no_point'
  else if (!validIdentityPoints.length) {
    classification = identityRecords.some((record) => record.pointIssue === 'invalid_coordinate')
      ? 'official_map_invalid_point'
      : 'official_map_identity_without_point'
  } else if (validIdentityPoints.length === 1) classification = 'official_map_point_candidate'
  else if (maxIdentityPointDistanceMetres <= pointAgreementThresholdMetres) classification = 'official_map_points_consistent'
  else classification = 'official_map_point_conflict'

  return {
    islandSlug: target.islandSlug,
    islandName: target.islandName,
    officialName: target.officialName,
    officialIdentitySourceIds: target.sourceIds,
    officialIdentitySourceUrl: target.sourceUrl,
    featureType: rowMetadata.featureType,
    categoryProposal: rowMetadata.categoryProposal,
    identityBoundary: rowMetadata.identityBoundary,
    classification,
    pointAgreementThresholdMetres,
    maxIdentityPointDistanceMetres: maxIdentityPointDistanceMetres == null ? null : Math.round(maxIdentityPointDistanceMetres),
    evidenceRecords,
    validPointCandidates: evidenceRecords.filter((record) => record.validPoint),
    rejectedSupabaseCandidate: target.best ? {
      recordId: target.best.id,
      name: target.best.name,
      reason: `${target.best.name} is not the same official identity as ${target.officialName}; the fuzzy catalog lead is retained only to prevent an accidental merge.`,
    } : null,
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
    scope: 'The 37 official destination-signature identities absent from the canonical Supabase place catalog.',
    source: 'Bahamas Ministry of Tourism island identity pages and public-map records already captured by the signature-place audit workflow.',
    identityRule: 'Exact normalized names inside the expected tourism destination, explicit source-backed aliases, and a small explicit related-feature allowlist. No general fuzzy merge.',
    pointRule: `Bahamas-bounds numeric points are retained as evidence. Multiple exact-identity points are considered consistent only when every pair is within ${pointAgreementThresholdMetres} metres. Invalid, conflicting, area, community, plural-site, and related-site records remain unresolved.`,
    guardrail: 'This report is read-only. It does not create a Supabase place, approve a coordinate, activate content, assign delivery channels, or establish operation, access, safety, accessibility, or traveler suitability.',
  },
  classifications,
  rows,
}

fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(
  `${outputBase}.tsv`,
  [
    ['island', 'official_name', 'feature_type', 'classification', 'map_record_id', 'map_record_type', 'map_name', 'relationship', 'latitude', 'longitude', 'valid_point', 'point_issue', 'map_updated_at'].join('\t'),
    ...rows.flatMap((row) => row.evidenceRecords.length ? row.evidenceRecords.map((record) => [
      row.islandSlug,
      row.officialName,
      row.featureType,
      row.classification,
      record.mapRecordId ?? '',
      record.mapRecordType,
      record.name,
      record.relationship,
      record.latitude ?? '',
      record.longitude ?? '',
      record.validPoint,
      record.pointIssue || '',
      record.updatedAt || '',
    ].join('\t')) : [[row.islandSlug, row.officialName, row.featureType, row.classification, '', '', '', '', '', '', false, 'no_map_record', ''].join('\t')]),
  ].join('\n') + '\n',
)

console.log(JSON.stringify({targets: rows.length, classifications, report: `${outputBase}.json`}, null, 2))
