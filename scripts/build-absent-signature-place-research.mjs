#!/usr/bin/env node

/**
 * Build review-only Sanity documents for official signature-place identities
 * that do not exist in Supabase. This writes local import artifacts only.
 */

import fs from 'node:fs'

const auditPath = process.argv[2] || '/private/tmp/baha-buddy-absent-signature-place-location-crosswalk.json'
const signatureSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-research-sanity-seed.ndjson'
const outputBase = process.argv[4] || '/private/tmp/baha-buddy-absent-signature-place-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'
const mapSourceId = 'research-source-bmot-public-map-dataset'

for (const inputPath of [auditPath, signatureSeedPath]) {
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

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function gap(slug, topic, priority, title, action, status = 'researching') {
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

const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
if (report.rows?.length !== 37) throw new Error(`Expected 37 absent signature-place rows, found ${report.rows?.length || 0}`)

const signatureDocs = readNdjson(signatureSeedPath)
const catalogAuditBySlug = new Map(
  signatureDocs
    .filter((doc) => doc._type === 'islandResearchAudit')
    .map((doc) => [doc._id.split('-signature-place-catalog-')[1], doc]),
)

const sourceDocs = [
  {
    _id: 'research-source-bnt-andros-west-side-national-park',
    _type: 'researchSource',
    title: 'West Side National Park',
    url: 'https://bnt.bs/explore/andros/west-side-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [reference('dest-andros', 'destination-andros')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority page describing a roughly 1.5-million-acre wilderness area with little infrastructure, no trails, no on-site guard, and boat-only access. It does not establish a single park entrance, route, operator, weather window, accessibility, or emergency plan.',
  },
  {
    _id: 'research-source-bnt-peterson-cay-national-park',
    _type: 'researchSource',
    title: 'Peterson Cay National Park',
    url: 'https://bnt.bs/explore/grand-bahama/peterson-cay-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [reference('dest-grand-bahama', 'destination-grand-bahama')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority page identifying the protected cay and surrounding marine habitat and labeling it wilderness with little infrastructure, limited trails, and no on-site guard. It does not validate the tourism-map point as a landing, mooring, safe route, or accessibility point.',
  },
  {
    _id: 'research-source-bnt-union-creek-reserve',
    _type: 'researchSource',
    title: 'Union Creek Reserve',
    url: 'https://bnt.bs/explore/inagua/union-creek-reserve/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [reference('dest-inagua', 'destination-inagua')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority page placing the tidal creek and sea-turtle research station on Great Inagua and labeling it wilderness with little infrastructure, limited trails, and no on-site guard. The page does not validate a public entrance, route, general admission, or accessibility.',
  },
  {
    _id: 'research-source-bmot-bimini-dolphin-house-profile',
    _type: 'researchSource',
    title: 'Bimini — Dolphin House Museum profile',
    url: 'https://www.bahamas.com/islands/bimini/history',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')],
    topics: ['culture', 'overview'],
    checkedAt,
    nextReviewAt: nextQuarterlyReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page describing the Dolphin House Museum as Ashley Saunders’ home in Alice Town. It does not provide an exact public-map point or establish current visitor hours, admission, reservations, accessibility, or operation.',
  },
  {
    _id: 'research-source-bmot-sapona-shipwreck',
    _type: 'researchSource',
    title: 'Sapona Shipwreck',
    url: 'https://www.bahamas.com/natural-wonders/sapona-shipwreck',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-bimini', 'destination-bimini')],
    topics: ['nature', 'experiences', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity and relative marine-location page for the Sapona off South Bimini. Promotional snorkeling, diving, or jumping language is not operation or safety evidence and must not become unsupervised traveler guidance.',
  },
  {
    _id: 'research-source-bmot-queens-staircase-natural-wonder',
    _type: 'researchSource',
    title: "Queen's Staircase",
    url: 'https://www.bahamas.com/natural-wonders/queens-staircase',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page for the historic staircase. The public tourism dataset has two same-name points about 290 metres apart, so neither is promoted automatically. Current hours, site management, route, accessibility, and conditions remain separate checks.',
  },
  {
    _id: 'research-source-bmot-government-house-nassau',
    _type: 'researchSource',
    title: 'Government House — Nassau',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/government-house',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current national-tourism identity page describing Government House as the Governor General’s official residence on Duke Street and Blue Hill Road. The listing does not establish general public access or permanent visitor hours.',
  },
  {
    _id: 'research-source-operator-port-lucaya-marketplace',
    _type: 'researchSource',
    title: 'Port Lucaya Marketplace',
    url: 'https://portlucaya.com/',
    publisher: 'Port Lucaya Marketplace',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-grand-bahama', 'destination-grand-bahama')],
    topics: ['experiences', 'food', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current responsible-site identity and facility overview. Its directory is operation context for the marketplace as a whole, not a guarantee that every named tenant, event, service, or hour is current.',
  },
  {
    _id: 'research-source-operator-gerace-research-centre',
    _type: 'researchSource',
    title: 'Gerace Research Centre — about and facilities',
    url: 'https://www.geraceresearchcentre.com/about.html',
    publisher: 'Gerace Research Centre',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [reference('dest-san-salvador', 'destination-san-salvador')],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current institution page describing the research and education centre and its facilities. Current forms and handbooks support ongoing group/research operations, but casual traveler access, tours, hours, accessibility, and availability cannot be inferred.',
  },
]

const extraSourceIdsByPlace = new Map([
  ['andros::West Side National Park', ['research-source-bnt-andros-west-side-national-park']],
  ['bimini::Dolphin House Museum', ['research-source-bmot-bimini-dolphin-house-profile']],
  ['bimini::SS Sapona Shipwreck', ['research-source-bmot-sapona-shipwreck']],
  ['grand-bahama::Peterson Cay National Park', ['research-source-bnt-peterson-cay-national-park']],
  ['grand-bahama::Port Lucaya Marketplace', ['research-source-operator-port-lucaya-marketplace']],
  ['inagua::Union Creek Reserve', ['research-source-bnt-union-creek-reserve']],
  ["nassau-paradise-island::Queen's Staircase", ['research-source-bmot-queens-staircase-natural-wonder']],
  ['nassau-paradise-island::Government House', ['research-source-bmot-government-house-nassau']],
  ['san-salvador::Gerace Research Centre', ['research-source-operator-gerace-research-centre']],
])

const operationStatusByPlace = new Map([
  ['andros::West Side National Park', 'current_managing_authority'],
  ['bimini::Dolphin House Museum', 'current_official_listing_only'],
  ['bimini::SS Sapona Shipwreck', 'current_official_listing_only'],
  ['grand-bahama::Peterson Cay National Park', 'current_managing_authority'],
  ['grand-bahama::Port Lucaya Marketplace', 'current_responsible_operator'],
  ['inagua::Union Creek Reserve', 'current_managing_authority'],
  ["nassau-paradise-island::Queen's Staircase", 'current_official_listing_only'],
  ['nassau-paradise-island::Government House', 'current_official_listing_only'],
  ['san-salvador::Gerace Research Centre', 'current_responsible_operator'],
])

const currentResponsibleAccessPlaces = new Set([
  'andros::West Side National Park',
  'grand-bahama::Peterson Cay National Park',
  'inagua::Union Creek Reserve',
])

const partialAccessPlaces = new Set([
  'bimini::Dolphin House Museum',
  'bimini::SS Sapona Shipwreck',
  'grand-bahama::Port Lucaya Marketplace',
  "nassau-paradise-island::Queen's Staircase",
  'nassau-paradise-island::Government House',
  'san-salvador::Gerace Research Centre',
])

const naturalFeatureTypes = new Set(['geographic_area', 'beach', 'natural_feature', 'shipwreck'])

const statusMap = {
  official_map_point_candidate: 'official_point_candidate',
  official_map_points_consistent: 'official_points_consistent',
  official_map_point_conflict: 'official_point_conflict',
  official_map_invalid_point: 'official_invalid_point',
  official_map_related_site_point_only: 'official_related_site_point_only',
  official_map_identity_without_point: 'identity_without_point',
  official_area_identity_no_point: 'area_identity_no_point',
  official_identity_source_no_point: 'official_identity_source_no_point',
}

function evidenceSourceIds(row) {
  return unique([
    ...(row.officialIdentitySourceIds || []),
    ...(row.evidenceRecords?.length ? [mapSourceId] : []),
    ...(extraSourceIdsByPlace.get(rowKey(row)) || []),
  ])
}

function candidateNotes(row, record) {
  const updateNote = record.updatedAt
    ? ` Source-reported update: ${record.updatedAt}; timezone not published.`
    : ' This map-pin record publishes no update date.'
  if (rowKey(row) === 'abacos::Hope Town' && record.name.trim() === 'Hope Town Beach') {
    return `This related beach pin is geographically inconsistent with the separate Hope Town Inn & Marina pin and cannot represent the settlement. Retain it as low-confidence conflict evidence only.${updateNote}`
  }
  if (record.relationship === 'related_site') {
    return `${record.name} is an official related-site marker, not an exact point for ${row.officialName}. It cannot be promoted to the canonical feature automatically.${updateNote}`
  }
  if (row.classification === 'official_map_point_conflict') {
    return `This is one of multiple same-name official points that disagree by up to ${row.maxIdentityPointDistanceMetres} metres. Neither point is selected automatically.${updateNote}`
  }
  if (row.classification === 'official_area_identity_no_point') {
    return `This marker represents a broad area or settlement identity and is not an entrance, dock, route, or traveler destination.${updateNote}`
  }
  if (row.featureType === 'protected_area') {
    return `The official same-name park or reserve marker is not labeled as an entrance, landing, mooring, boundary centroid, or safe route.${updateNote}`
  }
  if (row.featureType === 'community') {
    return `The official same-name settlement marker is a representative point candidate, not proof of a public building, dock, entrance, or safe route.${updateNote}`
  }
  if (row.featureType === 'shipwreck') {
    return `The official source-backed wreck point is not evidence of a mooring, safe approach, diving conditions, operator suitability, or legal access.${updateNote}`
  }
  return `The official same-name or source-backed marker is a location candidate only. Exact access, routing, operation, safety, and accessibility remain unresolved.${updateNote}`
}

function locationReview(row) {
  const reconciliationStatus = statusMap[row.classification]
  if (!reconciliationStatus) throw new Error(`Unsupported classification ${row.classification}`)
  const candidates = (row.validPointCandidates || []).map((record, index) => ({
    _type: 'placeLocationCandidate',
    _key: `candidate-map-${record.mapRecordId || index + 1}`,
    label: `${record.name.trim()} — official tourism ${record.mapRecordType === 'tourism_business' ? 'business record' : 'map pin'}`,
    relationship: record.relationship === 'related_site' ? 'related_site' : 'exact_feature',
    location: {_type: 'geopoint', lat: record.latitude, lng: record.longitude},
    source: reference(mapSourceId, `source-map-${record.mapRecordId || index + 1}`),
    sourceRecordType: record.mapRecordType,
    sourceRecordId: record.mapRecordId == null ? undefined : String(record.mapRecordId),
    sourceName: record.name.trim(),
    sourceUpdatedAt: record.updatedAt || undefined,
    sourceUrl: record.sourceUrl || 'https://www.bahamas.com/map',
    confidence: ['official_map_point_conflict', 'official_map_related_site_point_only', 'official_area_identity_no_point'].includes(row.classification) ? 'low' : 'medium',
    notes: candidateNotes(row, record),
  }))

  const hasReviewablePoint = ['official_point_candidate', 'official_points_consistent', 'official_point_conflict', 'official_related_site_point_only'].includes(reconciliationStatus)
  const invalidRecords = (row.evidenceRecords || []).filter((record) => record.pointIssue === 'invalid_coordinate')
  const missingRecords = (row.evidenceRecords || []).filter((record) => record.pointIssue === 'missing_coordinate')
  const sourceIds = evidenceSourceIds(row)
  const mapEvidenceNote = [
    invalidRecords.length ? `Invalid official-map coordinate retained: ${invalidRecords.map((record) => `${record.name.trim()} ${record.latitude}, ${record.longitude}`).join('; ')}.` : null,
    missingRecords.length ? `Official identity records without numeric points: ${missingRecords.map((record) => record.name.trim()).join('; ')}.` : null,
    row.maxIdentityPointDistanceMetres ? `Maximum same-identity point separation: ${row.maxIdentityPointDistanceMetres} metres.` : null,
  ].filter(Boolean).join(' ')

  const key = rowKey(row)
  const defaultOperationStatus = naturalFeatureTypes.has(row.featureType)
    ? 'not_applicable_natural_feature'
    : 'not_established'

  return {
    _type: 'placeLocationReview',
    checkedAt,
    reconciliationStatus,
    candidates: candidates.length ? candidates : undefined,
    evidenceSources: sourceIds.map((sourceId, index) => reference(sourceId, `location-source-${index + 1}`)),
    locationConfidence: ['official_point_candidate', 'official_points_consistent'].includes(reconciliationStatus) ? 'medium' : 'low',
    operationEvidenceStatus: operationStatusByPlace.get(key) || defaultOperationStatus,
    accessEvidenceStatus: currentResponsibleAccessPlaces.has(key)
      ? 'current_responsible_source'
      : partialAccessPlaces.has(key)
        ? 'partial_official_context'
        : 'unresolved',
    reviewDecision: hasReviewablePoint ? 'pending' : 'not_applicable',
    notes: `${row.identityBoundary} ${mapEvidenceNote} This review does not create a Supabase place, approve a point, activate content, establish public access, or authorize traveler delivery.`.replace(/\s+/g, ' ').trim(),
  }
}

const candidateDocs = report.rows.map((row) => ({
  _id: `drafts.canonical-place-candidate-${row.islandSlug}-${keyPart(row.officialName)}`,
  _type: 'canonicalPlaceCandidate',
  title: row.officialName,
  slug: {_type: 'slug', current: keyPart(row.officialName)},
  destination: reference(destinationId(row.islandSlug), `destination-${row.islandSlug}`),
  islandName: row.islandName,
  officialSourceName: row.officialName,
  featureType: row.featureType,
  categoryProposal: row.categoryProposal,
  identityEvidence: unique([
    ...(row.officialIdentitySourceIds || []),
    ...(extraSourceIdsByPlace.get(rowKey(row)) || []),
  ]).map((sourceId, index) => reference(sourceId, `identity-source-${index + 1}`)),
  identityBoundary: row.identityBoundary,
  locationReview: locationReview(row),
  rejectedSupabaseMatches: row.rejectedSupabaseCandidate ? [{
    _type: 'rejectedSupabaseMatch',
    _key: `rejected-${keyPart(row.rejectedSupabaseCandidate.recordId)}`,
    recordId: row.rejectedSupabaseCandidate.recordId,
    name: row.rejectedSupabaseCandidate.name,
    reason: row.rejectedSupabaseCandidate.reason,
  }] : undefined,
  canonicalCreationStatus: 'researching',
  reviewedAt: checkedAt,
  reviewNotes: `Official destination-signature identity is absent from all 360 reviewed Supabase place rows. Classification: ${row.classification}. A separate approved Supabase change would still need identity, duplicate, island/cay, category, coordinate or area model, current-operation, access, safety, accessibility, sourced copy, media-rights, and consumer-delivery review. This Sanity document has no activation or channel fields and is not queried by web or mobile.`,
}))

const factSpecs = [
  {
    slug: 'andros', key: 'west-side-national-park-access-boundary', title: 'West Side National Park: wilderness and access boundary', topic: 'access',
    claim: 'The Bahamas National Trust currently describes West Side National Park as a roughly 1.5-million-acre wilderness area with little infrastructure, no trails, no on-site guard, and access only by boat.',
    travelerGuidance: 'Do not model the park as one ordinary point of interest. Confirm a responsible licensed vessel, route and landing context, weather and tides, permissions, supplies, communications, accessibility, and emergency readiness before recommending access.',
    sourceIds: ['research-source-bnt-andros-west-side-national-park'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The managing authority supports the access limitation, not one canonical visitor coordinate.',
  },
  {
    slug: 'grand-bahama', key: 'peterson-cay-national-park-authority-boundary', title: 'Peterson Cay National Park: authority and visitor boundary', topic: 'nature',
    claim: 'The Bahamas National Trust identifies Peterson Cay National Park as a small cay with surrounding protected marine habitat and describes it as wilderness with little infrastructure, limited trails, and no on-site guard.',
    travelerGuidance: 'Treat the tourism marker as a pending park point, not a landing or mooring. Confirm BNT guidance, a responsible licensed vessel, conditions, protected-area rules, accessibility, and emergency readiness.',
    sourceIds: ['research-source-bnt-peterson-cay-national-park'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The park page establishes authority and low-infrastructure context; it does not approve the map pin for routing.',
  },
  {
    slug: 'inagua', key: 'union-creek-reserve-research-access-boundary', title: 'Union Creek Reserve: research and access boundary', topic: 'nature',
    claim: 'The Bahamas National Trust places Union Creek Reserve on Great Inagua and identifies it as an enclosed tidal creek and sea-turtle research station with wilderness conditions, little infrastructure, limited trails, and no on-site guard.',
    travelerGuidance: 'Do not infer general public admission from the research-station identity. Confirm BNT permission and arrangements, approach, guide or warden context, wildlife protections, accessibility, and emergency readiness.',
    sourceIds: ['research-source-bnt-union-creek-reserve'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The official tourism point remains a candidate marker, not a verified public entrance.',
  },
  {
    slug: 'bimini', key: 'dolphin-house-museum-alice-town-identity', title: 'Dolphin House Museum: Alice Town identity boundary', topic: 'culture',
    claim: 'The national tourism authority identifies Dolphin House Museum as Ashley Saunders’ home in Alice Town, built from shells, sea glass, and recovered materials as an evolving tribute to the ocean.',
    travelerGuidance: 'The source establishes identity and community, not current opening hours, admission, reservations, accessibility, or an exact coordinate. Confirm those details with a responsible current source before a visit.',
    sourceIds: ['research-source-bmot-bimini-dolphin-house-profile'], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'No exact public tourism-map point or responsible visitor-operation page was found in this tranche.',
  },
  {
    slug: 'bimini', key: 'sapona-shipwreck-relative-location-boundary', title: 'Sapona Shipwreck: identity and marine-location boundary', topic: 'experiences',
    claim: 'The national tourism authority identifies the Sapona shipwreck a few miles off Bennett’s Harbour in South Bimini, and its public map supplies one source-backed marine point under the shorter name Sapona Shipwreck.',
    travelerGuidance: 'The point does not establish a mooring, safe approach, diving or snorkeling conditions, jump safety, legal access, supervision, or operator suitability. Verify all marine and emergency conditions through responsible current sources.',
    sourceIds: ['research-source-bmot-sapona-shipwreck', mapSourceId], volatility: 'operational', confidence: 'medium', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Promotional activity language is not converted into safety guidance.',
  },
  {
    slug: 'grand-bahama', key: 'port-lucaya-marketplace-current-operator-context', title: 'Port Lucaya Marketplace: current operator context', topic: 'experiences',
    claim: 'The responsible Port Lucaya Marketplace website currently presents the waterside open-air marketplace as a shopping, dining, entertainment, services, and tour-operator facility on Grand Bahama’s Lucayan Strip.',
    travelerGuidance: 'Treat individual tenants, events, hours, services, and accessibility as operational details that require a fresh check. The tourism point remains a pending canonical coordinate candidate.',
    sourceIds: ['research-source-operator-port-lucaya-marketplace', mapSourceId], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Current marketplace-level operation does not guarantee each tenant or schedule.',
  },
  {
    slug: 'nassau-paradise-island', key: 'government-house-identity-access-boundary', title: 'Government House: identity and access boundary', topic: 'culture',
    claim: 'The national tourism authority identifies Government House on Mount Fitzwilliam as the official residence of the Governor General of The Bahamas and lists its Nassau location at Blue Hill Road and Duke Street.',
    travelerGuidance: 'Do not infer general public access or permanent visitor hours from the listing. Confirm any event, invitation, security, entrance, accessibility, and transport arrangements with the responsible organizer.',
    sourceIds: ['research-source-bmot-government-house-nassau'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'The tourism marker is a point candidate, while access remains event- and authority-dependent.',
  },
  {
    slug: 'san-salvador', key: 'gerace-research-centre-institutional-boundary', title: 'Gerace Research Centre: institutional access boundary', topic: 'culture',
    claim: 'The Gerace Research Centre currently identifies itself as a San Salvador research and education facility operating from the former United States naval base site.',
    travelerGuidance: 'Do not treat the centre as a walk-in attraction. Confirm program eligibility, group arrangements, availability, permissions, transport, accessibility, and visitor conditions directly with the institution.',
    sourceIds: ['research-source-operator-gerace-research-centre'], volatility: 'operational', confidence: 'high', nextReviewAt: nextOperationalReviewAt,
    editorNotes: 'Current institutional operation does not establish casual traveler access. The official map point remains pending canonical review.',
  },
]

const factDocs = factSpecs.map((fact) => ({
  _id: `drafts.island-fact-canonical-candidate-${keyPart(fact.key)}-${fact.slug}`,
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

function actionFor(row) {
  const actions = {
    official_map_point_candidate: `Review the official point candidate and create a Supabase record only after identity, island/cay, category, point purpose, duplicate, access, operation, safety, accessibility, copy, and media-rights gates pass.`,
    official_map_points_consistent: `Review the consistent official points, choose the intended canonical feature or entrance, and complete every Supabase creation and delivery gate.`,
    official_map_point_conflict: `Resolve the ${row.maxIdentityPointDistanceMetres}-metre official point conflict with a responsible authority or operator. Do not select either point automatically.`,
    official_map_invalid_point: `Replace the invalid official coordinate with responsible source evidence; do not repair the sign or geocode the name automatically.`,
    official_map_related_site_point_only: `Find an exact point or choose an area model for ${row.officialName}; the related ${row.validPointCandidates.map((candidate) => candidate.name.trim()).join('; ')} marker cannot become the canonical feature.`,
    official_map_identity_without_point: `Obtain a responsible exact point or area model; the official identity record has no usable coordinate.`,
    official_area_identity_no_point: `Choose an area, community, multi-site, or polygon model that preserves the identity boundary. Do not fabricate one POI entrance or use a related venue as the whole feature.`,
    official_identity_source_no_point: `Find responsible site-level location evidence and current access/operation context before proposing a canonical Supabase record.`,
  }
  return actions[row.classification]
}

const rowsByIsland = new Map()
for (const row of report.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const base = catalogAuditBySlug.get(slug)
  if (!base) throw new Error(`Missing catalog audit base for ${slug}`)
  const sourceIds = unique(rows.flatMap(evidenceSourceIds))
  return {
    _id: `drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-${slug}`,
    _type: 'islandResearchAudit',
    title: `${rows[0].islandName} missing canonical signature-place candidates — ${checkedAt}`,
    destination: base.destination,
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps: rows.map((row) => gap(
      slug,
      'places',
      'p0',
      `Canonical-place decision pending: ${row.officialName}`,
      `${actionFor(row)} Evidence classification: ${row.classification}.`,
    )),
    sources: sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: `${rows.length} official destination-signature ${rows.length === 1 ? 'identity was' : 'identities were'} confirmed absent from the complete 360-row Supabase place catalog. Exact official-map names, explicit source-backed aliases, and explicit related-feature names were reviewed inside the expected island group. Multiple exact points must agree within 150 metres; invalid, conflicting, related-site, community, area, and plural-site evidence remains unresolved. Candidate documents are Sanity drafts with no activation or channel fields. No Supabase record or coordinate was created or changed.`,
  }
})

const documents = [...sourceDocs, ...factDocs, ...auditDocs, ...candidateDocs]
const ids = new Set()
for (const document of documents) {
  if (ids.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  ids.add(document._id)
}

fs.writeFileSync(`${outputBase}-sanity-seed.ndjson`, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(`${outputBase}-manifest.json`, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts: {
    sources: sourceDocs.length,
    facts: factDocs.length,
    audits: auditDocs.length,
    canonicalPlaceCandidates: candidateDocs.length,
    total: documents.length,
  },
  classifications: report.classifications,
  guardrails: {
    allCandidateDocumentsAreDrafts: candidateDocs.every((document) => document._id.startsWith('drafts.')),
    allCandidateStatusesAreResearching: candidateDocs.every((document) => document.canonicalCreationStatus === 'researching'),
    candidateSchemaHasNoActivationOrChannels: candidateDocs.every((document) => document.active == null && document.channels == null),
    allFactsAreDrafts: factDocs.every((document) => document._id.startsWith('drafts.')),
    allFactsHaveNoChannels: factDocs.every((document) => document.channels.length === 0),
    noAcceptedCoordinateDecisions: candidateDocs.every((document) => document.locationReview.reviewDecision !== 'accepted'),
  },
}, null, 2)}\n`)

console.log(JSON.stringify({
  output: `${outputBase}-sanity-seed.ndjson`,
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, canonicalPlaceCandidates: candidateDocs.length, total: documents.length},
  classifications: report.classifications,
}, null, 2))
