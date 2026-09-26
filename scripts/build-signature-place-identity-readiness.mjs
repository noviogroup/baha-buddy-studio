#!/usr/bin/env node

/**
 * Build draft-only traveler-readiness facts, audits, and candidate overlays for
 * the 18 missing signature-place identities outside the one-point tranche.
 */

import fs from 'node:fs'

const readinessPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-identity-readiness.json'
const absentSeedPath = process.argv[3] || '/private/tmp/baha-buddy-absent-signature-place-research-sanity-seed.ndjson'
const baselineSeedPath = process.argv[4] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const locationSeedPath = process.argv[5] || '/private/tmp/baha-buddy-signature-place-location-research-sanity-seed.ndjson'
const adjudicationSeedPath = process.argv[6] || '/private/tmp/baha-buddy-signature-place-source-adjudication-research-sanity-seed.ndjson'
const pointReadinessSeedPath = process.argv[7] || '/private/tmp/baha-buddy-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const outputBase = process.argv[8] || '/private/tmp/baha-buddy-signature-place-identity-readiness-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'

for (const inputPath of [readinessPath, absentSeedPath, baselineSeedPath, locationSeedPath, adjudicationSeedPath, pointReadinessSeedPath]) {
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

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function mergeReferences(existing, sourceIds, prefix) {
  const refs = [...(existing || [])]
  const present = new Set(refs.map((item) => item._ref))
  for (const sourceId of sourceIds || []) {
    if (!present.has(sourceId)) {
      refs.push(reference(sourceId, `${prefix}-${keyPart(sourceId)}`.slice(0, 96)))
      present.add(sourceId)
    }
  }
  return refs
}

function gap(slug, topic, priority, title, action, status) {
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

const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'))
if (readiness.rows?.length !== 18) throw new Error(`Expected 18 readiness rows, found ${readiness.rows?.length || 0}`)

const absentDocs = readNdjson(absentSeedPath)
const baselineDocs = readNdjson(baselineSeedPath)
const locationDocs = readNdjson(locationSeedPath)
const adjudicationDocs = readNdjson(adjudicationSeedPath)
const pointReadinessDocs = readNdjson(pointReadinessSeedPath)
const existingDocs = [...baselineDocs, ...absentDocs, ...locationDocs, ...adjudicationDocs, ...pointReadinessDocs]
const existingSourceById = new Map(existingDocs.filter((doc) => doc._type === 'researchSource').map((doc) => [doc._id, doc]))

const candidateById = new Map(absentDocs.filter((doc) => doc._type === 'canonicalPlaceCandidate').map((doc) => [doc._id, doc]))
for (const documents of [adjudicationDocs, pointReadinessDocs]) {
  for (const document of documents.filter((doc) => doc._type === 'canonicalPlaceCandidate')) candidateById.set(document._id, document)
}

const candidateAuditBySlug = new Map(
  absentDocs
    .filter((doc) => doc._type === 'islandResearchAudit')
    .map((doc) => [doc._id.split('-signature-place-canonical-candidates-')[1], doc]),
)

const sourceDocs = [
  {
    _id: 'research-source-bmot-hope-town-current',
    _type: 'researchSource',
    title: 'Hope Town — settlement and town-centre access boundary',
    url: 'https://www.bahamas.com/natural-wonders/hope-town',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-abacos', 'destination-abacos')],
    topics: ['overview', 'culture', 'access', 'accessibility'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying Hope Town as Elbow Cay’s settlement. It says the town centre is car-free and traversed on foot or bicycle, with cars and golf carts permitted outside the centre. It does not define the vehicle boundary, accessible route, emergency transport, settlement geometry, or a canonical point.',
  },
  {
    _id: 'research-source-bmot-turtle-sound',
    _type: 'researchSource',
    title: 'Turtle Sound — waterway identity and administrator contact',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/turtle-sound',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-acklins-crooked-island', 'destination-acklins-crooked-island')],
    topics: ['overview', 'nature', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page describing a nine-mile mangrove-lined waterway running inland from French Wells Channel behind Moss Town and Seaview, with differing water depths, and listing the Administrator’s Office. It does not establish a launch, guide, vessel, tide/depth decision, safe route, accessibility, or valid geometry.',
  },
  {
    _id: 'research-source-laws-cat-island-port-howe-community',
    _type: 'researchSource',
    title: 'Port Howe — codified Cat Island town-area identity',
    url: 'https://laws.bahamas.gov.bs/cms/images/LEGISLATION/SUBORDINATE/2013/2013-0109/2013-0109_1.pdf',
    publisher: 'Government of The Bahamas — Laws of The Bahamas',
    sourceClass: 'government', authorityLevel: 'primary',
    destinations: [reference('dest-cat-island', 'destination-cat-island')],
    topics: ['overview', 'access'], checkedAt, nextReviewAt: nextQuarterlyReviewAt, status: 'active',
    notes: 'Current codified Local Government (Councillors) regulations placing Port Howe, Bailey Town, Baintown, and Zonicle Hill in Cat Island’s local-government structure. This establishes community/governance identity only, not a visitor entrance, current office contact, service hours, accessibility, or traveler operation.',
  },
  {
    _id: 'research-source-bmot-eleuthera-pineapple-fields-identity',
    _type: 'researchSource',
    title: 'Eleuthera pineapple fields — distributed farming identity',
    url: 'https://www.bahamas.com/experiences/ladydi-eleuthera',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-eleuthera', 'destination-eleuthera-harbour-island')],
    topics: ['overview', 'culture', 'experiences', 'access'], checkedAt, nextReviewAt: nextQuarterlyReviewAt, status: 'active',
    notes: 'Current official story about one Eleuthera pineapple farmer and the island’s agricultural identity. It is not evidence that all fields are one attraction, that this farm is open without appointment, or that the similarly named condo-hotel is the canonical feature. Participant, access, safety, accessibility, and media permissions remain separate.',
  },
  {
    _id: 'research-source-bmot-spanish-wells-community-access',
    _type: 'researchSource',
    title: 'Spanish Wells — community and ferry-access context',
    url: 'https://www.bahamas.com/the-islands/eleuthera-harbour-island/what-to-do',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-eleuthera', 'destination-eleuthera-harbour-island')],
    topics: ['overview', 'culture', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official island content identifying Spanish Wells as a town on St. George’s Cay reached by ferry from mainland Eleuthera. It does not name a current passenger operator, dock, timetable, disruption fallback, accessible transfer, community geometry, or one canonical entrance.',
  },
  {
    _id: 'research-source-bmot-cape-santa-maria-beach',
    _type: 'researchSource',
    title: 'Cape Santa Maria Beach — beach identity and resort contact',
    url: 'https://www.bahamas.com/natural-wonders/cape-santa-maria',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-long-island', 'destination-long-island')],
    topics: ['nature', 'access', 'safety', 'accessibility'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page describing a four-mile beach and publishing the adjacent resort contact. It does not establish public shoreline rights, public entrance/parking, exact beach geometry, current swimming conditions, amenities, accessibility, emergency route, or permission to reuse source media.',
  },
  {
    _id: 'research-source-operator-cape-santa-maria-current',
    _type: 'researchSource',
    title: 'Cape Santa Maria Resort — current property operation',
    url: 'https://www.capesantamaria.com/',
    publisher: 'Cape Santa Maria Resort',
    sourceClass: 'operator', authorityLevel: 'primary',
    destinations: [reference('dest-long-island', 'destination-long-island')],
    topics: ['stays', 'experiences', 'access', 'nature'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current responsible-property website with 2026 copyright, booking path, contact, accommodation, and activity-centre information. It proves resort operation on the beach, not ownership or public access rights for the entire four-mile shoreline, and publishes no feature-level beach accessibility statement.',
  },
  {
    _id: 'research-source-ammc-public-site-no-program-detail',
    _type: 'researchSource',
    title: 'AMMC Bahamas public website — no current site-program detail',
    url: 'https://ammcbahamas.com/',
    publisher: 'Antiquities, Monuments and Museum Corporation (site identity only)',
    sourceClass: 'government', authorityLevel: 'discovery_only',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'unavailable',
    notes: 'The current public website displays a “Launching Soon” page and no Fort Fincastle or Queen’s Staircase program, hours, entrance, accessibility, condition, or media guidance. It is retained only as evidence that site-specific responsible-operation detail was not available there; it does not prove management of either attraction.',
  },
]

const conflictingSourceIds = sourceDocs.filter((source) => {
  const existing = existingSourceById.get(source._id)
  return existing && existing.url !== source.url
}).map((source) => source._id)
if (conflictingSourceIds.length) throw new Error(`Source IDs collide with different existing URLs: ${conflictingSourceIds.join(', ')}`)

const allSourceIds = new Set([...existingSourceById.keys(), ...sourceDocs.map((source) => source._id)])
for (const row of readiness.rows) {
  const missing = row.sourceIds.filter((sourceId) => !allSourceIds.has(sourceId))
  if (missing.length) throw new Error(`Missing source IDs for ${row.candidateId}: ${missing.join(', ')}`)
}

const candidateDocs = readiness.rows.map((row) => {
  const base = candidateById.get(row.candidateId)
  if (!base) throw new Error(`Missing candidate: ${row.candidateId}`)
  if (base.travelerReadinessReview) throw new Error(`Candidate already has readiness review: ${row.candidateId}`)
  return {
    ...base,
    identityEvidence: mergeReferences(base.identityEvidence, row.identitySourceIds, 'identity-readiness-source'),
    travelerReadinessReview: {
      _type: 'placeTravelerReadinessReview',
      checkedAt: row.checkedAt,
      nextReviewAt: row.nextReviewAt,
      overallStatus: row.overallStatus,
      responsibleSourceStatus: row.responsibleSourceStatus,
      operationStatus: row.operationStatus,
      accessStatus: row.accessStatus,
      safetyStatus: row.safetyStatus,
      accessibilityStatus: row.accessibilityStatus,
      copyStatus: row.copyStatus,
      mediaStatus: row.mediaStatus,
      deliveryDecision: row.deliveryDecision,
      sources: row.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
      notes: `${row.evidence} ${row.unresolved}`,
    },
    reviewedAt: checkedAt,
    reviewNotes: `${base.reviewNotes} Identity-level traveler-readiness review added ${checkedAt}; area/point modeling, responsible ownership, operation, access, safety, accessibility, copy, media rights, and delivery remain separate gates.`.slice(0, 2200),
  }
})

const existingEvidenceFactTitles = new Set([
  'Ancient Lucayan Sites',
  'Dolphin House Museum',
  'Fountain of Youth',
  "Sir Sidney Poitier's Boyhood Home",
  'Twin Churches',
  "Queen's Staircase",
  'Fort Fincastle',
  'Pigeon Cay',
])
const factTopicByTitle = new Map([
  ['Hope Town', 'access'],
  ['Turtle Sound', 'nature'],
  ['West Side National Park', 'safety'],
  ['Port Howe', 'overview'],
  ['Pineapple Fields', 'culture'],
  ['Spanish Wells', 'access'],
  ['Cape Santa Maria Beach', 'access'],
  ['Columbus Point', 'culture'],
  ['Jumentos Cays', 'access'],
  ['Bonefish Bay Beach', 'access'],
])
const highConfidenceFactTitles = new Set(['West Side National Park', 'Port Howe', 'Cape Santa Maria Beach'])

const factDocs = readiness.rows
  .filter((row) => !existingEvidenceFactTitles.has(row.title))
  .map((row) => ({
    _id: `drafts.island-fact-signature-identity-readiness-${keyPart(row.title)}-${row.islandSlug}`,
    _type: 'islandFact',
    title: `${row.title}: identity-readiness boundary`,
    destination: reference(destinationId(row.islandSlug), `destination-${row.islandSlug}`),
    topic: factTopicByTitle.get(row.title),
    claim: row.evidence,
    travelerGuidance: row.unresolved,
    sources: row.sourceIds.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: highConfidenceFactTitles.has(row.title) ? 'high' : 'medium',
    verificationStatus: 'source_verified',
    editorNotes: 'This draft records identity and readiness evidence boundaries. It does not approve a point, area, Supabase record, or traveler delivery.',
    channels: [],
  }))

const rowsByIsland = new Map()
for (const row of readiness.rows) {
  const rows = rowsByIsland.get(row.islandSlug) || []
  rows.push(row)
  rowsByIsland.set(row.islandSlug, rows)
}

const auditDocs = [...rowsByIsland.entries()].map(([slug, rows]) => {
  const base = candidateAuditBySlug.get(slug)
  if (!base) throw new Error(`Missing candidate audit for ${slug}`)
  const sources = unique(rows.flatMap((row) => row.sourceIds))
  const gaps = rows.flatMap((row) => [
    gap(slug, 'places', 'p1', `Identity-readiness source profile completed: ${row.title}`, row.evidence, 'resolved'),
    gap(slug, 'places', 'p0', `Identity-readiness delivery gate remains blocked: ${row.title}`, row.unresolved, 'researching'),
  ])
  return {
    _id: `drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-${slug}`,
    _type: 'islandResearchAudit',
    title: `${base.title.split(' missing')[0]} signature-place identity readiness — ${checkedAt}`,
    destination: base.destination,
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: sources.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: 'All eighteen remaining missing signature-place identities were evaluated across geometry/model, responsible source, operation, access, safety, accessibility, copy, media rights, and delivery. Communities, waterways, parks, beaches, distributed cultural identities, historic complexes, and cay chains are not collapsed into one point. Related operators and component points remain distinct. Every candidate remains blocked and researching; no coordinate, area, Supabase write, activation, channel, media reuse, or traveler delivery is approved.',
  }
})

const documents = [...sourceDocs, ...factDocs, ...auditDocs, ...candidateDocs]
const documentIds = new Set()
for (const document of documents) {
  if (documentIds.has(document._id)) throw new Error(`Duplicate document ID: ${document._id}`)
  documentIds.add(document._id)
}

const seedPath = `${outputBase}-sanity-seed.ndjson`
const manifestPath = `${outputBase}-manifest.json`
fs.writeFileSync(seedPath, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)
fs.writeFileSync(manifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, total: documents.length},
  sourceProvenance: {conflictingExistingSourceIds: conflictingSourceIds},
  guardrails: {
    allCandidatesAreDrafts: candidateDocs.every((doc) => doc._id.startsWith('drafts.')),
    allCandidatesRemainResearching: candidateDocs.every((doc) => doc.canonicalCreationStatus === 'researching'),
    allFactsAreDraftsAndChannelFree: factDocs.every((doc) => doc._id.startsWith('drafts.') && doc.channels.length === 0),
    everyTravelerDeliveryDecisionIsBlocked: candidateDocs.every((doc) => doc.travelerReadinessReview.deliveryDecision === 'blocked'),
    noAcceptedCoordinateDecisions: candidateDocs.every((doc) => doc.locationReview.reviewDecision !== 'accepted'),
    noAccessibilityClaimedPublished: candidateDocs.every((doc) => doc.travelerReadinessReview.accessibilityStatus !== 'published'),
    noMediaRightsClaimedCleared: candidateDocs.every((doc) => doc.travelerReadinessReview.mediaStatus !== 'rights_cleared'),
    candidateDocsHaveNoActivationOrChannels: candidateDocs.every((doc) => doc.active == null && doc.channels == null),
  },
}, null, 2)}\n`)

console.log(JSON.stringify({
  output: seedPath,
  manifest: manifestPath,
  counts: {sources: sourceDocs.length, facts: factDocs.length, audits: auditDocs.length, candidates: candidateDocs.length, total: documents.length},
  sourceProvenance: {conflicts: conflictingSourceIds},
}, null, 2))
