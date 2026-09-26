#!/usr/bin/env node

/**
 * Build draft-only traveler-readiness facts, audits, and candidate overlays for
 * the 19 missing signature-place point candidates. Import is a separate step.
 */

import fs from 'node:fs'

const readinessPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-traveler-readiness.json'
const absentSeedPath = process.argv[3] || '/private/tmp/baha-buddy-absent-signature-place-research-sanity-seed.ndjson'
const baselineSeedPath = process.argv[4] || '/private/tmp/baha-buddy-island-research-baseline-sanity-seed.ndjson'
const locationSeedPath = process.argv[5] || '/private/tmp/baha-buddy-signature-place-location-research-sanity-seed.ndjson'
const adjudicationSeedPath = process.argv[6] || '/private/tmp/baha-buddy-signature-place-source-adjudication-research-sanity-seed.ndjson'
const outputBase = process.argv[7] || '/private/tmp/baha-buddy-signature-place-traveler-readiness-research'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'

for (const inputPath of [readinessPath, absentSeedPath, baselineSeedPath, locationSeedPath, adjudicationSeedPath]) {
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
if (readiness.rows?.length !== 19) throw new Error(`Expected 19 readiness rows, found ${readiness.rows?.length || 0}`)

const absentDocs = readNdjson(absentSeedPath)
const baselineDocs = readNdjson(baselineSeedPath)
const locationDocs = readNdjson(locationSeedPath)
const adjudicationDocs = readNdjson(adjudicationSeedPath)
const existingDocs = [...baselineDocs, ...absentDocs, ...locationDocs, ...adjudicationDocs]
const existingSourceById = new Map(existingDocs.filter((doc) => doc._type === 'researchSource').map((doc) => [doc._id, doc]))
const candidateById = new Map(absentDocs.filter((doc) => doc._type === 'canonicalPlaceCandidate').map((doc) => [doc._id, doc]))
const candidateAuditBySlug = new Map(
  absentDocs
    .filter((doc) => doc._type === 'islandResearchAudit')
    .map((doc) => [doc._id.split('-signature-place-canonical-candidates-')[1], doc]),
)

const sourceDocs = [
  {
    _id: 'research-source-bmot-long-cay-access',
    _type: 'researchSource',
    title: 'Long Cay — identity and local-ferry context',
    url: 'https://www.bahamas.com/en/plan-your-trip/things-to-do/long-cay',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-acklins-crooked-island', 'destination-acklins-crooked-island')],
    topics: ['overview', 'access', 'culture'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying Long Cay, Albert Town, local heritage, and a claimed daily ferry connection. No accountable vessel, operator page, timetable, dock, passenger terms, accessibility, or disruption fallback is supplied, so the service claim remains a 30-day lead.',
  },
  {
    _id: 'research-source-operator-chub-cay-current',
    _type: 'researchSource',
    title: 'Chub Cay Resort & Marina — current access boundary',
    url: 'https://chubcay.com/',
    publisher: 'Chub Cay Resort & Marina',
    sourceClass: 'operator', authorityLevel: 'primary',
    destinations: [reference('dest-berry-islands', 'destination-berry-islands')],
    topics: ['access', 'stays', 'experiences'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current responsible operator page saying the resort community has transitioned to members-only. It states that non-members may clear customs and obtain fuel from 7 a.m. to 7 p.m. and must radio before entering. These rules apply to the operator property, not automatically to the whole cay.',
  },
  {
    _id: 'research-source-bmot-sugar-beach',
    _type: 'researchSource',
    title: 'Sugar Beach — Berry Islands',
    url: 'https://www.bahamas.com/natural-wonders/sugar-beach',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-berry-islands', 'destination-berry-islands')],
    topics: ['nature', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page describing multiple coves, resort ruins, a trail through woods, and a careful rock climb, with a local tourism contact. It does not establish land rights, entrance, trail condition, current swimming conditions, accessibility, or emergency readiness.',
  },
  {
    _id: 'research-source-bmot-mount-alvernia',
    _type: 'researchSource',
    title: 'The Hermitage on Mt. Alvernia',
    url: 'https://www.bahamas.com/natural-wonders/mt-alvernia',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-cat-island', 'destination-cat-island')],
    topics: ['culture', 'access', 'safety', 'accessibility'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official identity and history page. It describes the approach as a stone staircase on a steep rocky incline but publishes no current manager, hours, permission, path or structure condition, handrail information, or accessible alternative.',
  },
  {
    _id: 'research-source-bmot-thunderball-grotto',
    _type: 'researchSource',
    title: 'Thunderball Grotto — tide-dependent access context',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/thunderball-grotto',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-exuma', 'destination-the-exumas')],
    topics: ['nature', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page placing the grotto west of Staniel Cay and advising ebb/low/slack-tide entry, while saying diving equipment is needed at high tide. It does not supply a live tide decision, licensed operator, vessel, skill assessment, current cave condition, or emergency plan.',
  },
  {
    _id: 'research-source-bmot-great-inagua-lighthouse',
    _type: 'researchSource',
    title: 'Great Inagua Lighthouse',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/great-inagua-lighthouse',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-inagua', 'destination-inagua')],
    topics: ['culture', 'access', 'safety', 'accessibility'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifying the automated lighthouse at Mortimers Hill, publishing contact details, and promoting a climb. It does not identify the responsible lighthouse authority, current permission, stair/railing condition, supervision, restrictions, or accessibility.',
  },
  {
    _id: 'research-source-bmot-abrahams-bay-town-square',
    _type: 'researchSource',
    title: "Abraham's Bay Town Square — component-site context",
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/abrahams-bay-town-square',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-mayaguana', 'destination-mayaguana')],
    topics: ['overview', 'culture', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page describing one civic component within Abraham’s Bay and a nearby Local Government complex. It is not evidence that the community map pin is one attraction entrance, nor does it establish current public-service hours, transfer, accessibility, or emergency readiness.',
  },
  {
    _id: 'research-source-bmot-pirates-well-bimini-conflict',
    _type: 'researchSource',
    title: 'The Pirates Well — current Bimini page conflicting with Mayaguana record',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/the-pirates-well',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-mayaguana', 'destination-mayaguana'), reference('dest-bimini', 'destination-bimini')],
    topics: ['overview', 'culture', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current same-slug attraction page describes a well near South Bimini and links to Bimini Sands. This conflicts with the official Mayaguana island highlight and map business record 4422, which has Mayaguana destination metadata and Mayaguana coordinates. It is retained as conflict evidence, not as Mayaguana identity proof.',
  },
  {
    _id: 'research-source-bmot-hartford-cave',
    _type: 'researchSource',
    title: 'Hartford Cave — protected-site listing',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/hartford-cave',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [reference('dest-rum-cay', 'destination-rum-cay')],
    topics: ['culture', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official page identifies Hartford Cave as a protected historical site with Lucayan-Arawak material and lists the Rum Cay District Council contact. It does not establish permission, guide, exact entrance, condition, protection/disclosure rules, accessibility, or emergency readiness.',
  },
  {
    _id: 'research-source-operator-rum-cay-heritage-unavailable',
    _type: 'researchSource',
    title: 'Rum Cay heritage outbound site — unavailable',
    url: 'https://rum-cay-heritage.com/',
    publisher: 'Rum Cay heritage site (publisher unverified)',
    sourceClass: 'operator', authorityLevel: 'discovery_only',
    destinations: [reference('dest-rum-cay', 'destination-rum-cay')],
    topics: ['culture', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'unavailable',
    notes: 'The national-tourism Hartford Cave page labels this outbound domain as the official website, but HTTPS retrieval returned 502 when checked. No current owner, authority, access instruction, or visitor operation could be verified from it.',
  },
  {
    _id: 'research-source-opm-government-house-current-use',
    _type: 'researchSource',
    title: 'Government House — current official ceremonial use',
    url: 'https://opm.gov.bs/prime-minister-davis-announces-new-cabinet/',
    publisher: 'Office of the Prime Minister, Commonwealth of The Bahamas',
    sourceClass: 'government', authorityLevel: 'primary',
    destinations: [reference('dest-nassau', 'destination-nassau-paradise-island')],
    topics: ['culture', 'access'], checkedAt, nextReviewAt: nextQuarterlyReviewAt, status: 'active',
    notes: 'Current May 2026 government release confirming continuing official ceremonial use of Government House. It does not establish general public admission, visitor hours, security procedures, accessibility, or an entrance.',
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
  let locationReview = base.locationReview
  if (row.title === 'Pirates Well') {
    locationReview = {
      ...locationReview,
      locationConfidence: 'low',
      candidates: (locationReview.candidates || []).map((candidate) => ({
        ...candidate,
        confidence: 'low',
        notes: `${candidate.notes} The current same-slug attraction page describes South Bimini rather than this Mayaguana record; retain only as low-confidence conflict evidence.`.slice(0, 900),
      })),
      notes: `${locationReview.notes} A current official same-slug attraction page describes a different South Bimini well, so the Mayaguana point remains blocked pending authority correction.`.slice(0, 2200),
    }
  }
  return {
    ...base,
    identityEvidence: mergeReferences(base.identityEvidence, row.identitySourceIds, 'readiness-identity-source'),
    locationReview,
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
    reviewNotes: `${base.reviewNotes} Traveler-readiness review added ${checkedAt}; operation, access, safety, accessibility, copy, media rights, and delivery remain separate from point evidence.`.slice(0, 2200),
  }
})

const existingFactCandidateTitles = new Set([
  'SS Sapona Shipwreck',
  'Peterson Cay National Park',
  'Port Lucaya Marketplace',
  'Union Creek Reserve',
  'Government House',
  'Gerace Research Centre',
])
const factTopicByTitle = new Map([
  ['Long Cay', 'access'],
  ['Chub Cay', 'access'],
  ['Sugar Beach', 'safety'],
  ['Mount Alvernia and The Hermitage', 'safety'],
  ['Old Bight Beach', 'access'],
  ['Thunderball Grotto', 'safety'],
  ['Great Inagua Lighthouse', 'access'],
  ["Abraham's Bay", 'access'],
  ['Pirates Well', 'overview'],
  ['Duncan Town', 'access'],
  ['Port Nelson', 'access'],
  ['HMS Conqueror Shipwreck', 'safety'],
  ['Hartford Cave', 'culture'],
])
const highConfidenceFactTitles = new Set(['Chub Cay', 'Pirates Well'])

const factDocs = readiness.rows
  .filter((row) => !existingFactCandidateTitles.has(row.title))
  .map((row) => ({
    _id: `drafts.island-fact-signature-point-readiness-${keyPart(row.title)}-${row.islandSlug}`,
    _type: 'islandFact',
    title: `${row.title}: traveler-readiness boundary`,
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
    editorNotes: 'This draft records evidence boundaries and the next responsible check. It does not approve the point or traveler delivery.',
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
    gap(slug, 'places', 'p1', `Traveler-readiness source profile completed: ${row.title}`, row.evidence, 'resolved'),
    gap(slug, 'places', 'p0', `Traveler-readiness delivery gate remains blocked: ${row.title}`, row.unresolved, 'researching'),
  ])
  return {
    _id: `drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-${slug}`,
    _type: 'islandResearchAudit',
    title: `${base.title.split(' missing')[0]} signature-place traveler readiness — ${checkedAt}`,
    destination: base.destination,
    auditedAt: checkedAt,
    nextAuditAt: nextOperationalReviewAt,
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore: base.overallScore,
    coverage: base.coverage,
    gaps,
    sources: sources.map((sourceId, index) => reference(sourceId, `source-${index + 1}`)),
    methodologyNotes: 'All nineteen one-point missing-place candidates were evaluated across responsible-source ownership, operation, access, safety, accessibility, copy, media rights, and delivery. A point or official listing cannot pass another gate by implication. Current operator restrictions, transport corroboration failures, source conflicts, wilderness conditions, tide/terrain hazards, and unavailable authority sites are preserved. Every candidate remains blocked and researching; no coordinate, Supabase write, activation, channel, media reuse, or traveler delivery is approved.',
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
