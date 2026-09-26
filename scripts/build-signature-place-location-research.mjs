#!/usr/bin/env node

/**
 * Build a review-only Sanity tranche for the 19 signature-place rows that
 * failed the Supabase location gate. This script writes local artifacts only.
 * Import remains a separate, explicit command.
 */

import fs from 'node:fs'

const locationReportPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-official-map-crosswalk.json'
const signatureSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-research-sanity-seed.ndjson'
const outputBase = process.argv[4] || '/private/tmp/baha-buddy-signature-place-location-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'
const mapSourceId = 'research-source-bmot-public-map-dataset'

for (const inputPath of [locationReportPath, signatureSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function reference(id, key) {
  return {_type: 'reference', _key: key, _ref: id}
}

function destinationId(slug) {
  if (slug === 'nassau-paradise-island') return 'dest-nassau'
  if (slug === 'the-exumas') return 'dest-exuma'
  if (slug === 'eleuthera-harbour-island') return 'dest-eleuthera'
  return `dest-${slug}`
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

function rowKey(row) {
  return `${row.islandSlug}::${row.officialName}`
}

function gap(slug, topic, priority, title, action, status = 'open') {
  return {
    _type: 'researchGap',
    _key: `gap-${keyPart(slug)}-${keyPart(topic)}-${keyPart(title)}`.slice(0, 96),
    topic,
    priority,
    title,
    action,
    status,
  }
}

const allSlugs = [
  'abacos',
  'acklins-crooked-island',
  'andros',
  'berry-islands',
  'bimini',
  'cat-island',
  'eleuthera-harbour-island',
  'the-exumas',
  'grand-bahama',
  'inagua',
  'long-island',
  'mayaguana',
  'nassau-paradise-island',
  'ragged-island',
  'rum-cay',
  'san-salvador',
]

const report = JSON.parse(fs.readFileSync(locationReportPath, 'utf8'))
if (report.rows?.length !== 19) throw new Error(`Expected 19 location rows, found ${report.rows?.length || 0}`)
const signatureDocs = readNdjson(signatureSeedPath)
const placeByRecordId = new Map(
  signatureDocs
    .filter((doc) => doc._type === 'placeEditorial' && doc._id.startsWith('drafts.'))
    .map((doc) => [doc.source?.recordId, doc]),
)
const catalogAuditBySlug = new Map(
  signatureDocs
    .filter((doc) => doc._type === 'islandResearchAudit')
    .map((doc) => [doc._id.split('-signature-place-catalog-')[1], doc]),
)

const sourceDocs = [
  {
    _id: mapSourceId,
    _type: 'researchSource',
    title: 'Bahamas Ministry of Tourism public map dataset',
    url: 'https://www.bahamas.com/map',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: allSlugs.map((slug) => reference(destinationId(slug), `destination-${slug}`)),
    topics: ['overview', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'The public map loads marker records from https://www.bahamas.com/ajax/functions.php with operation=getDestData and destination IDs 19–34. Marker names, points, record IDs, status flags, and source-reported update strings are retained as location evidence only. A visible marker is not proof of point accuracy, current operation, hours, safe access, accessibility, or traveler suitability. Tourism map pins without business IDs do not publish status or update metadata.',
  },
  {
    _id: 'research-source-operator-elbow-reef-lighthouse-visit',
    _type: 'researchSource',
    title: 'Elbow Reef Lighthouse Society — visit the lightstation',
    url: 'https://www.elbowreeflighthousesociety.com/visit-the-lightstation',
    publisher: 'Elbow Reef Lighthouse Society',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-abacos', 'destination-abacos')],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current responsible-operator page reporting Monday–Saturday 9:00 a.m.–5:00 p.m., Sunday closure, no tours, and a requested pre-visit form. Hours and visit conditions are operational and require recheck before traveler delivery.',
  },
  {
    _id: 'research-source-bnt-inagua-national-park',
    _type: 'researchSource',
    title: 'Inagua National Park',
    url: 'https://bnt.bs/explore/inagua/inagua-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [reference('dest-inagua', 'destination-inagua')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority page identifying the Great Inagua park, active warden, wilderness/limited-infrastructure context, and need to confirm travel dates with a BNT office. It does not validate the tourism map marker as a visitor entrance or route.',
  },
  {
    _id: 'research-source-bmot-hoffmans-cay-blue-hole',
    _type: 'researchSource',
    title: "Hoffman's Cay Blue Hole",
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/hoffmans-cay-blue-hole',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-berry-islands', 'destination-berry-islands')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity and approach context. The page describes southern Berry Islands and a horseshoe-shaped beach behind Australian pines, but the linked official map record has no coordinates. It is not safe-jumping guidance and does not establish transport, a landing point, rescue readiness, or accessibility.',
  },
  {
    _id: 'research-source-bmot-glass-window-bridge',
    _type: 'researchSource',
    title: 'The Glass Window Bridge',
    url: 'https://www.bahamas.com/natural-wonders/glass-window-bridge',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-eleuthera', 'destination-eleuthera-harbour-island')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page. The public tourism map contains two same-name points about 220 metres apart, so neither is promoted automatically. The page does not establish road condition, safe stopping, wave/weather limits, parking, guardrails, accessibility, or an approved visitor point.',
  },
  {
    _id: 'research-source-bmot-deans-blue-hole',
    _type: 'researchSource',
    title: "Dean's Blue Hole",
    url: 'https://www.bahamas.com/natural-wonders/deans-blue-hole',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-long-island', 'destination-long-island')],
    topics: ['nature', 'experiences', 'safety', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: "Current national-tourism identity page. The map dataset contains a related 'Dean's Blue Hole Beach' pin, not an exact blue-hole point. The page's promotional plunge language is not safety evidence and must not be converted into unsupervised diving guidance.",
  },
  {
    _id: 'research-source-bmot-booby-cay',
    _type: 'researchSource',
    title: 'Booby Cay',
    url: 'https://www.bahamas.com/natural-wonders/booby-cay',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-mayaguana', 'destination-mayaguana')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page placing Booby Cay east of mainland Mayaguana and identifying bird and iguana habitat. It does not establish a visitor landing, responsible vessel, permissions, safe access, or accessibility.',
  },
  {
    _id: 'research-source-bmot-watlings-blue-hole',
    _type: 'researchSource',
    title: "Watling's Blue Hole",
    url: 'https://www.bahamas.com/natural-wonders/watlings-blue-hole',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-san-salvador', 'destination-san-salvador')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    status: 'active',
    notes: "Current national-tourism identity page placing Watling's Blue Hole in southwestern San Salvador. Neither the page nor the official tourism map dataset supplies an exact point, approach, safe-swimming assessment, facilities, accessibility, or emergency context.",
  },
]

const sourceIdsByPlace = new Map([
  ['abacos::Elbow Reef Lighthouse', [mapSourceId, 'research-source-operator-elbow-reef-lighthouse-visit', 'research-source-bmot-abacos']],
  ['abacos::Man-O-War Cay', [mapSourceId, 'research-source-bmot-abacos']],
  ['acklins-crooked-island::The Bight of Acklins', [mapSourceId, 'research-source-bmot-acklins-crooked-island']],
  ["berry-islands::Hoffman's Cay Blue Hole", [mapSourceId, 'research-source-bmot-hoffmans-cay-blue-hole']],
  ["berry-islands::Flo's Conch Bar", [mapSourceId, 'research-source-bmot-flos-conch-bar']],
  ['eleuthera-harbour-island::Glass Window Bridge', [mapSourceId, 'research-source-bmot-glass-window-bridge']],
  ['the-exumas::Big Major Cay', [mapSourceId, 'research-source-bmot-exuma-local-marine-transfer']],
  ['grand-bahama::Lucayan National Park', [mapSourceId, 'research-source-bnt-lucayan-national-park']],
  ['grand-bahama::Gold Rock Beach', [mapSourceId, 'research-source-bnt-lucayan-national-park']],
  ['inagua::Inagua National Park', [mapSourceId, 'research-source-bnt-inagua-national-park']],
  ['inagua::Little Inagua National Park', [mapSourceId, 'research-source-bnt-little-inagua']],
  ["long-island::Dean's Blue Hole", [mapSourceId, 'research-source-bmot-deans-blue-hole']],
  ['mayaguana::Booby Cay', [mapSourceId, 'research-source-bmot-booby-cay']],
  ['mayaguana::Horse Pond Beach', [mapSourceId, 'research-source-bmot-mayaguana']],
  ['nassau-paradise-island::National Art Gallery of The Bahamas', [mapSourceId, 'research-source-operator-nagb']],
  ['ragged-island::Hog Cay', [mapSourceId, 'research-source-bmot-ragged-island']],
  ['rum-cay::Conception Island National Park', [mapSourceId, 'research-source-bnt-conception-island']],
  ['san-salvador::Southern Great Lake National Park', [mapSourceId, 'research-source-bnt-southern-great-lake']],
  ["san-salvador::Watling's Blue Hole", [mapSourceId, 'research-source-bmot-watlings-blue-hole']],
])

const visitorSiteIdentities = new Set([
  'grand-bahama::Lucayan National Park',
  'inagua::Inagua National Park',
  'inagua::Little Inagua National Park',
  'mayaguana::Booby Cay',
  'rum-cay::Conception Island National Park',
  'san-salvador::Southern Great Lake National Park',
])

const operationStatusByPlace = new Map([
  ['abacos::Elbow Reef Lighthouse', 'current_responsible_operator'],
  ["berry-islands::Flo's Conch Bar", 'current_official_listing_only'],
  ['grand-bahama::Lucayan National Park', 'current_managing_authority'],
  ['grand-bahama::Gold Rock Beach', 'current_managing_authority'],
  ['inagua::Inagua National Park', 'current_managing_authority'],
  ['inagua::Little Inagua National Park', 'current_managing_authority'],
  ['nassau-paradise-island::National Art Gallery of The Bahamas', 'current_responsible_operator'],
  ['rum-cay::Conception Island National Park', 'current_managing_authority'],
  ['san-salvador::Southern Great Lake National Park', 'current_managing_authority'],
])

const currentAccessPlaces = new Set([
  'abacos::Elbow Reef Lighthouse',
  'grand-bahama::Lucayan National Park',
  'grand-bahama::Gold Rock Beach',
  'inagua::Inagua National Park',
  'inagua::Little Inagua National Park',
  'nassau-paradise-island::National Art Gallery of The Bahamas',
  'rum-cay::Conception Island National Park',
  'san-salvador::Southern Great Lake National Park',
])

function statusFor(row) {
  if (row.classification === 'official_map_point_candidate') {
    return rowKey(row) === 'nassau-paradise-island::National Art Gallery of The Bahamas'
      ? 'official_points_consistent'
      : 'official_point_candidate'
  }
  if (row.classification === 'official_map_conflict_or_duplicate') return 'official_point_conflict'
  if (row.classification === 'official_map_related_site_point_only') return 'official_related_site_point_only'
  if (row.classification === 'official_map_identity_without_point') return 'identity_without_point'
  if (row.classification === 'official_area_identity_no_point') return 'area_identity_no_point'
  return 'official_identity_source_no_point'
}

function relationshipFor(row, candidate) {
  if (candidate.relationship === 'related_visitor_site') {
    return row.officialName === 'Man-O-War Cay' ? 'related_site' : 'visitor_site'
  }
  if (visitorSiteIdentities.has(rowKey(row))) return 'visitor_site'
  return 'exact_feature'
}

function candidateNotes(row, candidate) {
  const update = candidate.updatedAt ? ` Source-reported update: ${candidate.updatedAt}; timezone not published.` : ' This map-pin record publishes no update date.'
  if (candidate.relationship === 'related_visitor_site') {
    return `${candidate.name} is an official related-site pin, not a canonical point for the whole ${row.officialName}. Keep the feature relationship explicit.${update}`
  }
  if (row.officialName.includes('National Park')) {
    return `The point is an official same-name park marker, but the source does not label it as an entrance, trailhead, dock, boundary centroid, or safe routing destination.${update}`
  }
  return `The point is an official same-name or source-backed identity marker. Exact entrance, landing, routing, access, and point precision still require editorial review.${update}`
}

function mapCandidates(row) {
  return row.candidates.filter((candidate) => candidate.validPoint).map((candidate, index) => ({
    _type: 'placeLocationCandidate',
    _key: `candidate-map-${candidate.mapRecordId || index + 1}`,
    label: `${candidate.name} — official tourism ${candidate.mapRecordType === 'tourism_business' ? 'business record' : 'map pin'}`,
    relationship: relationshipFor(row, candidate),
    location: {_type: 'geopoint', lat: candidate.latitude, lng: candidate.longitude},
    source: reference(mapSourceId, `source-map-${candidate.mapRecordId || index + 1}`),
    sourceRecordType: candidate.mapRecordType,
    sourceRecordId: candidate.mapRecordId == null ? undefined : String(candidate.mapRecordId),
    sourceName: candidate.name,
    sourceUpdatedAt: candidate.updatedAt || undefined,
    sourceUrl: candidate.sourceUrl || 'https://www.bahamas.com/map',
    confidence: row.classification === 'official_map_conflict_or_duplicate' || candidate.relationship === 'related_visitor_site' ? 'low' : 'medium',
    notes: candidateNotes(row, candidate),
  }))
}

function locationReview(row) {
  const key = rowKey(row)
  const reconciliationStatus = statusFor(row)
  const candidates = mapCandidates(row)
  if (key === 'nassau-paradise-island::National Art Gallery of The Bahamas') {
    candidates.push({
      _type: 'placeLocationCandidate',
      _key: 'candidate-operator-west-street-directions',
      label: 'NAGB West Street directions — responsible operator',
      relationship: 'operator_entrance',
      location: {_type: 'geopoint', lat: 25.075379, lng: -77.347343},
      source: reference('research-source-operator-nagb', 'source-operator-nagb-directions'),
      sourceRecordType: 'operator_directions',
      sourceRecordId: 'apple-maps-auid-17403193928772250741',
      sourceName: 'The National Art Gallery of The Bahamas — West Street entrance',
      sourceUrl: 'https://nagb.org.bs/admission/',
      confidence: 'high',
      notes: 'The current NAGB visitor page links this directions point and separately identifies West Street as the car entrance. It is about 37 metres from the tourism business-record point, so the two sources are consistent at venue scale but still await a canonical coordinate decision.',
    })
    for (const candidate of candidates) candidate.confidence = 'high'
  }

  const hasCanonicalCandidate = ['official_point_candidate', 'official_points_consistent'].includes(reconciliationStatus)
  const sourceIds = sourceIdsByPlace.get(key)
  if (!sourceIds) throw new Error(`Missing evidence-source mapping for ${key}`)
  const statusNotes = {
    official_point_candidate: 'One official same-name point is available, but it remains a pending coordinate candidate. No Supabase mutation or routing approval was made.',
    official_points_consistent: 'Two responsible official points agree at venue scale. An editor still must choose the canonical coordinate and confirm the intended entrance.',
    official_point_conflict: 'The tourism dataset contains two same-name points about 220 metres apart. Neither is selected automatically; road condition, safe stopping, and the intended visitor point remain unresolved.',
    official_related_site_point_only: `The map only locates ${candidates.map((candidate) => candidate.sourceName).join('; ')}. ${row.officialName} still lacks a defensible canonical feature point.`,
    identity_without_point: 'The tourism business identity is present and visible, but its official record has no coordinate. The responsible approach description is retained without inventing a point.',
    area_identity_no_point: 'This identity is a broad lagoon/atoll feature rather than a single place entrance. Model it as an area or route context; do not fabricate one canonical point.',
    official_identity_source_no_point: 'A current official identity source exists, but the tourism map dataset supplies no exact feature point. Relative location text is not converted into coordinates.',
  }

  return {
    _type: 'placeLocationReview',
    checkedAt,
    reconciliationStatus,
    candidates: candidates.length ? candidates : undefined,
    evidenceSources: sourceIds.map((sourceId, index) => reference(sourceId, `location-source-${index + 1}`)),
    locationConfidence: reconciliationStatus === 'official_points_consistent' ? 'high' : hasCanonicalCandidate ? 'medium' : 'low',
    operationEvidenceStatus: operationStatusByPlace.get(key) || (['official_point_candidate', 'official_points_consistent'].includes(reconciliationStatus) && row.officialName.includes('National Park') ? 'current_managing_authority' : 'not_applicable_natural_feature'),
    accessEvidenceStatus: currentAccessPlaces.has(key) ? 'current_responsible_source' : reconciliationStatus === 'official_point_conflict' ? 'unresolved' : 'partial_official_context',
    reviewDecision: hasCanonicalCandidate || reconciliationStatus === 'official_point_conflict' || reconciliationStatus === 'official_related_site_point_only' ? 'pending' : 'not_applicable',
    notes: `${statusNotes[reconciliationStatus]} Current Supabase point: ${row.currentLatitude ?? 'missing'}, ${row.currentLongitude ?? 'missing'}. A map marker, visible-status flag, current authority page, or venue hours does not by itself establish safe access, accessibility, live operation, or traveler suitability. Keep active=false and delivery channels empty until the canonical Supabase record and publication gates are approved.`,
  }
}

const placeDraftDocs = report.rows.map((row) => {
  const base = placeByRecordId.get(row.supabasePlaceId)
  if (!base) throw new Error(`Missing signature-place draft for ${row.supabasePlaceId} / ${row.officialName}`)
  return {
    ...base,
    active: false,
    channels: [],
    catalogLocationReview: locationReview(row),
    source: {
      ...base.source,
      notes: `${base.source?.notes || ''} Official location-evidence tranche added ${checkedAt}; every coordinate remains a review-only candidate and Supabase was not changed.`.trim(),
    },
    reviewedAt: checkedAt,
  }
})

const factDocs = [
  {
    slug: 'abacos', key: 'elbow-reef-lightstation-current-visit', title: 'Elbow Reef Lighthouse: current visit arrangement', topic: 'access',
    claim: 'The Elbow Reef Lighthouse Society currently identifies the lightstation as open Monday through Saturday from 9:00 a.m. to 5:00 p.m., closed Sunday, and welcoming visits without offering tours; it requests a form before a planned visit.',
    travelerGuidance: 'Recheck the operator page before travel. Treat the schedule and visit form as operational conditions, not a permanent guarantee.',
    sourceIds: ['research-source-operator-elbow-reef-lighthouse-visit'], nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high',
    editorNotes: 'The operator supports current visit context. The tourism marker is still only a pending coordinate candidate.',
  },
  {
    slug: 'the-exumas', key: 'big-major-cay-identity-access', title: 'Big Major Cay: Pig Beach identity and boat-only access', topic: 'access',
    claim: 'The national tourism authority identifies Big Major Cay as the cay sometimes called Pig Beach and says it is accessible only by boat from nearby Staniel Cay.',
    travelerGuidance: 'Confirm a licensed responsible marine operator, departure and landing points, animal-interaction rules, weather limits, accessibility, and emergency arrangements before recommending a trip.',
    sourceIds: ['research-source-bmot-exuma-local-marine-transfer'], nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high',
    editorNotes: "The official map pin is named 'Pig Beach - Big Major Cay'; it is retained as a visitor-site point, not a whole-cay canonical coordinate.",
  },
  {
    slug: 'inagua', key: 'inagua-national-park-current-authority', title: 'Inagua National Park: current authority and visit boundary', topic: 'nature',
    claim: 'The Bahamas National Trust currently identifies Inagua National Park on Great Inagua as a wilderness park with limited infrastructure and an active warden, and says travel dates can be confirmed with its New Providence or Inagua office.',
    travelerGuidance: 'Confirm dates, transport, approach, guide or warden arrangements, weather, supplies, accessibility, and emergency readiness before a visit.',
    sourceIds: ['research-source-bnt-inagua-national-park'], nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high',
    editorNotes: 'The BNT page supports responsible-authority context, not the tourism marker as an approved entrance or route.',
  },
  {
    slug: 'berry-islands', key: 'hoffmans-cay-blue-hole-approach', title: "Hoffman's Cay Blue Hole: identity and approach landmark", topic: 'access',
    claim: "The national tourism authority places Hoffman's Cay Blue Hole in the southern Berry Islands and describes access from a horseshoe-shaped beach behind a patch of Australian pine trees at the shoreline.",
    travelerGuidance: 'This is an approach landmark, not a coordinate, safe-jumping instruction, or transport plan. Confirm a responsible vessel, landing, guide, conditions, emergency readiness, and accessibility.',
    sourceIds: ['research-source-bmot-hoffmans-cay-blue-hole'], nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'medium',
    editorNotes: 'The official tourism record has no coordinates. Do not infer a point from the prose.',
  },
  {
    slug: 'long-island', key: 'deans-blue-hole-identity-location-boundary', title: "Dean's Blue Hole: official identity with beach-pin boundary", topic: 'nature',
    claim: "The national tourism authority maintains a current Dean's Blue Hole page on Long Island, while its map dataset locates a related 'Dean's Blue Hole Beach' rather than publishing an exact blue-hole point.",
    travelerGuidance: "Treat the beach pin as related location evidence only. Do not turn promotional plunge language into swimming or freediving safety advice; verify access, supervision, conditions, depth hazards, and emergency readiness.",
    sourceIds: ['research-source-bmot-deans-blue-hole', mapSourceId], nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'medium',
    editorNotes: 'The source set supports identity and a related beach point, not a canonical blue-hole coordinate or safe-use claim.',
  },
  {
    slug: 'mayaguana', key: 'horse-pond-beach-relative-location', title: 'Horse Pond Beach: official relative-location baseline', topic: 'nature',
    claim: "The national tourism authority identifies Horse Pond Beach on Mayaguana and describes it as about 10 miles east of Abraham's Bay, known locally for land-crab hunting among limestone rocks.",
    travelerGuidance: 'The relative description is not an exact coordinate or road/access guarantee. Confirm the current approach, local guidance, conditions, accessibility, and emergency readiness.',
    sourceIds: ['research-source-bmot-mayaguana'], nextReviewAt: nextQuarterlyReviewAt, volatility: 'seasonal', confidence: 'medium',
    editorNotes: 'No exact official tourism map point was found. Do not geocode the prose automatically.',
  },
  {
    slug: 'mayaguana', key: 'booby-cay-identity-habitat', title: 'Booby Cay: identity and habitat baseline', topic: 'nature',
    claim: 'The national tourism authority places Booby Cay east of mainland Mayaguana and identifies it as habitat for brown boobies and small endemic rock iguanas.',
    travelerGuidance: 'Confirm a responsible vessel, landing permission, wildlife protections, conditions, safe access, accessibility, and emergency readiness before recommending a visit.',
    sourceIds: ['research-source-bmot-booby-cay'], nextReviewAt: nextQuarterlyReviewAt, volatility: 'seasonal', confidence: 'high',
    editorNotes: 'The tourism map point remains a pending feature marker, not a verified landing or visitor entrance.',
  },
  {
    slug: 'san-salvador', key: 'watlings-blue-hole-relative-location', title: "Watling's Blue Hole: official relative-location baseline", topic: 'nature',
    claim: "The national tourism authority identifies Watling's Blue Hole in southwestern San Salvador and describes it as an inland blue-hole feature within the island's karst landscape.",
    travelerGuidance: 'The relative description is not an exact point, safe-swimming assessment, or access plan. Confirm approach, conditions, local guidance, accessibility, and emergency readiness.',
    sourceIds: ['research-source-bmot-watlings-blue-hole'], nextReviewAt: nextQuarterlyReviewAt, volatility: 'seasonal', confidence: 'medium',
    editorNotes: 'No exact official tourism map point was found. Keep the identity separate from Watlings Castle/Sandy Point Estate.',
  },
].map((fact) => ({
  _id: `drafts.island-fact-signature-location-${keyPart(fact.key)}-${fact.slug}`,
  _type: 'islandFact',
  title: fact.title,
  destination: reference(destinationId(fact.slug), `destination-${fact.slug}`),
  topic: fact.topic,
  claim: fact.claim,
  travelerGuidance: fact.travelerGuidance,
  sources: fact.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
  checkedAt,
  nextReviewAt: fact.nextReviewAt,
  volatility: fact.volatility,
  confidence: fact.confidence,
  verificationStatus: 'source_verified',
  editorNotes: `${fact.editorNotes} Delivery channels intentionally left empty pending editorial approval.`,
  channels: [],
}))

const rowsByIsland = new Map()
for (const row of report.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const catalogAudit = catalogAuditBySlug.get(slug)
  if (!catalogAudit) throw new Error(`Missing signature-place catalog audit for ${slug}`)
  const statuses = rows.map(statusFor)
  const count = (status) => statuses.filter((value) => value === status).length
  const islandName = rows[0].islandName
  const sourceIds = [...new Set(rows.flatMap((row) => sourceIdsByPlace.get(rowKey(row))))]
  const coverage = catalogAudit.coverage.map((item) => item.topic === 'access'
    ? {...item, finding: `${rows.length} location-blocked signature-place ${rows.length === 1 ? 'row was' : 'rows were'} checked against current responsible sources and the national-tourism map: ${count('official_point_candidate')} unique official point, ${count('official_points_consistent')} consistent multi-source point set, ${count('official_point_conflict')} coordinate conflict, ${count('official_related_site_point_only')} related-site-only, ${count('identity_without_point')} official identity without a point, ${count('area_identity_no_point')} area identity, and ${count('official_identity_source_no_point')} official identity source without a map point. No point was approved or written to Supabase.`}
    : item)
  const gaps = [
    gap(slug, 'places', 'p0', 'Signature-place location evidence crosswalk completed', `${rows.length} location-blocked catalog ${rows.length === 1 ? 'row was' : 'rows were'} checked against the official tourism map and responsible source context without mutating Supabase.`, 'resolved'),
  ]
  const canonicalCandidates = count('official_point_candidate') + count('official_points_consistent')
  if (canonicalCandidates) gaps.push(gap(slug, 'places', 'p0', `${canonicalCandidates} official signature-place coordinate ${canonicalCandidates === 1 ? 'candidate awaits' : 'candidates await'} adjudication`, `Review the source point, intended feature or entrance, precision, safe routing, and Supabase canonical record for: ${rows.filter((row) => ['official_point_candidate', 'official_points_consistent'].includes(statusFor(row))).map((row) => row.officialName).join('; ')}. Keep every overlay inactive and channel-free.`, 'researching'))
  if (count('official_point_conflict')) gaps.push(gap(slug, 'places', 'p0', 'Official signature-place coordinate conflict remains unresolved', `Do not choose between the two official points for ${rows.find((row) => statusFor(row) === 'official_point_conflict').officialName} until the responsible authority confirms the intended visitor point and safe approach.`, 'researching'))
  if (count('official_related_site_point_only')) gaps.push(gap(slug, 'places', 'p0', `${count('official_related_site_point_only')} signature-place ${count('official_related_site_point_only') === 1 ? 'identity has' : 'identities have'} only related-site point evidence`, `Do not promote beach, marina, museum, or other subfeature pins to a whole-feature coordinate for: ${rows.filter((row) => statusFor(row) === 'official_related_site_point_only').map((row) => row.officialName).join('; ')}.`, 'researching'))
  const noPointCount = count('identity_without_point') + count('area_identity_no_point') + count('official_identity_source_no_point')
  if (noPointCount) gaps.push(gap(slug, 'places', 'p0', `${noPointCount} signature-place ${noPointCount === 1 ? 'identity still lacks' : 'identities still lack'} an exact point`, `Retain identity and relative-location evidence without inventing coordinates for: ${rows.filter((row) => ['identity_without_point', 'area_identity_no_point', 'official_identity_source_no_point'].includes(statusFor(row))).map((row) => row.officialName).join('; ')}. Model broad geographic areas appropriately.`, 'open'))
  gaps.push(gap(slug, 'access', 'p1', 'Signature-place current access, safety, and accessibility remain incomplete', 'Before traveler delivery, confirm the responsible operator or authority, current approach or entrance, closures, hours where applicable, fees or reservations, transport, weather and marine limits, safety, emergency readiness, and accessibility. Do not treat map visibility as operation evidence.', 'open'))

  return {
    _id: `drafts.island-research-audit-${checkedAt}-signature-place-location-evidence-${slug}`,
    _type: 'islandResearchAudit',
    title: `${islandName} signature-place location evidence — ${checkedAt}`,
    destination: reference(destinationId(slug), `destination-${slug}`),
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: catalogAudit.overallScore,
    coverage,
    gaps,
    sources: sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: 'The 19 official signature-place matches that failed the Supabase location gate were compared with all 16 destination payloads from the Bahamas Ministry of Tourism public map and current responsible operator, managing-authority, or national-tourism pages. Exact/source-backed identity markers, related visitor-site pins, broad geographic areas, conflicts, and source identities without coordinates are kept distinct. A map marker is evidence, not an approved coordinate, operation signal, entrance, route, safe-access promise, accessibility assessment, or traveler recommendation. No Supabase row was changed; every overlay remains a Sanity draft with active=false and no delivery channels.',
  }
})

if (placeDraftDocs.length !== 19) throw new Error(`Expected 19 place drafts, found ${placeDraftDocs.length}`)
if (placeDraftDocs.some((doc) => doc.active !== false || (doc.channels || []).length)) throw new Error('Location place drafts must remain inactive and channel-free')
if (placeDraftDocs.some((doc) => doc.catalogLocationReview?.reviewDecision === 'accepted')) throw new Error('Build must not accept any coordinate candidate')

const seedDocs = [...sourceDocs, ...factDocs, ...auditDocs, ...placeDraftDocs]
const seedPath = `${outputBase}-sanity-seed.ndjson`
fs.writeFileSync(seedPath, seedDocs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')

const summary = {
  generatedAt: new Date().toISOString(),
  checkedAt,
  targets: report.rows.length,
  classifications: report.classifications,
  affectedIslands: auditDocs.length,
  sourceDocs: sourceDocs.length,
  factDrafts: factDocs.length,
  auditDrafts: auditDocs.length,
  placeReviewDrafts: placeDraftDocs.length,
  canonicalPointCandidateDrafts: placeDraftDocs.filter((doc) => ['official_point_candidate', 'official_points_consistent'].includes(doc.catalogLocationReview.reconciliationStatus)).length,
  conflictDrafts: placeDraftDocs.filter((doc) => doc.catalogLocationReview.reconciliationStatus === 'official_point_conflict').length,
  relatedSiteOnlyDrafts: placeDraftDocs.filter((doc) => doc.catalogLocationReview.reconciliationStatus === 'official_related_site_point_only').length,
  noCanonicalPointDrafts: placeDraftDocs.filter((doc) => ['identity_without_point', 'area_identity_no_point', 'official_identity_source_no_point'].includes(doc.catalogLocationReview.reconciliationStatus)).length,
  activeDrafts: placeDraftDocs.filter((doc) => doc.active === true).length,
  draftsWithChannels: placeDraftDocs.filter((doc) => (doc.channels || []).length).length,
  acceptedCoordinateDecisions: placeDraftDocs.filter((doc) => doc.catalogLocationReview.reviewDecision === 'accepted').length,
  seedDocs: seedDocs.length,
  seedPath,
}
fs.writeFileSync(`${outputBase}.json`, JSON.stringify({summary, rows: report.rows}, null, 2) + '\n')

const table = report.rows.map((row) => {
  const review = placeDraftDocs.find((doc) => doc.source?.recordId === row.supabasePlaceId)?.catalogLocationReview
  const candidateSummary = (review?.candidates || []).map((candidate) => `${candidate.sourceName}: ${candidate.location.lat}, ${candidate.location.lng} (${candidate.relationship})`).join('<br>') || 'No official point candidate'
  return `| ${row.islandName} | ${row.officialName} | ${review.reconciliationStatus} | ${candidateSummary} | ${review.operationEvidenceStatus} | ${review.reviewDecision} |`
}).join('\n')
const markdown = `# All-Island Signature-Place Location Evidence\n\n**Snapshot:** ${checkedAt}  \n**Boundary:** review-only; no Supabase mutation; no traveler delivery\n\n## Outcome\n\nThe 19 official signature-place matches that failed the Supabase location gate now have explicit location-evidence records. Ten overlays have a same-identity official point candidate (including NAGB's mutually consistent tourism and operator points), one has a two-point conflict, four have related visitor-site points only, and four still have no defensible canonical point. No coordinate was accepted, no place was activated, and no delivery channel was assigned.\n\n## Crosswalk\n\n| Island group | Official identity | Reconciliation | Candidate evidence | Operation evidence | Decision |\n|---|---|---|---|---|---|\n${table}\n\n## Guardrails\n\n- Official tourism map markers are evidence, not automatically trusted canonical coordinates.\n- A beach, marina, museum, entrance, or visitor-site point is not silently promoted to a whole cay, lagoon, park, lake, or blue hole.\n- The two Glass Window Bridge points remain an unresolved conflict.\n- Map status and recent update metadata do not prove current operation, safe access, accessibility, or traveler suitability.\n- Every place overlay remains a draft with active=false, no channels, and a pending or not-applicable coordinate decision.\n`
fs.writeFileSync(`${outputBase}.md`, markdown)

console.log(JSON.stringify(summary, null, 2))
